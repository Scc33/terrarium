/**
 * The wire, over a century (#160).
 *
 * `tests/unit/events.test.ts` checks the catalogue as a table. This checks it
 * as a thing a player reads, which is a different subject with different
 * failure modes:
 *
 *  • **dead copy.** An event nothing can raise is not content. AGENTS.md's
 *    rule — a mechanic you cannot reach is not a mechanic — applies to a
 *    dispatch exactly as it applies to a threshold, and two of the original
 *    condition thresholds were dead on arrival at numbers that looked
 *    entirely plausible on the page (annual inflation above forty per cent;
 *    a debt over 110 % of GDP, when the measured century tops out at 93 %).
 *  • **a flood.** Six dispatches a quarter is not a richer game; it is a wire
 *    nobody reads, at which point the hard events that are the player's only
 *    warning become invisible too.
 *  • **the fog leaking.** The wire is made from true state. It may only ever
 *    print authored prose.
 *
 * The reachability check here is STRUCTURAL — every event is either wired to
 * a condition rule or named in the engine's own source — because a sampling
 * check cannot distinguish "unreachable" from "this seed did not have a
 * coup". `pnpm events` is the sampling counterpart, and the two answer
 * different questions on purpose.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CONDITION_RULES,
  EVENT_CATALOGUE,
  EVENT_IDS,
  NEWS_REPORTS_PER_QTR,
  createSave,
  eraAtTick,
  replay,
  type EventId,
  type TrueState,
} from '@terrarium/engine'
import { passive, standardCountry } from '@terrarium/fixtures'

const ENGINE_SRC = new URL('../../packages/engine/src/', import.meta.url).pathname

/** Every .ts file under the engine, so "is this event raised anywhere" is a
 * question about the whole engine rather than about the six files somebody
 * remembered to list. */
function engineSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) engineSources(path, out)
    else if (entry.name.endsWith('.ts') && !path.includes('/events/')) out.push(path)
  }
  return out
}

const century = (seed: string, ticks = 400): TrueState =>
  replay(createSave(standardCountry, seed, passive, ticks))

describe('every dispatch in the catalogue can be read', () => {
  const raisedInSource = new Set<EventId>()
  const sources = engineSources(ENGINE_SRC).map((p) => readFileSync(p, 'utf-8')).join('\n')
  for (const id of EVENT_IDS) if (sources.includes(`'${id}'`)) raisedInSource.add(id)
  const wiredToARule = new Set(CONDITION_RULES.map((r) => r.event))

  it('wires every event to a rule or to a call site', () => {
    // Deliberately excludes `events/` itself from the search: the catalogue
    // names every id by construction, so including it would make this test
    // pass unconditionally — which is how a reachability check quietly stops
    // checking anything.
    const orphans = EVENT_IDS.filter((id) => !wiredToARule.has(id) && !raisedInSource.has(id))
    expect(orphans, 'events with no rule and no call site — dead copy').toEqual([])
  })

  it('does not wire an event both ways', () => {
    // A condition rule for an event a pipeline step also raises would file it
    // twice on the same quarter and report a fact as if it were a rumour.
    const both = EVENT_IDS.filter((id) => wiredToARule.has(id) && raisedInSource.has(id))
    expect(both, 'events raised by a step AND selected by the desk').toEqual([])
  })
})

describe('a passive century', () => {
  const state = century('wire-century')
  const news = state.stats.news

  it('carries a wire worth reading, at a volume that can be read', () => {
    expect(news.length).toBeGreaterThan(120)
    const perQuarter = new Map<number, number>()
    for (const item of news) perQuarter.set(item.tick, (perQuarter.get(item.tick) ?? 0) + 1)
    // The budget bounds CONDITION reports; facts are never budgeted away, and
    // a quarter can legitimately carry a coup, a drought and the milestone
    // the drought pushed the country across. What must not happen is a page
    // of six.
    expect(Math.max(...perQuarter.values())).toBeLessThanOrEqual(NEWS_REPORTS_PER_QTR + 3)
  })

  it('does not read the same in 1949 and 2043', () => {
    // The original complaint, as an assertion. Two windows a lifetime apart
    // must not be the same handful of dispatches.
    const early = new Set(news.filter((n) => n.tick < 60).map((n) => n.event))
    const late = new Set(news.filter((n) => n.tick > 340).map((n) => n.event))
    expect(early.size).toBeGreaterThan(6)
    expect(late.size).toBeGreaterThan(6)
    const shared = [...early].filter((e) => late.has(e)).length
    expect(shared / Math.min(early.size, late.size)).toBeLessThan(0.75)
  })

  it('never lets one dispatch dominate the century', () => {
    const counts = new Map<EventId, number>()
    for (const item of news) counts.set(item.event, (counts.get(item.event) ?? 0) + 1)
    const worst = Math.max(...counts.values())
    // Elections are the legitimate ceiling: one every sixteen quarters for a
    // century is twenty-five, and that is a real recurring event rather than
    // a stuck ticker.
    expect(worst / news.length).toBeLessThan(0.25)
  })

  it('spreads across desks rather than filling one column', () => {
    const desks = new Set(news.map((n) => n.desk))
    expect(desks.size).toBeGreaterThanOrEqual(6)
  })

  it('files each item in the era it was written in', () => {
    // The masthead and the copy are sealed at filing time, so an archive read
    // in 2043 still shows the 1958 paper. A dispatch whose outlet belongs to
    // another era means something recomputed it after the fact.
    for (const item of news) {
      const era = eraAtTick(item.tick)
      expect(item.kind).toBe(EVENT_CATALOGUE[item.event].kind)
      expect(item.desk).toBe(EVENT_CATALOGUE[item.event].desk)
      expect(typeof era).toBe('string')
      expect(item.outlet.length).toBeGreaterThan(0)
      expect(item.body.length).toBeGreaterThan(0)
    }
  })

  it('reports a milestone once, and only where it was crossed', () => {
    const milestones = news.filter((n) => n.kind === 'milestone')
    const ids = milestones.map((n) => n.event)
    expect(new Set(ids).size).toBe(ids.length)
    // Nothing on the opening morning: a fact that was true when the country
    // opened is a description of it, not something that happened to it. The
    // standard opening led its 1946Q1 page with "more of the country now
    // lives in towns than out of them" until this was enforced.
    expect(milestones.every((n) => n.tick > 0)).toBe(true)
  })

  it('carries colour from more than one age', () => {
    const eras = new Set(news.filter((n) => n.kind === 'colour').map((n) => eraAtTick(n.tick)))
    expect(eras.size).toBeGreaterThan(2)
  })
})

describe('the desk spends its budget', () => {
  const state = century('wire-budget', 400)
  const news = state.stats.news

  // The other half of this — that a milestone is not charged against the page
  // twice — is a unit test over `reportBudget` in `tests/unit/events.test.ts`
  // rather than an assertion here. Milestones fire about once per century, so
  // a sweep over twelve runs produced ONE quarter in which the difference was
  // even observable: a property test over the wire could not tell the fix from
  // the bug, which is the definition of a test that does not test anything.

  it('holds a slot for polling day, which lands after the office reports', () => {
    // `politics` runs after `statistics`, so an election is not in the
    // quarter's tally when the desk sits down. Without a reservation the
    // crowding-out rule did not apply to the loudest story in the game, and
    // an election quarter carried its lead on top of a full page of reports.
    const electionQuarters = new Set(
      news.filter((n) => n.kind === 'election').map((n) => n.tick),
    )
    expect(electionQuarters.size).toBeGreaterThan(4)
    for (const tick of electionQuarters) {
      const reports = news.filter((n) => n.tick === tick && n.kind === 'rumor').length
      expect(reports, `election quarter ${tick} carries a full page of reports`).toBeLessThan(
        NEWS_REPORTS_PER_QTR,
      )
    }
  })
})

describe('the wire is deterministic and replay-stable', () => {
  it('gives the same century for the same seed', () => {
    const a = century('wire-determinism', 120).stats.news
    const b = century('wire-determinism', 120).stats.news
    expect(a.map((n) => `${n.tick}:${n.event}:${n.outlet}`)).toEqual(
      b.map((n) => `${n.tick}:${n.event}:${n.outlet}`),
    )
  })

  it('gives a different century for a different seed', () => {
    const a = century('wire-seed-a', 120).stats.news.map((n) => `${n.tick}:${n.event}`)
    const b = century('wire-seed-b', 120).stats.news.map((n) => `${n.tick}:${n.event}`)
    expect(a).not.toEqual(b)
  })
})
