import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WallTile } from './WallTile'

describe('WallTile', () => {
  it('uses definite rows for header, body, and footer', () => {
    const html = renderToStaticMarkup(<WallTile header="Head" footer="Foot">Body</WallTile>)
    expect(html).toContain('grid-rows-[auto_minmax(0,1fr)_auto]')
  })

  it('uses a definite column too, so max-content cannot widen the track', () => {
    // jsdom has no layout engine, so this can only assert the class is there —
    // but its absence is what let a three-digit gauge label get sheared off by
    // the tile's own overflow-hidden while the rows were all perfectly correct
    const html = renderToStaticMarkup(<WallTile footer="187.5 ±11.2 ▲4.8 69 Q3 · 2Q LATE">Body</WallTile>)
    expect(html).toContain('grid-cols-[minmax(0,1fr)]')
  })

  it('becomes a real button when interactive', () => {
    expect(renderToStaticMarkup(<WallTile onClick={() => {}}>Open</WallTile>)).toContain('<button')
  })
})
