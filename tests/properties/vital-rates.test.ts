/**
 * Vital registration (§8 fog): the demographic transition is engine truth,
 * but a government only *knows* its birth and death rates once it funds the
 * registrar. Heads, by contrast, are always countable — the census carries
 * an exact population and pyramid with no fog at all.
 */

import { describe, expect, it } from 'vitest'
import { init, step, type TrueState } from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

function play(seed: string, ticks: number, statistical: number): TrueState {
  const params = { ...standardCountry, capacities: { ...standardCountry.capacities, statistical } }
  let s = init(params, seed)
  for (let t = 0; t < ticks; t++) s = step(s)
  return s
}

/** latest revision the office has published for a measured quarter */
function settledAt(pts: { forQtr: number; value: number; revision: number }[], q: number): number {
  const here = pts.filter((p) => p.forQtr === q).sort((a, b) => b.revision - a.revision)
  expect(here.length).toBeGreaterThan(0)
  return here[0].value
}

describe('vital registration is a fundable instrument (§8)', () => {
  it('no birth/death/migration series until civil registration is funded', () => {
    const poor = observe(play('vr-1', 16, 0.15)).indicators
    expect(poor.birth_rate).toBeUndefined()
    expect(poor.death_rate).toBeUndefined()
    expect(poor.net_migration).toBeUndefined()
    const funded = observe(play('vr-1', 16, 0.4)).indicators
    expect(funded.birth_rate).toBeDefined()
    expect(funded.death_rate).toBeDefined()
    expect(funded.net_migration).toBeDefined()
    // a registrar reads in sane per-1000 territory
    for (const p of [...funded.birth_rate!.points, ...funded.death_rate!.points]) {
      expect(p.value).toBeGreaterThan(2)
      expect(p.value).toBeLessThan(60)
    }
    for (const p of funded.net_migration!.points) expect(Number.isFinite(p.value)).toBe(true)
  })

  it('the published register tracks the true transition: births fall, deaths fall, and births lead', () => {
    // keep capacity high enough that the registry survives its own decay for
    // the first half-century
    const s = play('vr-2', 200, 0.8)
    const birth = observe(s).indicators.birth_rate!.points
    const death = observe(s).indicators.death_rate!.points
    const early = 8
    const late = 160
    expect(settledAt(birth, late)).toBeLessThan(settledAt(birth, early)) // fertility fell
    expect(settledAt(death, late)).toBeLessThan(settledAt(death, early)) // mortality fell
    expect(settledAt(birth, early)).toBeGreaterThan(settledAt(death, early)) // natural increase
  })

  it('is a noisy estimate, not the truth: the print sits near the registrar’s worksheet', () => {
    const s = play('vr-3', 60, 0.8)
    const birth = observe(s).indicators.birth_rate!.points
    const q = 40
    const truth = s.stats.record[q].birthRate // the exact worksheet the office measured
    expect(Math.abs(settledAt(birth, q) - truth)).toBeLessThan(4) // within a few per 1000
  })

  it('the census is exact and needs no funding: population history is fog-free', () => {
    const dark = observe(play('vr-4', 40, 0.05)) // office too poor for any survey
    expect(dark.indicators.birth_rate).toBeUndefined()
    // …yet the head count is fully known, every quarter
    expect(dark.census.length).toBeGreaterThan(30)
    expect(dark.census[0].population).toBeGreaterThan(27)
    expect(dark.census[dark.census.length - 1].population).toBeGreaterThan(dark.census[0].population)
    for (const c of dark.census) expect(c.pyramid.length).toBe(17)
  })
})
