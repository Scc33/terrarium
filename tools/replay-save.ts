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
 * Four things it deliberately does:
 *
 * - **It accepts either file the game writes.** The records office exports a
 *   `SaveFile`; the data export wraps that same save under `run` beside the
 *   published history (`packages/observation/src/dataExport.ts`). A reader
 *   that took only one of them would send half the people who have a run to
 *   hand-editing JSON first.
 * - **It replays the log the way the GAME'S LOADER would** (`lenient: 'turn'`),
 *   not the way a runner policy is scored. An old save may stage an order this
 *   build refuses; the loader discards that whole turn, so a tool claiming to
 *   show "the century they played" has to discard it too or it reports a
 *   country the game itself would not open.
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
 *
 * The decisions live in exported functions rather than in the CLI body, and
 * that is not tidiness. The first version of this file put argument parsing,
 * arm selection and the fixed point inline, where no test could reach them,
 * and review found four bugs in exactly that half: a `--arms passive,log` that
 * labelled the passive century as the played one, a positional filename that
 * swallowed `--every 20`, a zero-quarter save that crashed, and a research
 * term missing from the ceiling. `tests/tools/replay-save.test.ts` pins them.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  CATCHUP_Q,
  FRONTIER_OWN_DRIFT_Q,
  MORT_BASE_ANNUAL,
  MORT_FLOOR,
  RESEARCH_CATCHUP_GAIN_Q,
  RESEARCH_FRONTIER_START,
  RESEARCH_STOCK_DECAY_Q,
  TECH_EXPOSURE,
} from '../packages/engine/src/constants'
import {
  CAPACITY_IDS,
  END_OF_HISTORY_TICK,
  ENGINE_VERSION,
  POVERTY_LINE_REAL,
  SCHEMA_VERSION,
  SECTOR_IDS,
  STATUTE_IDS,
  STATUTE_LEVELS,
  absorptiveCapacity,
  appointmentTick,
  frontierGrowthAt,
  householdIncomeDistribution,
  lifeExpectancyAtBirth,
  livingStandard,
  periodLifeExpectancy,
  technologyAttainment,
  totalLaborForce,
  type Action,
  type ActionLog,
  type GameRules,
  type Qtr,
  type SaveFile,
  type TrueState,
} from '../packages/engine/src/index'
import { developmentalPolicy, type RunnerPolicy } from '../packages/runner/src/policies'
import { runOne } from '../packages/runner/src/run'

export const ARM_IDS = ['log', 'passive', 'developmental', 'maximal'] as const
export type ArmId = (typeof ARM_IDS)[number]

// ---------- arguments ----------
/** Flags that take a SEPARATE value token. Parsing has to know them, because
 * otherwise `pnpm replay --every 20 save.json` reads `20` as the filename —
 * which it did, and the error it produced blamed the file. */
const VALUED_FLAGS = ['every', 'csv', 'arms', 'ticks'] as const

export interface ReplayArgs {
  file: string
  every: number
  csvPath: string
  arms: ArmId[]
  /** an explicit `--ticks`, or null to replay the save's whole horizon */
  ticks: number | null
}

export function parseArgs(argv: readonly string[]): ReplayArgs {
  const flag = (name: string): string | undefined => {
    const inline = argv.find((value) => value.startsWith(`--${name}=`))
    if (inline) return inline.slice(name.length + 3)
    const index = argv.indexOf(`--${name}`)
    return index >= 0 ? argv[index + 1] : undefined
  }

  // Walk the tokens so a flag's value can never be mistaken for the file.
  let file: string | undefined
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (token.startsWith('--')) {
      const name = token.slice(2).split('=')[0]
      if (!token.includes('=') && (VALUED_FLAGS as readonly string[]).includes(name)) i++
      continue
    }
    file ??= token
  }
  if (!file) throw new Error('usage: pnpm replay <save-or-export.json> [--arms …] [--every N] [--csv out.csv] [--ticks N]')

  const every = Number(flag('every') ?? 40)
  if (!Number.isInteger(every) || every <= 0) throw new Error('--every must be a positive integer')

  const rawTicks = flag('ticks')
  const ticks = rawTicks === undefined ? null : Number(rawTicks)
  if (ticks !== null && (!Number.isInteger(ticks) || ticks <= 0)) {
    throw new Error('--ticks must be a positive integer')
  }

  // Every name is checked. A silently dropped typo finishes without the
  // counterfactual the experiment was asking for, and looks like it worked.
  const names = (flag('arms') ?? ARM_IDS.join(',')).split(',').map((id) => id.trim()).filter(Boolean)
  const unknown = names.filter((id) => !(ARM_IDS as readonly string[]).includes(id))
  if (unknown.length > 0) {
    throw new Error(`unknown arm${unknown.length > 1 ? 's' : ''} ${unknown.join(', ')} — pick from ${ARM_IDS.join(', ')}`)
  }
  if (names.length === 0) throw new Error(`--arms must name some of: ${ARM_IDS.join(', ')}`)

  // The log arm always leads: it is the subject, and everything singular the
  // report prints (ceilings, CSV, sector detail) is read off it BY ID, so the
  // order here is presentation only.
  const arms = [...new Set(names as ArmId[])]
  return { file, every, csvPath: flag('csv') ?? '', arms: ['log', ...arms.filter((id) => id !== 'log')], ticks }
}

// ---------- the file ----------
/** Either artifact the game writes. The data export embeds the exact save it
 * was taken from, so unwrapping it is reading the same document. */
export function loadSave(path: string): SaveFile {
  const parsed = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>
  const save = ('run' in parsed ? parsed.run : parsed) as SaveFile
  if (!save?.params || !save?.seed || !Array.isArray(save.actionLog)) {
    throw new Error(`${path} is neither a save file nor a terrarium data export`)
  }
  return save
}

export interface ReplayPlan {
  /** the save's own appointment, normalized the way `init` normalizes it */
  appointedAt: Qtr
  /** quarters to run — never past the save's own record */
  ticks: number
}

/**
 * What this save may legally be asked for.
 *
 * Both checks exist because the tool reaches `runOne` rather than the engine's
 * `replay()`, which enforces them itself. Without them a hand-edited save that
 * stopped inside its own interregnum reports a caretaker's quarters as a
 * played game (with every order quoted and none charged), and a `--ticks`
 * beyond the record appends action-free quarters and calls them played.
 */
export function planReplay(save: SaveFile, requestedTicks: number | null): ReplayPlan {
  const appointedAt = appointmentTick(save.appointedAt ?? 0)
  // The same clamp `replayWindow` applies in the loader. A save can carry a
  // tick past the close — hand-edited, or written by a build whose calendar
  // ran further — and simulating quarters after the game has ended reports a
  // country the game itself would never show, having claimed to match it.
  const closes = Math.min(save.tick, END_OF_HISTORY_TICK)
  if (appointedAt > closes) {
    throw new Error(
      `the run was saved at quarter ${save.tick} but its government does not take office until ${appointedAt}`,
    )
  }
  if (requestedTicks !== null && requestedTicks > save.tick) {
    throw new Error(
      `--ticks ${requestedTicks} runs past the save's own record (${save.tick} quarters); ` +
      'the extra quarters would be action-free and would not be the century that was played',
    )
  }
  return { appointedAt, ticks: Math.min(requestedTicks ?? closes, closes) }
}

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
export const maximalPolicy: RunnerPolicy = (state, _rng, tick) => {
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
    // Vote a rule only while it is not already the rule. `setSpendingRule`
    // charges the base political-capital cost even for an identical share, so
    // a probe that re-submits every year burns capital it should be spending
    // on ministries and statutes — and on any run without `unlimitedCapital`
    // that is the difference between a ceiling and a deposition.
    for (const [programme, share] of [['research', 0.05], ['investment', 0.08]] as const) {
      const rule = state.gov.spendingRules[programme]
      if (rule.kind !== 'gdpShare' || Math.abs(rule.share - share) > 1e-9) {
        actions.push({ kind: 'setSpendingRule', programme, mode: 'gdpShare', value: share })
      }
    }
  }
  return actions
}

const POLICIES: Record<Exclude<ArmId, 'log'>, RunnerPolicy | undefined> = {
  passive: undefined,
  developmental: developmentalPolicy,
  maximal: maximalPolicy,
}

// ---------- what one quarter of the truth looks like ----------
export interface Reading {
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
  /** THIS QUARTER's inflation, annualized. Deliberately not called
   * year-on-year: it compounds one quarter four times rather than measuring
   * four distinct quarters, and in a volatile run the two differ materially
   * while both look plausible. */
  inflationAnnualizedQ: number
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

export function read(state: TrueState): Reading {
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
    inflationAnnualizedQ: 100 * (Math.pow(1 + state.flows.inflationQ, 4) - 1),
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
export interface Arm {
  id: ArmId
  readings: Reading[]
  final: TrueState
  illegalActionsSkipped: number
  deposedAt: number | null
  nanCount: number
}

export function runArm(id: ArmId, save: SaveFile, plan: ReplayPlan): Arm {
  // Every arm inherits the same interregnum: before the player took office the
  // caretaker's orders are the country's own history, and they are in the log.
  const script: ActionLog =
    id === 'log' ? save.actionLog : save.actionLog.filter((turn) => turn.tick < plan.appointedAt)
  const policy = id === 'log' ? undefined : POLICIES[id]
  const readings: Reading[] = []
  const result = runOne({
    seed: save.seed,
    ticks: plan.ticks,
    params: save.params,
    script,
    rules: (save.rules ?? save.mode ?? 'standard') as GameRules,
    appointedAt: plan.appointedAt,
    // The loader's semantics, not the policy-scoring ones — see the header.
    lenient: 'turn',
    policy:
      policy === undefined
        ? undefined
        : (state, rng, tick) => (tick < plan.appointedAt ? [] : policy(state, rng, tick)),
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
/**
 * Where `technology_attainment` comes to rest, output-weighted.
 *
 * Attainment chases a target that runs away at the frontier's own rate, so the
 * ratio rests where the two growth rates are equal. Per sector, with
 * `p = attained / target`:
 *
 *   a' = a(1 + drift) + rate(p) × (T' − a),   T' = T × (1 + g)
 *
 * Setting a'/T' = a/T = p and dividing through by T gives
 *
 *   p = rate(p) × (1 + g) / (rate(p) + g − drift)
 *
 * Two details are load-bearing and both were wrong the first time.
 *
 * `g` is `(1 + frontierQ)^exposure − 1`, the engine's own MULTIPLICATIVE
 * advance, not `exposure × frontierQ`; and the numerator carries `(1 + g)`
 * because the engine's catch-up term chases `historicalTarget`, which is the
 * target AFTER this quarter's frontier step. Dropping either understates the
 * ceiling by a couple of tenths, in the direction that makes a run look like
 * it still has headroom.
 *
 * `rate` DEPENDS on `p`, because the engine scales the research catch-up term
 * by `catchupBySector`, which fades to zero only at the frontier itself
 * (`RESEARCH_FRONTIER_START` is 0.7, and a resting position is normally above
 * it but below one). So this iterates the map rather than evaluating a
 * zero-research formula once.
 *
 * Breakthroughs are deliberately absent: `ownInnovation` is a Poisson lump on
 * the frontier, not a term in a resting point.
 * `tests/tools/replay-save.test.ts` pins the result against a direct
 * simulation of `pipeline/technology.ts`'s own update.
 */
export function technologyCeiling(final: TrueState): { resting: number; absorption: number; frontierQ: number } {
  const absorption = absorptiveCapacity(final)
  const frontierQ = frontierGrowthAt(final.meta.tick) / 4
  const intensity = final.tech.researchStock * RESEARCH_STOCK_DECAY_Q

  const restingRatio = (exposure: number): number => {
    const g = Math.pow(1 + frontierQ, exposure) - 1
    // A target that advances no faster than the drift is one attainment
    // catches; the ratio rests at the frontier rather than below it.
    if (g <= FRONTIER_OWN_DRIFT_Q) return 1
    let p = 1
    for (let i = 0; i < 128; i++) {
      const frontierShare = Math.min(
        1,
        Math.max(0, (p - RESEARCH_FRONTIER_START) / (1 - RESEARCH_FRONTIER_START)),
      )
      const rate =
        CATCHUP_Q * absorption +
        absorption * RESEARCH_CATCHUP_GAIN_Q * intensity * (1 - frontierShare)
      const next = Math.min(1, (rate * (1 + g)) / (rate + g - FRONTIER_OWN_DRIFT_Q))
      if (Math.abs(next - p) < 1e-12) return next
      p = next
    }
    return p
  }

  let weighted = 0
  let weight = 0
  for (const sector of final.sectors) {
    const w = Math.max(0, sector.output)
    weighted += w * restingRatio(TECH_EXPOSURE[sector.id])
    weight += w
  }
  return { resting: weight > 1e-9 ? weighted / weight : NaN, absorption, frontierQ }
}

/** Where a bounded series stops, read off the constants rather than off a run.
 * `note` says what binds; a series with no structural bound says so. */
export function ceilings(final: TrueState): Array<{ id: string; ceiling: string; note: string }> {
  const { resting, absorption, frontierQ } = technologyCeiling(final)
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
      ceiling: `${(100 * resting).toFixed(1)}`,
      note:
        `output-weighted catch-up fixed point at this run's absorption ${absorption.toFixed(2)}, ` +
        `research intensity and frontier growth ${(400 * frontierQ).toFixed(1)}%/yr — research raises the frontier too`,
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

function main(argv: readonly string[]): void {
  const args = parseArgs(argv)
  const save = loadSave(args.file)
  const plan = planReplay(save, args.ticks)

  // Only the turns this replay will actually reach. A `--ticks` prefix that
  // still advertised the whole log would credit the experiment with statutes
  // and spending changes that had not happened yet.
  const kinds = new Map<string, number>()
  let turnsInHorizon = 0
  for (const turn of save.actionLog) {
    if (turn.tick >= plan.ticks) continue
    turnsInHorizon++
    for (const action of turn.actions) kinds.set(action.kind, (kinds.get(action.kind) ?? 0) + 1)
  }

  console.log(`\n=== ${save.params.name} — ${args.file} ===`)
  // Both stamps, always. The replay runs on the CURRENTLY INSTALLED engine
  // whatever the file was written by, so labelling these numbers with the
  // save's own version would file today's behaviour under an old schema — and
  // an investigation stamped that way is unreproducible by construction.
  console.log(
    `  save written by engine ${save.version?.engine ?? '?'} schema ${save.version?.schema ?? '?'}; ` +
    `replayed by engine ${ENGINE_VERSION} schema ${SCHEMA_VERSION}`,
  )
  console.log(
    `  seed ${save.seed}  ${plan.ticks} quarters (${1946 + Math.floor(plan.ticks / 4)})  ` +
    `appointed ${plan.appointedAt}`,
  )
  console.log(`  rules ${JSON.stringify(save.rules ?? save.mode ?? 'standard')}`)
  const elided = save.actionLog.length - turnsInHorizon
  console.log(
    `  ${turnsInHorizon} turns${elided > 0 ? ` (${elided} later ones outside this horizon)` : ''}, ` +
    `${[...kinds].map(([k, n]) => `${k} ${n}`).join(', ')}`,
  )

  const results = args.arms.map((id) => runArm(id, save, plan))
  // By id, never by position: an arm list is presentation order, and reading
  // the subject off `results[0]` labelled `--arms passive,log`'s passive
  // century as the played one — in the table, the ceilings and the CSV alike.
  const log = results.find((arm) => arm.id === 'log')
  if (!log) throw new Error('the played-log arm is always run')

  if (log.readings.length === 0) {
    // A save the worker writes the moment a posting opens has no quarters in
    // it yet. That is a valid file, not an error, and it has nothing to report.
    console.log('\n  this save has not completed a quarter yet — nothing to replay.\n')
    return
  }

  console.log(`\n--- the played century, true state every ${args.every} quarters ---`)
  console.log('year  ' + COLUMNS.map(([, label]) => label.padStart(9)).join(''))
  const lastReading = log.readings[log.readings.length - 1]
  for (const reading of log.readings) {
    if (reading.tick % args.every !== 0 && reading !== lastReading) continue
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
      if (!last) continue
      const deposed = arm.deposedAt === null ? '' : ` (deposed ${1946 + Math.floor(arm.deposedAt / 4)})`
      console.log(
        arm.id.padEnd(15) +
        COLUMNS.map(([key, , dp]) => (last[key] as number).toFixed(dp).padStart(9)).join('') +
        `   ${String(arm.illegalActionsSkipped).padStart(5)}${deposed}`,
      )
    }
  }

  // Outside the comparison block on purpose: `--arms log` is the run most
  // likely to be quoted as "the played century", and it is the one where a
  // silently discarded turn does the most damage.
  if (log.illegalActionsSkipped > 0) {
    console.log(
      `\n  NOTE: ${log.illegalActionsSkipped} of this save's own orders are refused by the ` +
      `installed engine and their turns were discarded, exactly as the game's loader would. ` +
      `This is no longer bit-for-bit the century that was played.`,
    )
  }

  console.log('\n--- where the model itself stops ---')
  for (const row of ceilings(log.final)) {
    console.log(`  ${row.id.padEnd(23)} ${row.ceiling.padStart(12)}   ${row.note}`)
  }

  if (log.nanCount > 0) console.log(`\n  WARNING: ${log.nanCount} non-finite readings in the replay`)

  if (args.csvPath) {
    const keys = Object.keys(log.readings[0]) as Array<keyof Reading>
    const rows = [keys.join(',')]
    for (const reading of log.readings) rows.push(keys.map((k) => reading[k]).join(','))
    writeFileSync(args.csvPath, rows.join('\n') + '\n')
    console.log(`\n  wrote ${log.readings.length} quarters of true state to ${args.csvPath}`)
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
}

// Run only as a CLI, so the decisions above stay importable by tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2))
}
