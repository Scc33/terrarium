import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ChartFrame } from './ChartFrame'

describe('ChartFrame', () => {
  it('keeps title, legend, plot, and accessible summary in one figure', () => {
    const html = renderToStaticMarkup(
      <ChartFrame title="OUTPUT" detail="INDEX" summary="Output rose from 100 to 112." legend={[{ label: 'OUTPUT', color: '#123456' }]}>
        <svg />
      </ChartFrame>,
    )
    expect(html).toContain('<figure')
    expect(html).toContain('Chart legend')
    expect(html).toContain('aria-label="Output rose from 100 to 112."')
  })
})
