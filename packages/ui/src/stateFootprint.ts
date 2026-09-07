/**
 * How big the state is — the treasury's exact books read against the office's
 * estimate of the economy they sit inside.
 *
 * The expenditure accounts next door cannot answer this and never will. They
 * are the demand side of the identity, and the state's part of THAT is its
 * final consumption alone, which runs under 1% of final expenditure in this
 * engine because the modelled state buys goods and pays transfers and employs
 * nobody (docs/investigations/0002). A player whose treasury moves a fifth of
 * the economy would read "government: 0.7%" and conclude the wrong thing about
 * their own country, which is why that share is measured and deliberately
 * unpublished. The honest answer is this one: what the treasury collected and
 * what it spent, over what the country produced.
 *
 * Three rules, and all three are the reason this is a module rather than four
 * lines inside the overlay:
 *
 *  - **It is not a fourth account.** Outlays are transfers, subsidies and debt
 *    service as well as purchases, and those finance spending the accounts
 *    have already counted once. This number belongs BESIDE the pie, never in
 *    it — added as a wedge it would double-count, and the wedge would look
 *    entirely plausible.
 *  - **The numerator is exact and the denominator is fogged.** The books are
 *    the government's own record of itself; nominal GDP is a survey estimate
 *    carrying a band and subject to revision. So this ratio moves when the
 *    office changes its mind about the size of the economy, on quarters where
 *    the treasury did not move at all — and the panel has to say so. Reading
 *    the true GDP instead would be a free, unlagged survey obtained by
 *    division (ADR-0003).
 *  - **A quarter with no estimate is DROPPED, never carried forward.** The
 *    office publishes its level with a lag, so the last quarter or two of any
 *    run has exact books and no denominator. Dividing this quarter's spending
 *    by last quarter's economy invents a movement the treasury never made; the
 *    reading is stated as of the quarter it can actually be taken, and `lag`
 *    is how far behind today that is.
 *
 * Both flows are quarterly, so the ratio is the annual one too — the fours
 * cancel, the same arithmetic `pipeline/trade.ts` spells out for its own share.
 */

import type { PublishedState } from '@terrarium/observation'
import { outlayChartValues, type OutlayChartValues } from './budgetChart'
import { officialNominalGdpByQuarter } from './spendingRules'

/** One quarter of the state's footprint, in percentage points of GDP. */
export interface FootprintPoint {
  tick: number
  /** everything the treasury collected that quarter, over output */
  revenue: number
  /** everything it spent, interest included */
  outlays: number
  /** revenue − outlays; negative is a deficit */
  balance: number
  /** the same outlays split into the ledger's six chart bands, each in points
   * of GDP. The ledger draws these against the budget's own total, which is a
   * different question: a programme can hold its share of a budget that is
   * itself shrinking away from the economy, and only this denominator says so. */
  byProgramme: OutlayChartValues
}

export interface StateFootprint {
  /** every quarter the office has priced, in order */
  points: FootprintPoint[]
  /** the most recent one — the reading the summary quotes */
  latest: FootprintPoint
  /** quarters between that reading and today: the office's publication lag,
   * and the reason the figure is not stamped with the current year */
  lag: number
}

/**
 * The exact books over the published economy, or `null` when no quarter has
 * both. Null is reachable in ordinary play — the office's first level estimate
 * arrives a quarter or two after the first book — so callers must handle it
 * rather than defaulting to zero, which would draw a state that spends nothing.
 */
export function stateFootprint(pub: PublishedState): StateFootprint | null {
  const gdp = officialNominalGdpByQuarter(pub)
  const points: FootprintPoint[] = []
  for (const book of pub.books) {
    const nominal = gdp.get(book.tick)
    if (nominal === undefined) continue
    const programmes = outlayChartValues(book.outlaysByProgramme)
    for (const id of Object.keys(programmes) as Array<keyof OutlayChartValues>) {
      programmes[id] = (100 * programmes[id]) / nominal
    }
    points.push({
      tick: book.tick,
      revenue: (100 * book.revenue) / nominal,
      outlays: (100 * book.outlays) / nominal,
      balance: (100 * book.balance) / nominal,
      byProgramme: programmes,
    })
  }
  if (points.length === 0) return null
  points.sort((a, b) => a.tick - b.tick)
  const latest = points[points.length - 1]
  return { points, latest, lag: pub.tick - latest.tick }
}

/** the shape `LineChart` wants, from what `stateFootprint` returned */
export function footprintSeries(
  points: readonly FootprintPoint[],
  read: (point: FootprintPoint) => number,
): Array<{ tick: number; value: number }> {
  return points.map((p) => ({ tick: p.tick, value: read(p) }))
}

/** what `StackedAreaChart` wants: the century of the budget, drawn against
 * the economy rather than against itself. */
export function programmeRows(
  points: readonly FootprintPoint[],
): Array<{ tick: number; values: Record<string, number> }> {
  return points.map((p) => ({ tick: p.tick, values: p.byProgramme }))
}
