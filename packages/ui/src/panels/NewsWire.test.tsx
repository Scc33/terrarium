import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PublishedState } from '@terrarium/observation'
import { NewsWire } from './NewsWire'

describe('NewsWire', () => {
  it('exposes the wire archive as a real keyboard-operable button', () => {
    const pub = { tick: 0, news: [] } as unknown as PublishedState
    const html = renderToStaticMarkup(<NewsWire pub={pub} onOpen={() => {}} />)
    expect(html).toContain('<button type="button"')
    expect(html).toContain('aria-label="Read every dispatch on the news wire"')
    expect(html).toContain('READ ALL')
  })
})
