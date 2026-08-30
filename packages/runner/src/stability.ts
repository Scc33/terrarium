/** Long-horizon macro diagnostics, kept pure so the definitions themselves
 * can be pinned independently of a large stochastic sweep. */

import { END_OF_HISTORY_TICK } from '@terrarium/engine'
import { quantile } from './metrics'
import type { MacroEvent, RunResult, TrajectoryPoint } from './run'

export interface StabilityEra {
  id: 'postwar' | 'late_century' | 'early_2000s' | 'future'
  label: string
  firstTick: number
  lastTick: number
}

export const STABILITY_ERAS: readonly StabilityEra[] = [
  // The first decade is initialization convergence, already pinned exactly by
  // the goldens. Start the balance comparison once that opening has settled.
  { id: 'postwar', label: '1956-1972', firstTick: 40, lastTick: 107 },
  { id: 'late_century', label: '1973-1999', firstTick: 108, lastTick: 215 },
  { id: 'early_2000s', label: '2000-2025', firstTick: 216, lastTick: 319 },
  { id: 'future', label: '2026-2050', firstTick: 320, lastTick: END_OF_HISTORY_TICK },
] as const

export const MACRO_EVENTS: readonly MacroEvent[] = [
  'drought',
  'fuel',
  'banking_crisis',
  'world_crisis',
]
/** A supply/finance rupture can dominate several annualized quarterly prints.
 * Quiet-quarter tails exclude the onset and the following two years so the
 * harness can distinguish background instability from a shock response. */
export const SHOCK_EXCLUSION_QTRS = 8

export interface StabilityRun {
  seed: string
  countryId: RunResult['countryId']
  trajectory: TrajectoryPoint[]
  deposedAt: number | null
  priceExplosions: number
}

export interface TailSummary {
  count: number
  min: number
  p01: number
  p05: number
  p50: number
  p95: number
  p99: number
  max: number
  mean: number
}

export interface EraStability {
  era: StabilityEra
  runsEntered: number
  quarters: number
  quietQuarters: number
  inflation: TailSummary
  realGrowth: TailSummary
  quietInflation: TailSummary
  quietRealGrowth: TailSummary
  publishedInflation: TailSummary
  publishedRealGrowth: TailSummary
  publishedHumanDevelopment: TailSummary
  quietPublishedInflation: TailSummary
  quietPublishedRealGrowth: TailSummary
  unemployment: TailSummary
  quietDrivers: QuietDriverSummary
}

export interface QuietDriverSummary {
  observations: number
  aggregateLogGrowth: TailSummary
  realGdpPerCapitaGrowth: TailSummary
  realGdpPerCapitaContribution: TailSummary
  populationGrowth: TailSummary
  populationContribution: TailSummary
  laborProductivityGrowth: TailSummary
  laborProductivityContribution: TailSummary
  employmentGrowth: TailSummary
  employmentRateContribution: TailSummary
  laborForceGrowth: TailSummary
  laborForceContribution: TailSummary
  laborForceShareContribution: TailSummary
  realWageGrowth: TailSummary
  tfpGrowth: TailSummary
  utilization: TailSummary
  utilizationChange: TailSummary
  demandSatisfaction: TailSummary
  investmentRate: TailSummary
  finalDemandGrowth: TailSummary
  householdDemandGrowth: TailSummary
  investmentGrowth: TailSummary
  governmentDemandGrowth: TailSummary
  exportGrowth: TailSummary
  exportShare: TailSummary
  householdShare: TailSummary
  laborContraction: QuietLaborContractionSummary
  downside: QuietDownsideSummary
}

export interface QuietLaborContractionSummary {
  observations: number
  laborForceGrowth: TailSummary
  aggregateLogGrowth: TailSummary
  realGdpPerCapitaContribution: TailSummary
  populationContribution: TailSummary
  laborProductivityContribution: TailSummary
  employmentRateContribution: TailSummary
  laborForceShareContribution: TailSummary
}

export interface QuietDownsideSummary {
  observations: number
  growthCutoff: number
  realGrowth: TailSummary
  aggregateLogGrowth: TailSummary
  realGdpPerCapitaGrowth: TailSummary
  realGdpPerCapitaContribution: TailSummary
  populationGrowth: TailSummary
  populationContribution: TailSummary
  laborProductivityContribution: TailSummary
  employmentContribution: TailSummary
  employmentRateContribution: TailSummary
  laborForceContribution: TailSummary
  laborForceShareContribution: TailSummary
  tfpGrowth: TailSummary
  laborForceGrowth: TailSummary
  realWageGrowth: TailSummary
  utilizationChange: TailSummary
  demandSatisfaction: TailSummary
  investmentRate: TailSummary
  finalDemandGrowth: TailSummary
  householdDemandGrowth: TailSummary
  investmentGrowth: TailSummary
  governmentDemandGrowth: TailSummary
  exportGrowth: TailSummary
  exportShare: TailSummary
  householdShare: TailSummary
}

export interface ShockStability {
  era: StabilityEra
  event: MacroEvent
  onsets: number
  completeWindows: number
  peakInflation: TailSummary
  laterInflationTrough: TailSummary
  reboundGrowth: TailSummary
}

export interface StabilityReport {
  runs: number
  survivorTrend: SurvivorTrendSummary
  rawPriceExplosionRuns: string[]
  reachablePriceExplosionRuns: string[]
  reachableNonFiniteRuns: string[]
  eras: EraStability[]
  shocks: ShockStability[]
}

export interface SurvivorTrendSummary {
  survivors: number
  aggregateCagr: TailSummary
  realGdpPerCapitaCagr: TailSummary
  populationCagr: TailSummary
  aggregateLogGrowth: TailSummary
  realGdpPerCapitaLogGrowth: TailSummary
  populationLogGrowth: TailSummary
}

interface MacroReading {
  tick: number
  inflation: number
  realGrowth: number
  unemployment: number
  publishedInflation: number
  publishedRealGrowth: number
  publishedHumanDevelopment: number
  events: readonly MacroEvent[]
  point: TrajectoryPoint
  previous: TrajectoryPoint | undefined
}

export function summarizeTails(values: readonly number[]): TailSummary {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b)
  return {
    count: finite.length,
    min: finite[0] ?? NaN,
    p01: quantile(finite, 0.01),
    p05: quantile(finite, 0.05),
    p50: quantile(finite, 0.5),
    p95: quantile(finite, 0.95),
    p99: quantile(finite, 0.99),
    max: finite[finite.length - 1] ?? NaN,
    mean: finite.reduce((sum, value) => sum + value, 0) / Math.max(finite.length, 1),
  }
}

/** runOne keeps simulating after the government falls so engine failures remain
 * observable. Balance statistics stop on the quarter of deposition: anything
 * later is no longer a state a player can reach. */
export function playableTrajectory(run: StabilityRun): TrajectoryPoint[] {
  if (run.deposedAt === null) return run.trajectory
  return run.trajectory.filter((point) => point.tick <= run.deposedAt!)
}

function hasNonFinite(point: TrajectoryPoint): boolean {
  const values = [
    point.realGdp,
    point.nominalGdp,
    point.inflationQ,
    point.unemployment,
    ...Object.values(point.prices),
  ]
  if (point.publishedInflation !== null) values.push(point.publishedInflation)
  if (point.publishedRealGrowth !== null) values.push(point.publishedRealGrowth)
  if (point.publishedHumanDevelopment !== null) values.push(point.publishedHumanDevelopment)
  return values.some((value) => !Number.isFinite(value))
}

function hasPriceExplosion(point: TrajectoryPoint): boolean {
  return Object.values(point.prices).some((price) => price > 50 || price < 0.02)
}

function annualizedGrowth(previous: TrajectoryPoint | undefined, point: TrajectoryPoint): number {
  if (
    !previous ||
    point.tick !== previous.tick + 1 ||
    previous.realGdp <= 0 ||
    point.realGdp < 0
  ) return NaN
  return (Math.pow(point.realGdp / previous.realGdp, 4) - 1) * 100
}

function annualizedLevelGrowth(previous: number, current: number): number {
  if (previous <= 0 || current < 0) return NaN
  return (Math.pow(current / previous, 4) - 1) * 100
}

/** Additive contribution to annualized log growth. Productivity and
 * employment contributions sum exactly to log GDP growth because
 * GDP = output per worker × employment. */
function annualizedLogContribution(previous: number, current: number): number {
  if (previous <= 0 || current <= 0) return NaN
  return Math.log(current / previous) * 400
}

function macroReadings(run: StabilityRun): MacroReading[] {
  const playable = playableTrajectory(run)
  return playable.map((point, index) => ({
    tick: point.tick,
    inflation: point.inflationQ * 400,
    realGrowth: annualizedGrowth(playable[index - 1], point),
    unemployment: point.unemployment * 100,
    publishedInflation: point.publishedInflation ?? NaN,
    publishedRealGrowth: point.publishedRealGrowth ?? NaN,
    publishedHumanDevelopment: point.publishedHumanDevelopment ?? NaN,
    events: point.events ?? [],
    point,
    previous: playable[index - 1],
  }))
}

function inEra(tick: number, era: StabilityEra): boolean {
  return tick >= era.firstTick && tick <= era.lastTick
}

function quietReadings(readings: readonly MacroReading[]): MacroReading[] {
  const onsets = readings
    .filter((point) => point.events.length > 0)
    .map((point) => point.tick)
  return readings.filter(
    (point) => !onsets.some(
      (onset) => point.tick >= onset && point.tick <= onset + SHOCK_EXCLUSION_QTRS,
    ),
  )
}

interface DriverReading {
  realGrowth: number
  aggregateLogGrowth: number
  realGdpPerCapitaGrowth: number
  realGdpPerCapitaContribution: number
  populationGrowth: number
  populationContribution: number
  laborProductivityGrowth: number
  employmentGrowth: number
  laborForceGrowth: number
  realWageGrowth: number
  laborProductivityContribution: number
  employmentContribution: number
  employmentRateContribution: number
  laborForceContribution: number
  laborForceShareContribution: number
  tfpGrowth: number
  utilization: number
  utilizationChange: number
  demandSatisfaction: number
  investmentRate: number
  finalDemandGrowth: number
  householdDemandGrowth: number
  investmentGrowth: number
  governmentDemandGrowth: number
  exportGrowth: number
  exportShare: number
  householdShare: number
}

function driverReading(reading: MacroReading): DriverReading | null {
  const previous = reading.previous
  if (!previous || reading.point.tick !== previous.tick + 1) return null
  const drivers = reading.point.drivers
  const prior = previous.drivers
  const perCapita = reading.point.realGdp / Math.max(drivers.population, 1e-9)
  const priorPerCapita = previous.realGdp / Math.max(prior.population, 1e-9)
  const employmentRate = drivers.employment / Math.max(drivers.laborForce, 1e-9)
  const priorEmploymentRate = prior.employment / Math.max(prior.laborForce, 1e-9)
  const laborForceShare = drivers.laborForce / Math.max(drivers.population, 1e-9)
  const priorLaborForceShare = prior.laborForce / Math.max(prior.population, 1e-9)
  return {
    realGrowth: reading.realGrowth,
    aggregateLogGrowth: annualizedLogContribution(previous.realGdp, reading.point.realGdp),
    realGdpPerCapitaGrowth: annualizedLevelGrowth(priorPerCapita, perCapita),
    realGdpPerCapitaContribution: annualizedLogContribution(priorPerCapita, perCapita),
    populationGrowth: annualizedLevelGrowth(prior.population, drivers.population),
    populationContribution: annualizedLogContribution(prior.population, drivers.population),
    laborProductivityGrowth: annualizedLevelGrowth(
      prior.laborProductivity,
      drivers.laborProductivity,
    ),
    employmentGrowth: annualizedLevelGrowth(prior.employment, drivers.employment),
    laborForceGrowth: annualizedLevelGrowth(prior.laborForce, drivers.laborForce),
    realWageGrowth: annualizedLevelGrowth(prior.realWage, drivers.realWage),
    laborProductivityContribution: annualizedLogContribution(
      prior.laborProductivity,
      drivers.laborProductivity,
    ),
    employmentContribution: annualizedLogContribution(prior.employment, drivers.employment),
    employmentRateContribution: annualizedLogContribution(
      priorEmploymentRate,
      employmentRate,
    ),
    laborForceContribution: annualizedLogContribution(prior.laborForce, drivers.laborForce),
    laborForceShareContribution: annualizedLogContribution(
      priorLaborForceShare,
      laborForceShare,
    ),
    tfpGrowth: annualizedLevelGrowth(1, 1 + drivers.tfpGrowthQ),
    utilization: drivers.utilization * 100,
    utilizationChange: (drivers.utilization - prior.utilization) * 100,
    demandSatisfaction: drivers.demandSatisfaction * 100,
    investmentRate: drivers.investmentRate * 100,
    finalDemandGrowth: annualizedLevelGrowth(prior.finalDemand, drivers.finalDemand),
    householdDemandGrowth: annualizedLevelGrowth(prior.householdDemand, drivers.householdDemand),
    investmentGrowth: annualizedLevelGrowth(prior.investment, drivers.investment),
    governmentDemandGrowth: annualizedLevelGrowth(
      prior.governmentDemand,
      drivers.governmentDemand,
    ),
    exportGrowth: annualizedLevelGrowth(prior.exports, drivers.exports),
    exportShare: (drivers.exports / Math.max(drivers.finalDemand, 1e-9)) * 100,
    householdShare: (drivers.householdDemand / Math.max(drivers.finalDemand, 1e-9)) * 100,
  }
}

function driverSummary(readings: readonly MacroReading[]): QuietDriverSummary {
  const points = readings.map(driverReading).filter((point): point is DriverReading => point !== null)
  const growthCutoff = summarizeTails(points.map((point) => point.realGrowth)).p05
  const downside = points.filter((point) => point.realGrowth <= growthCutoff)
  const laborContraction = points.filter((point) => point.laborForceGrowth < 0)
  const tails = (key: keyof DriverReading, sample: readonly DriverReading[] = points) =>
    summarizeTails(sample.map((point) => point[key]))
  return {
    observations: points.length,
    aggregateLogGrowth: tails('aggregateLogGrowth'),
    realGdpPerCapitaGrowth: tails('realGdpPerCapitaGrowth'),
    realGdpPerCapitaContribution: tails('realGdpPerCapitaContribution'),
    populationGrowth: tails('populationGrowth'),
    populationContribution: tails('populationContribution'),
    laborProductivityGrowth: tails('laborProductivityGrowth'),
    laborProductivityContribution: tails('laborProductivityContribution'),
    employmentGrowth: tails('employmentGrowth'),
    employmentRateContribution: tails('employmentRateContribution'),
    laborForceGrowth: tails('laborForceGrowth'),
    laborForceContribution: tails('laborForceContribution'),
    laborForceShareContribution: tails('laborForceShareContribution'),
    realWageGrowth: tails('realWageGrowth'),
    tfpGrowth: tails('tfpGrowth'),
    utilization: tails('utilization'),
    utilizationChange: tails('utilizationChange'),
    demandSatisfaction: tails('demandSatisfaction'),
    investmentRate: tails('investmentRate'),
    finalDemandGrowth: tails('finalDemandGrowth'),
    householdDemandGrowth: tails('householdDemandGrowth'),
    investmentGrowth: tails('investmentGrowth'),
    governmentDemandGrowth: tails('governmentDemandGrowth'),
    exportGrowth: tails('exportGrowth'),
    exportShare: tails('exportShare'),
    householdShare: tails('householdShare'),
    laborContraction: {
      observations: laborContraction.length,
      laborForceGrowth: tails('laborForceGrowth', laborContraction),
      aggregateLogGrowth: tails('aggregateLogGrowth', laborContraction),
      realGdpPerCapitaContribution: tails(
        'realGdpPerCapitaContribution',
        laborContraction,
      ),
      populationContribution: tails('populationContribution', laborContraction),
      laborProductivityContribution: tails(
        'laborProductivityContribution',
        laborContraction,
      ),
      employmentRateContribution: tails('employmentRateContribution', laborContraction),
      laborForceShareContribution: tails(
        'laborForceShareContribution',
        laborContraction,
      ),
    },
    downside: {
      observations: downside.length,
      growthCutoff,
      realGrowth: tails('realGrowth', downside),
      aggregateLogGrowth: tails('aggregateLogGrowth', downside),
      realGdpPerCapitaGrowth: tails('realGdpPerCapitaGrowth', downside),
      realGdpPerCapitaContribution: tails('realGdpPerCapitaContribution', downside),
      populationGrowth: tails('populationGrowth', downside),
      populationContribution: tails('populationContribution', downside),
      laborProductivityContribution: tails('laborProductivityContribution', downside),
      employmentContribution: tails('employmentContribution', downside),
      employmentRateContribution: tails('employmentRateContribution', downside),
      laborForceContribution: tails('laborForceContribution', downside),
      laborForceShareContribution: tails('laborForceShareContribution', downside),
      tfpGrowth: tails('tfpGrowth', downside),
      laborForceGrowth: tails('laborForceGrowth', downside),
      realWageGrowth: tails('realWageGrowth', downside),
      utilizationChange: tails('utilizationChange', downside),
      demandSatisfaction: tails('demandSatisfaction', downside),
      investmentRate: tails('investmentRate', downside),
      finalDemandGrowth: tails('finalDemandGrowth', downside),
      householdDemandGrowth: tails('householdDemandGrowth', downside),
      investmentGrowth: tails('investmentGrowth', downside),
      governmentDemandGrowth: tails('governmentDemandGrowth', downside),
      exportGrowth: tails('exportGrowth', downside),
      exportShare: tails('exportShare', downside),
      householdShare: tails('householdShare', downside),
    },
  }
}

function eraReport(
  readingsByRun: readonly MacroReading[][],
  quietByRun: readonly MacroReading[][],
  era: StabilityEra,
): EraStability {
  const entered = readingsByRun.map((readings) => readings.filter((point) => inEra(point.tick, era)))
  const points = entered.flat()
  const quiet = quietByRun.flatMap((readings) => readings.filter((point) => inEra(point.tick, era)))
  return {
    era,
    runsEntered: entered.filter((readings) => readings.length > 0).length,
    quarters: points.length,
    quietQuarters: quiet.length,
    inflation: summarizeTails(points.map((point) => point.inflation)),
    realGrowth: summarizeTails(points.map((point) => point.realGrowth)),
    quietInflation: summarizeTails(quiet.map((point) => point.inflation)),
    quietRealGrowth: summarizeTails(quiet.map((point) => point.realGrowth)),
    publishedInflation: summarizeTails(points.map((point) => point.publishedInflation)),
    publishedRealGrowth: summarizeTails(points.map((point) => point.publishedRealGrowth)),
    publishedHumanDevelopment: summarizeTails(
      points.map((point) => point.publishedHumanDevelopment),
    ),
    quietPublishedInflation: summarizeTails(quiet.map((point) => point.publishedInflation)),
    quietPublishedRealGrowth: summarizeTails(quiet.map((point) => point.publishedRealGrowth)),
    unemployment: summarizeTails(points.map((point) => point.unemployment)),
    quietDrivers: driverSummary(quiet),
  }
}

function shockReport(
  readingsByRun: readonly MacroReading[][],
  era: StabilityEra,
  event: MacroEvent,
): ShockStability {
  const peaks: number[] = []
  const troughs: number[] = []
  const rebounds: number[] = []
  let onsets = 0
  let completeWindows = 0

  for (const readings of readingsByRun) {
    for (const onset of readings.filter((point) => inEra(point.tick, era) && point.events.includes(event))) {
      onsets++
      const immediate = readings.filter(
        (point) => point.tick >= onset.tick && point.tick <= onset.tick + 2,
      )
      const recovery = readings.filter(
        (point) => point.tick >= onset.tick + 1 && point.tick <= onset.tick + 8,
      )
      if (immediate.length < 3 || recovery.length < 8) continue
      completeWindows++
      peaks.push(Math.max(...immediate.map((point) => point.inflation)))
      troughs.push(Math.min(...recovery.map((point) => point.inflation)))
      rebounds.push(Math.max(...recovery.map((point) => point.realGrowth).filter(Number.isFinite)))
    }
  }

  return {
    era,
    event,
    onsets,
    completeWindows,
    peakInflation: summarizeTails(peaks),
    laterInflationTrough: summarizeTails(troughs),
    reboundGrowth: summarizeTails(rebounds),
  }
}

interface RunTrend {
  aggregateCagr: number
  realGdpPerCapitaCagr: number
  populationCagr: number
  aggregateLogGrowth: number
  realGdpPerCapitaLogGrowth: number
  populationLogGrowth: number
}

function annualizedTrend(previous: number, current: number, years: number): number {
  if (years <= 0 || previous <= 0 || current <= 0) return Number.NaN
  return (Math.pow(current / previous, 1 / years) - 1) * 100
}

function annualizedLogTrend(previous: number, current: number, years: number): number {
  if (years <= 0 || previous <= 0 || current <= 0) return Number.NaN
  return (Math.log(current / previous) / years) * 100
}

function runTrend(run: StabilityRun): RunTrend | null {
  if (run.deposedAt !== null) return null
  const first = run.trajectory[0]
  const last = run.trajectory.at(-1)
  if (!first || !last) return null
  const years = (last.tick - first.tick) / 4
  const firstPerCapita = first.realGdp / Math.max(first.drivers.population, 1e-9)
  const lastPerCapita = last.realGdp / Math.max(last.drivers.population, 1e-9)
  return {
    aggregateCagr: annualizedTrend(first.realGdp, last.realGdp, years),
    realGdpPerCapitaCagr: annualizedTrend(firstPerCapita, lastPerCapita, years),
    populationCagr: annualizedTrend(
      first.drivers.population,
      last.drivers.population,
      years,
    ),
    aggregateLogGrowth: annualizedLogTrend(first.realGdp, last.realGdp, years),
    realGdpPerCapitaLogGrowth: annualizedLogTrend(firstPerCapita, lastPerCapita, years),
    populationLogGrowth: annualizedLogTrend(
      first.drivers.population,
      last.drivers.population,
      years,
    ),
  }
}

function survivorTrend(runs: readonly StabilityRun[]): SurvivorTrendSummary {
  const trends = runs.map(runTrend).filter((trend): trend is RunTrend => trend !== null)
  const tails = (key: keyof RunTrend) => summarizeTails(trends.map((trend) => trend[key]))
  return {
    survivors: trends.length,
    aggregateCagr: tails('aggregateCagr'),
    realGdpPerCapitaCagr: tails('realGdpPerCapitaCagr'),
    populationCagr: tails('populationCagr'),
    aggregateLogGrowth: tails('aggregateLogGrowth'),
    realGdpPerCapitaLogGrowth: tails('realGdpPerCapitaLogGrowth'),
    populationLogGrowth: tails('populationLogGrowth'),
  }
}

export function analyzeStability(runs: readonly StabilityRun[]): StabilityReport {
  const playableByRun = runs.map(playableTrajectory)
  const readingsByRun = runs.map(macroReadings)
  const quietByRun = readingsByRun.map(quietReadings)
  return {
    runs: runs.length,
    survivorTrend: survivorTrend(runs),
    rawPriceExplosionRuns: runs.filter((run) => run.priceExplosions > 0).map((run) => run.seed),
    reachablePriceExplosionRuns: runs
      .filter((_run, index) => playableByRun[index].some(hasPriceExplosion))
      .map((run) => run.seed),
    reachableNonFiniteRuns: runs
      .filter((_run, index) => playableByRun[index].some(hasNonFinite))
      .map((run) => run.seed),
    eras: STABILITY_ERAS.map((era) => eraReport(readingsByRun, quietByRun, era)),
    shocks: STABILITY_ERAS.flatMap((era) =>
      MACRO_EVENTS.map((event) => shockReport(readingsByRun, era, event)),
    ),
  }
}
