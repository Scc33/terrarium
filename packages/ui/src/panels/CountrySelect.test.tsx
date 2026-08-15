import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { COUNTRY_CATALOG } from '@terrarium/engine'
import { CountrySelect } from './CountrySelect'

describe('country selection', () => {
  it('offers every country before starting a game', () => {
    const html = renderToStaticMarkup(<CountrySelect onStart={() => {}} />)
    for (const country of COUNTRY_CATALOG) expect(html).toContain(country.name)
    expect(html).toContain('role="radiogroup"')
    expect(html).toContain('TENURE RULE')
    expect(html).toContain('GOD MODE')
    expect(html).toContain('ACCEPT POSTING')
  })

  it('only offers a return route when replacing an existing game', () => {
    const firstRun = renderToStaticMarkup(<CountrySelect onStart={() => {}} />)
    const replacement = renderToStaticMarkup(<CountrySelect onStart={() => {}} onCancel={() => {}} />)
    expect(firstRun).not.toContain('RETURN TO RECORDS')
    expect(replacement).toContain('RETURN TO RECORDS')
  })
})
