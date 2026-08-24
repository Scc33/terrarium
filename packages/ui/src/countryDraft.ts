/**
 * The drafting room's arithmetic — what a country's fields are, what they are
 * allowed to be, and how a draft becomes a document somebody else can open.
 *
 * Pure on purpose, for the usual reason: a bound that disagrees with
 * `validateCountryParams` produces a slider whose own maximum cannot be saved,
 * and that is invisible in review and in jsdom. `tests/ui/country-draft.test.ts`
 * drives every field to both rails and asserts the resulting document still
 * parses — a control you cannot reach the end of is a broken control.
 *
 * The field table is GENERATED from the engine's id lists rather than typed out.
 * A hand-written path is a typo waiting to silently address nothing; a generated
 * one cannot be wrong about a sector that exists, and a new sector or institution
 * appears in the editor without anybody remembering to add it.
 */

import {
  CAPACITY_IDS,
  COHORT_IDS,
  COUNTRY_ARCHETYPE_IDS,
  COUNTRY_DRAFT_DOMAIN,
  INSTITUTION_IDS,
  SECTOR_IDS,
  countryFromDocument,
  createCountryDocument,
  createCountryParams,
  materializeStructure,
  parseCountryDocument,
  type CountryArchetypeId,
  type CountryDocument,
  type CountryParams,
  type CuratedCountryId,
} from '@terrarium/engine'
import { SECTOR_NAMES } from './components/labels'

/** The five groups a 1946 settlement reads as, in the order an author meets
 * them: who is here, what they make, what the last government left behind,
 * what the constitution already says, and what the state can actually do. */
export const DRAFT_GROUP_IDS = ['people', 'production', 'books', 'settlement', 'state'] as const
export type DraftGroupId = (typeof DRAFT_GROUP_IDS)[number]

/** `title` names the section; `short` is what fits on a tab. Long tab labels
 * wrap to two lines at 1280 and the control stops reading as a row of peers. */
export const DRAFT_GROUPS: Record<DraftGroupId, { title: string; short: string; note: string }> = {
  people: {
    short: 'COUNTRY',
    title: 'The country',
    note: 'Classes in millions, how far along it is, and how exposed to the world. Population and development own scale; nothing else does.',
  },
  production: {
    short: 'PRODUCTION',
    title: 'The productive base',
    note: 'Weights against the standard 1946 mix. init normalizes them, so these change what the country makes without changing how much.',
  },
  books: {
    short: 'BOOKS',
    title: 'The inherited books',
    note: 'The balance sheet the last government left behind, before you have decided anything.',
  },
  settlement: {
    short: 'SETTLEMENT',
    title: 'The 1946 settlement',
    note: 'The constitution you inherit and who already has the vote. This is where a draft stops being an economy and becomes an argument.',
  },
  state: {
    short: 'STATE',
    title: 'The state',
    note: 'What the apparatus can do on day one. Statistical capacity is how much fog you open with.',
  },
}

export type FieldFormat = 'percent' | 'multiplier' | 'millions' | 'quarters' | 'index'

export interface DraftField {
  /** dotted address into CountryParams; generated, never hand-typed */
  path: string
  label: string
  group: DraftGroupId
  min: number
  max: number
  step: number
  format: FieldFormat
  hint: string
}

/** Bounds come from the engine's finite drafting domain and remain inside
 * `validateCountryParams`. A slider that can be dragged to a value the engine
 * rejects is worse than one that stops. */
const CAPACITY_HINTS: Record<(typeof CAPACITY_IDS)[number], string> = {
  tax: 'How much of what is owed actually arrives.',
  statistical: 'How early and how honestly the instruments print. Low is the fog.',
  administrative: 'How much of a transfer survives the journey to the household.',
  education: 'The school system the inherited workforce came through, and the target future skills move toward.',
}

const COHORT_LABELS: Record<(typeof COHORT_IDS)[number], string> = {
  rural_workers: 'Rural workers',
  urban_workers: 'Urban workers',
  professionals: 'Professionals',
  business_owners: 'Business owners',
  retirees: 'Retirees',
}

const INSTITUTION_LABELS: Record<(typeof INSTITUTION_IDS)[number], string> = {
  suffrage: 'Suffrage',
  press: 'Free press',
  labor_rights: 'Labour rights',
  courts: 'Courts',
  repression: 'Repression',
}

const MIX_FIELDS = [
  { key: 'outputMix', label: 'output', hint: 'share of what the country produces' },
  { key: 'employmentMix', label: 'employment', hint: 'share of who works where' },
  { key: 'capitalMix', label: 'capital', hint: 'share of the plant it inherited' },
] as const

export const DRAFT_FIELDS: readonly DraftField[] = [
  {
    path: 'development',
    label: 'Development',
    group: 'people',
    min: COUNTRY_DRAFT_DOMAIN.development.min,
    max: COUNTRY_DRAFT_DOMAIN.development.max,
    step: 0.01,
    format: 'percent',
    hint: 'Scales starting capital, productivity and technological position.',
  },
  {
    path: 'openness',
    label: 'Openness',
    group: 'people',
    min: COUNTRY_DRAFT_DOMAIN.openness.min,
    max: COUNTRY_DRAFT_DOMAIN.openness.max,
    step: 0.01,
    format: 'multiplier',
    hint: 'Trade exposure. Also how much foreign capital and technique can reach you — and how hard the world cycle hits.',
  },
  ...COHORT_IDS.map<DraftField>((id) => ({
    path: `cohortSizes.${id}`,
    label: COHORT_LABELS[id],
    group: 'people',
    min: COUNTRY_DRAFT_DOMAIN.cohortSize.min,
    max: COUNTRY_DRAFT_DOMAIN.cohortSize.max,
    step: 0.1,
    format: 'millions',
    hint: `How many ${COHORT_LABELS[id].toLowerCase()} the country has in 1946.`,
  })),
  ...MIX_FIELDS.flatMap((mix) =>
    SECTOR_IDS.map<DraftField>((id) => ({
      path: `structure.${mix.key}.${id}`,
      label: `${SECTOR_NAMES[id]} — ${mix.label}`,
      group: 'production',
      min: COUNTRY_DRAFT_DOMAIN.sectorMix.min,
      max: COUNTRY_DRAFT_DOMAIN.sectorMix.max,
      step: 0.01,
      format: 'multiplier',
      hint: `${SECTOR_NAMES[id]}'s ${mix.hint}, against the standard 1946 mix.`,
    })),
  ),
  {
    path: 'structure.debtToGdp',
    label: 'Public debt',
    group: 'books',
    min: COUNTRY_DRAFT_DOMAIN.debtToGdp.min,
    max: COUNTRY_DRAFT_DOMAIN.debtToGdp.max,
    step: 0.01,
    format: 'percent',
    hint: 'Inherited public debt as a share of annual GDP. High debt narrows every later choice.',
  },
  {
    path: 'structure.creditToGdp',
    label: 'Private credit',
    group: 'books',
    min: COUNTRY_DRAFT_DOMAIN.creditToGdp.min,
    max: COUNTRY_DRAFT_DOMAIN.creditToGdp.max,
    step: 0.01,
    format: 'percent',
    hint: 'How much lending is already outstanding. Deep credit means a faster boom and a worse bust.',
  },
  {
    path: 'structure.reserveCoverage',
    label: 'Reserve coverage',
    group: 'books',
    min: COUNTRY_DRAFT_DOMAIN.reserveCoverage.min,
    max: COUNTRY_DRAFT_DOMAIN.reserveCoverage.max,
    step: 0.1,
    format: 'quarters',
    hint: 'Foreign reserves, in quarters of imports. Thin cover means the exchange rate does the adjusting.',
  },
  ...INSTITUTION_IDS.map<DraftField>((id) => ({
    path: `structure.institutions.${id}`,
    label: INSTITUTION_LABELS[id],
    group: 'settlement',
    min: COUNTRY_DRAFT_DOMAIN.institution.min,
    max: COUNTRY_DRAFT_DOMAIN.institution.max,
    step: 0.01,
    format: 'index',
    hint:
      id === 'repression'
        ? 'What the state inherits in the way of a boot. It lowers the electoral bar and raises the pressure.'
        : `Inherited stock of ${INSTITUTION_LABELS[id].toLowerCase()} before the first reform.`,
  })),
  ...COHORT_IDS.map<DraftField>((id) => ({
    path: `enfranchisement.${id}`,
    label: `${COHORT_LABELS[id]} — franchise`,
    group: 'settlement',
    min: COUNTRY_DRAFT_DOMAIN.enfranchisement.min,
    max: COUNTRY_DRAFT_DOMAIN.enfranchisement.max,
    step: 0.01,
    format: 'index',
    hint: `How much of a vote ${COHORT_LABELS[id].toLowerCase()} carry in 1946.`,
  })),
  ...CAPACITY_IDS.map<DraftField>((id) => ({
    path: `capacities.${id}`,
    label: id === 'tax' ? 'Tax capacity' : `${id[0].toUpperCase()}${id.slice(1)} capacity`,
    group: 'state',
    min: COUNTRY_DRAFT_DOMAIN.capacity.min,
    max: COUNTRY_DRAFT_DOMAIN.capacity.max,
    step: 0.01,
    format: 'index',
    hint: CAPACITY_HINTS[id],
  })),
]

export const fieldsInGroup = (group: DraftGroupId): DraftField[] =>
  DRAFT_FIELDS.filter((field) => field.group === group)

export function formatFieldValue(value: number, format: FieldFormat): string {
  switch (format) {
    case 'percent':
      return `${Math.round(value * 100)}%`
    case 'multiplier':
      return `${value.toFixed(2)}×`
    case 'millions':
      return `${value.toFixed(1)}M`
    case 'quarters':
      return `${value.toFixed(1)} qtr`
    case 'index':
      return value.toFixed(2)
  }
}

// ---------------------------------------------------------------------------
// reading and writing a draft
// ---------------------------------------------------------------------------

type Numeric = Record<string, unknown>

/** Read a generated path. Returns NaN rather than throwing so a field the
 * document predates renders as unset instead of crashing the editor. */
export function readField(params: CountryParams, path: string): number {
  let node: unknown = params
  for (const key of path.split('.')) {
    if (node === null || typeof node !== 'object') return NaN
    node = (node as Numeric)[key]
  }
  return typeof node === 'number' ? node : NaN
}

const clampToField = (field: DraftField, value: number): number => {
  if (!Number.isFinite(value)) return field.min
  // snap to the field's own step so a keyboard entry and a drag agree, and so
  // the written document has no more precision than the control offered
  const snapped = Math.round(value / field.step) * field.step
  return Math.min(field.max, Math.max(field.min, Number(snapped.toFixed(6))))
}

/** Write a generated path, clamped to the field's rails. Immutable: every
 * object along the path is copied, so React sees a new draft. */
export function writeField(params: CountryParams, field: DraftField, value: number): CountryParams {
  const keys = field.path.split('.')
  const next = clampToField(field, value)

  const set = (node: Numeric, depth: number): Numeric => {
    const key = keys[depth]
    if (depth === keys.length - 1) return { ...node, [key]: next }
    const child = node[key]
    if (child === null || typeof child !== 'object') return node
    return { ...node, [key]: set(child as Numeric, depth + 1) }
  }

  return set(params as unknown as Numeric, 0) as unknown as CountryParams
}

// ---------------------------------------------------------------------------
// drafts
// ---------------------------------------------------------------------------

/** Age shapes, as an author picks them. Seventeen pyramid bands are derived
 * from this, never edited — a hand-drawn pyramid that contradicts the class
 * sizes is rejected by the validator, and an editor should not be able to
 * express a country the engine refuses. */
export const AGE_SHAPE_LABELS: Record<CountryArchetypeId, string> = {
  balanced: 'Balanced — broad base, thinning past sixty',
  agrarian: 'Agrarian — very young, few survive to retire',
  industrial: 'Industrial — flat, already through its transition',
  maritime: 'Maritime — young, with a real professional cohort',
  resource: 'Resource — young and steeply tapered',
}

const SHAPE_FOR_COUNTRY: Record<CuratedCountryId, CountryArchetypeId> = {
  meridia: 'balanced',
  costona: 'agrarian',
  veltravia: 'industrial',
  oranga: 'maritime',
  kestrel: 'resource',
}

/**
 * Open a curated country as a draft.
 *
 * Nobody starts from forty empty fields, and a draft that starts from a
 * balanced country stays in a neighbourhood the engine has actually been
 * calibrated in. `materializeStructure` writes down the opening conditions a
 * structure-less recipe receives implicitly, so the editor can show them —
 * it is an exact economic no-op, pinned by `tests/unit/countries.test.ts`.
 */
export function draftFrom(id: CuratedCountryId, name?: string): CountryDocument {
  const base = materializeStructure(createCountryParams(id, 'draft'))
  return createCountryDocument({ ...base, name: name ?? base.name }, SHAPE_FOR_COUNTRY[id], {
    byline: 'A drafted posting',
    summary: `Opened from ${base.name}. Nobody has balanced what it became.`,
  })
}

/** Rewrite a draft's vector, age shape or prose, returning a fresh document.
 * Goes through `createCountryDocument` so a draft is always a thing that could
 * be exported this instant — an editor state that cannot be saved is a bug
 * waiting for the moment someone tries. */
export function reviseDraft(
  doc: CountryDocument,
  change: {
    params?: CountryParams
    ageShape?: CountryArchetypeId
    name?: string
    byline?: string
    summary?: string
  },
): CountryDocument {
  const params = change.params ?? doc.params
  return createCountryDocument(
    { ...params, name: change.name ?? params.name },
    change.ageShape ?? doc.ageShape,
    {
      ...doc.dossier,
      byline: change.byline ?? doc.dossier.byline,
      summary: change.summary ?? doc.dossier.summary,
    },
  )
}

/** Which fields this draft has moved away from the country it was opened from.
 * Drives the editor's DRAFTED marks, and answers "what did I actually change?"
 * — which is the only question a forty-field vector can be read through. */
export function draftChanges(doc: CountryDocument, base: CountryDocument): Set<string> {
  const moved = new Set<string>()
  for (const field of DRAFT_FIELDS) {
    const a = readField(doc.params, field.path)
    const b = readField(base.params, field.path)
    if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) > field.step / 2) {
      moved.add(field.path)
    }
  }
  return moved
}

/** Total population, the one derived number an author checks constantly. */
export const draftPopulation = (doc: CountryDocument): number =>
  COHORT_IDS.reduce((sum, id) => sum + (doc.params.cohortSizes[id] ?? 0), 0)

/** A stable identity for the drafts shelf. Documents have no id of their own —
 * they are files — so the shelf keys on the name, and saving a draft under a
 * name that is already there replaces it. That is what a filing cabinet does. */
export const draftKey = (doc: CountryDocument): string => doc.params.name.trim().toLowerCase()

// ---------------------------------------------------------------------------
// sharing
// ---------------------------------------------------------------------------

/** The URL fragment a shared country arrives in. A fragment rather than a query
 * parameter on purpose: it is never sent to a server, and it is not subject to
 * the length limits a server would impose. */
export const SHARE_FRAGMENT_KEY = 'country'

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (text: string): Uint8Array => {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

/** Encode a document for a link. UTF-8 first, because `btoa` is latin1 and a
 * country named in anything but ASCII would throw on its way out the door. */
export const encodeShare = (doc: CountryDocument): string =>
  toBase64Url(new TextEncoder().encode(JSON.stringify(doc)))

/** Decode a shared document. Throws `InvalidCountryError` (via
 * `parseCountryDocument`) on anything that is not one, so a mangled link fails
 * at the door with a reason rather than deep inside the worker. */
export function decodeShare(encoded: string): CountryDocument {
  let json: string
  try {
    json = new TextDecoder().decode(fromBase64Url(encoded))
  } catch {
    throw new Error('That link is damaged — the country could not be decoded.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('That link is damaged — the country could not be decoded.')
  }
  return parseCountryDocument(parsed)
}

/** Read a shared country out of the current URL, if there is one. Returns null
 * rather than throwing for a URL that simply has no country in it. */
export function sharedCountryFromUrl(url: string): CountryDocument | null {
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : ''
  const value = new URLSearchParams(hash).get(SHARE_FRAGMENT_KEY)
  return value ? decodeShare(value) : null
}

export function shareUrl(doc: CountryDocument, base: string): string {
  const clean = base.split('#')[0]
  return `${clean}#${SHARE_FRAGMENT_KEY}=${encodeShare(doc)}`
}

/** The filename a downloaded country lands under. */
export const shareFilename = (doc: CountryDocument): string =>
  `terrarium-country-${doc.params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'draft'}.json`

export { COUNTRY_ARCHETYPE_IDS, countryFromDocument, parseCountryDocument }
export type { CountryArchetypeId, CountryDocument }
