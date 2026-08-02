import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Gauge } from './Gauge'

describe('Gauge', () => {
  it('selects the blank plate for an unmeasured indicator', () => {
    expect(renderToStaticMarkup(<Gauge indicator="inflation" maturity="unmeasured" now={0} />)).toContain('INSTRUMENT NOT FITTED')
  })

  it('preserves the requested instrument identity', () => {
    expect(renderToStaticMarkup(<Gauge indicator="birth_rate" maturity="unmeasured" now={0} />)).toContain('BIRTH')
  })
})
