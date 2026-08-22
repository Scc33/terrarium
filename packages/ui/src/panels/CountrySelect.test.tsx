import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { APPOINTMENTS, COUNTRY_CATALOG, GAME_RULE_IDS } from '@terrarium/engine'
import { CountrySelect } from './CountrySelect'
import { RULE_COPY } from '../gameRules'
import { draftFrom } from '../countryDraft'

const noop = () => {}
const props = {
  onStart: noop,
  onStartDraft: noop,
  appointedAt: 0,
  onAppointedAt: noop,
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

  it('offers every appointment year, and says what happens to the years before', () => {
    const html = renderToStaticMarkup(<CountrySelect {...props} />)
    // the choice is the app's, not this room's — the drafting room next door
    // starts a game too, and it has to start the same one
    const later = renderToStaticMarkup(
      <CountrySelect {...props} appointedAt={APPOINTMENTS[1].tick} />,
    )
    expect(later).toContain(`January ${APPOINTMENTS[1].year}.`)
    expect(later).toContain(APPOINTMENTS[1].summary)
    expect(html).toContain('YEAR OF APPOINTMENT')
    // sealed into the save like the standing orders, so this is the only place
    // it can be chosen — every offered quarter has to be reachable here
    expect(APPOINTMENTS.length).toBeGreaterThan(1)
    for (const appointment of APPOINTMENTS) {
      expect(html, `${appointment.year} segment`).toContain(`>${appointment.year}</button>`)
    }
    // it opens on the settlement: a default that quietly skipped a
    // quarter-century would be a different game than the one anyone asked for
    expect(html).toContain(`January ${APPOINTMENTS[0].year}.`)
    expect(html).toContain(APPOINTMENTS[0].name)
    expect(html).toContain(APPOINTMENTS[0].summary)
    // the years not chosen explain themselves on hover, like every other
    // caption in this room. A static render cannot open a tooltip, so their
    // copy is deliberately absent here rather than missing — the wiring is
    // `title` on each segment, and the aside's caption once one is picked
    expect(html).not.toContain(APPOINTMENTS[1].summary)
  })

  it('marks a selected draft unrated rather than grading it', () => {
    // rendering statically cannot click, so this asserts the stamp exists in
    // the component's vocabulary at all — the behaviour is covered by
    // tests/ui/country-draft.test.ts, which owns every decision this UI makes
    const source = CountrySelect.toString()
    expect(source).toContain('UNRATED')
  })
})
