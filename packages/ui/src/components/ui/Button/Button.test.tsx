import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('defaults to a non-submitting button', () => {
    expect(renderToStaticMarkup(<Button>FILE</Button>)).toContain('type="button"')
  })

  it('exposes disabled state and variant styling', () => {
    const html = renderToStaticMarkup(<Button variant="danger" disabled>ABANDON</Button>)
    expect(html).toContain('disabled=""')
    expect(html).toContain('border-dossier-warn')
  })
})
