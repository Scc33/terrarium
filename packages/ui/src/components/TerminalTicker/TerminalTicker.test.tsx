import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { IndicatorSeries } from '@terrarium/observation'
import { TerminalTicker } from './TerminalTicker'

const series: IndicatorSeries = {
  id: 'inflation', label: 'Inflation', unit: '%',
  points: [
    { forQtr: 0, publishedAt: 0, value: 2, revision: 0, errorBand: 0.2 },
    { forQtr: 1, publishedAt: 1, value: 2.5, revision: 2, errorBand: 0.1 },
  ],
}

describe('TerminalTicker', () => {
  it('renders the current terminal readout', () => {
    expect(renderToStaticMarkup(<TerminalTicker indicator="inflation" series={series} now={1} />)).toContain('2.50')
  })

  it('exposes raw-history and rolling-average chart views', () => {
    const html = renderToStaticMarkup(<TerminalTicker indicator="inflation" series={series} now={1} />)

    expect(html).toContain('40Q')
    expect(html).toContain('R3M, R6M and R12M')
    expect(html).toContain('The readout below remains the latest raw published figure')
  })
})
