/**
 * The UI↔engine contract (§1.1). `PublishedState` is the ONLY thing that
 * crosses the worker boundary, and the whole architecture rests on two
 * promises: it is a complete, serialisable value (it must survive
 * `postMessage`), and it leaks NONE of the true state — the UI must be unable
 * to name what it isn't meant to see. Lint enforces the import boundary at
 * author time; these tests enforce the data boundary at run time, so a new
 * field on `TrueState` can never quietly ride across.
 */

import { describe, expect, it } from 'vitest'
import { INDICATOR_IDS, STANDARD_RULES, init, step, type TrueState } from '@terrarium/engine'
import { observe, type PublishedState } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

function play(seed: string, ticks: number, statistical?: number): TrueState {
  const params =
    statistical === undefined
      ? standardCountry
      : { ...standardCountry, capacities: { ...standardCountry.capacities, statistical } }
  let s = init(params, seed)
  for (let t = 0; t < ticks; t++) s = step(s)
  return s
}

/** every key name that appears anywhere in a nested plain-data value */
function collectKeys(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const v of value) collectKeys(v, out)
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      out.add(k)
      collectKeys(v, out)
    }
  }
  return out
}

describe('the published-state contract (§1.1)', () => {
  it('is shape-complete: observe() always fills every required field', () => {
    const pub = observe(play('contract-shape', 24))
    const required: Array<keyof PublishedState> = [
      'tick',
      'country',
      'rules',
      'indicators',
      'dials',
      'spendingRules',
      'treasury',
      'capacity',
      'capacityBuilding',
      'books',
      'population',
      'census',
      'policy',
      'reserves',
      'exchangeRate',
      'politicalCapital',
      'quartersToElection',
      'inPower',
      'electionsWon',
      'news',
    ]
    for (const key of required) expect(pub[key], `missing ${key}`).not.toBeUndefined()
    expect(typeof pub.country).toBe('string')
    expect(pub.population.pyramid.length).toBeGreaterThan(0)
    expect(Array.isArray(pub.news)).toBe(true)
  })

  it('publishes the immutable rules of the run exactly', () => {
    expect(observe(init(standardCountry, 'contract-standard')).rules).toEqual(STANDARD_RULES)
    // the legacy mode string still names the tenure rule and only that one
    expect(observe(init(standardCountry, 'contract-god-mode', 'god')).rules).toEqual({
      ...STANDARD_RULES,
      protectedTenure: true,
    })
    expect(
      observe(init(standardCountry, 'contract-sandbox', { unlimitedCapital: true })).rules,
    ).toEqual({ ...STANDARD_RULES, unlimitedCapital: true })
  })

  it('survives the worker boundary: it is structured-cloneable and unchanged by it', () => {
    const pub = observe(play('contract-clone', 20))
    // postMessage uses the structured-clone algorithm — a function, class
    // instance, or other non-cloneable value would throw here
    const round = structuredClone(pub)
    expect(round).toEqual(pub)
    // and it must be plain JSON too (the save/db layer serialises it)
    expect(JSON.parse(JSON.stringify(pub))).toEqual(pub)
  })

  it('leaks no true state: none of the engine internals cross the fog', () => {
    // a fully-funded, century-deep run — the richest possible published value
    const pub = observe(play('contract-leak', 60, 1))
    const keys = collectKeys(pub)
    // camelCase TrueState internals that must be reachable ONLY as fogged
    // indicator series (snake_case ids), never as raw exact fields
    const forbidden = [
      'assetPrice',
      'bankCapital',
      'creditOutstanding',
      'creditToGdp',
      'creditGrowth',
      'crisisSeverity',
      'crisisQtrsLeft',
      'frontier',
      'attained',
      'tfp',
      'tfpGrowthQ',
      'technologyAttainment',
      'mortalityIndex',
      'workerShareMult',
      'classShares',
      'crudeBirthRate',
      'crudeDeathRate',
      'netMigrationQ',
      'netMigrationRate',
      'migrationBaselineWelfare',
      'inflationExpectations',
      'debtToGdp',
      'confidence',
      'excessDemand',
      'tatonnement',
      'capacityUtilization',
      'discountedWelfare',
      'discountWeight',
      'baselineWelfare',
      'statCapacity',
      'satisfiedAgri',
      'realGdpPerCapita',
      'realConsumptionPerCapita',
      'householdSavingRate',
      'consumptionShare',
      'investmentShare',
      'governmentShare',
      'exportShare',
      'foreignDirectInvestmentShare',
      'foreignOwnedCapital',
      'foreignDirectInvestmentReal',
      'foreignDirectInvestmentValue',
      'foreignProfitRemittances',
      'privateDomesticDemandReal',
      'governmentDomesticDemandReal',
      'publicInvestmentReal',
    ]
    for (const f of forbidden) expect(keys.has(f), `LEAKED true-state field: ${f}`).toBe(false)
  })

  it('never exposes a raw true GDP level: growth is fogged, levels are only estimates', () => {
    const pub = observe(play('contract-gdp', 30, 1))
    const truth = play('contract-gdp', 30, 1).flows.realGdp
    // the only levels the UI sees are the office's noisy estimates on a
    // PUBLISHED (lagged) quarter — never the live, exact figure
    const gdp = pub.indicators.gdp_growth
    expect(gdp).toBeDefined()
    for (const p of gdp!.points) {
      expect(p.forQtr).toBeLessThan(pub.tick) // always lagged
      if (p.levels) expect(p.levels.real).not.toBe(truth)
    }
  })
})

describe('the indicator ladder is internally consistent', () => {
  it('a fully-funded office publishes every catalogued indicator, labelled', () => {
    const pub = observe(play('ladder-full', 24, 1))
    for (const id of INDICATOR_IDS) {
      const series = pub.indicators[id]
      expect(series, `no series for ${id} at full funding`).toBeDefined()
      expect(series!.label.length, `blank label for ${id}`).toBeGreaterThan(0)
      expect(series!.unit.length, `blank unit for ${id}`).toBeGreaterThan(0)
      expect(series!.id).toBe(id)
    }
  })

  it('publishes nothing outside the catalogue', () => {
    const pub = observe(play('ladder-ids', 24, 1))
    for (const id of Object.keys(pub.indicators)) {
      expect(INDICATOR_IDS as readonly string[]).toContain(id)
    }
  })

  it('every published point carries the full StatPrint fields', () => {
    const pub = observe(play('ladder-pts', 24, 1))
    for (const id of INDICATOR_IDS) {
      for (const p of pub.indicators[id]!.points) {
        for (const f of ['forQtr', 'publishedAt', 'value', 'revision', 'errorBand'] as const) {
          expect(Number.isFinite(p[f]), `${id}.${f} not finite`).toBe(true)
        }
        expect(p.publishedAt).toBeGreaterThanOrEqual(p.forQtr) // lag ≥ 0
      }
    }
  })
})
