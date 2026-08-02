import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SectionBar } from './SectionBar'

describe('SectionBar', () => {
  it('renders its title, guidance, and status', () => {
    const html = renderToStaticMarkup(<SectionBar title="WATCH BOARD" detail="Choose from the rack" aside="4 / 4 PINNED" />)
    expect(html).toContain('WATCH BOARD')
    expect(html).toContain('Choose from the rack')
    expect(html).toContain('4 / 4 PINNED')
  })

  it('supports the inverted wall register', () => {
    expect(renderToStaticMarkup(<SectionBar title="RACK" inverted />)).toContain('bg-[#1d3027]')
  })
})
