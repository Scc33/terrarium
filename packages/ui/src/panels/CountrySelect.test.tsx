import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { COUNTRY_CATALOG, GAME_RULE_IDS } from '@terrarium/engine'
import { CountrySelect } from './CountrySelect'
import { RULE_COPY } from '../gameRules'
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
    expect(html).toContain('ACCEPT POSTING')
  })

  it('offers every rule of the run, and explains each one', () => {
    const html = renderToStaticMarkup(<CountrySelect {...props} />)
    // folded away by default, but it states what is in force either way — a
    // sandbox rule the player cannot see they enabled is the whole failure
    expect(html).toContain('STANDING ORDERS')
    expect(html).toContain('ORDINARY PLAY')
    // the rules are sealed into the save, so the posting room is the only
    // place they can be chosen — every one of them has to be reachable here
    for (const id of GAME_RULE_IDS) {
      const copy = RULE_COPY[id]
      expect(html, `${id} row`).toContain(copy.label)
      expect(html, `${id} off`).toContain(copy.off)
      expect(html, `${id} on`).toContain(copy.on)
      expect(html, `${id} caption`).toContain(copy.caption.off)
    }
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
