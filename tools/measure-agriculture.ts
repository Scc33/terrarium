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
 *    clamp(wageGap, 0, 1) × jobsPull`, so no wage gap can move it faster than
 *    `urb max`. That is the SPEED of the transition.
 * 3. **THE DESTINATION.** Where the farm's gross output goes. Migration stops
 *    when the wage gap closes, and it closes at whatever headcount agriculture's
 *    share of demand can pay for — so this table, not table 2, sets where the
 *    share comes to rest.
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
  SECTOR_IDS,
  sectorValueAdded,
  step,
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
const MARKS = [4, 40, 120, 240, 400].filter((t) => t <= TICKS)

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

interface Reading {
  agEmployment: number
  ruralLabourForce: number
  capRatio: number
  /** `labor`'s own hiring target over the headcount: above 1, the farm wants
   * hands it cannot get */
  targetRatio: number
  wageGap: number
  jobsPull: number
  /** rural class lost per year, as a share of itself */
  urbanization: number
  /** the same, had the wage gap been at its clamp */
  urbanizationMax: number
  foodShare: number
  household: number
  intermediate: number
  netExports: number
  agValueAdded: number
  /** farm value added per worker over the economy's */
  relativeProductivity: number
  relativePrice: number
  consumptionPerHead: number
}

function read(s: TrueState): Reading {
  const agri = s.sectors.find((x) => x.id === 'agri')!
  const totalEmployment = s.sectors.reduce((sum, x) => sum + x.employment, 0)
  const lf = laborForce(s)
  const lfTotal = Object.values(lf).reduce((a, b) => a + b, 0)
  const valueAdded = sectorValueAdded(s)
  const vaTotal = SECTOR_IDS.reduce((sum, sid) => sum + valueAdded[sid], 0)
  const gross = Math.max(s.flows.grossDemand.agri, 1e-9)
  const demanded = Math.min(s.flows.grossDemand.agri, HIRING_DEMAND_CAP * Math.max(agri.output, 1e-9))
  const w = s.market.wages
  const wageGap = (w.manuf + w.services) / 2 / Math.max(w.agri, 1e-9) - 1
  const jobsPull = clamp(
    1 - JOBS_PULL_UNEMPLOYMENT_GAIN * (s.flows.unemployment - NATURAL_UNEMPLOYMENT),
    0,
    1,
  )
  let spend = 0
  for (const sid of SECTOR_IDS) spend += s.flows.householdDemand[sid] * s.market.prices[sid]
  return {
    agEmployment: agri.employment / totalEmployment,
    ruralLabourForce: lf.rural_workers / lfTotal,
    capRatio: agri.employment / (SUBSISTENCE_CAP * lf.rural_workers),
    targetRatio: laborForOutput(agri, demanded / NORMAL_UTILIZATION) / agri.employment,
    wageGap,
    jobsPull,
    urbanization: 4 * URBANIZATION_GAIN * clamp(wageGap, 0, 1) * jobsPull,
    urbanizationMax: 4 * URBANIZATION_GAIN * jobsPull,
    foodShare: (s.flows.householdDemand.agri * s.market.prices.agri) / Math.max(spend, 1e-9),
    household: s.flows.householdDemand.agri / gross,
    intermediate: (s.flows.grossDemand.agri - s.flows.finalDemand.agri) / gross,
    netExports: (s.flows.exportsReal.agri - s.flows.importsReal.agri) / gross,
    agValueAdded: valueAdded.agri / vaTotal,
    relativeProductivity: valueAdded.agri / agri.employment / (vaTotal / totalEmployment),
    relativePrice: s.market.prices.agri / s.market.prices.manuf,
    consumptionPerHead: realConsumptionPerCapita(s),
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
    s = step(staged)
    const tick = t + 1
    if (tick >= BIND_FROM) {
      const agri = s.sectors.find((x) => x.id === 'agri')!
      if (agri.employment >= (1 - 1e-6) * SUBSISTENCE_CAP * laborForce(s).rural_workers) binding++
    }
    if (MARKS.includes(tick)) marks.set(tick, read(s))
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
      ['jobsPull', (r) => r.jobsPull, ratio],
      ['urb %/yr', (r) => r.urbanization, (x) => (100 * x).toFixed(2)],
      ['urb max', (r) => r.urbanizationMax, (x) => (100 * x).toFixed(2)],
    ],
  },
  {
    title: '3. THE DESTINATION — where farm gross output goes, and what it is worth',
    columns: [
      ['food %', (r) => r.foodShare, pct],
      ['household', (r) => r.household, ratio],
      ['interm.', (r) => r.intermediate, ratio],
      ['net exp.', (r) => r.netExports, ratio],
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
