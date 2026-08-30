/**
 * What a cabinet can do about its currency, and what it costs (issue #152):
 *
 *   pnpm currency -- --runs 24 --ticks 400
 *
 * Four sections, because the exchange rate answers four different questions
 * and the answers disagree with each other.
 *
 * 1. WHERE THE RATE COMES FROM. The step's own arithmetic, re-run on a real
 *    reference state with one input at a time neutralized. Nothing here
 *    restates the formula: a term that moves in `trade.ts` moves here too.
 * 2. WHAT A STANDING ORDER IS WORTH. Paired seeds against a floating control
 *    — the same country, the same seed, the same shocks — at settings from a
 *    hard defence to the buy rail. Reported at three horizons, because a lever
 *    that moves a PRICE gets undone and one that moves a STOCK compounds, and
 *    this one does both.
 *
 *    Sections 2 and 3 run under `unlimitedCapital`, which makes them CHANNEL
 *    measurements rather than readings of ordinary play — the distinction
 *    AGENTS.md draws between a mechanism test and a baseline sweep. Without it
 *    the study measures two things at once: posting the order costs political
 *    capital, `runOne` leniently skips whatever capacity bid that leaves
 *    unaffordable, and the arms quietly develop different states. Measured
 *    before the rule was applied, the +10 % arm skipped 34.5 orders a run
 *    against the float's 18.0 and ended a century with 1 % less total capacity,
 *    so part of every reported difference was a less-built ministry rather than
 *    the currency. What a cabinet with an ordinary budget actually gets is the
 *    batch baselines' business, not this table's.
 * 3. WHETHER THE ORDER CHANGES THE RIDE. Asked because the obvious story —
 *    a peg switches off the shock absorber a floating currency is — turns out
 *    NOT to hold here, and the table is kept so that nobody re-derives it. The
 *    dial is a standing rate, so it shifts the level the currency floats
 *    around; it does not stop it floating, and the tilt still answers to every
 *    surprise in the balance of payments at either setting. Measured as tails
 *    rather than means, which is where an absorber would be visible if it were
 *    switching off.
 * 4. THE TERRAIN. What the rate, the reserve book and the balance do under
 *    passive and capacity-building play with nobody touching the dial, per
 *    country, read at the last quarter the player was still governing. Every
 *    number above has to be read against this.
 */

import {
  applyActions,
  createCountryParams,
  CURATED_COUNTRY_IDS,
  exchangeRateParity,
  init,
  realExchangeRate,
  rngFor,
  settleForeignExchange,
  step,
  TICK_ORDER,
  type Action,
  type CountryScenarioId,
  type TrueState,
} from '../packages/engine/src/index'
import {
  FX_BALANCE_TILT,
  FX_CARRY_TILT,
  FX_INTERVENTION_MAX,
  POLICY_RATE_1946,
} from '../packages/engine/src/constants'
import { CAPACITY_IDS } from '../packages/engine/src/state/schema'
import { developmentalPolicy, type RunnerPolicy } from '../packages/runner/src/policies'
import { runOne } from '../packages/runner/src/run'

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const RUNS = Number(arg('runs', '24'))
const TICKS = Number(arg('ticks', '400'))
const WINDOW = 8
const HORIZONS = [40, 120, TICKS].filter((tick) => tick <= TICKS)

if (!Number.isInteger(RUNS) || RUNS <= 0) throw new Error('--runs must be a positive integer')
if (!Number.isInteger(TICKS) || TICKS < 40) throw new Error('--ticks must be an integer at least 40')

const pct = (xs: number[], p: number): number => {
  if (xs.length === 0) return NaN
  const sorted = [...xs].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
}
const mean = (xs: number[]): number =>
  xs.length === 0 ? NaN : xs.reduce((a, b) => a + b, 0) / xs.length
const fixed = (x: number, d = 2): string => (Number.isFinite(x) ? x.toFixed(d) : ' —')

// ---------- 1. where the rate comes from ----------

const TRADE_INDEX = TICK_ORDER.findIndex((step) => step.name === 'trade')

/**
 * The exact state `trade` will read this quarter.
 *
 * Every counterfactual below is the step run on one state against the step run
 * on a neutralized copy, so the state has to be the step's own INPUT. An
 * end-of-tick state is not: `prices` has since moved the price level the
 * parity term reads, and `fiscal` has moved the debt the sovereign premium
 * reads. The prefix is re-run from `TICK_ORDER` itself, so a step inserted
 * ahead of trade joins it without an edit here. Exact rather than approximate:
 * the steps are pure and each draws from a substream keyed by (seed, step
 * name, tick).
 */
function tradeStepInput(state: TrueState): TrueState {
  let current = state
  for (let index = 0; index < TRADE_INDEX; index++) {
    const step = TICK_ORDER[index]
    current = step.run(current, rngFor(current.meta.seed, step.name, current.meta.tick))
  }
  return current
}

function targetRate(state: TrueState): number {
  return settleForeignExchange(state).target
}

/**
 * The three terms, each neutralized in turn, as a % of the rate the market
 * would otherwise be heading for.
 *
 * `settleForeignExchange` computes `target = parity × tilt`, so each term is
 * isolated by substituting ONE of those two factors and leaving the other
 * exactly as the live state produced it.
 *
 * Parity is deliberately NOT neutralized by flattening the price vectors and
 * re-settling. That was the first version and it decomposes nothing: the same
 * vectors set `exportsValue` and `importsValue`, so flattening them moves the
 * current account, the surprise and the balance tilt at the same time, and the
 * "relative prices" figure comes out carrying two of the three mechanisms it
 * claims to separate. Comparing the PARITY VALUES directly is exact, because
 * the tilt is common to both sides and cancels.
 */
function decomposeRate(input: TrueState): Record<string, number> {
  const settled = settleForeignExchange(input)
  const live = settled.target
  // target = parity × tilt, and tilt is unchanged, so the ratio of targets is
  // the ratio of parities. `fxParityAnchor` is what parity reads at flat
  // relative prices, by construction.
  const parityTerm = exchangeRateParity(input) / input.external.fxParityAnchor

  // The other two substitute the tilt's inputs and leave parity alone, which
  // they already do: neither `balanceNorm` nor the policy rate is read by
  // `exchangeRateParity`.
  const noBalance = targetRate({
    ...input,
    external: {
      ...input.external,
      balanceNorm: (settled.currentAccount - settled.ordered) / input.flows.nominalGdp,
    },
  })
  const noCarry = targetRate({
    ...input,
    gov: { ...input.gov, dials: { ...input.gov.dials, policyRate: POLICY_RATE_1946 }, debt: 0 },
  })
  return {
    'relative prices': 100 * (parityTerm - 1),
    'balance of payments': 100 * (live / noBalance - 1),
    'yield spread': 100 * (live / noCarry - 1),
  }
}

// ---------- policies ----------

/** Capacity building, plus a standing order in the currency market. The
 * capacity half is `developmentalPolicy` verbatim so that the arms differ by
 * the dial and nothing else. */
const withStandingOrder =
  (order: number): RunnerPolicy =>
  (state, rng, tick) => {
    const actions = [...developmentalPolicy(state, rng, tick)]
    if (order === 0) return actions
    const posted = state.gov.dials.fxIntervention
    if (Math.abs(posted - order) < 1e-9) return actions
    // Walk to the order rather than posting it whole. A full-rail intervention
    // is priced near 43 PC against the twenty a new cabinet holds, and a
    // lenient runner skips what it cannot afford IN SILENCE — the first
    // version of this study posted the order once at tick 0, every arm was
    // refused, and all five came out identical to the last decimal. That reads
    // as "the dial does nothing" rather than "the dial was never set".
    //
    // The step still goes first, but the arms are funded (see the header), so
    // nothing downstream of it is being crowded out any more. Ordering used to
    // be the whole defence against a silent skip and it was the wrong one: it
    // protected the treatment by starving the control's ministries.
    const step = Math.sign(order - posted) * Math.min(0.01, Math.abs(order - posted))
    actions.unshift({ kind: 'setDial', path: 'fxIntervention', value: posted + step })
    return actions
  }

interface Reading {
  exports: number
  exportShare: number
  realGdp: number
  consumption: number
  inflation: number
}

function readingAt(trajectory: ReturnType<typeof runOne>['trajectory'], at: number): Reading | null {
  const window = trajectory.filter((p) => p.tick > at - WINDOW && p.tick <= at)
  if (window.length === 0) return null
  return {
    exports: mean(window.map((p) => p.drivers.exports)),
    exportShare: mean(window.map((p) => p.drivers.exports / Math.max(p.drivers.finalDemand, 1e-9))),
    realGdp: mean(window.map((p) => p.realGdp)),
    consumption: mean(window.map((p) => p.drivers.householdDemand)),
    inflation: 4 * mean(window.map((p) => p.inflationQ)),
  }
}

interface ArmResult {
  /** horizon → seed → reading. Keyed by SEED, not pushed into a flat list,
   * because the comparison downstream calls itself paired and has to be: the
   * dial changes deposition, so an arm that loses seed 7 before q120 and a
   * control that keeps it are two different survivor populations, and their
   * difference would be selection rather than policy. */
  readings: Map<number, Map<string, Reading>>
  /** seed → the last state the PLAYER was still governing in. `runOne` keeps
   * simulating after a deposition on purpose — those quarters expose raw engine
   * failures — but they are not reachable in play, so a column read off
   * `finalState` would quote decades nobody can get to. */
  finals: Map<string, TrueState>
  deposed: number
  inflationTail: number[]
  growthTail: number[]
  /** How many runs actually reached the order under test. Printed, because an
   * arm that never got there is a null result about the RUNNER, not the dial. */
  reached: number
}

function runArm(country: CountryScenarioId, order: number, seeds: string[]): ArmResult {
  const readings = new Map<number, Map<string, Reading>>(
    HORIZONS.map((h) => [h, new Map<string, Reading>()]),
  )
  const finals = new Map<string, TrueState>()
  let deposed = 0
  const inflationTail: number[] = []
  const growthTail: number[] = []
  let reached = 0
  for (const seed of seeds) {
    let lastGoverned: TrueState | null = null
    const result = runOne({
      seed,
      ticks: TICKS,
      country,
      policy: withStandingOrder(order),
      // The capacity path has to be identical across arms or it is a second
      // treatment. This lifts only the budget constraint on orders: the room
      // still quotes every order and the blocs still spend favour, and
      // deposition — which section 3 reports — is a different rule entirely.
      rules: { unlimitedCapital: true },
      includeStateHash: false,
      observer: {
        afterStep(state) {
          if (state.politics.inPower) lastGoverned = state
        },
      },
    })
    if (result.deposedAt !== null) deposed++
    if (Math.abs(result.finalState.gov.dials.fxIntervention - order) < 1e-6) reached++
    const end = result.deposedAt ?? TICKS
    for (const horizon of HORIZONS) {
      if (horizon > end) continue
      const reading = readingAt(result.trajectory, horizon)
      if (reading) readings.get(horizon)?.set(seed, reading)
    }
    finals.set(seed, lastGoverned ?? result.finalState)
    for (const point of result.trajectory) {
      if (point.tick > end || point.tick < 40) continue
      inflationTail.push(4 * point.inflationQ)
    }
    for (let i = 4; i < result.trajectory.length; i++) {
      const point = result.trajectory[i]
      if (point.tick > end || point.tick < 40) continue
      growthTail.push(100 * (point.realGdp / result.trajectory[i - 4].realGdp - 1))
    }
  }
  return { readings, finals, deposed, inflationTail, growthTail, reached }
}

// ---------- the report ----------

const seedsFor = (country: string): string[] =>
  Array.from({ length: RUNS }, (_, i) => `currency-${country}-${i}`)

console.log(
  `=== the currency, ${RUNS} paired seeds × ${TICKS}q — tilts: balance ${FX_BALANCE_TILT}, carry ${FX_CARRY_TILT}, rail ±${(100 * FX_INTERVENTION_MAX).toFixed(0)} % GDP/yr ===`,
)

// --- 1. the rate's own terms, on a real reference state ---
console.log('\n--- 1. what moves the rate, at quarter 120 of a capacity-building Meridia ---')
{
  let state: TrueState = init(createCountryParams('meridia', 'currency-decompose'), 'currency-decompose')
  for (let tick = 0; tick < 120; tick++) {
    if (tick % 8 === 0) {
      for (const target of CAPACITY_IDS) {
        const action: Action = { kind: 'investCapacity', target, amount: 2 }
        try {
          state = applyActions(state, [action])
        } catch {
          /* the ministry is full or the cabinet is short; the runner skips these too */
        }
      }
    }
    state = step(state)
  }
  const input = tradeStepInput(state)
  const terms = decomposeRate(input)
  console.log(`  posted rate            ${fixed(input.external.exchangeRate, 3)}`)
  console.log(`  the market is heading for ${fixed(targetRate(input), 3)}`)
  console.log(`  real rate (1946 = 1)   ${fixed(realExchangeRate(input), 3)}`)
  for (const [name, value] of Object.entries(terms)) {
    console.log(`  ${name.padEnd(22)} ${value >= 0 ? '+' : ''}${fixed(value, 2)} %`)
  }
}

// --- 2 & 3. what a standing order is worth, and what it costs ---
const ORDERS = [-0.04, 0, 0.03, 0.06, FX_INTERVENTION_MAX]
console.log('\n--- 2. a standing order against a floating control, capacity-building Meridia ---')
console.log(
  '  the real rate column is the END of the century: it is where the nominal',
)
console.log(
  '  depreciation has been eaten by domestic prices, which is most of the story.',
)
console.log(
  '  order    horizon   pairs    real rate   exports    X share    real GDP   consumption   reserves(q)',
)
{
  const arms = new Map<number, ArmResult>()
  for (const order of ORDERS) arms.set(order, runArm('meridia', order, seedsFor('meridia')))
  const float = arms.get(0)!
  for (const order of ORDERS) {
    const arm = arms.get(order)!
    for (const horizon of HORIZONS) {
      const mine = arm.readings.get(horizon)
      const control = float.readings.get(horizon)
      if (!mine || !control) continue
      // The pairs BOTH arms reached while still governing. Taking each arm's
      // own survivors and comparing the two means would compare different
      // populations — and since the dial moves deposition, the difference
      // would partly be selection. `pairs` is printed for the same reason the
      // FDI study prints its own: a cell standing on four seeds is not the
      // same claim as one standing on twenty-four.
      const seeds = [...mine.keys()].filter((seed) => control.has(seed))
      if (seeds.length === 0) continue
      const here = seeds.map((seed) => mine.get(seed)!)
      const there = seeds.map((seed) => control.get(seed)!)
      const rel = (pick: (r: Reading) => number): string => {
        const value = 100 * (mean(here.map(pick)) / mean(there.map(pick)) - 1)
        return `${value >= 0 ? '+' : ''}${fixed(value, 1)}%`
      }
      // The export share is reported in PERCENTAGE POINTS, not as a relative
      // change, so that it can be read against investigation 0010's table —
      // which is the only other measurement of this quantity and is in points.
      // Quoting a 2.1% relative move as "+2.1 points" overstates it sevenfold.
      const sharePoints = (): string => {
        const value = 100 * (mean(here.map((r) => r.exportShare)) - mean(there.map((r) => r.exportShare)))
        return `${value >= 0 ? '+' : ''}${fixed(value, 2)}pp`
      }
      // Read off the last quarter the player was still governing, over the
      // same paired seeds — not `finalState`, which for a deposed run is a
      // country somebody else has been running for decades.
      const governed = seeds.map((seed) => arm.finals.get(seed)!).filter(Boolean)
      const realRate = mean(governed.map(realExchangeRate))
      const reserves = mean(
        governed.map((s) => s.external.reserves / Math.max(s.flows.tariffBase, 1e-9)),
      )
      console.log(
        `  ${(order >= 0 ? '+' : '') + fixed(100 * order, 0).padStart(3)}%   q${String(horizon).padStart(3)}   ${String(seeds.length).padStart(3)}/${RUNS}    ${fixed(realRate, 3).padStart(6)}   ${rel((r) => r.exports).padStart(7)}   ${sharePoints().padStart(7)}   ${rel((r) => r.realGdp).padStart(7)}   ${rel((r) => r.consumption).padStart(9)}   ${fixed(reserves, 2).padStart(8)}`,
      )
    }
  }
  console.log('\n--- 3. does the order change the ride? (measured because the obvious answer is wrong) ---')
  console.log('  order    posted   deposed    annual inflation p05..p95    4q real growth p05..p95')
  for (const order of ORDERS) {
    const arm = arms.get(order)!
    console.log(
      `  ${(order >= 0 ? '+' : '') + fixed(100 * order, 0).padStart(3)}%    ${String(arm.reached).padStart(2)}/${RUNS}     ${String(arm.deposed).padStart(2)}/${RUNS}     ${fixed(pct(arm.inflationTail, 0.05), 2).padStart(7)} .. ${fixed(pct(arm.inflationTail, 0.95), 2).padStart(6)} %      ${fixed(pct(arm.growthTail, 0.05), 2).padStart(6)} .. ${fixed(pct(arm.growthTail, 0.95), 2).padStart(5)} %`,
    )
  }
}

// --- 4. the terrain ---
console.log('\n--- 4. the terrain: nobody touches the dial ---')
console.log('  country      policy          rate    real rate   reserves(q)   balance % GDP')
for (const country of CURATED_COUNTRY_IDS) {
  for (const [label, policy] of [
    ['passive', undefined],
    ['developmental', developmentalPolicy],
  ] as const) {
    const rates: number[] = []
    const realRates: number[] = []
    const cover: number[] = []
    const balance: number[] = []
    let deposed = 0
    for (const seed of seedsFor(country).slice(0, Math.min(RUNS, 8))) {
      // Same rule as sections 2 and 3: read the last quarter the PLAYER was
      // governing. `runOne` keeps applying the policy after a deposition on
      // purpose, and on Costona and Kestrel a quarter of runs fall — so a
      // terrain table off `finalState` would be describing decades of a
      // successor's country as though they were passive play.
      let lastGoverned: TrueState | null = null
      const result = runOne({
        seed,
        ticks: TICKS,
        country: country as CountryScenarioId,
        policy,
        includeStateHash: false,
        observer: {
          afterStep(state) {
            if (state.politics.inPower) lastGoverned = state
          },
        },
      })
      if (result.deposedAt !== null) deposed++
      const s: TrueState = lastGoverned ?? result.finalState
      rates.push(s.external.exchangeRate)
      realRates.push(realExchangeRate(s))
      cover.push(s.external.reserves / Math.max(s.flows.tariffBase, 1e-9))
      balance.push((100 * s.flows.currentAccount) / Math.max(s.flows.nominalGdp, 1e-9))
    }
    console.log(
      `  ${country.padEnd(12)} ${label.padEnd(14)} ${fixed(mean(rates), 3).padStart(6)}   ${fixed(mean(realRates), 3).padStart(6)}      ${fixed(mean(cover), 2).padStart(6)}        ${fixed(mean(balance), 2).padStart(6)}      ${String(deposed).padStart(2)}/${rates.length}`,
    )
  }
}
