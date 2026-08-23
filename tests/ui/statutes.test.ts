/**
 * The statute book's copy tables (`ui/src/statutes.ts`) and the cabinet drawer
 * that reads them.
 *
 * The compiler already guarantees that `STATUTE_COPY` is total over
 * `STATUTE_IDS`, so a statute cannot reach the cabinet unnamed. What it cannot
 * check is the thing that actually goes wrong: that the words say the right
 * thing about a register whose whole point is easy to lose. A statute that is
 * described like a dial — instant, symmetric, and doing what it says — is a
 * statute the player will misuse for a decade before finding out.
 *
 * The drawer's own assembly is pinned here too, because `LeverGroupId` is
 * defined by SUBTRACTION from `CABINET_GROUPS`: the statute book is a lever
 * drawer unless something excludes it, and if that exclusion is ever lost the
 * cabinet will try to render sliders for it and find no dials.
 */

import { describe, expect, it } from 'vitest'
import { STATUTE_IDS, STATUTE_LEVELS } from '@terrarium/engine'
import { CABINET_GROUPS, cabinetTabId } from '../../packages/ui/src/cabinetNavigation'
import { LEVER_GROUPS } from '../../packages/ui/src/levers'
import { complianceNote, STATUTE_COPY, STATUTE_DRAWER } from '../../packages/ui/src/statutes'

describe('every statute has words before it has a lever', () => {
  it('names, explains, and attributes each one', () => {
    for (const id of STATUTE_IDS) {
      const copy = STATUTE_COPY[id]
      for (const [field, text] of Object.entries(copy)) {
        expect(text.trim().length, `${id}.${field}`).toBeGreaterThan(0)
      }
      // the effect line is the one that has to carry a mechanism, so it is
      // the one worth insisting is more than a label
      expect(copy.effect.length, `${id}.effect`).toBeGreaterThan(60)
    }
  })

  it('does not rename the rungs the engine already named', () => {
    // A rung's name and the strength it carries are one fact. If this file
    // ever grows its own ladder, the two can disagree and the cabinet will
    // quote a price for a rung the engine does not have.
    const copyText = Object.values(STATUTE_COPY)
      .flatMap((copy) => Object.values(copy))
      .join(' ')
    for (const id of STATUTE_IDS) {
      for (const rung of STATUTE_LEVELS[id]) {
        expect(copyText).not.toContain(rung.name)
      }
    }
  })
})

describe('the statute book is its own drawer, not a lever drawer', () => {
  it('is a cabinet group with a tab of its own', () => {
    expect(CABINET_GROUPS).toContain('STATUTES')
    expect(cabinetTabId('STATUTES')).toBe('cabinet-tab-statutes')
  })

  it('is excluded from the lever drawers, which are defined by subtraction', () => {
    // If this fails, `LeverGroupId` has stopped excluding the statute book and
    // the rail will look for dials that do not exist.
    expect(LEVER_GROUPS.map((group) => group.group)).not.toContain('STATUTES')
  })

  it('carries the brief and the question every drawer prints', () => {
    expect(STATUTE_DRAWER.tab.length).toBeGreaterThan(0)
    expect(STATUTE_DRAWER.question.endsWith('?')).toBe(true)
    // the three things that make a statute not a dial have to be in the brief,
    // because it is the only text a player reads before their first enactment
    expect(STATUTE_DRAWER.brief).toMatch(/two years|arrive/i)
    expect(STATUTE_DRAWER.brief).toMatch(/repeal/i)
    expect(STATUTE_DRAWER.brief).toMatch(/enforce/i)
  })
})

describe('compliance reads as a judgement, not a measurement', () => {
  it('never prints a false precision', () => {
    for (let c = 0; c <= 1.0001; c += 0.05) {
      expect(complianceNote(Math.min(c, 1))).not.toMatch(/\d/)
    }
  })

  it('is monotone: more enforcement never reads worse', () => {
    const rank = ['A dead letter', 'Widely evaded', 'Largely enforced', 'Enforced']
    let last = -1
    for (let c = 0; c <= 1.0001; c += 0.01) {
      const index = rank.indexOf(complianceNote(Math.min(c, 1)))
      expect(index, `no band for ${c}`).toBeGreaterThanOrEqual(0)
      expect(index).toBeGreaterThanOrEqual(last)
      last = index
    }
  })

  it('calls an unenforceable law what it is', () => {
    expect(complianceNote(0.05)).toBe('A dead letter')
    expect(complianceNote(0.95)).toBe('Enforced')
  })
})
