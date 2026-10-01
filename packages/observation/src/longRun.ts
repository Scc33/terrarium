/**
 * The long run: what a tenure averaged, read off a run of quarterly figures.
 *
 * One definition serves both sides of the report card's record — the office's
 * prints, and the same quantities unfogged once the book is closed — and the
 * terminal's TERM view during play. Where the two columns disagree, it is the
 * record that disagrees, never the arithmetic.
 */

import type { IndicatorId, Qtr } from '@terrarium/engine'

/**
 * How a run of prints is summarised over years.
 *
 * - `mean`: a rate, share or bounded index. Its average is the long-run reading.
 * - `compound`: an annualized growth print. A plain average of annualized rates
 *   overstates a volatile path, so the prints are chained instead — the %/yr
 *   that would have carried the level the same distance.
 * - `growth`: a level. Its average says nothing about a tenure; its annualized
 *   growth from the first figure to the latest does.
 */
export type LongRunForm = 'mean' | 'compound' | 'growth'

export const LONG_RUN_FORM: Record<IndicatorId, LongRunForm> = {
  gdp_growth: 'compound',
  gdp_per_capita: 'growth',
  debt_to_gdp: 'mean',
  consumption_per_capita: 'growth',
  household_saving_rate: 'mean',
  consumption_share: 'mean',
  investment_share: 'mean',
  export_share: 'mean',
  fdi_inflows: 'mean',
  inflation: 'mean',
  price_food: 'growth',
  price_fuel: 'growth',
  unemployment: 'mean',
  labor_force_participation: 'mean',
  human_capital: 'mean',
  payrolls: 'growth',
  capital_stock: 'growth',
  productivity: 'growth',
  technology_attainment: 'mean',
  conf_consumer: 'mean',
  conf_business: 'mean',
  approval: 'mean',
  gini: 'mean',
  income_real: 'growth',
  poverty_rate: 'mean',
  life_expectancy: 'mean',
  human_development: 'mean',
  net_migration: 'mean',
  birth_rate: 'mean',
  death_rate: 'mean',
  terms_of_trade: 'mean',
  asset_prices: 'mean',
  credit_growth: 'compound',
  credit_to_gdp: 'mean',
  bank_capital_ratio: 'mean',
  pollution: 'mean',
  unrest: 'mean',
  labour_underuse: 'mean',
}

/** What the report card keeps a long-run record of: growth, prices, capital,
 * work — the four figures a tenure is first asked about. */
export const LONG_RUN_RECORD = [
  'gdp_growth',
  'inflation',
  'capital_stock',
  'unemployment',
] as const satisfies readonly IndicatorId[]
export type LongRunRecordId = (typeof LONG_RUN_RECORD)[number]

/** A `growth` reading waits for a year between its endpoints: over a single
 * quarter it is two measurement errors annualized, not a rate. */
export const LONG_RUN_MIN_SPAN_QTRS = 4

export interface LongRunReading {
  value: number
  /** the first and last quarter the reading spans */
  from: Qtr
  to: Qtr
  /** distinct quarters inside the window that were actually measured */
  quarters: number
}

/** The latest figure for each quarter in `[from, to]`, in quarter order.
 * Prints arrive in publication order, so a later entry for a quarter already
 * seen is its revision. */
function latestByQuarter(
  points: readonly { forQtr: Qtr; value: number }[],
  from: Qtr,
  to: Qtr,
): { forQtr: Qtr; value: number }[] {
  const byQtr = new Map<Qtr, number>()
  for (const p of points) {
    if (p.forQtr >= from && p.forQtr <= to && Number.isFinite(p.value)) byQtr.set(p.forQtr, p.value)
  }
  return [...byQtr.entries()].sort(([a], [b]) => a - b).map(([forQtr, value]) => ({ forQtr, value }))
}

/**
 * The reading as it stood at each measured quarter of `[from, to]` — what the
 * tenure had averaged so far. Its last entry is `longRunReading`. Quarters the
 * office never measured are skipped rather than interpolated.
 */
export function longRunTrail(
  points: readonly { forQtr: Qtr; value: number }[],
  form: LongRunForm,
  from: Qtr,
  to: Qtr,
): LongRunReading[] {
  const quarters = latestByQuarter(points, from, to)
  const trail: LongRunReading[] = []
  if (quarters.length === 0) return trail
  const first = quarters[0]
  let sum = 0
  quarters.forEach((p, i) => {
    const n = i + 1
    const reading = (value: number) => trail.push({ value, from: first.forQtr, to: p.forQtr, quarters: n })
    if (form === 'mean') {
      sum += p.value
      reading(sum / n)
    } else if (form === 'compound') {
      // a print at or below −100%/yr would annualize a level to nothing;
      // floor the factor rather than take the log of zero
      sum += Math.log(Math.max(1 + p.value / 100, 1e-6))
      reading(100 * (Math.exp(sum / n) - 1))
    } else {
      const years = (p.forQtr - first.forQtr) / 4
      if (p.forQtr - first.forQtr < LONG_RUN_MIN_SPAN_QTRS || first.value <= 0 || p.value <= 0) return
      reading(100 * (Math.pow(p.value / first.value, 1 / years) - 1))
    }
  })
  return trail
}

/** The tenure's long-run reading, or null if nothing in the window measured it. */
export function longRunReading(
  points: readonly { forQtr: Qtr; value: number }[],
  form: LongRunForm,
  from: Qtr,
  to: Qtr,
): LongRunReading | null {
  const trail = longRunTrail(points, form, from, to)
  return trail.length > 0 ? trail[trail.length - 1] : null
}
