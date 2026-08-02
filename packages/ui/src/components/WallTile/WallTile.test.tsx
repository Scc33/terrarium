import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WallTile } from './WallTile'

describe('WallTile', () => {
  it('uses definite rows for header, body, and footer', () => {
    const html = renderToStaticMarkup(<WallTile header="Head" footer="Foot">Body</WallTile>)
    expect(html).toContain('grid-rows-[auto_minmax(0,1fr)_auto]')
  })

  it('becomes a real button when interactive', () => {
    expect(renderToStaticMarkup(<WallTile onClick={() => {}}>Open</WallTile>)).toContain('<button')
  })
})
