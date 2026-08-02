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
    const html = renderToStaticMarkup(<SliderField label="Tariff" displayValue="30%" currentDisplayValue="20%" changeDisplayValue="+10 PT" politicalCost={2.2} dirty readOnly onReset={() => {}} />)
    expect(html).toContain('DRAFTED · 2.2 PC')
    expect(html).toContain('WAS 20%')
    expect(html).toContain('+10 PT')
    expect(html).toContain('RESET')
  })

  it('offers labelled precision controls', () => {
    const html = renderToStaticMarkup(<SliderField label="Tariff" displayValue="30%" onStep={() => {}} readOnly />)
    expect(html).toContain('aria-label="Decrease Tariff"')
    expect(html).toContain('aria-label="Increase Tariff"')
  })
})
