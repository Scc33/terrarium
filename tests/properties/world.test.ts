/**
 * M4 §10 — the rest of world. Four abstract partners run their own business
 * cycles; the domestic economy lives inside the export demand and world
 * prices those cycles produce. None of it is scripted — four AR(1)s make the
 * terms-of-trade swings, the export booms, and the sudden stops.
 */

import { describe, expect, it } from 'vitest'
import {
  init,
  PARTNER_IDS,
  rngFor,
  step,
  termsOfTrade,
  TICK_ORDER,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

function century(seed: string, ticks = 400): TrueState[] {
  let s = init(standardCountry, seed)
  const out: TrueState[] = []
  for (let t = 0; t < ticks; t++) {
    s = step(s)
    out.push(s)
  }
  return out
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(xs.length, 1)

/** run a single named pipeline step against a doctored state */
function runStep(name: string, s: TrueState): TrueState {
  const st = TICK_ORDER.find((x) => x.name === name)!
  return st.run(s, rngFor(s.meta.seed, name, s.meta.tick))
}

describe('the rest of world (§10)', () => {
  const states = century('world-1')

  it('partners run real cycles: autocorrelated, mean-reverting, never runaway', () => {
    for (const id of PARTNER_IDS) {
      const series = states.map((s) => s.external.world.partners.find((p) => p.id === id)!.activity)
      const m = mean(series)
      expect(m).toBeGreaterThan(0.88) // hovers around 1…
      expect(m).toBeLessThan(1.08)
      expect(Math.min(...series)).toBeGreaterThan(0.55) // …and never runs away
      expect(Math.max(...series)).toBeLessThan(1.45)
      // lag-1 autocorrelation: a cycle, not white noise
      let num = 0
      let den = 0
      for (let i = 1; i < series.length; i++) num += (series[i] - m) * (series[i - 1] - m)
      for (const v of series) den += (v - m) ** 2
      expect(num / den).toBeGreaterThan(0.5)
    }
  })

  it('world prices stay semi-endogenous but anchored — a cycle, not a ratchet', () => {
    const energy = states.map((s) => s.external.worldPrices.energy)
    expect(mean(energy)).toBeGreaterThan(0.75)
    expect(mean(energy)).toBeLessThan(1.4)
  })

  it('export demand moves exports: a foreign boom buys more than a foreign slump', () => {
    const base = states[80]
    const withDemand = (mult: number): TrueState => ({
      ...base,
      external: {
        ...base.external,
        world: {
          ...base.external.world,
          exportDemand: Object.fromEntries(
            Object.keys(base.external.world.exportDemand).map((k) => [k, mult]),
          ) as TrueState['external']['world']['exportDemand'],
        },
      },
    })
    const exp = (s: TrueState) =>
      Object.values(runStep('production', s).flows.exportsReal).reduce((a, b) => a + b, 0)
    expect(exp(withDemand(1.2))).toBeGreaterThan(exp(withDemand(0.8)))
  })

  it('a partner slump splashes on you: weak buyers mean thinner export order books', () => {
    // manufacturing + regional are the big buyers of your agri/energy — knock
    // them flat and the export book must thin, at unchanged prices
    const base = states[80]
    const slump = (act: number): TrueState => ({
      ...base,
      external: {
        ...base.external,
        world: {
          ...base.external.world,
          partners: base.external.world.partners.map((p) => ({ ...p, activity: act })),
        },
      },
    })
    const exportsAfter = (s: TrueState) => {
      const w = runStep('world', s)
      return Object.values(runStep('production', w).flows.exportsReal).reduce((a, b) => a + b, 0)
    }
    expect(exportsAfter(slump(0.85))).toBeLessThan(exportsAfter(slump(1.05)))
  })

  it('the foreign pages are not fogged: a century of cycles reaches the wire', () => {
    const news = states[states.length - 1].stats.news.map((n) => n.text)
    const foreign = news.filter(
      (t) => /world|foreign|commodity|money centres|region|manufacturing giant|sudden stop/i.test(t),
    )
    expect(foreign.length).toBeGreaterThan(0)
  })
})

describe('terms of trade (§10, a fundable output)', () => {
  it('is an instrument you buy: no series until trade statistics are funded', () => {
    const play = (statistical: number) => {
      const params = { ...standardCountry, capacities: { ...standardCountry.capacities, statistical } }
      let s = init(params, 'tot-1')
      for (let t = 0; t < 16; t++) s = step(s)
      return observe(s)
    }
    expect(play(0.15).indicators.terms_of_trade).toBeUndefined()
    const funded = play(0.5).indicators.terms_of_trade
    expect(funded).toBeDefined()
    for (const p of funded!.points) {
      expect(p.value).toBeGreaterThan(60) // an index around 100, not garbage
      expect(p.value).toBeLessThan(160)
    }
  })

  it('worsens when your imports get dearer: dear energy, poorer terms', () => {
    const s = init(standardCountry, 'tot-2')
    const base = termsOfTrade(s)
    const dearEnergy: TrueState = {
      ...s,
      external: { ...s.external, worldPrices: { ...s.external.worldPrices, energy: 2 } },
    }
    expect(termsOfTrade(dearEnergy)).toBeLessThan(base) // energy is an import
  })
})
