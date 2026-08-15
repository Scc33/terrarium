import type { RunResult } from './run'

type TrajectoryRun = Pick<RunResult, 'trajectory'>

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

export function summarize(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    p05: quantile(sorted, 0.05),
    p25: quantile(sorted, 0.25),
    p50: quantile(sorted, 0.5),
    p75: quantile(sorted, 0.75),
    p95: quantile(sorted, 0.95),
    mean: values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1),
  }
}

/** annualized real growth over the whole run, %/yr */
export function cagr(run: TrajectoryRun): number {
  const first = run.trajectory[0]
  const last = run.trajectory[run.trajectory.length - 1]
  const years = (last.tick - first.tick) / 4
  if (years <= 0 || first.realGdp <= 0) return 0
  return (Math.pow(last.realGdp / first.realGdp, 1 / years) - 1) * 100
}

export function meanAnnualInflation(run: TrajectoryRun): number {
  const t = run.trajectory
  return (t.reduce((s, p) => s + p.inflationQ, 0) / Math.max(t.length, 1)) * 4 * 100
}

export function meanUnemployment(run: TrajectoryRun): number {
  const t = run.trajectory
  return (t.reduce((s, p) => s + p.unemployment, 0) / Math.max(t.length, 1)) * 100
}

/** price of a sector at a given tick, from the trajectory */
export function priceAt(run: RunResult, sector: keyof RunResult['trajectory'][0]['prices'], tick: number): number {
  const p = run.trajectory.find((x) => x.tick === tick)
  if (!p) throw new Error(`no trajectory point at tick ${tick}`)
  return p.prices[sector]
}
