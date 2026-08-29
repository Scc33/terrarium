/**
 * Read a real game back — the country, the decision log, and what the century
 * actually did to it:
 *
 *   pnpm replay path/to/save.json
 *   pnpm replay path/to/export.json --arms log,passive,developmental,maximal
 *   pnpm replay path/to/save.json --csv run.csv --every 20
 *
 * The repo already measures the economy under SAMPLED policies — passive,
 * developmental, regulated, random. What it had no way to read was one
 * person's century: a save is 35 kB of country + seed + decisions, the
 * published export is a fogged 12 MB of what the player could see, and
 * neither one hands you the TRUE state a balance question is asked about.
 * This replays the log through the engine and prints the truth beside it.
 *
 * Three things it deliberately does:
 *
 * - **It accepts either file the game writes.** The records office exports a
 *   `SaveFile`; the data export wraps that same save under `run` beside the
 *   published history (`packages/observation/src/dataExport.ts`). A reader
 *   that took only one of them would send half the people who have a run to
 *   hand-editing JSON first.
 * - **Counterfactual arms replay the interregnum from the save's own log.**
 *   The caretaker's orders are in `actionLog` (ADR-0021), so an arm that
 *   dropped them would compare the player's century against a country that
 *   never existed. Ticks before `appointedAt` come from the log in every arm;
 *   the policy only takes over at the quarter the player did.
 * - **Ceilings are computed from the engine's own constants**, not asserted
 *   from a run. Several published series are bounded by construction — a
 *   mortality floor, an education capacity of one, a catch-up rate against a
 *   moving frontier — and "the player stopped at 65" and "the model stops at
 *   65" are different findings that look identical in a trajectory.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import {
  CATCHUP_Q,
  FRONTIER_OWN_DRIFT_Q,
  MORT_BASE_ANNUAL,
  MORT_FLOOR,
  TECH_EXPOSURE,
} from '../packages/engine/src/constants'
import {
  POVERTY_LINE_REAL,
  SECTOR_IDS,
  STATUTE_IDS,
  STATUTE_LEVELS,
  CAPACITY_IDS,
  absorptiveCapacity,
  frontierGrowthAt,
  householdIncomeDistribution,
  lifeExpectancyAtBirth,
  livingStandard,
  periodLifeExpectancy,
  technologyAttainment,
  totalLaborForce,
  type Action,
  type ActionLog,
  type CountryParams,
  type GameRules,
  type Qtr,
  type SaveFile,
  type TrueState,
} from '../packages/engine/src/index'
import { developmentalPolicy, type RunnerPolicy } from '../packages/runner/src/policies'
import { runOne } from '../packages/runner/src/run'

// ---------- arguments ----------
function flag(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const ARM_IDS = ['log', 'passive', 'developmental', 'maximal'] as const
type ArmId = (typeof ARM_IDS)[number]

const file = process.argv.slice(2).find((value) => !value.startsWith('--'))
if (!file) {
  console.error('usage: pnpm replay <save-or-export.json> [--arms …] [--every N] [--csv out.csv]')
  process.exit(1)
}
const every = Number(flag('every', '40'))
if (!Number.isInteger(every) || every <= 0) throw new Error('--every must be a positive integer')
const csvPath = flag('csv', '')
const arms = flag('arms', 'log,passive,developmental,maximal')
  .split(',')
  .map((id) => id.trim())
  .filter((id): id is ArmId => (ARM_IDS as readonly string[]).includes(id))
if (arms.length === 0) throw new Error(`--arms must name some of: ${ARM_IDS.join(', ')}`)
if (!arms.includes('log')) arms.unshift('log')

// ---------- the file ----------
/** Either artifact the game writes. The data export embeds the exact save it
 * was taken from, so unwrapping it is reading the same document. */
function loadSave(path: string): SaveFile {
  const parsed = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>
  const save = ('run' in parsed ? parsed.run : parsed) as SaveFile
  if (!save?.params || !save?.seed || !Array.isArray(save.actionLog)) {
    throw new Error(`${path} is neither a save file nor a terrarium data export`)
  }
  return save
}

const save = loadSave(file)
const params: CountryParams = save.params
const rules = (save.rules ?? save.mode ?? 'standard') as GameRules | string
const appointedAt: Qtr = save.appointedAt ?? 0
const ticks = Number(flag('ticks', String(save.tick)))

// ---------- policies for the counterfactual arms ----------
/** Build every ministry, legislate to the top of every ladder, fund research
 * and state investment hard. It is a CEILING PROBE, not a model of good play —
 * quote it when asking whether a mechanic can be reached at all, never as a
 * balance baseline. It spends so heavily that consumption, and with it every
 * welfare reading, comes out BELOW the do-nothing arm; that is the probe
 * working, and it is why `livingStandard` is a column.
 *
 * It is not lenient about the thing under test: statutes are re-attempted
 * every year until the book actually reads the top rung, because an enactment
 * that a deposed or broke cabinet silently refused looks exactly like a
 * statute that does nothing (see the tuning lessons in AGENTS.md). */
const maximalPolicy: RunnerPolicy = (state, _rng, tick) => {
  const actions: Action[] = []
  const gdp = Math.max(state.flows.nominalGdp, 1e-9)
  if (tick % 4 === 0) {
    for (const target of CAPACITY_IDS) {
      if (state.gov.capacity[target] < 0.999) {
        actions.push({ kind: 'investCapacity', target, amount: 0.05 * gdp })
      }
    }
    for (const id of STATUTE_IDS) {
      const top = STATUTE_LEVELS[id].length - 1
      if (state.gov.statutes[id].level < top) {
        actions.push({ kind: 'enact', statute: id, level: top })
      }
    }
    actions.push({ kind: 'setSpendingRule', programme: 'research', mode: 'gdpShare', value: 0.05 })
    actions.push({ kind: 'setSpendingRule', programme: 'investment', mode: 'gdpShare', value: 0.08 })
  }
  return actions
}

const POLICIES: Record<Exclude<ArmId, 'log'>, RunnerPolicy | undefined> = {
  passive: undefined,
  developmental: developmentalPolicy,
  maximal: maximalPolicy,
}

// ---------- what one quarter of the truth looks like ----------
interface Reading {
  tick: number
  year: number
  realGdp: number
  population: number
  gdpPerHead: number
  /** real consumption per head against the standard 1946 country — what
   * mortality, fertility and the report card all read. GDP per head is not a
   * substitute: a state that invests everything raises one and not the other. */
  livingStandard: number
  unemployment: number
  inflationYoY: number
  debtToGdp: number
  lifeExpectancy: number
  mortalityIndex: number
  pollution: number
  pollutionExcess: number
  emissionsQ: number
  techAttainment: number
  frontier: number
  humanCapital: number
  educationCapacity: number
  researchShare: number
  povertyRate: number
  poorestCohortIncome: number
  gini: number
  participation: number
  urbanShare: number
  inPower: number
}

function read(state: TrueState): Reading {
  const population = state.demography.pyramid.reduce((sum, n) => sum + n, 0)
  const households = householdIncomeDistribution(state)
  const realGdp = state.flows.realGdp
  return {
    tick: state.meta.tick,
    year: 1946 + Math.floor(state.meta.tick / 4),
    realGdp,
    population,
    gdpPerHead: realGdp / Math.max(population, 1e-9),
    livingStandard: livingStandard(state),
    unemployment: 100 * state.flows.unemployment,
    inflationYoY: 100 * (Math.pow(1 + state.flows.inflationQ, 4) - 1),
    debtToGdp: 100 * (state.gov.debt / Math.max(4 * state.flows.nominalGdp, 1e-9)),
    lifeExpectancy: lifeExpectancyAtBirth(state),
    mortalityIndex: state.demography.mortalityIndex,
    pollution: state.environment.pollution,
    pollutionExcess: state.environment.pollution - state.environment.baseline,
    emissionsQ: state.environment.emissionsQ,
    techAttainment: 100 * technologyAttainment(state),
    frontier: state.tech.frontier,
    humanCapital: 100 * state.demography.humanCapital,
    educationCapacity: 100 * state.gov.capacity.education,
    researchShare:
      100 * state.gov.dials.spending.research / Math.max(state.flows.nominalGdp, 1e-9),
    povertyRate: 100 * households.povertyRate,
    poorestCohortIncome: households.groups[0]?.realPerHead ?? 0,
    gini: 100 * households.gini,
    participation: 100 * totalLaborForce(state) / Math.max(population, 1e-9),
    urbanShare: 100 * (1 - state.demography.classShares.rural_workers),
    inPower: state.politics.inPower ? 1 : 0,
  }
}

// ---------- run one arm ----------
interface Arm {
  id: ArmId
  readings: Reading[]
  final: TrueState
  illegalActionsSkipped: number
  deposedAt: number | null
  nanCount: number
}

function runArm(id: ArmId): Arm {
  // Every arm inherits the same interregnum: before the player took office the
  // caretaker's orders are the country's own history, and they are in the log.
  const script: ActionLog =
    id === 'log' ? save.actionLog : save.actionLog.filter((turn) => turn.tick < appointedAt)
  const policy = id === 'log' ? undefined : POLICIES[id]
  const readings: Reading[] = []
  const result = runOne({
    seed: save.seed,
    ticks,
    params,
    script,
    rules: rules as GameRules,
    appointedAt,
    policy:
      policy === undefined
        ? undefined
        : (state, rng, tick) => (tick < appointedAt ? [] : policy(state, rng, tick)),
    includeStateHash: false,
    observer: {
      afterStep(state) {
        readings.push(read(state))
      },
    },
  })
  return {
    id,
    readings,
    final: result.finalState,
    illegalActionsSkipped: result.illegalActionsSkipped,
    deposedAt: result.deposedAt,
    nanCount: result.nanCount,
  }
}

// ---------- the ceilings the model itself sets ----------
/** Where a bounded series stops, read off the constants rather than off a run.
 * `note` says what binds; a series with no structural bound says so. */
function ceilings(final: TrueState): Array<{ id: string; ceiling: string; note: string }> {
  const absorption = absorptiveCapacity(final)
  // The catch-up fixed point: attainment grows at drift + rate × (gap), the
  // target at the frontier's rate, so the ratio rests where they are equal.
  // The research term vanishes as a sector reaches the frontier, which is why
  // only the floor rate appears here.
  const frontierQ = frontierGrowthAt(final.meta.tick) / 4
  const restingRatio = (exposure: number): number =>
    1 / (1 + Math.max(0, exposure * frontierQ - FRONTIER_OWN_DRIFT_Q) / Math.max(CATCHUP_Q * absorption, 1e-9))
  let weighted = 0
  let weight = 0
  for (const sector of final.sectors) {
    const w = Math.max(0, sector.output)
    weighted += w * restingRatio(TECH_EXPOSURE[sector.id])
    weight += w
  }
  const techResting = weight > 1e-9 ? weighted / weight : NaN
  return [
    {
      id: 'life_expectancy',
      ceiling: `${periodLifeExpectancy(MORT_BASE_ANNUAL.map((m) => m * MORT_FLOOR)).toFixed(1)} yrs`,
      note: `the mortality index cannot go below MORT_FLOOR=${MORT_FLOOR}, and it scales every age band together`,
    },
    {
      id: 'human_capital',
      ceiling: '100.0',
      note: 'the stock chases capacity.education (max 1), closing 1% of the gap a quarter',
    },
    {
      id: 'technology_attainment',
      ceiling: `${(100 * techResting).toFixed(1)}`,
      note:
        `output-weighted catch-up fixed point at this run's absorption ${absorption.toFixed(2)} ` +
        `and frontier growth ${(400 * frontierQ).toFixed(1)}%/yr — research raises the frontier too`,
    },
    {
      id: 'poverty_rate',
      ceiling: `${POVERTY_LINE_REAL.toFixed(2)} baskets`,
      note: 'an absolute line on cohort MEANS: zero once the poorest cohort mean clears it',
    },
    {
      id: 'pollution',
      ceiling: 'unbounded',
      note: 'emissions per head go as output per head ÷ technique^EMISSION_TECH_GAIN (<1)',
    },
  ]
}

// ---------- output ----------
const kinds = new Map<string, number>()
for (const turn of save.actionLog) {
  for (const action of turn.actions) kinds.set(action.kind, (kinds.get(action.kind) ?? 0) + 1)
}

console.log(`\n=== ${params.name} — ${file} ===`)
console.log(
  `  engine ${save.version.engine} schema ${save.version.schema}  seed ${save.seed}  ` +
  `${ticks} quarters (${1946 + Math.floor(ticks / 4)})  appointed ${appointedAt}`,
)
console.log(`  rules ${typeof rules === 'string' ? rules : JSON.stringify(rules)}`)
console.log(
  `  ${save.actionLog.length} turns, ` +
  `${[...kinds].map(([k, n]) => `${k} ${n}`).join(', ')}`,
)

const results = arms.map(runArm)
const log = results[0]

const COLUMNS: Array<[keyof Reading, string, number]> = [
  ['gdpPerHead', 'gdp/head', 2],
  ['livingStandard', 'living', 2],
  ['unemployment', 'unemp', 1],
  ['debtToGdp', 'debt%', 0],
  ['lifeExpectancy', 'life exp', 1],
  ['mortalityIndex', 'mort idx', 3],
  ['pollution', 'pollution', 2],
  ['techAttainment', 'tech att', 1],
  ['humanCapital', 'human cap', 1],
  ['povertyRate', 'poverty', 1],
  ['gini', 'gini', 1],
  ['participation', 'partic', 1],
]

console.log(`\n--- the played century, true state every ${every} quarters ---`)
console.log(
  'year  ' + COLUMNS.map(([, label]) => label.padStart(9)).join(''),
)
for (const reading of log.readings) {
  if (reading.tick % every !== 0 && reading !== log.readings[log.readings.length - 1]) continue
  console.log(
    String(reading.year).padEnd(6) +
    COLUMNS.map(([key, , dp]) => (reading[key] as number).toFixed(dp).padStart(9)).join(''),
  )
}

if (results.length > 1) {
  console.log('\n--- the same country and seed under other governments, at the end ---')
  console.log('arm            ' + COLUMNS.map(([, label]) => label.padStart(9)).join('') + '   skipped')
  for (const arm of results) {
    const last = arm.readings[arm.readings.length - 1]
    const deposed = arm.deposedAt === null ? '' : ` (deposed ${1946 + Math.floor(arm.deposedAt / 4)})`
    console.log(
      arm.id.padEnd(15) +
      COLUMNS.map(([key, , dp]) => (last[key] as number).toFixed(dp).padStart(9)).join('') +
      `   ${String(arm.illegalActionsSkipped).padStart(5)}${deposed}`,
    )
  }
}

console.log('\n--- where the model itself stops ---')
for (const row of ceilings(log.final)) {
  console.log(`  ${row.id.padEnd(23)} ${row.ceiling.padStart(12)}   ${row.note}`)
}

if (log.nanCount > 0) console.log(`\n  WARNING: ${log.nanCount} non-finite readings in the replay`)

if (csvPath) {
  const keys = Object.keys(log.readings[0]) as Array<keyof Reading>
  const rows = [keys.join(',')]
  for (const reading of log.readings) rows.push(keys.map((k) => reading[k]).join(','))
  writeFileSync(csvPath, rows.join('\n') + '\n')
  console.log(`\n  wrote ${log.readings.length} quarters of true state to ${csvPath}`)
}

// Sectoral detail is cheap and is the first thing asked after any composition
// question; print it once at the end rather than adding five more columns.
console.log('\n--- final sector detail (played century) ---')
console.log('sector      output   attained    target   position')
for (const sid of SECTOR_IDS) {
  const sector = log.final.sectors.find((s) => s.id === sid)
  if (!sector) continue
  const target = Math.pow(log.final.tech.frontier, TECH_EXPOSURE[sid])
  const attained = log.final.tech.attained[sid]
  console.log(
    `${sid.padEnd(10)} ${sector.output.toFixed(1).padStart(7)} ` +
    `${attained.toFixed(2).padStart(10)} ${target.toFixed(2).padStart(9)} ` +
    `${(100 * attained / target).toFixed(1).padStart(10)}%`,
  )
}
console.log()
