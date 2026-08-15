/**
 * Time-series geometry — scales, ticks and paths for every line, area and
 * ribbon in the game.
 *
 * This is `shares.ts`'s bargain applied to the other half of the charts: the
 * arithmetic leaves the component so a test can hold it, because path
 * arithmetic is precisely what a jsdom render test cannot see. Five charts
 * used to carry private copies of `sx`/`sy` and their own y-axis policy —
 * the wall's terminal ticker, the ledger's line, the finance overlay's fog
 * chart, and the census's transition and population strips — and no two of
 * them agreed about what to do when a value left the frame.
 *
 * Nothing here knows what an indicator is. It takes ticks and values and
 * returns numbers and path strings; `TimeSeriesChart` paints them.
 *
 * ## The y-axis policy, and why it is not the dial's
 *
 * A dial's face is FIXED and values outside it peg at the rail (ADR-0006) —
 * a face redrawn under its own needle makes needle position meaningless.
 * A chart is a different instrument with a different failure mode. The
 * terminal ticker used to borrow the dial's face and CLAMP the trace into
 * it, which drew a hyperinflation and a calm plateau as the same flat line
 * along the rail. Measured over a surveyed century, `price_fuel` reaches
 * 152 against a 130 face, `gdp_growth` spans −33 to +54 against ±15, and
 * `inflation` reaches 42 — so the clamp erased the most legible moments in
 * the century, and erased them silently.
 *
 * So a chart FRAMES against the face rather than obeying it: the axis is the
 * face, extended outward only where the data leaves it, and the face's own
 * rails are then drawn as reference rules (`Axis.faceLo` / `faceHi`). A
 * normal century is pixel-identical to a fixed face; a crisis shows the whole
 * excursion *and* says it went off the dial. The dial itself is untouched,
 * so ADR-0006's promise still holds where it was made.
 */

import type { Domain } from './domains'
import { thin } from './shares'

export interface PlotPoint {
  tick: number
  value: number
}

/** a value with a confessed half-width, for the uncertainty ribbon */
export interface BandPoint extends PlotPoint {
  band: number
}

export interface PlotBox {
  w: number
  h: number
  padL: number
  padR: number
  padT: number
  padB: number
}

/**
 * How the vertical axis is chosen. Every field is optional; with none of
 * them the axis is simply the data, rounded outward onto a readable grid.
 */
export interface YAxisSpec {
  /** a fixed dial face to frame against — never shrunk inside, extended
   * outward only where the data leaves it, and marked where it ended */
  face?: Domain
  /** values the axis must contain whatever the data does: zero for a rate,
   * 100 for an index, a floor that keeps a quiet series from filling the box */
  include?: readonly number[]
  /** breathing room as a fraction of the data span, applied only where no
   * face pins the rail. Zero draws the trace against the frame. */
  pad?: number
  /** how many gridlines to aim for; the tick step is rounded to a readable
   * 1/2/5 × 10ⁿ, so the count is a target rather than a promise */
  ticks?: number
}

export interface Axis {
  lo: number
  hi: number
  /** the fixed face's lower rail, when the axis had to extend below it —
   * `null` when there is no face, or the face already contained the data */
  faceLo: number | null
  faceHi: number | null
  /** readable gridline values, ascending, inside [lo, hi] */
  ticks: number[]
}

export interface TimePlot {
  x0: number
  x1: number
  y: Axis
  sx(tick: number): number
  sy(value: number): number
  /** a polyline; `null` when fewer than two points can be drawn */
  line(points: readonly PlotPoint[]): string | null
  /** a line closed down to a baseline value — an area fill */
  area(points: readonly PlotPoint[], baseline: number): string | null
  /** a closed ribbon between value+band and value−band */
  ribbon(points: readonly BandPoint[]): string | null
  /** the region between two series: births over deaths, revenue over outlays.
   * Only the ticks the two have in common are enclosed. */
  wedge(over: readonly PlotPoint[], under: readonly PlotPoint[]): string | null
}

const n1 = (x: number) => x.toFixed(1)
const finite = (p: PlotPoint) => Number.isFinite(p.tick) && Number.isFinite(p.value)

/**
 * Strip the float dust a tick step leaves behind, so an axis prints `0.3`
 * rather than `0.30000000000000004` and `-0` never reaches a label.
 */
function onGrid(value: number, step: number): number {
  const places = Math.max(0, Math.min(20, -Math.floor(Math.log10(step)) + 1))
  const rounded = Number(value.toFixed(places))
  return rounded === 0 ? 0 : rounded
}

/**
 * A readable gridline step: 1, 2 or 5 times a power of ten. `target` is the
 * number of intervals wanted, not a count the result must hit — rounding the
 * step to a human number is the whole point, and it necessarily moves the
 * count by one either way.
 */
export function tickStep(span: number, target = 4): number {
  if (!(span > 0) || !Number.isFinite(span) || target < 1) return 1
  const raw = span / target
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  return (norm >= 5 ? 10 : norm >= 2.5 ? 5 : norm >= 1.2 ? 2 : 1) * mag
}

/**
 * Gridline values across a range, on a readable step. Computed by index
 * rather than by accumulation: `v += step` four hundred times drifts far
 * enough to print a gridline at 99.99999999999999.
 *
 * A drawable axis always carries at least TWO labelled values. Rounding to a
 * readable step can otherwise leave one, or none: a series living in 75–87
 * against a step of 10 labels only `80`, and a chart with a single number up
 * its side gives the reader no scale at all — they cannot tell a rise of two
 * points from a rise of twenty. So the step refines until two fit, and falls
 * back to labelling the rails themselves.
 */
export function niceTicks(lo: number, hi: number, target = 4): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || !(hi > lo)) return [lo]
  for (const t of [target, target * 2, target * 4]) {
    const step = tickStep(hi - lo, t)
    const eps = step * 1e-9
    const out: number[] = []
    for (let i = Math.ceil(lo / step - 1e-9); i * step <= hi + eps; i++) {
      out.push(onGrid(i * step, step))
    }
    if (out.length >= 2) return out
  }
  return [lo, hi]
}

/**
 * The vertical axis for a set of series.
 *
 * With a face, the rails start at the face and can only move outward — which
 * is what makes the trace's height comparable to the dial beside it in every
 * normal quarter, and comparable between the 40Q and ALL views. Where the
 * data does leave the face the rail is pushed out to a readable number and
 * the face's own bound is reported back so the painter can rule it.
 *
 * With no face the axis is the data, padded and rounded outward. A series
 * that never moves still gets a box with height, because a zero-span axis
 * divides by zero and paints every point on one line.
 */
export function yAxis(values: readonly number[], spec: YAxisSpec = {}): Axis {
  const face = spec.face
  const seen = values.filter((v) => Number.isFinite(v))
  const anchors = (spec.include ?? []).filter((v) => Number.isFinite(v))
  const pool = [...seen, ...anchors]

  let lo: number
  let hi: number
  if (face) {
    lo = Math.min(face.lo, ...pool)
    hi = Math.max(face.hi, ...pool)
  } else if (pool.length > 0) {
    lo = Math.min(...pool)
    hi = Math.max(...pool)
    const pad = (spec.pad ?? 0) * (hi - lo)
    lo -= pad
    hi += pad
  } else {
    return { lo: 0, hi: 1, faceLo: null, faceHi: null, ticks: [0, 1] }
  }

  // A face that the data left gets its rail pushed out to the same readable
  // grid the gridlines use, so the extended rail carries a label worth
  // reading rather than the raw extremum's fifteenth decimal place.
  const step = tickStep(Math.max(hi - lo, Number.MIN_VALUE), spec.ticks ?? 4)
  const belowFace = face !== undefined && lo < face.lo
  const aboveFace = face !== undefined && hi > face.hi
  if (belowFace) lo = onGrid(Math.floor(lo / step) * step, step)
  if (aboveFace) hi = onGrid(Math.ceil(hi / step) * step, step)

  if (!(hi > lo)) {
    // a flat series, or a degenerate face: give the box a unit of height
    // rather than a scale that divides by zero
    const mid = Number.isFinite(lo) ? lo : 0
    lo = mid - 0.5
    hi = mid + 0.5
  }

  return {
    lo,
    hi,
    faceLo: belowFace ? face!.lo : null,
    faceHi: aboveFace ? face!.hi : null,
    ticks: niceTicks(lo, hi, spec.ticks ?? 4),
  }
}

/**
 * Scales and path builders for a plot box.
 *
 * `x0`/`x1` default to the extent of the series passed, but a caller that is
 * drawing several charts against a shared timeline (the census's transition
 * diagram over its population strip) passes them explicitly so the two share
 * an axis even when one of them has published fewer quarters.
 */
export function timePlot(
  series: ReadonlyArray<readonly PlotPoint[]>,
  box: PlotBox,
  spec: YAxisSpec = {},
  domain?: { x0: number; x1: number },
): TimePlot {
  const points = series.flat().filter(finite)
  const ticks = points.map((p) => p.tick)
  const x0 = domain?.x0 ?? (ticks.length > 0 ? Math.min(...ticks) : 0)
  const x1 = domain?.x1 ?? (ticks.length > 0 ? Math.max(...ticks) : x0)
  const y = yAxis(points.map((p) => p.value), spec)

  const spanX = Math.max(x1 - x0, 1)
  const innerW = box.w - box.padL - box.padR
  const innerH = box.h - box.padT - box.padB
  const sx = (t: number) => box.padL + ((t - x0) / spanX) * innerW
  const sy = (v: number) => box.padT + ((y.hi - v) / (y.hi - y.lo)) * innerH

  // A century is 400 quarters against a few hundred px of chart; drawing
  // every one costs path length for detail nobody can see. Thinning here
  // rather than in each caller means no chart forgets to.
  const drawable = (points: readonly PlotPoint[]) => thin(points.filter(finite), Math.ceil(innerW))
  const at = (p: PlotPoint) => `${n1(sx(p.tick))},${n1(sy(p.value))}`

  const line = (points: readonly PlotPoint[]) => {
    const ps = drawable(points)
    return ps.length >= 2 ? `M${ps.map(at).join('L')}` : null
  }

  return {
    x0,
    x1,
    y,
    sx,
    sy,
    line,
    area(points, baseline) {
      const ps = drawable(points)
      if (ps.length < 2) return null
      const floor = n1(sy(baseline))
      return (
        `M${ps.map(at).join('L')}` +
        `L${n1(sx(ps[ps.length - 1].tick))},${floor}` +
        `L${n1(sx(ps[0].tick))},${floor}Z`
      )
    },
    ribbon(points) {
      const ps = thin(points.filter((p) => finite(p) && Number.isFinite(p.band)), Math.ceil(innerW))
      if (ps.length < 2) return null
      const top = ps.map((p) => `${n1(sx(p.tick))},${n1(sy(p.value + p.band))}`).join('L')
      const bottom = [...ps]
        .reverse()
        .map((p) => `${n1(sx(p.tick))},${n1(sy(p.value - p.band))}`)
        .join('L')
      return `M${top}L${bottom}Z`
    },
    wedge(over, under) {
      const floor = new Map(under.filter(finite).map((p) => [p.tick, p.value]))
      const shared = over.filter((p) => finite(p) && floor.has(p.tick))
      const ps = thin(shared, Math.ceil(innerW))
      if (ps.length < 2) return null
      const top = ps.map(at).join('L')
      const bottom = [...ps]
        .reverse()
        .map((p) => `${n1(sx(p.tick))},${n1(sy(floor.get(p.tick)!))}`)
        .join('L')
      return `M${top}L${bottom}Z`
    },
  }
}

/**
 * How many decimals an axis should print, from the gap between its gridlines.
 *
 * Per-VALUE precision is the trap: `v => v.toFixed(v < 10 ? 1 : 0)` prints an
 * axis reading `0.0, 20, 40`, which looks like three different quantities.
 * Precision is a property of the scale, so it is decided once for the whole
 * axis and every label on it agrees.
 */
export function axisDecimals(axis: Axis): number {
  const step = axis.ticks.length >= 2 ? Math.abs(axis.ticks[1] - axis.ticks[0]) : axis.hi - axis.lo
  if (!(step > 0)) return 0
  return Math.max(0, Math.min(4, Math.ceil(-Math.log10(step))))
}

/**
 * The point nearest a cursor, for the hover readout. Nearest in TICK space,
 * not pixels — the caller has already converted, and a chart whose x-axis is
 * a century still wants the quarter under the pointer.
 */
export function nearestPoint<T extends { tick: number }>(
  points: readonly T[],
  tick: number,
): T | null {
  let best: T | null = null
  let bestD = Infinity
  for (const p of points) {
    const d = Math.abs(p.tick - tick)
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return best
}
