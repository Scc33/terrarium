import { describe, expect, it } from 'vitest'
import { GAME_RULE_IDS, STANDARD_RULES } from '@terrarium/engine'
import { activeRuleMarks, capitalReading, RULE_COPY } from '../../packages/ui/src/gameRules'

const rules = (on: Partial<typeof STANDARD_RULES>) => ({ ...STANDARD_RULES, ...on })

describe('the letterhead stamps', () => {
  it('says nothing at all about an ordinary run', () => {
    expect(activeRuleMarks(STANDARD_RULES)).toEqual([])
  })

  it('stamps every active rule, in the rules own order', () => {
    expect(activeRuleMarks(rules({ protectedTenure: true, unlimitedCapital: true }))).toEqual([
      RULE_COPY.protectedTenure.mark,
      RULE_COPY.unlimitedCapital.mark,
    ])
    // reversing the input must not reorder the chrome
    expect(activeRuleMarks(rules({ unlimitedCapital: true, protectedTenure: true }))).toEqual([
      RULE_COPY.protectedTenure.mark,
      RULE_COPY.unlimitedCapital.mark,
    ])
  })

  it('gives every rule words a player can act on', () => {
    for (const id of GAME_RULE_IDS) {
      const copy = RULE_COPY[id]
      expect(copy.off, id).not.toBe(copy.on)
      // the caption has to say what the setting DOES, not repeat its name
      expect(copy.caption.on.length, id).toBeGreaterThan(30)
      expect(copy.caption.off.length, id).toBeGreaterThan(30)
    }
  })
})

describe('the political-capital meter', () => {
  it('counts down an ordinary cabinet, and never past empty', () => {
    const pub = { politicalCapital: 10, rules: STANDARD_RULES }
    expect(capitalReading(pub, null)).toMatchObject({ available: '10.0', after: null, remaining: 1 })
    expect(capitalReading(pub, 4)).toMatchObject({ available: '10.0', after: '6.0', remaining: 0.6 })
    // an unaffordable draft drains the bar rather than drawing it backwards
    expect(capitalReading(pub, 25)).toMatchObject({ after: '0.0', remaining: 0 })
  })

  it('reads an unlimited cabinet as a condition, not a quantity', () => {
    // 37.4 PC on a meter that never falls looks like a cabinet about to run
    // out of it; the bar must not drain either, or a big order reads as a risk
    const pub = { politicalCapital: 37.4, rules: rules({ unlimitedCapital: true }) }
    expect(capitalReading(pub, 900)).toEqual({
      available: '∞',
      detail: 'NOT CHARGED',
      after: '∞',
      remaining: 1,
    })
    expect(capitalReading(pub, null).remaining).toBe(1)
  })
})
