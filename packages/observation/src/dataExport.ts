/**
 * The portable record of a run.
 *
 * A save is optimized for replay: country + seed + decisions. This export is
 * optimized for reading and analysis: every historical record the government
 * could see, plus the current public desk. It deliberately accepts only
 * `PublishedState`, so adding an export button cannot become a side door
 * around the fog boundary.
 *
 * The format has its own version because it is a consumer contract for people,
 * scripts, and a possible future MCP. It is not the engine state schema: the
 * engine/schema pair that produced the run remains attached under `run.version`.
 */

import { FIRST_YEAR, type SaveFile } from '@terrarium/engine'
import { INDICATOR_IDS, type IndicatorId, type IndicatorPoint, type PublishedState } from './published'

export const DATA_EXPORT_FORMAT = 'terrarium-published-history' as const
export const DATA_EXPORT_VERSION = 1 as const

export type IndicatorRelease = IndicatorPoint & {
  indicator: IndicatorId
  label: string
  unit: string
}

type HistoricalPublishedKey =
  | 'indicators'
  | 'industry'
  | 'books'
  | 'census'
  | 'policy'
  | 'news'
  | 'corridor'

/** The desk as it stood when the file was exported. Long records are split
 * into named tables below; only the corridor's current reading stays here. */
export type PublishedSnapshot = Omit<PublishedState, HistoricalPublishedKey> & {
  corridor: Omit<PublishedState['corridor'], 'trail'>
}

export interface HistoricalDataExport {
  format: typeof DATA_EXPORT_FORMAT
  formatVersion: typeof DATA_EXPORT_VERSION
  /** Tick zero is the first quarter of this year. Ticks then advance quarterly. */
  calendar: { firstYear: number; quartersPerYear: 4 }
  /** The exact replay inputs are included as provenance. Importing a run still
   * uses the smaller standalone save file from the records office. */
  run: SaveFile
  snapshot: PublishedSnapshot
  records: {
    /** One row per release, including every revision and its confessed band. */
    indicatorReleases: IndicatorRelease[]
    /** Vector releases from the industrial census, in publication order. */
    industryReleases: PublishedState['industry']
    /** Exact government books, one row per quarter. */
    treasury: PublishedState['books']
    /** Exact head counts and age pyramids, one row per quarter. */
    census: PublishedState['census']
    /** The government's own dials and standing rules, one row per quarter. */
    policy: PublishedState['policy']
    /** Qualitative public events and rumors, in wire order. */
    news: PublishedState['news']
    /** Exact constitutional position, one point per quarter. */
    corridor: PublishedState['corridor']['trail']
  }
}

/**
 * Assemble a deterministic, JSON-safe export. No wall clock is filed: the
 * same run at the same tick produces the same artifact, which makes it useful
 * in tests as well as in a person's notebook.
 */
export function createHistoricalDataExport(
  published: PublishedState,
  save: SaveFile,
): HistoricalDataExport {
  const { indicators, industry, books, census, policy, news, corridor, ...current } = published
  const indicatorReleases: IndicatorRelease[] = []

  // Use the catalogue order rather than object enumeration. An unfunded series
  // is absent, while every funded series and every revision becomes one row.
  for (const indicator of INDICATOR_IDS) {
    const series = indicators[indicator]
    if (!series) continue
    for (const point of series.points) {
      indicatorReleases.push({ indicator, label: series.label, unit: series.unit, ...point })
    }
  }

  return structuredClone({
    format: DATA_EXPORT_FORMAT,
    formatVersion: DATA_EXPORT_VERSION,
    calendar: { firstYear: FIRST_YEAR, quartersPerYear: 4 as const },
    run: save,
    snapshot: {
      ...current,
      corridor: {
        statePower: corridor.statePower,
        societalPower: corridor.societalPower,
        offset: corridor.offset,
        halfWidth: corridor.halfWidth,
        inCorridor: corridor.inCorridor,
      },
    },
    records: {
      indicatorReleases,
      industryReleases: industry,
      treasury: books,
      census,
      policy,
      news,
      corridor: corridor.trail,
    },
  })
}
