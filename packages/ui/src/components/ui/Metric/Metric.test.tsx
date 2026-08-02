import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Metric } from './Metric'

describe('Metric', () => {
  it('keeps the label and formatted value together', () => {
    const html = renderToStaticMarkup(<Metric label="BALANCE" value="+3099.0" />)
    expect(html).toContain('BALANCE')
    expect(html).toContain('+3099.0')
  })

  it('applies warning semantics visually', () => {
    expect(renderToStaticMarkup(<Metric label="PRINTED" value="949.5" tone="danger" />)).toContain('text-dossier-warn')
  })
})
