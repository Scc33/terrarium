/**
 * Reproduce investigation 0010 with paired, player-legal policy paths:
 *
 *   pnpm export-share -- --runs 40 --ticks 160
 *
 * Each policy uses the same seed and authored country as its passive control.
 * Results are restricted to pairs whose governments remain in power through
 * the reported horizon. The export share is engine truth from the statistical
 * office's worksheet; its published counterpart deliberately adds lag, noise,
 * and revisions.
 */

import {
  CAPACITY_IDS,
  CURATED_COUNTRY_IDS,
  type Action,
  type CapacityId,
  type TrueState,
} from '../packages/engine/src/index'
import { summarize } from '../packages/runner/src/metrics'
import { developmentalPolicy, type RunnerPolicy } from '../packages/runner/src/policies'
import { runOne, type RunResultWithoutHash } from '../packages/runner/src/run'

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const RUNS = Number(arg('runs', '40'))
const TICKS = Number(arg('ticks', '160'))
const WINDOW = 8
const HORIZONS = [...new Set([20, 80, 160, TICKS].filter((tick) => tick <= TICKS))].sort(
  (a, b) => a - b,
)

if (!Number.isInteger(RUNS) || RUNS <= 0) throw new Error('--runs must be a positive integer')
if (!Number.isInteger(TICKS) || TICKS < WINDOW) {
  throw new Error(`--ticks must be an integer at least ${WINDOW}`)
}

interface Scenario {
  id: string
  policy?: RunnerPolicy
}

interface Reading {
  alive: boolean
  exportShare: number
  exports: number
  finalExpenditure: number
}

interface Sample {
  run: RunResultWithoutHash
  readings: Map<number, Reading>
}

const mean = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)

const once = (at: number, make: (state: TrueState) => Action): RunnerPolicy =>
  (state, _rng, tick) => (tick === at ? [make(state)] : [])

const gdpRule = (programme: 'transfers' | 'investment' | 'research', share: number): RunnerPolicy =>
  once(4, () => ({ kind: 'setSpendingRule', programme, mode: 'gdpShare', value: share }))

const capacityPolicy = (ids: readonly CapacityId[]): RunnerPolicy =>
  (_state, _rng, tick) =>
    tick % 8 === 0
      ? ids.map((target) => ({ kind: 'investCapacity', target, amount: 2 }))
      : []

const scenarios: readonly Scenario[] = [
  { id: 'passive' },
  { id: 'transfers-10%GDP', policy: gdpRule('transfers', 0.1) },
  { id: 'investment-10%GDP', policy: gdpRule('investment', 0.1) },
  { id: 'research-5%GDP', policy: gdpRule('research', 0.05) },
  {
    id: 'zero-tariff',
    policy: once(0, () => ({ kind: 'setDial', path: 'taxRates.tariff', value: 0 })),
  },
  {
    id: 'zero-policy-rate',
    policy: once(0, () => ({ kind: 'setDial', path: 'policyRate', value: 0 })),
  },
  {
    id: 'manuf-subsidy-5%GDP0',
    policy: once(0, (state) => ({
      kind: 'setDial',
      path: 'subsidies.manuf',
      value: 0.05 * state.flows.nominalGdp,
    })),
  },
  { id: 'tax-capacity', policy: capacityPolicy(['tax']) },
  { id: 'statistical-capacity', policy: capacityPolicy(['statistical']) },
  {
    id: 'tax+statistical',
    policy: capacityPolicy(['tax', 'statistical']),
  },
  { id: 'administrative-capacity', policy: capacityPolicy(['administrative']) },
  { id: 'education-capacity', policy: capacityPolicy(['education']) },
  {
    id: 'admin+education',
    policy: capacityPolicy(['administrative', 'education']),
  },
  { id: 'all-capacities', policy: developmentalPolicy },
]

function reading(run: RunResultWithoutHash, horizon: number): Reading {
  const records = run.finalState.stats.record.slice(Math.max(0, horizon - WINDOW), horizon)
  const trajectory = run.trajectory.slice(Math.max(0, horizon - WINDOW), horizon)
  const exportShare = mean(records.map((point) => point.exportShare))
  const exports = mean(trajectory.map((point) => point.drivers.exports))
  return {
    alive: run.deposedAt === null || run.deposedAt > horizon,
    exportShare,
    exports,
    finalExpenditure: mean(
      records.map(
        (point, index) =>
          trajectory[index].drivers.exports / Math.max(point.exportShare, 1e-9),
      ),
    ),
  }
}

function sample(seed: string, country: (typeof CURATED_COUNTRY_IDS)[number], scenario: Scenario): Sample {
  const run = runOne({
    seed,
    country,
    ticks: TICKS,
    policy: scenario.policy,
    includeStateHash: false,
  })
  return {
    run,
    readings: new Map(HORIZONS.map((horizon) => [horizon, reading(run, horizon)])),
  }
}

const samples = new Map<string, Sample[]>(scenarios.map((scenario) => [scenario.id, []]))
const started = performance.now()
for (const country of CURATED_COUNTRY_IDS) {
  for (let index = 0; index < RUNS; index++) {
    const seed = `export-share-${country}-${index}`
    for (const scenario of scenarios) {
      samples.get(scenario.id)!.push(sample(seed, country, scenario))
    }
  }
}

const median = (values: number[]): number => summarize(values).p50
const pct = (value: number): string => `${value.toFixed(1)}%`
const signed = (value: number, suffix = ''): string =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}${suffix}`

console.log(
  `export-share mechanisms: ${RUNS} paired seeds x ${CURATED_COUNTRY_IDS.length} countries x ${scenarios.length} scenarios x ${TICKS} ticks`,
)
console.log(`capacity ids exercised by the developmental control: ${CAPACITY_IDS.join(', ')}`)
console.log(`wall time: ${((performance.now() - started) / 1000).toFixed(1)}s`)

for (const horizon of HORIZONS) {
  console.log(`\nLAST ${Math.min(WINDOW, horizon)} QUARTERS THROUGH Q${horizon}`)
  console.log(
    [
      'scenario'.padEnd(24),
      'paired'.padStart(10),
      'share'.padStart(8),
      'd share'.padStart(9),
      'd exports'.padStart(10),
      'd final exp'.padStart(12),
      'skipped'.padStart(8),
    ].join(' '),
  )
  const passive = samples.get('passive')!
  for (const scenario of scenarios) {
    const entries = samples.get(scenario.id)!
    const paired = entries.flatMap((entry, index) => {
      const current = entry.readings.get(horizon)!
      const control = passive[index].readings.get(horizon)!
      return current.alive && control.alive ? [{ current, control, entry }] : []
    })
    const share = median(paired.map(({ current }) => 100 * current.exportShare))
    const deltaShare = median(
      paired.map(({ current, control }) => 100 * (current.exportShare - control.exportShare)),
    )
    const deltaExports = median(
      paired.map(({ current, control }) => 100 * (current.exports / control.exports - 1)),
    )
    const deltaFinalExpenditure = median(
      paired.map(
        ({ current, control }) =>
          100 * (current.finalExpenditure / control.finalExpenditure - 1),
      ),
    )
    console.log(
      [
        scenario.id.padEnd(24),
        `${paired.length}/${entries.length}`.padStart(10),
        pct(share).padStart(8),
        signed(deltaShare, 'pp').padStart(9),
        signed(deltaExports, '%').padStart(10),
        signed(deltaFinalExpenditure, '%').padStart(12),
        median(entries.map((entry) => entry.run.illegalActionsSkipped)).toFixed(0).padStart(8),
      ].join(' '),
    )
  }
}

console.log('\nPASSIVE EXPORT SHARE BY COUNTRY')
console.log(['country'.padEnd(12), ...HORIZONS.map((horizon) => `Q${horizon}`.padStart(8))].join(' '))
for (let countryIndex = 0; countryIndex < CURATED_COUNTRY_IDS.length; countryIndex++) {
  const country = CURATED_COUNTRY_IDS[countryIndex]
  const offset = countryIndex * RUNS
  const entries = samples.get('passive')!.slice(offset, offset + RUNS)
  console.log(
    [
      country.padEnd(12),
      ...HORIZONS.map((horizon) => {
        const alive = entries.map((entry) => entry.readings.get(horizon)!).filter((point) => point.alive)
        return pct(median(alive.map((point) => 100 * point.exportShare))).padStart(8)
      }),
    ].join(' '),
  )
}
