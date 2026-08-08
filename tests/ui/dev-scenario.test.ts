/**
 * Dev scenarios (`ui/src/devScenario.ts`).
 *
 * The dev console's whole justification is that a scenario is *reproducible* —
 * a bug found at 1975 has to be reachable by anyone holding the same scenario.
 * That is a claim about the engine, not about a form, so the last block here
 * actually runs the sim and checks it.
 */

import { describe, expect, it } from 'vitest'
import { END_OF_HISTORY_TICK, createCountryParams, generateParams, hashState, init, step } from '@terrarium/engine'
import {
  applyScenario,
  DEFAULT_SCENARIO,
  quarterOfTick,
  tickForYear,
  tickLabel,
  yearOfTick,
  type DevScenario,
} from '../../packages/ui/src/devScenario'

const base = generateParams('scenario-base')

describe('the clock', () => {
  it('maps ticks to calendar quarters', () => {
    expect(yearOfTick(0)).toBe(1946)
    expect(quarterOfTick(0)).toBe(1)
    expect(tickLabel(0)).toBe('1946 Q1')
    expect(tickLabel(7)).toBe('1947 Q4')
    expect(yearOfTick(END_OF_HISTORY_TICK)).toBe(2050)
  })

  it('maps years back to the first tick of that year', () => {
    expect(tickForYear(1946, END_OF_HISTORY_TICK)).toBe(0)
    expect(tickForYear(1947, END_OF_HISTORY_TICK)).toBe(4)
    expect(tickForYear(1975, END_OF_HISTORY_TICK)).toBe(116)
    expect(yearOfTick(tickForYear(1975, END_OF_HISTORY_TICK))).toBe(1975)
  })

  it('clamps outside the playable century rather than running backwards or forever', () => {
    expect(tickForYear(1900, END_OF_HISTORY_TICK)).toBe(0)
    expect(tickForYear(2500, END_OF_HISTORY_TICK)).toBe(END_OF_HISTORY_TICK)
  })
})

describe('applyScenario', () => {
  it('is the identity when the scenario overrides nothing', () => {
    expect(applyScenario(base, DEFAULT_SCENARIO)).toEqual(base)
  })

  it('touches only the fields the scenario names', () => {
    const out = applyScenario(base, { seed: 'x', year: 1960, development: 0.7 })
    expect(out.development).toBe(0.7)
    expect(out.openness).toBe(base.openness)
    expect(out.cohortSizes).toEqual(base.cohortSizes)
    expect(out.capacities).toEqual(base.capacities)
  })

  it('clamps ratios into range instead of trusting the form', () => {
    expect(applyScenario(base, { seed: 'x', year: 1946, development: 5 }).development).toBe(1)
    expect(applyScenario(base, { seed: 'x', year: 1946, development: -2 }).development).toBe(0.05)
    expect(
      applyScenario(base, { seed: 'x', year: 1946, capacities: { statistical: 99 } }).capacities.statistical,
    ).toBe(1)
  })

  it('overrides one capacity without disturbing the others', () => {
    const out = applyScenario(base, { seed: 'x', year: 1946, capacities: { statistical: 0.9 } })
    expect(out.capacities.statistical).toBe(0.9)
    expect(out.capacities.tax).toBe(base.capacities.tax)
    expect(out.capacities.education).toBe(base.capacities.education)
  })

  it('scales the pyramid with the cohorts, so demography is not handed a contradiction', () => {
    const withPyramid = { ...base, pyramid: base.pyramid ?? [1, 2, 3] }
    const out = applyScenario(withPyramid, { seed: 'x', year: 1946, populationScale: 3 })
    const totalBefore = Object.values(withPyramid.cohortSizes).reduce((a, b) => a + b, 0)
    const totalAfter = Object.values(out.cohortSizes).reduce((a, b) => a + b, 0)
    expect(totalAfter).toBeCloseTo(totalBefore * 3, 9)
    expect(out.pyramid!.reduce((a, b) => a + b, 0)).toBeCloseTo(
      withPyramid.pyramid!.reduce((a, b) => a + b, 0) * 3,
      9,
    )
  })

  it('ignores a nonsense population scale rather than erasing the country', () => {
    expect(applyScenario(base, { seed: 'x', year: 1946, populationScale: 0 }).cohortSizes).toEqual(
      base.cohortSizes,
    )
  })

  it('does not mutate the params it was given', () => {
    const snapshot = structuredClone(base)
    applyScenario(base, { seed: 'x', year: 1946, populationScale: 2, capacities: { tax: 0.5 } })
    expect(base).toEqual(snapshot)
  })
})

describe('a scenario is a real, reproducible game', () => {
  const run = (sc: DevScenario) => {
    let s = init(applyScenario(createCountryParams(sc.country ?? 'procedural', sc.seed), sc), sc.seed)
    const target = tickForYear(sc.year, END_OF_HISTORY_TICK)
    while (s.meta.tick < target) s = step(s)
    return s
  }

  it('lands on the year it was asked for', () => {
    expect(yearOfTick(run({ seed: 'repro', year: 1975 }).meta.tick)).toBe(1975)
  })

  it('can start from a curated country before applying overrides', () => {
    expect(run({ seed: 'curated', country: 'oranga', year: 1946 }).params.name).toBe('Oranga')
  })

  it('replays to an identical state — the same scenario is the same country', () => {
    const sc: DevScenario = {
      seed: 'repro',
      year: 1968,
      development: 0.55,
      populationScale: 1.5,
      capacities: { statistical: 0.8 },
    }
    expect(hashState(run(sc))).toBe(hashState(run(sc)))
  })

  it('is a different country under a different seed, so scenarios do not collapse the sim', () => {
    const a = run({ seed: 'seed-a', year: 1968, development: 0.55 })
    const b = run({ seed: 'seed-b', year: 1968, development: 0.55 })
    expect(hashState(a)).not.toBe(hashState(b))
  })

  it('survives a century at the extremes of the form', () => {
    const s = run({
      seed: 'extremes',
      year: 2050,
      development: 1,
      openness: 0,
      populationScale: 0.1,
      capacities: { tax: 1, statistical: 1, administrative: 1, education: 1 },
    })
    expect(yearOfTick(s.meta.tick)).toBe(2050)
    for (const sector of s.sectors) {
      expect(Number.isFinite(sector.output)).toBe(true)
      expect(Number.isNaN(sector.output)).toBe(false)
    }
  })

  it('a raised statistical capacity actually burns off the fog', () => {
    // the lever a dev reaches for most: "give me a country that can see itself".
    // capacity gates which instruments exist at all, so this is the difference
    // between a wall of blank plates and a full board.
    const foggy = run({ seed: 'fog', year: 1960, capacities: { statistical: 0.05 } })
    const clear = run({ seed: 'fog', year: 1960, capacities: { statistical: 0.95 } })
    expect(Object.keys(foggy.stats.series).length).toBeLessThan(Object.keys(clear.stats.series).length)

    // and the office that can't measure confesses no error band at all — a
    // zero band means "we cannot estimate this", not "this figure is exact"
    const bandAt = (s: ReturnType<typeof run>) => {
      const prints = s.stats.series.gdp_growth ?? []
      return prints[prints.length - 1]?.errorBand
    }
    expect(bandAt(foggy)).toBe(0)
    expect(bandAt(clear)).toBeGreaterThan(0)
  })
})
