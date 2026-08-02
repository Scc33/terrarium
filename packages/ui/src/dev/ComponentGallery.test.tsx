import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ComponentGallery } from './ComponentGallery'

describe('ComponentGallery', () => {
  it('keeps the visual regression states on one deterministic surface', () => {
    const html = renderToStaticMarkup(<ComponentGallery />)
    for (const state of ['DECISION CONTROLS', 'ANALYTICAL PRIMITIVES', 'TERMINAL REGISTER', 'EMPTY AND LOCKED STATES', 'OVERLAY INFORMATION ARCHITECTURE']) {
      expect(html).toContain(state)
    }
  })
})
