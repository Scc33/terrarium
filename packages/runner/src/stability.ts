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

export const MACRO_EVENTS: readonly MacroEvent[] = ['drought', 'fuel', 'banking_crisis']
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
  quietPublishedInflation: TailSummary
  quietPublishedRealGrowth: TailSummary
  unemployment: TailSummary
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
  rawPriceExplosionRuns: string[]
  reachablePriceExplosionRuns: string[]
  reachableNonFiniteRuns: string[]
  eras: EraStability[]
  shocks: ShockStability[]
}

interface MacroReading {
  tick: number
  inflation: number
  realGrowth: number
  unemployment: number
  publishedInflation: number
  publishedRealGrowth: number
  events: readonly MacroEvent[]
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

function macroReadings(run: StabilityRun): MacroReading[] {
  const playable = playableTrajectory(run)
  return playable.map((point, index) => ({
    tick: point.tick,
    inflation: point.inflationQ * 400,
    realGrowth: annualizedGrowth(playable[index - 1], point),
    unemployment: point.unemployment * 100,
    publishedInflation: point.publishedInflation ?? NaN,
    publishedRealGrowth: point.publishedRealGrowth ?? NaN,
    events: point.events ?? [],
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
    quietPublishedInflation: summarizeTails(quiet.map((point) => point.publishedInflation)),
    quietPublishedRealGrowth: summarizeTails(quiet.map((point) => point.publishedRealGrowth)),
    unemployment: summarizeTails(points.map((point) => point.unemployment)),
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

export function analyzeStability(runs: readonly StabilityRun[]): StabilityReport {
  const playableByRun = runs.map(playableTrajectory)
  const readingsByRun = runs.map(macroReadings)
  const quietByRun = readingsByRun.map(quietReadings)
  return {
    runs: runs.length,
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
