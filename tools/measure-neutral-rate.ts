/**
 * Reproduce investigation 0011 with paired, player-legal fixed-rate paths:
 *
 *   pnpm neutral-rate -- --runs 40 --ticks 160
 *
 * The engine's rate-sensitive finance and investment terms are neutral when
 * `privateRealRate(state) === NATURAL_REAL_RATE`. The corresponding nominal
 * policy setting is state-dependent because expected inflation, sovereign
 * funding pressure, and asset purchases all move the common private rate.
 *
 * Each fixed-rate scenario uses the same engine seed and authored country as
 * its passive 4% control. Results at a horizon include only pairs whose
 * governments remain in power through that horizon.
 */

import {
  applyActions,
  createCountryParams,
  CURATED_COUNTRY_IDS,
  init,
  NATURAL_REAL_RATE,
  privateFundingSpread,
  privateRealRate,
  sovereignRiskPremium,
  step,
  type TrueState,
} from '../packages/engine/src/index'
import { summarize } from '../packages/runner/src/metrics'

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
if (!Number.isInteger(TICKS) || TICKS <= WINDOW) {
  throw new Error(`--ticks must be an integer greater than ${WINDOW}`)
}

const FIXED_RATES = [0, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1] as const
const PASSIVE_RATE = 0.04

interface Point {
  inPower: boolean
  realGdp: number
  domesticPrivateInvestment: number
  inflation: number
  unemployment: number
  expectedInflation: number
  fundingSpread: number
  privateRealRate: number
  neutralPolicyRate: number
  governmentYield: number
  debtToGdp: number
  interestToGdp: number
  printedToGdp: number
  bankCapitalRatio: number
  bankingCrisis: boolean
}

interface Reading {
  alive: boolean
  realGdp: number
  domesticPrivateInvestment: number
  growth: number
  inflation: number
  unemployment: number
  expectedInflation: number
  fundingSpread: number
  privateRealRate: number
  neutralPolicyRate: number
  governmentYield: number
  debtToGdp: number
  interestToGdp: number
  printedToGdp: number
  bankCapitalRatio: number
  bankingCrisis: boolean
}

interface Sample {
  country: (typeof CURATED_COUNTRY_IDS)[number]
  openingNeutralPolicyRate: number
  readings: Map<number, Reading>
}

/** Nominal policy rate that zeroes the rate term in finance and investment. */
function neutralPolicyRate(state: TrueState): number {
  return state.gov.dials.policyRate - (privateRealRate(state) - NATURAL_REAL_RATE)
}

function point(state: TrueState): Point {
  return {
    inPower: state.politics.inPower,
    realGdp: state.flows.realGdp,
    domesticPrivateInvestment:
      state.flows.investmentReal -
      state.flows.publicInvestmentReal -
      state.flows.foreignDirectInvestmentReal,
    inflation: 4 * state.flows.inflationQ,
    unemployment: state.flows.unemployment,
    expectedInflation: state.ledger.inflationExpectations,
    fundingSpread: privateFundingSpread(state),
    privateRealRate: privateRealRate(state),
    neutralPolicyRate: neutralPolicyRate(state),
    governmentYield: state.gov.dials.policyRate + sovereignRiskPremium(state),
    debtToGdp: state.gov.debt / Math.max(4 * state.flows.nominalGdp, 1e-9),
    interestToGdp: state.flows.debtInterest / Math.max(state.flows.nominalGdp, 1e-9),
    printedToGdp: state.flows.printedThisQtr / Math.max(state.flows.nominalGdp, 1e-9),
    bankCapitalRatio: state.finance.bankCapital / Math.max(state.finance.creditOutstanding, 1e-9),
    bankingCrisis: state.finance.crisisQtrsLeft > 0,
  }
}

const mean = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)

function reading(points: Point[], horizon: number): Reading {
  const window = points.slice(horizon - WINDOW, horizon)
  const before = points[horizon - WINDOW - 1]
  const last = points[horizon - 1]
  const growth = Math.pow(last.realGdp / before.realGdp, 4 / WINDOW) - 1
  return {
    alive: last.inPower,
    realGdp: mean(window.map((entry) => entry.realGdp)),
    domesticPrivateInvestment: mean(window.map((entry) => entry.domesticPrivateInvestment)),
    growth,
    inflation: mean(window.map((entry) => entry.inflation)),
    unemployment: mean(window.map((entry) => entry.unemployment)),
    expectedInflation: mean(window.map((entry) => entry.expectedInflation)),
    fundingSpread: mean(window.map((entry) => entry.fundingSpread)),
    privateRealRate: mean(window.map((entry) => entry.privateRealRate)),
    neutralPolicyRate: mean(window.map((entry) => entry.neutralPolicyRate)),
    governmentYield: mean(window.map((entry) => entry.governmentYield)),
    debtToGdp: mean(window.map((entry) => entry.debtToGdp)),
    interestToGdp: mean(window.map((entry) => entry.interestToGdp)),
    printedToGdp: mean(window.map((entry) => entry.printedToGdp)),
    bankCapitalRatio: mean(window.map((entry) => entry.bankCapitalRatio)),
    bankingCrisis: points.slice(0, horizon).some((entry) => entry.bankingCrisis),
  }
}

function sample(
  seed: string,
  country: (typeof CURATED_COUNTRY_IDS)[number],
  rate: number,
): Sample {
  let state = init(createCountryParams(country, seed), seed)
  const openingNeutralPolicyRate = neutralPolicyRate(state)
  if (rate !== PASSIVE_RATE) {
    state = applyActions(state, [{ kind: 'setDial', path: 'policyRate', value: rate }])
  }
  const points: Point[] = []
  for (let tick = 0; tick < TICKS; tick++) {
    state = step(state)
    points.push(point(state))
  }
  return {
    country,
    openingNeutralPolicyRate,
    readings: new Map(HORIZONS.map((horizon) => [horizon, reading(points, horizon)])),
  }
}

const samples = new Map<number, Sample[]>(FIXED_RATES.map((rate) => [rate, []]))
const started = performance.now()
for (const country of CURATED_COUNTRY_IDS) {
  for (let index = 0; index < RUNS; index++) {
    const seed = `neutral-rate-${country}-${index}`
    for (const rate of FIXED_RATES) samples.get(rate)!.push(sample(seed, country, rate))
  }
}

const median = (values: number[]): number => summarize(values).p50
const pct = (value: number): string => `${(100 * value).toFixed(2)}%`
const signed = (value: number, suffix = ''): string =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}${suffix}`
const rateLabel = (rate: number): string => `${(100 * rate).toFixed(0)}%`

console.log(
  `neutral-rate sweep: ${RUNS} paired seeds x ${CURATED_COUNTRY_IDS.length} countries x ${FIXED_RATES.length} rates x ${TICKS} ticks`,
)
console.log(`model natural real rate: ${pct(NATURAL_REAL_RATE)}`)
console.log(`wall time: ${((performance.now() - started) / 1000).toFixed(1)}s`)

const passive = samples.get(PASSIVE_RATE)!

console.log('\nOPENING IMPLIED NEUTRAL NOMINAL RATE')
console.log(['country'.padEnd(12), 'p05'.padStart(10), 'p50'.padStart(10), 'p95'.padStart(10)].join(' '))
for (const country of CURATED_COUNTRY_IDS) {
  const summary = summarize(
    passive
      .filter((entry) => entry.country === country)
      .map((entry) => entry.openingNeutralPolicyRate),
  )
  console.log(
    [
      country.padEnd(12),
      pct(summary.p05).padStart(10),
      pct(summary.p50).padStart(10),
      pct(summary.p95).padStart(10),
    ].join(' '),
  )
}

console.log('\nIMPLIED NEUTRAL NOMINAL RATE ON PASSIVE 4% PATHS')
console.log(
  [
    'horizon'.padEnd(8),
    'alive'.padStart(9),
    'exp infl'.padStart(10),
    'fund spr'.padStart(10),
    'neutral p05'.padStart(12),
    'neutral p50'.padStart(12),
    'neutral p95'.padStart(12),
    'real gap'.padStart(10),
    'gov yield'.padStart(10),
  ].join(' '),
)
for (const horizon of HORIZONS) {
  const alive = passive.map((entry) => entry.readings.get(horizon)!).filter((entry) => entry.alive)
  const neutral = summarize(alive.map((entry) => entry.neutralPolicyRate))
  console.log(
    [
      `Q${horizon}`.padEnd(8),
      `${alive.length}/${passive.length}`.padStart(9),
      pct(median(alive.map((entry) => entry.expectedInflation))).padStart(10),
      pct(median(alive.map((entry) => entry.fundingSpread))).padStart(10),
      pct(neutral.p05).padStart(12),
      pct(neutral.p50).padStart(12),
      pct(neutral.p95).padStart(12),
      pct(median(alive.map((entry) => entry.privateRealRate - NATURAL_REAL_RATE))).padStart(10),
      pct(median(alive.map((entry) => entry.governmentYield))).padStart(10),
    ].join(' '),
  )
}

for (const horizon of HORIZONS) {
  console.log(`\nFIXED PLAYER-LEGAL RATES, LAST ${WINDOW} QUARTERS THROUGH Q${horizon}`)
  console.log(
    [
      'rate'.padEnd(6),
      'paired'.padStart(10),
      'real gap'.padStart(10),
      'growth'.padStart(9),
      'd growth'.padStart(10),
      'd GDP'.padStart(9),
      'd priv I'.padStart(10),
      'infl'.padStart(9),
      'unemp'.padStart(9),
      'crisis'.padStart(9),
      'deposed'.padStart(10),
    ].join(' '),
  )
  for (const rate of FIXED_RATES) {
    const entries = samples.get(rate)!
    const paired = entries.flatMap((entry, index) => {
      const current = entry.readings.get(horizon)!
      const control = passive[index].readings.get(horizon)!
      return current.alive && control.alive ? [{ current, control }] : []
    })
    const deposed = 1 - entries.filter((entry) => entry.readings.get(horizon)!.alive).length / entries.length
    console.log(
      [
        rateLabel(rate).padEnd(6),
        `${paired.length}/${entries.length}`.padStart(10),
        pct(median(paired.map(({ current }) => current.privateRealRate - NATURAL_REAL_RATE))).padStart(10),
        pct(median(paired.map(({ current }) => current.growth))).padStart(9),
        signed(
          100 * median(paired.map(({ current, control }) => current.growth - control.growth)),
          'pp',
        ).padStart(10),
        signed(
          100 * median(paired.map(({ current, control }) => current.realGdp / control.realGdp - 1)),
          '%',
        ).padStart(9),
        signed(
          100 *
            median(
              paired.map(
                ({ current, control }) =>
                  current.domesticPrivateInvestment / control.domesticPrivateInvestment - 1,
              ),
            ),
          '%',
        ).padStart(10),
        pct(median(paired.map(({ current }) => current.inflation))).padStart(9),
        pct(median(paired.map(({ current }) => current.unemployment))).padStart(9),
        pct(mean(paired.map(({ current }) => Number(current.bankingCrisis)))).padStart(9),
        pct(deposed).padStart(10),
      ].join(' '),
    )
  }
}

const finalHorizon = HORIZONS[HORIZONS.length - 1]
console.log(`\nMONETARY-FISCAL READINGS, LAST ${WINDOW} QUARTERS THROUGH Q${finalHorizon}`)
console.log(
  [
    'rate'.padEnd(6),
    'paired'.padStart(10),
    'exp infl'.padStart(10),
    'gov yield'.padStart(10),
    'debt/GDP'.padStart(10),
    'int/GDP'.padStart(10),
    'print/GDP'.padStart(11),
    'bank cap'.padStart(10),
  ].join(' '),
)
for (const rate of FIXED_RATES) {
  const entries = samples.get(rate)!
  const paired = entries.flatMap((entry, index) => {
    const current = entry.readings.get(finalHorizon)!
    const control = passive[index].readings.get(finalHorizon)!
    return current.alive && control.alive ? [current] : []
  })
  console.log(
    [
      rateLabel(rate).padEnd(6),
      `${paired.length}/${entries.length}`.padStart(10),
      pct(median(paired.map((entry) => entry.expectedInflation))).padStart(10),
      pct(median(paired.map((entry) => entry.governmentYield))).padStart(10),
      pct(median(paired.map((entry) => entry.debtToGdp))).padStart(10),
      pct(median(paired.map((entry) => entry.interestToGdp))).padStart(10),
      pct(median(paired.map((entry) => entry.printedToGdp))).padStart(11),
      pct(median(paired.map((entry) => entry.bankCapitalRatio))).padStart(10),
    ].join(' '),
  )
}

console.log('\nPASSIVE IMPLIED NEUTRAL NOMINAL RATE BY COUNTRY')
console.log(['country'.padEnd(12), ...HORIZONS.map((horizon) => `Q${horizon}`.padStart(10))].join(' '))
for (const country of CURATED_COUNTRY_IDS) {
  const entries = passive.filter((entry) => entry.country === country)
  console.log(
    [
      country.padEnd(12),
      ...HORIZONS.map((horizon) => {
        const alive = entries.map((entry) => entry.readings.get(horizon)!).filter((entry) => entry.alive)
        return pct(median(alive.map((entry) => entry.neutralPolicyRate))).padStart(10)
      }),
    ].join(' '),
  )
}
