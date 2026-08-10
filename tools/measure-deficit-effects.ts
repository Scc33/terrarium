/**
 * Reproduce investigation 0003's paired deficit sweep:
 *
 *   pnpm exec tsx tools/measure-deficit-effects.ts 200 80
 *
 * Percentage columns are printed in percentage points. A trailing `*` marks
 * the exogenous debt-stock diagnostic rather than a player action.
 */
import {
  applyActions,
  init,
  MERIDIA_PARAMS,
  step,
  technologyAttainment,
  type Action,
  type TrueState,
} from '../packages/engine/src/index'

const RUNS = Number(process.argv[2] ?? 200)
const TICKS = Number(process.argv[3] ?? 80)
const HORIZONS = [20, 40, 60, 80].filter((tick) => tick <= TICKS)

interface Scenario {
  id: string
  beforeStep?(state: TrueState): TrueState
  actions(state: TrueState): Action[]
}

const scenarios: Scenario[] = [
  { id: 'passive', actions: () => [] },
  {
    id: 'transfer-4',
    actions: (state) =>
      state.meta.tick === 4
        ? [{ kind: 'setDial', path: 'spending.transfers', value: 4 }]
        : [],
  },
  {
    id: 'transfer-8%',
    actions: (state) =>
      state.meta.tick === 4
        ? [{ kind: 'setSpendingRule', programme: 'transfers', mode: 'gdpShare', value: 0.08 }]
        : [],
  },
  {
    id: 'spend-6+6',
    actions: (state) =>
      state.meta.tick === 4
        ? [{ kind: 'setDial', path: 'spending.transfers', value: 6 }]
        : state.meta.tick === 8
          ? [{ kind: 'setDial', path: 'spending.procurement', value: 6 }]
          : [],
  },
  {
    id: 'tax-cut',
    actions: (state) =>
      state.meta.tick === 4
        ? [{ kind: 'setDial', path: 'taxRates.income', value: 0.05 }]
        : state.meta.tick === 8
          ? [{ kind: 'setDial', path: 'taxRates.corporate', value: 0.05 }]
          : [],
  },
  {
    // Diagnostic, not a player action: put the same economy under a 100%-of-GDP
    // inherited debt at q4 while holding every tax and programme dial fixed.
    id: 'debt-shock*',
    beforeStep: (state) =>
      state.meta.tick === 4
        ? {
            ...state,
            gov: { ...state.gov, debt: 4 * state.flows.nominalGdp },
            ledger: { ...state.ledger, debtToGdp: 1 },
          }
        : state,
    actions: () => [],
  },
]

interface Point {
  tick: number
  realGdp: number
  capital: number
  technology: number
  privateInvestment: number
  consumption: number
  debtToGdp: number
  balanceToGdp: number
  interestToGdp: number
  interestShare: number
  printedToGdp: number
  inflation: number
  expectedInflation: number
  privateRealRate: number
  creditToGdp: number
  assetPrice: number
  financierPower: number
  inPower: boolean
}

function point(state: TrueState): Point {
  const quarterlyGdp = Math.max(state.flows.nominalGdp, 1e-9)
  const outlays = Math.max(state.gov.budget.outlays, 1e-9)
  return {
    tick: state.meta.tick,
    realGdp: state.flows.realGdp,
    capital: state.sectors.reduce((sum, sector) => sum + sector.capital, 0),
    technology: technologyAttainment(state),
    privateInvestment: state.flows.investmentReal - state.flows.publicInvestmentReal,
    consumption: Object.values(state.flows.cohortSpend).reduce((sum, value) => sum + value, 0),
    debtToGdp: state.gov.debt / (4 * quarterlyGdp),
    balanceToGdp: state.gov.budget.balance / quarterlyGdp,
    interestToGdp: state.flows.debtInterest / quarterlyGdp,
    interestShare: state.flows.debtInterest / outlays,
    printedToGdp: state.flows.printedThisQtr / quarterlyGdp,
    inflation: 4 * state.flows.inflationQ,
    expectedInflation: state.ledger.inflationExpectations,
    privateRealRate: state.gov.dials.policyRate - state.ledger.inflationExpectations,
    creditToGdp: state.finance.creditToGdp,
    assetPrice: state.finance.assetPrice,
    financierPower: state.institutions.blocs.financiers.power,
    inPower: state.politics.inPower,
  }
}

function play(seed: string, scenario: Scenario): Point[] {
  let state = init(MERIDIA_PARAMS, seed)
  const points: Point[] = []
  for (let tick = 0; tick < TICKS; tick++) {
    state = scenario.beforeStep?.(state) ?? state
    state = applyActions(state, scenario.actions(state))
    state = step(state)
    points.push(point(state))
  }
  return points
}

const mean = (values: number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)

const pct = (value: number): string => (100 * value).toFixed(1)
const num = (value: number): string => value.toFixed(2)

const samples = new Map<string, Point[][]>()
for (const scenario of scenarios) samples.set(scenario.id, [])
for (let run = 0; run < RUNS; run++) {
  const seed = `deficit-${run}`
  for (const scenario of scenarios) samples.get(scenario.id)!.push(play(seed, scenario))
}

console.log(`runs=${RUNS} ticks=${TICKS}`)
for (const horizon of HORIZONS) {
  const start = Math.max(0, horizon - 8)
  console.log(`\nLAST 8 QUARTERS THROUGH Q${horizon}`)
  console.log(
    [
      'scenario'.padEnd(13),
      'bal/GDP'.padStart(8),
      'debt/GDP'.padStart(9),
      'int/GDP'.padStart(8),
      'int/out'.padStart(8),
      'print/GDP'.padStart(10),
      'infl'.padStart(7),
      'real r'.padStart(7),
      'GDP vs p'.padStart(9),
      'priv I vs p'.padStart(11),
      'K vs p'.padStart(8),
      'tech vs p'.padStart(9),
      'C vs p'.padStart(8),
      'fin pow'.padStart(8),
    ].join(' '),
  )
  const passive = samples.get('passive')!
  for (const scenario of scenarios) {
    const runs = samples.get(scenario.id)!
    const values = (key: keyof Point) =>
      runs.flatMap((points) => points.slice(start, horizon).map((p) => p[key] as number))
    const pairedRatio = (
      key: 'realGdp' | 'privateInvestment' | 'capital' | 'technology' | 'consumption',
    ) =>
      mean(
        runs.map((points, i) =>
          mean(points.slice(start, horizon).map((p) => p[key])) /
            mean(passive[i].slice(start, horizon).map((p) => p[key])) -
          1,
        ),
      )
    console.log(
      [
        scenario.id.padEnd(13),
        pct(mean(values('balanceToGdp'))).padStart(8),
        pct(mean(values('debtToGdp'))).padStart(9),
        pct(mean(values('interestToGdp'))).padStart(8),
        pct(mean(values('interestShare'))).padStart(8),
        pct(mean(values('printedToGdp'))).padStart(10),
        pct(mean(values('inflation'))).padStart(7),
        pct(mean(values('privateRealRate'))).padStart(7),
        pct(pairedRatio('realGdp')).padStart(9),
        pct(pairedRatio('privateInvestment')).padStart(11),
        pct(pairedRatio('capital')).padStart(8),
        pct(pairedRatio('technology')).padStart(9),
        pct(pairedRatio('consumption')).padStart(8),
        num(mean(values('financierPower'))).padStart(8),
      ].join(' '),
    )
  }
}

const passiveRuns = samples.get('passive')!
const shockRuns = samples.get('debt-shock*')!
const maxShockStepDifference = (key: 'realGdp' | 'privateInvestment'): number =>
  Math.max(...shockRuns.map((points, i) => Math.abs(points[4][key] - passiveRuns[i][4][key])))
console.log('\nDEBT-STOCK ISOLATION AT THE Q4 SHOCK STEP')
console.log(`max |GDP shock - passive|: ${maxShockStepDifference('realGdp')}`)
console.log(`max |private investment shock - passive|: ${maxShockStepDifference('privateInvestment')}`)

console.log('\nEVENT RATES THROUGH FINAL QUARTER')
console.log('scenario       ever-print debt>120% deposed')
for (const scenario of scenarios) {
  const runs = samples.get(scenario.id)!
  console.log(
    [
      scenario.id.padEnd(13),
      pct(mean(runs.map((points) => Number(points.some((p) => p.printedToGdp > 1e-9))))).padStart(10),
      pct(mean(runs.map((points) => Number(points.some((p) => p.debtToGdp > 1.2))))).padStart(9),
      pct(mean(runs.map((points) => Number(points.some((p) => !p.inPower))))).padStart(7),
    ].join(' '),
  )
}
