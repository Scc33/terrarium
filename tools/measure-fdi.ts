/**
 * What a cabinet can do about foreign direct investment, and what it is worth
 * (issue #146):
 *
 *   pnpm fdi -- --runs 20 --ticks 400
 *
 * ADR-0018 gave FDI no dial on purpose. The flow is a product of eleven
 * multipliers, so the real question is not "is there a policy" but "which of
 * the eleven can an order reach, how far, and does the century move".
 *
 * Six sections, in three measurements, because they answer different questions
 * and disagree with each other:
 *
 * 1. WHERE THE FLOW COMES FROM. Each factor's realized value at a reference
 *    state, obtained by re-running the pure `foreignInvestment` step with that
 *    one input neutralized and dividing. Nothing here re-implements the
 *    formula: a factor that moves in `foreignInvestment.ts` moves here too.
 * 2. WHAT ONE ORDER IS WORTH ON THE MARGIN. The same counterfactual, but with
 *    player-legal dial values rather than neutral ones. This is an instantaneous
 *    reading with every other quantity held still — an upper bound on the
 *    order, not a prediction about the century.
 * 3. WHAT THE CENTURY IS WORTH. Paired seeds against a passive control, with
 *    the general equilibrium switched back on, truncated at deposition. This is
 *    the number to quote when asked what a lever is worth in play.
 *
 * Parts 4 to 6 exist because the first three each hide something. The passive
 * terrain (4) falls by half across a century on its own, which is the scale
 * every policy result has to be read against. The two safety terms (5) read
 * 1.000 at any reference tick a decent government reaches, so they have to be
 * measured every quarter or they look inert. And the factor an order aimed at
 * (6) is the only way to tell a lever that did nothing from a lever the
 * economy undid.
 *
 * The ownership and remittance columns are in part 3 because raising the flow
 * is not the goal: FDI is owned capital, so the same policy that raises the
 * inflow raises the foreign-owned share of the capital stock and the profits
 * remitted out of household income.
 */

import {
  createCountryParams,
  CURATED_COUNTRY_IDS,
  fdiStructuralAttraction,
  init,
  rngFor,
  TICK_ORDER,
  type Action,
  type CapacityId,
  type CountryScenarioId,
  type DialPath,
  type TrueState,
} from '../packages/engine/src/index'
import {
  CONF_NEUTRAL,
  FDI_CATCHUP_FLOOR,
  FDI_NORMAL_AFTER_TAX_PROFIT_SHARE,
  IMMIGRATION_LIMIT_MAX,
} from '../packages/engine/src/constants'
import { SECTOR_IDS } from '../packages/engine/src/state/schema'
import { summarize } from '../packages/runner/src/metrics'
import { developmentalPolicy, randomPolicy, type RunnerPolicy } from '../packages/runner/src/policies'
import { runOne } from '../packages/runner/src/run'

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const RUNS = Number(arg('runs', '20'))
const TICKS = Number(arg('ticks', '160'))
const WINDOW = 8
const HORIZONS = [...new Set([20, 80, 160, TICKS].filter((tick) => tick <= TICKS))].sort(
  (a, b) => a - b,
)
/** Quarters at which a reference state is kept for parts 1 and 2. The flow's
 * own terrain terms move with development, so one snapshot would describe the
 * 1956 country and be quoted about the 2026 one. */
const REFERENCE_TICKS = [40, 120, 320].filter((tick) => tick <= TICKS)
/** Whole `TrueState` snapshots are what parts 1 and 2 counterfactual against,
 * and each carries the office's entire archive — so they are kept for a few
 * seeds per country rather than all of them. */
const REFERENCE_RUNS = Math.min(RUNS, 4)

if (!Number.isInteger(RUNS) || RUNS <= 0) throw new Error('--runs must be a positive integer')
if (!Number.isInteger(TICKS) || TICKS < WINDOW) {
  throw new Error(`--ticks must be an integer at least ${WINDOW}`)
}

// ---------- the pure step, re-run under a counterfactual ----------

const FDI_INDEX = TICK_ORDER.findIndex((candidate) => candidate.name === 'foreignInvestment')
const FDI_STEP = TICK_ORDER[FDI_INDEX]

/**
 * The exact state `foreignInvestment` will read this quarter.
 *
 * Every counterfactual below is a ratio between the step run on one state and
 * the step run on a neutralized copy of it, so the state has to be the step's
 * own INPUT. The end-of-tick state is not: `production` and `prices` have
 * since recomputed profits, nominal GDP and inflation, and `labor` has already
 * added this quarter's inflow to the foreign-owned stock — which would have
 * the saturation term reading its own output.
 *
 * `RunObserver` has no per-step hook, so the prefix of the versioned tick is
 * re-run here from the post-order state. That is exact rather than
 * approximate: the steps are pure and each draws from a substream keyed by
 * (seed, step name, tick), so this reproduces what `step` is about to compute.
 * The prefix is taken from `TICK_ORDER` itself, so a step inserted ahead of
 * foreign investment joins it without an edit here.
 */
function fdiStepInput(state: TrueState): TrueState {
  let current = state
  for (let index = 0; index < FDI_INDEX; index++) {
    const pipelineStep = TICK_ORDER[index]
    current = pipelineStep.run(
      current,
      rngFor(current.meta.seed, pipelineStep.name, current.meta.tick),
    )
  }
  return current
}

/** Inward FDI as a share of nominal GDP, as the office's own worksheet takes
 * it: both sides quarterly, so the ratio is already the annual convention. */
function fdiShare(state: TrueState): number {
  const after = FDI_STEP.run(state, rngFor(state.meta.seed, FDI_STEP.name, state.meta.tick))
  return after.flows.foreignDirectInvestmentValue / Math.max(after.flows.nominalGdp, 1e-9)
}

type Edit = (state: TrueState) => TrueState

const withDial = (path: 'corporate' | 'tariff', value: number): Edit =>
  (state) => ({
    ...state,
    gov: {
      ...state.gov,
      dials: {
        ...state.gov.dials,
        taxRates: { ...state.gov.dials.taxRates, [path]: value },
      },
    },
  })

const withCapacity = (target: CapacityId, value: number): Edit =>
  (state) => ({
    ...state,
    gov: { ...state.gov, capacity: { ...state.gov.capacity, [target]: value } },
  })

/** Scale every sector's export order so the value share of nominal GDP lands
 * on the flow's own neutral point. Reads state; re-derives no FDI arithmetic. */
const withExportShare = (target: number): Edit => (state) => {
  const value = SECTOR_IDS.reduce(
    (sum, id) => sum + state.market.prices[id] * state.flows.exportsReal[id],
    0,
  )
  const scale = (target * Math.max(state.flows.nominalGdp, 1e-9)) / Math.max(value, 1e-9)
  return {
    ...state,
    flows: {
      ...state.flows,
      exportsReal: Object.fromEntries(
        SECTOR_IDS.map((id) => [id, state.flows.exportsReal[id] * scale]),
      ) as TrueState['flows']['exportsReal'],
    },
  }
}

/** Close every sector's technique gap, which puts the catch-up term on its
 * floor rather than on 1 — hence the FDI_CATCHUP_FLOOR in the reading below. */
const closeTechGap: Edit = (state) => ({
  ...state,
  tech: {
    ...state.tech,
    attained: Object.fromEntries(
      SECTOR_IDS.map((id) => [id, Number.POSITIVE_INFINITY]),
    ) as TrueState['tech']['attained'],
  },
})

/**
 * What an order can do about a term. Deliberately three-way rather than a
 * terrain/not-terrain boolean: catch-up room and ownership saturation look
 * sealed from the cabinet desk and are not — research closes the technique gap
 * the flow is reading, which is why funding it LOWERS the inflow, and every
 * policy that attracts capital fills the saturation term that then repels it.
 * Calling those terrain would answer this study's central question wrongly.
 */
type Reach =
  /** a dial or a capacity order moves this term and nothing else */
  | 'ordered'
  /** only reachable as a by-product of some other policy */
  | 'indirect'
  /** no order reaches it at all */
  | 'sealed'

interface Factor {
  id: string
  /** what the neutralizing edit sets the factor to; the realized value is
   * `base / neutralized × pinned` */
  pinned: number
  neutralize: Edit
  reach: Reach
}

const FACTORS: readonly Factor[] = [
  {
    id: 'tariff',
    pinned: 1,
    reach: 'ordered',
    neutralize: withDial('tariff', 0),
  },
  {
    id: 'corporate return',
    pinned: 1,
    reach: 'ordered',
    // The return term is 1 at the normal after-tax profit share, so it is
    // neutralized by moving the profits rather than the rate: the rate the
    // government sets is only half of what an investor is looking at.
    neutralize: (state) => {
      const positive = SECTOR_IDS.reduce((sum, id) => sum + Math.max(0, state.flows.profits[id]), 0)
      const target =
        (FDI_NORMAL_AFTER_TAX_PROFIT_SHARE * Math.max(state.flows.nominalGdp, 1e-9)) /
        Math.max(1 - state.gov.dials.taxRates.corporate, 1e-9)
      const scale = target / Math.max(positive, 1e-9)
      return {
        ...state,
        gov: {
          ...state.gov,
          // taxEfficiency(1) = 1, so the posted rate is the collected rate and
          // the algebra above is exact.
          capacity: { ...state.gov.capacity, tax: 1 },
        },
        flows: {
          ...state.flows,
          profits: Object.fromEntries(
            SECTOR_IDS.map((id) => [id, Math.max(0, state.flows.profits[id]) * scale]),
          ) as TrueState['flows']['profits'],
        },
      }
    },
  },
  { id: 'administration', pinned: 1, reach: 'ordered', neutralize: withCapacity('administrative', 1) },
  { id: 'export intensity', pinned: 1, reach: 'indirect', neutralize: withExportShare(0.15) },
  {
    id: 'business confidence',
    pinned: 1,
    reach: 'indirect',
    neutralize: (state) => ({
      ...state,
      ledger: {
        ...state.ledger,
        confidence: { ...state.ledger.confidence, business: CONF_NEUTRAL },
      },
    }),
  },
  {
    id: 'price stability',
    pinned: 1,
    reach: 'indirect',
    neutralize: (state) => ({ ...state, flows: { ...state.flows, inflationQ: 0 } }),
  },
  {
    id: 'banking crisis',
    pinned: 1,
    // the bank-capital floor is a dial, but it reaches this term only by
    // changing how often a crisis happens at all
    reach: 'indirect',
    neutralize: (state) => ({ ...state, finance: { ...state.finance, crisisQtrsLeft: 0 } }),
  },
  {
    id: 'catch-up room',
    pinned: FDI_CATCHUP_FLOOR,
    // research closes this gap; that is what the research arm measures
    reach: 'indirect',
    neutralize: closeTechGap,
  },
  {
    id: 'ownership saturation',
    pinned: 1,
    // filled by the inflow every successful FDI policy produces
    reach: 'indirect',
    neutralize: (state) => ({
      ...state,
      external: { ...state.external, foreignOwnedCapital: 0 },
    }),
  },
  {
    id: 'foreign cycle',
    pinned: 1,
    reach: 'sealed',
    neutralize: (state) => ({
      ...state,
      external: {
        ...state.external,
        world: {
          ...state.external.world,
          partners: state.external.world.partners.map((partner) => ({ ...partner, activity: 1 })),
        },
      },
    }),
  },
]

/** Player-legal single orders, priced instantaneously against the state as it
 * stands. `capacity` entries are not orders — `investCapacity` buys a fraction
 * of a point per quarter — so they are labelled as the channel's bound. */
interface MarginalOrder {
  id: string
  edit: Edit
  order: boolean
}

const MARGINAL_ORDERS: readonly MarginalOrder[] = [
  { id: 'tariff -> 0 (from 10%)', edit: withDial('tariff', 0), order: true },
  { id: 'tariff -> 40%', edit: withDial('tariff', 0.4), order: true },
  { id: 'tariff -> 100% (max)', edit: withDial('tariff', 1), order: true },
  { id: 'corporate tax -> 0 (from 20%)', edit: withDial('corporate', 0), order: true },
  { id: 'corporate tax -> 50%', edit: withDial('corporate', 0.5), order: true },
  { id: 'corporate tax -> 80% (max)', edit: withDial('corporate', 0.8), order: true },
  { id: 'administration -> 1.00', edit: withCapacity('administrative', 1), order: false },
  { id: 'administration -> 0.05', edit: withCapacity('administrative', 0.05), order: false },
  { id: 'tax office -> 1.00', edit: withCapacity('tax', 1), order: false },
  {
    id: 'tariff 0 + corporate 5% + admin 1.00',
    edit: (state) =>
      withCapacity('administrative', 1)(withDial('corporate', 0.05)(withDial('tariff', 0)(state))),
    order: false,
  },
]

// ---------- played centuries ----------

interface Scenario {
  id: string
  policy?: RunnerPolicy
  /** True once the order this arm exists to test is actually in force.
   * Recorded per run, because a refused order makes an arm measure nothing
   * while still printing a plausible row of near-zero differences. */
  landed?: (state: TrueState) => boolean
}

/** Re-attempt the order every quarter until the engine accepts it. A single
 * scripted attempt is refused whenever the bill exceeds the political capital
 * the cabinet happens to be holding — `setSpendingRule` at 15% of GDP is
 * priced near 30 PC against the ~23 a fourth-quarter government has — and
 * `runOne` is lenient about exactly that. */
const insist = (make: (state: TrueState) => Action, landed: (state: TrueState) => boolean): RunnerPolicy =>
  (state) => (landed(state) ? [] : [make(state)])

const dialAt = (path: DialPath, read: (state: TrueState) => number, value: number): Scenario['policy'] =>
  insist(
    () => ({ kind: 'setDial', path, value }),
    (state) => Math.abs(read(state) - value) < 1e-9,
  )

const taxRate = (key: 'corporate' | 'tariff') => (state: TrueState) => state.gov.dials.taxRates[key]

const capacityPolicy = (ids: readonly CapacityId[]): RunnerPolicy =>
  (_state, _rng, tick) =>
    tick % 8 === 0 ? ids.map((target) => ({ kind: 'investCapacity', target, amount: 2 })) : []

const both = (...policies: readonly RunnerPolicy[]): RunnerPolicy =>
  (state, rng, tick) => policies.flatMap((policy) => policy(state, rng, tick))

const transfersRule: RunnerPolicy = insist(
  () => ({ kind: 'setSpendingRule', programme: 'transfers', mode: 'gdpShare', value: 0.15 }),
  (state) => state.gov.spendingRules.transfers.kind === 'gdpShare',
)

/** Every order pointing the same way, held for the century: the closest thing
 * to an investment-promotion programme the existing cabinet can write. */
const openForBusiness: RunnerPolicy = both(
  dialAt('taxRates.tariff', taxRate('tariff'), 0)!,
  dialAt('taxRates.corporate', taxRate('corporate'), 0.05)!,
  capacityPolicy(['administrative']),
)

const scenarios: readonly Scenario[] = [
  { id: 'passive' },
  {
    id: 'zero-tariff',
    policy: dialAt('taxRates.tariff', taxRate('tariff'), 0),
    landed: (state) => state.gov.dials.taxRates.tariff === 0,
  },
  {
    id: 'tariff-40%',
    policy: dialAt('taxRates.tariff', taxRate('tariff'), 0.4),
    landed: (state) => state.gov.dials.taxRates.tariff === 0.4,
  },
  {
    id: 'corporate-tax-0',
    policy: dialAt('taxRates.corporate', taxRate('corporate'), 0),
    landed: (state) => state.gov.dials.taxRates.corporate === 0,
  },
  {
    id: 'corporate-tax-50%',
    policy: dialAt('taxRates.corporate', taxRate('corporate'), 0.5),
    landed: (state) => state.gov.dials.taxRates.corporate === 0.5,
  },
  {
    id: 'zero-policy-rate',
    policy: dialAt('policyRate', (state) => state.gov.dials.policyRate, 0),
    landed: (state) => state.gov.dials.policyRate === 0,
  },
  {
    id: 'transfers-15%GDP',
    policy: transfersRule,
    landed: (state) => state.gov.spendingRules.transfers.kind === 'gdpShare',
  },
  {
    id: 'research-5%GDP',
    // The catch-up term is terrain to an order but not to a programme: closing
    // the technique gap is what research is FOR, and the flow reads the gap.
    policy: insist(
      () => ({ kind: 'setSpendingRule', programme: 'research', mode: 'gdpShare', value: 0.05 }),
      (state) => state.gov.spendingRules.research.kind === 'gdpShare',
    ),
    landed: (state) => state.gov.spendingRules.research.kind === 'gdpShare',
  },
  {
    id: 'open-border',
    // The size term is a population elasticity, and the border is a dial.
    policy: dialAt('immigrationLimit', (state) => state.gov.dials.immigrationLimit, IMMIGRATION_LIMIT_MAX),
    landed: (state) => state.gov.dials.immigrationLimit === IMMIGRATION_LIMIT_MAX,
  },
  {
    id: 'closed-border',
    policy: dialAt('immigrationLimit', (state) => state.gov.dials.immigrationLimit, 0),
    landed: (state) => state.gov.dials.immigrationLimit === 0,
  },
  {
    id: 'bank-capital-15%',
    // The crisis multiplier is the flow's sharpest term; the macroprudential
    // floor is the only order that changes how often it is reached.
    policy: dialAt('capitalRequirement', (state) => state.gov.dials.capitalRequirement, 0.15),
    landed: (state) => state.gov.dials.capitalRequirement === 0.15,
  },
  { id: 'admin-capacity', policy: capacityPolicy(['administrative']) },
  { id: 'tax-capacity', policy: capacityPolicy(['tax']) },
  { id: 'all-capacities', policy: developmentalPolicy },
  {
    id: 'open-for-business',
    policy: openForBusiness,
    landed: (state) =>
      state.gov.dials.taxRates.tariff === 0 && state.gov.dials.taxRates.corporate === 0.05,
  },
  { id: 'random-policy', policy: randomPolicy },
]

interface Point {
  tick: number
  inPower: boolean
  fdiShare: number
  foreignOwnedShare: number
  remittanceShare: number
  capital: number
  realGdpPerHead: number
  /** Realized factors, measured every quarter rather than at a reference
   * tick. Two of them a government reaches only by accident, so a snapshot
   * reports 1.000 and says nothing about what they are worth when they bind;
   * the other three are the ones policy is supposed to move, and the whole
   * question is whether the century leaves them moved. */
  factors: Record<TrackedFactor, number>
}

/** Cheap enough to re-run every quarter for every arm; the step is pure and
 * one of thirty. */
const TRACKED_FACTORS = [
  'corporate return',
  'administration',
  'ownership saturation',
  'price stability',
  'banking crisis',
] as const
type TrackedFactor = (typeof TRACKED_FACTORS)[number]

function point(state: TrueState, input: TrueState): Point {
  const capital = state.sectors.reduce((sum, sector) => sum + sector.capital, 0)
  const population = state.demography.pyramid.reduce((sum, people) => sum + people, 0)
  const nominalGdp = Math.max(state.flows.nominalGdp, 1e-9)
  return {
    tick: state.meta.tick,
    inPower: state.politics.inPower,
    // The office's own definition (`recordOf`): the value the step produced
    // over THIS quarter's nominal GDP, so part 3 reads the same number the
    // published instrument does...
    fdiShare: state.flows.foreignDirectInvestmentValue / nominalGdp,
    foreignOwnedShare: state.external.foreignOwnedCapital / Math.max(capital, 1e-9),
    remittanceShare: state.flows.foreignProfitRemittances / nominalGdp,
    capital,
    realGdpPerHead: state.flows.realGdp / Math.max(population, 1e-9),
    // ...but the factors come from the step's own input, not from here.
    factors: Object.fromEntries(
      TRACKED_FACTORS.map((id) => [id, factorOf(input, id)]),
    ) as Record<TrackedFactor, number>,
  }
}

const FACTOR_BY_ID = new Map(FACTORS.map((factor) => [factor.id, factor]))

/** One factor's realized value, read by dividing the step's own output by the
 * same step with that input neutralized. */
function factorOf(state: TrueState, id: string): number {
  const factor = FACTOR_BY_ID.get(id)!
  return (fdiShare(state) / Math.max(fdiShare(factor.neutralize(state)), 1e-12)) * factor.pinned
}

interface Reading {
  alive: boolean
  fdiShare: number
  foreignOwnedShare: number
  remittanceShare: number
  capital: number
  realGdpPerHead: number
  factors: Record<TrackedFactor, number>
}

/** A reference quarter kept whole for parts 1 and 2: the state the step read,
 * beside the share the office went on to publish for it. */
interface Reference {
  input: TrueState
  publishedShare: number
}

interface Sample {
  readings: Map<number, Reading>
  references: Map<number, Reference>
  points: Point[]
  /** the quarter the arm's own order came into force, or null if it never did */
  landedAt: number | null
}

const mean = (values: readonly number[]): number =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)

function reading(points: readonly Point[], horizon: number): Reading {
  const window = points.slice(Math.max(0, horizon - WINDOW), horizon)
  const last = window[window.length - 1] ?? points[points.length - 1]
  return {
    alive: window.every((entry) => entry.inPower),
    fdiShare: mean(window.map((entry) => entry.fdiShare)),
    foreignOwnedShare: last.foreignOwnedShare,
    remittanceShare: mean(window.map((entry) => entry.remittanceShare)),
    capital: last.capital,
    realGdpPerHead: mean(window.map((entry) => entry.realGdpPerHead)),
    factors: Object.fromEntries(
      TRACKED_FACTORS.map((id) => [id, mean(window.map((entry) => entry.factors[id]))]),
    ) as Record<TrackedFactor, number>,
  }
}

function sample(seed: string, country: CountryScenarioId, scenario: Scenario, keepReferences: boolean): Sample {
  const points: Point[] = []
  const references = new Map<number, Reference>()
  let landedAt: number | null = null
  let input: TrueState | null = null
  runOne({
    seed,
    country,
    ticks: TICKS,
    policy: scenario.policy,
    includeStateHash: false,
    observer: {
      afterActions(state) {
        input = fdiStepInput(state)
      },
      afterStep(state) {
        const measured = point(state, input!)
        points.push(measured)
        if (landedAt === null && scenario.landed?.(state) === true) landedAt = state.meta.tick
        if (keepReferences && REFERENCE_TICKS.includes(state.meta.tick)) {
          references.set(state.meta.tick, {
            input: input!,
            publishedShare: measured.fdiShare,
          })
        }
      },
    },
  })
  return {
    readings: new Map(HORIZONS.map((horizon) => [horizon, reading(points, horizon)])),
    references,
    points,
    landedAt,
  }
}

// ---------- run ----------

const samples = new Map<string, Sample[]>(scenarios.map((scenario) => [scenario.id, []]))
const started = performance.now()
for (const country of CURATED_COUNTRY_IDS) {
  for (let index = 0; index < RUNS; index++) {
    const seed = `fdi-${country}-${index}`
    for (const scenario of scenarios) {
      samples
        .get(scenario.id)!
        .push(sample(seed, country, scenario, scenario.id === 'all-capacities' && index < REFERENCE_RUNS))
    }
  }
}

const median = (values: number[]): number => summarize(values).p50
const signed = (value: number, suffix = ''): string =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}${suffix}`

console.log(
  `foreign direct investment: ${RUNS} paired seeds x ${CURATED_COUNTRY_IDS.length} countries x ${scenarios.length} scenarios x ${TICKS} ticks`,
)
console.log(`wall time: ${((performance.now() - started) / 1000).toFixed(1)}s`)

// PART 1 — where the flow comes from
console.log('\nPART 1 - REALIZED FACTORS OF THE INFLOW (all-capacities arm, median over runs)')
console.log('a factor of 1.00 is neutral. REACH: what an order can do about it —')
console.log('  ordered  = a dial or a capacity order moves this term and nothing else;')
console.log('  indirect = only reachable as a by-product of some other policy;')
console.log('  sealed   = no order reaches it at all.')
const referenceSamples = samples.get('all-capacities')!
const referencesAt = (tick: number): Reference[] =>
  referenceSamples
    .map((entry) => entry.references.get(tick))
    .filter((entry): entry is Reference => entry !== undefined)

for (const tick of REFERENCE_TICKS) {
  const references = referencesAt(tick)
  if (references.length === 0) continue
  const states = references.map((entry) => entry.input)
  console.log(`\n  Q${tick} (${1946 + Math.floor(tick / 4)})`)
  console.log(['    factor'.padEnd(28), 'median'.padStart(8), 'p05'.padStart(8), 'p95'.padStart(8), 'reach'].join(' '))
  const rows: { id: string; values: number[]; reach: Reach }[] = [
    {
      id: 'country terrain',
      reach: 'sealed',
      values: states.map((state) =>
        fdiStructuralAttraction(
          state.demography.pyramid.reduce((sum, people) => sum + people, 0),
          state.params.development,
          state.params.openness,
        ),
      ),
    },
    ...FACTORS.map((factor) => ({
      id: factor.id,
      reach: factor.reach,
      values: states.map(
        (state) => (fdiShare(state) / Math.max(fdiShare(factor.neutralize(state)), 1e-12)) * factor.pinned,
      ),
    })),
  ]
  for (const row of rows) {
    const stats = summarize(row.values)
    console.log(
      [
        `    ${row.id}`.padEnd(28),
        stats.p50.toFixed(3).padStart(8),
        stats.p05.toFixed(3).padStart(8),
        stats.p95.toFixed(3).padStart(8),
        row.reach,
      ].join(' '),
    )
  }
  console.log(
    `    published inflow: ${(100 * median(references.map((entry) => entry.publishedShare))).toFixed(2)}% of GDP`,
  )
}

// PART 2 — the marginal order
console.log('\nPART 2 - ONE ORDER, EVERYTHING ELSE HELD STILL (% change in the quarter it lands)')
console.log(
  ['  order'.padEnd(40), ...REFERENCE_TICKS.map((tick) => `Q${tick}`.padStart(10))].join(' '),
)
for (const entry of MARGINAL_ORDERS) {
  const cells = REFERENCE_TICKS.map((tick) => {
    const states = referencesAt(tick).map((reference) => reference.input)
    if (states.length === 0) return '-'.padStart(10)
    return signed(
      median(states.map((state) => 100 * (fdiShare(entry.edit(state)) / Math.max(fdiShare(state), 1e-12) - 1))),
      '%',
    ).padStart(10)
  })
  console.log([`  ${entry.id}${entry.order ? '' : ' *'}`.padEnd(40), ...cells].join(' '))
}
console.log('  * not an order: a capacity is bought a fraction of a point at a time.')

/** The quarter the arm's order came into force. An arm whose order never
 * landed is not a quiet result — it is a row measuring nothing, so it says so
 * rather than printing a plausible column of near-zeros. */
function landedLabel(scenario: Scenario, entries: readonly Sample[]): string {
  if (scenario.landed === undefined) return '-'
  const landed = entries.map((entry) => entry.landedAt).filter((tick): tick is number => tick !== null)
  if (landed.length === 0) return 'NEVER'
  const label = `Q${median(landed).toFixed(0)}`
  return landed.length < entries.length ? `${label}*` : label
}

// PART 3 — the century
for (const horizon of HORIZONS) {
  console.log(`\nPART 3 - LAST ${Math.min(WINDOW, horizon)} QUARTERS THROUGH Q${horizon}`)
  console.log(
    [
      '  scenario'.padEnd(22),
      'paired'.padStart(9),
      'landed'.padStart(8),
      'FDI/GDP'.padStart(9),
      'd FDI'.padStart(9),
      'd owned'.padStart(9),
      'd remit'.padStart(9),
      'd FDI %'.padStart(9),
      'd capital'.padStart(10),
      'd GDP/head'.padStart(11),
    ].join(' '),
  )
  const passive = samples.get('passive')!
  for (const scenario of scenarios) {
    const entries = samples.get(scenario.id)!
    const paired = entries.flatMap((entry, index) => {
      const current = entry.readings.get(horizon)!
      const control = passive[index].readings.get(horizon)!
      return current.alive && control.alive ? [{ current, control }] : []
    })
    const relative = (pick: (r: Reading) => number): number =>
      median(paired.map(({ current, control }) => 100 * (pick(current) / Math.max(pick(control), 1e-12) - 1)))
    console.log(
      [
        `  ${scenario.id}`.padEnd(22),
        `${paired.length}/${entries.length}`.padStart(9),
        landedLabel(scenario, entries).padStart(8),
        `${(100 * median(paired.map(({ current }) => current.fdiShare))).toFixed(2)}%`.padStart(9),
        signed(
          median(paired.map(({ current, control }) => 100 * (current.fdiShare - control.fdiShare))),
          'pp',
        ).padStart(9),
        signed(
          median(
            paired.map(
              ({ current, control }) => 100 * (current.foreignOwnedShare - control.foreignOwnedShare),
            ),
          ),
          'pp',
        ).padStart(9),
        signed(
          median(
            paired.map(
              ({ current, control }) => 100 * (current.remittanceShare - control.remittanceShare),
            ),
          ),
          'pp',
        ).padStart(9),
        signed(relative((r) => r.fdiShare), '%').padStart(9),
        signed(relative((r) => r.capital), '%').padStart(10),
        signed(relative((r) => r.realGdpPerHead), '%').padStart(11),
      ].join(' '),
    )
  }
}

// PART 4 — the terrain the cabinet inherits
console.log('\nPART 4 - PASSIVE FDI/GDP BY COUNTRY (median, % of GDP)')
console.log(
  ['  country'.padEnd(12), 'openness'.padStart(9), ...HORIZONS.map((horizon) => `Q${horizon}`.padStart(8))].join(' '),
)
for (let countryIndex = 0; countryIndex < CURATED_COUNTRY_IDS.length; countryIndex++) {
  const country = CURATED_COUNTRY_IDS[countryIndex]
  const offset = countryIndex * RUNS
  const entries = samples.get('passive')!.slice(offset, offset + RUNS)
  const openness = init(createCountryParams(country, 'fdi-terrain'), 'fdi-terrain').params.openness
  console.log(
    [
      `  ${country}`.padEnd(12),
      openness.toFixed(2).padStart(9),
      ...HORIZONS.map((horizon) => {
        const alive = entries
          .map((entry) => entry.readings.get(horizon)!)
          .filter((entry) => entry.alive)
        return `${(100 * median(alive.map((entry) => entry.fdiShare))).toFixed(2)}%`.padStart(8)
      }),
    ].join(' '),
  )
}

// PART 5 — the two terms a cabinet reaches only by accident
console.log('\nPART 5 - THE SAFETY TERMS, MEASURED EVERY GOVERNED QUARTER')
console.log('  a quarter "binds" when the factor is below 0.999.')
console.log(
  [
    '  scenario'.padEnd(22),
    'price binds'.padStart(12),
    'when it does'.padStart(13),
    'crisis binds'.padStart(13),
    'when it does'.padStart(13),
    'mean drag'.padStart(9),
  ].join(' '),
)
for (const scenario of scenarios) {
  const governed = samples
    .get(scenario.id)!
    .flatMap((entry) => entry.points.filter((entry) => entry.inPower))
  const share = (pick: (point: Point) => number): string =>
    `${((100 * governed.filter((point) => pick(point) < 0.999).length) / Math.max(governed.length, 1)).toFixed(1)}%`
  const depth = (pick: (point: Point) => number): string => {
    const binding = governed.filter((point) => pick(point) < 0.999).map(pick)
    return binding.length === 0 ? '-' : median(binding).toFixed(3)
  }
  console.log(
    [
      `  ${scenario.id}`.padEnd(22),
      share((point) => point.factors['price stability']).padStart(12),
      depth((point) => point.factors['price stability']).padStart(13),
      share((point) => point.factors['banking crisis']).padStart(13),
      depth((point) => point.factors['banking crisis']).padStart(13),
      mean(
        governed.map(
          (point) => point.factors['price stability'] * point.factors['banking crisis'],
        ),
      ).toFixed(3).padStart(9),
    ].join(' '),
  )
}

// PART 6 — does the century leave the factor moved?
console.log('\nPART 6 - THE FACTOR THE ORDER AIMED AT, ONCE THE ECONOMY HAS ANSWERED')
console.log(`  median realized factor over the last ${WINDOW} quarters, governed pairs only.`)
console.log(
  [
    '  scenario'.padEnd(22),
    ...HORIZONS.map((horizon) => `Q${horizon}`.padStart(9)),
  ].join(' '),
)
const passiveSamples = samples.get('passive')!
function factorRow(id: TrackedFactor): void {
  console.log(`\n  factor: ${id}`)
  for (const scenario of scenarios) {
    const entries = samples.get(scenario.id)!
    console.log(
      [
        `  ${scenario.id}`.padEnd(22),
        ...HORIZONS.map((horizon) => {
          const paired = entries.flatMap((entry, index) => {
            const current = entry.readings.get(horizon)!
            const control = passiveSamples[index].readings.get(horizon)!
            return current.alive && control.alive ? [current] : []
          })
          return median(paired.map((entry) => entry.factors[id])).toFixed(3).padStart(9)
        }),
      ].join(' '),
    )
  }
}
for (const id of ['corporate return', 'administration', 'ownership saturation'] as const) {
  factorRow(id)
}
