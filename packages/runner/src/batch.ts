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
import { runOne, type RunResult } from './run'
import { cagr, meanAnnualInflation, meanUnemployment, summarize } from './metrics'
import { POLICY_IDS, policyFor, randomPolicy, type PolicyId } from './policies'
import { printReport } from './report'

export interface BatchResult {
  /** Batch diagnostics need the compact trajectory and outcome, not another
   * copy of every run's full century state and statistical-office archive. */
  runs: BatchRunResult[]
  wallMs: number
}

export type BatchRunResult = Omit<RunResult, 'finalState'>

export function runBatch(opts: {
  runs: number
  ticks: number
  policy?: PolicyId
  seedPrefix?: string
  /** one scenario, or an even round-robin matrix over the full catalogue */
  country?: CountryScenarioId | 'baseline' | 'all'
}): BatchResult {
  const start = performance.now()
  const runs: BatchRunResult[] = []
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
    const { finalState, ...run } = runOne({
      seed,
      ticks: opts.ticks,
      country: country === 'baseline' ? undefined : country,
      policy: policyFor(opts.policy ?? 'passive'),
    })
    // Drop the statistical-office archive before starting the next run. It is
    // the dominant memory cost in a 1,000-century balance sweep.
    void finalState
    runs.push(run)
  }
  return { runs, wallMs: performance.now() - start }
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
  const batch = runBatch({ runs, ticks, policy, country })
  printReport(batch, { runs, ticks, policy, country })
  // fail the process (and CI) on either failure mode — NaN or a runaway price
  const bad = batch.runs.filter((r) => r.nanCount > 0 || r.priceExplosions > 0).length
  process.exitCode = bad > 0 ? 1 : 0
}

export { cagr, meanAnnualInflation, meanUnemployment, randomPolicy, summarize }
