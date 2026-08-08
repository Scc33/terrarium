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
export { applyAction, politicalCostOfAction, IllegalActionError } from './actions/apply'
export type { Action, ActionLog, DialPath, TurnActions } from './actions/types'
export {
  SECTOR_IDS,
  COHORT_IDS,
  CAPACITY_IDS,
  INDICATOR_IDS,
  INSTITUTION_IDS,
  BLOC_IDS,
  PLATFORM_IDS,
  CAMPAIGN_WINDOW,
  REVENUE_SOURCE_IDS,
  OUTLAY_IDS,
  ELECTION_PERIOD,
  END_OF_HISTORY_TICK,
  ENGINE_VERSION,
  SCHEMA_VERSION,
} from './state/schema'
export type {
  Bloc,
  BlocId,
  CapacityId,
  Cohort,
  CohortId,
  CountryParams,
  DialState,
  ElectionResult,
  GovernmentState,
  IndicatorId,
  InstitutionId,
  InstitutionState,
  Money,
  NewsItem,
  PlatformId,
  PoliticalState,
  OutlayId,
  OutlaySplit,
  Qtr,
  Ratio,
  RevenueSourceId,
  RevenueSplit,
  Sector,
  SectorId,
  StatPrint,
  StatRecord,
  StatsOffice,
  TickFlows,
  TrueState,
} from './state/schema'
export { TICK_ORDER } from './pipeline/pipeline'
export {
  potentialOutput,
  cohortCpi,
  laborForce,
  totalLaborForce,
  approvalIndex,
  giniIndex,
  meanLogConsumption,
  livingStandard,
  corridorOffset,
  corridorStrain,
  discontentIndex,
  creativeDestruction,
  effectiveBlocPower,
  eliteCapture,
  eliteHostility,
  enfranchisementIndex,
  inCorridor,
  statePower,
  urbanShare,
} from './pipeline/derive'
export { institutions, initialInstitutions, franchiseOf } from './pipeline/institutions'
export { electionThreshold } from './pipeline/politics'
export { reformWindowOpen, vetoMultiplier } from './actions/apply'
export {
  CORRIDOR_HALF_WIDTH,
  ELECTION_WIN_THRESHOLD,
  INDICATOR_FUNDED_AT,
  LEGITIMACY_GRADE_ELECTIONS,
  NATURAL_UNEMPLOYMENT,
  PC_COST_CAMPAIGN,
  PC_COST_REFORM,
  POSITION_GRADE_CUTS,
  PROSPERITY_GRADE_CUTS,
  REFORM_STEP,
  REFORM_WINDOW_AT,
  REFORM_WINDOW_DISCOUNT,
  REVOLT_AT,
  WELFARE_DISCOUNT_Q,
} from './constants'
export { AGE_BANDS, PARTNER_IDS, RETIREMENT_BAND, WORKING_BANDS } from './state/schema'
export type {
  DemographyState,
  FinanceState,
  PartnerId,
  TechState,
  WorldPartner,
  WorldState,
} from './state/schema'
export { absorptiveCapacity, frontierGrowthAt } from './pipeline/technology'
export { termsOfTrade } from './pipeline/derive'
