import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Panel } from './Panel'

describe('Panel', () => {
  it('renders semantic sections with an optional heading band', () => {
    const html = renderToStaticMarkup(<Panel title="OUTPUT">Body</Panel>)
    expect(html).toMatch(/^<section/)
    expect(html).toContain('OUTPUT')
  })

  it('switches visual registers without changing its structure', () => {
    const html = renderToStaticMarkup(<Panel tone="terminal">Signal</Panel>)
    expect(html).toContain('bg-terminal-bg')
    expect(html).toContain('Signal')
  })
})
