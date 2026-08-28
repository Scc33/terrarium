/**
 * The event catalogue as a data structure (#160).
 *
 * These are the checks the compiler cannot make. `EVENT_CATALOGUE` is a total
 * `Record` over `EVENT_IDS`, so a missing entry is a build error — but every
 * interesting way to break an event catalogue is invisible to a type system:
 * a dispatch with no copy, an era override that shadows every earlier one, a
 * headline carrying a figure the fog was supposed to withhold, a masthead
 * roster that runs out of titles.
 */

import { describe, expect, it } from 'vitest'
import {
  CONDITION_RULES,
  DESK_IDS,
  EVENT_CATALOGUE,
  EVENT_IDS,
  NEWS_KINDS,
  PRESS_ERAS,
  PRESS_ERA_IDS,
  PROMINENCE_IDS,
  PRESS_CAPTURED_AT,
  cooldownFor,
  dispatchesFor,
  eraAtYear,
  isEventId,
  medianAge,
  outletFor,
  reportBudget,
  NEWS_COOLDOWN_MAX_Q,
  type EventId,
  type PressEraId,
} from '@terrarium/engine'

describe('the catalogue is complete', () => {
  it('gives every event a desk, a kind, a prominence and at least one dispatch', () => {
    for (const id of EVENT_IDS) {
      const def = EVENT_CATALOGUE[id]
      expect(DESK_IDS, id).toContain(def.desk)
      expect(NEWS_KINDS, id).toContain(def.kind)
      expect(PROMINENCE_IDS, id).toContain(def.prominence)
      expect(def.dispatches.length, `${id} has no base copy`).toBeGreaterThan(0)
    }
  })

  it('gives every dispatch a headline and a body', () => {
    for (const id of EVENT_IDS) {
      const def = EVENT_CATALOGUE[id]
      const all = [...def.dispatches, ...Object.values(def.byEra ?? {}).flat()]
      for (const copy of all) {
        expect(copy.headline.trim().length, `${id} headline`).toBeGreaterThan(8)
        // A standfirst is two sentences of what a reader was told. A one-word
        // body renders as an empty column under a headline, which reads as a
        // broken page rather than as a short story.
        expect(copy.body.trim().length, `${id} body`).toBeGreaterThan(40)
      }
    }
  })

  it('never prints a figure', () => {
    // The wire is MADE from true state, so a dispatch quoting a number off
    // that state would be a free, un-lagged, un-revised instrument beside the
    // ones the player had to fund (ADR-0003). Qualitative prose is the
    // boundary, and this is what holds it.
    for (const id of EVENT_IDS) {
      const def = EVENT_CATALOGUE[id]
      for (const copy of [...def.dispatches, ...Object.values(def.byEra ?? {}).flat()]) {
        expect(copy.headline, `${id} headline carries a figure`).not.toMatch(/\d/)
        expect(copy.body, `${id} body carries a figure`).not.toMatch(/\d/)
      }
    }
  })

  it('resolves copy for every event in every era', () => {
    for (const id of EVENT_IDS) {
      for (const era of PRESS_ERA_IDS) {
        expect(dispatchesFor(EVENT_CATALOGUE[id], era).length, `${id} in ${era}`).toBeGreaterThan(0)
      }
    }
  })

  it('narrows an unknown id', () => {
    expect(isEventId('drought_onset')).toBe(true)
    expect(isEventId('an_event_that_never_was')).toBe(false)
  })
})

describe('era resolution inherits forward, never backward', () => {
  const def = {
    kind: 'rumor' as const,
    desk: 'home' as const,
    tone: 'neutral' as const,
    prominence: 'brief' as const,
    dispatches: [{ headline: 'base headline', body: 'x'.repeat(50) }],
    byEra: { crisis: [{ headline: 'crisis headline', body: 'y'.repeat(50) }] },
  }

  it('uses the base copy before the override era', () => {
    expect(dispatchesFor(def, 'wireless')[0].headline).toBe('base headline')
    expect(dispatchesFor(def, 'boom')[0].headline).toBe('base headline')
  })

  it('uses the override from that era onward', () => {
    // The point of walking backwards: giving an event a nineteen-seventies
    // voice must not oblige anyone to write it again for the four eras after,
    // and must not leave those eras speaking in 1946's voice either.
    for (const era of ['crisis', 'market', 'network', 'stream'] as PressEraId[]) {
      expect(dispatchesFor(def, era)[0].headline, era).toBe('crisis headline')
    }
  })
})

describe('the eras themselves', () => {
  it('run in order and start at the first year of the game', () => {
    expect(PRESS_ERAS[0].fromYear).toBe(1946)
    for (let i = 1; i < PRESS_ERAS.length; i++) {
      expect(PRESS_ERAS[i].fromYear).toBeGreaterThan(PRESS_ERAS[i - 1].fromYear)
    }
  })

  it('clamps below the first era rather than returning nothing', () => {
    // A save from before this table existed, or a tick somehow before 1946,
    // still has to print something.
    expect(eraAtYear(1900)).toBe(PRESS_ERAS[0].id)
    expect(eraAtYear(2999)).toBe(PRESS_ERAS[PRESS_ERAS.length - 1].id)
  })
})

describe('the masthead reads the press-freedom stock', () => {
  it('files under the state wire when the press is captured, and not otherwise', () => {
    for (const era of PRESS_ERA_IDS) {
      for (const desk of DESK_IDS) {
        const captured = outletFor(era, desk, PRESS_CAPTURED_AT - 0.01, 0.5)
        const free = outletFor(era, desk, PRESS_CAPTURED_AT + 0.01, 0.5)
        expect(captured, `${era}/${desk}`).not.toBe(free)
      }
    }
  })

  it('never runs off the end of a roster', () => {
    // `Math.floor(roll * n)` is n when roll is exactly 1, which no rng
    // returns and every future refactor might.
    for (const era of PRESS_ERA_IDS) {
      for (const desk of DESK_IDS) {
        for (const roll of [0, 0.5, 0.999999, 1]) {
          expect(typeof outletFor(era, desk, 0.9, roll)).toBe('string')
          expect(outletFor(era, desk, 0.9, roll).length).toBeGreaterThan(0)
        }
      }
    }
  })
})

describe('the desk rate-limits itself', () => {
  it('doubles a repeated event’s cooldown and then stops', () => {
    // The fix for the failure a FLAT cooldown still has: a permanently true
    // condition re-files the instant it expires, and the paper prints the
    // same sentence every fourteen quarters for eighty years.
    expect(cooldownFor(14, 1)).toBe(14)
    expect(cooldownFor(14, 2)).toBe(28)
    expect(cooldownFor(14, 3)).toBe(56)
    expect(cooldownFor(14, 99)).toBe(NEWS_COOLDOWN_MAX_Q)
  })

  it('leaves an unfiled event uncooled', () => {
    expect(cooldownFor(14, 0)).toBe(14)
  })
})

describe('the condition rules', () => {
  it('name events that exist, and only report/milestone/colour', () => {
    for (const rule of CONDITION_RULES) {
      expect(EVENT_IDS, rule.event).toContain(rule.event)
      expect(['report', 'milestone', 'colour']).toContain(rule.cls)
    }
  })

  it('has at most one rule per event', () => {
    // Two rules for one id would race: whichever sorted higher would file and
    // the other would silently never fire, which reads in the measurement
    // tool as dead copy for an event that is actually over-subscribed.
    const seen = new Set<EventId>()
    for (const rule of CONDITION_RULES) {
      expect(seen.has(rule.event), `${rule.event} has two rules`).toBe(false)
      seen.add(rule.event)
    }
  })

  it('gates every colour piece on an era', () => {
    // Colour is the century's texture. An ungated one would run in 1947 and
    // in 2043, which is the failure the eras exist to fix.
    for (const rule of CONDITION_RULES) {
      if (rule.cls !== 'colour') continue
      expect(rule.eras, rule.event).toBeDefined()
      expect(rule.eras?.length, rule.event).toBeGreaterThan(0)
    }
  })

  it('offers colour in every era', () => {
    for (const era of PRESS_ERA_IDS) {
      const available = CONDITION_RULES.filter(
        (r) => r.cls === 'colour' && r.eras?.includes(era),
      )
      expect(available.length, `nothing to print in ${era}`).toBeGreaterThan(2)
    }
  })
})

describe('medianAge', () => {
  it('interpolates inside the band the median falls in', () => {
    // Two equal bands: the median sits exactly on the boundary.
    expect(medianAge([1, 1])).toBeCloseTo(5, 6)
    // One band: halfway through it.
    expect(medianAge([1])).toBeCloseTo(2.5, 6)
  })

  it('returns zero for a country with nobody in it', () => {
    expect(medianAge([0, 0, 0])).toBe(0)
  })
})

describe('the report budget', () => {
  // NEWS_REPORTS_PER_QTR is 2; these use a literal 2 so the arithmetic stays
  // readable if the constant is retuned.
  it('spends the whole page when nothing has been filed', () => {
    expect(reportBudget(2, 0, 0, false)).toBe(2)
  })

  it('charges a milestone exactly once', () => {
    // The regression. The first version subtracted milestones here AND then
    // compared the running total (milestones included) against the result, so
    // one milestone in an empty quarter left a slot free and then refused to
    // spend it — a one-story front page that reads exactly like a quiet
    // quarter. Invisible at century scale: milestones fire about once a run.
    expect(reportBudget(2, 0, 1, false)).toBe(1)
    expect(reportBudget(2, 0, 2, false)).toBe(0)
  })

  it('counts what the quarter already carried, which is the crowding-out rule', () => {
    expect(reportBudget(2, 1, 0, false)).toBe(1)
    expect(reportBudget(2, 2, 0, false)).toBe(0)
  })

  it('holds a slot for a political lead that has not been filed yet', () => {
    // `politics` runs after `statistics`, so an election is not in the
    // quarter's tally when the desk sits down.
    expect(reportBudget(2, 0, 0, true)).toBe(1)
    expect(reportBudget(2, 1, 0, true)).toBe(0)
  })

  it('never goes negative', () => {
    expect(reportBudget(2, 5, 3, true)).toBe(0)
  })
})
