/**
 * The country document — a 1946 settlement someone wrote down, in a form they
 * can hand to somebody else.
 *
 * This is a sibling of `SaveFile`, not a new kind of engine input. A save has
 * always embedded the fully materialized `CountryParams` vector (ADR-0011), and
 * the worker's `load` hands `save.params` straight to `init` without consulting
 * the catalogue — so a country nobody has ever played is *already* a legal
 * game. This module only gives that capability a file format, a validator, and
 * a name.
 *
 * Two decisions worth knowing about:
 *
 * 1. **The pyramid is derived, never stored.** Seventeen float bands are most
 *    of the bytes and none of the meaning, and a document is a thing people
 *    read, diff, and paste into a URL. The document carries the archetype's
 *    age *shape* id instead and rebuilds the pyramid with the same
 *    `pyramidFor` the recipe catalogue uses. Round-tripping therefore has to
 *    reproduce the vector exactly — see `tests/unit/country-document.test.ts`,
 *    which asserts the state hash after a century, not merely the fields.
 *
 * 2. **Numbers are rounded on write, and the document is then the truth.**
 *    Writing a document is the moment a draft becomes shareable, so it is also
 *    the moment its numbers are fixed. Rounding on read instead would let an
 *    author play one country and everyone they sent it to play another.
 *
 * Everything here is parsing untrusted input — a document arrives from a file
 * a stranger made — so it validates rather than casts, and the prose fields are
 * length-capped and stripped of control characters before they reach a UI.
 */

import {
  COUNTRY_ARCHETYPE_IDS,
  InvalidCountryError,
  pyramidFor,
  validateCountryParams,
  type CountryArchetypeId,
} from './countries'
import {
  CAPACITY_IDS,
  COHORT_IDS,
  INSTITUTION_IDS,
  SECTOR_IDS,
  type CountryParams,
  type CountryStructure,
} from './state/schema'

export const COUNTRY_DOCUMENT_FORMAT = 'terrarium-country'
/** Bumped only when an older document would otherwise be misread. Readers
 * accept anything up to this; writers always emit this. */
export const COUNTRY_DOCUMENT_VERSION = 1

/** Written with escapes on purpose: literal control bytes in a source file are
 * invisible in review, and this one guards untrusted text. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]+/g

/** Limits exist so an imported document cannot wreck a layout or a log. They
 * are generous next to the curated catalogue's own prose. */
const MAX_NAME = 40
const MAX_BYLINE = 80
const MAX_SUMMARY = 400
const MAX_NOTES = 4
const MAX_NOTE = 90

/** The player-facing half of a posting: what the curated catalogue calls a
 * `CountryProfile`, minus the fields an author must not assign themselves.
 * There is deliberately no `difficulty` — the catalogue's difficulty stamps are
 * prose backed by a thousand-run matrix, and a self-declared one would be a
 * claim nobody measured. */
export interface CountryDossier {
  byline: string
  summary: string
  opportunities: string[]
  pressures: string[]
}

export interface CountryDocument {
  format: typeof COUNTRY_DOCUMENT_FORMAT
  version: number
  /** which age shape the pyramid is rebuilt from on import */
  ageShape: CountryArchetypeId
  /** the vector, written without `pyramid` — `countryFromDocument` derives it */
  params: CountryParams
  dossier: CountryDossier
}

/** Significant digits kept when a draft is written down. Six is past anything
 * an editor can express and short enough that a document stays readable. */
const SIG_DIGITS = 6

const round = (n: number): number =>
  Number.isFinite(n) ? Number(n.toPrecision(SIG_DIGITS)) : n

function roundRecord<K extends string>(source: Record<K, number>, ids: readonly K[]): Record<K, number> {
  return Object.fromEntries(ids.map((id) => [id, round(source[id])])) as Record<K, number>
}

function roundStructure(structure: CountryStructure): CountryStructure {
  return {
    outputMix: roundRecord(structure.outputMix, SECTOR_IDS),
    employmentMix: roundRecord(structure.employmentMix, SECTOR_IDS),
    capitalMix: roundRecord(structure.capitalMix, SECTOR_IDS),
    debtToGdp: round(structure.debtToGdp),
    creditToGdp: round(structure.creditToGdp),
    reserveCoverage: round(structure.reserveCoverage),
    institutions: roundRecord(structure.institutions, INSTITUTION_IDS),
  }
}

function cleanText(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string') throw new InvalidCountryError(`${label} is not text`)
  // control characters and newlines collapse to spaces: a dossier is a caption,
  // not a document, and a stray newline reflows a card someone else is reading
  const flat = value.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim()
  return flat.slice(0, max)
}

function cleanNotes(value: unknown, label: string): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new InvalidCountryError(`${label} is not a list`)
  return value
    .slice(0, MAX_NOTES)
    .map((note, i) => cleanText(note, MAX_NOTE, `${label}[${i}]`))
    .filter((note) => note.length > 0)
}

/**
 * Write a draft down. The returned document is the authoritative version of
 * the country from here on — store it, share it, and materialize params from
 * it, so the author plays exactly what their readers will.
 */
export function createCountryDocument(
  params: CountryParams,
  ageShape: CountryArchetypeId,
  dossier: Partial<CountryDossier> = {},
): CountryDocument {
  if (!COUNTRY_ARCHETYPE_IDS.includes(ageShape)) {
    throw new InvalidCountryError(`unknown age shape '${ageShape}'`)
  }
  const written: CountryParams = {
    name: cleanText(params.name, MAX_NAME, 'name'),
    development: round(params.development),
    openness: round(params.openness),
    capacities: roundRecord(params.capacities, CAPACITY_IDS),
    cohortSizes: roundRecord(params.cohortSizes, COHORT_IDS),
    enfranchisement: roundRecord(params.enfranchisement, COHORT_IDS),
    ...(params.structure ? { structure: roundStructure(params.structure) } : {}),
    authored: true,
  }
  // validate the vector the way an importer will see it, so a document that
  // cannot be opened is never written in the first place
  validateCountryParams({ ...written, pyramid: pyramidFor(written.cohortSizes, ageShape) })
  return {
    format: COUNTRY_DOCUMENT_FORMAT,
    version: COUNTRY_DOCUMENT_VERSION,
    ageShape,
    params: written,
    dossier: {
      byline: cleanText(dossier.byline ?? 'An authored posting', MAX_BYLINE, 'byline'),
      summary: cleanText(
        dossier.summary ?? 'A 1946 settlement nobody has balanced.',
        MAX_SUMMARY,
        'summary',
      ),
      opportunities: cleanNotes(dossier.opportunities, 'opportunities'),
      pressures: cleanNotes(dossier.pressures, 'pressures'),
    },
  }
}

/** Materialize the playable vector. `authored` is forced on here rather than
 * trusted from the file: a document is by definition not a catalogue recipe,
 * and the flag is what makes a report card admit that. */
export function countryFromDocument(doc: CountryDocument): CountryParams {
  return {
    ...doc.params,
    pyramid: pyramidFor(doc.params.cohortSizes, doc.ageShape),
    authored: true,
  }
}

function numberField(source: Record<string, unknown>, key: string, label: string): number {
  const value = source[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidCountryError(`${label} is not a finite number`)
  }
  return value
}

function numberRecord<K extends string>(
  raw: unknown,
  ids: readonly K[],
  label: string,
): Record<K, number> {
  if (raw === null || typeof raw !== 'object') throw new InvalidCountryError(`${label} is missing`)
  const source = raw as Record<string, unknown>
  return Object.fromEntries(
    ids.map((id) => [id, numberField(source, id, `${label}.${id}`)]),
  ) as Record<K, number>
}

function readStructure(raw: unknown): CountryStructure {
  if (raw === null || typeof raw !== 'object') throw new InvalidCountryError('structure is not an object')
  const source = raw as Record<string, unknown>
  return {
    outputMix: numberRecord(source.outputMix, SECTOR_IDS, 'structure.outputMix'),
    employmentMix: numberRecord(source.employmentMix, SECTOR_IDS, 'structure.employmentMix'),
    capitalMix: numberRecord(source.capitalMix, SECTOR_IDS, 'structure.capitalMix'),
    debtToGdp: numberField(source, 'debtToGdp', 'structure.debtToGdp'),
    creditToGdp: numberField(source, 'creditToGdp', 'structure.creditToGdp'),
    reserveCoverage: numberField(source, 'reserveCoverage', 'structure.reserveCoverage'),
    institutions: numberRecord(source.institutions, INSTITUTION_IDS, 'structure.institutions'),
  }
}

/**
 * Read a document somebody else wrote. Rebuilds the object field by field
 * rather than casting the parsed JSON, so nothing unexpected survives into the
 * engine, and throws `InvalidCountryError` with a reason a UI can show.
 */
export function parseCountryDocument(raw: unknown): CountryDocument {
  if (raw === null || typeof raw !== 'object') throw new InvalidCountryError('not a country document')
  const source = raw as Record<string, unknown>

  if (source.format !== COUNTRY_DOCUMENT_FORMAT) {
    throw new InvalidCountryError('not a Terrarium country document')
  }
  const version = source.version
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new InvalidCountryError('document version is missing or malformed')
  }
  if (version > COUNTRY_DOCUMENT_VERSION) {
    throw new InvalidCountryError(
      `document is version ${version}; this build reads up to ${COUNTRY_DOCUMENT_VERSION}`,
    )
  }

  const ageShape = source.ageShape
  if (typeof ageShape !== 'string' || !COUNTRY_ARCHETYPE_IDS.includes(ageShape as CountryArchetypeId)) {
    throw new InvalidCountryError(
      `age shape must be one of ${COUNTRY_ARCHETYPE_IDS.join(', ')}`,
    )
  }

  if (source.params === null || typeof source.params !== 'object') {
    throw new InvalidCountryError('document carries no parameters')
  }
  const rawParams = source.params as Record<string, unknown>

  const params: CountryParams = {
    name: cleanText(rawParams.name, MAX_NAME, 'name'),
    development: numberField(rawParams, 'development', 'development'),
    openness: numberField(rawParams, 'openness', 'openness'),
    capacities: numberRecord(rawParams.capacities, CAPACITY_IDS, 'capacities'),
    cohortSizes: numberRecord(rawParams.cohortSizes, COHORT_IDS, 'cohortSizes'),
    enfranchisement: numberRecord(rawParams.enfranchisement, COHORT_IDS, 'enfranchisement'),
    ...(rawParams.structure !== undefined ? { structure: readStructure(rawParams.structure) } : {}),
    authored: true,
  }
  if (!params.name) throw new InvalidCountryError('country name is blank')

  const dossierRaw = (source.dossier ?? {}) as Record<string, unknown>
  const doc: CountryDocument = {
    format: COUNTRY_DOCUMENT_FORMAT,
    version,
    ageShape: ageShape as CountryArchetypeId,
    params,
    dossier: {
      byline: cleanText(dossierRaw.byline ?? 'An authored posting', MAX_BYLINE, 'byline'),
      summary: cleanText(
        dossierRaw.summary ?? 'A 1946 settlement nobody has balanced.',
        MAX_SUMMARY,
        'summary',
      ),
      opportunities: cleanNotes(dossierRaw.opportunities, 'opportunities'),
      pressures: cleanNotes(dossierRaw.pressures, 'pressures'),
    },
  }

  // the same gate init would apply, applied before anything is started, so an
  // out-of-range document fails at the door with a readable reason
  validateCountryParams(countryFromDocument(doc))
  return doc
}
