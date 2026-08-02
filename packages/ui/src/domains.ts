/**
 * The printed face of every dial.
 *
 * A gauge whose face is redrawn under its own needle is not an instrument.
 * If the bounds are derived from the trailing window, the needle's position
 * stops meaning anything across time — approval at 55 sits mid-dial one
 * quarter and left-of-centre the next, purely because the window rolled.
 * That destroys the one skill this game is actually about: reading your
 * instruments and remembering what they looked like last time.
 *
 * So faces are FIXED, per indicator, and they are measured rather than
 * guessed — `tools/indicator-ranges.ts` runs a fully-surveyed century and
 * reports where each series actually lives. Domains here cover roughly the
 * 1st–99th percentile of that, rounded outward to a readable number.
 *
 * When the economy leaves the dial, the needle PEGS at the rail and says so.
 * Going off-scale is information — a country running 25 % inflation should
 * look like an instrument slammed against its stop, not like a calm needle
 * on a quietly rescaled face.
 *
 * One exception: a stock that grows an order of magnitude over the century
 * (capital stock, 175 → 900) has no single honest face. It RATCHETS — bounds
 * from the whole published history, which only ever grows, so the face can
 * expand but never shrinks back under the needle.
 */

import { ELECTION_WIN_THRESHOLD, REFORM_WINDOW_AT } from '@terrarium/engine'
import type { IndicatorId } from '@terrarium/observation'

export interface Domain {
  lo: number
  hi: number
}

/** where the needle sits, and whether it ran out of dial */
export interface Reading {
  /** 0 = left rail, 1 = right rail; always clamped */
  frac: number
  pegged: 'lo' | 'hi' | null
}

/**
 * Fixed faces, from a measured century (see the module note). `'ratchet'`
 * means "no fixed face is honest; grow it from published history".
 *
 * This being a total Record over IndicatorId is the enforcement: add an
 * indicator to the engine and this file stops compiling until it has a face.
 */
export const INDICATOR_FACE: Record<IndicatorId, Domain | 'ratchet'> = {
  gdp_growth: { lo: -15, hi: 15 },
  inflation: { lo: -15, hi: 15 },
  price_food: { lo: 60, hi: 130 },
  price_fuel: { lo: 40, hi: 130 },
  unemployment: { lo: 0, hi: 25 },
  payrolls: { lo: 0, hi: 25 },
  capital_stock: 'ratchet',
  conf_consumer: { lo: 20, hi: 80 },
  conf_business: { lo: 20, hi: 90 },
  approval: { lo: 20, hi: 80 },
  gini: { lo: 30, hi: 55 },
  birth_rate: { lo: 0, hi: 45 },
  death_rate: { lo: 0, hi: 30 },
  terms_of_trade: { lo: 85, hi: 115 },
  asset_prices: { lo: 50, hi: 130 },
  credit_growth: { lo: -30, hi: 30 },
  unrest: { lo: 0, hi: 55 },
}

/**
 * A line printed on the face where the rules put one. These are things the
 * government genuinely knows — the electoral threshold is written in law,
 * zero is zero — so drawing them is not a truth leak. The reading is still
 * fogged; only the line is certain. That gap is the game.
 */
export const FACE_MARK: Partial<Record<IndicatorId, { at: number; label: string }>> = {
  approval: { at: ELECTION_WIN_THRESHOLD * 100, label: 'THE LINE' },
  gdp_growth: { at: 0, label: 'FLAT' },
  inflation: { at: 0, label: 'STABLE' },
  credit_growth: { at: 0, label: 'FLAT' },
  // where revolutionary pressure prises the reform window open (§4.3). A rule,
  // not a reading — the government knows the threshold exactly and only its
  // own position against it is fogged. That gap is the game.
  unrest: { at: REFORM_WINDOW_AT * 100, label: 'THE WINDOW' },
}

/**
 * Round a range outward onto a readable grid.
 *
 * Monotonicity is the whole job here, and it is easy to lose: the first
 * version widened a narrow range by recentring it on the midpoint
 * (`lo = mid - 1, hi = mid + 1`). The midpoint MOVES as history arrives, so
 * a new low could drag the upper bound down with it and the ratcheting face
 * shrank under its own needle — the exact bug fixed faces exist to prevent.
 *
 * So `lo` and `hi` are only ever floored and ceiled onto the grid, never
 * recentred. Both inputs are monotone as history grows (a running min and a
 * running max), the step is a non-decreasing function of the span, and
 * coarser powers of ten nest inside finer ones — so the result can only
 * expand. `tests/ui/gauge-domains.test.ts` holds that property directly.
 */
export function niceBounds(lo: number, hi: number): Domain {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { lo: 0, hi: 1 }
  const step = Math.pow(10, Math.floor(Math.log10(Math.max(hi - lo, 1))))
  const l = Math.floor(lo / step) * step
  const h = Math.ceil(hi / step) * step
  // lo and hi landed in the same grid cell: give the dial one cell of face
  return { lo: l, hi: h > l ? h : l + step }
}

/**
 * The face to print for this indicator. `values` must be the WHOLE published
 * history, not a window — for ratcheting faces that is exactly what makes the
 * result monotone, and for fixed faces it is ignored.
 */
export function gaugeDomain(indicator: IndicatorId, values: readonly number[]): Domain {
  const face = INDICATOR_FACE[indicator]
  if (face !== 'ratchet') return face
  const finite = values.filter((v) => Number.isFinite(v))
  if (finite.length === 0) return { lo: 0, hi: 1 }
  return niceBounds(Math.min(...finite), Math.max(...finite))
}

/** Where the needle points, pegging at the rails rather than running off. */
export function readNeedle(domain: Domain, value: number): Reading {
  const span = domain.hi - domain.lo
  if (!(span > 0) || !Number.isFinite(value)) return { frac: 0.5, pegged: null }
  const raw = (value - domain.lo) / span
  if (raw < 0) return { frac: 0, pegged: 'lo' }
  if (raw > 1) return { frac: 1, pegged: 'hi' }
  return { frac: raw, pegged: null }
}
