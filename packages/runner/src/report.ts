import type { BatchResult } from './batch'
import { cagr, meanAnnualInflation, meanUnemployment, summarize } from './metrics'

function fmt(x: number): string {
  return Number.isFinite(x) ? x.toFixed(2) : String(x)
}

function line(label: string, s: ReturnType<typeof summarize>): void {
  console.log(
    `  ${label.padEnd(22)} p05=${fmt(s.p05)}  p25=${fmt(s.p25)}  p50=${fmt(s.p50)}  p75=${fmt(s.p75)}  p95=${fmt(s.p95)}`,
  )
}

export function printReport(
  batch: BatchResult,
  meta: { runs: number; ticks: number; policy: string },
): void {
  const { runs, wallMs } = batch
  const nanRuns = runs.filter((r) => r.nanCount > 0)
  const explodedRuns = runs.filter((r) => r.priceExplosions > 0)
  const deposed = runs.filter((r) => r.deposedAt !== null)

  console.log(`terrarium batch: ${meta.runs} runs × ${meta.ticks} ticks, policy=${meta.policy}`)
  console.log(
    `  wall time: ${(wallMs / 1000).toFixed(1)}s  (${(wallMs / meta.runs).toFixed(1)} ms/run)`,
  )
  console.log(`  NaN runs: ${nanRuns.length}`)
  console.log(`  price-explosion runs: ${explodedRuns.length}`)
  console.log(
    `  deposed: ${deposed.length} (${((100 * deposed.length) / runs.length).toFixed(0)}%), median quarter ${
      deposed.length ? summarize(deposed.map((r) => r.deposedAt!)).p50.toFixed(0) : '—'
    }`,
  )
  line('real growth %/yr', summarize(runs.map(cagr)))
  line('mean inflation %/yr', summarize(runs.map(meanAnnualInflation)))
  line('mean unemployment %', summarize(runs.map(meanUnemployment)))
  line(
    'final debt/GDP',
    summarize(runs.map((r) => r.trajectory[r.trajectory.length - 1].debtToGdp)),
  )
  if (nanRuns.length > 0) {
    console.log(`  first NaN seeds: ${nanRuns.slice(0, 5).map((r) => r.seed).join(', ')}`)
  }
  if (explodedRuns.length > 0) {
    console.log(
      `  first explosion seeds: ${explodedRuns.slice(0, 5).map((r) => r.seed).join(', ')}`,
    )
  }
}
