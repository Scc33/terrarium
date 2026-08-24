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
    // Schema 30 separates schools from the workforce they teach. The lag
    // leaves a larger youth cohort to absorb while skills catch up, widening
    // this relative tail from 1.60× to 1.63× in the fixed sample.
    //
    // Schema 34 (pollution, ADR-0028) widens it again to 1.71×, and the cause
    // is worth stating because it is not "the economy got less stable". A
    // heavier burden makes the harvest fail more often, harvest failures move
    // food prices, and the burden is heaviest in the final era — so the future
    // tail SHOULD be wider than the one before it. Sample composition adds to
    // that: the quiet tails are computed over survivors, and pollution changes
    // who survives into 2026-2050.
    //
    // Isolating the two damage channels showed neither dominates — zeroing
    // mortality left 16.24 and halving the drought gain left 16.13 — which is
    // what a compositional effect looks like rather than a channel that is
    // simply too strong. The hard absolute -10..10 quiet bounds above still own
    // safety and still pass; this stays a tightness guard, now at the same
    // 1.75 its per-era sibling above uses.
    expect(quietWidth(future.quietInflation), 'quiet future inflation widened').toBeLessThan(
      quietWidth(lateCentury.quietInflation) * 1.75,
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
    //
    // v34 (pollution, ADR-0028) costs the DEVELOPMENTAL cohort three of its
    // twenty-two survivors and leaves the passive cohort untouched at
    // twenty-six. That split is the mechanic rather than a regression, and it
    // is the reason to pin both numbers rather than one: a burden that taxed
    // everybody would have moved the passive figure too, and a burden nobody
    // felt would have moved neither. Only countries that industrialise past
    // their 1946 inheritance carry it, and the developmental policy
    // industrialises without ever legislating — the emissions standard is the
    // answer it does not use. Measured beside it, the `regulated` policy,
    // which does legislate, deposes 7% against developmental's 10%.
    //
    // v35 (the basket, ADR-0029) gains the passive cohort one survivor and
    // leaves developmental alone, which is worth a line because the 1000x400q
    // batches move much further: developmental deposition goes 9% to 17%
    // there. The passive gain is the `init` income-basis fix that shipped
    // beside it — three legs of the opening habit were seeded on a different
    // basis from the one `cohorts.run` recomputes them on, and the opening
    // therefore read as a small recession nobody had. A fixed cohort of a few
    // dozen runs cannot resolve seven points of deposition, so read this as a
    // tail and explosion guard and the batch as the survival measurement.
    expect(passiveTrend.survivors).toBe(27)
    expect(developmentalTrend.survivors).toBe(19)
    expect(passiveTrend.aggregateCagr.p50).toBeGreaterThan(2.3)
    // An already-taught workforce now outlives institutional school decay,
    // lifting this fixed passive sample from 2.79% to 2.81% without changing
    // its per-head, survival, or tail-safety bands.
    expect(passiveTrend.aggregateCagr.p50).toBeLessThan(2.85)
    expect(developmentalTrend.aggregateCagr.p50).toBeGreaterThan(2.5)
    expect(developmentalTrend.aggregateCagr.p50).toBeLessThan(3.1)
    expect(passiveTrend.realGdpPerCapitaCagr.p50).toBeGreaterThan(1.4)
    expect(passiveTrend.realGdpPerCapitaCagr.p50).toBeLessThan(2.0)
    expect(developmentalTrend.realGdpPerCapitaCagr.p50).toBeGreaterThan(2.0)
    expect(developmentalTrend.realGdpPerCapitaCagr.p50).toBeLessThan(2.5)
  })
})
