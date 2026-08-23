/**
 * The externality (ADR-0028) — what production costs outside the market.
 *
 * The claim the whole design rests on is NEGATIVE and easy to lose: pollution
 * damages the economy through the mortality schedule and the drought hazard
 * that were already running, and through nothing else. There is no term
 * anywhere that subtracts pollution from output. If one ever appears, the
 * model has stopped producing the conclusion and started stating it.
 *
 * The second claim is about who pays. A country that never industrialises past
 * its 1946 inheritance carries its inherited burden and owes nothing extra —
 * measured, the passive century is unmoved (2.81 → 2.82 %/yr) while the
 * developmental cohort loses three of twenty-two survivors. An externality
 * that taxed everybody would be a tax; this one is a cost of development.
 */

import { describe, expect, it } from 'vitest'
import {
  applyActions,
  CAPACITY_IDS,
  createCountryParams,
  droughtHazardMultiplier,
  emissionsPerHead,
  init,
  SECTOR_IDS,
  statuteForce,
  step,
  type Action,
  type CountryParams,
  type TrueState,
} from '@terrarium/engine'

function govern(params: CountryParams, seed: string, ticks: number, statute: Action | null): TrueState {
  let s = init(params, seed, { protectedTenure: true })
  for (let t = 0; t < ticks; t++) {
    const ministries: Action[] =
      t % 4 === 0
        ? CAPACITY_IDS.map((target) => ({ kind: 'investCapacity', target, amount: 2 }))
        : []
    let staged: TrueState = { ...s, politics: { ...s.politics, politicalCapital: 5000 } }
    for (const act of ministries) {
      try {
        staged = applyActions(staged, [act])
      } catch {
        continue
      }
    }
    if (statute && t === 40) staged = applyActions(staged, [statute])
    s = step(staged)
  }
  return s
}

const SEEDS = ['env-0', 'env-1', 'env-2', 'env-3']
const CLEAN_AIR: Action = { kind: 'enact', statute: 'emissions_standard', level: 2 }

describe('the burden opens where the country actually is', () => {
  it('seeds at equilibrium, so no run opens on a ramp nobody chose', () => {
    // The failure this prevents is silent: a country seeded at zero spends its
    // first two decades on a rising trend, and every early measurement reads
    // that ramp instead of the economy.
    for (const id of ['meridia', 'costona', 'veltravia'] as const) {
      const s = init(createCountryParams(id, `seed-${id}`), 'seed')
      expect(s.environment.pollution).toBeCloseTo(emissionsPerHead(s), 9)
      expect(s.environment.pollution).toBeGreaterThan(0)
    }
  })

  it('opens dirtier for an industrial country than an agrarian one', () => {
    // Nothing about the statute or the policy differs — only the inherited
    // industrial structure, which is the correct reason to differ.
    const agrarian = init(createCountryParams('costona', 'open-c'), 'open')
    const industrial = init(createCountryParams('veltravia', 'open-v'), 'open')
    expect(industrial.environment.pollution).toBeGreaterThan(agrarian.environment.pollution)
  })

  it('is a per-head burden, so a bigger country is not automatically dirtier', () => {
    // Doubling every sector's output AND the population leaves the burden
    // alone. An absolute tonnage would double it, which is meaningless to
    // anything that reads this — mortality responds to what people breathe.
    const s = init(createCountryParams('meridia', 'scale'), 'scale')
    const doubled: TrueState = {
      ...s,
      sectors: s.sectors.map((sector) => ({ ...sector, output: sector.output * 2 })),
      demography: { ...s.demography, pyramid: s.demography.pyramid.map((band) => band * 2) },
    }
    expect(emissionsPerHead(doubled)).toBeCloseTo(emissionsPerHead(s), 9)
  })
})

describe('the damage is measured against what the country inherited', () => {
  it('charges no country anything in the quarter it opens', () => {
    // The bug this pins, found in review: both damage terms originally read
    // `max(0, burden − 1)` against the STANDARD country's 1.0. The catalogue
    // opens between 0.62 and 1.57, so Veltravia was charged excess mortality
    // and a 12% higher drought hazard in 1946Q1 for the authored structure of
    // its recipe, before its player had done anything at all.
    //
    // It was invisible in the passive baseline because that baseline is
    // measured on Meridia — which IS the reference country and opens at
    // exactly 1.0. The one country where the bug could not show.
    for (const id of ['meridia', 'costona', 'veltravia', 'oranga', 'kestrel'] as const) {
      const s = init(createCountryParams(id, `inherit-${id}`), 'inherit')
      expect(droughtHazardMultiplier(s), `${id} drought hazard at t=0`).toBe(1)
      expect(s.environment.pollution - s.environment.baseline).toBeCloseTo(0, 9)
    }
  })

  it('keeps the inheritance fixed while the burden moves', () => {
    const params = createCountryParams('veltravia', 'anchor')
    const opening = init(params, 'anchor').environment.baseline
    const century = govern(params, 'anchor', 200, null)
    expect(century.environment.baseline).toBeCloseTo(opening, 9)
    expect(century.environment.pollution).toBeGreaterThan(opening)
    // …and an industrial country that HAS industrialised does now pay
    expect(droughtHazardMultiplier(century)).toBeGreaterThan(1)
  })
})

describe('industrialising dirties the country, and technique cleans it', () => {
  it('raises the burden over a century of building', () => {
    for (const seed of SEEDS.slice(0, 2)) {
      const params = createCountryParams('meridia', 'dirty')
      const opening = init(params, seed).environment.pollution
      const century = govern(params, seed, 400, null)
      expect(century.environment.pollution).toBeGreaterThan(opening * 1.5)
    }
  })

  it('emits less per unit of output as technique improves', () => {
    const s = init(createCountryParams('meridia', 'tech'), 'tech')
    const advanced: TrueState = {
      ...s,
      tech: {
        ...s.tech,
        attained: Object.fromEntries(
          SECTOR_IDS.map((sid) => [sid, s.tech.attained[sid] * 2]),
        ) as TrueState['tech']['attained'],
      },
    }
    expect(emissionsPerHead(advanced)).toBeLessThan(emissionsPerHead(s))
  })
})

describe('the damage arrives through channels that already existed', () => {
  it('leaves the drought hazard exactly alone at the inherited burden', () => {
    // The inertness claim: a country that has not industrialised past 1946
    // faces the hazard it always did, to the last decimal.
    const s = init(createCountryParams('meridia', 'inert'), 'inert')
    const atInheritance: TrueState = { ...s, environment: { ...s.environment, pollution: 1 } }
    expect(droughtHazardMultiplier(atInheritance)).toBe(1)
    const clean: TrueState = { ...s, environment: { ...s.environment, pollution: 0.4 } }
    expect(droughtHazardMultiplier(clean)).toBe(1)
  })

  it('makes the harvest fail more often as the burden rises, and never certainly', () => {
    const s = init(createCountryParams('meridia', 'hazard'), 'hazard')
    const at = (pollution: number) =>
      droughtHazardMultiplier({ ...s, environment: { ...s.environment, pollution } })
    expect(at(2)).toBeGreaterThan(at(1))
    expect(at(4)).toBeGreaterThan(at(2))
    // …and a filthy century makes drought common, never inevitable
    expect(at(1000)).toBeLessThanOrEqual(3)
  })

  it('shortens lives — through the mortality schedule, not through output', () => {
    const params = createCountryParams('veltravia', 'mortality')
    let dirtier = 0
    for (const seed of SEEDS) {
      const off = govern(params, seed, 400, null)
      const on = govern(params, seed, 400, CLEAN_AIR)
      if (on.demography.crudeDeathRate < off.demography.crudeDeathRate) dirtier++
    }
    expect(dirtier).toBe(SEEDS.length)
  })
})

describe('the emissions standard is the answer to it', () => {
  it('cuts the burden it was written against, in every seed', () => {
    const params = createCountryParams('veltravia', 'clean')
    for (const seed of SEEDS) {
      const off = govern(params, seed, 400, null)
      const on = govern(params, seed, 400, CLEAN_AIR)
      expect(statuteForce(on, 'emissions_standard')).toBeGreaterThan(0)
      expect(on.environment.pollution).toBeLessThan(0.6 * off.environment.pollution)
    }
  })

  it('charges for it where the dirt is, not evenly', () => {
    // The abatement surcharge scales with each sector's own emission
    // intensity, so a clean air act is nearly free for the service trades and
    // expensive for power generation. Nobody wrote that difference down: it
    // falls out of the same table that decides who pollutes.
    const params = createCountryParams('meridia', 'cost')
    const off = govern(params, 'cost-a', 120, null)
    const on = govern(params, 'cost-a', 120, CLEAN_AIR)
    // Dirtiest against cleanest is the claim; measuring each against a third
    // sector measures the third sector too. (An earlier version compared both
    // to manufacturing and took absolute movement, which counted the clean
    // sector getting relatively CHEAPER as it "moving more" — the right answer
    // wearing the wrong sign.)
    const dirtyOverClean = (s: TrueState) => s.market.prices.energy / s.market.prices.services
    expect(dirtyOverClean(on)).toBeGreaterThan(dirtyOverClean(off))
  })

  it('does nothing at all while it is unwritten', () => {
    const params = createCountryParams('meridia', 'unwritten')
    const passive = govern(params, 'unwritten', 80, null)
    expect(statuteForce(passive, 'emissions_standard')).toBe(0)
  })
})
