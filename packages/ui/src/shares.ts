/**
 * Shares of a whole — the geometry behind every composition view.
 *
 * The wall's lesson (M5.5) was that anything you want a test to hold has to
 * leave the component, because layout and path arithmetic are exactly what a
 * jsdom render test cannot see. So the maths of a pie and of a stacked band
 * live here, as data, and `InkPie` / `InkStack` do nothing but paint what this
 * module returns. `tests/ui/shares.test.ts` pins it.
 *
 * Nothing here knows what a budget is. It takes keyed values and returns
 * paths — the treasury's two sides today, output by sector the day that lands.
 */

/** One category of a whole. `ink` is a CSS colour, drawn straight into the
 * SVG the way the rest of the dossier register does it. */
export interface Share {
  key: string
  label: string
  value: number
  ink: string
  /** what this category actually is, for the legend's tooltip */
  note?: string
}

export interface Slice extends Share {
  /** 0..1 of the total */
  share: number
  /** a closed donut wedge, wound so `fill-rule: evenodd` renders the hole */
  path: string
}

export interface DonutGeom {
  cx: number
  cy: number
  /** outer radius */
  r: number
  /** inner radius; 0 draws a solid pie */
  ri: number
}

/**
 * The categorical ramp, in draw order — six inks a period printer could
 * actually mix (see `index.css`). Six is not arbitrary: it is the widest split
 * the books have (outlays by programme), and past six a pie stops being
 * readable anyway — bucket the tail into "other" instead of adding a seventh.
 */
export const SHARE_INKS = [
  'var(--color-share-1)',
  'var(--color-share-2)',
  'var(--color-share-3)',
  'var(--color-share-4)',
  'var(--color-share-5)',
  'var(--color-share-6)',
] as const

const TAU = Math.PI * 2
const n2 = (x: number) => x.toFixed(2)

function polar(g: DonutGeom, r: number, a: number): string {
  return `${n2(g.cx + r * Math.cos(a))},${n2(g.cy + r * Math.sin(a))}`
}

/** the ring drawn when one category is the entire total: two circles, wound
 * so evenodd punches the hole — a wedge cannot express a full turn */
function fullRing(g: DonutGeom): string {
  const circle = (r: number) =>
    `M${n2(g.cx - r)},${n2(g.cy)}A${n2(r)},${n2(r)} 0 1 1 ${n2(g.cx + r)},${n2(g.cy)}` +
    `A${n2(r)},${n2(r)} 0 1 1 ${n2(g.cx - r)},${n2(g.cy)}Z`
  return g.ri > 0 ? `${circle(g.r)}${circle(g.ri)}` : circle(g.r)
}

/**
 * Wedges for a donut, in the order given, starting at twelve o'clock and
 * running clockwise. Categories at or below zero are dropped — a negative
 * share of a whole is not a thing a pie can say — so a caller that cares
 * about zeros should say so in its legend, which reads the raw values.
 *
 * Returns `[]` when nothing sums to a positive total; the caller draws its
 * own empty state rather than a chart of nothing.
 */
export function donutSlices(shares: readonly Share[], g: DonutGeom): Slice[] {
  const positive = shares.filter((s) => s.value > 0 && Number.isFinite(s.value))
  const total = positive.reduce((sum, s) => sum + s.value, 0)
  if (total <= 0) return []
  if (positive.length === 1) {
    return [{ ...positive[0], share: 1, path: fullRing(g) }]
  }
  const out: Slice[] = []
  let cum = 0
  for (const s of positive) {
    const share = s.value / total
    const a0 = -Math.PI / 2 + TAU * cum
    const a1 = -Math.PI / 2 + TAU * (cum + share)
    const big = share > 0.5 ? 1 : 0
    out.push({
      ...s,
      share,
      path:
        `M${polar(g, g.r, a0)}A${n2(g.r)},${n2(g.r)} 0 ${big} 1 ${polar(g, g.r, a1)}` +
        `L${polar(g, g.ri, a1)}A${n2(g.ri)},${n2(g.ri)} 0 ${big} 0 ${polar(g, g.ri, a0)}Z`,
    })
    cum += share
  }
  return out
}

// ---------------------------------------------------------------- over time

export interface StackRow {
  tick: number
  values: Readonly<Record<string, number>>
}

export interface StackBox {
  w: number
  h: number
  padL: number
  padR: number
  padT: number
  padB: number
}

export interface StackBand {
  key: string
  ink: string
  /** a closed area: along the top edge, back along the bottom */
  path: string
}

export interface StackPlot {
  bands: StackBand[]
  /** the top of the scale, in the units the caller passed (1 in share mode) */
  yMax: number
  x0: number
  x1: number
  sx(tick: number): number
  sy(value: number): number
}

/**
 * Stacked bands over time, in the order given — the composition question a
 * pie can only answer for one quarter. `share` normalizes every quarter to
 * its own total (how the mix shifted, even as the totals grew tenfold over a
 * century); `money` keeps the levels (how much there was).
 *
 * Every key gets a band even when it is flat zero, so colours stay pinned to
 * categories across both modes and across re-renders.
 */
export function stackPlot(
  rows: readonly StackRow[],
  keys: ReadonlyArray<{ key: string; ink: string }>,
  box: StackBox,
  mode: 'money' | 'share' = 'money',
): StackPlot {
  const x0 = rows[0]?.tick ?? 0
  const x1 = rows[rows.length - 1]?.tick ?? x0
  const at = (r: StackRow, k: string) => Math.max(0, r.values[k] ?? 0)
  const totals = rows.map((r) => keys.reduce((s, k) => s + at(r, k.key), 0))
  const yMax =
    mode === 'share' ? 1 : Math.max(...totals.map((t) => (Number.isFinite(t) ? t : 0)), 1e-9) * 1.02

  const sx = (t: number) => box.padL + ((t - x0) / Math.max(x1 - x0, 1)) * (box.w - box.padL - box.padR)
  const sy = (v: number) => box.padT + ((yMax - v) / yMax) * (box.h - box.padT - box.padB)

  if (rows.length < 2) return { bands: [], yMax, x0, x1, sx, sy }

  // one cumulative pass: each band's floor is the previous band's ceiling
  const floors = rows.map(() => 0)
  const bands: StackBand[] = keys.map((k) => {
    const tops = rows.map((r, i) => {
      const scale = mode === 'share' ? (totals[i] > 0 ? 1 / totals[i] : 0) : 1
      return floors[i] + at(r, k.key) * scale
    })
    const up = rows.map((r, i) => `${n2(sx(r.tick))},${n2(sy(tops[i]))}`).join('L')
    const down = rows
      .map((r, i) => `${n2(sx(r.tick))},${n2(sy(floors[i]))}`)
      .reverse()
      .join('L')
    for (let i = 0; i < rows.length; i++) floors[i] = tops[i]
    return { key: k.key, ink: k.ink, path: `M${up}L${down}Z` }
  })

  return { bands, yMax, x0, x1, sx, sy }
}

/**
 * Thin a series to at most `max` points, keeping the first and last. A
 * century is 400 quarters against ~700 px of chart, so drawing every one
 * costs path length for sub-pixel detail nobody can see.
 */
export function thin<T>(rows: readonly T[], max: number): T[] {
  if (rows.length <= max) return [...rows]
  const stride = Math.ceil(rows.length / max)
  const out = rows.filter((_, i) => i % stride === 0)
  const last = rows[rows.length - 1]
  if (out[out.length - 1] !== last) out.push(last)
  return out
}
