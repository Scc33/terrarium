import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { IndicatorSeries } from '@terrarium/observation'
import { AnalogGauge } from './AnalogGauge'

const series: IndicatorSeries = {
  id: 'inflation', label: 'Inflation', unit: '%',
  points: [
    { forQtr: 0, publishedAt: 1, value: 2, revision: 0, errorBand: 0.5 },
    { forQtr: 1, publishedAt: 2, value: 3, revision: 0, errorBand: 0.4 },
  ],
}

describe('AnalogGauge', () => {
  it('prints the latest dossier value', () => {
    expect(renderToStaticMarkup(<AnalogGauge indicator="inflation" series={series} now={2} />)).toContain('3.0')
  })

  it('draws its fixed analog face', () => {
    const html = renderToStaticMarkup(<AnalogGauge indicator="inflation" series={series} now={2} />)
    expect(html).toContain('<svg')
    expect(html).toContain('var(--color-dossier-brass)')
  })
})
