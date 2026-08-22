/**
 * The years before you (ADR-0021).
 *
 * A posting can begin later than 1946. The quarters in between are not skipped
 * and they are not scripted: a **caretaker administration** governs them, in
 * the ordinary `applyActions → step` loop, and hands you whatever that
 * produced. So there is no such thing as *setting* the country you inherit,
 * exactly as there is no such thing as setting GDP (ADR-0001) — you name a
 * quarter and read what the century did to get there.
 *
 * The caretaker does two things and nothing else:
 *
 * 1. **It keeps the 1946 settlement at its share of the economy.** The opening
 *    appropriations are `fixed` cash, so growth and inflation quietly repeal
 *    them over a generation; the caretaker votes them into `gdpShare` rules at
 *    the share they opened on. Left alone, the state instead retires its whole
 *    debt around quarter 62 and every posting inherits an identical, empty
 *    balance sheet (investigation 0008).
 * 2. **It builds the four ministries.** Nothing else — no rate, no tax, no
 *    reform, no campaign. This is the runner's `developmental` policy, and the
 *    pair of them together is the `dev-GDP-share` arm of `pnpm debt-baselines`
 *    (the one difference: that arm votes the rules once at quarter four, where
 *    this one keeps trying until the statistics office has published a level to
 *    write them against, so a country whose office opens at 0.09 gets them too).
 *    So the interregnum is a baseline this repo has already measured over
 *    centuries, not a second model of how a government behaves — and what it
 *    hands over at each offered year is measured too, by `pnpm inheritance`.
 *
 * Its capacity building is what makes a later posting playable at all: a
 * passive interregnum arrives in 1973 with the 1946 statistical office, and a
 * wall with 2 of 29 instruments on it is not a later game, it is a worse one.
 *
 * The caretaker's orders are written into the save's action log, not
 * regenerated on load. A save has always carried the vector it needs so a
 * later retune cannot rewrite an old game's history (ADR-0011); the same
 * argument applies with more force here, because a retune of this file would
 * otherwise silently rewrite the country every existing late posting inherited.
 */

import { applyAction, IllegalActionError } from './actions/apply'
import type { Action, ActionLog } from './actions/types'
import { CARETAKER_CAPACITY_EVERY, CARETAKER_CAPACITY_SPEND } from './constants'
import { runTick } from './pipeline/pipeline'
import type { Seed } from './rng/rng'
import { init } from './state/init'
import {
  CAPACITY_IDS,
  FIRST_YEAR,
  SPENDING_PROGRAM_IDS,
  tickForYear,
  type CountryParams,
  type GameMode,
  type GameRules,
  type Qtr,
  type TrueState,
} from './state/schema'

/** A quarter the player can be appointed in, and what the world is doing when
 * they get there. Every year here is a `FRONTIER_ERAS` boundary: the frontier's
 * growth schedule is the only calendar the engine keeps, so it is the only
 * thing that makes one year a different game from the year beside it. */
export interface Appointment {
  year: number
  tick: Qtr
  name: string
  /** what is true about the WORLD that quarter — not about your country, which
   * is whatever the interregnum made of it */
  summary: string
}

const appointment = (year: number, name: string, summary: string): Appointment => ({
  year,
  tick: tickForYear(year),
  name,
  summary,
})

export const APPOINTMENTS: readonly Appointment[] = [
  appointment(
    FIRST_YEAR,
    'THE SETTLEMENT',
    'The first quarter. The frontier advances at 2.0% a year and nothing has happened here that you did not do.',
  ),
  appointment(
    1973,
    'THE SLOWDOWN',
    'A quarter-century of catch-up ends the quarter you arrive: the frontier drops from 2.0% a year to 1.1%. You inherit the boom and the bill for it.',
  ),
  appointment(
    1995,
    'THE NEW ECONOMY',
    'The frontier accelerates to 1.6% and a half-century of somebody else’s decisions is already in the accounts. Fifty-five years left on the clock.',
  ),
  appointment(
    2005,
    'THE LONG STAGNATION',
    'The frontier settles back to 1.1% and stays there. A rich, slow, ageing country with forty-five years to run — you will not grow your way out of this one.',
  ),
]

/** Vote the opening appropriations into GDP-share rules at the share they are
 * currently running at. Attempted every quarter until it takes, because the
 * treasury cannot write the rule until the statistics office has published a
 * nominal level to write it against, and a country whose office opens at 0.09
 * capacity takes several quarters to do that. */
function indexProgrammesToGdp(state: TrueState): Action[] {
  // A programme with no money in it is left alone rather than voted a share of
  // zero: 1946 opens with no research appropriation at all, so converting it
  // would write a rule that appropriates nothing in perpetuity.
  const pending = SPENDING_PROGRAM_IDS.filter(
    (programme) =>
      state.gov.spendingRules[programme].kind === 'fixed' &&
      state.gov.dials.spending[programme] > 0,
  )
  if (pending.length === 0) return []
  const levels = (state.stats.series.gdp_growth ?? [])
    .filter((print) => print.levels && Number.isFinite(print.levels.nominal))
    .sort((a, b) => b.forQtr - a.forQtr || b.revision - a.revision)[0]?.levels
  if (!levels || levels.nominal <= 0) return []
  return pending.map((programme) => ({
    kind: 'setSpendingRule' as const,
    programme,
    mode: 'gdpShare' as const,
    value: state.gov.dials.spending[programme] / levels.nominal,
  }))
}

/** What the caretaker does this quarter. Pure, and deliberately RNG-free: the
 * inheritance offered by a posting should be a property of the country and the
 * seed's world, not of a policy that also rolls dice. */
export function caretakerActions(state: TrueState): Action[] {
  if (!state.politics.inPower) return []
  const actions = indexProgrammesToGdp(state)
  if (state.meta.tick % CARETAKER_CAPACITY_EVERY === 0) {
    for (const target of CAPACITY_IDS) {
      actions.push({ kind: 'investCapacity', target, amount: CARETAKER_CAPACITY_SPEND })
    }
  }
  return actions
}

/**
 * Open a country and let the caretaker govern it up to the appointment.
 *
 * Returns the state the player takes over AND the log that produced it, which
 * is the log the save is written with. Lenient by the same rule the reload path
 * uses: a ministry that has reached full strength refuses further investment,
 * and an order the country cannot take is skipped rather than fatal — so the
 * log records what actually happened, not what was proposed.
 */
export function runInterregnum(
  params: CountryParams,
  seed: Seed,
  rules: GameMode | Partial<GameRules> = 'standard',
  appointedAt: Qtr = 0,
): { state: TrueState; actionLog: ActionLog } {
  let state = init(params, seed, rules, appointedAt)
  const actionLog: ActionLog = []
  while (state.meta.tick < state.meta.appointedAt) {
    const applied: Action[] = []
    for (const action of caretakerActions(state)) {
      try {
        state = applyAction(state, action)
        applied.push(action)
      } catch (error) {
        if (!(error instanceof IllegalActionError)) throw error
      }
    }
    if (applied.length > 0) actionLog.push({ tick: state.meta.tick, actions: applied })
    state = runTick(state)
  }
  return { state, actionLog }
}
