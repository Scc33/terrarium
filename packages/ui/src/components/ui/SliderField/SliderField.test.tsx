import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SliderField } from './SliderField'

describe('SliderField', () => {
  it('associates its label, range, and output', () => {
    const html = renderToStaticMarkup(<SliderField label="Income tax" displayValue="25%" value={0.25} readOnly />)
    expect(html).toContain('for="field-income-tax"')
    expect(html).toContain('id="field-income-tax"')
    expect(html).toContain('for="field-income-tax"')
  })

  it('marks staged values with the accent tone', () => {
    expect(renderToStaticMarkup(<SliderField label="Tariff" displayValue="30%" dirty readOnly />)).toContain('text-dossier-brass')
  })
})
