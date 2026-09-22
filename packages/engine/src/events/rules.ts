/**
 * The news desk's declarative rulebook: which conditions are worth reporting.
 *
 * Conditions read TRUE state: the whole quarterly worksheet, the unfogged
 * institutional stocks, and a couple of live flows. That is deliberate and it
 * is safe for exactly one reason — **the output is a choice of authored
 * prose, never a number.** The desk may know the unemployment rate to twelve
 * decimal places; all it can do with that knowledge is decide whether to run
 * "Idle men gather at the factory gates". A dispatch that interpolated the
 * figure would be a free, ungated, un-lagged, un-revised instrument sitting
 * on the wire beside the ones the player had to fund (ADR-0003), and the fog
 * would be over. The event tests enforce that boundary.
 */

import {
  NEWS_PROFESSIONAL_TIGHTNESS_AT,
  NEWS_PROFESSIONAL_UNDERUSE_AT,
  NEWS_UNEMPLOYMENT_IMPROVEMENT_AT,
  NEWS_URBAN_JOBLESS_AT,
  NEWS_URBAN_TRANSITION_WINDOW_Q,
} from '../constants'
import type { InstitutionId, SectorId, StatRecord } from '../state/schema'
import type { PressEraId } from './eras'
import type { EventId } from './ids'

export interface EventContext {
  tick: number
  era: PressEraId
  now: StatRecord
  prev: StatRecord | null
  /** the country as it opened, for anything measured against its own 1946 */
  first: StatRecord
  /** the whole book, for trends. Indexed with `back()`, never by position. */
  record: readonly StatRecord[]
  /** the constitution, exactly. Legitimate to read: the fog is about the
   * economy, not about which liberties a government granted itself. */
  stocks: Record<InstitutionId, number>
  satisfiedEnergy: number
  /** posts `LABOR_SOURCE` asks of professionals ÷ the professionals who exist
   * (`skillTightness`). Above one the trades want more trained hands than there
   * are; `allocateStaffing` still fills every post, so this is a mismatch
   * reading and never a vacancy count. */
  professionalTightness: number
  exchangeRate: number
  /** Competitiveness against the country's own 1946 settlement, not the
   * nominal rate. The nominal rate on its own says nothing about whether
   * exporters are in trouble — a country whose prices doubled and whose
   * currency halved is exactly where it started — which is why the two
   * currency conditions read this and `exchange_rate_slides` reads the other. */
  realExchangeRate: number
}

/** The worksheet `n` quarters ago, or the opening one if the run is younger.
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
  // The three labour markets the headline hides (investigation 0020, #198).
  // A worker with a lesser job is not jobless, so the first reads jobless
  // AND underemployed together: it catches the school-to-work mismatch
  // whether it left professionals idle or bumped them down a rung (ADR-0036).
  {
    event: 'trained_workers_underused',
    cls: 'report',
    salience: 6,
    when: (c) =>
      c.now.labourMarket.professionals.jobless + c.now.labourMarket.professionals.underemployed >
      NEWS_PROFESSIONAL_UNDERUSE_AT,
  },
  {
    // The national headline can improve while the urban queue stays long:
    // rural work is absorbing the residual, not the cities having caught up.
    // Both halves are read over the same window: the headline must have
    // fallen by more than the improvement threshold AND the urban class
    // reading by less, or the copy's "as long as ever" is false of a city
    // whose queue is shortening but still long.
    event: 'city_jobs_lag_transition',
    cls: 'report',
    salience: 6,
    when: (c) => {
      const then = back(c, NEWS_URBAN_TRANSITION_WINDOW_Q)
      const urbanNow = c.now.labourMarket.urban_workers.jobless
      return (
        urbanNow > NEWS_URBAN_JOBLESS_AT &&
        then.unemployment - c.now.unemployment > NEWS_UNEMPLOYMENT_IMPROVEMENT_AT &&
        then.labourMarket.urban_workers.jobless - urbanNow <= NEWS_UNEMPLOYMENT_IMPROVEMENT_AT
      )
    },
  },
  {
    // `jobless === 0` only says every trained worker found SOME job. The
    // staffing demand is the second reading: posts still asking for trained
    // hands are a shortage, not merely high employment.
    event: 'trained_hands_short',
    cls: 'report',
    salience: 4,
    when: (c) => c.professionalTightness > NEWS_PROFESSIONAL_TIGHTNESS_AT,
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
  // Competitiveness, not the posted rate. The thresholds are the measured
  // tails: a floating century spends most of its time between 0.95 and 1.45
  // on this reading, so these are the quarters an exporter would actually be
  // writing to the paper about.
  { event: 'currency_dear', cls: 'report', salience: 5, when: (c) => c.realExchangeRate < 0.92 },
  { event: 'currency_cheap', cls: 'report', salience: 3, when: (c) => c.realExchangeRate > 1.6 },

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
