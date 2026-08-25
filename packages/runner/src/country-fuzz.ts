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
  type SectorId,
  type TurnActions,
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
  | { kind: 'price'; tick: number; sector: SectorId; value: number }
  | { kind: 'deposition'; tick: number }

interface CountryFuzzArtifactBase {
  engine: { version: string; schema: number }
  sample: Omit<SampledCountry, 'params' | 'document'>
  country: CountryDocument
  policy: PolicyId
  rules: GameRules
  requestedTicks: number
}

export interface CountryFuzzFindingArtifact extends CountryFuzzArtifactBase {
  format: 'terrarium-country-fuzz-finding'
  version: 1
  finding: CountryFuzzFinding
  /** Replays the accepted actions through the quarter where the finding appeared. */
  save: ReturnType<typeof createSave>
}

export interface CountryFuzzFailureArtifact extends CountryFuzzArtifactBase {
  format: 'terrarium-country-fuzz-failure'
  version: 2
  failure: {
    kind: 'invariant' | 'nan' | 'price' | 'exception'
    tick: number
    phase: CountryFuzzFailurePhase
    error: string
    message: string
  }
  /** The action being applied when an unexpected action error escaped. It is
   * separate from the save because the save contains accepted actions only. */
  attemptedAction: TurnActions | null
  /** Replays the accepted actions up to the quarter that exposed the failure. */
  save: ReturnType<typeof createSave>
}

export type CountryFuzzArtifact = CountryFuzzFindingArtifact | CountryFuzzFailureArtifact

export type CountryFuzzOutcome =
  | {
      sample: SampledCountry
      summary: RunSummary
      findings: CountryFuzzFindingArtifact[]
      failure: null
    }
  | {
      sample: SampledCountry
      summary: null
      findings: CountryFuzzFindingArtifact[]
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

export type CountryFuzzFailurePhase =
  | 'initialization'
  | 'policy'
  | 'action'
  | 'step'
  | 'check'
  | 'post-step'

class CheckedStateFailure extends Error {
  constructor(
    readonly kind: 'invariant' | 'nan' | 'price' | 'exception',
    readonly tick: number,
    readonly phase: CountryFuzzFailurePhase,
    readonly originalName: string,
    message: string,
  ) {
    super(message)
  }
}

function checkedStateFailure(
  error: unknown,
  tick: number,
  phase: CountryFuzzFailurePhase,
): CheckedStateFailure {
  if (error instanceof CheckedStateFailure) return error
  if (error instanceof InvariantError) {
    return new CheckedStateFailure('invariant', tick, phase, error.name, error.message)
  }
  if (error instanceof Error) {
    return new CheckedStateFailure('exception', tick, phase, error.name, error.message)
  }
  return new CheckedStateFailure('exception', tick, phase, typeof error, String(error))
}

function sampleMetadata(sample: SampledCountry): Omit<SampledCountry, 'params' | 'document'> {
  return {
    caseId: sample.caseId,
    index: sample.index,
    profile: sample.profile,
    ageShape: sample.ageShape,
    seeds: sample.seeds,
  }
}

function acceptedActionsThrough(actionLog: ActionLog, tick: number): ActionLog {
  return actionLog
    .filter((turn) => turn.tick < tick)
    .map((turn) => ({ tick: turn.tick, actions: [...turn.actions] }))
}

function appendAcceptedAction(actionLog: ActionLog, turn: TurnActions): void {
  const previous = actionLog.at(-1)
  if (previous?.tick === turn.tick) {
    previous.actions.push(...turn.actions)
  } else {
    actionLog.push({ tick: turn.tick, actions: [...turn.actions] })
  }
}

function artifactBase(
  sample: SampledCountry,
  options: CountryFuzzRunOptions,
  rules: GameRules,
): CountryFuzzArtifactBase {
  return {
    engine: { version: ENGINE_VERSION, schema: SCHEMA_VERSION },
    sample: sampleMetadata(sample),
    country: sample.document,
    policy: options.policy,
    rules,
    requestedTicks: options.ticks,
  }
}

function findingArtifact(
  finding: CountryFuzzFinding,
  sample: SampledCountry,
  options: CountryFuzzRunOptions,
  rules: GameRules,
  actionLog: ActionLog,
): CountryFuzzFindingArtifact {
  return {
    format: 'terrarium-country-fuzz-finding',
    version: 1,
    ...artifactBase(sample, options, rules),
    finding,
    save: createSave(
      sample.params,
      sample.seeds.simulation,
      acceptedActionsThrough(actionLog, finding.tick),
      finding.tick,
      rules,
    ),
  }
}

function firstNonFiniteRunnerValue(state: TrueState): { field: string; value: number } | null {
  const values: [string, number][] = [
    ['flows.realGdp', state.flows.realGdp],
    ['flows.nominalGdp', state.flows.nominalGdp],
    ['flows.inflationQ', state.flows.inflationQ],
    ['flows.unemployment', state.flows.unemployment],
    ...SECTOR_IDS.map((id): [string, number] => [`market.prices.${id}`, state.market.prices[id]]),
  ]
  for (const [field, value] of values) {
    if (!Number.isFinite(value)) return { field, value }
  }
  return null
}

export function runCountryFuzzCase(
  sample: SampledCountry,
  options: CountryFuzzRunOptions,
): CountryFuzzOutcome {
  const actionLog: ActionLog = []
  const findings: CountryFuzzFindingArtifact[] = []
  const strictPrices = options.strictPrices ?? sample.profile === 'recipe'
  const rules = gameRules(options.rules ?? 'standard')
  let lastObservedTick = 0
  let phase: CountryFuzzFailurePhase = 'initialization'
  let attemptedAction: TurnActions | null = null
  let firstPrice: Extract<CountryFuzzFinding, { kind: 'price' }> | null = null
  // Callback mutations are deliberately read through accessors. TypeScript's
  // local control-flow analysis cannot see that runSummary invokes them.
  const currentPhase = (): CountryFuzzFailurePhase => phase

  try {
    const summary = runSummary({
      params: sample.params,
      seed: sample.seeds.simulation,
      policySeed: sample.seeds.policy,
      ticks: options.ticks,
      policy: policyFor(options.policy),
      rules,
      observer: {
        beforeTurn: () => {
          phase = 'policy'
          attemptedAction = null
        },
        onActionAttempt: (turn) => {
          phase = 'action'
          attemptedAction = { tick: turn.tick, actions: [...turn.actions] }
        },
        onActionAccepted: (turn) => {
          appendAcceptedAction(actionLog, turn)
          attemptedAction = null
        },
        afterActions: () => {
          phase = 'step'
          attemptedAction = null
        },
        afterStep: (state) => {
          lastObservedTick = state.meta.tick
          phase = 'check'
          try {
            validate(state)
            options.checkState?.(state)
          } catch (error) {
            throw checkedStateFailure(error, state.meta.tick, phase)
          }
          const nonFinite = firstNonFiniteRunnerValue(state)
          if (nonFinite) {
            throw new CheckedStateFailure(
              'nan',
              state.meta.tick,
              phase,
              'NonFiniteRunnerValue',
              `${nonFinite.field} = ${String(nonFinite.value)} is not finite`,
            )
          }
          for (const id of SECTOR_IDS) {
            const value = state.market.prices[id]
            if (value > 50 || value < 0.02) {
              firstPrice ??= { kind: 'price', tick: state.meta.tick, sector: id, value }
              if (strictPrices) {
                throw new CheckedStateFailure(
                  'price',
                  state.meta.tick,
                  phase,
                  'PriceTripwire',
                  `price[${id}] = ${value} is outside [0.02,50]`,
                )
              }
              break
            }
          }
          phase = 'post-step'
        },
      },
    })

    if (summary.nanCount > 0) {
      throw new CheckedStateFailure(
        'nan',
        lastObservedTick,
        'post-step',
        'RunnerNanCount',
        `runner counted ${summary.nanCount} non-finite trajectory values`,
      )
    }
    if (firstPrice) {
      findings.push(findingArtifact(firstPrice, sample, options, rules, actionLog))
    }
    if (summary.deposedAt !== null) {
      findings.push(findingArtifact(
        { kind: 'deposition', tick: summary.deposedAt },
        sample,
        options,
        rules,
        actionLog,
      ))
    }
    return { sample, summary, findings, failure: null }
  } catch (error) {
    const failurePhase = currentPhase()
    const failureTick = failurePhase === 'check' || failurePhase === 'post-step'
      ? lastObservedTick
      : Math.min(options.ticks, lastObservedTick + 1)
    const failure = checkedStateFailure(error, failureTick, failurePhase)
    if (firstPrice && failure.kind !== 'price') {
      findings.push(findingArtifact(firstPrice, sample, options, rules, actionLog))
    }
    const save = createSave(
      sample.params,
      sample.seeds.simulation,
      acceptedActionsThrough(actionLog, failure.tick),
      failure.tick,
      rules,
    )
    return {
      sample,
      summary: null,
      findings,
      failure: {
        format: 'terrarium-country-fuzz-failure',
        version: 2,
        ...artifactBase(sample, options, rules),
        failure: {
          kind: failure.kind,
          tick: failure.tick,
          phase: failure.phase,
          error: failure.originalName,
          message: failure.message,
        },
        attemptedAction,
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
