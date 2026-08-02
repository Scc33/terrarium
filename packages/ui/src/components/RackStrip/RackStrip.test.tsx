import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { accessForInstrument } from '../../maturity'
import { RackStrip } from './RackStrip'

describe('RackStrip', () => {
  it('announces pin state', () => {
    const html = renderToStaticMarkup(<RackStrip indicator="inflation" access={accessForInstrument('inflation', 0.04, false)} now={0} pinned slot={2} onPin={() => {}} />)
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('02')
  })

  it('names the capability needed for an unfitted instrument', () => {
    const html = renderToStaticMarkup(<RackStrip indicator="unemployment" access={accessForInstrument('unemployment', 0.18, false)} now={0} pinned={false} onPin={() => {}} />)
    expect(html).toContain('LABOUR FORCE SURVEY')
    expect(html).toContain('35')
  })

  it('labels a commissioned instrument as waiting rather than unfunded', () => {
    const html = renderToStaticMarkup(<RackStrip indicator="inflation" access={accessForInstrument('inflation', 0.18, false)} now={0} pinned={false} onPin={() => {}} />)
    expect(html).toContain('RETURN PENDING')
    expect(html).not.toContain('SURVEY REQUIRED')
  })
})
