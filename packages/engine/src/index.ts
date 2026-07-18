/**
 * The whole engine is three functions (§2):
 *
 *   let s = init(params, seed)
 *   for (const turn of actionLog) s = step(applyActions(s, turn.actions))
 *
 * All pure. The save file is literally {version, params, seed, actionLog}.
 */

import { applyAction } from './actions/apply'
import type { Action, ActionLog } from './actions/types'
import { runTick } from './pipeline/pipeline'
import { init as initState, generateParams } from './state/init'
import {
  ENGINE_VERSION,
  SCHEMA_VERSION,
  type CountryParams,
  type TrueState,
} from './state/schema'
import type { Seed } from './rng/rng'

export function init(params: CountryParams, seed: Seed): TrueState {
  return initState(params, seed)
}

export function applyActions(s: TrueState, actions: Action[]): TrueState {
  return actions.reduce(applyAction, s)
}

export function step(s: TrueState): TrueState {
  return runTick(s)
}

// ---------- saves ----------
export interface SaveFile {
  version: { engine: string; schema: number }
  params: CountryParams
  seed: Seed
  actionLog: ActionLog
  /** the quarter the game had reached — action-free quarters count too */
  tick: number
}

export function createSave(
  params: CountryParams,
  seed: Seed,
  actionLog: ActionLog,
  tick: number,
): SaveFile {
  return { version: { engine: ENGINE_VERSION, schema: SCHEMA_VERSION }, params, seed, actionLog, tick }
}

/** Replay a save to its current state. Deterministic by construction. */
export function replay(save: SaveFile, untilTick?: number): TrueState {
  let s = init(save.params, save.seed)
  const byTick = new Map(save.actionLog.map((t) => [t.tick, t.actions]))
  const end = untilTick ?? save.tick
  while (s.meta.tick < end) {
    const actions = byTick.get(s.meta.tick)
    if (actions) s = applyActions(s, actions)
    s = step(s)
  }
  return s
}

// ---------- re-exports ----------
export { generateParams }
export { rngFor, type Rng, type Seed } from './rng/rng'
export { hashState, stableStringify } from './hash'
export { validate, InvariantError } from './state/validate'
export { applyAction, IllegalActionError } from './actions/apply'
export type { Action, ActionLog, DialPath, TurnActions } from './actions/types'
export {
  SECTOR_IDS,
  COHORT_IDS,
  CAPACITY_IDS,
  INDICATOR_IDS,
  ELECTION_PERIOD,
  ENGINE_VERSION,
  SCHEMA_VERSION,
} from './state/schema'
export type {
  CapacityId,
  Cohort,
  CohortId,
  CountryParams,
  DialState,
  GovernmentState,
  IndicatorId,
  Money,
  NewsItem,
  Qtr,
  Ratio,
  Sector,
  SectorId,
  StatPrint,
  StatRecord,
  StatsOffice,
  TickFlows,
  TrueState,
} from './state/schema'
export { TICK_ORDER } from './pipeline/pipeline'
export { potentialOutput, cohortCpi, laborForce, totalLaborForce, approvalIndex } from './pipeline/derive'
