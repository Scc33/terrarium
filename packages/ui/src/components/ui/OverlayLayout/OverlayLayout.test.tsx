import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { OverlayLayout } from './OverlayLayout'

describe('OverlayLayout', () => {
  it('gives every overlay region a stable accessible name', () => {
    const html = renderToStaticMarkup(
      <OverlayLayout summary="Headline" toolbar="Tabs" note="How to read it" footer="Source note">Chart</OverlayLayout>,
    )
    for (const region of ['Summary', 'View controls', 'Charts and records', 'Reading note']) {
      expect(html).toContain(`aria-label="${region}"`)
    }
    expect(html).toContain('<footer')
  })
})
