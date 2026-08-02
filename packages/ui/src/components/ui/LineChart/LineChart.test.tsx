import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LineChart } from './LineChart'

describe('LineChart', () => {
  it('renders a named exact series with its latest value', () => {
    const html = renderToStaticMarkup(<LineChart label="BALANCE" data={[{ tick: 0, value: 2 }, { tick: 1, value: 4 }]} />)
    expect(html).toContain('BALANCE')
    expect(html).toContain('4.0')
    expect(html).toContain('<path')
  })

  it('uses a caller-owned empty state', () => {
    expect(renderToStaticMarkup(<LineChart data={[]} emptyLabel="NO RETURNS" />)).toContain('NO RETURNS')
  })
})
