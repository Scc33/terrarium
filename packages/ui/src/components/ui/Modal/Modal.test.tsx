import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
  it('provides dialog semantics and an accessible name', () => {
    const html = renderToStaticMarkup(<Modal title="THE LEDGER" onClose={() => {}}>Books</Modal>)
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('aria-labelledby=')
  })

  it('has a clearly labelled close control', () => {
    expect(renderToStaticMarkup(<Modal title="THE LEDGER" onClose={() => {}}>Books</Modal>)).toContain('aria-label="Close dialog"')
  })
})
