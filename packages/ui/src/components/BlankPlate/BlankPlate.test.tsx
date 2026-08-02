import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BlankPlate } from './BlankPlate'

describe('BlankPlate', () => {
  it('names the instrument that is not fitted', () => {
    const html = renderToStaticMarkup(<BlankPlate indicator="inflation" />)
    expect(html).toContain('INSTRUMENT NOT FITTED')
    expect(html).toContain('REQUIRES:')
  })

  it('uses the brass unmeasured register', () => {
    expect(renderToStaticMarkup(<BlankPlate indicator="unemployment" />)).toContain('from-[#c2a06b]')
  })
})
