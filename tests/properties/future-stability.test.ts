import { COUNTRY_CATALOG } from '@terrarium/engine'
import { describe, expect, it } from 'vitest'
import { developmentalPolicy } from '../../packages/runner/src/policies'
import type { RunnerPolicy } from '../../packages/runner/src/policies'
import { runOne } from '../../packages/runner/src/run'
import { analyzeStability } from '../../packages/runner/src/stability'

describe('the playable economy through 2050', () => {
  it('keeps post-2000 macro tails bounded across countries and plausible play', () => {
    const runsFor = (name: string, policy?: RunnerPolicy) =>
      COUNTRY_CATALOG.flatMap((country) =>
        Array.from({ length: 5 }, (_, index) =>
          runOne({
            country: country.id,
            seed: `future-stability-${country.id}-${index}-${name}`,
            ticks: 416,
            policy,
            includeStateHash: false,
          }),
        ),
      )
    const policyRuns = {
      passive: runsFor('passive'),
      developmental: runsFor('developmental', developmentalPolicy),
    }
    const runs = [...policyRuns.passive, ...policyRuns.developmental]
    const report = analyzeStability(runs)
    const passiveTrend = analyzeStability(policyRuns.passive).survivorTrend
    const developmentalTrend = analyzeStability(policyRuns.developmental).survivorTrend

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
      expect(era.quietQuarters, `${era.era.label} quiet sample`).toBeGreaterThan(500)
      expect(era.quietInflation.p01, `${era.era.label} quiet inflation downside`).toBeGreaterThan(-10)
      expect(era.quietInflation.p99, `${era.era.label} quiet inflation upside`).toBeLessThan(10)
      expect(era.quietRealGrowth.p01, `${era.era.label} quiet growth downside`).toBeGreaterThan(-10)
      expect(era.quietRealGrowth.p99, `${era.era.label} quiet growth upside`).toBeLessThan(12)

      const inflationWidth = era.inflation.p99 - era.inflation.p01
      const lateCenturyInflationWidth = lateCentury.inflation.p99 - lateCentury.inflation.p01
      expect(inflationWidth, `${era.era.label} inflation tail widened`).toBeLessThan(
        lateCenturyInflationWidth * 1.75,
      )
    }

    const future = report.eras.find((era) => era.era.id === 'future')!
    const quietWidth = (tail: typeof future.quietInflation) => tail.p99 - tail.p01
    expect(quietWidth(future.quietInflation), 'quiet future inflation widened').toBeLessThan(
      quietWidth(lateCentury.quietInflation) * 1.6,
    )
    expect(quietWidth(future.quietRealGrowth), 'quiet future growth widened').toBeLessThan(
      quietWidth(lateCentury.quietRealGrowth) * 1.5,
    )

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

    // Exact 40-quarter opening behavior is owned by the goldens. These
    // survivor bands keep a shock retune from buying smoother prints by
    // silently lowering century trend growth or ending more governments.
    // Productive foreign capital and v29 migration both reach this fixed
    // cohort. Relative outperformance gives developmental runs more workers,
    // so aggregate GDP can grow faster than output per resident. Pin both
    // sides of that identity: migration must not buy aggregate acceleration
    // by making the population poorer per head.
    expect(passiveTrend.survivors).toBe(26)
    expect(developmentalTrend.survivors).toBe(21)
    expect(passiveTrend.aggregateCagr.p50).toBeGreaterThan(2.3)
    expect(passiveTrend.aggregateCagr.p50).toBeLessThan(2.8)
    expect(developmentalTrend.aggregateCagr.p50).toBeGreaterThan(2.5)
    expect(developmentalTrend.aggregateCagr.p50).toBeLessThan(3.1)
    expect(passiveTrend.realGdpPerCapitaCagr.p50).toBeGreaterThan(1.4)
    expect(passiveTrend.realGdpPerCapitaCagr.p50).toBeLessThan(2.0)
    expect(developmentalTrend.realGdpPerCapitaCagr.p50).toBeGreaterThan(2.0)
    expect(developmentalTrend.realGdpPerCapitaCagr.p50).toBeLessThan(2.5)
  })
})
