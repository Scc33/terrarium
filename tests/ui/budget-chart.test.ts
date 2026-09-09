import { describe, expect, it } from 'vitest'
import type { OutlaySplit } from '@terrarium/observation'
import {
  OUTLAY_CHART_FACE,
  OUTLAY_FACE,
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

describe('the one band that holds two programmes says which is which', () => {
  // The band is named for two lines and, measured over 400 quarters on all
  // five curated countries, holds one: purely ministries in 99% of the
  // capacity baseline's quarters, and one line or the other in 88% of the
  // quarters the adversarial policy makes it say anything at all (#168). A
  // reader cannot recover the split from the figure, so the note has to name
  // both halves — and it has to keep naming them under their own labels, or
  // renaming a programme leaves the note explaining a line that is no longer
  // called that.
  it('names both halves by the labels the exact lines carry', () => {
    const note = OUTLAY_CHART_FACE.state_building.note.toLowerCase()
    expect(note).toContain(OUTLAY_FACE.research.label.toLowerCase())
    expect(note).toContain(OUTLAY_FACE.capacity.label.toLowerCase())
  })

  // The reading the issue arrived at from the label alone: a line called
  // "Ministries" read as the cost of having a state rather than of building
  // one. Both faces have to refuse it, because the pie shows one and the
  // expenditure accounts next door show the other.
  it('refuses the standing-cost reading on both faces', () => {
    for (const note of [OUTLAY_FACE.capacity.note, OUTLAY_CHART_FACE.state_building.note]) {
      expect(note).toContain('Having a ministry costs nothing; building one does.')
    }
  })
})
