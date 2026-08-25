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
import { SHARE_INKS, type Share, type StackRow } from './shares'

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

// ------------------------------------------------- where the heads live

/**
 * The rural/urban split is on the EXACT side of the page for the same reason
 * the head count is: a census form asks where you live, and a state with no
 * statistical office can still add up its villages. What it cannot do without
 * a survey is say how many of the townspeople are professionals rather than
 * shopkeepers — so the engine publishes the residence question and keeps the
 * occupational structure behind it fogged, in the industrial census.
 *
 * The base is the population the register CLASSIFIES, which is the under-60s:
 * the engine gives everybody below the retirement band an occupation and with
 * it somewhere to live, and gives nobody above it either. So `rural + urban`
 * is smaller than the head count, and every reading here says so rather than
 * dividing by a total the split does not cover. Splitting the 60+ at the
 * working-age rate instead would be wrong in one direction for the whole
 * century: during exactly the transition this figure exists to show, today's
 * pensioners were young when the country was more rural.
 */
export type ResidenceId = 'rural' | 'urban'

/**
 * Draw order and words, countryside first: the transition reads as the city
 * rising off the land beneath it, so the land is the floor of the stack. A
 * total `Record`, so a third kind of place cannot ship unnamed.
 *
 * The two inks are picked for LIGHTNESS, not hue. A two-band chart has one
 * boundary and it is the whole figure, so the pair has to separate where it
 * touches — and the ramp's verdigris and slate sit at relative luminance
 * 0.126 and 0.117, a contrast ratio of 1.07. Drawn side by side in a 42px
 * band they are one mass, and a reader cannot see the boundary that IS the
 * chart. Verdigris against ink is 2.75, and both take the brass scrub line
 * without swallowing it. Field green under soot also happens to be the right
 * picture.
 */
export const RESIDENCE_FACE: Record<ResidenceId, Omit<Share, 'value'>> = {
  rural: {
    key: 'rural',
    label: 'COUNTRYSIDE',
    ink: SHARE_INKS[1],
    note: 'People living off the land — the cohort that works the fields.',
  },
  urban: {
    key: 'urban',
    label: 'TOWNS AND CITIES',
    ink: SHARE_INKS[5],
    note: 'People living an urban life: wage workers, professionals and owners of businesses.',
  },
}

export const RESIDENCE_IDS = ['rural', 'urban'] as const satisfies readonly ResidenceId[]

export interface ResidenceSplit {
  /** heads in the countryside, millions */
  rural: number
  /** heads in towns and cities, millions */
  urban: number
  /** the two together — the population the register classifies, millions.
   * Deliberately NOT the head count, which also holds the 60+. */
  classified: number
  /** urban as a share of the classified population, 0..1, or `null` when the
   * register classifies nobody. Null rather than zero: a country whose
   * under-60s have not been counted yet is not a country that is entirely
   * rural, and the two are indistinguishable once one prints as 0 %. */
  urbanShare: number | null
}

/** Takes anything that carries the split — a census row, or the live desk's
 * `population`, which publishes it on the same base — so the page never has to
 * assemble a fake census entry to read today's number. */
export function residenceSplit(entry: Pick<CensusEntry, 'residence'>): ResidenceSplit {
  const rural = Math.max(0, entry.residence.rural)
  const urban = Math.max(0, entry.residence.urban)
  const classified = rural + urban
  return {
    rural,
    urban,
    classified,
    urbanShare: classified > 1e-9 ? urban / classified : null,
  }
}

/** The century of the split, one row per quarter of the register — the
 * question a single reading cannot answer, which is how fast the country
 * emptied. Nothing is dropped for being partial: residence is counted, so a
 * quarter either exists in the census or was never lived through. */
export function residenceRows(census: readonly CensusEntry[]): StackRow[] {
  return census
    .map((entry) => {
      const { rural, urban } = residenceSplit(entry)
      return { tick: entry.tick, values: { rural, urban } }
    })
    .sort((a, b) => a.tick - b.tick)
}

/** The bands as `StackedAreaChart` wants them, carrying one quarter's heads
 * as the legend's values. */
export function residenceShares(split: ResidenceSplit): Share[] {
  return RESIDENCE_IDS.map((id) => ({ ...RESIDENCE_FACE[id], value: split[id] }))
}
