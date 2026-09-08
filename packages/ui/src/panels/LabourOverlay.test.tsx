import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  LABOUR_CLASS_IDS,
  type LabourClassId,
  type PublishedState,
} from '@terrarium/observation'
import { LabourOverlay } from './LabourOverlay'

const vec = (values: readonly number[]): Record<LabourClassId, number> =>
  LABOUR_CLASS_IDS.reduce<Record<LabourClassId, number>>(
    (out, id, index) => ({ ...out, [id]: values[index] }),
    {} as Record<LabourClassId, number>,
  )

function pubWith(
  labour: PublishedState['labour'],
  statistical: number,
  fullInstrumentation = false,
): PublishedState {
  return {
    tick: 12,
    labour,
    capacity: { statistical },
    rules: { fullInstrumentation },
    indicators: {
      unemployment: {
        id: 'unemployment', label: 'Unemployment', unit: '%',
        points: [{ forQtr: 8, publishedAt: 9, revision: 0, value: 12.4, errorBand: 1 }],
      },
      labour_underuse: {
        id: 'labour_underuse', label: 'Labour underuse', unit: '%',
        points: [{ forQtr: 8, publishedAt: 9, revision: 0, value: 17.8, errorBand: 1 }],
      },
    },
  } as unknown as PublishedState
}

const release = (forQtr: number): PublishedState['labour'][number] => ({
  forQtr,
  publishedAt: forQtr + 1,
  revision: 0,
  errorBand: { jobless: 0.025, underemployed: 0.035 },
  jobless: vec([0.03, 0.21, 0.08]),
  underemployed: vec([0, 0.04, 0.09]),
})

describe('LabourOverlay', () => {
  it('keeps an unfunded survey absent rather than calling it zero mismatch', () => {
    const html = renderToStaticMarkup(<LabourOverlay pub={pubWith([], 0.2)} onClose={() => {}} />)
    expect(html).toContain('OCCUPATIONAL SURVEY')
    expect(html).toContain('20')
    expect(html).toContain('45')
    expect(html).not.toContain('LATEST RETURN')
  })

  it('does not ask for funding while the commissioned first return is pending', () => {
    for (const pub of [pubWith([], 0.45), pubWith([], 0, true)]) {
      const html = renderToStaticMarkup(<LabourOverlay pub={pub} onClose={() => {}} />)
      expect(html).toContain('THE OCCUPATIONAL RETURNS ARE BEING COMPILED')
      expect(html).not.toContain('REQUIRES')
      expect(html).not.toContain('Raise the statistics office')
    }
  })

  it('shows both headlines and both fogged class tables', () => {
    const html = renderToStaticMarkup(
      <LabourOverlay pub={pubWith([release(4), release(8)], 0.7)} onClose={() => {}} />,
    )
    expect(html).toContain('17.8%')
    expect(html).toContain('12.4%')
    expect(html).toContain('LATEST RETURN')
    for (const label of ['Rural workers', 'Urban workers', 'Professionals']) {
      expect(html).toContain(label)
    }
    expect(html).toContain('21.0%')
    expect(html).toContain('9.0%')
    expect(html).toContain('±2.5 pts')
    expect(html).toContain('±3.5 pts')
    expect(html).toContain('4 QUARTERS AGO')
  })
})
