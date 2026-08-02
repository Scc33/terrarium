import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DisclosureSection } from './DisclosureSection'

describe('DisclosureSection', () => {
  it('announces and renders its expanded state', () => {
    const html = renderToStaticMarkup(<DisclosureSection title="TAXATION" open onToggle={() => {}}>Controls</DisclosureSection>)
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('Controls')
  })

  it('hides children when collapsed while retaining the heading', () => {
    const html = renderToStaticMarkup(<DisclosureSection title="SUBSIDIES" open={false} onToggle={() => {}}>Controls</DisclosureSection>)
    expect(html).toContain('SUBSIDIES')
    expect(html).not.toContain('Controls')
  })
})
