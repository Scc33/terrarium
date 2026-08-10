import { COUNTRY_CATALOG } from '@terrarium/engine'
import { describe, expect, it } from 'vitest'
import { developmentalPolicy } from '../../packages/runner/src/policies'
import { runOne } from '../../packages/runner/src/run'
import { analyzeStability } from '../../packages/runner/src/stability'

describe('the playable economy through 2050', () => {
  it('keeps post-2000 macro tails bounded across countries and plausible play', () => {
    const runs = COUNTRY_CATALOG.flatMap((country) =>
      Array.from({ length: 5 }, (_, index) =>
        [undefined, developmentalPolicy].map((policy) =>
          runOne({
            country: country.id,
            seed: `future-stability-${country.id}-${index}-${policy ? 'developmental' : 'passive'}`,
            ticks: 416,
            policy,
          }),
        ),
      ).flat(),
    )
    const report = analyzeStability(runs)

    expect(report.reachableNonFiniteRuns).toEqual([])
    expect(report.reachablePriceExplosionRuns).toEqual([])

    const lateCentury = report.eras.find((era) => era.era.id === 'late_century')!
    for (const id of ['early_2000s', 'future'] as const) {
      const era = report.eras.find((candidate) => candidate.era.id === id)!
      expect(era.runsEntered, `${era.era.label} sample collapsed`).toBeGreaterThan(runs.length / 2)
      expect(era.inflation.p01, `${era.era.label} inflation downside`).toBeGreaterThan(-20)
      expect(era.inflation.p99, `${era.era.label} inflation upside`).toBeLessThan(25)
      expect(era.realGrowth.p01, `${era.era.label} growth downside`).toBeGreaterThan(-20)
      expect(era.realGrowth.p99, `${era.era.label} growth upside`).toBeLessThan(30)
      expect(era.unemployment.p99, `${era.era.label} unemployment`).toBeLessThan(30)
      expect(era.publishedInflation.count, `${era.era.label} CPI sample`).toBeGreaterThan(250)
      expect(era.publishedInflation.p01, `${era.era.label} published CPI downside`).toBeGreaterThan(-25)
      expect(era.publishedInflation.p99, `${era.era.label} published CPI upside`).toBeLessThan(30)
      expect(era.publishedRealGrowth.count, `${era.era.label} GDP sample`).toBeGreaterThan(250)
      expect(era.publishedRealGrowth.p01, `${era.era.label} published growth downside`).toBeGreaterThan(-30)
      expect(era.publishedRealGrowth.p99, `${era.era.label} published growth upside`).toBeLessThan(35)

      const inflationWidth = era.inflation.p99 - era.inflation.p01
      const lateCenturyInflationWidth = lateCentury.inflation.p99 - lateCentury.inflation.p01
      expect(inflationWidth, `${era.era.label} inflation tail widened`).toBeLessThan(
        lateCenturyInflationWidth * 1.75,
      )
    }

    const lateDroughts = report.shocks.filter(
      (shock) =>
        shock.event === 'drought' &&
        (shock.era.id === 'early_2000s' || shock.era.id === 'future'),
    )
    expect(lateDroughts.reduce((sum, shock) => sum + shock.completeWindows, 0)).toBeGreaterThan(20)
    for (const shock of lateDroughts) {
      expect(shock.peakInflation.p95, `${shock.era.label} drought inflation`).toBeLessThan(30)
      expect(shock.laterInflationTrough.p05, `${shock.era.label} drought deflation`).toBeGreaterThan(-20)
      expect(shock.reboundGrowth.p95, `${shock.era.label} drought rebound`).toBeLessThan(35)
    }
  })
})
