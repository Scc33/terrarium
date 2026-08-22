/**
 * The whole engine is three functions (§2):
 *
 *   let s = init(params, seed, rules)
 *   for (const turn of actionLog) s = step(applyActions(s, turn.actions))
 *
 * All pure. The save file is literally {version, params, seed, rules, actionLog}.
 */

import { applyAction } from './actions/apply'
import type { Action, ActionLog } from './actions/types'
import { runTick } from './pipeline/pipeline'
import { init as initState } from './state/init'
import {
  END_OF_HISTORY_TICK,
  ENGINE_VERSION,
  SCHEMA_VERSION,
  appointmentTick,
  gameRules,
  type CountryParams,
  type GameMode,
  type GameRules,
  type Qtr,
  type TrueState,
} from './state/schema'
import type { Seed } from './rng/rng'

export function init(
  params: CountryParams,
  seed: Seed,
  rules: GameMode | Partial<GameRules> = 'standard',
  appointedAt = 0,
): TrueState {
  return initState(params, seed, rules, appointedAt)
}

export function applyActions(s: TrueState, actions: Action[]): TrueState {
  return actions.reduce(applyAction, s)
}

export function step(s: TrueState): TrueState {
  return runTick(s)
}

// ---------- saves ----------
/** A save whose own replay inputs contradict each other. Distinct from
 * `InvalidCountryError` (a vector this build refuses) because nothing is wrong
 * with the country — the file's two numbers cannot both be true. */
export class InvalidSaveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidSaveError'
  }
}

export interface SaveFile {
  version: { engine: string; schema: number }
  params: CountryParams
  seed: Seed
  actionLog: ActionLog
  /** the quarter the game had reached — action-free quarters count too */
  tick: number
  /** The run's safeties. Optional only so older saves remain loadable; new
   * saves always write it. */
  rules?: GameRules
  /** The pre-v27 tenure scalar. Read when `rules` is absent, never written —
   * a save from before the rule set still has to reload protected. */
  mode?: GameMode
  /** The quarter the player took office (ADR-0021). Absent on saves written
   * before v28, which is the same thing as zero: every one of them began in
   * 1946. The interregnum's own orders are in `actionLog` like any others. */
  appointedAt?: Qtr
}

export function createSave(
  params: CountryParams,
  seed: Seed,
  actionLog: ActionLog,
  tick: number,
  rules: GameMode | Partial<GameRules> = 'standard',
  appointedAt: Qtr = 0,
): SaveFile {
  return {
    version: { engine: ENGINE_VERSION, schema: SCHEMA_VERSION },
    params,
    seed,
    actionLog,
    tick,
    rules: gameRules(rules),
    appointedAt,
  }
}

/** Replay a save to its current state. Deterministic by construction — the
 * caretaker's quarters replay from the log like every other quarter, which is
 * why the interregnum writes its orders down (ADR-0021).
 *
 * A save cannot have stopped before its own government took office: replaying
 * one hands back an INTERREGNUM as though it were a playable position, with the
 * political clock frozen and every order quoted and then not charged. The
 * worker refuses that at the door (`replayWindow` in `ui/src/saveFile.ts`), but
 * this is the engine's own public API and tools and tests call it directly, so
 * the invariant belongs on the save contract rather than on one caller.
 * `untilTick` is unaffected — inspecting an earlier quarter of a legal run,
 * including one inside its interregnum, is exactly what it is for. */
export function replay(save: SaveFile, untilTick?: number): TrueState {
  const appointedAt = appointmentTick(save.appointedAt ?? 0)
  if (appointedAt > Math.min(save.tick, END_OF_HISTORY_TICK)) {
    throw new InvalidSaveError(
      `the run was saved at quarter ${save.tick} but its government does not take office until ${appointedAt}`,
    )
  }
  let s = init(save.params, save.seed, save.rules ?? save.mode ?? 'standard', appointedAt)
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
export {
  COUNTRY_ARCHETYPE_IDS,
  COUNTRY_CATALOG,
  CURATED_COUNTRY_IDS,
  MERIDIA_PARAMS,
  InvalidCountryError,
  countryProfile,
  createCountryParams,
  generateParams,
  generateCountryParams,
  materializeStructure,
  pyramidFor,
  validateCountryParams,
} from './countries'
export type {
  CountryArchetypeId,
  CountryDifficulty,
  CountryProfile,
  CountryScenarioId,
  CuratedCountryId,
  ProceduralCountryOptions,
} from './countries'
export {
  COUNTRY_DOCUMENT_FORMAT,
  COUNTRY_DOCUMENT_VERSION,
  countryFromDocument,
  createCountryDocument,
  parseCountryDocument,
} from './countryDocument'
export type { CountryDocument, CountryDossier } from './countryDocument'
export {
  APPOINTMENTS,
  caretakerActions,
  runInterregnum,
  type Appointment,
} from './interregnum'
export { rngFor, type Rng, type Seed } from './rng/rng'
export { hashState, stableStringify } from './hash'
export { validate, InvariantError } from './state/validate'
export { applyAction, politicalCostOfAction, IllegalActionError } from './actions/apply'
export type { Action, ActionLog, DialPath, TurnActions } from './actions/types'
export {
  SECTOR_IDS,
  COHORT_IDS,
  CAPACITY_IDS,
  GAME_RULE_IDS,
  STANDARD_RULES,
  gameRules,
  INDICATOR_IDS,
  INSTITUTION_IDS,
  BLOC_IDS,
  PLATFORM_IDS,
  CAMPAIGN_WINDOW,
  REVENUE_SOURCE_IDS,
  OUTLAY_IDS,
  SPENDING_PROGRAM_IDS,
  ELECTION_PERIOD,
  END_OF_HISTORY_TICK,
  FIRST_YEAR,
  LAST_APPOINTMENT_TICK,
  appointmentTick,
  tickForYear,
  yearOfTick,
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
  CountryStructure,
  DialState,
  ElectionResult,
  GameMode,
  GameRuleId,
  GameRules,
  GovernmentState,
  IndicatorId,
  InstitutionId,
  InstitutionState,
  Money,
  NewsItem,
  PlatformId,
  PoliticalState,
  PolicyRecord,
  OutlayId,
  OutlaySplit,
  SpendingProgramId,
  SpendingRule,
  SpendingRuleMode,
  SpendingRules,
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
  technologyAttainment,
  approvalIndex,
  giniIndex,
  realIncomePerHead,
  householdSavingRate,
  meanLogConsumption,
  realConsumptionPerCapita,
  livingStandard,
  corridorOffset,
  corridorStrain,
  discontentIndex,
  creativeDestruction,
  effectiveBlocPower,
  financierAnger,
  sovereignRiskPremium,
  bondIssuanceShare,
  privateFundingSpread,
  privateRealRate,
  eliteCapture,
  eliteHostility,
  enfranchisementIndex,
  inCorridor,
  statePower,
  urbanShare,
} from './pipeline/derive'
export { institutions, initialInstitutions, franchiseOf } from './pipeline/institutions'
export { migrationFlow, vitalRates } from './pipeline/demography'
export type { MigrationFlow } from './pipeline/demography'
export { electionThreshold } from './pipeline/politics'
export { reformWindowOpen, vetoMultiplier } from './actions/apply'
export {
  adminEffectiveness,
  ASSET_PURCHASE_RATE_MAX,
  CAPITAL_REQUIREMENT_MAX,
  CAPITAL_REQUIREMENT_MIN,
  CORRIDOR_HALF_WIDTH,
  DEBT_RISK_PREMIUM_AT,
  ELECTION_WIN_THRESHOLD,
  fdiStructuralAttraction,
  INDICATOR_FUNDED_AT,
  IMMIGRATION_LIMIT_DEFAULT,
  IMMIGRATION_LIMIT_MAX,
  LEGITIMACY_GRADE_ELECTIONS,
  NATURAL_UNEMPLOYMENT,
  PC_COST_CAMPAIGN,
  PC_COST_REFORM,
  PC_START,
  POSITION_GRADE_CUTS,
  PROSPERITY_GRADE_CUTS,
  REFORM_STEP,
  REFORM_WINDOW_AT,
  REFORM_WINDOW_DISCOUNT,
  REVOLT_AT,
  TRANSFER_SHARE,
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
export {
  absorptiveCapacity,
  breakthroughHazard,
  frontierGrowthAt,
  researchAllocation,
  researchIntensity,
} from './pipeline/technology'
export type { ResearchAllocation } from './pipeline/technology'
export { termsOfTrade } from './pipeline/derive'
