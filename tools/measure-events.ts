/**
 * What the wire actually carries, measured (#160):
 *
 *   pnpm events -- --runs 40 --ticks 400
 *
 * The event system's only balance question is whether a player reads it, and
 * that has three failure modes a page of catalogue cannot show you:
 *
 *  1. **dead copy** — an event nothing can reach. A dispatch nobody ever sees
 *     is not content, and AGENTS.md's rule ("a mechanic you cannot reach is
 *     not a mechanic") applies to prose exactly as it applies to thresholds.
 *     The UNREACHED list at the bottom is the one to read.
 *  2. **a flood** — so many dispatches a quarter that none of them register,
 *     at which point the hard events that are the player's only warning are
 *     invisible too.
 *  3. **repetition** — the original complaint. `repeats` counts how often the
 *     top event was filed; if one dispatch is a third of the century, the
 *     cooldown is not doing its job.
 *
 * Measured across passive, developmental and random play, because a condition
 * reachable only when the player does nothing (or only when they do
 * everything) is reachable in a game nobody plays.
 */

import {
  CURATED_COUNTRY_IDS,
  DESK_IDS,
  EVENT_CATALOGUE,
  EVENT_IDS,
  PRESS_ERAS,
  createCountryParams,
  eraAtTick,
  type DeskId,
  type EventId,
} from '../packages/engine/src/index'
import { POLICY_IDS, policyFor, type PolicyId } from '../packages/runner/src/policies'
import { runOne } from '../packages/runner/src/run'
import type { Action, TrueState } from '../packages/engine/src/index'
import { INSTITUTION_IDS } from '../packages/engine/src/index'

/**
 * A fifth arm, local to this tool: a government that uses the constitution.
 *
 * The runner's four policies move dials, build capacity and write statutes,
 * and not one of them ever reforms an institution — so a sweep over them
 * reports every `reform_*` dispatch as dead copy when the truth is that
 * nothing in the sample can reach it. It is not a balance baseline and does
 * not belong in `packages/runner`: it exists so that "unreached" below means
 * unreachable rather than unexercised.
 *
 * It reforms in both directions on purpose. A country that only ever widens
 * its franchise never leaves the corridor, never gets a coup, and never holds
 * an election with the opposition off the ballot — three lead stories that
 * would otherwise be measured as unreachable because nobody in the sample was
 * willing to be the villain.
 */
const constitutionalPolicy = (state: TrueState, _rng: unknown, tick: number): Action[] => {
  if (tick % 6 !== 0) return []
  const authoritarian = Math.floor(tick / 96) % 2 === 1
  const institution = INSTITUTION_IDS[Math.floor(tick / 6) % INSTITUTION_IDS.length]
  const direction: 1 | -1 = authoritarian === (institution === 'repression') ? 1 : -1
  const stock = state.institutions.stocks[institution]
  if ((direction > 0 && stock > 0.95) || (direction < 0 && stock < 0.05)) return []
  const actions: Action[] = [{ kind: 'reform', institution, direction }]
  if (authoritarian && state.politics.quartersToElection === 1) {
    actions.push({ kind: 'campaign', platform: 'suppression' })
  }
  return actions
}

const ARMS: Array<{ id: string; policy: ReturnType<typeof policyFor> }> = [
  ...POLICY_IDS.map((id) => ({ id, policy: policyFor(id as PolicyId) })),
  { id: 'constitutional', policy: constitutionalPolicy as ReturnType<typeof policyFor> },
]

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const RUNS = Number(arg('runs', '24'))
const TICKS = Number(arg('ticks', '400'))
if (!Number.isInteger(RUNS) || RUNS <= 0) throw new Error('--runs must be a positive integer')

interface Tally {
  /** how many dispatches, in total, across every run */
  filed: number
  /** how many of the runs saw this event at least once */
  runsSeen: number
  /** most times one run filed it */
  worstRepeat: number
}

const seen = new Map<EventId, Tally>()
const perQuarter: number[] = []
const byDesk = new Map<DeskId, number>()
const byEra = new Map<string, number>()
let quarters = 0
let emptyQuarters = 0

for (const arm of ARMS) {
  const policy = arm.id
  for (let r = 0; r < RUNS; r++) {
    const country = CURATED_COUNTRY_IDS[r % CURATED_COUNTRY_IDS.length]
    const result = runOne({
      seed: `wire-${policy}-${r}`,
      ticks: TICKS,
      params: createCountryParams(country, `wire-country-${r}`),
      policy: arm.policy,
      policySeed: `wire-policy-${policy}-${r}`,
      includeStateHash: false,
    })
    const news = result.finalState.stats.news
    const thisRun = new Map<EventId, number>()
    const load = new Map<number, number>()
    for (const item of news) {
      thisRun.set(item.event, (thisRun.get(item.event) ?? 0) + 1)
      load.set(item.tick, (load.get(item.tick) ?? 0) + 1)
      byDesk.set(item.desk, (byDesk.get(item.desk) ?? 0) + 1)
      const era = eraAtTick(item.tick)
      byEra.set(era, (byEra.get(era) ?? 0) + 1)
    }
    for (const [event, count] of thisRun) {
      const tally = seen.get(event) ?? { filed: 0, runsSeen: 0, worstRepeat: 0 }
      tally.filed += count
      tally.runsSeen += 1
      tally.worstRepeat = Math.max(tally.worstRepeat, count)
      seen.set(event, tally)
    }
    const reached = result.finalState.meta.tick
    quarters += reached
    for (let t = 0; t < reached; t++) {
      const n = load.get(t) ?? 0
      perQuarter.push(n)
      if (n === 0) emptyQuarters += 1
    }
  }
}

const totalRuns = RUNS * ARMS.length
const filedTotal = [...seen.values()].reduce((s, t) => s + t.filed, 0)
const pct = (n: number, d: number) => `${((100 * n) / Math.max(d, 1)).toFixed(1)}%`

console.log(`\n=== the wire, ${totalRuns} runs × ${TICKS}q, ${ARMS.map((a) => a.id).join('/')}, every curated country ===`)
console.log(`catalogue          ${EVENT_IDS.length} events`)
console.log(`reached            ${seen.size} (${pct(seen.size, EVENT_IDS.length)})`)
console.log(`dispatches         ${filedTotal} over ${quarters} quarters`)
console.log(`per quarter        ${(filedTotal / Math.max(quarters, 1)).toFixed(2)} mean`)
console.log(`quiet quarters     ${pct(emptyQuarters, quarters)}`)
console.log(`busiest quarter    ${Math.max(...perQuarter)} dispatches`)

console.log('\n--- by desk ---')
for (const desk of DESK_IDS) {
  const n = byDesk.get(desk) ?? 0
  console.log(`  ${desk.padEnd(10)} ${String(n).padStart(6)}  ${pct(n, filedTotal)}`)
}

console.log('\n--- by era (dispatches per quarter lived in it) ---')
for (const era of PRESS_ERAS) {
  const n = byEra.get(era.id) ?? 0
  console.log(`  ${era.id.padEnd(10)} ${String(n).padStart(6)}  ${era.label}`)
}

console.log('\n--- most filed ---')
const ranked = [...seen.entries()].sort((a, b) => b[1].filed - a[1].filed)
for (const [event, tally] of ranked.slice(0, 15)) {
  console.log(
    `  ${event.padEnd(38)} ${String(tally.filed).padStart(5)}  in ${pct(tally.runsSeen, totalRuns).padStart(6)} of runs  worst repeat ${tally.worstRepeat}`,
  )
}

const unreached = EVENT_IDS.filter((id) => !seen.has(id))
console.log(`\n--- UNREACHED BY THIS SWEEP (${unreached.length}) ---`)
if (unreached.length === 0) console.log('  none: every dispatch in the catalogue was printed')
for (const id of unreached) {
  const def = EVENT_CATALOGUE[id]
  console.log(`  ${id.padEnd(38)} ${def.desk}/${def.kind}`)
}
// Sampled, not structural, and the difference matters. This list means "no
// seed in this sweep produced it", which for a rare political outcome — a
// despotic corridor exit, an election won on a suppression platform, anything
// gated on a game rule none of these arms sets — is a fact about the sample
// rather than about the catalogue. What proves an event is REACHABLE AT ALL is
// `tests/properties/events.test.ts`, which requires every id to have either a
// condition rule or a call site in the engine's source. Read this list by
// asking, of each entry, what play would produce it; if the answer is "none",
// that is the finding.
console.log(
  '\n  Sampled, not structural: a rare political outcome or a game-rule-gated\n' +
    '  dispatch can sit here legitimately. `tests/properties/events.test.ts`\n' +
    '  is what proves an event is reachable at all.',
)
console.log()
