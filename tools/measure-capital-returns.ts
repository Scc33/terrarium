/**
 * Reproduce investigation 0014 with paired public-works and research paths:
 *
 *   pnpm capital-returns -- --runs 12 --ticks 400
 *
 * Every scenario makes ordinary spending-rule orders at Q4, after the first
 * national-accounts release. Protected tenure and unlimited political capital
 * keep deposition and the cabinet's starting point budget from censoring the
 * economic comparison; bloc favour still moves, so the ordinary politics to
 * investment and technology channels remain live.
 *
 * Fixed, CPI-indexed, and official-GDP-share rules separate a temporary cash
 * pulse from maintained real purchasing power and a maintained economic share.
 * Every path is paired with the same country and engine seed under passive play.
 */

import {
  applyActions,
  createCountryParams,
  CURATED_COUNTRY_IDS,
  init,
  potentialOutput,
  step,
  technologyAttainment,
  type Action,
  type SpendingRuleMode,
  type TrueState,
} from '../packages/engine/src/index'
import { DEPRECIATION_Q } from '../packages/engine/src/constants'
import { officialNominalGdp } from '../packages/engine/src/state/spending'
import { summarize } from '../packages/runner/src/metrics'

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const RUNS = Number(arg('runs', '12'))
const TICKS = Number(arg('ticks', '400'))
const ACTION_TICK = 4
const LATE_WINDOW = Math.min(80, TICKS - ACTION_TICK)
const HORIZONS = [...new Set([40, 160, 240, 320, 400, TICKS].filter((tick) => tick <= TICKS))]
  .filter((tick) => tick > ACTION_TICK)
  .sort((a, b) => a - b)

if (!Number.isInteger(RUNS) || RUNS <= 0) throw new Error('--runs must be a positive integer')
if (!Number.isInteger(TICKS) || TICKS <= ACTION_TICK + 1) {
  throw new Error(`--ticks must be an integer greater than ${ACTION_TICK + 1}`)
}

interface ProgrammeRule {
  programme: 'investment' | 'research'
  mode: SpendingRuleMode
  /** Share of official nominal GDP at Q4. GDP rules retain this share; fixed
   * and indexed rules translate it into the comparable opening cash amount. */
  share: number
}

interface Scenario {
  id: string
  label: string
  rules: readonly ProgrammeRule[]
}

const SCENARIOS: readonly Scenario[] = [
  { id: 'passive', label: 'passive', rules: [] },
  {
    id: 'works-fixed-5',
    label: 'works fixed 5%',
    rules: [{ programme: 'investment', mode: 'fixed', share: 0.05 }],
  },
  {
    id: 'works-indexed-5',
    label: 'works CPI 5%',
    rules: [{ programme: 'investment', mode: 'indexed', share: 0.05 }],
  },
  {
    id: 'works-gdp-2',
    label: 'works GDP 2%',
    rules: [{ programme: 'investment', mode: 'gdpShare', share: 0.02 }],
  },
  {
    id: 'works-gdp-5',
    label: 'works GDP 5%',
    rules: [{ programme: 'investment', mode: 'gdpShare', share: 0.05 }],
  },
  {
    id: 'research-fixed-2',
    label: 'R&D fixed 2%',
    rules: [{ programme: 'research', mode: 'fixed', share: 0.02 }],
  },
  {
    id: 'research-gdp-2',
    label: 'R&D GDP 2%',
    rules: [{ programme: 'research', mode: 'gdpShare', share: 0.02 }],
  },
  {
    id: 'both-fixed',
    label: 'both fixed 5+2',
    rules: [
      { programme: 'investment', mode: 'fixed', share: 0.05 },
      { programme: 'research', mode: 'fixed', share: 0.02 },
    ],
  },
  {
    id: 'both-gdp',
    label: 'both GDP 2+2',
    rules: [
      { programme: 'investment', mode: 'gdpShare', share: 0.02 },
      { programme: 'research', mode: 'gdpShare', share: 0.02 },
    ],
  },
]

interface Point {
  tick: number
  realGdp: number
  nominalGdp: number
  population: number
  employment: number
  capital: number
  potentialOutput: number
  output: number
  grossDemand: number
  technologyAttainment: number
  publicInvestment: number
  privateInvestment: number
  worksSpending: number
  researchSpending: number
  debt: number
  annualInflation: number
  priceExplosion: boolean
}

interface Reading {
  realGdp: number
  realGdpPerCapita: number
  productivity: number
  capital: number
  capitalPerWorker: number
  capitalToAnnualOutput: number
  potentialOutput: number
  technologyAttainment: number
  growth: number
  utilization: number
  demandSatisfaction: number
  worksShare: number
  researchShare: number
  publicReplacement: number
  privateReplacement: number
  inflation: number
  debtToGdp: number
  priceExplosion: boolean
}

interface Sample {
  country: (typeof CURATED_COUNTRY_IDS)[number]
  readings: Map<number, Reading>
}

const mean = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)

function point(state: TrueState): Point {
  const population = state.demography.pyramid.reduce((sum, value) => sum + value, 0)
  const employment = state.sectors.reduce((sum, sector) => sum + sector.employment, 0)
  const capital = state.sectors.reduce((sum, sector) => sum + sector.capital, 0)
  const potential = state.sectors.reduce((sum, sector) => sum + potentialOutput(sector), 0)
  const output = state.sectors.reduce((sum, sector) => sum + sector.output, 0)
  const grossDemand = Object.values(state.flows.grossDemand).reduce(
    (sum, value) => sum + value,
    0,
  )
  const privateInvestment =
    state.flows.investmentReal -
    state.flows.publicInvestmentReal -
    state.flows.foreignDirectInvestmentReal
  const prices = Object.values(state.market.prices)

  return {
    tick: state.meta.tick,
    realGdp: state.flows.realGdp,
    nominalGdp: state.flows.nominalGdp,
    population,
    employment,
    capital,
    potentialOutput: potential,
    output,
    grossDemand,
    technologyAttainment: technologyAttainment(state),
    publicInvestment: state.flows.publicInvestmentReal,
    privateInvestment,
    worksSpending: state.gov.dials.spending.investment,
    researchSpending: state.gov.dials.spending.research,
    debt: state.gov.debt,
    annualInflation: 4 * state.flows.inflationQ,
    priceExplosion: prices.some((value) => value > 50 || value < 0.02),
  }
}

function actionsFor(state: TrueState, scenario: Scenario): Action[] {
  if (scenario.rules.length === 0) return []
  const officialGdp = officialNominalGdp(state)
  if (officialGdp === null) {
    throw new Error(`${scenario.id}: national accounts unavailable at Q${state.meta.tick}`)
  }
  return scenario.rules.map((rule) => ({
    kind: 'setSpendingRule',
    programme: rule.programme,
    mode: rule.mode,
    value: rule.mode === 'gdpShare' ? rule.share : rule.share * officialGdp,
  }))
}

function reading(points: readonly Point[], horizon: number): Reading {
  const final = points[horizon]
  const windowLength = Math.min(LATE_WINDOW, horizon - ACTION_TICK)
  const before = points[horizon - windowLength]
  const window = points.slice(horizon - windowLength + 1, horizon + 1)
  const depreciation = DEPRECIATION_Q * final.capital

  return {
    realGdp: final.realGdp,
    realGdpPerCapita: (4 * final.realGdp) / Math.max(final.population, 1e-9),
    productivity: (4 * final.realGdp) / Math.max(final.employment, 1e-9),
    capital: final.capital,
    capitalPerWorker: final.capital / Math.max(final.employment, 1e-9),
    capitalToAnnualOutput: final.capital / Math.max(4 * final.realGdp, 1e-9),
    potentialOutput: final.potentialOutput,
    technologyAttainment: final.technologyAttainment,
    growth: Math.pow(final.realGdp / Math.max(before.realGdp, 1e-9), 4 / windowLength) - 1,
    utilization: mean(window.map((entry) => entry.output / Math.max(entry.potentialOutput, 1e-9))),
    demandSatisfaction: mean(
      window.map((entry) => entry.output / Math.max(entry.grossDemand, 1e-9)),
    ),
    worksShare: mean(
      window.map((entry) => entry.worksSpending / Math.max(entry.nominalGdp, 1e-9)),
    ),
    researchShare: mean(
      window.map((entry) => entry.researchSpending / Math.max(entry.nominalGdp, 1e-9)),
    ),
    publicReplacement: final.publicInvestment / Math.max(depreciation, 1e-9),
    privateReplacement: final.privateInvestment / Math.max(depreciation, 1e-9),
    inflation: mean(window.map((entry) => entry.annualInflation)),
    debtToGdp: final.debt / Math.max(4 * final.nominalGdp, 1e-9),
    priceExplosion: points.slice(1, horizon + 1).some((entry) => entry.priceExplosion),
  }
}

function sample(
  seed: string,
  country: (typeof CURATED_COUNTRY_IDS)[number],
  scenario: Scenario,
): Sample {
  let state = init(createCountryParams(country, seed), seed, {
    protectedTenure: true,
    unlimitedCapital: true,
  })
  const points = [point(state)]
  for (let tick = 0; tick < TICKS; tick++) {
    if (state.meta.tick === ACTION_TICK) state = applyActions(state, actionsFor(state, scenario))
    state = step(state)
    points.push(point(state))
  }
  return {
    country,
    readings: new Map(HORIZONS.map((horizon) => [horizon, reading(points, horizon)])),
  }
}

const samples = new Map<string, Sample[]>(SCENARIOS.map((scenario) => [scenario.id, []]))
const started = performance.now()
for (const country of CURATED_COUNTRY_IDS) {
  for (let index = 0; index < RUNS; index++) {
    const seed = `capital-returns-${country}-${index}`
    for (const scenario of SCENARIOS) {
      samples.get(scenario.id)!.push(sample(seed, country, scenario))
    }
  }
}

const passive = samples.get('passive')!
const median = (values: number[]): number => summarize(values).p50
const pct = (value: number): string => `${(100 * value).toFixed(2)}%`
const delta = (value: number): string => `${value >= 1 ? '+' : ''}${(100 * (value - 1)).toFixed(1)}%`
const signedPoints = (value: number): string =>
  `${value >= 0 ? '+' : ''}${(100 * value).toFixed(2)}pp`
const ratio = (current: Reading, control: Reading, key: keyof Reading): number =>
  (current[key] as number) / Math.max(control[key] as number, 1e-9)

function pairs(scenario: Scenario, horizon: number, country?: Sample['country']) {
  const entries = samples.get(scenario.id)!
  return entries.flatMap((entry, index) => {
    if (country !== undefined && entry.country !== country) return []
    const current = entry.readings.get(horizon)!
    const control = passive[index].readings.get(horizon)!
    return [{ current, control }]
  })
}

const finalHorizon = HORIZONS[HORIZONS.length - 1]
console.log(
  `capital returns: ${RUNS} paired seeds x ${CURATED_COUNTRY_IDS.length} countries x ${SCENARIOS.length} scenarios x ${TICKS} ticks`,
)
console.log(
  `orders at Q${ACTION_TICK}; protected tenure + unlimited political capital; late window ${LATE_WINDOW} quarters`,
)
console.log(`wall time: ${((performance.now() - started) / 1000).toFixed(1)}s`)

console.log(`\nCAPITAL AND OUTPUT AT Q${finalHorizon} (median paired delta vs passive)`)
console.log(
  [
    'scenario'.padEnd(19),
    'capital'.padStart(9),
    'K/worker'.padStart(10),
    'K/ann.Y'.padStart(9),
    'potential'.padStart(10),
    'real GDP'.padStart(9),
    'GDP/pc'.padStart(9),
    'prod.'.padStart(9),
  ].join(' '),
)
for (const scenario of SCENARIOS) {
  const paired = pairs(scenario, finalHorizon)
  const versus = (key: keyof Reading): string =>
    scenario.id === 'passive'
      ? '—'
      : delta(median(paired.map(({ current, control }) => ratio(current, control, key))))
  console.log(
    [
      scenario.label.padEnd(19),
      versus('capital').padStart(9),
      versus('capitalPerWorker').padStart(10),
      versus('capitalToAnnualOutput').padStart(9),
      versus('potentialOutput').padStart(10),
      versus('realGdp').padStart(9),
      versus('realGdpPerCapita').padStart(9),
      versus('productivity').padStart(9),
    ].join(' '),
  )
}

console.log(`\nLATE GROWTH AND OPERATING CONDITIONS THROUGH Q${finalHorizon}`)
console.log(
  [
    'scenario'.padEnd(19),
    'growth'.padStart(9),
    'd growth'.padStart(10),
    'd tech'.padStart(9),
    'util.'.padStart(9),
    'demand'.padStart(9),
  ].join(' '),
)
for (const scenario of SCENARIOS) {
  const paired = pairs(scenario, finalHorizon)
  console.log(
    [
      scenario.label.padEnd(19),
      pct(median(paired.map(({ current }) => current.growth))).padStart(9),
      (scenario.id === 'passive'
        ? '—'
        : signedPoints(
            median(paired.map(({ current, control }) => current.growth - control.growth)),
          )
      ).padStart(10),
      (scenario.id === 'passive'
        ? '—'
        : delta(
            median(
              paired.map(({ current, control }) =>
                ratio(current, control, 'technologyAttainment'),
              ),
            ),
          )
      ).padStart(9),
      pct(median(paired.map(({ current }) => current.utilization))).padStart(9),
      pct(median(paired.map(({ current }) => current.demandSatisfaction))).padStart(9),
    ].join(' '),
  )
}

console.log(`\nPOLICY PERSISTENCE AND REPLACEMENT THROUGH Q${finalHorizon}`)
console.log(
  [
    'scenario'.padEnd(19),
    'works/GDP'.padStart(10),
    'R&D/GDP'.padStart(9),
    'pub/dep'.padStart(9),
    'priv/dep'.padStart(9),
    'infl.'.padStart(9),
    'debt/GDP'.padStart(10),
    'px explode'.padStart(11),
  ].join(' '),
)
for (const scenario of SCENARIOS) {
  const paired = pairs(scenario, finalHorizon)
  console.log(
    [
      scenario.label.padEnd(19),
      pct(median(paired.map(({ current }) => current.worksShare))).padStart(10),
      pct(median(paired.map(({ current }) => current.researchShare))).padStart(9),
      median(paired.map(({ current }) => current.publicReplacement)).toFixed(2).padStart(9),
      median(paired.map(({ current }) => current.privateReplacement)).toFixed(2).padStart(9),
      pct(median(paired.map(({ current }) => current.inflation))).padStart(9),
      pct(median(paired.map(({ current }) => current.debtToGdp))).padStart(10),
      pct(mean(paired.map(({ current }) => Number(current.priceExplosion)))).padStart(11),
    ].join(' '),
  )
}

const fixedWorks = SCENARIOS.find((scenario) => scenario.id === 'works-fixed-5')!
console.log(`\nFIXED 5% PUBLIC WORKS AT Q${finalHorizon} BY COUNTRY (median paired delta)`)
console.log(
  [
    'country'.padEnd(12),
    'capital'.padStart(9),
    'K/worker'.padStart(10),
    'real GDP'.padStart(9),
    'GDP/pc'.padStart(9),
    'prod.'.padStart(9),
    'd growth'.padStart(10),
  ].join(' '),
)
for (const country of CURATED_COUNTRY_IDS) {
  const paired = pairs(fixedWorks, finalHorizon, country)
  const versus = (key: keyof Reading): string =>
    delta(median(paired.map(({ current, control }) => ratio(current, control, key))))
  console.log(
    [
      country.padEnd(12),
      versus('capital').padStart(9),
      versus('capitalPerWorker').padStart(10),
      versus('realGdp').padStart(9),
      versus('realGdpPerCapita').padStart(9),
      versus('productivity').padStart(9),
      signedPoints(
        median(paired.map(({ current, control }) => current.growth - control.growth)),
      ).padStart(10),
    ].join(' '),
  )
}

console.log('\nFIXED 5% PUBLIC-WORKS PATH (median paired delta)')
console.log(
  [
    'horizon'.padEnd(9),
    'capital'.padStart(9),
    'K/worker'.padStart(10),
    'real GDP'.padStart(9),
    'prod.'.padStart(9),
    'works/GDP'.padStart(10),
  ].join(' '),
)
for (const horizon of HORIZONS) {
  const paired = pairs(fixedWorks, horizon)
  const versus = (key: keyof Reading): string =>
    delta(median(paired.map(({ current, control }) => ratio(current, control, key))))
  console.log(
    [
      `Q${horizon}`.padEnd(9),
      versus('capital').padStart(9),
      versus('capitalPerWorker').padStart(10),
      versus('realGdp').padStart(9),
      versus('productivity').padStart(9),
      pct(median(paired.map(({ current }) => current.worksShare))).padStart(10),
    ].join(' '),
  )
}
