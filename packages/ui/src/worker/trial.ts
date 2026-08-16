/**
 * The feasibility study — `pnpm batch`, in the browser, for a country nobody
 * has ever run.
 *
 * Terrarium's own balance discipline is that you do not know what a change does
 * until you have run a lot of centuries of it (ADR-0008). A player who writes a
 * country is doing exactly what a developer does when they move a constant, so
 * they get the same instrument rather than a reassuring green tick.
 *
 * Three decisions:
 *
 * 1. **Passive policy only.** Nobody governs during a trial. That is the
 *    baseline the repo already treats as an economy fact, it needs no
 *    government-behaviour model in the browser, and "this country falls apart
 *    even when left alone" is the single most useful thing an author can learn.
 *    The runner's random-policy matrix stays where it is — reimplementing
 *    `randomPolicy` here would be a second, drifting definition of how a
 *    thoughtless government behaves.
 *
 * 2. **Every study runs a reference country on the identical seeds.** A median
 *    growth rate of 2.4% means nothing on its own. Beside Meridia's 2.8% on the
 *    same seeds, same rules, same quarter count, it means something. Computing
 *    the reference live rather than baking in a table also means it can never
 *    go stale against a retune.
 *
 * 3. **The metric definitions are the runner's, verbatim.** `growth`,
 *    `inflation`, `unemployment` and the two failure modes are copied from
 *    `packages/runner/src/{metrics,run}.ts` because `packages/ui` must not
 *    depend on a node CLI package. Copies drift, so `tests/ui/trial.test.ts`
 *    pins this module against `runOne` on identical inputs — if either side
 *    moves, that test fails by name.
 *
 * There is deliberately no pass/fail verdict and no difficulty grade. 400
 * parameter vectors sampled across the validator's whole legal box produced
 * zero NaN and only slow, late relative-price drift, so a gate would reject
 * almost nothing while implying an authority this study does not have.
 */

import {
  END_OF_HISTORY_TICK,
  SECTOR_IDS,
  createCountryParams,
  init,
  step,
  type CountryParams,
  type TrueState,
} from '@terrarium/engine'

/** Seeds per leg. Nine reproduces the published country matrix to within a few
 * tenths while keeping a study under about two seconds on the worker thread. */
export const TRIAL_SEEDS = 9
/** A century, because the tails are where an authored country goes wrong: the
 * price drifts that trip the tripwire cluster around quarter 95 and later. */
export const TRIAL_TICKS = END_OF_HISTORY_TICK
/** The country every study is read against. */
export const TRIAL_REFERENCE = 'meridia' as const

export interface TrialBand {
  p25: number
  p50: number
  p75: number
}

export type TrialFailure = 'nan' | 'price'

export interface TrialLeg {
  /** the country's own name, for the report's row heading */
  country: string
  seeds: number
  ticks: number
  /** annualized real growth, %/yr */
  growth: TrialBand
  /** mean annualized inflation, % */
  inflation: TrialBand
  /** mean unemployment, % */
  unemployment: TrialBand
  /** share of runs whose government fell without anyone governing */
  deposedShare: number
  /** median quarter of the fall, over the runs that fell */
  medianDeposedAt: number | null
  /** runs tripping the batch runner's own failure definitions */
  brokenRuns: number
  firstFailure: { seed: string; tick: number; kind: TrialFailure } | null
}

export interface TrialReport {
  candidate: TrialLeg
  reference: TrialLeg
  /** wall time of the whole study, so a slow country is visible as one */
  wallMs: number
}

export interface TrialProgress {
  done: number
  total: number
}

const quantile = (sorted: number[], q: number): number => {
  if (sorted.length === 0) return NaN
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

function band(values: number[]): TrialBand {
  const sorted = [...values].sort((a, b) => a - b)
  return { p25: quantile(sorted, 0.25), p50: quantile(sorted, 0.5), p75: quantile(sorted, 0.75) }
}

/** Reproducible from the report alone: the same draft studied twice gives the
 * same numbers, which is what makes iterating on a country meaningful. */
export const trialSeed = (base: string, index: number): string => `${base}:trial:${index}`

interface OneRun {
  growth: number
  inflation: number
  unemployment: number
  deposedAt: number | null
  failure: { tick: number; kind: TrialFailure } | null
}

/** One passive century. Mirrors `runOne` without retaining a trajectory —
 * the report needs four scalars, and 416 quarters × 9 seeds × 2 legs of
 * trajectory points is memory a browser tab should not spend. */
function runPassiveCentury(params: CountryParams, seed: string, ticks: number): OneRun {
  let s: TrueState = init(params, seed)
  const firstGdp = { value: 0, tick: 0 }
  let lastGdp = 0
  let lastTick = 0
  let inflationSum = 0
  let unemploymentSum = 0
  let points = 0
  let deposedAt: number | null = null
  let failure: OneRun['failure'] = null

  for (let t = 0; t < ticks; t++) {
    s = step(s)
    const prices = SECTOR_IDS.map((id) => s.market.prices[id])

    if (failure === null) {
      const finite = [s.flows.realGdp, s.flows.nominalGdp, s.flows.inflationQ, s.flows.unemployment, ...prices]
      if (finite.some((v) => !Number.isFinite(v))) failure = { tick: s.meta.tick, kind: 'nan' }
      else if (prices.some((p) => p > 50 || p < 0.02)) failure = { tick: s.meta.tick, kind: 'price' }
    }

    if (points === 0) {
      firstGdp.value = s.flows.realGdp
      firstGdp.tick = s.meta.tick
    }
    lastGdp = s.flows.realGdp
    lastTick = s.meta.tick
    inflationSum += s.flows.inflationQ
    unemploymentSum += s.flows.unemployment
    points++

    if (deposedAt === null && !s.politics.inPower) deposedAt = s.meta.tick
    // a NaN economy produces no further information, and stepping it on is
    // just a slower way to reach the same report
    if (failure?.kind === 'nan') break
  }

  const years = (lastTick - firstGdp.tick) / 4
  const growth =
    years <= 0 || firstGdp.value <= 0 || !Number.isFinite(lastGdp / firstGdp.value)
      ? 0
      : (Math.pow(lastGdp / firstGdp.value, 1 / years) - 1) * 100

  return {
    growth,
    inflation: (inflationSum / Math.max(points, 1)) * 4 * 100,
    unemployment: (unemploymentSum / Math.max(points, 1)) * 100,
    deposedAt,
    failure,
  }
}

function leg(
  params: CountryParams,
  baseSeed: string,
  seeds: number,
  ticks: number,
  onRun?: () => void,
): TrialLeg {
  const growth: number[] = []
  const inflation: number[] = []
  const unemployment: number[] = []
  const deposed: number[] = []
  let brokenRuns = 0
  let firstFailure: TrialLeg['firstFailure'] = null

  for (let i = 0; i < seeds; i++) {
    const seed = trialSeed(baseSeed, i)
    const run = runPassiveCentury(params, seed, ticks)
    growth.push(run.growth)
    inflation.push(run.inflation)
    unemployment.push(run.unemployment)
    if (run.deposedAt !== null) deposed.push(run.deposedAt)
    if (run.failure) {
      brokenRuns++
      if (firstFailure === null || run.failure.tick < firstFailure.tick) {
        firstFailure = { seed, tick: run.failure.tick, kind: run.failure.kind }
      }
    }
    onRun?.()
  }

  const fallen = [...deposed].sort((a, b) => a - b)
  return {
    country: params.name,
    seeds,
    ticks,
    growth: band(growth),
    inflation: band(inflation),
    unemployment: band(unemployment),
    deposedShare: deposed.length / Math.max(seeds, 1),
    medianDeposedAt: fallen.length ? quantile(fallen, 0.5) : null,
    brokenRuns,
    firstFailure,
  }
}

/**
 * Study a country. Runs the candidate and the reference on identical seeds so
 * every number on the report has something to be read against.
 *
 * `onProgress` fires after each century so a two-second wait can show what it
 * is doing rather than a spinner that could mean anything.
 */
export function runTrial(
  params: CountryParams,
  options: { seeds?: number; ticks?: number; baseSeed?: string; onProgress?: (p: TrialProgress) => void } = {},
): TrialReport {
  const seeds = options.seeds ?? TRIAL_SEEDS
  const ticks = options.ticks ?? TRIAL_TICKS
  const baseSeed = options.baseSeed ?? 'study'
  const started = performance.now()

  const total = seeds * 2
  let done = 0
  const tick = () => {
    done++
    options.onProgress?.({ done, total })
  }

  const candidate = leg(params, baseSeed, seeds, ticks, tick)
  // the reference is a fixed vector, so the seed argument is immaterial — but
  // the *trial* seeds are shared, which is the whole point of the comparison
  const reference = leg(createCountryParams(TRIAL_REFERENCE, baseSeed), baseSeed, seeds, ticks, tick)

  return { candidate, reference, wallMs: performance.now() - started }
}
