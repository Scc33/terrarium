import { describe, expect, it } from 'vitest'
import { INDICATOR_IDS } from '@terrarium/engine'
import { INDICATOR_SPECS } from '../../packages/engine/src/pipeline/statistics'

describe('the indicator measurement catalogue', () => {
  it('has exactly one measurement specification for every indicator id', () => {
    const measured = INDICATOR_SPECS.map((spec) => spec.id)
    expect(new Set(measured).size, 'duplicate INDICATOR_SPECS entry').toBe(measured.length)
    expect([...measured].sort()).toEqual([...INDICATOR_IDS].sort())
  })
})
