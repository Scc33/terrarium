/**
 * Test-only causal harness for ordinary foreign-demand volatility.
 *
 * Four passive paths advance in lockstep with identical RNG substreams:
 *   normal             — the engine as written;
 *   neutralExports     — partner export-demand multipliers fixed at 1 after world;
 *   habitClamped       — normal exports, but habitual real income comes from neutral;
 *   householdClamped   — normal exports, but production receives the neutral path's
 *                        lagged household income, savings, and consumer confidence.
 *
 * The final path blocks the household-spending feedback without suppressing the
 * current quarter's direct export order. It deliberately lives in the runner,
 * not the engine: this is an experiment, not a supported simulation mode.
 */

import {
  SECTOR_IDS,
  TICK_ORDER,
  hashState,
  init,
  rngFor,
  type CountryParams,
  type TrueState,
} from '@terrarium/engine'
import {
  eventsBetween,
  trajectoryPoint,
  type RunResult,
  type TrajectoryPoint,
} from './run'
import {
  SHOCK_EXCLUSION_QTRS,
  STABILITY_ERAS,
  summarizeTails,
  type StabilityEra,
  type TailSummary,
} from './stability'

export type ExportFeedbackPath =
  | 'normal'
  | 'neutralExports'
  | 'habitClamped'
  | 'householdClamped'

export interface ExportFeedbackExperiment {
  seed: string
  params: CountryParams
  normal: RunResult
  neutralExports: RunResult
  habitClamped: RunResult
  householdClamped: RunResult
}

export interface ExportFeedbackHorizon {
  horizon: number
  observations: number
  partnerDemandGrowth: TailSummary
  normalGrowth: TailSummary
  neutralGrowth: TailSummary
  habitClampedGrowth: TailSummary
  householdClampedGrowth: TailSummary
  totalExportEffect: TailSummary
  nonHouseholdEffect: TailSummary
  otherHouseholdEffect: TailSummary
  habitualIncomeFeedbackEffect: TailSummary
  householdFeedbackEffect: TailSummary
  normalHouseholdGrowth: TailSummary
  neutralHouseholdGrowth: TailSummary
  habitClampedHouseholdGrowth: TailSummary
  householdClampedHouseholdGrowth: TailSummary
}

export interface EraExportFeedback {
  era: StabilityEra
  quietObservations: number
  contractionCutoff: number
  contractionOnsets: number
  horizons: ExportFeedbackHorizon[]
}

export interface ExportFeedbackReport {
  runs: number
  eras: EraExportFeedback[]
}

type PathStates = Record<ExportFeedbackPath, TrueState>
type PathTrajectories = Record<ExportFeedbackPath, TrajectoryPoint[]>

const PATHS: readonly ExportFeedbackPath[] = [
  'normal',
  'neutralExports',
  'habitClamped',
  'householdClamped',
]
const RESPONSE_HORIZONS = [0, 1, 2, 4, 8] as const

function assertFixedSpendingRules(state: TrueState): void {
  const variableRule = Object.values(state.gov.spendingRules).find(
    (rule) => rule.kind !== 'fixed',
  )
  if (variableRule) {
    throw new Error(
      'export-feedback experiment supports passive fixed appropriations only; ' +
      'its tick fold intentionally has no policy or published-rule resolution',
    )
  }
}

function neutralizeExportDemand(state: TrueState): TrueState {
  const exportDemand = { ...state.external.world.exportDemand }
  for (const sid of SECTOR_IDS) exportDemand[sid] = 1
  return {
    ...state,
    external: {
      ...state.external,
      world: { ...state.external.world, exportDemand },
    },
  }
}

/** Copy only inputs read by production's household budget. Current prices,
 * taxes, cohort sizes, consumption weights, and every non-household state
 * remain on the normal-export path. */
function clampHouseholdDemandInputs(target: TrueState, source: TrueState): TrueState {
  const sourceCohorts = new Map(source.cohorts.map((cohort) => [cohort.id, cohort]))
  return {
    ...target,
    cohorts: target.cohorts.map((cohort) => {
      const benchmark = sourceCohorts.get(cohort.id)
      if (!benchmark) throw new Error(`missing neutral cohort ${cohort.id}`)
      return {
        ...cohort,
        wageIncome: benchmark.wageIncome,
        profitIncome: benchmark.profitIncome,
        transferIncome: benchmark.transferIncome,
        savings: benchmark.savings,
        lastRealIncome: benchmark.lastRealIncome,
      }
    }),
    ledger: {
      ...target.ledger,
      confidence: {
        ...target.ledger.confidence,
        consumer: source.ledger.confidence.consumer,
      },
    },
  }
}

function clampHabitualIncome(target: TrueState, source: TrueState): TrueState {
  const sourceCohorts = new Map(source.cohorts.map((cohort) => [cohort.id, cohort]))
  return {
    ...target,
    cohorts: target.cohorts.map((cohort) => {
      const benchmark = sourceCohorts.get(cohort.id)
      if (!benchmark) throw new Error(`missing neutral cohort ${cohort.id}`)
      return { ...cohort, lastRealIncome: benchmark.lastRealIncome }
    }),
  }
}

function incrementTick(state: TrueState): TrueState {
  return { ...state, meta: { ...state.meta, tick: state.meta.tick + 1 } }
}

function advancePaths(states: PathStates): PathStates {
  const next = { ...states }
  for (const pipelineStep of TICK_ORDER) {
    if (pipelineStep.name === 'production') {
      next.habitClamped = clampHabitualIncome(next.habitClamped, next.neutralExports)
      next.householdClamped = clampHouseholdDemandInputs(
        next.householdClamped,
        next.neutralExports,
      )
    }
    for (const path of PATHS) {
      const state = next[path]
      next[path] = pipelineStep.run(
        state,
        rngFor(state.meta.seed, pipelineStep.name, state.meta.tick),
      )
    }
    if (pipelineStep.name === 'world') {
      next.neutralExports = neutralizeExportDemand(next.neutralExports)
    }
  }
  for (const path of PATHS) next[path] = incrementTick(next[path])
  return next
}

function resultFor(
  path: ExportFeedbackPath,
  seed: string,
  params: CountryParams,
  ticks: number,
  states: PathStates,
  trajectories: PathTrajectories,
  deposedAt: Record<ExportFeedbackPath, number | null>,
): RunResult {
  const trajectory = trajectories[path]
  const finalState = states[path]
  const values = trajectory.flatMap((entry) => [
    entry.realGdp,
    entry.nominalGdp,
    entry.inflationQ,
    entry.unemployment,
    ...Object.values(entry.prices),
  ])
  return {
    seed,
    countryId: 'custom',
    country: params.name,
    ticks,
    trajectory,
    finalState,
    stateHash: hashState(finalState),
    nanCount: values.filter((value) => !Number.isFinite(value)).length,
    priceExplosions: trajectory.filter((entry) =>
      Object.values(entry.prices).some((price) => price > 50 || price < 0.02),
    ).length,
    illegalActionsSkipped: 0,
    deposedAt: deposedAt[path],
  }
}

/** Run the three passive causal paths. The normal path is pinned against
 * runOne in tests so a future engine epilogue cannot silently stale this fold. */
export function runExportFeedbackExperiment(options: {
  seed: string
  ticks: number
  params: CountryParams
}): ExportFeedbackExperiment {
  const { seed, ticks, params } = options
  let states = {
    normal: init(params, seed),
    neutralExports: init(params, seed),
    habitClamped: init(params, seed),
    householdClamped: init(params, seed),
  } satisfies PathStates
  for (const path of PATHS) assertFixedSpendingRules(states[path])

  const trajectories: PathTrajectories = {
    normal: [],
    neutralExports: [],
    habitClamped: [],
    householdClamped: [],
  }
  const deposedAt: Record<ExportFeedbackPath, number | null> = {
    normal: null,
    neutralExports: null,
    habitClamped: null,
    householdClamped: null,
  }

  for (let tick = 0; tick < ticks; tick++) {
    const before = states
    states = advancePaths(states)
    for (const path of PATHS) {
      const entry = trajectoryPoint(states[path], eventsBetween(before[path], states[path]))
      trajectories[path].push(entry)
      if (deposedAt[path] === null && !entry.inPower) deposedAt[path] = entry.tick
    }
  }

  return {
    seed,
    params,
    normal: resultFor('normal', seed, params, ticks, states, trajectories, deposedAt),
    neutralExports: resultFor(
      'neutralExports', seed, params, ticks, states, trajectories, deposedAt,
    ),
    habitClamped: resultFor(
      'habitClamped', seed, params, ticks, states, trajectories, deposedAt,
    ),
    householdClamped: resultFor(
      'householdClamped', seed, params, ticks, states, trajectories, deposedAt,
    ),
  }
}

function annualizedGrowth(previous: number, current: number): number {
  if (previous <= 0 || current < 0) return Number.NaN
  return (Math.pow(current / previous, 4) - 1) * 100
}

interface LocatedContraction {
  experiment: ExportFeedbackExperiment
  tick: number
  partnerDemandGrowth: number
}

function pathMap(
  experiment: ExportFeedbackExperiment,
  path: ExportFeedbackPath,
): Map<number, TrajectoryPoint> {
  return new Map(experiment[path].trajectory.map((entry) => [entry.tick, entry]))
}

function commonLastTick(experiment: ExportFeedbackExperiment): number {
  return Math.min(...PATHS.map((path) => {
    const run = experiment[path]
    return run.deposedAt ?? run.trajectory.at(-1)?.tick ?? 0
  }))
}

function eventOnsets(experiment: ExportFeedbackExperiment): number[] {
  const onsets = new Set<number>()
  for (const path of PATHS) {
    for (const point of experiment[path].trajectory) {
      if (point.events.length > 0) onsets.add(point.tick)
    }
  }
  return [...onsets]
}

function isQuiet(tick: number, onsets: readonly number[]): boolean {
  return !onsets.some(
    (onset) => tick >= onset && tick <= onset + SHOCK_EXCLUSION_QTRS,
  )
}

function inEra(tick: number, era: StabilityEra): boolean {
  return tick >= era.firstTick && tick <= era.lastTick
}

function contractionCandidates(
  experiments: readonly ExportFeedbackExperiment[],
  era: StabilityEra,
): LocatedContraction[] {
  const candidates: LocatedContraction[] = []
  for (const experiment of experiments) {
    const normal = pathMap(experiment, 'normal')
    const onsets = eventOnsets(experiment)
    const lastTick = commonLastTick(experiment)
    for (const point of experiment.normal.trajectory) {
      const previous = normal.get(point.tick - 1)
      if (
        point.tick > lastTick ||
        !previous ||
        !inEra(point.tick, era) ||
        !isQuiet(point.tick, onsets)
      ) continue
      const partnerDemandGrowth = annualizedGrowth(
        previous.drivers.partnerDemand,
        point.drivers.partnerDemand,
      )
      if (Number.isFinite(partnerDemandGrowth)) {
        candidates.push({ experiment, tick: point.tick, partnerDemandGrowth })
      }
    }
  }
  return candidates
}

interface EffectObservation {
  partnerDemandGrowth: number
  normalGrowth: number
  neutralGrowth: number
  habitClampedGrowth: number
  householdClampedGrowth: number
  totalExportEffect: number
  nonHouseholdEffect: number
  otherHouseholdEffect: number
  habitualIncomeFeedbackEffect: number
  householdFeedbackEffect: number
  normalHouseholdGrowth: number
  neutralHouseholdGrowth: number
  habitClampedHouseholdGrowth: number
  householdClampedHouseholdGrowth: number
}

function effectObservation(
  contraction: LocatedContraction,
  horizon: number,
  era: StabilityEra,
): EffectObservation | null {
  const { experiment } = contraction
  const tick = contraction.tick + horizon
  if (!inEra(tick, era) || tick > commonLastTick(experiment)) return null
  if (!isQuiet(tick, eventOnsets(experiment))) return null

  const points = {} as Record<ExportFeedbackPath, TrajectoryPoint>
  const previous = {} as Record<ExportFeedbackPath, TrajectoryPoint>
  for (const path of PATHS) {
    const byTick = pathMap(experiment, path)
    const currentPoint = byTick.get(tick)
    const previousPoint = byTick.get(tick - 1)
    if (!currentPoint || !previousPoint) return null
    points[path] = currentPoint
    previous[path] = previousPoint
  }

  const normalGrowth = annualizedGrowth(previous.normal.realGdp, points.normal.realGdp)
  const neutralGrowth = annualizedGrowth(
    previous.neutralExports.realGdp,
    points.neutralExports.realGdp,
  )
  const habitClampedGrowth = annualizedGrowth(
    previous.habitClamped.realGdp,
    points.habitClamped.realGdp,
  )
  const householdClampedGrowth = annualizedGrowth(
    previous.householdClamped.realGdp,
    points.householdClamped.realGdp,
  )
  const normalHouseholdGrowth = annualizedGrowth(
    previous.normal.drivers.householdDemand,
    points.normal.drivers.householdDemand,
  )
  const neutralHouseholdGrowth = annualizedGrowth(
    previous.neutralExports.drivers.householdDemand,
    points.neutralExports.drivers.householdDemand,
  )
  const habitClampedHouseholdGrowth = annualizedGrowth(
    previous.habitClamped.drivers.householdDemand,
    points.habitClamped.drivers.householdDemand,
  )
  const householdClampedHouseholdGrowth = annualizedGrowth(
    previous.householdClamped.drivers.householdDemand,
    points.householdClamped.drivers.householdDemand,
  )
  const values = [
    normalGrowth,
    neutralGrowth,
    habitClampedGrowth,
    householdClampedGrowth,
    normalHouseholdGrowth,
    neutralHouseholdGrowth,
    habitClampedHouseholdGrowth,
    householdClampedHouseholdGrowth,
  ]
  if (values.some((value) => !Number.isFinite(value))) return null

  return {
    partnerDemandGrowth: contraction.partnerDemandGrowth,
    normalGrowth,
    neutralGrowth,
    habitClampedGrowth,
    householdClampedGrowth,
    totalExportEffect: normalGrowth - neutralGrowth,
    nonHouseholdEffect: householdClampedGrowth - neutralGrowth,
    otherHouseholdEffect: habitClampedGrowth - householdClampedGrowth,
    habitualIncomeFeedbackEffect: normalGrowth - habitClampedGrowth,
    householdFeedbackEffect: normalGrowth - householdClampedGrowth,
    normalHouseholdGrowth,
    neutralHouseholdGrowth,
    habitClampedHouseholdGrowth,
    householdClampedHouseholdGrowth,
  }
}

function summarizeObservations(
  observations: readonly EffectObservation[],
  horizon: number,
): ExportFeedbackHorizon {
  const summary = (key: keyof EffectObservation): TailSummary =>
    summarizeTails(observations.map((observation) => observation[key]))
  return {
    horizon,
    observations: observations.length,
    partnerDemandGrowth: summary('partnerDemandGrowth'),
    normalGrowth: summary('normalGrowth'),
    neutralGrowth: summary('neutralGrowth'),
    habitClampedGrowth: summary('habitClampedGrowth'),
    householdClampedGrowth: summary('householdClampedGrowth'),
    totalExportEffect: summary('totalExportEffect'),
    nonHouseholdEffect: summary('nonHouseholdEffect'),
    otherHouseholdEffect: summary('otherHouseholdEffect'),
    habitualIncomeFeedbackEffect: summary('habitualIncomeFeedbackEffect'),
    householdFeedbackEffect: summary('householdFeedbackEffect'),
    normalHouseholdGrowth: summary('normalHouseholdGrowth'),
    neutralHouseholdGrowth: summary('neutralHouseholdGrowth'),
    habitClampedHouseholdGrowth: summary('habitClampedHouseholdGrowth'),
    householdClampedHouseholdGrowth: summary('householdClampedHouseholdGrowth'),
  }
}

/** Condition on the worst 5% of quiet partner-demand growth in each era, then
 * compare same-seed response paths through the following two years. */
export function analyzeExportFeedback(
  experiments: readonly ExportFeedbackExperiment[],
): ExportFeedbackReport {
  return {
    runs: experiments.length,
    eras: STABILITY_ERAS.map((era) => {
      const candidates = contractionCandidates(experiments, era)
      const contractionCutoff = summarizeTails(
        candidates.map((candidate) => candidate.partnerDemandGrowth),
      ).p05
      const contractions = candidates.filter(
        (candidate) => candidate.partnerDemandGrowth <= contractionCutoff,
      )
      return {
        era,
        quietObservations: candidates.length,
        contractionCutoff,
        contractionOnsets: contractions.length,
        horizons: RESPONSE_HORIZONS.map((horizon) => summarizeObservations(
          contractions
            .map((contraction) => effectObservation(contraction, horizon, era))
            .filter((observation): observation is EffectObservation => observation !== null),
          horizon,
        )),
      }
    }),
  }
}
