import { describe, expect, it } from 'vitest'
import { INDICATOR_IDS } from '@terrarium/observation'
import { complementReading, NAMES } from '../../packages/ui/src/components/labels'

describe('indicator labels', () => {
  it('keeps every rack mnemonic within its physical ten-character budget', () => {
    for (const id of INDICATOR_IDS) expect(NAMES[id].short.length, id).toBeLessThanOrEqual(10)
  })

  it('derives complementary account shares from the same reading', () => {
    expect(complementReading('household_saving_rate', 12.5)).toBe('SPEND 87.5')
    expect(complementReading('government_demand_share', 8.25, 2)).toBe('PRIVATE 91.75')
    expect(complementReading('gdp_per_capita', 12.5)).toBeNull()
  })
})
