import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { StackedAreaChart } from './StackedAreaChart'

const keys = [{ key: 'tax', value: 10, label: 'Tax', ink: '#000', note: 'Tax' }]

describe('StackedAreaChart', () => {
  it('renders a band for multi-quarter data', () => {
    const html = renderToStaticMarkup(<StackedAreaChart keys={keys} rows={[{ tick: 0, values: { tax: 1 } }, { tick: 1, values: { tax: 2 } }]} mode="money" />)
    expect(html).toContain('<path')
    expect(html).toContain('1946')
  })

  it('explains when history is too short', () => {
    expect(renderToStaticMarkup(<StackedAreaChart keys={keys} rows={[]} mode="share" />)).toContain('THE RECORD IS ONE QUARTER OLD')
  })
})
