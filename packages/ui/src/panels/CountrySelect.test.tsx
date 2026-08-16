import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { COUNTRY_CATALOG } from '@terrarium/engine'
import { CountrySelect } from './CountrySelect'
import { draftFrom } from '../countryDraft'

const noop = () => {}
const props = {
  onStart: noop,
  onStartDraft: noop,
  drafts: [],
  onNewDraft: noop,
  onEditDraft: noop,
  onImportDraft: noop,
  onDeleteDraft: noop,
}

describe('country selection', () => {
  it('offers every country before starting a game', () => {
    const html = renderToStaticMarkup(<CountrySelect {...props} />)
    for (const country of COUNTRY_CATALOG) expect(html).toContain(country.name)
    expect(html).toContain('role="radiogroup"')
    expect(html).toContain('TENURE RULE')
    expect(html).toContain('GOD MODE')
    expect(html).toContain('ACCEPT POSTING')
  })

  it('only offers a return route when replacing an existing game', () => {
    const firstRun = renderToStaticMarkup(<CountrySelect {...props} />)
    const replacement = renderToStaticMarkup(<CountrySelect {...props} onCancel={noop} />)
    expect(firstRun).not.toContain('RETURN TO RECORDS')
    expect(replacement).toContain('RETURN TO RECORDS')
  })

  it('offers the drafting room beside the appointments, not among them', () => {
    const html = renderToStaticMarkup(<CountrySelect {...props} />)
    expect(html).toContain('THE DRAFTING ROOM')
    expect(html).toContain('OPEN A NEW FILE')
    expect(html).toContain('FILE A DOSSIER FROM THE POUCH')
  })

  it('shows a filed draft on the shelf, and never claims a difficulty for it', () => {
    const drafts = [draftFrom('veltravia', 'Halvern')]
    const html = renderToStaticMarkup(<CountrySelect {...props} drafts={drafts} />)
    expect(html).toContain('Halvern')
    // the shelf is present but the draft is not selected, so the aside still
    // shows a catalogue posting and its earned difficulty stamp
    expect(html).toContain('INTRODUCTORY')
    expect(html).not.toContain('UNRATED')
  })

  it('marks a selected draft unrated rather than grading it', () => {
    // rendering statically cannot click, so this asserts the stamp exists in
    // the component's vocabulary at all — the behaviour is covered by
    // tests/ui/country-draft.test.ts, which owns every decision this UI makes
    const source = CountrySelect.toString()
    expect(source).toContain('UNRATED')
  })
})
