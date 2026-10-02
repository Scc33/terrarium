/**
 * The world's turbulence (ADR-0046, #122). A setup dial over how often the
 * world breaks, so these pin its three promises: the default is the calibrated
 * economy bit for bit, the other settings move the exogenous shocks and only
 * those, and a save carries the setting so a calm century reloads calm.
 */

import { describe, expect, it } from 'vitest'
import {
  createSave,
  hashState,
  init,
  replay,
  step,
  TURBULENCE,
  type EventId,
  type TrueState,
  type Turbulence,
} from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'

function play(state: TrueState, ticks: number): TrueState {
  let s = state
  for (let t = 0; t < ticks; t++) s = step(s)
  return s
}

/** the hard events the dial governs: ruptures nobody in the country caused */
const SHOCKS = new Set<EventId>([
  'drought_onset',
  'fuel_shock',
  'world_commodity_crisis',
  'world_manufacturing_crisis',
  'world_financial_crisis',
  'world_regional_crisis',
])

/** Shocks filed across a handful of centuries. Same seeds in every world, so
 * the only thing that differs between two calls is the dial. */
function shocksIn(turbulence: Turbulence): number {
  let n = 0
  for (let r = 0; r < 6; r++) {
    const end = play(init(standardCountry, `turbulence-${r}`, 'standard', 0, turbulence), 400)
    n += end.stats.news.filter((item) => SHOCKS.has(item.event)).length
  }
  return n
}

describe('the ordinary world is the calibrated one', () => {
  it('is the default, and naming it changes nothing', () => {
    const unnamed = init(standardCountry, 'turbulence-inert')
    expect(unnamed.meta.turbulence).toBe('ordinary')
    const named = init(standardCountry, 'turbulence-inert', 'standard', 0, 'ordinary')
    expect(hashState(play(named, 60))).toBe(hashState(play(unnamed, 60)))
  })

  it('multiplies by exactly one, so no draw can land differently', () => {
    expect(TURBULENCE.ordinary).toEqual({ hazard: 1, cycle: 1 })
  })
})

describe('the dial moves how often the world breaks', () => {
  const calm = shocksIn('calm')
  const ordinary = shocksIn('ordinary')
  const turbulent = shocksIn('turbulent')

  it('a calm world has fewer shocks and a turbulent one more', () => {
    expect(calm).toBeLessThan(ordinary)
    expect(turbulent).toBeGreaterThan(ordinary)
  })

  it('is felt, not marginal: roughly in proportion to the hazard', () => {
    // the hazard halves and doubles; sampling noise and drought's own
    // duration (no new drought while one is running) keep it from being exact
    expect(calm / ordinary).toBeLessThan(0.75)
    expect(turbulent / ordinary).toBeGreaterThan(1.4)
  })

  it('leaves the opening alone — it changes the century, not the inheritance', () => {
    const a = init(standardCountry, 'turbulence-open', 'standard', 0, 'calm')
    const b = init(standardCountry, 'turbulence-open', 'standard', 0, 'turbulent')
    expect(hashState({ ...a, meta: b.meta })).toBe(hashState(b))
  })
})

describe('the setting is a replay input', () => {
  it('a save reloads in the world it was played in', () => {
    const played = play(init(standardCountry, 'turbulence-save', 'standard', 0, 'turbulent'), 80)
    const save = createSave(standardCountry, 'turbulence-save', [], 80, 'standard', 0, 'turbulent')
    expect(save.turbulence).toBe('turbulent')
    const reloaded = replay(save)
    expect(reloaded.meta.turbulence).toBe('turbulent')
    expect(hashState(reloaded)).toBe(hashState(played))
  })

  it('a save written before the dial existed reloads in the ordinary world', () => {
    const save = createSave(standardCountry, 'turbulence-legacy', [], 20)
    delete save.turbulence
    expect(hashState(replay(save))).toBe(hashState(play(init(standardCountry, 'turbulence-legacy'), 20)))
  })
})
