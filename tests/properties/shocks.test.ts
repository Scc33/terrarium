import { describe, expect, it } from 'vitest'
import { init, step, type TrueState } from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

/** Century run keeping the per-tick states — shocks are rare, so the drama
 * tests need the whole timeline. Seed pinned to one with both crises. */
function century(seed: string, ticks = 400): TrueState[] {
  let s = init(standardCountry, seed)
  const states: TrueState[] = []
  for (let t = 0; t < ticks; t++) {
    s = step(s)
    states.push(s)
  }
  return states
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(xs.length, 1)

describe('the crisis clock (Pillar 4)', () => {
  const states = century('crisis-2')
  const news = states[states.length - 1].stats.news

  it('ticks: a century contains droughts and oil ruptures, and the wire says so', () => {
    expect(news.filter((n) => n.text.startsWith('Drought')).length).toBeGreaterThan(0)
    expect(news.filter((n) => n.text.includes('fuel markets')).length).toBeGreaterThan(0)
    // every drought eventually breaks
    expect(news.filter((n) => n.text.startsWith('Rains')).length).toBe(
      news.filter((n) => n.text.startsWith('Drought')).length,
    )
  })

  it('droughts bite: agri gets scarcer relative to services while the rain stays away', () => {
    const ratio = (s: TrueState) => s.market.prices.agri / s.market.prices.services
    const inDrought = states.filter((s) => s.external.shocks.droughtQtrsLeft > 0)
    const dry = states.filter((s) => s.external.shocks.droughtQtrsLeft === 0)
    expect(inDrought.length).toBeGreaterThan(4)
    expect(mean(inDrought.map(ratio))).toBeGreaterThan(mean(dry.map(ratio)) * 1.02)
  })

  it('oil ruptures are crises, not new normals: spikes on impact, home in the mean', () => {
    const ruptures = news.filter((n) => n.text.includes('fuel markets'))
    // the jump is visible the quarter it lands
    for (const r of ruptures) {
      const before = states[Math.max(r.tick - 2, 0)].external.worldPrices.energy
      expect(states[r.tick].external.worldPrices.energy).toBeGreaterThan(before * 1.25)
    }
    // …and the reverting walk keeps the century's mean near home anyway
    const meanEnergy = mean(states.map((s) => s.external.worldPrices.energy))
    expect(meanEnergy).toBeLessThan(1.4)
    expect(meanEnergy).toBeGreaterThan(0.7)
  })

  it('a passive government survives the century of shocks', () => {
    expect(states[states.length - 1].politics.inPower).toBe(true)
  })
})

describe('the report card (§3.3)', () => {
  const states = century('card-1', 100)
  const live = states[states.length - 1]

  it('does not exist mid-run — no drip-feed of true welfare', () => {
    expect(observe(live).reportCard).toBeUndefined()
  })

  it('appears on deposition, graded and dated', () => {
    const deposed: TrueState = {
      ...live,
      politics: { ...live.politics, inPower: false, deposedAt: 88 },
    }
    const card = observe(deposed).reportCard!
    expect(card.endedBy).toBe('deposition')
    expect(card.quartersGoverned).toBe(88)
    expect(card.prosperity).toBeGreaterThan(0)
    // a quarter-century of ~1.6%/yr growth should read above the 1946 standard
    expect(card.vsBaseline).toBeGreaterThan(1)
    expect(card.vsBaseline).toBeLessThan(3)
  })

  it('appears when the book closes at 2050', () => {
    const closed: TrueState = { ...live, meta: { ...live.meta, tick: 416 } }
    const card = observe(closed).reportCard!
    expect(card.endedBy).toBe('history')
  })

  it('grades the axes separately: passive prosperity is a C, consent decides legitimacy', () => {
    // the passive band is calibrated to land in C (0.85–1.8 %/yr) at ANY
    // tenure length — the rate normalization keeps the axes from bleeding
    const deposed: TrueState = {
      ...live,
      politics: { ...live.politics, inPower: false, deposedAt: 88, electionsWon: 5 },
    }
    const card = observe(deposed).reportCard!
    expect(card.prosperityGrade).toBe('C')
    expect(card.prosperityRate).toBeGreaterThan(0.85)
    expect(card.prosperityRate).toBeLessThan(1.8)
    expect(card.legitimacyGrade).toBe('B') // five mandates before the fall

    const never: TrueState = {
      ...live,
      politics: { ...live.politics, inPower: false, deposedAt: 12, electionsWon: 0 },
    }
    expect(observe(never).reportCard!.legitimacyGrade).toBe('F')

    const survived: TrueState = { ...live, meta: { ...live.meta, tick: 416 } }
    expect(observe(survived).reportCard!.legitimacyGrade).toBe('A')
  })

  it('the verdict freezes at deposition — the record does not drift afterwards', () => {
    const deposed: TrueState = {
      ...live,
      politics: { ...live.politics, inPower: false, deposedAt: live.meta.tick },
    }
    let after = deposed
    for (let i = 0; i < 6; i++) after = step(after)
    expect(after.score).toEqual(deposed.score)
  })
})
