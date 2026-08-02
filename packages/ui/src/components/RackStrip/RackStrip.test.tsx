import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RackStrip } from './RackStrip'

describe('RackStrip', () => {
  it('announces pin state', () => {
    const html = renderToStaticMarkup(<RackStrip indicator="inflation" maturity="unmeasured" now={0} pinned onPin={() => {}} />)
    expect(html).toContain('aria-pressed="true"')
  })

  it('names the capability needed for an unfitted instrument', () => {
    const html = renderToStaticMarkup(<RackStrip indicator="unemployment" maturity="unmeasured" now={0} pinned={false} onPin={() => {}} />)
    expect(html).toContain('LABOUR FORCE SURVEY')
  })
})
