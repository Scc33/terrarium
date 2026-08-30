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

  it('shows the three human-development components instead of hiding them in one number', () => {
    const development: IndicatorSeries = {
      id: 'human_development', label: 'Human development', unit: 'index 0–1',
      points: [
        {
          forQtr: 1,
          publishedAt: 2,
          value: 0.54321,
          revision: 0,
          errorBand: 0.02,
          components: { health: 0.45, skills: 0.55, income: 0.65 },
        },
      ],
    }
    const html = renderToStaticMarkup(
      <AnalogGauge indicator="human_development" series={development} now={2} />,
    )

    expect(html).toContain('0.543')
    for (const label of ['HEALTH', 'SKILLS', 'INCOME']) expect(html).toContain(label)
  })
})
