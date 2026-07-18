/** Shared shaping of IndicatorSeries for rendering — latest print per
 * quarter, plus whether a revision moved a number the player already saw. */

import type { IndicatorSeries } from '@terrarium/observation'

export interface ShapedPoint {
  forQtr: number
  value: number
  firstPrint: number
  errorBand: number
  revision: number
  lag: number
  /** revised and moved by more than a third of the first print's band */
  visiblyRevised: boolean
  levels?: { real: number; nominal: number }
}

export function shapeSeries(series: IndicatorSeries, windowQtrs: number, now: number): ShapedPoint[] {
  const byQtr = new Map<number, ShapedPoint>()
  for (const p of series.points) {
    const cur = byQtr.get(p.forQtr)
    if (!cur) {
      byQtr.set(p.forQtr, {
        forQtr: p.forQtr,
        value: p.value,
        firstPrint: p.value,
        errorBand: p.errorBand,
        revision: p.revision,
        lag: p.publishedAt - p.forQtr,
        visiblyRevised: false,
        levels: p.levels,
      })
    } else if (p.revision > cur.revision) {
      cur.value = p.value
      cur.errorBand = p.errorBand
      cur.revision = p.revision
      cur.levels = p.levels ?? cur.levels
      cur.visiblyRevised =
        Math.abs(p.value - cur.firstPrint) > Math.max(0.4, cur.errorBand * 0.5)
    }
  }
  return [...byQtr.values()]
    .filter((p) => p.forQtr >= now - windowQtrs)
    .sort((a, b) => a.forQtr - b.forQtr)
}

export const qtrLabel = (q: number) => `${1946 + Math.floor(q / 4)} Q${(q % 4) + 1}`

/** round a range out to pleasant gauge bounds */
export function niceBounds(lo: number, hi: number): [number, number] {
  if (hi - lo < 2) {
    const mid = (hi + lo) / 2
    lo = mid - 1
    hi = mid + 1
  }
  const step = Math.pow(10, Math.floor(Math.log10(hi - lo)))
  return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step]
}
