/**
 * The news desk: applies the declarative condition rules to this quarter.
 *
 * `rules.ts` answers "is this condition worth reporting"; this module owns
 * the filing machinery that decides what fits on the page. A pipeline step
 * raising a hard event knows a fact happened. Nothing knows that unemployment
 * has been high for two years until this desk looks.
 *
 * Naively, every true condition files. Measured over a century that is five
 * or six dispatches a quarter, most of them the same six, and the effect is a
 * wire nobody reads. Reports are therefore budgeted, sampled and cooled; hard
 * facts and crossed milestones always file; period colour fills a thin page.
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
import { realExchangeRate, skillTightness } from '../pipeline/derive'
import { rngFor } from '../rng/rng'
import type { NewsItem, StatRecord, TrueState } from '../state/schema'
import { eraAtTick } from './eras'
import { fileDispatch } from './file'
import type { EventId } from './ids'
import { CONDITION_RULES, type ConditionRule, type EventContext } from './rules'

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
  return Math.min(
    base * Math.pow(NEWS_COOLDOWN_GROWTH, Math.max(0, timesFiled - 1)),
    NEWS_COOLDOWN_MAX_Q,
  )
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
    professionalTightness: skillTightness(state).professionals,
    exchangeRate: state.external.exchangeRate,
    realExchangeRate: realExchangeRate(state),
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
      const pick =
        available[Math.min(Math.floor(rng.next() * available.length), available.length - 1)]
      filed.push(fileDispatch(state, pick.event))
    }
  }

  return filed
}
