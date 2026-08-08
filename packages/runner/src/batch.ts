/**
 * Batch runner — the balance dashboard's data source and the M0 DoD probe:
 * N random-policy runs, wall time, NaN count, explosion count.
 *
 *   pnpm batch -- --runs 1000 --ticks 120 --policy random
 */

import {
  CAPACITY_IDS,
  COUNTRY_CATALOG,
  SECTOR_IDS,
  type Action,
  type CountryScenarioId,
  type Rng,
  type TrueState,
} from '@terrarium/engine'
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
  /** one scenario, or an even round-robin matrix over the full catalogue */
  country?: CountryScenarioId | 'baseline' | 'all'
}): BatchResult {
  const start = performance.now()
  const runs: RunResult[] = []
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
    runs.push(
      runOne({
        seed,
        ticks: opts.ticks,
        country: country === 'baseline' ? undefined : country,
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
  const country = arg('country', 'baseline') as CountryScenarioId | 'baseline' | 'all'
  const valid = country === 'all' || country === 'baseline' || COUNTRY_CATALOG.some((profile) => profile.id === country)
  if (!valid) throw new Error(`unknown country '${country}'; use baseline, ${COUNTRY_CATALOG.map((profile) => profile.id).join(', ')}, or all`)
  const batch = runBatch({ runs, ticks, policy, country })
  printReport(batch, { runs, ticks, policy, country })
  // fail the process (and CI) on either failure mode — NaN or a runaway price
  const bad = batch.runs.filter((r) => r.nanCount > 0 || r.priceExplosions > 0).length
  process.exitCode = bad > 0 ? 1 : 0
}

export { cagr, meanAnnualInflation, meanUnemployment, summarize }
