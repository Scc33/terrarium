/**
 * Reproducible exploration of the country input space.
 *
 * A fuzz case is still an ordinary country document plus the three seeds that
 * created the country, drove the simulation, and drove the policy. The sampler
 * never manufactures live state. That keeps every failure replayable through
 * the same init -> applyActions -> step loop as a game.
 */

import {
  CAPACITY_IDS,
  COHORT_IDS,
  COUNTRY_ARCHETYPE_IDS,
  COUNTRY_DRAFT_DOMAIN,
  ENGINE_VERSION,
  INSTITUTION_IDS,
  InvariantError,
  SCHEMA_VERSION,
  SECTOR_IDS,
  countryFromDocument,
  createCountryDocument,
  createCountryParams,
  createSave,
  gameRules,
  generateCountryParams,
  materializeStructure,
  parseCountryDocument,
  pyramidFor,
  rngFor,
  validate,
  type ActionLog,
  type CountryArchetypeId,
  type CountryDocument,
  type CountryParams,
  type CuratedCountryId,
  type GameMode,
  type GameRules,
  type Rng,
  type TrueState,
} from '@terrarium/engine'
import { policyFor, type PolicyId } from './policies'
import { runSummary, type RunSummary } from './run'

export const COUNTRY_FUZZ_PROFILES = ['recipe', 'draft', 'edges'] as const
export type CountryFuzzProfile = (typeof COUNTRY_FUZZ_PROFILES)[number]

export interface CountryFuzzSeeds {
  country: string
  simulation: string
  policy: string
}

export interface SampledCountry {
  caseId: string
  index: number
  profile: CountryFuzzProfile
  ageShape: CountryArchetypeId
  seeds: CountryFuzzSeeds
  document: CountryDocument
  /** Materialized from document, so the artifact and the run are identical. */
  params: CountryParams
}

export type CountryFuzzFinding =
  | { kind: 'price'; tick: number; sector: string; value: number }
  | { kind: 'deposition'; tick: number }

export interface CountryFuzzFailureArtifact {
  format: 'terrarium-country-fuzz-failure'
  version: 1
  engine: { version: string; schema: number }
  sample: Omit<SampledCountry, 'params' | 'document'>
  country: CountryDocument
  policy: PolicyId
  rules: GameRules
  requestedTicks: number
  failure: {
    kind: 'invariant' | 'price' | 'exception'
    tick: number
    error: string
    message: string
  }
  /** Replays the accepted actions up to the quarter that exposed the failure. */
  save: ReturnType<typeof createSave>
}

export type CountryFuzzOutcome =
  | {
      sample: SampledCountry
      summary: RunSummary
      findings: CountryFuzzFinding[]
      failure: null
    }
  | {
      sample: SampledCountry
      summary: null
      findings: CountryFuzzFinding[]
      failure: CountryFuzzFailureArtifact
    }

export interface CountryFuzzRunOptions {
  ticks: number
  policy: PolicyId
  /** Recipe samples retain the batch runner's price tripwire by default.
   * Draft and edge samples report it as a finding rather than declaring every
   * validator-legal but economically wild country broken. */
  strictPrices?: boolean
  rules?: GameMode | Partial<GameRules>
  /** Extra hypothesis-specific oracle for a research sweep. The standing
   * engine validator always runs first. */
  checkState?(state: TrueState): void
}

export interface CountryFuzzSweepOptions extends CountryFuzzRunOptions {
  cases: number
  profile: CountryFuzzProfile
  seedPrefix?: string
}

export interface CountryFuzzSweepResult {
  outcomes: CountryFuzzOutcome[]
  wallMs: number
}

const ARCHETYPE_ANCHOR: Record<CountryArchetypeId, CuratedCountryId> = {
  balanced: 'meridia',
  agrarian: 'costona',
  industrial: 'veltravia',
  maritime: 'oranga',
  resource: 'kestrel',
}

const pick = <T>(rng: Rng, values: readonly T[]): T =>
  values[Math.floor(rng.next() * values.length)]

function draw(
  rng: Rng,
  range: { readonly min: number; readonly max: number },
  profile: Exclude<CountryFuzzProfile, 'recipe'>,
): number {
  if (profile === 'draft') return rng.range(range.min, range.max)
  const span = range.max - range.min
  return pick(rng, [
    range.min,
    range.max,
    range.min + span * 0.01,
    range.max - span * 0.01,
    range.min + span * 0.5,
  ])
}

export function countryFuzzSeeds(prefix: string, index: number): CountryFuzzSeeds {
  return {
    country: `${prefix}:country:${index}`,
    simulation: `${prefix}:simulation:${index}`,
    policy: `${prefix}:policy:${index}`,
  }
}

/** Produce one country document. The document is materialized back into params
 * before returning: six-digit document rounding is therefore part of the case,
 * and the artifact can never describe a subtly different country from the one
 * that actually ran. */
export function sampleCountry(
  profile: CountryFuzzProfile,
  index: number,
  seedPrefix = 'country-fuzz',
): SampledCountry {
  const seeds = countryFuzzSeeds(seedPrefix, index)
  const rng = rngFor(seeds.country, 'runner:country-fuzz', 0)
  const ageShape = pick(rng, COUNTRY_ARCHETYPE_IDS)
  let params: CountryParams

  if (profile === 'recipe') {
    params = generateCountryParams(seeds.country, { archetype: ageShape })
  } else {
    params = materializeStructure(createCountryParams(ARCHETYPE_ANCHOR[ageShape], seeds.country))
    params.name = `Fuzz ${profile} ${index}`
    params.development = draw(rng, COUNTRY_DRAFT_DOMAIN.development, profile)
    params.openness = draw(rng, COUNTRY_DRAFT_DOMAIN.openness, profile)
    for (const id of CAPACITY_IDS) {
      params.capacities[id] = draw(rng, COUNTRY_DRAFT_DOMAIN.capacity, profile)
    }
    for (const id of COHORT_IDS) {
      params.cohortSizes[id] = draw(rng, COUNTRY_DRAFT_DOMAIN.cohortSize, profile)
      params.enfranchisement[id] = draw(rng, COUNTRY_DRAFT_DOMAIN.enfranchisement, profile)
    }
    for (const id of SECTOR_IDS) {
      params.structure!.outputMix[id] = draw(rng, COUNTRY_DRAFT_DOMAIN.sectorMix, profile)
      params.structure!.employmentMix[id] = draw(rng, COUNTRY_DRAFT_DOMAIN.sectorMix, profile)
      params.structure!.capitalMix[id] = draw(rng, COUNTRY_DRAFT_DOMAIN.sectorMix, profile)
    }
    params.structure!.debtToGdp = draw(rng, COUNTRY_DRAFT_DOMAIN.debtToGdp, profile)
    params.structure!.creditToGdp = draw(rng, COUNTRY_DRAFT_DOMAIN.creditToGdp, profile)
    params.structure!.reserveCoverage = draw(rng, COUNTRY_DRAFT_DOMAIN.reserveCoverage, profile)
    for (const id of INSTITUTION_IDS) {
      params.structure!.institutions[id] = draw(rng, COUNTRY_DRAFT_DOMAIN.institution, profile)
    }
    params.pyramid = pyramidFor(params.cohortSizes, ageShape)
  }

  const caseId = `${profile}-${String(index).padStart(4, '0')}`
  const document = parseCountryDocument(JSON.parse(JSON.stringify(
    createCountryDocument(params, ageShape, {
      byline: `Programmatic ${profile} sample`,
      summary: `Reproducible country-space case ${caseId}, generated from ${seeds.country}.`,
    }),
  )))
  return {
    caseId,
    index,
    profile,
    ageShape,
    seeds,
    document,
    params: countryFromDocument(document),
  }
}

class CheckedStateFailure extends Error {
  constructor(
    readonly kind: 'invariant' | 'price' | 'exception',
    readonly tick: number,
    readonly originalName: string,
    message: string,
  ) {
    super(message)
  }
}

function checkedStateFailure(error: unknown, tick: number): CheckedStateFailure {
  if (error instanceof CheckedStateFailure) return error
  if (error instanceof InvariantError) {
    return new CheckedStateFailure('invariant', tick, error.name, error.message)
  }
  if (error instanceof Error) {
    return new CheckedStateFailure('exception', tick, error.name, error.message)
  }
  return new CheckedStateFailure('exception', tick, typeof error, String(error))
}

export function runCountryFuzzCase(
  sample: SampledCountry,
  options: CountryFuzzRunOptions,
): CountryFuzzOutcome {
  const actionLog: ActionLog = []
  const findings: CountryFuzzFinding[] = []
  const strictPrices = options.strictPrices ?? sample.profile === 'recipe'
  const rules = gameRules(options.rules ?? 'standard')
  let lastObservedTick = 0
  let firstPrice: Extract<CountryFuzzFinding, { kind: 'price' }> | null = null

  try {
    const summary = runSummary({
      params: sample.params,
      seed: sample.seeds.simulation,
      policySeed: sample.seeds.policy,
      ticks: options.ticks,
      policy: policyFor(options.policy),
      rules,
      observer: {
        onActions: (turn) => actionLog.push(turn),
        afterStep: (state) => {
          lastObservedTick = state.meta.tick
          try {
            validate(state)
            options.checkState?.(state)
          } catch (error) {
            throw checkedStateFailure(error, state.meta.tick)
          }
          for (const id of SECTOR_IDS) {
            const value = state.market.prices[id]
            if (value > 50 || value < 0.02) {
              firstPrice ??= { kind: 'price', tick: state.meta.tick, sector: id, value }
              if (strictPrices) {
                throw new CheckedStateFailure(
                  'price',
                  state.meta.tick,
                  'PriceTripwire',
                  `price[${id}] = ${value} is outside [0.02,50]`,
                )
              }
              break
            }
          }
        },
      },
    })

    if (firstPrice) findings.push(firstPrice)
    if (summary.deposedAt !== null) findings.push({ kind: 'deposition', tick: summary.deposedAt })
    return { sample, summary, findings, failure: null }
  } catch (error) {
    const failure = checkedStateFailure(error, Math.min(options.ticks, lastObservedTick + 1))
    if (firstPrice && failure.kind !== 'price') findings.push(firstPrice)
    const save = createSave(sample.params, sample.seeds.simulation, actionLog, failure.tick, rules)
    return {
      sample,
      summary: null,
      findings,
      failure: {
        format: 'terrarium-country-fuzz-failure',
        version: 1,
        engine: { version: ENGINE_VERSION, schema: SCHEMA_VERSION },
        sample: {
          caseId: sample.caseId,
          index: sample.index,
          profile: sample.profile,
          ageShape: sample.ageShape,
          seeds: sample.seeds,
        },
        country: sample.document,
        policy: options.policy,
        rules,
        requestedTicks: options.ticks,
        failure: {
          kind: failure.kind,
          tick: failure.tick,
          error: failure.originalName,
          message: failure.message,
        },
        save,
      },
    }
  }
}

export function runCountryFuzzSweep(options: CountryFuzzSweepOptions): CountryFuzzSweepResult {
  if (!Number.isInteger(options.cases) || options.cases <= 0) {
    throw new Error(`cases must be a positive integer, got ${options.cases}`)
  }
  if (!Number.isInteger(options.ticks) || options.ticks <= 0) {
    throw new Error(`ticks must be a positive integer, got ${options.ticks}`)
  }
  const started = performance.now()
  const outcomes = Array.from({ length: options.cases }, (_, index) =>
    runCountryFuzzCase(
      sampleCountry(options.profile, index, options.seedPrefix),
      options,
    ),
  )
  return { outcomes, wallMs: performance.now() - started }
}
