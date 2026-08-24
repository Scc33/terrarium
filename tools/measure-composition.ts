/**
 * Can policy steer what kind of country this is? — the repeatable form of
 * investigation 0013, and the regression check for ADR-0030.
 *
 *   pnpm composition -- --seeds 8 --ticks 400 --country meridia
 *
 * Three tables, and they answer three different questions. Reading one for
 * another's question is the mistake this file exists to make hard:
 *
 * 1. **THE CHANNEL.** Six arms, protected tenure and a funded cabinet, so what
 *    is measured is whether the demand side can carry a lever at all. This is
 *    0013's method exactly, and the only table comparable with its numbers.
 * 2. **THE TRANSFORMATION.** One capacity-building century, composition beside
 *    consumption per head. This is where the modelling error shows: before
 *    ADR-0030 the service share of value added FELL while the country got
 *    eight times richer, which is backwards and is not Baumol.
 * 3. **WHAT A PLAYER GETS.** The same six arms under ordinary play — no
 *    protection, orders priced and refused when unaffordable, truncated at
 *    deposition. Issue #139 asks for this explicitly: the isolated numbers are
 *    right for a channel and wrong for a claim about the game.
 *
 * Shares are of REAL value added at base prices (`sectorValueAdded`), the
 * composition twin of the published industrial census — not of nominal output,
 * because a commodity boom raises energy's share without anyone producing more
 * energy.
 */

import {
  applyActions,
  CAPACITY_IDS,
  createCountryParams,
  CURATED_COUNTRY_IDS,
  init,
  realConsumptionPerCapita,
  SECTOR_IDS,
  sectorValueAdded,
  step,
  type Action,
  type CountryScenarioId,
  type SectorId,
  type TrueState,
} from '../packages/engine/src/index'
import { summarize } from '../packages/runner/src/metrics'
import { developmentalPolicy, type RunnerPolicy } from '../packages/runner/src/policies'
import { runOne } from '../packages/runner/src/run'

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const SEEDS = Number(arg('seeds', '8'))
// 400 by default, because that is the horizon the claims this tool is cited
// for are made at — the service-share regression in ADR-0030 and the
// economics-review skill both quote a four-hundred-quarter figure, and a
// default that stopped at 240 could not reproduce the evidence it is offered
// as. Table 1 still reports the 0013 horizon as well, so the original
// investigation stays comparable.
const TICKS = Number(arg('ticks', '400'))
const COUNTRY = arg('country', 'meridia') as CountryScenarioId
const POLICY_AT = 8 // two years in, so the arms share an opening
/** investigation 0013 published its six-arm table at 2006; keeping that
 * horizon in table 1 is what makes any later run comparable with it */
const LEGACY_HORIZON = 240

if (!Number.isInteger(SEEDS) || SEEDS <= 0) throw new Error('--seeds must be a positive integer')
if (!Number.isInteger(TICKS) || TICKS <= POLICY_AT) throw new Error(`--ticks must exceed ${POLICY_AT}`)
if (!(CURATED_COUNTRY_IDS as readonly string[]).includes(COUNTRY)) {
  throw new Error(`--country must be one of ${CURATED_COUNTRY_IDS.join(', ')}`)
}

/** the composition read, plus what the country was living on when it was taken */
interface Reading {
  shares: Record<SectorId, number>
  realGdp: number
  consumptionPerHead: number
}

function read(s: TrueState): Reading {
  const valueAdded = sectorValueAdded(s)
  let total = 0
  for (const sid of SECTOR_IDS) total += valueAdded[sid]
  const shares = {} as Record<SectorId, number>
  for (const sid of SECTOR_IDS) shares[sid] = valueAdded[sid] / Math.max(total, 1e-9)
  return {
    shares,
    realGdp: s.flows.realGdp,
    consumptionPerHead: realConsumptionPerCapita(s),
  }
}

// ---------------------------------------------------------------- the arms

/**
 * An arm is the ONE order that distinguishes it. Every arm shares the capacity
 * path, so nothing here is confounded with ministries the other arm did not
 * build.
 *
 * A subsidy is RE-INDEXED annually and a rate is set once, because those are
 * the two things that hold a policy constant. A subsidy dial left alone is not
 * a sustained subsidy: nominal GDP rises forty-fold over the century, so a
 * fixed cash figure posted in 1948 is worth almost nothing by 2006, and an arm
 * built that way measures a lever quietly switching itself off.
 */
interface Arm {
  id: string
  order?: (s: TrueState) => Action
  /** re-issue every four quarters, to hold the order at a constant share of a
   * growing economy */
  reindexed?: boolean
  /**
   * Is this arm's defining policy ACTUALLY STANDING at the horizon?
   *
   * `runOne` is lenient by default, which is right for the shared capacity
   * path — a ministry at full strength refuses more money and the runner
   * shrugs. It is NOT right for the thing under test: a cabinet short of
   * political capital has its `setDial` refused too, and the run then carries
   * on and gets tabulated under a label like `tariff 60%` having never set a
   * tariff. In a results table that reads as "the lever does nothing" rather
   * than "the lever was never pulled" — the trap AGENTS.md records against
   * lenient experiments, and the one `isolated()` avoids by charging no
   * capital. Table 3 has to check instead, because refusal is the point of it.
   */
  standing?: (s: TrueState) => boolean
}

const subsidyArm = (sid: SectorId): Arm => ({
  id: `${sid} subsidy 5%GDP`,
  order: (s) => ({ kind: 'setDial', path: `subsidies.${sid}`, value: 0.05 * s.flows.nominalGdp }),
  reindexed: true,
  // a re-indexed subsidy is standing only if it is still near the share it is
  // supposed to be: a dial set once in 1948 and refused ever after is worth
  // almost nothing by 2046, and would otherwise pass a `> 0` check
  standing: (s) => (s.gov.dials.subsidies[sid] ?? 0) > 0.02 * s.flows.nominalGdp,
})

const ordersAt = (arm: Arm, tick: number): boolean =>
  arm.order !== undefined &&
  (arm.reindexed ? tick >= POLICY_AT && (tick - POLICY_AT) % 4 === 0 : tick === POLICY_AT)

const ARMS: readonly Arm[] = [
  { id: 'passive' },
  subsidyArm('agri'),
  subsidyArm('manuf'),
  subsidyArm('services'),
  {
    id: 'tariff 60%',
    order: () => ({ kind: 'setDial', path: 'taxRates.tariff', value: 0.6 }),
    standing: (s) => s.gov.dials.taxRates.tariff > 0.5,
  },
  {
    id: 'free trade',
    order: () => ({ kind: 'setDial', path: 'taxRates.tariff', value: 0 }),
    standing: (s) => s.gov.dials.taxRates.tariff < 0.01,
  },
]

/**
 * The isolated run: tenure protected, capital handed over, ministries funded.
 *
 * The protection is not a convenience — it is what keeps the experiment from
 * lying. A deposed cabinet cannot give orders, so on a hard country the arm's
 * defining order silently never happens and the arm comes out identical to
 * passive to the last decimal, which reads as "the lever does nothing" rather
 * than "the lever was never pulled" (the trap `tests/properties/statutes.test.ts`
 * documents). Ministry orders a full ministry refuses are skipped, as the
 * runner skips them; the arm's own order is not.
 */
function isolated(seed: string, arm: Arm): Reading[] {
  const params = createCountryParams(COUNTRY, seed)
  let s = init(params, seed, { protectedTenure: true, unlimitedCapital: true })
  const readings: Reading[] = []
  for (let t = 0; t < TICKS; t++) {
    let staged: TrueState = { ...s, politics: { ...s.politics, politicalCapital: 500 } }
    if (t % 4 === 0) {
      for (const target of CAPACITY_IDS) {
        try {
          staged = applyActions(staged, [{ kind: 'investCapacity', target, amount: 2 }])
        } catch {
          continue // a ministry at full strength refuses more money
        }
      }
    }
    if (ordersAt(arm, t)) staged = applyActions(staged, [arm.order!(staged)])
    s = step(staged)
    readings.push(read(s))
  }
  return readings
}

/** The player's run: ordinary pricing, ordinary tenure, ordinary refusals. */
function played(
  seed: string,
  arm: Arm,
): { reading: Reading; deposedAt: number | null; standing: boolean } {
  const policy: RunnerPolicy = (s, rng, tick) => [
    ...developmentalPolicy(s, rng, tick),
    ...(ordersAt(arm, tick) ? [arm.order!(s)] : []),
  ]
  const run = runOne({
    seed,
    country: COUNTRY,
    ticks: TICKS,
    policy,
    includeStateHash: false,
  })
  // trajectory carries no composition, so the horizon read comes off the final
  // state; the arm is dropped when the government did not survive to it, and
  // dropped again when its own order never took (see `Arm.standing`)
  return {
    reading: read(run.finalState),
    deposedAt: run.deposedAt,
    standing: arm.standing ? arm.standing(run.finalState) : true,
  }
}

// ---------------------------------------------------------------- reporting

const median = (values: number[]): number => (values.length ? summarize(values).p50 : NaN)
const pct = (value: number): string => (Number.isFinite(value) ? `${(100 * value).toFixed(1)}%` : '—')
const num = (value: number, dp = 0): string => (Number.isFinite(value) ? value.toFixed(dp) : '—')

const HEAD = ['arm'.padEnd(22), ...SECTOR_IDS.map((sid) => sid.padStart(10)), 'real GDP'.padStart(10)]

const seeds = Array.from({ length: SEEDS }, (_, i) => `composition-${COUNTRY}-${i}`)
const started = performance.now()

console.log(
  `composition: ${SEEDS} seeds x ${ARMS.length} arms x ${TICKS} ticks on ${COUNTRY}, order at q${POLICY_AT}`,
)

// --- 1. the channel -------------------------------------------------------
const isolatedRuns = new Map<string, Reading[][]>()
for (const arm of ARMS) {
  isolatedRuns.set(
    arm.id,
    seeds.map((seed) => isolated(seed, arm)),
  )
}

const passiveIsolated = isolatedRuns.get('passive')!
const HORIZONS = [...new Set([LEGACY_HORIZON, TICKS])].filter((t) => t <= TICKS).sort((a, b) => a - b)
for (const horizon of HORIZONS) {
  const note = horizon === LEGACY_HORIZON ? ' — investigation 0013\'s own horizon' : ''
  console.log(`\n1. THE CHANNEL — protected tenure, funded cabinet, value-added share at q${horizon}${note}`)
  console.log([...HEAD, 'd own share'.padStart(12)].join(' '))
  const at = (rs: Reading[]) => rs[horizon - 1]
  for (const arm of ARMS) {
    const runs = isolatedRuns.get(arm.id)!
    const own = arm.id.includes('subsidy') ? (arm.id.split(' ')[0] as SectorId) : null
    const delta = own
      ? median(runs.map((rs, i) => at(rs).shares[own] - at(passiveIsolated[i]).shares[own]))
      : NaN
    console.log(
      [
        arm.id.padEnd(22),
        ...SECTOR_IDS.map((sid) => pct(median(runs.map((rs) => at(rs).shares[sid]))).padStart(10)),
        num(median(runs.map((rs) => at(rs).realGdp))).padStart(10),
        (Number.isFinite(delta) ? `${delta >= 0 ? '+' : ''}${(100 * delta).toFixed(2)}pt` : '—').padStart(12),
      ].join(' '),
    )
  }
}

// --- 2. the transformation ------------------------------------------------
console.log(`\n2. THE TRANSFORMATION — the passive-lever arm, composition against income`)
console.log(
  ['quarter'.padEnd(22), ...SECTOR_IDS.map((sid) => sid.padStart(10)), 'cons/head'.padStart(10)].join(' '),
)
const MARKS = [4, 40, 120, 240, 400].filter((t) => t <= TICKS)
for (const mark of MARKS) {
  const at = (rs: Reading[]) => rs[mark - 1]
  console.log(
    [
      `q${mark}`.padEnd(22),
      ...SECTOR_IDS.map((sid) =>
        pct(median(passiveIsolated.map((rs) => at(rs).shares[sid]))).padStart(10),
      ),
      num(median(passiveIsolated.map((rs) => at(rs).consumptionPerHead)), 2).padStart(10),
    ].join(' '),
  )
}

// --- 3. what a player gets ------------------------------------------------
console.log(`\n3. WHAT A PLAYER GETS — ordinary tenure and pricing, q${TICKS}`)
console.log(
  'counted = survived AND the arm\'s own order is still standing; a refused order is not a',
)
console.log('measurement of the lever, and lenient mode does not say so on its own.')
console.log([...HEAD, 'survived'.padStart(10), 'standing'.padStart(10)].join(' '))
for (const arm of ARMS) {
  const runs = seeds.map((seed) => played(seed, arm))
  const alive = runs.filter((r) => r.deposedAt === null)
  const counted = alive.filter((r) => r.standing)
  const floor = Math.max(2, Math.ceil(0.4 * runs.length))
  const enough = counted.length >= floor
  // WHICH of the two filters emptied the sample is the whole information: a
  // refused order means the lever was never measured, a deposed government
  // means it was never survived, and reporting one as the other is the same
  // way round as the mistake the standing check exists to prevent
  const reason = alive.length < floor ? 'too few governments survived to the horizon' : 'the order was refused and never stood'
  console.log(
    [
      arm.id.padEnd(22),
      ...SECTOR_IDS.map((sid) =>
        (enough ? pct(median(counted.map((r) => r.reading.shares[sid]))) : '—').padStart(10),
      ),
      (enough ? num(median(counted.map((r) => r.reading.realGdp))) : '—').padStart(10),
      `${alive.length}/${runs.length}`.padStart(10),
      `${counted.length}/${alive.length}`.padStart(10),
    ].join(' '),
  )
  if (!enough) {
    console.log(`${''.padEnd(22)} ↑ no median reported — ${reason}`)
  }
}

console.log(`\nwall time: ${((performance.now() - started) / 1000).toFixed(1)}s`)
