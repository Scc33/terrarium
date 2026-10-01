/**
 * Why does agriculture keep a fifth of the workforce in a rich country? — the
 * repeatable form of investigation 0023 (issue #151).
 *
 *   pnpm agriculture -- --seeds 8 --ticks 400 --country meridia
 *
 * The farm's headcount is not a labour-market outcome. `labor` caps it at
 * `SUBSISTENCE_CAP × rural labour force`, and the cap binds in essentially
 * every quarter after the first few years, so
 *
 *   agri employment = SUBSISTENCE_CAP × laborForce.rural_workers
 *
 * and the agricultural share of employment is the rural class share on a
 * demographic clock. The three tables follow that chain, and each is the
 * place to look for a different kind of fix:
 *
 * 1. **THE PIN.** Is the cap still binding, and does the farm want more hands
 *    than it has (`target/emp` above 1)? If `cap binds` ever falls well below
 *    100%, farm employment has become demand-determined and tables 2 and 3
 *    stop being the whole story.
 * 2. **THE CLOCK.** `demography` drains the rural class at `URBANIZATION_GAIN ×
 *    clamp(expectedGap, 0, 1) × jobsPull`, where the expected gap is the city
 *    wage times `job odds` over the farm wage (ADR-0045). No gap can move it
 *    faster than `urb max`. That is the SPEED of the transition.
 * 3. **THE DESTINATION.** Where the demand for farm output comes from. Migration
 *    stops when the wage gap closes, and it closes at whatever headcount
 *    agriculture's share of demand can pay for — so this table, not table 2,
 *    sets where the share comes to rest. Shares are of gross DEMAND; `met` is
 *    how much of it the farm actually produced.
 *
 * Each table reads the quarter at the point its own step does, never the end of
 * the tick: `demography` runs before anything sets this quarter's wages,
 * `production` before `prices` and `labor` move what it bought and who made it,
 * and `labor` after both. The tool replays the fold `step` runs, keeps those
 * snapshots, and checks that the headcount it gets is the one `step` produced.
 *
 * Arms run with protected tenure and unlimited capital, like `pnpm composition`'s
 * isolated arm: what is measured is the economy, not whether a cabinet lived to
 * see it. `developmental` funds all four capacities every four quarters.
 */

import {
  applyActions,
  CAPACITY_IDS,
  createCountryParams,
  CURATED_COUNTRY_IDS,
  init,
  laborForce,
  realConsumptionPerCapita,
  rngFor,
  SECTOR_IDS,
  sectorValueAdded,
  staffing,
  step,
  TICK_ORDER,
  type CountryScenarioId,
  type TrueState,
} from '../packages/engine/src/index'
import {
  JOBS_PULL_UNEMPLOYMENT_GAIN,
  HIRING_DEMAND_CAP,
  NATURAL_UNEMPLOYMENT,
  NORMAL_UTILIZATION,
  SUBSISTENCE_CAP,
  URBANIZATION_GAIN,
} from '../packages/engine/src/constants'
import { laborForOutput } from '../packages/engine/src/pipeline/derive'
import { FIRST_YEAR } from '../packages/engine/src/state/schema'
import { summarize } from '../packages/runner/src/metrics'

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const ARM_IDS = ['passive', 'developmental'] as const
type ArmId = (typeof ARM_IDS)[number]

const SEEDS = Number(arg('seeds', '8'))
const TICKS = Number(arg('ticks', '400'))
const ONLY_COUNTRY = arg('country', '')
const ONLY_ARM = arg('arm', '')
/** the opening years, before the valve has filled the farm to its cap, are
 * not evidence about whether the cap binds */
const BIND_FROM = 20

if (!Number.isInteger(SEEDS) || SEEDS <= 0) throw new Error('--seeds must be a positive integer')
if (!Number.isInteger(TICKS) || TICKS <= BIND_FROM) throw new Error(`--ticks must exceed ${BIND_FROM}`)
if (ONLY_COUNTRY && !(CURATED_COUNTRY_IDS as readonly string[]).includes(ONLY_COUNTRY)) {
  throw new Error(`--country must be one of ${CURATED_COUNTRY_IDS.join(', ')}`)
}
if (ONLY_ARM && !(ARM_IDS as readonly string[]).includes(ONLY_ARM)) {
  throw new Error(`--arm must be one of ${ARM_IDS.join(', ')}`)
}
const COUNTRIES: readonly CountryScenarioId[] = ONLY_COUNTRY
  ? [ONLY_COUNTRY as CountryScenarioId]
  : CURATED_COUNTRY_IDS
const ARMS: readonly ArmId[] = ONLY_ARM ? [ONLY_ARM as ArmId] : ARM_IDS
const MARKS = [...new Set([4, 40, 120, 240, 400, TICKS])].filter((t) => t <= TICKS).sort((a, b) => a - b)

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

interface Reading {
  agEmployment: number
  ruralLabourForce: number
  /** farm headcount as `labor` set it, over the cap `labor` applied */
  capRatio: number
  /** `labor`'s own hiring target over the headcount it started from: above 1,
   * the farm wants hands it cannot get */
  targetRatio: number
  wageGap: number
  /** urban workers in work over urban workers in the labour force */
  jobOdds: number
  /** the city wage times the job odds, over the farm wage, less one: the gap that moves people */
  expectedGap: number
  jobsPull: number
  /** rural class actually lost this quarter, annualized, as a share of itself */
  urbanization: number
  /** the most it could have lost at this `jobsPull`, had the expected gap been at its clamp */
  urbanizationMax: number
  foodShare: number
  household: number
  intermediate: number
  netExports: number
  /** share of gross demand for farm output that was produced */
  met: number
  agValueAdded: number
  /** farm value added per worker over the economy's */
  relativeProductivity: number
  relativePrice: number
  consumptionPerHead: number
}

const agriOf = (s: TrueState) => s.sectors.find((x) => x.id === 'agri')!

/** One pass of the fold `step` runs, through `last`, keeping what each step was
 * handed and what it returned. Steps are pure, so this never touches the
 * trajectory. */
function replay(state: TrueState, last: string) {
  const handed = new Map<string, TrueState>()
  const returned = new Map<string, TrueState>()
  let s = state
  for (const p of TICK_ORDER) {
    handed.set(p.name, s)
    s = p.run(s, rngFor(s.meta.seed, p.name, s.meta.tick))
    returned.set(p.name, s)
    if (p.name === last) return { handed, returned }
  }
  throw new Error(`no pipeline step named ${last}`)
}

/** One quarter, read where each table's step reads it. */
interface Quarter {
  /** what `demography` was handed */
  migrating: TrueState
  /** what `production` returned: the demand, output and prices it cleared at */
  produced: TrueState
  /** what `labor` was handed, and what it returned */
  hiring: TrueState
  hired: TrueState
  /** the end of the tick */
  after: TrueState
}

function capRatio(q: Quarter): number {
  return agriOf(q.hired).employment / (SUBSISTENCE_CAP * laborForce(q.hiring).rural_workers)
}

function read(q: Quarter): Reading {
  const s = q.after
  const lf = laborForce(s)
  const lfTotal = Object.values(lf).reduce((a, b) => a + b, 0)

  // labor's expression, on labor's inputs
  const farm = agriOf(q.hiring)
  const demanded = Math.min(q.hiring.flows.grossDemand.agri, HIRING_DEMAND_CAP * Math.max(farm.output, 1e-9))
  const target = laborForOutput(farm, demanded / NORMAL_UTILIZATION)

  // demography's inputs, and what it actually did with them
  const w = q.migrating.market.wages
  const urbanWage = (w.manuf + w.services) / 2
  const wageGap = urbanWage / Math.max(w.agri, 1e-9) - 1
  const posts = staffing(q.migrating)
  const urbanLabourForce = laborForce(q.migrating).urban_workers
  const urbanEmployed = SECTOR_IDS.reduce((sum, sid) => sum + posts[sid].urban_workers, 0)
  const jobOdds = urbanLabourForce > 1e-9 ? clamp(urbanEmployed / urbanLabourForce, 0, 1) : 1
  const jobsPull = clamp(
    1 - JOBS_PULL_UNEMPLOYMENT_GAIN * (q.migrating.flows.unemployment - NATURAL_UNEMPLOYMENT),
    0,
    1,
  )
  const ruralBefore = q.migrating.demography.classShares.rural_workers
  const ruralAfter = s.demography.classShares.rural_workers

  // the market production cleared: output beside the hands that made it, and
  // quantities at the prices they were bought at
  const p = q.produced
  const producers = p.sectors.reduce((sum, x) => sum + x.employment, 0)
  const valueAdded = sectorValueAdded(p)
  const vaTotal = SECTOR_IDS.reduce((sum, sid) => sum + valueAdded[sid], 0)
  const gross = Math.max(p.flows.grossDemand.agri, 1e-9)
  let spend = 0
  for (const sid of SECTOR_IDS) spend += p.flows.householdDemand[sid] * p.market.prices[sid]

  return {
    agEmployment: agriOf(s).employment / s.sectors.reduce((sum, x) => sum + x.employment, 0),
    ruralLabourForce: lf.rural_workers / lfTotal,
    capRatio: capRatio(q),
    targetRatio: target / farm.employment,
    wageGap,
    jobOdds,
    expectedGap: (urbanWage * jobOdds) / Math.max(w.agri, 1e-9) - 1,
    jobsPull,
    urbanization: (4 * (ruralBefore - ruralAfter)) / Math.max(ruralBefore, 1e-9),
    urbanizationMax: 4 * URBANIZATION_GAIN * jobsPull,
    foodShare: (p.flows.householdDemand.agri * p.market.prices.agri) / Math.max(spend, 1e-9),
    household: p.flows.householdDemand.agri / gross,
    intermediate: (p.flows.grossDemand.agri - p.flows.finalDemand.agri) / gross,
    netExports: (p.flows.exportsReal.agri - p.flows.importsReal.agri) / gross,
    met: p.flows.satisfied.agri,
    agValueAdded: valueAdded.agri / vaTotal,
    relativeProductivity: valueAdded.agri / agriOf(p).employment / (vaTotal / producers),
    relativePrice: p.market.prices.agri / p.market.prices.manuf,
    consumptionPerHead: realConsumptionPerCapita(p),
  }
}

interface Run {
  marks: Map<number, Reading>
  /** share of quarters from `BIND_FROM` on in which the cap binds */
  capBinds: number
}

function run(country: CountryScenarioId, arm: ArmId, seed: string): Run {
  let s = init(createCountryParams(country, seed), seed, { protectedTenure: true, unlimitedCapital: true })
  const marks = new Map<number, Reading>()
  let binding = 0
  for (let t = 0; t < TICKS; t++) {
    let staged = s
    if (arm === 'developmental' && t % 4 === 0) {
      for (const target of CAPACITY_IDS) {
        try {
          staged = applyActions(staged, [{ kind: 'investCapacity', target, amount: 2 }])
        } catch {
          continue // a ministry at full strength refuses more money
        }
      }
    }
    const fold = replay(staged, 'labor')
    s = step(staged)
    const quarter: Quarter = {
      migrating: fold.handed.get('demography')!,
      produced: fold.returned.get('production')!,
      hiring: fold.handed.get('labor')!,
      hired: fold.returned.get('labor')!,
      after: s,
    }
    // the replayed fold must be the one `step` ran, or every column below is
    // measuring a quarter that never happened
    if (agriOf(quarter.hired).employment !== agriOf(s).employment) {
      throw new Error(`replayed labor disagrees with step at ${country}/${seed} q${t}`)
    }
    const tick = t + 1
    if (tick >= BIND_FROM && capRatio(quarter) >= 1 - 1e-9) binding++
    if (MARKS.includes(tick)) marks.set(tick, read(quarter))
  }
  return { marks, capBinds: binding / (TICKS - BIND_FROM + 1) }
}

// ---------------------------------------------------------------- reporting

const median = (values: number[]): number => summarize(values).p50
const pct = (x: number) => (100 * x).toFixed(1)
const ratio = (x: number) => x.toFixed(2)

type Column = [header: string, value: (r: Reading) => number, format: (x: number) => string]

const TABLES: Array<{ title: string; columns: Column[] }> = [
  {
    title: '1. THE PIN — farm headcount against the rural labour force',
    columns: [
      ['ag emp %', (r) => r.agEmployment, pct],
      ['rural LF %', (r) => r.ruralLabourForce, pct],
      ['emp/cap', (r) => r.capRatio, (x) => x.toFixed(3)],
      ['target/emp', (r) => r.targetRatio, ratio],
    ],
  },
  {
    title: '2. THE CLOCK — how fast the rural class drains (% of itself per year)',
    columns: [
      ['wage gap', (r) => r.wageGap, ratio],
      ['job odds', (r) => r.jobOdds, ratio],
      ['exp. gap', (r) => r.expectedGap, ratio],
      ['jobsPull', (r) => r.jobsPull, ratio],
      ['urb %/yr', (r) => r.urbanization, (x) => (100 * x).toFixed(2)],
      ['urb max', (r) => r.urbanizationMax, (x) => (100 * x).toFixed(2)],
    ],
  },
  {
    title: '3. THE DESTINATION — where the demand for farm output comes from, and what it is worth',
    columns: [
      ['food %', (r) => r.foodShare, pct],
      ['household', (r) => r.household, ratio],
      ['interm.', (r) => r.intermediate, ratio],
      ['net exp.', (r) => r.netExports, ratio],
      ['met', (r) => r.met, ratio],
      ['ag VA %', (r) => r.agValueAdded, pct],
      ['rel prod', (r) => r.relativeProductivity, ratio],
      ['pA/pM', (r) => r.relativePrice, ratio],
      ['cons/head', (r) => r.consumptionPerHead, ratio],
    ],
  },
]

const started = performance.now()
console.log(`agriculture: ${SEEDS} seeds x ${TICKS} ticks, ${ARMS.join(' + ')}, protected tenure`)

const results = new Map<string, Run[]>()
for (const arm of ARMS) {
  for (const country of COUNTRIES) {
    results.set(
      `${arm}/${country}`,
      Array.from({ length: SEEDS }, (_, i) => run(country, arm, `agriculture-${country}-${i}`)),
    )
  }
}

for (const arm of ARMS) {
  console.log(`\n================ ${arm}`)
  for (const table of TABLES) {
    console.log(`\n${table.title}`)
    console.log([''.padEnd(16), ...table.columns.map(([h]) => h.padStart(11))].join(''))
    for (const country of COUNTRIES) {
      const runs = results.get(`${arm}/${country}`)!
      for (const mark of MARKS) {
        const label = `${country.padEnd(10)} ${FIRST_YEAR + Math.floor(mark / 4)}`
        console.log(
          [
            label.padEnd(16),
            ...table.columns.map(([, value, format]) =>
              format(median(runs.map((r) => value(r.marks.get(mark)!)))).padStart(11),
            ),
          ].join(''),
        )
      }
      if (table === TABLES[0]) {
        const binds = median(runs.map((r) => r.capBinds))
        console.log(`${''.padEnd(16)}cap binds in ${pct(binds)}% of quarters from q${BIND_FROM}`)
      }
    }
  }
}

console.log(`\nwall time: ${((performance.now() - started) / 1000).toFixed(1)}s`)
