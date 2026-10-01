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

  it('says in words when the reading has left the dial, and which way', () => {
    const calm = renderToStaticMarkup(<AnalogGauge indicator="inflation" series={series} now={2} />)
    expect(calm).not.toContain('OFF SCALE')

    const runaway: IndicatorSeries = {
      ...series,
      points: [{ forQtr: 1, publishedAt: 2, value: 400, revision: 0, errorBand: 1 }],
    }
    const high = renderToStaticMarkup(<AnalogGauge indicator="inflation" series={runaway} now={2} />)
    expect(high).toContain('OFF SCALE ▸')
    expect(high).toContain('off the scale high')

    const slump: IndicatorSeries = {
      ...series,
      points: [{ forQtr: 1, publishedAt: 2, value: -400, revision: 0, errorBand: 1 }],
    }
    expect(renderToStaticMarkup(<AnalogGauge indicator="inflation" series={slump} now={2} />)).toContain('◂ OFF SCALE')
  })

  it('heads the card with the name and prints the unit on the face', () => {
    const html = renderToStaticMarkup(<AnalogGauge indicator="investment_share" series={{ ...series, id: 'investment_share' }} now={2} />)
    expect(html).toContain('CAPITAL FORMATION')
    expect(html).not.toContain('CAPITAL FORMATION · ')
    expect(html).toContain('% FINAL EXPENDITURE</text>')
  })
})
