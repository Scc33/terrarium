/**
 * M1 exit criterion (b): "a subsidy in a low-capacity state does more harm
 * than good." The mechanism: with administrative capacity ~0.3, most of the
 * subsidy leaks before reaching the sector, but the full amount hits the
 * budget — deficit, debt service, and (if markets balk) the printing press,
 * for very little price relief.
 */

import { describe, expect, it } from 'vitest'
import { agriSubsidyAtQ8, standardCountry } from '@terrarium/fixtures'
import { init } from '@terrarium/engine'
import { runOne } from '../../packages/runner/src/run'

const SEEDS = Array.from({ length: 40 }, (_, i) => `subsidy-${i}`)
const TICKS = 40

describe('farm subsidy in a low-capacity state', () => {
  it('mostly buys debt and inflation, not cheaper bread', () => {
    let harmed = 0
    for (const seed of SEEDS) {
      const gdp0 = init(standardCountry, seed).flows.nominalGdp
      const base = runOne({ seed, ticks: TICKS, params: standardCountry })
      const sub = runOne({
        seed,
        ticks: TICKS,
        params: standardCountry,
        script: agriSubsidyAtQ8(gdp0),
        lenient: false,
      })
      const last = TICKS - 1
      const debtWorse = sub.trajectory[last].debtToGdp > base.trajectory[last].debtToGdp + 0.02
      const inflWorse =
        meanInflation(sub.trajectory.slice(8)) >= meanInflation(base.trajectory.slice(8)) - 0.001
      // "good" would be cheaper food for the people; leakage means the
      // relief is a fraction of what was paid for
      const breadRelief =
        1 - sub.trajectory[last].prices.agri / base.trajectory[last].prices.agri
      const reliefTiny = breadRelief < 0.05
      if (debtWorse && inflWorse && reliefTiny) harmed++
    }
    expect(harmed / SEEDS.length).toBeGreaterThanOrEqual(0.7)
  })
})

function meanInflation(points: Array<{ inflationQ: number }>): number {
  return points.reduce((s, p) => s + p.inflationQ, 0) / Math.max(points.length, 1)
}
