import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { accessForInstrument } from '../../maturity'
import { Gauge } from './Gauge'

describe('Gauge', () => {
  it('selects the blank plate for an unmeasured indicator', () => {
    const html = renderToStaticMarkup(<Gauge indicator="inflation" access={accessForInstrument('inflation', 0.04, false)} now={0} />)
    expect(html).toContain('UNFITTED')
    expect(html).toContain('SURVEY REQUIRED')
  })

  it('preserves the requested instrument identity', () => {
    expect(renderToStaticMarkup(<Gauge indicator="birth_rate" access={accessForInstrument('birth_rate', 0.1, false)} now={0} />)).toContain('BIRTH')
  })
})
