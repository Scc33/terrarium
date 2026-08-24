import { describe, expect, it } from 'vitest'
import {
  COUNTRY_DRAFT_DOMAIN,
  InvariantError,
  countryFromDocument,
  replay,
  validateCountryParams,
  type Action,
  type Rng,
  type TrueState,
} from '@terrarium/engine'
import {
  COUNTRY_FUZZ_PROFILES,
  countryFuzzSeeds,
  runCountryFuzzCase,
  sampleCountry,
} from '../../packages/runner/src/country-fuzz'
import { runOne } from '../../packages/runner/src/run'

describe('country-space sampling', () => {
  it('is deterministic and separates country, simulation, and policy seeds', () => {
    const first = sampleCountry('draft', 7, 'same')
    const second = sampleCountry('draft', 7, 'same')
    expect(first).toEqual(second)
    expect(new Set(Object.values(first.seeds)).size).toBe(3)
    expect(first.seeds).toEqual(countryFuzzSeeds('same', 7))
  })

  it('writes every profile as the exact playable country document it returns', () => {
    for (const profile of COUNTRY_FUZZ_PROFILES) {
      const sample = sampleCountry(profile, 2, 'documents')
      expect(countryFromDocument(sample.document)).toEqual(sample.params)
      expect(() => validateCountryParams(sample.params)).not.toThrow()
      expect(sample.params.authored).toBe(true)
    }
  })

  it('keeps broad draft samples inside the shared authoring domain', () => {
    const sample = sampleCountry('draft', 4, 'rails').params
    const within = (value: number, range: { min: number; max: number }) => {
      expect(value).toBeGreaterThanOrEqual(range.min)
      expect(value).toBeLessThanOrEqual(range.max)
    }
    within(sample.development, COUNTRY_DRAFT_DOMAIN.development)
    within(sample.openness, COUNTRY_DRAFT_DOMAIN.openness)
    for (const value of Object.values(sample.capacities)) within(value, COUNTRY_DRAFT_DOMAIN.capacity)
    for (const value of Object.values(sample.cohortSizes)) within(value, COUNTRY_DRAFT_DOMAIN.cohortSize)
    for (const value of Object.values(sample.enfranchisement)) within(value, COUNTRY_DRAFT_DOMAIN.enfranchisement)
    for (const values of [
      sample.structure!.outputMix,
      sample.structure!.employmentMix,
      sample.structure!.capitalMix,
    ]) {
      for (const value of Object.values(values)) within(value, COUNTRY_DRAFT_DOMAIN.sectorMix)
    }
    within(sample.structure!.debtToGdp, COUNTRY_DRAFT_DOMAIN.debtToGdp)
    within(sample.structure!.creditToGdp, COUNTRY_DRAFT_DOMAIN.creditToGdp)
    within(sample.structure!.reserveCoverage, COUNTRY_DRAFT_DOMAIN.reserveCoverage)
    for (const value of Object.values(sample.structure!.institutions)) {
      within(value, COUNTRY_DRAFT_DOMAIN.institution)
    }
  })
})

describe('checked fuzz runs', () => {
  it('turns a failed oracle into a replayable country and save artifact', () => {
    const sample = sampleCountry('recipe', 3, 'artifact')
    const outcome = runCountryFuzzCase(sample, {
      ticks: 40,
      policy: 'random',
      checkState: (state) => {
        if (state.meta.tick === 20) throw new InvariantError('forced test failure')
      },
    })

    expect(outcome.failure).not.toBeNull()
    expect(outcome.failure!.failure).toMatchObject({
      kind: 'invariant',
      tick: 20,
      phase: 'check',
      message: 'forced test failure',
    })
    expect(outcome.failure!.attemptedAction).toBeNull()
    expect(outcome.failure!.save.actionLog.length).toBeGreaterThan(0)
    expect(outcome.failure!.save.params).toEqual(countryFromDocument(outcome.failure!.country))
    expect(replay(outcome.failure!.save).meta.tick).toBe(20)
  })

  it('turns a non-strict finding into a self-contained replay artifact', () => {
    const sample = sampleCountry('draft', 2, 'finding-fixture')
    const outcome = runCountryFuzzCase(sample, { ticks: 30, policy: 'random' })
    const artifact = outcome.findings.find((item) => item.finding.kind === 'deposition')

    expect(artifact).toMatchObject({
      format: 'terrarium-country-fuzz-finding',
      sample: {
        caseId: sample.caseId,
        seeds: sample.seeds,
      },
      country: sample.document,
      policy: 'random',
      finding: { kind: 'deposition', tick: 21 },
    })
    expect(artifact!.save.actionLog.every((turn) => turn.tick < artifact!.finding.tick)).toBe(true)
    expect(replay(artifact!.save).meta.tick).toBe(artifact!.finding.tick)
  })

  it('hard-fails a non-finite value counted by the runner', () => {
    const sample = sampleCountry('recipe', 1, 'nan-artifact')
    const outcome = runCountryFuzzCase(sample, {
      ticks: 20,
      policy: 'passive',
      checkState: (state) => {
        if (state.meta.tick === 10) state.flows.inflationQ = Number.NaN
      },
    })

    expect(outcome.failure!.failure).toMatchObject({
      kind: 'nan',
      tick: 10,
      phase: 'check',
      error: 'NonFiniteRunnerValue',
    })
    expect(replay(outcome.failure!.save).meta.tick).toBe(10)
  })

  it('records the completed quarter when a post-step diagnostic throws', () => {
    const sample = sampleCountry('recipe', 2, 'post-step-artifact')
    const outcome = runCountryFuzzCase(sample, {
      ticks: 30,
      policy: 'passive',
      checkState: (state) => {
        if (state.meta.tick === 20) state.stats.news = null as never
      },
    })

    expect(outcome.failure!.failure).toMatchObject({
      kind: 'exception',
      tick: 20,
      phase: 'post-step',
      error: 'TypeError',
    })
    expect(outcome.failure!.save.tick).toBe(20)
  })

  it('reports attempted and accepted actions independently', () => {
    const sample = sampleCountry('recipe', 0, 'attempted-action')
    const accepted: Action[] = []
    const attempted: Action[] = []
    const malformed = { kind: 'setDial', value: 0.3 } as unknown as Action
    Object.defineProperty(malformed, 'path', {
      get: () => { throw new Error('malformed action') },
    })

    expect(() => runOne({
      seed: sample.seeds.simulation,
      params: sample.params,
      ticks: 1,
      lenient: false,
      policy: () => [
        { kind: 'setDial', path: 'taxRates.income', value: 0.2 },
        malformed,
      ],
      observer: {
        onActionAttempt: (turn) => attempted.push(...turn.actions),
        onActionAccepted: (turn) => accepted.push(...turn.actions),
      },
    })).toThrow()
    expect(accepted).toHaveLength(1)
    expect(attempted).toHaveLength(2)
    expect(attempted[0]).toBe(accepted[0])
    expect(attempted[1]).toBe(malformed)
  })

  it('lets policy variation move independently of simulation shocks', () => {
    const params = sampleCountry('recipe', 1, 'policy-axis').params
    const policy = (_state: TrueState, rng: Rng): Action[] => [
      { kind: 'setDial' as const, path: 'taxRates.income' as const, value: rng.range(0, 0.6) },
    ]
    const first = runOne({ seed: 'same-sim', policySeed: 'policy-a', params, ticks: 20, policy })
    const second = runOne({ seed: 'same-sim', policySeed: 'policy-b', params, ticks: 20, policy })
    expect(first.stateHash).not.toBe(second.stateHash)
  })
})
