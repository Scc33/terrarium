/**
 * Batch runner — the balance dashboard's data source and the M0 DoD probe:
 * N random-policy runs, wall time, NaN count, explosion count.
 *
 *   pnpm batch -- --runs 1000 --ticks 120 --policy random
 */

import { CAPACITY_IDS, SECTOR_IDS, type Action, type Rng, type TrueState } from '@terrarium/engine'
import { runOne, type RunResult } from './run'
import { cagr, meanAnnualInflation, meanUnemployment, summarize } from './metrics'
import { printReport } from './report'

export function randomPolicy(state: TrueState, rng: Rng, _tick: number): Action[] {
  if (rng.next() > 0.15) return [] // most quarters: leave the dials alone
  const gdp = state.flows.nominalGdp
  const roll = rng.next()
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rng.next() * xs.length)]
  if (roll < 0.2) {
    const path = pick(['taxRates.income', 'taxRates.corporate', 'taxRates.tariff', 'taxRates.fuel'] as const)
    return [{ kind: 'setDial', path, value: rng.range(0, 0.6) }]
  } else if (roll < 0.45) {
    const path = pick(['spending.transfers', 'spending.procurement', 'spending.investment'] as const)
    return [{ kind: 'setDial', path, value: rng.range(0, 0.12) * gdp }]
  } else if (roll < 0.6) {
    return [{ kind: 'setDial', path: 'policyRate', value: rng.range(0, 0.2) }]
  } else if (roll < 0.8) {
    return [{ kind: 'setDial', path: `subsidies.${pick(SECTOR_IDS)}`, value: rng.range(0, 0.05) * gdp }]
  }
  return [{ kind: 'investCapacity', target: pick(CAPACITY_IDS), amount: rng.range(0.02, 0.2) * gdp }]
}

export interface BatchResult {
  runs: RunResult[]
  wallMs: number
}

export function runBatch(opts: {
  runs: number
  ticks: number
  policy?: 'random' | 'passive'
  seedPrefix?: string
}): BatchResult {
  const start = performance.now()
  const runs: RunResult[] = []
  for (let i = 0; i < opts.runs; i++) {
    runs.push(
      runOne({
        seed: `${opts.seedPrefix ?? 'batch'}-${i}`,
        ticks: opts.ticks,
        policy: opts.policy === 'random' ? randomPolicy : undefined,
      }),
    )
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
  const policy = arg('policy', 'random') as 'random' | 'passive'
  const batch = runBatch({ runs, ticks, policy })
  printReport(batch, { runs, ticks, policy })
  // fail the process (and CI) on either failure mode — NaN or a runaway price
  const bad = batch.runs.filter((r) => r.nanCount > 0 || r.priceExplosions > 0).length
  process.exitCode = bad > 0 ? 1 : 0
}

export { cagr, meanAnnualInflation, meanUnemployment, summarize }
