/**
 * Load-bearing mechanism claim: "a fuel tax raises bread prices without anyone
 * scripting it." The causal chain is energy → transport (30% energy inputs)
 * → agriculture (10% transport inputs), propagating through the I/O table
 * and the cost anchor — no hand-authored arrow exists.
 *
 * Measured in *relative* prices (services as numeraire — the least
 * energy-exposed sector): a big un-recycled excise is also a fiscal-drag
 * shock, so the absolute price level can move either way with the macro
 * cycle, but food must get dearer relative to everything lightly exposed.
 */

import { describe, expect, it } from 'vitest'
import { fuelTaxAtQ8 } from '@terrarium/fixtures'
import { runOne, type RunResult } from '../../packages/runner/src/run'

const SEEDS = Array.from({ length: 60 }, (_, i) => `fuel-${i}`)
const TICKS = 24 // tax lands at q8; measure the following four years

const relPrice = (r: Pick<RunResult, 'trajectory'>, sector: 'agri' | 'transport') => {
  const p = r.trajectory[TICKS - 1].prices
  return p[sector] / p.services
}

describe('fuel tax → bread prices (emergent, not scripted)', () => {
  it('food gets dearer relative to services in ≥80% of seeds', () => {
    let higher = 0
    const gaps: number[] = []
    for (const seed of SEEDS) {
      const base = runOne({ seed, ticks: TICKS, includeStateHash: false })
      const taxed = runOne({ seed, ticks: TICKS, script: fuelTaxAtQ8, lenient: false, includeStateHash: false })
      const gap = relPrice(taxed, 'agri') / relPrice(base, 'agri') - 1
      gaps.push(gap)
      if (gap > 0) higher++
    }
    const share = higher / SEEDS.length
    const medianGap = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)]
    expect(share).toBeGreaterThanOrEqual(0.8)
    expect(medianGap).toBeGreaterThan(0.005) // ≥ half a percent of relative food inflation
  })

  it('transport — the middle link — moves hardest', () => {
    let ok = 0
    for (const seed of SEEDS.slice(0, 30)) {
      const base = runOne({ seed, ticks: TICKS, includeStateHash: false })
      const taxed = runOne({ seed, ticks: TICKS, script: fuelTaxAtQ8, lenient: false, includeStateHash: false })
      const transportGap = relPrice(taxed, 'transport') / relPrice(base, 'transport') - 1
      const agriGap = relPrice(taxed, 'agri') / relPrice(base, 'agri') - 1
      if (transportGap > agriGap && transportGap > 0.03) ok++
    }
    expect(ok / 30).toBeGreaterThanOrEqual(0.8)
  })
})
