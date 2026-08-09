import { describe, expect, it } from 'vitest'
import type { OutlaySplit } from '@terrarium/observation'
import {
  OUTLAY_CHART_IDS,
  outlayChartValues,
} from '../../packages/ui/src/budgetChart'

const outlays: OutlaySplit = {
  transfers: 4,
  procurement: 3,
  investment: 2,
  research: 1.5,
  subsidies: 1,
  capacity: 0.5,
  interest: 2.5,
}

describe('the seven-line treasury remains a readable six-band chart', () => {
  it('buckets research and ministry construction without losing money', () => {
    const chart = outlayChartValues(outlays)
    expect(OUTLAY_CHART_IDS).toHaveLength(6)
    expect(Object.keys(chart)).toEqual([...OUTLAY_CHART_IDS])
    expect(chart.state_building).toBe(outlays.research + outlays.capacity)
    expect(Object.values(chart).reduce((sum, value) => sum + value, 0)).toBe(
      Object.values(outlays).reduce((sum, value) => sum + value, 0),
    )
  })
})
