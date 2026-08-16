import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DonutChart } from './DonutChart'

const shares = [{ key: 'tax', value: 40, label: 'Tax', ink: '#000', note: 'Collected tax' }]

describe('DonutChart', () => {
  it('renders keyed values, totals, and slice descriptions', () => {
    const html = renderToStaticMarkup(<DonutChart shares={shares} format={(v) => v.toFixed(0)} />)
    expect(html).toContain('Tax')
    // The wedge's own reading moved from a native `<title>` onto the shared
    // Tooltip, which renders on interaction rather than into static markup.
    // Nothing was lost to assistive tech: the svg is `role="img"`, so its
    // children were never exposed in the first place, and the accessible name
    // still enumerates every slice.
    expect(html).toContain('Tax 100.0 percent')
    expect(html).toContain('data-tooltip-trigger')
    expect(html).not.toContain('<title>')
  })

  it('renders a useful empty state', () => {
    expect(renderToStaticMarkup(<DonutChart shares={[]} format={String} emptyNote="NOTHING VOTED" />)).toContain('NOTHING VOTED')
  })
})
