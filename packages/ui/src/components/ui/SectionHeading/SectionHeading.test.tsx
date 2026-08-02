import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SectionHeading } from './SectionHeading'

describe('SectionHeading', () => {
  it('uses a real heading for navigation', () => {
    expect(renderToStaticMarkup(<SectionHeading>SPENDING</SectionHeading>)).toContain('<h2')
  })

  it('renders supplemental context separately', () => {
    const html = renderToStaticMarkup(<SectionHeading aside="4 CONTROLS">TAXATION</SectionHeading>)
    expect(html).toContain('4 CONTROLS')
  })
})
