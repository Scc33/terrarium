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
 * guessed — `tools/indicator-ranges.ts` runs a fully-surveyed century under
 * every government in `packages/runner/src/survey.ts` and reports where each
 * series actually lives. Domains here cover roughly the 1st–99th percentile
 * of that, rounded outward to a readable number.
 *
 * "Every government" is the half that was missing until #190. The survey used
 * to play one — build the ministries, touch nothing else — and a real game
 * played well left fifteen faces behind, `investment_share` pinned to its
 * rail for 98% of the century. A face has to fit the play the levers reach,
 * not the play the calibration happened to sample.
 *
 * When the economy leaves the dial, the needle PEGS at the rail and says so.
 * Going off-scale is information — a country running 25 % inflation should
 * look like an instrument slammed against its stop, not like a calm needle
 * on a quietly rescaled face.
 *
 * The exception is a series that grows an order of magnitude over the century
 * — the capital stock (175 → 900), household income and output per worker
 * (87 → 872), output and consumption per head (7 → 300 and 6 → 176), all of
 * which are levels rather than rates that revert. None has a single honest face, so they RATCHET: bounds from the
 * whole published history, which only ever grows, so the face can expand but
 * never shrinks back under the needle.
 */

import {
  CRISIS_ASSET_SAFE,
  CRISIS_LEVERAGE_SAFE,
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
  // Re-measured for schema 24: p01–p99 -7.7–17.0 across 12 seeds × 6
  // countries × 400 quarters. Growth already exceeded the old 15% rail on
  // master; FDI widened the upper tail further. Keep the recession rail and
  // give investment booms an honest upper face.
  gdp_growth: { lo: -15, hi: 20 },
  // Ratchets since #190. Schema 46, 12 seeds × 6 countries × 5 governments × 400 quarters (#190): p01–p99 6.7–301.6, maximum 435.3 — a factor of
  // forty-five, and the old 0–150 face pegged a third of a builder's century
  // while already putting 1946 in its bottom twentieth.
  gdp_per_capita: 'ratchet',
  // Across 12 seeds × 6 countries × 400 quarters: p01–p99 0.0–74.5,
  // maximum 95.3. Let borrowing beyond a measured century peg visibly.
  debt_to_gdp: { lo: 0, hi: 100 },
  // Ratchets since #190, for the reason output per head does: p01–p99
  // 6.0–176.2, maximum 245.7, and 29% of the maximal builder's prints pegged
  // on the old 0–100 face.
  consumption_per_capita: 'ratchet',
  household_saving_rate: { lo: -10, hi: 20 },
  // The expenditure shares differ in magnitude by two orders of magnitude in
  // this economy, so they get four very different faces rather than a shared
  // 0–100 one. A common face would put three of the four needles in the same
  // millimetre of dial and make the split unreadable — which is the opposite
  // of what a composition instrument is for.
  // Schema 46, 12 seeds × 6 countries × 5 governments × 400 quarters (#190): consumption p01–p99 53.7–81.6, extrema 48.2–88.0; capital
  // formation p01–p99 2.1–20.8, extrema 1.0–27.3. A government that taxes to
  // build — the welfare builder, #180's player — moves a quarter of final
  // spending from one to the other, and on the old 65–85 and 0–10 faces it
  // spent 58% and 64% of its century against the rails. Capital formation
  // takes 0–25 rather than 0–20: at 20 the maximal builder still pegged 9%.
  consumption_share: { lo: 50, hi: 85 },
  investment_share: { lo: 0, hi: 25 },
  export_share: { lo: 5, hi: 30 },
  // Schema 24 range: p01–p99 0.3–1.6% of GDP, extrema 0.1–2.6.
  // Exceptional small-country surges should peg; ordinary dependence should
  // use the face rather than disappear into a generic 0–5 scale.
  fdi_inflows: { lo: 0, hi: 2 },
  inflation: { lo: -15, hi: 15 },
  // Schema 35: households leave the food aisle as they get richer, so food
  // gets cheaper against the 1946 base than the old 50 rail allowed — and a
  // hungry century still reaches past the old ceiling. Measured p01–p99
  // 43.7–141.9, extrema 38.8–174.7.
  // Re-measured at schema 42 (`pnpm ranges`), when the exchange rate started
  // following relative prices and a developing century got about a tenth
  // cheaper: food p01 32.1 against the old 42.6, fuel p01 29.9 against 38.2.
  // `price_fuel` was already spending part of its life against the old 40 rail
  // and this pushed it to a fifth of every print.
  price_food: { lo: 25, hi: 180 },
  // Schema 46, 12 seeds × 6 countries × 5 governments × 400 quarters (#190):
  // fuel p99 142.9, maximum 204.4. The builders' demand runs the fuel board
  // past the old 130 rail; food stays on its face. 175 rather than 150
  // because the test holds every country × government century to 10%, and
  // Costona under the maximal builder spent 8.7% of three centuries past 150
  // — and it puts the 1946 price of 100 at the top of the arc.
  // ADR-0045 (the countryside empties faster) cheapens fuel a further fifth
  // from the 1970s: p01 28.7 → 26.5, minimum 19.8. The gauge-domains test's
  // procedural country under the money government sat under 25 for 24% of
  // its century from 2021, so the floor goes to 20.
  price_fuel: { lo: 20, hi: 175 },
  unemployment: { lo: 0, hi: 25 },
  // Schema 28 migration broadens the late demographic paths. Measured across
  // 12 seeds × 6 countries × 400 quarters: p01–p99 44.0–59.3, extrema
  // 41.3–60.7. Keep room for exceptional participation without flattening
  // the normal dividend and ageing arc.
  labor_force_participation: { lo: 40, hi: 65 },
  // Schema 30, 12 seeds × 6 countries × 400 funded quarters: p01–p99
  // 20.7–93.7, extrema 14.4–95.4. The stock is bounded 0..100 by
  // construction, so keep the natural face and preserve room for failed or
  // exceptionally educated workforces without rescaling under the needle.
  human_capital: { lo: 0, hi: 100 },
  // Schema 46, 12 seeds × 6 countries × 5 governments × 400 quarters (#190): p01–p99 2.4–67.5 M, extrema 1.5–88.3 M.
  payrolls: { lo: 0, hi: 80 },
  capital_stock: 'ratchet',
  // Measured across 12 seeds × 6 countries × 400 quarters: 1st–99th
  // percentile 53.4–94.6, extrema 47.5–96.5. Keep the frontier mark visible
  // with headroom for exceptional play and let true failures peg low.
  // Measured 87 → 872 (p01 121, p50 360, p99 740): an order of magnitude, so
  // no fixed face is honest. On a 0–900 dial the first thirty years would live
  // in the bottom fifth and the player would learn nothing from the decade
  // that matters most. Ratchets, like the capital stock it partly measures.
  productivity: 'ratchet',
  // Schema 46, 12 seeds × 6 countries × 5 governments × 400 quarters (#190): p01–p99 44.1–96.1, extrema 38.9–98.0. An extractive state that
  // builds no schools stalls in the low forties and pegged 11% of its century
  // on the old 45 rail.
  technology_attainment: { lo: 35, hi: 105 },
  conf_consumer: { lo: 20, hi: 80 },
  conf_business: { lo: 20, hi: 90 },
  approval: { lo: 20, hi: 80 },
  gini: { lo: 20, hi: 60 },
  income_real: 'ratchet',
  // Schema 46, all five survey governments (#190): p01–p99 0.0–48.5%,
  // extrema 0.0–67.5. The rate is whole cohorts' shares, and Costona's
  // countryside under the maximal builder stays poor at 54–57% through the
  // 1960s — on the old 50 rail that century pegged 16% of its prints. Poverty
  // cannot go below zero; 60 covers that century and keeps the ordinary
  // 6–25% in the lower half of the dial.
  poverty_rate: { lo: 0, hi: 60 },
  // Schema 46, 12 seeds × 6 countries × 5 governments × 400 quarters (#190): p01–p99 47.6–65.2 years, extrema 44.0–67.2. The old 60 rail was
  // the capacity builder's maximum, and #180's player lived past it from 1980
  // to the end. 75 clears the model's own ceiling — `MORT_FLOOR` stops life
  // expectancy at 72.8 years — so every reachable reading above the
  // mortality-crisis rail is on the face.
  life_expectancy: { lo: 45, hi: 75 },
  // Schema 41, 12 seeds × 6 countries × 400 funded quarters: p01–p99
  // 0.304–0.783, extrema 0.254–0.804, with no component clamped. ADR-0033
  // defines the quantity on 0–1 fixed goalposts, so the honest face is the
  // complete interval rather than a range-fitted crop of today's catalogue.
  human_development: { lo: 0, hi: 1 },
  // Measured across the all-country funded century: -11.9..12.1, with
  // p01 -8.0 and p99 9.6. Keep zero centered: the sign is the story.
  net_migration: { lo: -15, hi: 15 },
  birth_rate: { lo: 0, hi: 45 },
  death_rate: { lo: 0, hi: 30 },
  terms_of_trade: { lo: 85, hi: 115 },
  // Schema 46, 12 seeds × 6 countries × 5 governments × 400 quarters (#190): asset valuation p01–p99 55.9–179.2, extrema 29.1–252.1; credit
  // growth p01–p99 −30.8–46.7, extrema −38.3–274.1. Both were cut where no
  // money dial had moved: free money put the asset market past 140 for a
  // quarter of the century and a credit boom past +30.
  asset_prices: { lo: 50, hi: 200 },
  credit_growth: { lo: -40, hi: 60 },
  // The face #190 generalised. It was set by hand, wider than the survey,
  // because that survey never touched the money dials and a separate sweep
  // (0% policy rate, maximum purchases, minimum bank-capital floor) measured
  // 112 — and the reading this instrument exists for is the fragility rail at
  // 75, which a percentile-fitted face would have put in its last tenth. That
  // sweep is now the survey's `money` government: schema 46, all five
  // governments, p01–p99 17.3–95.7, extrema 8.4–142.1, pegged 0.0%. Zero is
  // the honest low rail — a crunch clamps credit to almost nothing, and no
  // lending at all is a real position.
  credit_to_gdp: { lo: 0, hi: 120 },
  // Schema 46, 12 seeds × 6 countries × 5 governments × 400 quarters (#190): p01–p99 0.5–43.2, extrema 0.0–89.3 — dear money shrinks the loan
  // book faster than it shrinks bank equity, and the ratio climbs. The low
  // rail is zero because the whole legal range of the `capitalRequirement`
  // floor (3–25) has to fit on the face: "am I above the floor I set" is the
  // reading, and a dial that could not draw the floor could not answer it.
  bank_capital_ratio: { lo: 0, hi: 50 },
  // Measured with `pnpm ranges` over the funded century: p01–p99 is 66.8–418.2
  // and the extrema are 57.6–477.9. A country that never industrialises sits
  // near its 1946 inheritance at 100; one that industrialises without rules
  // runs past 400. The face covers the middle 98% and lets the filthiest
  // centuries peg, which is the point — going off this dial is information.
  pollution: { lo: 50, hi: 450 },
  // Schema 46, 12 seeds × 6 countries × 5 governments × 400 quarters (#190): p01–p99 6.6–93.7, extrema −10.6–104.1. A state that represses
  // rather than reforms lives at 80–100 — the old 70 rail pegged 62% of its
  // century — so the face is the index's whole natural range.
  unrest: { lo: 0, hi: 100 },
  // Schema 46, 12 seeds × 6 countries × 400 funded quarters: p01–p99
  // 8.6–29.6%, extrema 6.2–40.1. Zero is the honest lower rail for a rate;
  // the 30% upper rail covers the middle 98% and lets exceptional mismatch
  // peg visibly.
  labour_underuse: { lo: 0, hi: 30 },
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
  net_migration: { at: 0, label: 'BALANCED' },
  credit_growth: { at: 0, label: 'FLAT' },
  // the leverage rail of the banking-crisis hazard. Above it, and only above
  // it, expensive assets start to cost something: the hazard is a PRODUCT of
  // this excess and the one on `asset_prices`, so either mark alone is a
  // threshold the player can cross harmlessly. Both are drawn for that reason.
  credit_to_gdp: { at: CRISIS_LEVERAGE_SAFE * 100, label: 'FRAGILE' },
  asset_prices: { at: CRISIS_ASSET_SAFE * 100, label: 'RICH' },
  // where revolutionary pressure prises the reform window open. A rule,
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

/** The figures printed on a face: both rails and the midpoint. Rails alone
 * made every reading an interpolation across the whole arc; the midpoint
 * halves it. Ratcheting faces land on `niceBounds`' grid and fixed faces are
 * chosen round, so two decimals is a ceiling rather than a format. */
export function faceScale(domain: Domain): { lo: string; mid: string; hi: string } {
  const print = (v: number) => String(Number(v.toFixed(2)))
  return { lo: print(domain.lo), mid: print((domain.lo + domain.hi) / 2), hi: print(domain.hi) }
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
