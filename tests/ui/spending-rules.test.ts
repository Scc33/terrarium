import { describe, expect, it } from 'vitest'
import { init, type StatPrint, type TrueState } from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'
import { observe } from '@terrarium/observation'
import {
  equivalentRuleValue,
  latestOfficialNominalGdp,
  proposedSpending,
} from '../../packages/ui/src/spendingRules'

const point = (forQtr: number, revision: number, nominal: number): StatPrint => ({
  forQtr,
  publishedAt: forQtr + revision + 1,
  value: 0,
  revision,
  errorBand: 0,
  levels: { real: nominal * 0.9, nominal },
})

function published(points: StatPrint[] = []) {
  const state = init(standardCountry, 'ui-spending-rules')
  const withPrints: TrueState = {
    ...state,
    stats: { ...state.stats, series: { ...state.stats.series, gdp_growth: points } },
  }
  return observe(withPrints)
}

describe('spending-rule cabinet arithmetic', () => {
  it('selects the newest official reference quarter and its latest revision', () => {
    const pub = published([point(3, 0, 40), point(4, 0, 50), point(4, 1, 55)])
    expect(latestOfficialNominalGdp(pub)).toEqual({ value: 55, forQtr: 4 })
  })

  it('switches modes without changing current spending', () => {
    const pub = published([point(4, 0, 50)])
    const amount = pub.dials.spending.transfers
    expect(equivalentRuleValue(pub, 'transfers', 'fixed')).toBe(amount)
    expect(equivalentRuleValue(pub, 'transfers', 'indexed')).toBe(amount)
    expect(equivalentRuleValue(pub, 'transfers', 'gdpShare')).toBeCloseTo(amount / 50)
    expect(proposedSpending(pub, 'gdpShare', amount / 50)).toBeCloseTo(amount)
  })

  it('declines a GDP-share conversion when no official accounts exist', () => {
    const pub = published()
    expect(latestOfficialNominalGdp(pub)).toBeNull()
    expect(equivalentRuleValue(pub, 'transfers', 'gdpShare')).toBeNull()
    expect(proposedSpending(pub, 'gdpShare', 0.1)).toBeNull()
  })
})
