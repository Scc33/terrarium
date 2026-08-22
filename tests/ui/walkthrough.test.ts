/**
 * The opening walkthrough.
 *
 * Two invariants matter and only one of them is obvious.
 *
 * The obvious one is that the tour ends: `stepAt` past the last card must
 * return null, because the component reads null as "close", and an index that
 * ran off the end would drop the player onto a blank card mid-sentence.
 *
 * The other is that a card never covers the region it is describing. That is
 * the classic way a guided tour ships broken, it is invisible in jsdom (no
 * layout engine), and it is invisible in review (the placement and the target
 * are two fields several lines apart). So it is pinned here: a card about the
 * cabinet — which is the right rail — must sit on the left, and vice versa.
 */

import { describe, expect, it } from 'vitest'
import {
  WALKTHROUGH_STEPS,
  isLastStep,
  placeSide,
  stepAt,
  targetSide,
} from '../../packages/ui/src/walkthrough'

describe('the tour', () => {
  it('is short enough to be read rather than dismissed', () => {
    expect(WALKTHROUGH_STEPS.length).toBeGreaterThanOrEqual(4)
    expect(WALKTHROUGH_STEPS.length).toBeLessThanOrEqual(6)
  })

  it('gives every card a unique id, a title and something to say', () => {
    const ids = WALKTHROUGH_STEPS.map((step) => step.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const step of WALKTHROUGH_STEPS) {
      expect(step.title, step.id).not.toBe('')
      expect(step.body.length, step.id).toBeGreaterThan(0)
      for (const paragraph of step.body) expect(paragraph.length, step.id).toBeGreaterThan(40)
    }
  })

  it('never puts a card on top of the thing it is pointing at', () => {
    for (const step of WALKTHROUGH_STEPS) {
      if (!step.target) continue
      const region = targetSide(step.target)
      if (region === 'full') continue
      expect(placeSide(step.place), `${step.id} → ${step.target}`).not.toBe(region)
    }
  })

  it('ends, rather than running off the end into a blank card', () => {
    expect(stepAt(0)).toBe(WALKTHROUGH_STEPS[0])
    expect(stepAt(WALKTHROUGH_STEPS.length - 1)).toBe(
      WALKTHROUGH_STEPS[WALKTHROUGH_STEPS.length - 1],
    )
    expect(stepAt(WALKTHROUGH_STEPS.length)).toBeNull()
    expect(stepAt(-1)).toBeNull()
    expect(isLastStep(WALKTHROUGH_STEPS.length - 1)).toBe(true)
    expect(isLastStep(WALKTHROUGH_STEPS.length - 2)).toBe(false)
  })

  it('finishes by handing the player the handbook', () => {
    // the tour explains where things are; the manual explains what they do.
    // If the last card does not say so, the tour is the whole documentation.
    const last = WALKTHROUGH_STEPS[WALKTHROUGH_STEPS.length - 1]
    expect(last.body.join(' ').toUpperCase()).toContain('HANDBOOK')
  })

  it('rings a region on every card that is about one', () => {
    const targeted = WALKTHROUGH_STEPS.filter((step) => step.target !== null)
    // a tour of the war room that highlights nothing is a wall of text
    expect(targeted.length).toBeGreaterThanOrEqual(WALKTHROUGH_STEPS.length - 1)
  })
})

describe('remembering that a player has been briefed', () => {
  it('survives a browser that refuses storage', async () => {
    // private browsing throws on both read and write. The tour must offer
    // itself rather than vanish: a repeated introduction is a nuisance, a
    // missing one is the bug this feature fixes.
    const store = globalThis.localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('denied')
      },
    })
    const { hasBeenBriefed, markBriefed, forgetBriefing } = await import(
      '../../packages/ui/src/walkthrough'
    )
    expect(hasBeenBriefed()).toBe(false)
    expect(() => markBriefed()).not.toThrow()
    expect(() => forgetBriefing()).not.toThrow()
    if (store) Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: store })
    else delete (globalThis as { localStorage?: Storage }).localStorage
  })
})
