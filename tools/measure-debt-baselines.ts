/**
 * Reproduce investigation 0008 without retaining thousands of full century
 * states in memory:
 *
 *   pnpm debt-baselines -- --runs 200 --ticks 400
 *
 * The four developmental variants isolate the two candidate channels behind
 * low debt: stronger tax collection and fixed nominal appropriations.
 */

import {
  CAPACITY_IDS,
  SPENDING_PROGRAM_IDS,
  type Action,
  type CapacityId,
  type StatRecord,
  type TrueState,
} from '../packages/engine/src/index'
import {
  DEBT_FREE_RATIO,
  debtToGdp,
  fiscalRatios,
  standingProgrammeOutlays,
  type FiscalRatios,
} from '../packages/runner/src/debt'
import { summarize } from '../packages/runner/src/metrics'
import { developmentalPolicy, type RunnerPolicy } from '../packages/runner/src/policies'
import { runOne } from '../packages/runner/src/run'

const RUNS = Number(arg('runs', '200'))
const TICKS = Number(arg('ticks', '400'))
const HORIZONS = [...new Set([80, 200, 400, TICKS].filter((tick) => tick <= TICKS))].sort(
  (a, b) => a - b,
)
const WINDOW = 8

if (!Number.isInteger(RUNS) || RUNS <= 0) throw new Error('--runs must be a positive integer')
if (!Number.isInteger(TICKS) || TICKS <= 1) throw new Error('--ticks must be an integer above one')

interface Scenario {
  id: string
  policy?: RunnerPolicy
}

interface Reading {
  alive: boolean
  debtFreeAt: number | null
  debtToGdp: number
  fiscal: FiscalRatios
  nominalGdpFactor: number
  standingOutlayFactor: number
  revenueFactor: number
}

interface Sample {
  readings: Map<number, Reading>
  finalTaxCapacity: number
  gdpShareRules: number
  illegalActionsSkipped: number
}

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const mean = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)

function combineFiscal(records: readonly StatRecord[]): FiscalRatios {
  const points = records.map(fiscalRatios)
  return {
    revenue: mean(points.map((point) => point.revenue)),
    standingProgrammes: mean(points.map((point) => point.standingProgrammes)),
    capacity: mean(points.map((point) => point.capacity)),
    interest: mean(points.map((point) => point.interest)),
    balance: mean(points.map((point) => point.balance)),
  }
}

function firstDebtFreeRecord(records: readonly StatRecord[]): number | null {
  const record = records.find(
    (point) => debtToGdp(point.debt, point.nominalGdp) <= DEBT_FREE_RATIO,
  )
  // Worksheet tick zero is the first completed quarter; runner trajectories
  // and the CLI call it quarter one.
  return record ? record.tick + 1 : null
}

function capacityPolicy(ids: readonly CapacityId[]): RunnerPolicy {
  return (_state, _rng, tick) =>
    tick % 8 === 0
      ? ids.map((target) => ({ kind: 'investCapacity', target, amount: 2 }))
      : []
}

function latestOfficialNominalGdp(state: TrueState): number | null {
  const points = (state.stats.series.gdp_growth ?? [])
    .filter((point) => point.levels && Number.isFinite(point.levels.nominal))
    .sort((a, b) => b.forQtr - a.forQtr || b.revision - a.revision)
  return points[0]?.levels?.nominal ?? null
}

function gdpShareActions(state: TrueState): Action[] {
  if (state.meta.tick !== 4) return []
  const officialGdp = latestOfficialNominalGdp(state)
  if (officialGdp === null) return []
  return SPENDING_PROGRAM_IDS
    .filter((programme) => state.gov.dials.spending[programme] > 0)
    .map((programme) => ({
      kind: 'setSpendingRule' as const,
      programme,
      mode: 'gdpShare' as const,
      value: state.gov.dials.spending[programme] / officialGdp,
    }))
}

function withGdpShareRules(policy: RunnerPolicy): RunnerPolicy {
  return (state, rng, tick) => [...gdpShareActions(state), ...policy(state, rng, tick)]
}

const noTaxCapacity = capacityPolicy(CAPACITY_IDS.filter((id) => id !== 'tax'))
const scenarios: readonly Scenario[] = [
  { id: 'passive' },
  { id: 'developmental', policy: developmentalPolicy },
  { id: 'dev-no-tax', policy: noTaxCapacity },
  { id: 'dev-GDP-share', policy: withGdpShareRules(developmentalPolicy) },
  { id: 'dev-no-tax+GDP', policy: withGdpShareRules(noTaxCapacity) },
]

function sample(seed: string, scenario: Scenario): Sample {
  const run = runOne({ seed, ticks: TICKS, policy: scenario.policy, includeStateHash: false })
  const records = run.finalState.stats.record
  const opening = records[0]
  const readings = new Map<number, Reading>()
  for (const horizon of HORIZONS) {
    const throughHorizon = records.slice(0, horizon)
    const final = throughHorizon[throughHorizon.length - 1]
    const window = throughHorizon.slice(Math.max(0, throughHorizon.length - WINDOW))
    readings.set(horizon, {
      alive: run.deposedAt === null || run.deposedAt > horizon,
      debtFreeAt: firstDebtFreeRecord(throughHorizon),
      debtToGdp: debtToGdp(final.debt, final.nominalGdp),
      fiscal: combineFiscal(window),
      nominalGdpFactor: final.nominalGdp / Math.max(opening.nominalGdp, 1e-9),
      standingOutlayFactor:
        standingProgrammeOutlays(final) / Math.max(standingProgrammeOutlays(opening), 1e-9),
      revenueFactor: final.revenue / Math.max(opening.revenue, 1e-9),
    })
  }
  return {
    readings,
    finalTaxCapacity: run.finalState.gov.capacity.tax,
    gdpShareRules: SPENDING_PROGRAM_IDS.filter(
      (programme) => run.finalState.gov.spendingRules[programme].kind === 'gdpShare',
    ).length,
    illegalActionsSkipped: run.illegalActionsSkipped,
  }
}

const samples = new Map<string, Sample[]>(scenarios.map((scenario) => [scenario.id, []]))
const started = performance.now()
for (let index = 0; index < RUNS; index++) {
  const seed = `debt-baseline-${index}`
  for (const scenario of scenarios) samples.get(scenario.id)!.push(sample(seed, scenario))
}

const pct = (value: number): string => (100 * value).toFixed(1)
const factor = (value: number): string => value.toFixed(2)
const median = (values: number[]): number => summarize(values).p50

console.log(
  `debt baseline mechanisms: ${RUNS} paired seeds x ${scenarios.length} scenarios x ${TICKS} ticks`,
)
console.log(`wall time: ${((performance.now() - started) / 1000).toFixed(1)}s`)
for (const horizon of HORIZONS) {
  console.log(`\nLAST ${Math.min(WINDOW, horizon)} QUARTERS THROUGH Q${horizon} (raw trajectories)`)
  console.log(
    [
      'scenario'.padEnd(19),
      'alive'.padStart(6),
      'debtfree'.padStart(9),
      'q50'.padStart(5),
      'debt/GDP'.padStart(9),
      'rev/GDP'.padStart(8),
      'prog/GDP'.padStart(9),
      'cap/GDP'.padStart(8),
      'int/GDP'.padStart(8),
      'bal/GDP'.padStart(8),
      'GDPx'.padStart(6),
      'progx'.padStart(6),
      'revx'.padStart(6),
    ].join(' '),
  )
  for (const scenario of scenarios) {
    const readings = samples.get(scenario.id)!.map((entry) => entry.readings.get(horizon)!)
    const debtFree = readings
      .map((reading) => reading.debtFreeAt)
      .filter((tick): tick is number => tick !== null)
    console.log(
      [
        scenario.id.padEnd(19),
        `${pct(mean(readings.map((reading) => Number(reading.alive))))}%`.padStart(6),
        `${pct(debtFree.length / readings.length)}%`.padStart(9),
        (debtFree.length ? factor(median(debtFree)) : '—').padStart(5),
        `${pct(median(readings.map((reading) => reading.debtToGdp)))}%`.padStart(9),
        `${pct(median(readings.map((reading) => reading.fiscal.revenue)))}%`.padStart(8),
        `${pct(median(readings.map((reading) => reading.fiscal.standingProgrammes)))}%`.padStart(9),
        `${pct(median(readings.map((reading) => reading.fiscal.capacity)))}%`.padStart(8),
        `${pct(median(readings.map((reading) => reading.fiscal.interest)))}%`.padStart(8),
        `${pct(median(readings.map((reading) => reading.fiscal.balance)))}%`.padStart(8),
        factor(median(readings.map((reading) => reading.nominalGdpFactor))).padStart(6),
        factor(median(readings.map((reading) => reading.standingOutlayFactor))).padStart(6),
        factor(median(readings.map((reading) => reading.revenueFactor))).padStart(6),
      ].join(' '),
    )
  }
}

console.log('\nFINAL POLICY CHECKS')
console.log('scenario             tax cap  GDP rules  skipped actions/run')
for (const scenario of scenarios) {
  const entries = samples.get(scenario.id)!
  console.log(
    [
      scenario.id.padEnd(19),
      factor(median(entries.map((entry) => entry.finalTaxCapacity))).padStart(7),
      factor(median(entries.map((entry) => entry.gdpShareRules))).padStart(10),
      factor(median(entries.map((entry) => entry.illegalActionsSkipped))).padStart(20),
    ].join(' '),
  )
}
