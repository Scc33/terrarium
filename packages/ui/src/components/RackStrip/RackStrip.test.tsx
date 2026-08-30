import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { IndicatorSeries } from '@terrarium/observation'
import { accessForInstrument } from '../../maturity'
import { RackStrip } from './RackStrip'

describe('RackStrip', () => {
  it('announces pin state', () => {
    const html = renderToStaticMarkup(<RackStrip indicator="inflation" access={accessForInstrument('inflation', 0.04, false)} now={0} pinned slot={2} onPin={() => {}} />)
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('02')
  })

  it('names the capability needed for an unfitted instrument', () => {
    const html = renderToStaticMarkup(<RackStrip indicator="unemployment" access={accessForInstrument('unemployment', 0.18, false)} now={0} pinned={false} onPin={() => {}} />)
    expect(html).toContain('LABOUR FORCE SURVEY')
    expect(html).toContain('35')
  })

  it('labels a commissioned instrument as waiting rather than unfunded', () => {
    const html = renderToStaticMarkup(<RackStrip indicator="inflation" access={accessForInstrument('inflation', 0.18, false)} now={0} pinned={false} onPin={() => {}} />)
    expect(html).toContain('PENDING')
    expect(html).not.toContain('SURVEY REQUIRED')
  })

  it('keeps the hidden desktop delta in the tooltip and accessible name', () => {
    const series: IndicatorSeries = {
      id: 'inflation',
      label: 'Inflation',
      unit: '%',
      points: [
        { forQtr: 0, publishedAt: 1, value: 2, revision: 0, errorBand: 0 },
        { forQtr: 1, publishedAt: 2, value: 2.5, revision: 0, errorBand: 0 },
      ],
    }
    const html = renderToStaticMarkup(
      <RackStrip
        indicator="inflation"
        access={accessForInstrument('inflation', 0.6, false)}
        series={series}
        now={2}
        pinned={false}
        onPin={() => {}}
      />,
    )

    expect(html).toContain('Change since the previous quarter: up 0.5')
  })
})
