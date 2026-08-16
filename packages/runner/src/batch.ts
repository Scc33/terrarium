/**
 * Batch runner — the balance dashboard's data source and the M0 DoD probe:
 * N random-policy runs, wall time, NaN count, explosion count.
 *
 *   pnpm batch -- --runs 1000 --ticks 120 --policy random
 */

import {
  COUNTRY_CATALOG,
  type CountryScenarioId,
} from '@terrarium/engine'
import {
  runOne,
  runSummary,
  type RunOptions,
  type RunResult,
  type RunResultWithoutHash,
  type RunSummary,
} from './run'
import { cagr, meanAnnualInflation, meanUnemployment, summarize } from './metrics'
import { POLICY_IDS, policyFor, randomPolicy, type PolicyId } from './policies'
import { printReport } from './report'

export interface BatchResult<Run = BatchRunResult> {
  /** Detailed diagnostics may retain trajectories, but never another copy of
   * every run's final statistical-office archive. */
  runs: Run[]
  wallMs: number
}

export type BatchRunResult = Omit<RunResult, 'finalState'>
export type UnhashedBatchRunResult = Omit<RunResultWithoutHash, 'finalState'>
export type SummaryBatchResult = BatchResult<RunSummary>

export interface BatchOptions {
  runs: number
  ticks: number
  policy?: PolicyId
  seedPrefix?: string
  /** one scenario, or an even round-robin matrix over the full catalogue */
  country?: CountryScenarioId | 'baseline' | 'all'
}

function executeBatch<Run>(opts: BatchOptions, execute: (options: RunOptions) => Run): BatchResult<Run> {
  const start = performance.now()
  const runs: Run[] = []
  const requested = opts.country ?? 'baseline'
  const countries: Array<CountryScenarioId | 'baseline'> = requested === 'all'
    ? COUNTRY_CATALOG.map((profile) => profile.id)
    : [requested]
  for (let i = 0; i < opts.runs; i++) {
    const country = countries[i % countries.length]
    const sequence = Math.floor(i / countries.length)
    const seed = requested === 'all'
      ? `${opts.seedPrefix ?? 'batch'}-${country}-${sequence}`
      : `${opts.seedPrefix ?? 'batch'}-${i}`
    runs.push(execute({
      seed,
      ticks: opts.ticks,
      country: country === 'baseline' ? undefined : country,
      policy: policyFor(opts.policy ?? 'passive'),
    }))
  }
  return { runs, wallMs: performance.now() - start }
}

/** Detailed programmatic batch, including exact hashes and trajectories. */
export function runBatch(opts: BatchOptions): BatchResult {
  return executeBatch(opts, (options) => {
    const { finalState, ...run } = runOne(options)
    // Drop the statistical-office archive before starting the next run. It is
    // the dominant memory cost in a 1,000-century balance sweep.
    void finalState
    return run
  })
}

/** Detailed trajectories for stability analysis, without serializing each
 * final statistical archive solely to produce an unused hash. */
export function runBatchWithoutHashes(opts: BatchOptions): BatchResult<UnhashedBatchRunResult> {
  return executeBatch(opts, (options) => {
    const { finalState, ...run } = runOne({ ...options, includeStateHash: false })
    void finalState
    return run
  })
}

/** Constant-memory batch for the ordinary aggregate report. */
export function runSummaryBatch(opts: BatchOptions): SummaryBatchResult {
  return executeBatch(opts, runSummary)
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const isMain = process.argv[1]?.endsWith('batch.ts')
if (isMain) {
  const runs = Number(arg('runs', '1000'))
  const ticks = Number(arg('ticks', '120'))
  const policy = arg('policy', 'random') as PolicyId
  const country = arg('country', 'baseline') as CountryScenarioId | 'baseline' | 'all'
  const valid = country === 'all' || country === 'baseline' || COUNTRY_CATALOG.some((profile) => profile.id === country)
  if (!valid) throw new Error(`unknown country '${country}'; use baseline, ${COUNTRY_CATALOG.map((profile) => profile.id).join(', ')}, or all`)
  if (!POLICY_IDS.includes(policy)) throw new Error(`unknown policy '${policy}'; use ${POLICY_IDS.join(', ')}`)
  const batch = runSummaryBatch({ runs, ticks, policy, country })
  printReport(batch, { runs, ticks, policy, country })
  // fail the process (and CI) on either failure mode — NaN or a runaway price
  const bad = batch.runs.filter((r) => r.nanCount > 0 || r.priceExplosions > 0).length
  process.exitCode = bad > 0 ? 1 : 0
}

export { cagr, meanAnnualInflation, meanUnemployment, randomPolicy, summarize }
