import { describe, expect, it } from 'vitest'
import { init, step } from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'
import { observe } from '@terrarium/observation'
import { readDebtSchedule, readYieldCurve } from '../../packages/ui/src/yieldCurve'
import { formatPolicyValue } from '../../packages/ui/src/policyRecord'

describe('the public curve and debt schedule', () => {
  it('shows opening quotes without inventing a previous quarter', () => {
    const pub = observe(init(standardCountry, 'curve-ui'))
    const curve = readYieldCurve(pub)
    expect(curve.current).toHaveLength(4)
    expect(curve.previous).toEqual([])
    expect(curve.quotes.every(quote => quote.change === null)).toBe(true)
    const schedule = readDebtSchedule(pub)
    expect(schedule.coupon).toBeCloseTo(0.04, 12)
    expect(schedule.buckets.reduce((sum, bucket) => sum + bucket.principal, 0)).toBeCloseTo(pub.treasury.debt, 12)
  })

  it('compares the prior completed quote and buckets each principal exactly once', () => {
    const pub = observe(step(step(init(standardCountry, 'curve-ui'))))
    expect(readYieldCurve(pub).previous).toHaveLength(4)
    const schedule = readDebtSchedule(pub)
    expect(schedule.buckets.reduce((sum, bucket) => sum + bucket.principal, 0)).toBeCloseTo(pub.treasury.debt, 12)
    expect(schedule.buckets[0].principal).toBeGreaterThan(0)
    expect(readDebtSchedule({ ...pub, treasury: { ...pub.treasury, bonds: [], debt: 0 } }).coupon).toBeNull()
    for (const [value, name] of [[0, 'SHORT'], [50, 'BALANCED'], [100, 'LONG'], [25, 'MIXED']] as const) {
      expect(formatPolicyValue({ key: 'debtMaturity', unit: 'maturity' }, value)).toBe(name)
    }
  })
})
