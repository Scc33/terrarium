/**
 * Reproduce investigation 0024 / issue #86:
 *   pnpm capital-ownership -- --runs 12 --ticks 400
 *
 * Runner-only true-state diagnostics. Passive protected-tenure paths retain
 * ordinary economic/political feedback. Isolated step probes are interventions
 * on a snapshot, not player actions or forecasts of a full counterfactual path.
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  createCountryParams,
  CURATED_COUNTRY_IDS,
  init,
  rngFor,
  SCHEMA_VERSION,
  step,
  validate,
  type TrueState,
} from '../packages/engine/src/index'
import { DEPRECIATION_Q, SAVINGS_DRAWDOWN, taxEfficiency } from '../packages/engine/src/constants'
import { cohorts } from '../packages/engine/src/pipeline/cohorts'
import { finance } from '../packages/engine/src/pipeline/finance'
import { production } from '../packages/engine/src/pipeline/production'
import { summarize } from '../packages/runner/src/metrics'

function arg(name: string, fallback: string): number {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  const index = process.argv.indexOf(`--${name}`)
  const value = Number(inline ? inline.slice(prefix.length) : index < 0 ? fallback : process.argv[index + 1])
  if (!Number.isInteger(value) || value <= 0) throw new Error(`--${name} must be a positive integer`)
  return value
}

const RUNS = arg('runs', '12')
const TICKS = arg('ticks', '400')
const HORIZONS = [...new Set([0, 40, 160, 400, TICKS].filter((tick) => tick <= TICKS))]
  .sort((a, b) => a - b)
const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0)
const capital = (state: TrueState): number => sum(state.sectors.map((s) => s.capital))
const savings = (state: TrueState): number => sum(state.cohorts.map((c) => c.savings))
const privateInvestment = (state: TrueState): number => state.flows.investmentReal -
  state.flows.publicInvestmentReal - state.flows.foreignDirectInvestmentReal
const budget = (state: TrueState): number => sum(Object.values(state.flows.cohortSpend))
const runStep = (state: TrueState, part: typeof production): TrueState =>
  part.run(state, rngFor(state.meta.seed, part.name, state.meta.tick))

function close(actual: number, expected: number, label: string): void {
  assert(Number.isFinite(actual) && Number.isFinite(expected), `${label}: non-finite value`)
  assert(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)),
    `${label}: ${actual} != ${expected}`)
}

interface Reading {
  capitalPerPerson: number
  savingsPerPerson: number
  foreignOwnershipPct: number
  q: number
}

function read(state: TrueState): Reading {
  const population = sum(state.demography.pyramid)
  return {
    capitalPerPerson: capital(state) / population,
    savingsPerPerson: savings(state) / population,
    foreignOwnershipPct: 100 * state.external.foreignOwnedCapital / capital(state),
    q: state.finance.assetPrice,
  }
}

interface Probe {
  budgetChangePct: number
  privateInvestmentChangePct: number
  creditChange: number
  profitIncomeChange: number
  qHalvedPrivateInvestmentChangePct: number
  qHalvedSavingsChange: number
}

function probe(state: TrueState): Probe {
  const noSavings = { ...state, cohorts: state.cohorts.map((c) => ({ ...c, savings: 0 })) }
  const cheapAssets = { ...state, finance: { ...state.finance, assetPrice: state.finance.assetPrice / 2 } }
  const baseProduction = runStep(state, production)
  const noSavingsProduction = runStep(noSavings, production)
  const cheapProduction = runStep(cheapAssets, production)
  const baseFinance = runStep(state, finance)
  const noSavingsFinance = runStep(noSavings, finance)
  const baseCohorts = runStep(state, cohorts)
  const noSavingsCohorts = runStep(noSavings, cohorts)
  const cheapCohorts = runStep(cheapAssets, cohorts)
  const budgetChange = budget(noSavingsProduction) - budget(baseProduction)
  // These observations distinguish a liquid consumption buffer from an equity
  // or bank-deposit portfolio; fail loudly if that architecture changes.
  close(privateInvestment(noSavingsProduction), privateInvestment(baseProduction), 'savings → investment')
  close(noSavingsFinance.finance.creditOutstanding, baseFinance.finance.creditOutstanding, 'savings → credit')
  close(sum(noSavingsCohorts.cohorts.map((c) => c.profitIncome)),
    sum(baseCohorts.cohorts.map((c) => c.profitIncome)), 'savings → profit allocation')
  // The budget has a zero floor, so the exact 3% rule need not survive a
  // negative-income snapshot. Do not infer a missing channel from that floor.
  assert(budgetChange <= 1e-9, 'removing savings raised consumption demand')
  assert(budgetChange >= -SAVINGS_DRAWDOWN * savings(state) - 1e-9,
    'budget fell by more than its savings drawdown')
  close(savings(cheapCohorts), savings(baseCohorts), 'q → direct household revaluation')
  return {
    budgetChangePct: 100 * budgetChange / Math.max(budget(baseProduction), 1e-9),
    privateInvestmentChangePct: 100 * (privateInvestment(noSavingsProduction) /
      Math.max(privateInvestment(baseProduction), 1e-9) - 1),
    creditChange: noSavingsFinance.finance.creditOutstanding - baseFinance.finance.creditOutstanding,
    profitIncomeChange: sum(noSavingsCohorts.cohorts.map((c) => c.profitIncome)) -
      sum(baseCohorts.cohorts.map((c) => c.profitIncome)),
    qHalvedPrivateInvestmentChangePct: 100 * (privateInvestment(cheapProduction) /
      Math.max(privateInvestment(baseProduction), 1e-9) - 1),
    qHalvedSavingsChange: savings(cheapCohorts) - savings(baseCohorts),
  }
}

const audit = {
  quarters: 0,
  capitalFloorQuarters: 0,
  maxCapitalResidualWithoutFloor: 0,
  capitalFloorAddition: 0,
  maxForeignCapitalResidual: 0,
  savingsFloorQuarters: 0,
  savingsFloorAddition: 0,
  maxSavingsResidualWithoutFloor: 0,
}

function auditQuarter(before: TrueState, after: TrueState): void {
  const expectedCapital = capital(before) * (1 - DEPRECIATION_Q) + after.flows.investmentReal
  const capitalResidual = capital(after) - expectedCapital
  if (after.sectors.some((s) => s.capital === 1)) {
    audit.capitalFloorQuarters++
    audit.capitalFloorAddition += Math.max(0, capitalResidual)
    assert(capitalResidual >= -1e-9, 'capital floor destroyed capital')
  } else {
    close(capital(after), expectedCapital, 'capital accumulation')
    audit.maxCapitalResidualWithoutFloor = Math.max(audit.maxCapitalResidualWithoutFloor, Math.abs(capitalResidual))
  }
  const expectedForeign = Math.min(capital(after), Math.max(0,
    before.external.foreignOwnedCapital * (1 - DEPRECIATION_Q) + after.flows.foreignDirectInvestmentReal))
  close(after.external.foreignOwnedCapital, expectedForeign, 'foreign ownership')
  audit.maxForeignCapitalResidual = Math.max(audit.maxForeignCapitalResidual,
    Math.abs(after.external.foreignOwnedCapital - expectedForeign))
  const netIncome = sum(after.cohorts.map((c) =>
    c.wageIncome * (1 - after.gov.dials.taxRates.income * taxEfficiency(after.gov.capacity.tax)) +
    c.profitIncome + c.transferIncome + c.rebateIncome))
  const expectedSavings = savings(before) + netIncome - budget(after) + after.flows.debtPrincipal
  const savingsResidual = savings(after) - expectedSavings
  if (after.cohorts.some((c) => c.savings === 0)) {
    audit.savingsFloorQuarters++
    audit.savingsFloorAddition += Math.max(0, savingsResidual)
    assert(savingsResidual >= -1e-9, 'savings floor destroyed savings')
  } else {
    close(savings(after), expectedSavings, 'household savings accumulation')
    audit.maxSavingsResidualWithoutFloor = Math.max(audit.maxSavingsResidualWithoutFloor, Math.abs(savingsResidual))
  }
  audit.quarters++
}

const rows: { country: string; tick: number; reading: Reading; probe: Probe }[] = []
for (const country of CURATED_COUNTRY_IDS) {
  for (let index = 0; index < RUNS; index++) {
    const seed = `capital-ownership-${country}-${index}`
    let state = init(createCountryParams(country, seed), seed, { protectedTenure: true })
    validate(state)
    rows.push({ country, tick: 0, reading: read(state), probe: probe(state) })
    for (let tick = 1; tick <= TICKS; tick++) {
      const before = state
      state = step(state)
      validate(state)
      auditQuarter(before, state)
      if (HORIZONS.includes(tick)) rows.push({ country, tick, reading: read(state), probe: probe(state) })
    }
  }
  console.error(`Measured ${country}: ${RUNS} passive paths × ${TICKS} quarters`)
}

const median = (values: number[]): number => summarize(values).p50
const readings = CURATED_COUNTRY_IDS.flatMap((country) => HORIZONS.map((tick) => {
  const selected = rows.filter((row) => row.country === country && row.tick === tick)
  return { country, tick,
    capitalPerPerson: median(selected.map((row) => row.reading.capitalPerPerson)),
    savingsPerPerson: median(selected.map((row) => row.reading.savingsPerPerson)),
    foreignOwnershipPct: median(selected.map((row) => row.reading.foreignOwnershipPct)),
    q: median(selected.map((row) => row.reading.q)),
  }
}))
const probes = HORIZONS.map((tick) => {
  const selected = rows.filter((row) => row.tick === tick)
  return { tick,
    removeSavingsBudgetChangePct: median(selected.map((row) => row.probe.budgetChangePct)),
    removeSavingsPrivateInvestmentChangePct: median(selected.map((row) => row.probe.privateInvestmentChangePct)),
    maxAbsRemoveSavingsCreditChange: Math.max(...selected.map((row) => Math.abs(row.probe.creditChange))),
    maxAbsRemoveSavingsProfitIncomeChange: Math.max(...selected.map((row) => Math.abs(row.probe.profitIncomeChange))),
    halveQPrivateInvestmentChangePct: median(selected.map((row) => row.probe.qHalvedPrivateInvestmentChangePct)),
    maxAbsHalveQSavingsChange: Math.max(...selected.map((row) => Math.abs(row.probe.qHalvedSavingsChange))),
  }
})

console.log(JSON.stringify({
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  schema: SCHEMA_VERSION,
  runsPerCountry: RUNS,
  ticks: TICKS,
  policy: 'passive; protected tenure',
  seedPattern: 'capital-ownership-${country}-${index}',
  units: { capitalPerPerson: 'real engine capital units per resident',
    savingsPerPerson: 'nominal money units per resident; not comparable to real capital', q: 'valuation ratio' },
  readings,
  probes,
  audit,
}, null, 2))
