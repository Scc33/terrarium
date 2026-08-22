/** Shared shaping of IndicatorSeries for rendering — latest print per
 * quarter, plus whether a revision moved a number the player already saw.
 *
 * Gauge bounds used to live here too; they now live in `../domains` because
 * a dial's face is a fixed, per-indicator fact rather than something derived
 * from whatever happens to be in the current window.
 */

import { FIRST_YEAR } from '@terrarium/engine'
import type { IndicatorSeries } from '@terrarium/observation'

export interface ShapedPoint {
  forQtr: number
  value: number
  firstPrint: number
  errorBand: number
  /** the band the office confessed on the FIRST print — the promise it made
   * at the time the player was acting on the number. The current band is no
   * use for judging a revision: a final print admits no error at all, so
   * every later correction divides by zero and looks catastrophic. */
  firstBand: number
  revision: number
  lag: number
  /** how far the office has moved this quarter since it first printed it */
  revisionDelta: number
  /** revised and moved by more than half the band the office first confessed
   * — the quiet mark: a struck-through print in the terminal, oxblood in the
   * dossier's history strip. The loud mark is `stampWorthyRevision`. */
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
        firstBand: p.errorBand,
        revision: p.revision,
        lag: p.publishedAt - p.forQtr,
        revisionDelta: 0,
        visiblyRevised: false,
        levels: p.levels,
      })
    } else if (p.revision > cur.revision) {
      cur.value = p.value
      cur.errorBand = p.errorBand
      cur.revision = p.revision
      cur.levels = p.levels ?? cur.levels
      cur.revisionDelta = p.value - cur.firstPrint
      cur.visiblyRevised = Math.abs(cur.revisionDelta) > cur.firstBand * 0.5
    }
  }
  return [...byQtr.values()]
    .filter((p) => p.forQtr >= now - windowQtrs)
    .sort((a, b) => a.forQtr - b.forQtr)
}

export type RollingMonths = 3 | 6 | 12

/**
 * A trailing mean of the releases the chart actually has on the desk.
 *
 * Instruments publish quarterly, so the player-facing 3/6/12 month choices
 * are one, two and four consecutive quarterly prints. A gap restarts the
 * window: reaching back across an unfunded survey would draw a smooth line
 * through a period the state never measured, which is more certainty than the
 * published record contains.
 *
 * The averaged uncertainty is conservative. The mean of the component error
 * bounds remains a valid bound on their mean without assuming independent
 * measurement errors. First prints are averaged separately so later revisions
 * can still leave the same quiet correction marks as the raw chart.
 */
export function rollingAverage(
  points: readonly ShapedPoint[],
  months: RollingMonths,
): ShapedPoint[] {
  const windowQtrs = months / 3
  const result: ShapedPoint[] = []
  const mean = (window: readonly ShapedPoint[], read: (point: ShapedPoint) => number) =>
    window.reduce((sum, point) => sum + read(point), 0) / window.length

  for (let i = windowQtrs - 1; i < points.length; i++) {
    const window = points.slice(i - windowQtrs + 1, i + 1)
    const latest = window[window.length - 1]
    const firstQtr = latest.forQtr - windowQtrs + 1
    if (window.some((point, offset) => point.forQtr !== firstQtr + offset)) continue

    const value = mean(window, (point) => point.value)
    const firstPrint = mean(window, (point) => point.firstPrint)
    const firstBand = mean(window, (point) => point.firstBand)
    const revisionDelta = value - firstPrint
    result.push({
      forQtr: latest.forQtr,
      value,
      firstPrint,
      errorBand: mean(window, (point) => point.errorBand),
      firstBand,
      revision: Math.min(...window.map((point) => point.revision)),
      lag: latest.lag,
      revisionDelta,
      visiblyRevised: Math.abs(revisionDelta) > firstBand * 0.5,
      levels: latest.levels,
    })
  }

  return result
}

/**
 * How many quarters back a revision still counts as news. Beyond this the
 * player has stopped acting on the number, so re-stamping it is noise.
 * (Revisions arrive two to three quarters after the first print, so this
 * window is only just wide enough to catch them at all.)
 */
export const STAMP_WINDOW_QTRS = 3

/**
 * A revision must clear BOTH gates to be stamped. Calibrated against a
 * measured century in `tests/ui/revision-stamp.test.ts`, which holds the
 * resulting firing rate to a band so these can't drift back into wallpaper.
 */
/** wrong by more than twice the uncertainty the office confessed at the time */
export const MATERIAL_REVISION_BANDS = 2
/** …and far enough that the needle visibly moved: 6% of the dial's face */
export const MATERIAL_REVISION_FACE_FRACTION = 0.06

/**
 * The revision worth stamping, if any: the largest material revision among
 * the last few quarters.
 *
 * This gate is load-bearing in both directions. The design makes revision
 * marks carry the political-capital mechanic — the player must notice they
 * bet on a number that later moved. But the first version stamped on
 * ANY revision within six quarters, which fired on essentially every gauge
 * every quarter; a warning that never turns off carries exactly zero bits.
 *
 * Two gates, because either alone is wrong. Band-relative alone can't work:
 * a FINAL print confesses no error at all, so every later correction divides
 * by zero and looks catastrophic — the band has to be the one confessed on
 * the FIRST print, the promise the player actually acted on. And band-relative
 * saturates (the engine's revisions are routinely a couple of bands wide), so
 * the face-relative gate is what does the discriminating: it asks whether the
 * needle ended up somewhere visibly different on this particular dial, which
 * is the question the player is really asking.
 */
export function stampWorthyRevision(
  points: readonly ShapedPoint[],
  face: { lo: number; hi: number },
): ShapedPoint | null {
  if (points.length === 0) return null
  const cutoff = points[points.length - 1].forQtr - STAMP_WINDOW_QTRS
  const onFace = (face.hi - face.lo) * MATERIAL_REVISION_FACE_FRACTION
  let best: ShapedPoint | null = null
  for (const p of points) {
    if (p.forQtr < cutoff) continue
    const moved = Math.abs(p.revisionDelta)
    if (moved <= p.firstBand * MATERIAL_REVISION_BANDS || moved <= onFace) continue
    if (!best || moved > Math.abs(best.revisionDelta)) best = p
  }
  return best
}

/** Change since the previous published quarter — the thing a needle alone can
 * never tell you, and the first thing a minister actually wants to know. */
export function quarterDelta(points: readonly ShapedPoint[]): number | null {
  if (points.length < 2) return null
  return points[points.length - 1].value - points[points.length - 2].value
}

export const qtrLabel = (q: number) => `${FIRST_YEAR + Math.floor(q / 4)} Q${(q % 4) + 1}`
