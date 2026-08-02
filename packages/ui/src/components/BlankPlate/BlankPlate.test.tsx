import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BlankPlate } from './BlankPlate'

describe('BlankPlate', () => {
  it('names the instrument that is not fitted', () => {
    const html = renderToStaticMarkup(<BlankPlate indicator="inflation" />)
    expect(html).toContain('OFFLINE')
    expect(html).toContain('SURVEY REQUIRED')
    expect(html).toContain('STATE CAPACITY')
  })

  it('puts the brass plate inside a quiet empty instrument bay', () => {
    const html = renderToStaticMarkup(<BlankPlate indicator="unemployment" />)
    expect(html).toContain('instrument-bay')
    expect(html).toContain('from-[#c8a977]')
  })
})
