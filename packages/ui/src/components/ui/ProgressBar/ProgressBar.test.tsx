import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('exposes its value to assistive technology', () => {
    const html = renderToStaticMarkup(<ProgressBar label="Tax administration" value={0.42} />)
    expect(html).toContain('aria-valuenow="42"')
  })

  it('clamps values to the visible range', () => {
    expect(renderToStaticMarkup(<ProgressBar label="Capacity" value={2} />)).toContain('width:100%')
  })
})
