/**
 * The industrial census, arranged for reading — which industries make the
 * economy, and who they employ.
 *
 * Pure for the reason everything in `shares.ts`'s orbit is pure: what this
 * module returns decides what the pie claims the country IS, and every way it
 * can be wrong draws a perfectly convincing chart of a different country.
 * `tests/ui/industry.test.ts` pins it.
 *
 * Two things it deliberately does NOT do:
 *
 *  - it does not reconcile the census with the GDP headline. Each industry is
 *    surveyed separately, so the parts do not add up to the published total,
 *    and the shares here are of the CENSUS's own total rather than of a GDP
 *    print from a different release. Renormalizing to the headline would
 *    invent precision the office does not have; the overlay states the band
 *    instead.
 *  - it does not pair a sector with the subsidy paid to it as a "return". The
 *    subsidy is exact (it is the government's own dial) and the output is
 *    fogged, so their ratio would be a fogged number wearing an exact
 *    number's clothes. They sit side by side as two separate columns, which is
 *    what a minister actually reads them as.
 */

import { INDUSTRY_CENSUS_FUNDED_AT } from '@terrarium/engine'
import {
  SECTOR_IDS,
  type IndustryTableId,
  type PublishedState,
  type SectorId,
} from '@terrarium/observation'
import { SHARE_INKS, type Share, type StackRow } from './shares'

/** What each industry is called on paper, what ink it is drawn in, and what
 * the player is actually looking at. A total `Record` over the engine's own id
 * list, so a sixth sector fails the build until it has been named and given an
 * ink — the `LedgerOverlay` rule, applied to the production side.
 *
 * Draw order is `SECTOR_IDS` order, which is also the order the engine's I/O
 * table is written in. There are five sectors and `SHARE_INKS` holds six, so
 * the ramp has exactly one seat spare; a sixth industry takes it, and a
 * seventh needs an "other" bucket rather than a seventh colour. */
export const SECTOR_FACE: Record<SectorId, { label: string; ink: string; note: string }> = {
  agri: {
    label: 'Agriculture',
    ink: SHARE_INKS[0],
    note: 'Farms and the food they grow. A large share of employment here with a small share of output is the mark of a poor countryside, not a strong one.',
  },
  manuf: {
    label: 'Manufacturing',
    ink: SHARE_INKS[1],
    note: 'Factories and the goods they make. This is the share that grows when a country industrialises.',
  },
  energy: {
    label: 'Energy',
    ink: SHARE_INKS[2],
    note: 'Fuel and power. Small in people and large in consequence: everything else buys from it, so its price moves every other price.',
  },
  services: {
    label: 'Services',
    ink: SHARE_INKS[3],
    note: 'Trade, finance, schooling and everything else sold rather than made. It tends to grow last and grow largest.',
  },
  transport: {
    label: 'Transport',
    ink: SHARE_INKS[4],
    note: 'Moving goods and people. It carries the rest of the economy, so it grows with whatever the country is producing.',
  },
}

/** The two tables one census release carries. The engine's own id, not a
 * parallel union: the lens key indexes the table AND the band the office
 * confessed on that table, so the page cannot show one table's figures beside
 * the other's uncertainty. */
export type IndustryLens = IndustryTableId

/**
 * Whether the census exists, is on its way, or has reported.
 *
 * Derived HERE, and derived from the RULE and the CAPACITY rather than from
 * whether data happens to have arrived — which is the whole of ADR-0020's
 * miss, repeated. `maturity.ts` once read the funding gate only where the
 * series lands, so for the first quarters of a `fullInstrumentation` run it
 * called 29 instruments UNFITTED and told the player to fund surveys they
 * already had. The census has exactly the same two-quarter hole: the office
 * reports a quarter or two behind, so "nothing published yet" is true of a
 * commissioned survey and of a survey that does not exist, and only one of
 * them is asking the player to spend anything.
 */
export type CensusAvailability = 'unfunded' | 'awaiting' | 'reporting'

export function censusAvailability(pub: PublishedState): CensusAvailability {
  if (pub.industry.length > 0) return 'reporting'
  return pub.rules.fullInstrumentation || pub.capacity.statistical >= INDUSTRY_CENSUS_FUNDED_AT
    ? 'awaiting'
    : 'unfunded'
}

export interface IndustryReading {
  key: SectorId
  label: string
  ink: string
  note: string
  /** the published figure, in the lens's own units (real output, or millions
   * of people) */
  value: number
  /** its share of the census's own total, 0..1 */
  share: number
  /** share in percentage points at the FIRST quarter the census reported —
   * the answer to "what kind of country am I turning into", which no single
   * release can give */
  sinceFirst: number
  /** what the cabinet pays this industry per quarter, exact. Not part of the
   * census — it is the government's own dial, and it is here because the
   * question this whole view exists to serve is which industries you can
   * actually push. */
  subsidy: number
}

/** One release, read: the latest census the office has published, both
 * tables, plus the quarter it measures and the band it confesses.
 *
 * `null` when the establishment survey has never reported. All-or-nothing,
 * like the expenditure accounts and for the same reason: the census is one
 * publication, so a partial one would mean a bug rather than a poor ministry.
 */
export interface IndustryRelease {
  /** the quarter MEASURED, not the quarter released */
  forQtr: number
  /** how many quarters ago that was, from the caller's `pub.tick` */
  lag: number
  revision: number
  /** The office's own half-width per table, as a fraction of each figure;
   * 0 = it cannot even estimate its error, which is a shrug and must never
   * print as ±0.0. Keyed by lens so the band shown is always the band that
   * table was measured to — heads are counted better than output is
   * estimated, and one band for both overstates the jobs survey by half. */
  errorBand: Record<IndustryLens, number>
  valueAdded: IndustryReading[]
  employment: IndustryReading[]
  /** the census's own totals — real output at base prices, and millions of
   * people. Deliberately the census's, not the GDP print's: see the module note. */
  totals: Record<IndustryLens, number>
}

/** latest revision per measured quarter, oldest first — the office's best
 * current word on each period. The same rule `shapeSeries` applies to a
 * scalar series, applied to the vector release. */
function settled(points: PublishedState['industry']): PublishedState['industry'] {
  const best = new Map<number, PublishedState['industry'][number]>()
  for (const p of points) {
    const cur = best.get(p.forQtr)
    if (!cur || p.revision > cur.revision) best.set(p.forQtr, p)
  }
  return [...best.values()].sort((a, b) => a.forQtr - b.forQtr)
}

export function readIndustry(pub: PublishedState): IndustryRelease | null {
  const history = settled(pub.industry)
  const latest = history[history.length - 1]
  const first = history[0]
  if (!latest) return null

  const totals: Record<IndustryLens, number> = {
    valueAdded: SECTOR_IDS.reduce((sum, id) => sum + latest.valueAdded[id], 0),
    employment: SECTOR_IDS.reduce((sum, id) => sum + latest.employment[id], 0),
  }
  const firstTotals: Record<IndustryLens, number> = {
    valueAdded: SECTOR_IDS.reduce((sum, id) => sum + first.valueAdded[id], 0),
    employment: SECTOR_IDS.reduce((sum, id) => sum + first.employment[id], 0),
  }

  const read = (lens: IndustryLens): IndustryReading[] =>
    SECTOR_IDS.map((id) => {
      const value = latest[lens][id]
      // a census total can only be zero before anything was ever published,
      // and `latest` proves otherwise — but a guarded divide costs nothing and
      // a NaN share draws no wedge at all, which reads as an industry that
      // does not exist
      const share = totals[lens] > 0 ? value / totals[lens] : 0
      const before = firstTotals[lens] > 0 ? first[lens][id] / firstTotals[lens] : 0
      return {
        key: id,
        ...SECTOR_FACE[id],
        value,
        share,
        sinceFirst: 100 * (share - before),
        subsidy: pub.dials.subsidies[id] ?? 0,
      }
    })

  return {
    forQtr: latest.forQtr,
    lag: pub.tick - latest.forQtr,
    revision: latest.revision,
    errorBand: { ...latest.errorBand },
    valueAdded: read('valueAdded'),
    employment: read('employment'),
    totals,
  }
}

/** what a donut needs, from what `readIndustry` returned */
export function toShares(readings: readonly IndustryReading[]): Share[] {
  return readings.map((r) => ({ key: r.key, label: r.label, value: r.value, ink: r.ink, note: r.note }))
}

/**
 * The century of the mix, one row per quarter the census reported — the
 * question a single release cannot answer.
 *
 * Unlike the expenditure accounts, nothing has to be dropped for being
 * partial: one release carries all five industries or none of them, so a
 * quarter is either in the record or was never surveyed. A negative figure
 * cannot arrive either — the engine floors the census at zero, because a wedge
 * below zero is dropped rather than drawn.
 */
export function industryRows(pub: PublishedState, lens: IndustryLens): StackRow[] {
  return settled(pub.industry).map((p) => ({
    tick: p.forQtr,
    values: SECTOR_IDS.reduce<Record<string, number>>((acc, id) => {
      acc[id] = Math.max(0, p[lens][id])
      return acc
    }, {}),
  }))
}

/**
 * Annualized growth of one industry between the first and latest census, in
 * %/yr — "which industries are growing and which are shrinking", which is the
 * question issue #97 opens with and which no share can answer. A share can
 * fall while an industry doubles.
 *
 * `null` until there is a real span to measure over: two adjacent quarters of
 * a noisy survey annualize to a number in the hundreds, and a table of those
 * is worse than an empty column.
 */
export const GROWTH_MIN_QTRS = 8

export function industryGrowth(
  pub: PublishedState,
  lens: IndustryLens,
): Record<SectorId, number> | null {
  const history = settled(pub.industry)
  const first = history[0]
  const last = history[history.length - 1]
  if (!first || !last || last.forQtr - first.forQtr < GROWTH_MIN_QTRS) return null
  const years = (last.forQtr - first.forQtr) / 4
  return SECTOR_IDS.reduce<Record<SectorId, number>>((acc, id) => {
    const from = first[lens][id]
    const to = last[lens][id]
    acc[id] = from > 1e-9 && to > 0 ? 100 * (Math.pow(to / from, 1 / years) - 1) : 0
    return acc
  }, {} as Record<SectorId, number>)
}
