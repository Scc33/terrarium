import { describe, expect, it } from 'vitest'
import {
  COUNTRY_ARCHETYPE_IDS,
  COUNTRY_CATALOG,
  CURATED_COUNTRY_IDS,
  InvalidCountryError,
  createCountryParams,
  createSave,
  generateCountryParams,
  hashState,
  init,
  materializeStructure,
  replay,
  validateCountryParams,
  type CountryParams,
} from '@terrarium/engine'

describe('the country catalogue', () => {
  it('has one complete, uniquely named profile per playable recipe', () => {
    expect(COUNTRY_CATALOG.map((country) => country.id)).toEqual([...CURATED_COUNTRY_IDS, 'procedural'])
    expect(new Set(COUNTRY_CATALOG.map((country) => country.name)).size).toBe(COUNTRY_CATALOG.length)
    for (const country of COUNTRY_CATALOG) {
      expect(country.summary.length).toBeGreaterThan(30)
      expect(country.opportunities.length).toBeGreaterThan(0)
      expect(country.pressures.length).toBeGreaterThan(0)
    }
  })

  it('keeps Meridia on the exact historical baseline', () => {
    const meridia = createCountryParams('meridia', 'ignored')
    expect(meridia).toMatchObject({
      name: 'Meridia',
      development: 0.35,
      openness: 1,
      capacities: { tax: 0.25, statistical: 0.18, administrative: 0.3, education: 0.2 },
    })
    expect(meridia.structure).toBeUndefined()
    expect(Object.values(meridia.cohortSizes).reduce((a, b) => a + b, 0)).toBe(27.5)
  })

  it('returns defensive copies, so one game cannot rewrite the catalogue', () => {
    const first = createCountryParams('oranga', 'a')
    first.capacities.tax = 0
    first.structure!.outputMix.transport = 4
    const second = createCountryParams('oranga', 'b')
    expect(second.capacities.tax).toBe(0.42)
    expect(second.structure!.outputMix.transport).toBe(1.8)
  })

  it('makes the curated openings economically distinct before the first tick', () => {
    const signatures = CURATED_COUNTRY_IDS.map((id) => {
      const state = init(createCountryParams(id, 'opening'), 'opening')
      const gross = state.sectors.reduce((sum, sector) => sum + sector.output, 0)
      return state.sectors.map((sector) => (sector.output / gross).toFixed(4)).join(':')
    })
    expect(new Set(signatures).size).toBe(CURATED_COUNTRY_IDS.length)
  })
})

describe('procedural country recipes', () => {
  it('are deterministic down to the initialized state', () => {
    const a = generateCountryParams('same-country')
    const b = generateCountryParams('same-country')
    expect(a).toEqual(b)
    expect(hashState(init(a, 'same-country'))).toBe(hashState(init(b, 'same-country')))
  })

  it('cover every archetype without leaving the valid parameter space', () => {
    for (const archetype of COUNTRY_ARCHETYPE_IDS) {
      for (let i = 0; i < 20; i++) {
        const params = generateCountryParams(`${archetype}-${i}`, { archetype })
        expect(() => validateCountryParams(params)).not.toThrow()
        expect(params.pyramid).toHaveLength(17)
        if (archetype === 'balanced') expect(params.structure).toBeUndefined()
        else expect(params.structure).toBeDefined()
      }
    }
  })

  it('changes the country under another seed', () => {
    expect(generateCountryParams('country-a')).not.toEqual(generateCountryParams('country-b'))
  })

  it('allows an archetype anchor with variability disabled', () => {
    const a = generateCountryParams('a', { archetype: 'industrial', variability: 0, name: 'Testland' })
    const b = generateCountryParams('b', { archetype: 'industrial', variability: 0, name: 'Testland' })
    expect(a).toEqual(b)
    expect(a.name).toBe('Testland')
  })

  it('rejects contradictory demographic inputs before simulation', () => {
    const broken = createCountryParams('meridia', 'x') as CountryParams
    broken.pyramid = [...broken.pyramid!]
    broken.pyramid[0] += 1
    expect(() => validateCountryParams(broken)).toThrow(InvalidCountryError)
    expect(() => init(broken, 'x')).toThrow(/pyramid total/)
  })
})

describe('spelling out an implicit opening', () => {
  it('leaves a structure-less country economically untouched', () => {
    // Meridia carries no `structure`, so `init` reaches for a constant per
    // field. The editor has to show those numbers, which means writing them
    // down — and writing them down must not move a single quarter of the
    // historical baseline. A century, not a field comparison, is the claim.
    const implicit = createCountryParams('meridia', 'seed')
    const explicit = materializeStructure(implicit)

    expect(implicit.structure).toBeUndefined()
    expect(explicit.structure).toBeDefined()

    // the params vector is part of hashed state and is *supposed* to differ,
    // so the economy is what gets compared: everything the pipeline produced
    const economy = (params: CountryParams) =>
      hashState({ ...replay(createSave(params, 'materialize', [], 120)), params: null })
    expect(economy(explicit)).toBe(economy(implicit))
  })

  it('returns a country that already has one unchanged, and defensively copied', () => {
    const veltravia = createCountryParams('veltravia', 'seed')
    const copy = materializeStructure(veltravia)
    expect(copy.structure).toEqual(veltravia.structure)
    copy.structure!.debtToGdp = 9
    expect(veltravia.structure!.debtToGdp).not.toBe(9)
  })
})
