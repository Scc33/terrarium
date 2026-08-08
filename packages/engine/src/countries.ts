/**
 * Replayable country scenarios.
 *
 * A scenario is still only immutable CountryParams plus a seed. Curated
 * countries are fixed parameter vectors; procedural countries draw the same
 * vector from bounded archetype recipes. Nothing here sets live GDP, prices,
 * or politics after init — countries have to live through the ordinary
 * pipeline like every other game.
 */

import { clamp } from './math'
import { rngFor, type Rng, type Seed } from './rng/rng'
import {
  AGE_BANDS,
  CAPACITY_IDS,
  COHORT_IDS,
  INSTITUTION_IDS,
  RETIREMENT_BAND,
  SECTOR_IDS,
  type CountryParams,
  type CountryStructure,
  type InstitutionId,
  type SectorId,
} from './state/schema'

export const CURATED_COUNTRY_IDS = ['meridia', 'costona', 'veltravia', 'oranga', 'kestrel'] as const
export type CuratedCountryId = (typeof CURATED_COUNTRY_IDS)[number]
export type CountryScenarioId = CuratedCountryId | 'procedural'

export const COUNTRY_ARCHETYPE_IDS = ['balanced', 'agrarian', 'industrial', 'maritime', 'resource'] as const
export type CountryArchetypeId = (typeof COUNTRY_ARCHETYPE_IDS)[number]

export type CountryDifficulty = 'introductory' | 'standard' | 'hard' | 'severe'

/** Safe, static presentation metadata. The UI may read this catalogue; only
 * the worker calls createCountryParams and touches the actual parameter vector. */
export interface CountryProfile {
  id: CountryScenarioId
  name: string
  byline: string
  summary: string
  difficulty: CountryDifficulty
  population: number | null
  development: number | null
  openness: number | null
  opportunities: readonly string[]
  pressures: readonly string[]
}

const PROFILES: Record<CountryScenarioId, CountryProfile> = {
  meridia: {
    id: 'meridia',
    name: 'Meridia',
    byline: 'The uneven republic',
    summary: 'A broad rural economy, a growing industrial belt, and a state that can just about see itself.',
    difficulty: 'introductory',
    population: 27.5,
    development: 0.35,
    openness: 1,
    opportunities: ['Balanced productive base', 'Room for demographic dividend'],
    pressures: ['Weak surveys', 'Large rural constituency'],
  },
  costona: {
    id: 'costona',
    name: 'Costona',
    byline: 'The landowners’ settlement',
    summary: 'A young agrarian giant whose tax rolls end where the estates begin.',
    difficulty: 'hard',
    population: 38.2,
    development: 0.24,
    openness: 0.68,
    opportunities: ['Large labor reserve', 'Agricultural export base'],
    pressures: ['Thin state capacity', 'Entrenched landed power'],
  },
  veltravia: {
    id: 'veltravia',
    name: 'Veltravia',
    byline: 'The reconstruction ministry',
    summary: 'An industrial country with skilled workers, scarred balance sheets, and an organized electorate.',
    difficulty: 'standard',
    population: 33,
    development: 0.52,
    openness: 0.94,
    opportunities: ['Deep industrial plant', 'Educated urban workforce'],
    pressures: ['Heavy public debt', 'Powerful veto blocs'],
  },
  oranga: {
    id: 'oranga',
    name: 'Oranga',
    byline: 'The open harbor',
    summary: 'A small maritime republic that is rich in connections and poor in insulation.',
    difficulty: 'standard',
    population: 8.8,
    development: 0.43,
    openness: 1.55,
    opportunities: ['Capable civil service', 'Trade-led catch-up'],
    pressures: ['World-cycle exposure', 'Narrow domestic market'],
  },
  kestrel: {
    id: 'kestrel',
    name: 'Kestrel',
    byline: 'The concession state',
    summary: 'Energy rents finance a coercive state while the rest of the productive base waits to be built.',
    difficulty: 'severe',
    population: 17.2,
    development: 0.3,
    openness: 1.25,
    opportunities: ['Energy export engine', 'Strong treasury apparatus'],
    pressures: ['Concentrated capital', 'Repressive political inheritance'],
  },
  procedural: {
    id: 'procedural',
    name: 'Unopened Posting',
    byline: 'A country drawn from the dispatch pouch',
    summary: 'A reproducible country assembled from one of five bounded structural archetypes.',
    difficulty: 'hard',
    population: null,
    development: null,
    openness: null,
    opportunities: ['Unknown until the seal is broken'],
    pressures: ['No rehearsed opening'],
  },
}

export const COUNTRY_CATALOG: readonly CountryProfile[] = [
  ...CURATED_COUNTRY_IDS.map((id) => PROFILES[id]),
  PROFILES.procedural,
]

type CohortSizes = CountryParams['cohortSizes']
const STANDARD_PYRAMID = [
  3.6, 3.2, 2.8,
  2.45, 2.2, 1.95, 1.75, 1.55, 1.4, 1.3, 1.2, 1.1,
  1.05, 0.85, 0.6, 0.35, 0.15,
]

const AGE_SHAPES: Record<CountryArchetypeId, readonly number[]> = {
  balanced: STANDARD_PYRAMID,
  agrarian: [4.8, 4.2, 3.6, 2.9, 2.5, 2.1, 1.8, 1.55, 1.3, 1.1, 0.9, 0.75, 0.6, 0.42, 0.25, 0.12, 0.05],
  industrial: [2.5, 2.4, 2.3, 2.25, 2.2, 2.1, 2, 1.9, 1.8, 1.65, 1.5, 1.35, 1.25, 1.05, 0.8, 0.5, 0.25],
  maritime: [2.9, 2.7, 2.45, 2.3, 2.15, 2, 1.8, 1.65, 1.5, 1.35, 1.2, 1.05, 0.9, 0.7, 0.5, 0.3, 0.15],
  resource: [3.9, 3.5, 3.1, 2.6, 2.25, 1.95, 1.7, 1.5, 1.3, 1.1, 0.95, 0.8, 0.65, 0.45, 0.28, 0.15, 0.07],
}

function record<T extends string, V>(ids: readonly T[], values: readonly V[]): Record<T, V> {
  return Object.fromEntries(ids.map((id, i) => [id, values[i]])) as Record<T, V>
}

function sectorMix(values: readonly number[]): Record<SectorId, number> {
  return record(SECTOR_IDS, values)
}

function institutions(values: readonly number[]): Record<InstitutionId, number> {
  return record(INSTITUTION_IDS, values)
}

function pyramidFor(cohorts: CohortSizes, archetype: CountryArchetypeId): number[] {
  const weights = AGE_SHAPES[archetype]
  const working = COHORT_IDS.filter((id) => id !== 'retirees').reduce((sum, id) => sum + cohorts[id], 0)
  const retired = cohorts.retirees
  const workingWeight = weights.slice(0, RETIREMENT_BAND).reduce((a, b) => a + b, 0)
  const retiredWeight = weights.slice(RETIREMENT_BAND).reduce((a, b) => a + b, 0)
  return weights.map((weight, i) =>
    i < RETIREMENT_BAND ? (weight * working) / workingWeight : (weight * retired) / retiredWeight,
  )
}

function structure(
  output: readonly number[],
  employment: readonly number[],
  capital: readonly number[],
  finance: readonly [number, number, number],
  stocks: readonly number[],
): CountryStructure {
  return {
    outputMix: sectorMix(output),
    employmentMix: sectorMix(employment),
    capitalMix: sectorMix(capital),
    debtToGdp: finance[0],
    creditToGdp: finance[1],
    reserveCoverage: finance[2],
    institutions: institutions(stocks),
  }
}

function withPyramid(
  params: Omit<CountryParams, 'pyramid'>,
  archetype: CountryArchetypeId,
): CountryParams {
  return { ...params, pyramid: pyramidFor(params.cohortSizes, archetype) }
}

/** The exact historical baseline. Keeping it literal protects the golden and
 * the passive-century claim while other countries exercise wider terrain. */
export const MERIDIA_PARAMS: CountryParams = {
  name: 'Meridia',
  development: 0.35,
  openness: 1,
  capacities: { tax: 0.25, statistical: 0.18, administrative: 0.3, education: 0.2 },
  cohortSizes: {
    rural_workers: 12,
    urban_workers: 8,
    professionals: 3,
    business_owners: 1.5,
    retirees: 3,
  },
  enfranchisement: {
    rural_workers: 0.6,
    urban_workers: 0.8,
    professionals: 1,
    business_owners: 1,
    retirees: 0.9,
  },
  pyramid: STANDARD_PYRAMID,
}

const CURATED: Record<CuratedCountryId, CountryParams> = {
  meridia: MERIDIA_PARAMS,
  costona: withPyramid({
    name: 'Costona',
    development: 0.24,
    openness: 0.68,
    capacities: { tax: 0.15, statistical: 0.09, administrative: 0.18, education: 0.09 },
    cohortSizes: { rural_workers: 22, urban_workers: 8.4, professionals: 2.4, business_owners: 1.2, retirees: 4.2 },
    enfranchisement: { rural_workers: 0.35, urban_workers: 0.65, professionals: 1, business_owners: 1, retirees: 0.8 },
    structure: structure(
      [1.65, 0.58, 0.72, 0.7, 0.62],
      [1.48, 0.72, 0.85, 0.72, 0.7],
      [1.18, 0.55, 0.7, 0.68, 0.6],
      [0.22, 0.22, 1.5],
      [0, 0.08, 0.03, 0.12, 0.28],
    ),
  }, 'agrarian'),
  veltravia: withPyramid({
    name: 'Veltravia',
    development: 0.52,
    openness: 0.94,
    capacities: { tax: 0.48, statistical: 0.44, administrative: 0.5, education: 0.48 },
    cohortSizes: { rural_workers: 5.8, urban_workers: 13.2, professionals: 5.1, business_owners: 2, retirees: 6.9 },
    enfranchisement: { rural_workers: 0.82, urban_workers: 0.92, professionals: 1, business_owners: 1, retirees: 1 },
    structure: structure(
      [0.48, 1.5, 1.22, 1.04, 1.25],
      [0.58, 1.38, 1.12, 1.08, 1.2],
      [0.45, 1.48, 1.32, 0.98, 1.35],
      [0.66, 0.56, 2.5],
      [0.05, 0.38, 0.34, 0.46, 0.1],
    ),
  }, 'industrial'),
  oranga: withPyramid({
    name: 'Oranga',
    development: 0.43,
    openness: 1.55,
    capacities: { tax: 0.42, statistical: 0.52, administrative: 0.55, education: 0.4 },
    cohortSizes: { rural_workers: 1.8, urban_workers: 3.2, professionals: 1.5, business_owners: 0.8, retirees: 1.5 },
    enfranchisement: { rural_workers: 0.8, urban_workers: 0.95, professionals: 1, business_owners: 1, retirees: 1 },
    structure: structure(
      [0.5, 0.85, 0.72, 1.42, 1.8],
      [0.55, 0.82, 0.75, 1.38, 1.55],
      [0.48, 0.82, 0.7, 1.35, 1.72],
      [0.28, 0.48, 4.5],
      [0.08, 0.44, 0.3, 0.52, 0.05],
    ),
  }, 'maritime'),
  kestrel: withPyramid({
    name: 'Kestrel',
    development: 0.3,
    openness: 1.25,
    capacities: { tax: 0.38, statistical: 0.16, administrative: 0.42, education: 0.14 },
    cohortSizes: { rural_workers: 6.5, urban_workers: 5.4, professionals: 1.8, business_owners: 1.1, retirees: 2.4 },
    enfranchisement: { rural_workers: 0.28, urban_workers: 0.5, professionals: 0.9, business_owners: 1, retirees: 0.7 },
    structure: structure(
      [0.78, 0.62, 2.65, 0.72, 0.9],
      [1.05, 0.75, 1.28, 0.72, 0.9],
      [0.62, 0.58, 2.85, 0.7, 0.95],
      [0.18, 0.38, 3.8],
      [0, 0.1, 0.04, 0.24, 0.58],
    ),
  }, 'resource'),
}

const PROCEDURAL_NAMES: Record<CountryArchetypeId, readonly string[]> = {
  balanced: ['Arcadia', 'Meridia', 'Sellandia', 'Tavor'],
  agrarian: ['Costona', 'Darsun', 'Almora', 'San Cordel'],
  industrial: ['Veltravia', 'Rhemark', 'Drevnia', 'North Vey'],
  maritime: ['Oranga', 'Port Sel', 'Maravia', 'The Aster Isles'],
  resource: ['Kestrel', 'Azara', 'Qamar', 'Vardos'],
}

const LEGACY_NAMES = ['Arcadia', 'Meridia', 'Costona', 'Veltravia', 'Kestrel', 'Oranga', 'Sellandia', 'Tavor']

/**
 * The schema-12 baseline generator, retained as the stable sampling frame for
 * golden-era properties and instrument calibration. New games that request
 * the `procedural` scenario use generateCountryParams below; callers that have
 * always used generateParams continue to measure the same neighborhood.
 */
export function generateParams(seed: Seed): CountryParams {
  const rng = rngFor(seed, 'genParams', 0)
  const popScale = rng.range(0.85, 1.15)
  const cohortSizes = {
    rural_workers: 12 * popScale * rng.range(0.9, 1.1),
    urban_workers: 8 * popScale * rng.range(0.9, 1.1),
    professionals: 3 * popScale * rng.range(0.9, 1.1),
    business_owners: 1.5 * popScale,
    retirees: 3 * popScale * rng.range(0.9, 1.1),
  }
  return {
    name: LEGACY_NAMES[Math.floor(rng.next() * LEGACY_NAMES.length)],
    development: rng.range(0.28, 0.45),
    openness: rng.range(0.8, 1.2),
    capacities: {
      tax: rng.range(0.18, 0.3),
      statistical: rng.range(0.12, 0.25),
      administrative: rng.range(0.22, 0.35),
      education: rng.range(0.12, 0.28),
    },
    cohortSizes,
    enfranchisement: {
      rural_workers: 0.6,
      urban_workers: 0.8,
      professionals: 1,
      business_owners: 1,
      retirees: 0.9,
    },
    pyramid: pyramidFor(cohortSizes, 'balanced'),
  }
}

export interface ProceduralCountryOptions {
  archetype?: CountryArchetypeId
  /** 0 makes the archetype's curated anchor; 1 uses the full bounded spread */
  variability?: number
  name?: string
}

function cloneParams(params: CountryParams): CountryParams {
  return {
    ...params,
    capacities: { ...params.capacities },
    cohortSizes: { ...params.cohortSizes },
    enfranchisement: { ...params.enfranchisement },
    pyramid: params.pyramid ? [...params.pyramid] : undefined,
    structure: params.structure
      ? {
          ...params.structure,
          outputMix: { ...params.structure.outputMix },
          employmentMix: { ...params.structure.employmentMix },
          capitalMix: { ...params.structure.capitalMix },
          institutions: { ...params.structure.institutions },
        }
      : undefined,
  }
}

function jitter(rng: Rng, value: number, spread: number, variability: number, lo: number, hi: number): number {
  return clamp(value * (1 + rng.range(-spread, spread) * variability), lo, hi)
}

const ARCHETYPE_ANCHOR: Record<CountryArchetypeId, CuratedCountryId> = {
  balanced: 'meridia',
  agrarian: 'costona',
  industrial: 'veltravia',
  maritime: 'oranga',
  resource: 'kestrel',
}

/** Generate one bounded, deterministic parameter vector. Different seeds may
 * change every opening condition, but never the schema or the simulation RNG
 * substreams that later drive the country. */
export function generateCountryParams(seed: Seed, options: ProceduralCountryOptions = {}): CountryParams {
  const rng = rngFor(seed, 'country:recipe', 0)
  const archetype = options.archetype ?? COUNTRY_ARCHETYPE_IDS[Math.floor(rng.next() * COUNTRY_ARCHETYPE_IDS.length)]
  const variability = clamp(options.variability ?? 1, 0, 1)
  const base = cloneParams(CURATED[ARCHETYPE_ANCHOR[archetype]])
  const popScale = jitter(rng, 1, 0.32, variability, 0.55, 1.55)

  base.name = options.name ?? PROCEDURAL_NAMES[archetype][Math.floor(rng.next() * PROCEDURAL_NAMES[archetype].length)]
  base.development = jitter(rng, base.development, 0.22, variability, 0.16, 0.72)
  base.openness = jitter(rng, base.openness, 0.25, variability, 0.35, 1.9)

  for (const id of CAPACITY_IDS) {
    base.capacities[id] = jitter(rng, base.capacities[id], 0.3, variability, 0.04, 0.72)
  }
  for (const id of COHORT_IDS) {
    const classJitter = jitter(rng, 1, 0.12, variability, 0.78, 1.22)
    base.cohortSizes[id] *= popScale * classJitter
  }
  for (const id of COHORT_IDS) {
    base.enfranchisement[id] = jitter(rng, base.enfranchisement[id], 0.14, variability, 0.15, 1)
  }
  base.pyramid = pyramidFor(base.cohortSizes, archetype)

  if (base.structure) {
    for (const id of SECTOR_IDS) {
      base.structure.outputMix[id] = jitter(rng, base.structure.outputMix[id], 0.12, variability, 0.3, 3.2)
      base.structure.employmentMix[id] = jitter(rng, base.structure.employmentMix[id], 0.12, variability, 0.3, 2.2)
      base.structure.capitalMix[id] = jitter(rng, base.structure.capitalMix[id], 0.12, variability, 0.3, 3.4)
    }
    base.structure.debtToGdp = jitter(rng, base.structure.debtToGdp, 0.3, variability, 0.08, 0.9)
    base.structure.creditToGdp = jitter(rng, base.structure.creditToGdp, 0.25, variability, 0.12, 0.8)
    base.structure.reserveCoverage = jitter(rng, base.structure.reserveCoverage, 0.25, variability, 0.8, 6)
    for (const id of INSTITUTION_IDS) {
      base.structure.institutions[id] = jitter(rng, base.structure.institutions[id], 0.2, variability, 0, 0.75)
    }
  }

  validateCountryParams(base)
  return base
}

export function createCountryParams(id: CountryScenarioId, seed: Seed): CountryParams {
  const params = id === 'procedural' ? generateCountryParams(seed) : cloneParams(CURATED[id])
  validateCountryParams(params)
  return params
}

export function countryProfile(id: CountryScenarioId): CountryProfile {
  return PROFILES[id]
}

export class InvalidCountryError extends Error {}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new InvalidCountryError(`${label} is ${value}`)
}

/** Fail before init can turn a malformed recipe into an opaque NaN 80
 * quarters later. This is also the contract procedural generators must pass. */
export function validateCountryParams(params: CountryParams): void {
  if (!params.name.trim()) throw new InvalidCountryError('country name is blank')
  finite(params.development, 'development')
  finite(params.openness, 'openness')
  if (params.development < 0.05 || params.development > 1) {
    throw new InvalidCountryError(`development ${params.development} outside [0.05,1]`)
  }
  if (params.openness < 0 || params.openness > 2.5) {
    throw new InvalidCountryError(`openness ${params.openness} outside [0,2.5]`)
  }
  for (const id of CAPACITY_IDS) {
    finite(params.capacities[id], `capacities.${id}`)
    if (params.capacities[id] < 0 || params.capacities[id] > 1) {
      throw new InvalidCountryError(`capacities.${id} outside [0,1]`)
    }
  }
  for (const id of COHORT_IDS) {
    finite(params.cohortSizes[id], `cohortSizes.${id}`)
    finite(params.enfranchisement[id], `enfranchisement.${id}`)
    if (params.cohortSizes[id] <= 0) throw new InvalidCountryError(`cohortSizes.${id} must be positive`)
    if (params.enfranchisement[id] < 0 || params.enfranchisement[id] > 1) {
      throw new InvalidCountryError(`enfranchisement.${id} outside [0,1]`)
    }
  }
  if (params.pyramid) {
    if (params.pyramid.length !== AGE_BANDS) throw new InvalidCountryError(`pyramid has ${params.pyramid.length} bands, expected ${AGE_BANDS}`)
    for (const [i, value] of params.pyramid.entries()) {
      finite(value, `pyramid[${i}]`)
      if (value < 0) throw new InvalidCountryError(`pyramid[${i}] is negative`)
    }
    const classes = COHORT_IDS.reduce((sum, id) => sum + params.cohortSizes[id], 0)
    const people = params.pyramid.reduce((sum, value) => sum + value, 0)
    if (Math.abs(classes - people) > Math.max(1e-6, classes * 1e-6)) {
      throw new InvalidCountryError(`pyramid total ${people} does not match cohort total ${classes}`)
    }
  }
  if (!params.structure) return
  for (const field of ['outputMix', 'employmentMix', 'capitalMix'] as const) {
    for (const id of SECTOR_IDS) {
      const value = params.structure[field][id]
      finite(value, `structure.${field}.${id}`)
      if (value <= 0 || value > 4) throw new InvalidCountryError(`structure.${field}.${id} outside (0,4]`)
    }
  }
  for (const [field, lo, hi] of [
    ['debtToGdp', 0, 1.5],
    ['creditToGdp', 0.05, 1.5],
    ['reserveCoverage', 0, 8],
  ] as const) {
    const value = params.structure[field]
    finite(value, `structure.${field}`)
    if (value < lo || value > hi) throw new InvalidCountryError(`structure.${field} outside [${lo},${hi}]`)
  }
  for (const id of INSTITUTION_IDS) {
    const value = params.structure.institutions[id]
    finite(value, `structure.institutions.${id}`)
    if (value < 0 || value > 1) throw new InvalidCountryError(`structure.institutions.${id} outside [0,1]`)
  }
}
