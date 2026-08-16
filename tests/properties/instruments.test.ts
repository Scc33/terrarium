/**
 * The earned instruments of schema v5: the price bureau (food & fuel boards,
 * §6.1 disaggregation) and the household survey (Gini). The M1 exit tests
 * prove the fuel-tax→bread chain in TRUE prices; here the claim is about the
 * apparatus — the boards exist only when funded, publish fast, and carry the
 * player's own excise into their own published data.
 *
 * Cross-run comparisons share a seed on purpose: obs:* noise is keyed by
 * (indicator, quarter, revision), so identical draws cancel and a published
 * comparison is exactly as sharp as the underlying truth comparison.
 */

import { describe, expect, it } from 'vitest'
import { init, step, type IndicatorId, type TrueState } from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { fuelTaxAtQ8, standardCountry } from '@terrarium/fixtures'
import { runOne } from '../../packages/runner/src/run'

const withStats = (statistical: number) => ({
  ...standardCountry,
  capacities: { ...standardCountry.capacities, statistical },
})

/** Passive run, optionally multiplying the transfers dial at quarter 8 —
 * doctored directly on the state because the property under test is the
 * survey's economics, not the action system's legality rules. */
function play(seed: string, ticks: number, statCapacity: number, transferMult = 1): TrueState {
  let s = init(withStats(statCapacity), seed)
  for (let t = 0; t < ticks; t++) {
    if (transferMult !== 1 && t === 8) {
      const dials = s.gov.dials
      s = {
        ...s,
        gov: {
          ...s.gov,
          dials: {
            ...dials,
            spending: { ...dials.spending, transfers: dials.spending.transfers * transferMult },
          },
        },
      }
    }
    s = step(s)
  }
  return s
}

/** Latest available print for a measured quarter (highest revision out). */
function printAt(s: TrueState, id: IndicatorId, q: number): number {
  const pts = (observe(s).indicators[id]?.points ?? []).filter((p) => p.forQtr === q)
  expect(pts.length).toBeGreaterThan(0)
  return pts.sort((a, b) => a.revision - b.revision)[pts.length - 1].value
}

describe('the price bureau (§6.1 disaggregation)', () => {
  it('boards exist only once the bureau is funded', () => {
    const poor = observe(play('px-1', 12, 0.1)).indicators
    expect(poor.price_food).toBeUndefined()
    expect(poor.price_fuel).toBeUndefined()
    const funded = observe(play('px-1', 12, 0.3)).indicators
    expect(funded.price_food).toBeDefined()
    expect(funded.price_fuel).toBeDefined()
    for (const p of [...funded.price_food!.points, ...funded.price_fuel!.points]) {
      expect(p.value).toBeGreaterThan(30) // an index near 100, not garbage
      expect(p.value).toBeLessThan(400)
    }
  })

  it('publishes fast: the boards are a quarter fresher than the GDP print', () => {
    const s = play('px-2', 12, 0.3)
    const pub = observe(s)
    const newest = (id: IndicatorId) => Math.max(...pub.indicators[id]!.points.map((p) => p.forQtr))
    expect(newest('price_food')).toBe(s.meta.tick - 1)
    expect(newest('gdp_growth')).toBe(s.meta.tick - 2) // low capacity: everything else lags
  })

  it('your own fuel excise prints on your own fuel board — and only there', () => {
    const opts = { ticks: 16, params: withStats(0.3), lenient: false as const }
    const base = runOne({ seed: 'px-3', ...opts, includeStateHash: false }).finalState
    const taxed = runOne({ seed: 'px-3', ...opts, script: fuelTaxAtQ8, includeStateHash: false }).finalState
    // the quarter the excise lands (q8), the fuel board jumps with it
    const fuelJump = printAt(taxed, 'price_fuel', 8) / printAt(base, 'price_fuel', 8)
    const foodJump = printAt(taxed, 'price_food', 8) / printAt(base, 'price_food', 8)
    expect(fuelJump).toBeGreaterThan(1.25)
    // disaggregation is the point: the boards locate the shock at fuel, not food
    expect(fuelJump).toBeGreaterThan(foodJump + 0.15)
    // and it is not a one-print blip — still on the board a year later
    expect(printAt(taxed, 'price_fuel', 12) / printAt(base, 'price_fuel', 12)).toBeGreaterThan(1.2)
  })
})

describe('the household survey (Gini)', () => {
  it('is the luxury instrument: no series until the survey is funded', () => {
    expect(observe(play('gini-1', 12, 0.5)).indicators.gini).toBeUndefined()
    const surveyed = observe(play('gini-1', 12, 0.7)).indicators.gini
    expect(surveyed).toBeDefined()
    for (const p of surveyed!.points) {
      expect(p.value).toBeGreaterThan(5) // Gini points: a real economy, not
      expect(p.value).toBeLessThan(80) // perfect equality or one landlord
    }
  })

  it('transfers reduce measured inequality — redistribution moves the number', () => {
    const base = play('gini-2', 24, 0.7)
    const boosted = play('gini-2', 24, 0.7, 2) // transfers doubled at q8
    // the truth in the worksheets…
    expect(boosted.stats.record[20].gini).toBeLessThan(base.stats.record[20].gini)
    // …and the published survey agrees (same seed, noise cancels exactly)
    const q = base.meta.tick - 1
    expect(printAt(boosted, 'gini', q)).toBeLessThan(printAt(base, 'gini', q))
  })
})
