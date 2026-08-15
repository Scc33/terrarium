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
 * The exception is a series that grows an order of magnitude over the century
 * — the capital stock (175 → 900), household income and output per worker
 * (87 → 872), all of which are levels indexed against 1946 rather than rates
 * that revert. None has a single honest face, so they RATCHET: bounds from the
 * whole published history, which only ever grows, so the face can expand but
 * never shrinks back under the needle.
 */

import {
  DEBT_RISK_PREMIUM_AT,
  ELECTION_WIN_THRESHOLD,
  NATURAL_UNEMPLOYMENT,
  REFORM_WINDOW_AT,
} from '@terrarium/engine'
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
  // Re-measured for schema 23: p01–p99 -7.7–17.0 across 12 seeds × 6
  // countries × 400 quarters. Growth already exceeded the old 15% rail on
  // master; FDI widened the upper tail further. Keep the recession rail and
  // give investment booms an honest upper face.
  gdp_growth: { lo: -15, hi: 20 },
  // Schema 23 p99 132.0, maximum 156.8. The exceptional tail still pegs,
  // while a capacity-building country's ordinary late century stays on-face
  // and the upper rail lands on a labelled gridline.
  gdp_per_capita: { lo: 0, hi: 150 },
  // Across 12 seeds × 6 countries × 400 quarters: p01–p99 0.0–74.5,
  // maximum 95.3. Let borrowing beyond a measured century peg visibly.
  debt_to_gdp: { lo: 0, hi: 100 },
  // Schema 23 p99 98.6, maximum 122.9. Round outward to the nearest clean
  // hundred rather than hiding late-century consumption against the rail.
  consumption_per_capita: { lo: 0, hi: 100 },
  household_saving_rate: { lo: -10, hi: 20 },
  // The expenditure shares differ in magnitude by two orders of magnitude in
  // this economy, so they get four very different faces rather than a shared
  // 0–100 one. A common face would put three of the four needles in the same
  // millimetre of dial and make the split unreadable — which is the opposite
  // of what a composition instrument is for.
  consumption_share: { lo: 70, hi: 85 },
  investment_share: { lo: 0, hi: 10 },
  export_share: { lo: 5, hi: 30 },
  // Schema 23 range: p01–p99 0.3–1.6% of GDP, extrema 0.1–2.6.
  // Exceptional small-country surges should peg; ordinary dependence should
  // use the face rather than disappear into a generic 0–5 scale.
  fdi_inflows: { lo: 0, hi: 2 },
  inflation: { lo: -15, hi: 15 },
  price_food: { lo: 50, hi: 160 },
  price_fuel: { lo: 40, hi: 130 },
  unemployment: { lo: 0, hi: 25 },
  // Measured across 12 seeds × 6 countries × 400 quarters: p01–p99
  // 44.0–56.1, extrema 41.4–57.4. Keep enough rail for exceptional
  // demographic paths without flattening the normal dividend and ageing arc.
  labor_force_participation: { lo: 40, hi: 60 },
  payrolls: { lo: 0, hi: 50 },
  capital_stock: 'ratchet',
  // Measured across 12 seeds × 6 countries × 400 quarters: 1st–99th
  // percentile 53.4–94.6, extrema 47.5–96.5. Keep the frontier mark visible
  // with headroom for exceptional play and let true failures peg low.
  // Measured 87 → 872 (p01 121, p50 360, p99 740): an order of magnitude, so
  // no fixed face is honest. On a 0–900 dial the first thirty years would live
  // in the bottom fifth and the player would learn nothing from the decade
  // that matters most. Ratchets, like the capital stock it partly measures.
  productivity: 'ratchet',
  technology_attainment: { lo: 45, hi: 105 },
  conf_consumer: { lo: 20, hi: 80 },
  conf_business: { lo: 20, hi: 90 },
  approval: { lo: 20, hi: 80 },
  gini: { lo: 20, hi: 60 },
  income_real: 'ratchet',
  birth_rate: { lo: 0, hi: 45 },
  death_rate: { lo: 0, hi: 30 },
  terms_of_trade: { lo: 85, hi: 115 },
  asset_prices: { lo: 50, hi: 140 },
  credit_growth: { lo: -30, hi: 30 },
  unrest: { lo: 0, hi: 60 },
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
  debt_to_gdp: { at: DEBT_RISK_PREMIUM_AT * 100, label: 'PREMIUM' },
  household_saving_rate: { at: 0, label: 'DRAWDOWN' },
  inflation: { at: 0, label: 'STABLE' },
  credit_growth: { at: 0, label: 'FLAT' },
  // where revolutionary pressure prises the reform window open (§4.3). A rule,
  // not a reading — the government knows the threshold exactly and only its
  // own position against it is fogged. That gap is the game.
  unrest: { at: REFORM_WINDOW_AT * 100, label: 'THE WINDOW' },
  // the Phillips anchor the wage step bargains around: the slack a moving
  // economy carries even at full employment. Marking it splits one number
  // into two readings the player otherwise has to know the constant to make
  // — needle at the line is churn, needle to the right of it is a slump.
  unemployment: { at: NATURAL_UNEMPLOYMENT * 100, label: 'FRICTIONAL' },
  technology_attainment: { at: 100, label: 'FRONTIER' },
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
