import type { StabilityReport, TailSummary } from './stability'

function fmt(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '—'
}

function tails(summary: TailSummary): string {
  return `${fmt(summary.p01).padStart(7)} / ${fmt(summary.p50).padStart(6)} / ${fmt(summary.p99).padStart(6)}`
}

export function printStabilityReport(
  report: StabilityReport,
  meta: { ticks: number; policy: string; country: string; wallMs: number },
): void {
  console.log(
    `terrarium stability: ${report.runs} runs × ${meta.ticks} ticks, policy=${meta.policy}, country=${meta.country}`,
  )
  console.log(`  wall time: ${(meta.wallMs / 1000).toFixed(1)}s`)
  console.log(
    `  failures: reachable non-finite=${report.reachableNonFiniteRuns.length}  price explosion reachable/raw=${report.reachablePriceExplosionRuns.length}/${report.rawPriceExplosionRuns.length}`,
  )
  console.log(
    `  survivor trend (${report.survivorTrend.survivors}/${report.runs}; median CAGR): ` +
    `GDP=${fmt(report.survivorTrend.aggregateCagr.p50)}%  ` +
    `per capita=${fmt(report.survivorTrend.realGdpPerCapitaCagr.p50)}%  ` +
    `population=${fmt(report.survivorTrend.populationCagr.p50)}%`,
  )
  console.log('  player-reachable quarterly tails (p01 / p50 / p99):')
  console.log('    era          runs  quarters       inflation %        real growth %       unemployment %')
  for (const row of report.eras) {
    console.log(
      `    ${row.era.label.padEnd(11)} ${String(row.runsEntered).padStart(5)} ${String(row.quarters).padStart(9)}  ${tails(row.inflation)}  ${tails(row.realGrowth)}  ${tails(row.unemployment)}`,
    )
  }

  console.log('  quiet growth identity, mean annualized log-growth points:')
  console.log('    era             GDP   per capita  population  productivity  emp. rate  LF / pop  labor force')
  for (const row of report.eras) {
    const d = row.quietDrivers
    console.log(
      `    ${row.era.label.padEnd(11)} ${fmt(d.aggregateLogGrowth.mean).padStart(7)} ${fmt(d.realGdpPerCapitaContribution.mean).padStart(11)} ${fmt(d.populationContribution.mean).padStart(11)} ${fmt(d.laborProductivityContribution.mean).padStart(13)} ${fmt(d.employmentRateContribution.mean).padStart(10)} ${fmt(d.laborForceShareContribution.mean).padStart(9)} ${fmt(d.laborForceContribution.mean).padStart(12)}`,
    )
  }

  console.log('  quiet quarters with a contracting labor force, mean log-growth points:')
  console.log('    era          quarters  labor force   GDP  per capita  population  productivity  emp. rate  LF / pop')
  for (const row of report.eras) {
    const d = row.quietDrivers.laborContraction
    const observed = (value: number) => d.observations > 0 ? fmt(value) : '—'
    console.log(
      `    ${row.era.label.padEnd(11)} ${String(d.observations).padStart(8)} ${observed(d.laborForceGrowth.mean).padStart(12)} ${observed(d.aggregateLogGrowth.mean).padStart(5)} ${observed(d.realGdpPerCapitaContribution.mean).padStart(11)} ${observed(d.populationContribution.mean).padStart(11)} ${observed(d.laborProductivityContribution.mean).padStart(13)} ${observed(d.employmentRateContribution.mean).padStart(10)} ${observed(d.laborForceShareContribution.mean).padStart(9)}`,
    )
  }

  console.log('  quiet-quarter true tails, excluding onset + 8q (p01 / p50 / p99):')
  console.log('    era          quiet qtrs       inflation %        real growth %')
  for (const row of report.eras) {
    console.log(
      `    ${row.era.label.padEnd(11)} ${String(row.quietQuarters).padStart(10)}  ${tails(row.quietInflation)}  ${tails(row.quietRealGrowth)}`,
    )
  }
  console.log('  population identity in the worst 5% of quiet growth, median log-growth points:')
  console.log('    era          GDP log  per capita  population  productivity  emp. rate  LF / pop')
  for (const row of report.eras) {
    const d = row.quietDrivers.downside
    console.log(
      `    ${row.era.label.padEnd(11)} ${fmt(d.aggregateLogGrowth.p50).padStart(7)} ${fmt(d.realGdpPerCapitaContribution.p50).padStart(11)} ${fmt(d.populationContribution.p50).padStart(11)} ${fmt(d.laborProductivityContribution.p50).padStart(13)} ${fmt(d.employmentRateContribution.p50).padStart(10)} ${fmt(d.laborForceShareContribution.p50).padStart(9)}`,
    )
  }

  console.log('  quiet-quarter drivers (p01 / p50 / p99):')
  console.log('    era          productivity growth    employment growth      TFP growth       utilization')
  for (const row of report.eras) {
    console.log(
      `    ${row.era.label.padEnd(11)}  ${tails(row.quietDrivers.laborProductivityGrowth)}  ${tails(row.quietDrivers.employmentGrowth)}  ${tails(row.quietDrivers.tfpGrowth)}  ${tails(row.quietDrivers.utilization)}`,
    )
  }

  console.log('  worst 5% of quiet growth, median driver (log-growth points unless marked):')
  console.log('    era             GDP     productivity  employment    TFP  labor force  real wage   d.util  demand met')
  for (const row of report.eras) {
    const d = row.quietDrivers.downside
    console.log(
      `    ${row.era.label.padEnd(11)} ${fmt(d.realGrowth.p50).padStart(7)} ${fmt(d.laborProductivityContribution.p50).padStart(12)} ${fmt(d.employmentContribution.p50).padStart(11)} ${fmt(d.tfpGrowth.p50).padStart(6)} ${fmt(d.laborForceGrowth.p50).padStart(12)} ${fmt(d.realWageGrowth.p50).padStart(10)} ${fmt(d.utilizationChange.p50).padStart(8)} ${fmt(d.demandSatisfaction.p50).padStart(10)}`,
    )
  }
  console.log('  demand in the worst 5% of quiet growth, median annualized change:')
  console.log('    era          final demand  household  investment  government     exports  export share  inv/GDP')
  for (const row of report.eras) {
    const d = row.quietDrivers.downside
    console.log(
      `    ${row.era.label.padEnd(11)} ${fmt(d.finalDemandGrowth.p50).padStart(13)} ${fmt(d.householdDemandGrowth.p50).padStart(10)} ${fmt(d.investmentGrowth.p50).padStart(11)} ${fmt(d.governmentDemandGrowth.p50).padStart(11)} ${fmt(d.exportGrowth.p50).padStart(11)} ${fmt(d.exportShare.p50).padStart(12)} ${fmt(d.investmentRate.p50).padStart(8)}`,
    )
  }

  if (report.eras.some((era) => era.publishedInflation.count > 0)) {
    console.log('  first-release wall tails (p01 / p50 / p99):')
    console.log('    era             inflation %        real growth %           HDI        prints CPI/GDP/HDI')
    for (const row of report.eras) {
      console.log(
        `    ${row.era.label.padEnd(11)}  ${tails(row.publishedInflation)}  ${tails(row.publishedRealGrowth)}  ${tails(row.publishedHumanDevelopment)}  ${String(row.publishedInflation.count).padStart(7)}/${row.publishedRealGrowth.count}/${row.publishedHumanDevelopment.count}`,
      )
    }
    console.log('  quiet-quarter wall tails (p01 / p50 / p99):')
    console.log('    era             inflation %        real growth %       prints CPI/GDP')
    for (const row of report.eras) {
      console.log(
        `    ${row.era.label.padEnd(11)}  ${tails(row.quietPublishedInflation)}  ${tails(row.quietPublishedRealGrowth)}  ${String(row.quietPublishedInflation.count).padStart(7)}/${row.quietPublishedRealGrowth.count}`,
      )
    }
  }

  const observed = report.shocks.filter((shock) => shock.onsets > 0)
  if (observed.length > 0) {
    console.log('  shock response (complete windows; p50 / p95):')
    console.log('    era          event             n      peak CPI     later CPI   rebound growth')
    for (const row of observed) {
      const pair = (summary: TailSummary) => `${fmt(summary.p50).padStart(6)} / ${fmt(summary.p95).padStart(6)}`
      console.log(
        `    ${row.era.label.padEnd(11)} ${row.event.padEnd(14)} ${String(row.completeWindows).padStart(4)}  ${pair(row.peakInflation)}  ${pair(row.laterInflationTrough)}  ${pair(row.reboundGrowth)}`,
      )
    }
  }

  if (report.reachableNonFiniteRuns.length > 0) {
    console.log(`  first reachable non-finite seeds: ${report.reachableNonFiniteRuns.slice(0, 5).join(', ')}`)
  }
  if (report.reachablePriceExplosionRuns.length > 0) {
    console.log(`  first reachable explosion seeds: ${report.reachablePriceExplosionRuns.slice(0, 5).join(', ')}`)
  }
}
