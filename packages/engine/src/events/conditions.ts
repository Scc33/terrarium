/**
 * The news desk: which of the country's conditions get reported this quarter.
 *
 * The other half of the event system. `fileDispatch` answers "how is this
 * worded"; this answers "is there anything to write about". A pipeline step
 * raising a hard event knows a fact happened. Nothing knows that unemployment
 * has been high for two years — somebody has to look, and this is the looking.
 *
 * ## What a condition may read, and what it may print
 *
 * Conditions read TRUE state: the whole quarterly worksheet, the unfogged
 * institutional stocks, and a couple of live flows. That is deliberate and it
 * is safe for exactly one reason — **the output is a choice of authored
 * prose, never a number.** The desk may know the unemployment rate to twelve
 * decimal places; all it can do with that knowledge is decide whether to run
 * "Idle men gather at the factory gates". A dispatch that interpolated the
 * figure would be a free, ungated, un-lagged, un-revised instrument sitting
 * on the wire beside the ones the player had to fund (ADR-0003), and the fog
 * would be over. `tests/properties/events.test.ts` greps the catalogue for
 * digits so this cannot be lost by a well-meaning edit.
 *
 * ## Why the desk is rate-limited
 *
 * Naively, every true condition files. Measured over a century that is five
 * or six dispatches a quarter, most of them the same six, and the effect is
 * not a richer game — it is a wire nobody reads, which means the hard events
 * that only appear there (a banking crisis, a reform window opening) become
 * invisible too. So:
 *
 * - **a fact always files.** Hard events raised by pipeline steps, and the
 *   four census milestones here, are never budgeted away.
 * - **reports are budgeted and cooled.** At most `NEWS_REPORTS_PER_QTR`, each
 *   only at `NEWS_REPORT_P`, and never the same event inside
 *   `NEWS_COOLDOWN_Q`.
 * - **a big story crowds out small ones.** The budget counts what the quarter
 *   has already filed, so the quarter of a coup does not also carry three
 *   paragraphs about the bond auction.
 * - **colour fills a thin page.** If nothing else ran, an era-appropriate
 *   slice of the age runs instead — which is what stops a quiet decade
 *   reading as a broken ticker.
 */

import {
  NEWS_COLOUR_COOLDOWN_Q,
  NEWS_COLOUR_P,
  NEWS_COOLDOWN_GROWTH,
  NEWS_COOLDOWN_MAX_Q,
  NEWS_COOLDOWN_Q,
  NEWS_REPORT_P,
  NEWS_REPORTS_PER_QTR,
  NEWS_THIN_PAGE_AT,
} from '../constants'
import { rngFor } from '../rng/rng'
import type {
  InstitutionId,
  NewsItem,
  SectorId,
  StatRecord,
  TrueState,
} from '../state/schema'
import { fileDispatch } from './file'
import { eraAtTick, type PressEraId } from './eras'
import type { EventId } from './ids'

// ---------- what a rule gets to look at ----------

export interface EventContext {
  tick: number
  era: PressEraId
  /** this quarter's worksheet */
  now: StatRecord
  /** last quarter's, or null in the opening quarter */
  prev: StatRecord | null
  /** the country as it opened, for anything measured against its own 1946 */
  first: StatRecord
  /** the whole book, for trends. Indexed with `back()`, never by position. */
  record: readonly StatRecord[]
  /** the constitution, exactly. Legitimate to read: the fog is about the
   * economy, not about which liberties a government granted itself. */
  stocks: Record<InstitutionId, number>
  /** live flows the worksheet does not keep */
  satisfiedEnergy: number
  exchangeRate: number
}

/**
 * The worksheet `n` quarters ago, or the opening one if the run is younger
 * than that.
 *
 * Indexed BY TICK rather than by position, for the reason `ui/src/census.ts`
 * carries the same warning: the engine writes one record per quarter today,
 * so a positional `k − n` agrees exactly — right up until something filters
 * the record on the way here, after which every trend rule silently measures
 * a different span and prints a plausible wrong story.
 */
export function back(ctx: EventContext, n: number): StatRecord {
  const want = ctx.tick - n
  if (want <= ctx.first.tick) return ctx.first
  const guess = ctx.record[ctx.record.length - 1 - n]
  if (guess && guess.tick === want) return guess
  for (let i = ctx.record.length - 1; i >= 0; i--) {
    if (ctx.record[i].tick === want) return ctx.record[i]
  }
  return ctx.first
}

/** Median age off a five-year-band pyramid, linearly interpolated inside the
 * band the median falls in. */
export function medianAge(pyramid: readonly number[]): number {
  const total = pyramid.reduce((a, b) => a + b, 0)
  if (total <= 0) return 0
  let seen = 0
  for (let band = 0; band < pyramid.length; band++) {
    const next = seen + pyramid[band]
    if (next >= total / 2) {
      const within = pyramid[band] > 0 ? (total / 2 - seen) / pyramid[band] : 0
      return band * 5 + within * 5
    }
    seen = next
  }
  return (pyramid.length - 1) * 5
}

const annualInflation = (r: StatRecord) => r.inflationQ * 4
const debtToGdp = (r: StatRecord) => r.debt / Math.max(4 * r.nominalGdp, 1e-9)
const share = (r: StatRecord, sector: SectorId) => {
  const total = Object.values(r.industry).reduce((s, x) => s + x.valueAdded, 0)
  return total > 1e-9 ? r.industry[sector].valueAdded / total : 0
}
/** manufacturing, energy and transport together: what a reader means by
 * "industry", as against services and the land. */
const industrialShare = (r: StatRecord) =>
  share(r, 'manuf') + share(r, 'energy') + share(r, 'transport')
const employmentShare = (r: StatRecord, sector: 'agri' | 'manuf' | 'services') => {
  const total = Object.values(r.industry).reduce((s, x) => s + x.employment, 0)
  return total > 1e-9 ? r.industry[sector].employment / total : 0
}

// ---------- the rules ----------

/**
 * `report` is an ordinary reading of the country, budgeted and cooled.
 * `milestone` is a line crossed once in a century and always files.
 * `colour` is filler for a thin page, gated on the era rather than the state.
 */
export type RuleClass = 'report' | 'milestone' | 'colour'

export interface ConditionRule {
  event: EventId
  cls: RuleClass
  /** eras this may run in; every era if absent. Only colour uses it — a
   * condition that is true is true whatever decade it is. */
  eras?: readonly PressEraId[]
  /** how badly the desk wants it, when more are true than there is room for.
   * Ties break on catalogue order, so this is a nudge and not a ranking. */
  salience: number
  when(ctx: EventContext): boolean
}

export const CONDITION_RULES: readonly ConditionRule[] = [
  // ---------- the census: facts, always filed, once each ----------
  {
    event: 'population_doubles',
    cls: 'milestone',
    salience: 1,
    when: (c) => c.now.population >= 2 * c.first.population,
  },
  {
    event: 'urban_majority',
    cls: 'milestone',
    salience: 1,
    when: (c) => c.now.residence.urban > c.now.residence.rural,
  },
  {
    event: 'country_ages',
    cls: 'milestone',
    salience: 1,
    when: (c) => medianAge(c.now.pyramid) >= 38,
  },
  {
    event: 'births_fall_away',
    cls: 'milestone',
    salience: 1,
    when: (c) => c.now.birthRate < 13 && c.first.birthRate > 20,
  },
  {
    event: 'productivity_doubled',
    cls: 'milestone',
    salience: 1,
    when: (c) => c.now.labourProductivity >= 2 * c.first.labourProductivity,
  },
  {
    // Against the WHOLE industrial sector — manufacturing, energy and
    // transport together — not against manufacturing alone. Measured, every
    // curated country already produces more from services than from
    // manufacturing on its first morning, so the manufacturing comparison was
    // a milestone that could never be crossed and therefore never printed.
    // Against industry entire, services open one to five points behind and
    // pass it in roughly the top one per cent of quarters lived: rare, real,
    // and exactly the transformation the headline claims.
    event: 'services_overtake_industry',
    cls: 'milestone',
    salience: 1,
    when: (c) => share(c.now, 'services') > industrialShare(c.now),
  },
  {
    event: 'industry_overtakes_land',
    cls: 'milestone',
    salience: 1,
    when: (c) => share(c.now, 'manuf') > share(c.now, 'agri') + 0.05 && share(c.first, 'agri') >= share(c.first, 'manuf'),
  },
  {
    // A quarter of the workforce, from an opening of at least two fifths.
    // The first cut (a fifth, from three tenths) sat below the first
    // percentile of the measured distribution: true only for a country that
    // had already all but finished the transition, which is not when a paper
    // would have noticed it.
    event: 'land_no_longer_employs_the_country',
    cls: 'milestone',
    salience: 1,
    when: (c) => employmentShare(c.now, 'agri') < 0.25 && employmentShare(c.first, 'agri') >= 0.4,
  },
  {
    event: 'debt_retired',
    cls: 'milestone',
    salience: 1,
    when: (c) => c.now.debt <= 1e-6 && c.first.debt > 1e-3,
  },

  // ---------- the cost of living ----------
  // 22 %/yr. Measured across every policy the runner has, annual inflation
  // reaches 0.121 at the 99th percentile and 0.298 at the worst quarter
  // anybody had — so the 40 % this first shipped at was a dispatch that could
  // not be printed, and 22 % is the genuinely exceptional quarter it was
  // meant to name.
  { event: 'prices_runaway', cls: 'report', salience: 9, when: (c) => annualInflation(c.now) > 0.22 },
  { event: 'bread_queues', cls: 'report', salience: 8, when: (c) => c.now.satisfiedAgri < 0.93 },
  {
    event: 'prices_racing',
    cls: 'report',
    salience: 7,
    when: (c) => annualInflation(c.now) > 0.12 && annualInflation(c.now) <= 0.22,
  },
  {
    event: 'prices_falling',
    cls: 'report',
    salience: 6,
    when: (c) => annualInflation(c.now) < -0.02,
  },
  {
    event: 'poverty_widespread',
    cls: 'report',
    salience: 7,
    when: (c) => c.now.povertyRate > 0.35,
  },
  {
    event: 'poverty_receding',
    cls: 'report',
    salience: 4,
    when: (c) => c.now.povertyRate < 0.1 && back(c, 40).povertyRate - c.now.povertyRate > 0.08,
  },
  {
    event: 'households_saving_hard',
    cls: 'report',
    salience: 2,
    when: (c) => c.now.householdSavingRate > 0.16,
  },
  {
    event: 'households_spending_freely',
    cls: 'report',
    salience: 2,
    when: (c) => c.now.householdSavingRate < 0.01,
  },
  { event: 'confidence_low', cls: 'report', salience: 3, when: (c) => c.now.confConsumer < 0.35 },
  // Consumer confidence alone, so the copy speaks for households alone.
  // Business confidence moves on its own target and can diverge; the dispatch
  // used to claim firms agreed, which a pessimistic-firms quarter made false.
  { event: 'confidence_high', cls: 'report', salience: 2, when: (c) => c.now.confConsumer > 0.66 },
  {
    event: 'shops_quiet_and_full',
    cls: 'report',
    salience: 1,
    when: (c) =>
      annualInflation(c.now) < 0.03 &&
      annualInflation(c.now) > -0.005 &&
      c.now.unemployment < 0.08 &&
      c.now.utilization > 0.8,
  },

  // ---------- work ----------
  { event: 'jobless_generation', cls: 'report', salience: 9, when: (c) => c.now.unemployment > 0.2 },
  {
    event: 'factory_gates_idle',
    cls: 'report',
    salience: 7,
    when: (c) => c.now.unemployment > 0.13 && c.now.unemployment <= 0.2,
  },
  {
    event: 'unions_demand_works',
    cls: 'report',
    salience: 5,
    when: (c) => c.now.unemployment > 0.1 && c.now.utilization < 0.85 && c.stocks.labor_rights > 0.3,
  },
  {
    event: 'hands_are_scarce',
    cls: 'report',
    salience: 4,
    when: (c) => c.now.unemployment < 0.05 || c.now.utilization > 0.97,
  },
  {
    // `incomeMeanReal` is mean disposable HOUSEHOLD income — after tax, and
    // including transfers and profits — not an aggregate real wage, which the
    // worksheet does not carry. The copy says household income for that
    // reason: it read "real earnings are going backwards", which a transfer
    // expansion or a tax change could make false while market wages were flat
    // or moving the other way.
    event: 'wage_packets_thin',
    cls: 'report',
    salience: 6,
    when: (c) => c.now.incomeMeanReal < back(c, 8).incomeMeanReal * 0.98,
  },
  {
    event: 'wage_packets_fat',
    cls: 'report',
    salience: 3,
    when: (c) => c.now.incomeMeanReal > back(c, 8).incomeMeanReal * 1.06,
  },
  {
    event: 'emigration_rising',
    cls: 'report',
    salience: 6,
    when: (c) => c.now.netMigrationRate < -3,
  },
  {
    event: 'immigration_rising',
    cls: 'report',
    salience: 4,
    when: (c) => c.now.netMigrationRate > 4,
  },
  {
    event: 'inequality_widening',
    cls: 'report',
    salience: 5,
    when: (c) => c.now.gini - back(c, 40).gini > 0.04,
  },
  {
    event: 'inequality_narrowing',
    cls: 'report',
    salience: 3,
    when: (c) => back(c, 40).gini - c.now.gini > 0.04,
  },

  // ---------- money ----------
  {
    event: 'mint_running_hot',
    cls: 'report',
    salience: 7,
    when: (c) => c.now.printedShare > 0.005,
  },
  { event: 'reserves_thin', cls: 'report', salience: 7, when: (c) => c.now.reservesQtrs < 0.7 },
  {
    event: 'auction_poor',
    cls: 'report',
    salience: 5,
    when: (c) => debtToGdp(c.now) > 0.6 && c.now.balance < 0,
  },
  // Measured p99 of debt/GDP is 0.795 and the worst quarter seen was 0.926,
  // so the 1.1 this shipped at was unreachable. 0.75 is the top couple of per
  // cent of quarters — a debt the money market would indeed be talking about.
  { event: 'debt_alarming', cls: 'report', salience: 6, when: (c) => debtToGdp(c.now) > 0.75 },
  { event: 'reserves_ample', cls: 'report', salience: 1, when: (c) => c.now.reservesQtrs > 6 },
  {
    event: 'credit_boom',
    cls: 'report',
    salience: 5,
    when: (c) => c.now.creditToGdp - back(c, 8).creditToGdp > 0.1,
  },
  {
    event: 'credit_drought',
    cls: 'report',
    salience: 6,
    when: (c) => back(c, 8).creditToGdp - c.now.creditToGdp > 0.08,
  },
  {
    event: 'banks_thinly_capitalized',
    cls: 'report',
    salience: 6,
    when: (c) => c.now.bankCapitalRatio < 0.05,
  },
  {
    event: 'bourse_slump',
    cls: 'report',
    salience: 5,
    when: (c) => c.prev !== null && c.now.assetPrice < c.prev.assetPrice * 0.92,
  },
  {
    // `init` opens every country at parity, so the level IS the cumulative
    // depreciation — there is no exchange rate in the worksheet to trend
    // against, and putting one there to support one dispatch would grow the
    // record by four hundred numbers a century for a sentence.
    event: 'exchange_rate_slides',
    cls: 'report',
    salience: 5,
    when: (c) => c.exchangeRate > 1.3,
  },

  // ---------- what the country makes ----------
  { event: 'order_books_full', cls: 'report', salience: 2, when: (c) => c.now.utilization > 0.97 },
  { event: 'plants_idle', cls: 'report', salience: 5, when: (c) => c.now.utilization < 0.75 },
  { event: 'energy_runs_short', cls: 'report', salience: 7, when: (c) => c.satisfiedEnergy < 0.95 },

  // ---------- the land and the air ----------
  {
    event: 'harvest_thin',
    cls: 'report',
    salience: 4,
    when: (c) => c.now.satisfiedAgri < 0.97 && c.now.satisfiedAgri >= 0.93,
  },
  {
    event: 'harvest_bumper',
    cls: 'report',
    salience: 2,
    when: (c) => c.now.satisfiedAgri > 0.999 && c.now.priceFood < back(c, 8).priceFood * 0.95,
  },
  {
    event: 'rivers_run_black',
    cls: 'report',
    salience: 6,
    when: (c) => c.now.pollution > 1.8 * c.first.pollution,
  },
  {
    event: 'air_turns_foul',
    cls: 'report',
    salience: 5,
    when: (c) => c.now.pollution > 1.35 * c.first.pollution,
  },
  {
    event: 'air_clears',
    cls: 'report',
    salience: 3,
    when: (c) => c.now.pollution < 0.93 * back(c, 40).pollution,
  },

  // ---------- the street ----------
  {
    event: 'marches_on_the_ministries',
    cls: 'report',
    salience: 8,
    when: (c) => c.now.unrest > 0.5,
  },
  {
    event: 'gendarmerie_stretched',
    cls: 'report',
    salience: 6,
    when: (c) => c.now.unrest > 0.42 && c.stocks.repression > 0.3,
  },
  { event: 'pamphlets_circulate', cls: 'report', salience: 5, when: (c) => c.now.unrest > 0.3 },
  {
    event: 'government_despised',
    cls: 'report',
    salience: 6,
    when: (c) => c.now.approvalIndex < 0.3,
  },
  {
    event: 'government_popular',
    cls: 'report',
    salience: 2,
    when: (c) => c.now.approvalIndex > 0.62,
  },
  {
    event: 'press_muzzled',
    cls: 'report',
    salience: 4,
    when: (c) => c.stocks.press < 0.25,
  },
  {
    event: 'courts_command_respect',
    cls: 'report',
    salience: 2,
    when: (c) => c.stocks.courts > 0.65 && c.now.societalPower > 0.4,
  },

  // ---------- the world's ledger ----------
  {
    // The terms of trade are an index on 1946 = 100 and the whole measured
    // century lives between 95.6 and 108.0 — a narrow series, because the
    // partner cycles that drive it revert. The 85/118 rails this shipped at
    // were outside the distribution in both directions. These two are the
    // decile tails of the measured series, which is what "turned against us"
    // has to mean in an economy where it never turns very far.
    event: 'terms_of_trade_adverse',
    cls: 'report',
    salience: 5,
    when: (c) => c.now.termsOfTrade < 96.5,
  },
  {
    event: 'terms_of_trade_favourable',
    cls: 'report',
    salience: 2,
    when: (c) => c.now.termsOfTrade > 103.5,
  },
  {
    event: 'exports_carry_the_country',
    cls: 'report',
    salience: 3,
    when: (c) => c.now.exportShare > 0.3,
  },
  {
    event: 'foreign_capital_floods_in',
    cls: 'report',
    salience: 4,
    when: (c) => c.now.foreignDirectInvestmentShare > 0.013,
  },
  {
    // Not a negative flow: measured, inward direct investment never turns
    // negative in this model, so the sign test this shipped with could not
    // fire. What IS observable is the flow drying up — a country that was
    // being invested in and abruptly is not — so that is what the dispatch
    // reports, and the copy says so.
    event: 'foreign_capital_takes_flight',
    cls: 'report',
    salience: 5,
    when: (c) =>
      back(c, 12).foreignDirectInvestmentShare > 0.005 &&
      c.now.foreignDirectInvestmentShare < 0.4 * back(c, 12).foreignDirectInvestmentShare,
  },

  // ---------- the frontier ----------
  {
    event: 'schools_fill',
    cls: 'report',
    salience: 3,
    when: (c) => c.now.humanCapital - back(c, 40).humanCapital > 0.08,
  },
  {
    event: 'schools_empty',
    cls: 'report',
    salience: 5,
    when: (c) => c.now.humanCapital < 0.3 && c.stocks.labor_rights < 0.5,
  },
  {
    event: 'technique_closes_on_the_frontier',
    cls: 'report',
    salience: 3,
    when: (c) => c.now.technologyAttainment > 0.85,
  },
  {
    event: 'technique_falls_behind',
    cls: 'report',
    salience: 4,
    when: (c) => c.now.technologyAttainment < back(c, 40).technologyAttainment - 0.02,
  },

  // ---------- colour ----------
  ...([
    ['colour_postwar_rationing', 'wireless'],
    ['colour_postwar_wireless', 'wireless'],
    ['colour_postwar_reconstruction', 'wireless'],
    ['colour_postwar_railways', 'wireless'],
    ['colour_boom_television', 'boom'],
    ['colour_boom_motorcar', 'boom'],
    ['colour_boom_supermarket', 'boom'],
    ['colour_boom_new_towns', 'boom'],
    ['colour_crisis_queues_at_the_pumps', 'crisis'],
    ['colour_crisis_three_day_week', 'crisis'],
    ['colour_crisis_pop_and_protest', 'crisis'],
    ['colour_crisis_pocket_calculator', 'crisis'],
    ['colour_market_privatisation_fever', 'market'],
    ['colour_market_the_city_at_night', 'market'],
    ['colour_market_shoulder_pads', 'market'],
    ['colour_market_satellite_dish', 'market'],
    ['colour_network_the_web_arrives', 'network'],
    ['colour_network_mobile_telephones', 'network'],
    ['colour_network_call_centres', 'network'],
    ['colour_network_millennium_nerves', 'network'],
    ['colour_stream_everyone_a_broadcaster', 'stream'],
    ['colour_stream_the_paper_thins', 'stream'],
    ['colour_stream_screens_everywhere', 'stream'],
    ['colour_stream_the_archive_opens', 'stream'],
  ] as Array<[EventId, PressEraId]>).map(
    ([event, era]): ConditionRule => ({
      event,
      cls: 'colour',
      eras: [era],
      salience: 0,
      when: () => true,
    }),
  ),
]

// ---------- the desk ----------

/** When each event was last filed, and how often. One pass over the spike;
 * the spike holds a few hundred items after a century, so this is cheaper
 * than carrying a second index in the state and keeping it in step with a
 * save format. */
interface FilingHistory {
  lastFiled: Map<EventId, number>
  timesFiled: Map<EventId, number>
}

function filingHistory(news: readonly NewsItem[]): FilingHistory {
  const lastFiled = new Map<EventId, number>()
  const timesFiled = new Map<EventId, number>()
  for (const item of news) {
    lastFiled.set(item.event, item.tick)
    timesFiled.set(item.event, (timesFiled.get(item.event) ?? 0) + 1)
  }
  return { lastFiled, timesFiled }
}

/**
 * How long this event has to stay off the page, given how often it has
 * already been on it. Doubles per filing to `NEWS_COOLDOWN_MAX_Q`.
 *
 * A standing condition therefore fades — a country that never schools its
 * children is worth saying five times in a century, not thirty — while an
 * event that recurs because the world recurred is unaffected, since its
 * gaps were never near the cooldown anyway.
 */
export function cooldownFor(base: number, timesFiled: number): number {
  return Math.min(base * Math.pow(NEWS_COOLDOWN_GROWTH, Math.max(0, timesFiled - 1)), NEWS_COOLDOWN_MAX_Q)
}

/** True when the event may run again: never filed, or cooled off. */
function cooled(history: FilingHistory, event: EventId, tick: number, base: number): boolean {
  const last = history.lastFiled.get(event)
  if (last === undefined) return true
  return tick - last >= cooldownFor(base, history.timesFiled.get(event) ?? 1)
}

/**
 * How many condition reports the page still has room for.
 *
 * Pulled out and named because it is the one piece of arithmetic here that is
 * easy to get wrong and impossible to see wrong: the first version subtracted
 * the quarter's milestones from the budget and then ALSO compared the running
 * total (milestones included) against the result, charging each milestone
 * twice. A single milestone in an otherwise empty quarter left the budget at
 * one and then refused to spend it — a one-story front page with a free slot
 * on it, which reads exactly like a quiet quarter.
 *
 * It was invisible at century scale too: milestones fire about once per run,
 * so a sweep over twelve centuries produced one quarter where the difference
 * could even be observed. Hence a unit test over the arithmetic rather than a
 * property test over the wire.
 */
export function reportBudget(
  perQuarter: number,
  alreadyThisQtr: number,
  milestonesFiled: number,
  politicalLeadPending: boolean,
): number {
  return Math.max(
    0,
    perQuarter - alreadyThisQtr - milestonesFiled - (politicalLeadPending ? 1 : 0),
  )
}

export function buildContext(state: TrueState, record: readonly StatRecord[]): EventContext {
  const now = record[record.length - 1]
  return {
    tick: now.tick,
    era: eraAtTick(now.tick),
    now,
    prev: record.length > 1 ? record[record.length - 2] : null,
    first: record[0],
    record,
    stocks: state.institutions.stocks,
    satisfiedEnergy: state.flows.satisfied.energy,
    exchangeRate: state.external.exchangeRate,
  }
}

/**
 * The same country as it opened, for asking whether a milestone is one.
 *
 * A milestone is a line the country CROSSED, and the first version of this
 * did not check that — so the standard opening, which is already urban and
 * already service-led, led its 1946Q1 front page with "more of the country
 * now lives in towns than out of them" and "the country now lives by
 * services, not by making things". Both true, neither news: a fact that was
 * true on the first morning is a description of the country, not something
 * that happened to it. Every milestone is now required to be false here.
 *
 * The live readings (stocks, flows, the exchange rate) are today's rather
 * than 1946's, which is deliberate rather than sloppy: no milestone rule
 * reads them, and reconstructing the opening institutions to answer a
 * question nobody asks would mean carrying a second state around forever.
 */
function openingContext(ctx: EventContext): EventContext {
  return { ...ctx, tick: ctx.first.tick, now: ctx.first, prev: null, record: [ctx.first] }
}

/**
 * What the desk files this quarter, on top of whatever the pipeline steps
 * already raised.
 *
 * `record` must end with THIS quarter's worksheet — the statistics step
 * appends it before calling, so the rules see the country they are describing
 * rather than the one before it.
 */
export function conditionDispatches(
  state: TrueState,
  record: readonly StatRecord[],
): NewsItem[] {
  if (record.length === 0) return []
  const ctx = buildContext(state, record)
  const opening = openingContext(ctx)
  const rng = rngFor(state.meta.seed, 'obs:news', ctx.tick)
  const history = filingHistory(state.stats.news)
  const filed: NewsItem[] = []

  // How much room is left on the page. Counting what the quarter has ALREADY
  // carried is the crowding-out rule: a drought and a banking crisis have both
  // landed by the time the office reports, and the desk does not then also run
  // three paragraphs about the bond auction.
  const alreadyThisQtr = state.stats.news.reduce(
    (n, item) => (item.tick === ctx.tick ? n + 1 : n),
    0,
  )

  // …and one slot held back for a political lead that has not been filed yet.
  //
  // `politics` runs AFTER `statistics` in the versioned tick order, so unlike
  // every other hard event a coup or an election is not in `alreadyThisQtr`
  // when the desk sits down. Without this the crowding-out rule silently did
  // not apply to the single loudest story the game has, and an election
  // quarter carried its lead plus a full page of reports underneath it.
  //
  // Only the ELECTION half is knowable here, and that is the half worth
  // having: the political clock is deterministic, so the desk can see polling
  // day coming. A revolt or a coup is drawn from `politics`' own substream and
  // cannot be anticipated without reaching into it — which would couple the
  // wire to the economy's randomness, the one thing this module may never do.
  // When a revolt or coup PRE-EMPTS an election, the reserved slot is simply
  // filled by that instead, so the reservation covers those too whenever the
  // clock was already ringing. An unheralded coup in an ordinary quarter still
  // arrives on top of a full page; it is rare, and it is the correct thing for
  // a page to be surprised by.
  const politicalLeadPending =
    state.politics.inPower &&
    state.politics.deposedAt === null &&
    ctx.tick >= state.meta.appointedAt &&
    state.politics.quartersToElection - 1 <= 0

  // --- milestones: facts, unbudgeted, once per run, and only if crossed ---
  for (const rule of CONDITION_RULES) {
    if (rule.cls !== 'milestone') continue
    if (history.timesFiled.has(rule.event)) continue
    if (!rule.when(ctx)) continue
    if (rule.when(opening)) continue // true on the first morning: not news
    filed.push(fileDispatch(state, rule.event))
  }

  // --- reports: budgeted, cooled, and unreliable on purpose ---
  //
  // `filed` already holds this quarter's milestones, and they take page space
  // like anything else, so they come out of the budget — ONCE. The first
  // version subtracted them here and then compared the running total
  // `filed.length` against the result, which charged every milestone twice: a
  // single milestone in an otherwise empty quarter left `budget` at one and
  // then broke out of the loop immediately, printing a one-story page with a
  // free slot on it. Reports are counted on their own tally for that reason.
  const budget = reportBudget(
    NEWS_REPORTS_PER_QTR,
    alreadyThisQtr,
    filed.length,
    politicalLeadPending,
  )
  let reportsFiled = 0
  if (budget > 0) {
    const candidates = CONDITION_RULES.filter(
      (rule) =>
        rule.cls === 'report' &&
        cooled(history, rule.event, ctx.tick, NEWS_COOLDOWN_Q) &&
        rule.when(ctx),
    )
    // Loudest first, ties on catalogue order — `sort` is stable, so an
    // authored ordering survives as the tiebreak and the desk's choice is
    // reproducible rather than incidental.
    //
    // A story the paper has never run gets a nudge up the order, which is
    // what makes a long run explore the catalogue rather than circle the same
    // dozen dispatches. It is a NUDGE and not a rule: it is worth less than
    // the gap between a brief and a lead, so mass unemployment still leads
    // over a novel note about the reserves.
    const weight = (r: ConditionRule) => r.salience + (history.timesFiled.has(r.event) ? 0 : 2)
    const ranked = [...candidates].sort((a, b) => weight(b) - weight(a))
    for (const rule of ranked) {
      if (reportsFiled >= budget) break
      if (rng.next() >= NEWS_REPORT_P) continue
      filed.push(fileDispatch(state, rule.event))
      reportsFiled += 1
    }
  }

  // --- colour: only into a page that would otherwise be thin ---
  if (alreadyThisQtr + filed.length < NEWS_THIN_PAGE_AT && rng.next() < NEWS_COLOUR_P) {
    const available = CONDITION_RULES.filter(
      (rule) =>
        rule.cls === 'colour' &&
        (rule.eras === undefined || rule.eras.includes(ctx.era)) &&
        cooled(history, rule.event, ctx.tick, NEWS_COLOUR_COOLDOWN_Q),
    )
    if (available.length > 0) {
      const pick = available[Math.min(Math.floor(rng.next() * available.length), available.length - 1)]
      filed.push(fileDispatch(state, pick.event))
    }
  }

  return filed
}
