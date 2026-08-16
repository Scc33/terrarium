/**
 * The editor's rails have to agree with the engine's validator, exactly.
 *
 * A field whose maximum produces a document the engine refuses is a control the
 * player can break by using it normally, and it is invisible in review: the
 * slider looks fine, the value looks plausible, and the failure arrives at save
 * time. So the load-bearing test here drives every generated field to both ends
 * and asserts the document still round-trips.
 */

import { describe, expect, it } from 'vitest'
import {
  CURATED_COUNTRY_IDS,
  InvalidCountryError,
  countryFromDocument,
  createCountryParams,
  createSave,
  hashState,
  init,
  parseCountryDocument,
  replay,
  type CuratedCountryId,
} from '@terrarium/engine'
import {
  AGE_SHAPE_LABELS,
  COUNTRY_ARCHETYPE_IDS,
  DRAFT_FIELDS,
  DRAFT_GROUP_IDS,
  decodeShare,
  draftChanges,
  draftFrom,
  draftKey,
  draftPopulation,
  encodeShare,
  fieldsInGroup,
  formatFieldValue,
  readField,
  reviseDraft,
  shareFilename,
  sharedCountryFromUrl,
  shareUrl,
  writeField,
} from '../../packages/ui/src/countryDraft'

describe('the field table', () => {
  it('addresses a real number for every generated path', () => {
    const doc = draftFrom('veltravia')
    for (const field of DRAFT_FIELDS) {
      expect(Number.isFinite(readField(doc.params, field.path)), `${field.path} addresses nothing`).toBe(true)
    }
  })

  it('has unique paths and covers every group', () => {
    expect(new Set(DRAFT_FIELDS.map((f) => f.path)).size).toBe(DRAFT_FIELDS.length)
    for (const group of DRAFT_GROUP_IDS) {
      expect(fieldsInGroup(group).length, `${group} has no fields`).toBeGreaterThan(0)
    }
  })

  it('grows with the engine rather than being maintained by hand', () => {
    // 5 sectors × 3 mixes, 5 cohorts twice, 5 institutions, 4 capacities, 3
    // stocks, development and openness. If an id list grows, so does this.
    expect(DRAFT_FIELDS.length).toBe(15 + 5 + 5 + 5 + 4 + 3 + 2)
  })

  it('keeps every rail inside what the engine will accept', () => {
    // the whole point: drive each field to both ends, one at a time, and
    // confirm the document that results is still openable
    for (const field of DRAFT_FIELDS) {
      for (const rail of [field.min, field.max]) {
        const doc = draftFrom('meridia')
        const revised = reviseDraft(doc, { params: writeField(doc.params, field, rail) })
        expect(readField(revised.params, field.path), `${field.path} @ ${rail}`).toBeCloseTo(rail, 6)
        expect(() => init(countryFromDocument(revised), 'rails'), `${field.path} @ ${rail}`).not.toThrow()
      }
    }
  })

  it('holds every field at both rails at once', () => {
    for (const rail of ['min', 'max'] as const) {
      let doc = draftFrom('meridia')
      for (const field of DRAFT_FIELDS) {
        doc = reviseDraft(doc, { params: writeField(doc.params, field, field[rail]) })
      }
      expect(() => init(countryFromDocument(doc), 'extreme')).not.toThrow()
    }
  })

  it('clamps out-of-range input rather than writing it', () => {
    const doc = draftFrom('meridia')
    const field = DRAFT_FIELDS.find((f) => f.path === 'development')!
    expect(readField(writeField(doc.params, field, 99), field.path)).toBe(field.max)
    expect(readField(writeField(doc.params, field, -99), field.path)).toBe(field.min)
    expect(readField(writeField(doc.params, field, Number.NaN), field.path)).toBe(field.min)
  })

  it('writes immutably, so React sees a new draft', () => {
    const doc = draftFrom('meridia')
    const field = DRAFT_FIELDS.find((f) => f.path === 'structure.institutions.press')!
    const next = writeField(doc.params, field, 0.9)
    expect(readField(next, field.path)).toBeCloseTo(0.9, 6)
    expect(readField(doc.params, field.path)).not.toBeCloseTo(0.9, 6)
    expect(next.structure).not.toBe(doc.params.structure)
  })

  it('formats each unit the way its scale is read', () => {
    expect(formatFieldValue(0.35, 'percent')).toBe('35%')
    expect(formatFieldValue(1.482, 'multiplier')).toBe('1.48×')
    expect(formatFieldValue(12, 'millions')).toBe('12.0M')
    expect(formatFieldValue(2.5, 'quarters')).toBe('2.5 qtr')
    expect(formatFieldValue(0.4, 'index')).toBe('0.40')
  })
})

describe('opening a curated country as a draft', () => {
  it('offers every curated country, with an age shape for each', () => {
    for (const id of CURATED_COUNTRY_IDS) {
      const doc = draftFrom(id)
      expect(COUNTRY_ARCHETYPE_IDS).toContain(doc.ageShape)
      expect(AGE_SHAPE_LABELS[doc.ageShape].length).toBeGreaterThan(10)
      expect(doc.params.structure, `${id} draft has no structure to edit`).toBeDefined()
    }
  })

  it('reproduces the country it was opened from, quarter for quarter', () => {
    // this is what makes "open Veltravia and change one number" mean anything:
    // if a drafted copy were not the original, the change would not be the
    // only difference, and nothing an author learned would be attributable
    for (const id of CURATED_COUNTRY_IDS) {
      const original = createCountryParams(id as CuratedCountryId, 'draft')
      const drafted = countryFromDocument(draftFrom(id))
      // the vector itself is part of hashed state and is meant to differ
      // (a draft is stamped `authored`), so only the economy is compared
      const economy = (params: typeof original) =>
        hashState({ ...replay(createSave(params, 'fork', [], 80)), params: null })
      expect(economy(drafted), `${id} changed by being opened as a draft`).toBe(economy(original))
    }
  })

  it('takes a name, and files under it', () => {
    const doc = draftFrom('oranga', 'Halvern')
    expect(doc.params.name).toBe('Halvern')
    expect(draftKey(doc)).toBe('halvern')
    expect(draftKey(draftFrom('oranga', '  HALVERN '))).toBe('halvern')
  })

  it('stamps every draft as authored', () => {
    expect(countryFromDocument(draftFrom('meridia')).authored).toBe(true)
  })

  it('totals the population an author is watching', () => {
    expect(draftPopulation(draftFrom('meridia'))).toBeCloseTo(27.5, 6)
  })
})

describe('what changed', () => {
  it('reports only the fields that actually moved', () => {
    const base = draftFrom('meridia')
    const field = DRAFT_FIELDS.find((f) => f.path === 'openness')!
    const moved = reviseDraft(base, { params: writeField(base.params, field, 1.9) })
    expect([...draftChanges(moved, base)]).toEqual(['openness'])
    expect(draftChanges(base, base).size).toBe(0)
  })

  it('ignores a change smaller than the control could express', () => {
    const base = draftFrom('meridia')
    const field = DRAFT_FIELDS.find((f) => f.path === 'openness')!
    // a sub-step nudge snaps back to where it was; nothing is "drafted"
    const same = reviseDraft(base, { params: writeField(base.params, field, 1.001) })
    expect(draftChanges(same, base).size).toBe(0)
  })
})

describe('sharing a country', () => {
  const doc = draftFrom('kestrel', 'Halvern')

  it('round-trips through a link', () => {
    expect(decodeShare(encodeShare(doc))).toEqual(doc)
  })

  it('survives a name that is not ASCII', () => {
    const accented = draftFrom('oranga', 'Ōrangaí — Süd')
    expect(decodeShare(encodeShare(accented)).params.name).toBe('Ōrangaí — Süd')
  })

  it('produces a fragment, so the country never reaches a server', () => {
    const url = shareUrl(doc, 'https://example.test/play?x=1')
    expect(url.startsWith('https://example.test/play?x=1#country=')).toBe(true)
    expect(sharedCountryFromUrl(url)).toEqual(doc)
  })

  it('replaces an existing fragment rather than stacking one', () => {
    const once = shareUrl(doc, 'https://example.test/#country=stale')
    expect(once.match(/#/g)).toHaveLength(1)
    expect(sharedCountryFromUrl(once)).toEqual(doc)
  })

  it('is a link somebody can actually paste', () => {
    expect(encodeShare(doc).length).toBeLessThan(1800)
  })

  it('finds nothing in a URL that carries nothing', () => {
    expect(sharedCountryFromUrl('https://example.test/')).toBeNull()
    expect(sharedCountryFromUrl('https://example.test/#seed=abc')).toBeNull()
  })

  it('refuses a damaged or hostile link with a reason', () => {
    expect(() => decodeShare('not-base64-!!')).toThrow(/damaged/)
    expect(() => decodeShare(btoa('{"nope":1}'))).toThrow(InvalidCountryError)
    expect(() => decodeShare(encodeShare({ ...doc, ageShape: 'lunar' } as never))).toThrow(
      InvalidCountryError,
    )
  })

  it('names the download after the country', () => {
    expect(shareFilename(doc)).toBe('terrarium-country-halvern.json')
    expect(shareFilename(draftFrom('oranga', '!!!'))).toBe('terrarium-country-draft.json')
  })

  it('accepts a document written by this build', () => {
    expect(parseCountryDocument(JSON.parse(JSON.stringify(doc)))).toEqual(doc)
  })
})
