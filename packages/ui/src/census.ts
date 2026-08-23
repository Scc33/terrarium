/**
 * The national census read for the page — the arithmetic over the EXACT
 * register, kept out of the component so it can be tested.
 *
 * Everything here derives from `pub.census`, which is census-grade: heads are
 * countable without a statistical office, so the head count and the age
 * pyramid are exact at every quarter of the century. That is the one fact
 * that decides where these figures belong.
 *
 * **Population growth is deliberately NOT an indicator.** It is a ratio of two
 * numbers the state can count, so publishing it as a surveyed series would
 * invent a lag, a band and a revision for a figure that has none — the census
 * overlay's whole thesis, stated backwards. It lives here, beside the head
 * count it is computed from, and the fogged half of the same question (WHY the
 * number moved: births, deaths, migration) stays in the indicators where it
 * belongs.
 *
 * Measured, over 3 seeds × 6 catalogue countries × 400 fully-surveyed
 * quarters, growth spans −0.84 to +2.11 %/yr with a median of 0.77 — so it
 * goes NEGATIVE, and any chart of it has to carry zero on the axis or a
 * shrinking country draws the same as a stagnant one.
 */

import { AGE_BANDS, RETIREMENT_BAND, WORKING_BANDS } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import type { PlotPoint } from './plot'

/** One quarter of the exact register, as `PublishedState` files it. */
export type CensusEntry = PublishedState['census'][number]

/** how far back a growth reading looks. A year, because that is the
 * comparison a census publishes and the one a player reads a population
 * against — not because quarterly is too noisy to draw. It measurably is not:
 * annualized quarter-on-quarter moves 0.010 pp between prints against
 * year-on-year's 0.009, cohort arithmetic being smooth. The cost is the only
 * reason to state the span at all: no reading exists until a year of record
 * has accumulated. */
export const GROWTH_LOOKBACK_QTRS = 4

/**
 * Year-on-year growth of the head count, in %/yr, one reading per quarter
 * from the first quarter that has a year behind it.
 *
 * Indexed BY TICK rather than by array position. The record is written one
 * entry per quarter so the two agree today, but a positional `k - 4` would
 * quietly measure a different span the first time anything filters or
 * downsamples the census on the way here, and a growth rate over the wrong
 * span is a plausible-looking number rather than a visible bug.
 */
export function populationGrowth(census: readonly CensusEntry[]): PlotPoint[] {
  const byTick = new Map(census.map((entry) => [entry.tick, entry.population]))
  const out: PlotPoint[] = []
  for (const entry of census) {
    const then = byTick.get(entry.tick - GROWTH_LOOKBACK_QTRS)
    if (then === undefined || then <= 1e-9) continue
    out.push({ tick: entry.tick, value: 100 * (entry.population / then - 1) })
  }
  return out.sort((a, b) => a.tick - b.tick)
}

/** The age of the person in the middle of the queue, interpolated within the
 * five-year band the halfway mark falls in — the demographic transition as one
 * number, which is what makes it worth a slot beside the pyramid. Measured, it
 * runs 20 → 43 over a fully-surveyed century, dipping first as a birth surge
 * arrives and climbing after, so the scrubber has something to show at both
 * ends. `null` for an empty pyramid; the top band is open-ended, so a median
 * that lands in it reports its floor rather than inventing a ceiling. */
export function medianAge(pyramid: readonly number[]): number | null {
  const total = pyramid.reduce((a, b) => a + b, 0)
  if (total <= 1e-9) return null
  const half = total / 2
  let below = 0
  for (let band = 0; band < pyramid.length; band++) {
    if (below + pyramid[band] >= half) {
      if (band === AGE_BANDS - 1) return 5 * band
      return 5 * band + (5 * (half - below)) / pyramid[band]
    }
    below += pyramid[band]
  }
  return 5 * (AGE_BANDS - 1)
}

/** How a pyramid divides into the three groups the state budgets for, in
 * millions, with the ratio the pension arithmetic turns on. `support` is
 * `Infinity` when nobody has retired yet — a real reading for a young country,
 * and the caller's to render as a dash. */
export function ageStructure(pyramid: readonly number[]): {
  children: number
  working: number
  retired: number
  support: number
} {
  const sum = (from: number, to: number) =>
    pyramid.slice(from, to + 1).reduce((a, b) => a + b, 0)
  const children = sum(0, WORKING_BANDS[0] - 1)
  const working = sum(WORKING_BANDS[0], WORKING_BANDS[1])
  const retired = sum(RETIREMENT_BAND, AGE_BANDS - 1)
  return {
    children,
    working,
    retired,
    support: retired > 1e-9 ? working / retired : Infinity,
  }
}
