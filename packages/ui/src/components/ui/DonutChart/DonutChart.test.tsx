import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DonutChart } from './DonutChart'

const shares = [{ key: 'tax', value: 40, label: 'Tax', ink: '#000', note: 'Collected tax' }]

describe('DonutChart', () => {
  it('renders keyed values, totals, and slice descriptions', () => {
    const html = renderToStaticMarkup(<DonutChart shares={shares} format={(v) => v.toFixed(0)} />)
    expect(html).toContain('Tax')
    expect(html).toContain('Tax: 40 (100.0%)')
  })

  it('renders a useful empty state', () => {
    expect(renderToStaticMarkup(<DonutChart shares={[]} format={String} emptyNote="NOTHING VOTED" />)).toContain('NOTHING VOTED')
  })
})
