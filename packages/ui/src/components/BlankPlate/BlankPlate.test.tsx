import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BlankPlate } from './BlankPlate'

describe('BlankPlate', () => {
  it('names the instrument that is not fitted', () => {
    const html = renderToStaticMarkup(<BlankPlate indicator="inflation" currentCapacity={0.04} fundedAt={0.08} />)
    expect(html).toContain('UNFITTED')
    expect(html).toContain('SURVEY REQUIRED')
    expect(html).toContain('STAT. OFFICE 4 → 8')
  })

  it('distinguishes a commissioned survey awaiting its first return', () => {
    const html = renderToStaticMarkup(<BlankPlate indicator="inflation" availability="awaiting" currentCapacity={0.12} fundedAt={0.08} />)
    expect(html).toContain('COMMISSIONED')
    expect(html).toContain('FIRST RETURN PENDING')
    expect(html).toContain('THRESHOLD MET')
    expect(html).not.toContain('SURVEY REQUIRED')
  })

  it('offers a direct route to the institution that unlocks a survey', () => {
    const html = renderToStaticMarkup(<BlankPlate indicator="unemployment" currentCapacity={0.18} fundedAt={0.35} onOpenCapacity={() => {}} />)
    expect(html).toContain('aria-label="Open Institutions to fund LABOUR FORCE SURVEY"')
    expect(html).toContain('OPEN INSTITUTIONS')
  })

  it('puts the brass plate inside a quiet empty instrument bay', () => {
    const html = renderToStaticMarkup(<BlankPlate indicator="unemployment" />)
    expect(html).toContain('instrument-bay')
    expect(html).toContain('from-[#c8a977]')
  })
})
