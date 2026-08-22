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

  it('preserves nonzero semantic references without borrowing the dial face', () => {
    const priceSeries: IndicatorSeries = {
      id: 'price_fuel',
      label: 'Fuel prices',
      unit: '1946=100',
      points: [
        { forQtr: 8, publishedAt: 8, value: 132, revision: 0, errorBand: 2 },
        { forQtr: 9, publishedAt: 9, value: 140, revision: 0, errorBand: 2 },
      ],
    }
    const frontierSeries: IndicatorSeries = {
      id: 'technology_attainment',
      label: 'Technology attained',
      unit: '% frontier',
      points: [
        { forQtr: 8, publishedAt: 8, value: 82, revision: 0, errorBand: 2 },
        { forQtr: 9, publishedAt: 9, value: 86, revision: 0, errorBand: 2 },
      ],
    }

    const price = renderToStaticMarkup(
      <TerminalTicker indicator="price_fuel" series={priceSeries} now={9} />,
    )
    const frontier = renderToStaticMarkup(
      <TerminalTicker indicator="technology_attainment" series={frontierSeries} now={9} />,
    )

    expect(price).toContain('1946 BASE')
    expect(frontier).toContain('FRONTIER')
    expect(price).not.toContain('DIAL LIMIT')
    expect(frontier).not.toContain('DIAL LIMIT')
  })
})
