/**
 * The country document is a file format for untrusted input, so these tests
 * are mostly about what it *refuses*. The one that matters most is the
 * round-trip: the document stores an age-shape id instead of seventeen float
 * bands, so import has to rebuild a pyramid that is not merely close but
 * identical — otherwise two people playing "the same" country play different
 * ones, and the save-is-a-replay-log contract quietly breaks.
 */

import { describe, expect, it } from 'vitest'
import {
  COUNTRY_ARCHETYPE_IDS,
  COUNTRY_DOCUMENT_FORMAT,
  COUNTRY_DOCUMENT_VERSION,
  InvalidCountryError,
  countryFromDocument,
  createCountryDocument,
  createCountryParams,
  createSave,
  hashState,
  init,
  parseCountryDocument,
  replay,
  type CountryDocument,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'

const draft = () =>
  createCountryDocument(
    { ...createCountryParams('veltravia', 'seed'), name: 'Halvern' },
    'industrial',
    {
      byline: 'The drafted republic',
      summary: 'A country somebody wrote down.',
      opportunities: ['Deep industrial plant'],
      pressures: ['Nobody has balanced it'],
    },
  )

const reparse = (doc: CountryDocument): CountryDocument =>
  parseCountryDocument(JSON.parse(JSON.stringify(doc)) as unknown)

describe('the country document', () => {
  it('round-trips through JSON to a bit-identical century', () => {
    const doc = draft()
    const before = countryFromDocument(doc)
    const after = countryFromDocument(reparse(doc))

    expect(after).toEqual(before)
    // fields matching is not the claim; a century matching is
    const run = (params: typeof before) => hashState(replay(createSave(params, 'trip', [], 120)))
    expect(run(after)).toBe(run(before))
  })

  it('rebuilds the pyramid rather than storing it', () => {
    const doc = draft()
    expect(doc.params.pyramid).toBeUndefined()

    const params = countryFromDocument(doc)
    expect(params.pyramid).toHaveLength(17)
    const people = params.pyramid!.reduce((sum, band) => sum + band, 0)
    const classes = Object.values(params.cohortSizes).reduce((sum, size) => sum + size, 0)
    expect(people).toBeCloseTo(classes, 9)
  })

  it('keeps every age shape openable', () => {
    for (const shape of COUNTRY_ARCHETYPE_IDS) {
      const doc = createCountryDocument(createCountryParams('meridia', 'seed'), shape)
      expect(() => init(countryFromDocument(reparse(doc)), 'seed')).not.toThrow()
    }
  })

  it('stamps every authored country, and only authored countries', () => {
    expect(countryFromDocument(draft()).authored).toBe(true)
    expect(createCountryParams('meridia', 'seed').authored).toBeUndefined()

    const authored = observe(init(countryFromDocument(draft()), 'seed'))
    const curated = observe(init(createCountryParams('meridia', 'seed'), 'seed'))
    expect(authored.countryAuthored).toBe(true)
    expect(curated.countryAuthored).toBe(false)
  })

  it('forces the authored stamp on rather than trusting the file', () => {
    const doc = draft()
    const lying = { ...doc, params: { ...doc.params, authored: false } }
    expect(countryFromDocument(lying).authored).toBe(true)
    expect(reparse(lying as CountryDocument).params.authored).toBe(true)
  })

  it('is small enough to hand to somebody', () => {
    // the pyramid is ~40% of the vector's bytes; dropping it is what keeps a
    // document pasteable rather than merely downloadable
    expect(JSON.stringify(draft()).length).toBeLessThan(1200)
  })
})

describe('what the document refuses', () => {
  const bad = (mutate: (doc: Record<string, unknown>) => void, why: RegExp) => {
    const raw = JSON.parse(JSON.stringify(draft())) as Record<string, unknown>
    mutate(raw)
    expect(() => parseCountryDocument(raw)).toThrow(InvalidCountryError)
    expect(() => parseCountryDocument(raw)).toThrow(why)
  }

  it('rejects anything that is not a country document', () => {
    for (const junk of [null, undefined, 42, 'meridia', [], {}]) {
      expect(() => parseCountryDocument(junk)).toThrow(InvalidCountryError)
    }
  })

  it('rejects a save file, which is the likeliest wrong import', () => {
    const save = createSave(createCountryParams('meridia', 'seed'), 'seed', [], 0)
    expect(() => parseCountryDocument(save)).toThrow(/not a Terrarium country document/)
  })

  it('rejects a document from a newer build instead of guessing', () => {
    bad((raw) => { raw.version = COUNTRY_DOCUMENT_VERSION + 1 }, /reads up to/)
  })

  it('rejects an unknown age shape', () => {
    bad((raw) => { raw.ageShape = 'lunar' }, /age shape must be one of/)
  })

  it('rejects out-of-range parameters with the reason', () => {
    bad((raw) => { (raw.params as Record<string, unknown>).development = 4 }, /development 4 outside/)
    bad((raw) => { (raw.params as Record<string, unknown>).openness = -1 }, /openness -1 outside/)
  })

  it('rejects non-finite numbers, which JSON smuggles in as null', () => {
    bad((raw) => { (raw.params as Record<string, unknown>).development = null }, /not a finite number/)
    bad((raw) => {
      const caps = (raw.params as Record<string, unknown>).capacities as Record<string, unknown>
      caps.tax = 'high'
    }, /capacities.tax is not a finite number/)
  })

  it('rejects a missing record rather than defaulting it', () => {
    bad((raw) => { delete (raw.params as Record<string, unknown>).cohortSizes }, /cohortSizes is missing/)
    bad((raw) => { delete (raw.params as Record<string, unknown>).enfranchisement }, /enfranchisement is missing/)
  })

  it('rejects a blank name', () => {
    bad((raw) => { (raw.params as Record<string, unknown>).name = '   ' }, /name is blank/)
  })

  it('drops unknown fields instead of carrying them into the engine', () => {
    const raw = JSON.parse(JSON.stringify(draft())) as Record<string, unknown>
    ;(raw.params as Record<string, unknown>).__proto__polluted = true
    ;(raw.params as Record<string, unknown>).secretGdp = 9999
    const parsed = parseCountryDocument(raw)
    expect(parsed.params).not.toHaveProperty('secretGdp')
    expect(countryFromDocument(parsed)).not.toHaveProperty('secretGdp')
  })
})

describe('the dossier prose, which arrives from a stranger', () => {
  it('flattens control characters and newlines to spaces', () => {
    const doc = createCountryDocument(createCountryParams('meridia', 'seed'), 'balanced', {
      // escapes, not literal bytes: a source file carrying a raw NUL is
      // binary to git and invisible in review
      byline: 'The\u0000broken\nrepublic\u007F',
      summary: 'Line one.\r\n\tLine two.',
    })
    expect(doc.dossier.byline).toBe('The broken republic')
    expect(doc.dossier.summary).toBe('Line one. Line two.')
  })

  it('caps length so an import cannot wreck a layout', () => {
    const doc = createCountryDocument(createCountryParams('meridia', 'seed'), 'balanced', {
      byline: 'x'.repeat(500),
      summary: 'y'.repeat(5000),
      opportunities: Array.from({ length: 40 }, () => 'z'.repeat(400)),
    })
    expect(doc.dossier.byline).toHaveLength(80)
    expect(doc.dossier.summary).toHaveLength(400)
    expect(doc.dossier.opportunities).toHaveLength(4)
    expect(doc.dossier.opportunities[0]).toHaveLength(90)
  })

  it('supplies neutral prose rather than failing on an empty dossier', () => {
    const doc = createCountryDocument(createCountryParams('meridia', 'seed'), 'balanced')
    expect(doc.dossier.byline.length).toBeGreaterThan(0)
    expect(doc.dossier.summary.length).toBeGreaterThan(0)
    expect(doc.format).toBe(COUNTRY_DOCUMENT_FORMAT)
  })

  it('carries no difficulty field for an author to assign themselves', () => {
    expect(draft().dossier).not.toHaveProperty('difficulty')
  })
})
