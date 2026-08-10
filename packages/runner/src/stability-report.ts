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
  console.log('  player-reachable quarterly tails (p01 / p50 / p99):')
  console.log('    era          runs  quarters       inflation %        real growth %       unemployment %')
  for (const row of report.eras) {
    console.log(
      `    ${row.era.label.padEnd(11)} ${String(row.runsEntered).padStart(5)} ${String(row.quarters).padStart(9)}  ${tails(row.inflation)}  ${tails(row.realGrowth)}  ${tails(row.unemployment)}`,
    )
  }

  if (report.eras.some((era) => era.publishedInflation.count > 0)) {
    console.log('  first-release wall tails (p01 / p50 / p99):')
    console.log('    era             inflation %        real growth %       prints CPI/GDP')
    for (const row of report.eras) {
      console.log(
        `    ${row.era.label.padEnd(11)}  ${tails(row.publishedInflation)}  ${tails(row.publishedRealGrowth)}  ${String(row.publishedInflation.count).padStart(7)}/${row.publishedRealGrowth.count}`,
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
