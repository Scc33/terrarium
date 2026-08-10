/**
 * Deterministic published series for the component gallery.
 *
 * The gallery existed to pin every visual state a screenshot suite needs, but
 * until now it pinned no FITTED instrument: it rendered `BlankPlate` and a
 * hand-written phosphor swatch, and every other visual test opens a 1946
 * dashboard where nothing has been surveyed yet. So no screenshot in the suite
 * had ever contained a working gauge or ticker — which is how the terminal
 * ticker sheared its own readout off the right edge of a 213 px board slot,
 * shipped, and survived every visual run until somebody found it by hand in a
 * browser (see `TerminalTicker`'s module comment for the fix).
 *
 * These fixtures are the standing guard against the next one. They are the
 * reason `tests/visual/ui.spec.ts` can assert that nothing inside a wall tile
 * paints past the tile's own edges: that probe needs a fitted instrument at a
 * real slot width to have anything to look at.
 *
 * WHAT THESE NUMBERS ARE. Values, revisions and GDP levels are lifted from real
 * engine runs rather than invented, so the tiles show figures the wall can
 * actually print:
 *
 *   - `gdp_growth` comes from Costona at 2040–2049 — the one curated country
 *     with a big enough population to carry FOUR-DIGIT GDP levels, which is
 *     what makes its `R…/N…` string the widest thing a tile ever prints.
 *   - `household_saving_rate` comes from a fully-surveyed procedural century.
 *     It is the only indicator left carrying a `complement` (`SPEND …`), which
 *     occupies the same band as the levels and used to belong to the withdrawn
 *     `government_demand_share` (schema 16, see docs/metrics-changelog.md).
 *
 * The one synthesis: error bands are a WELL-SURVEYED office's, not the office
 * each trace actually had. The engine only confesses a band above 0.45
 * statistical capacity, and Costona — poor, large, hard — never sustains that,
 * so in a single natural run four-digit levels and a `±` band never co-occur.
 * They are independent per-print fields, and the gallery's job is to pin the
 * WIDEST tile the component can emit, not the modal one.
 *
 * Everything here is a literal. No RNG, no clock: the screenshot is stable.
 */

import type { IndicatorId, IndicatorPoint, IndicatorSeries } from '@terrarium/observation'

/** One watch-board slot at the 1280×720 reference viewport, measured against
 * the running app (`.instrument-board > *`). Rendering these tiles full-width
 * would prove nothing — the shear only appears in a slot this narrow. */
export const BOARD_SLOT = { w: 213, h: 218 } as const

/** 2050 Q1 — the end of the playable century, where the levels are largest. */
export const GALLERY_NOW = 416

/**
 * The office's release schedule, mirrored from `printsDue` in
 * `engine/src/pipeline/statistics.ts` (`REVISION_DELAYS = [0, 2, 5]`, and a
 * one-quarter lag once the statistical service is worth having). A quarter is
 * therefore carrying, at `GALLERY_NOW`:
 *
 *   revision 2 (final)  q ≤ now−6
 *   revision 1          now−5 … now−3
 *   revision 0 (first)  now−2 … now−1
 *
 * The traces below were sampled at their own `now` and are laid down against
 * this schedule unchanged, so each quarter carries the revision the engine
 * really had published for it.
 */
const REVISION_DELAYS = [0, 2, 5] as const
const PUBLICATION_LAG = 1
/** each revision narrows the office's confessed band by this factor */
const REVISION_BAND_DECAY = 0.45

/** `[firstPrint, latestPrint]`, plus `[real, nominal]` GDP levels where the
 * indicator carries them (`withLevels` — `gdp_growth` alone). */
type FixtureQuarter = readonly [number, number] | readonly [number, number, number, number]

const topRevisionAt = (forQtr: number, now: number): number => {
  for (let r = REVISION_DELAYS.length - 1; r >= 0; r--) {
    if (forQtr + PUBLICATION_LAG + REVISION_DELAYS[r] <= now) return r
  }
  return 0
}

/**
 * Lay a trace down as the prints an office would actually have released by
 * `GALLERY_NOW`: the first print always, plus the latest revision where one is
 * due. The middle revision is omitted where a final exists — `shapeSeries`
 * keeps only the first and the highest, so nothing on screen can tell.
 */
function buildSeries(
  id: IndicatorId,
  label: string,
  unit: string,
  quarters: readonly FixtureQuarter[],
  firstBand: number,
): IndicatorSeries {
  const points: IndicatorPoint[] = []
  quarters.forEach((quarter, i) => {
    const forQtr = GALLERY_NOW - quarters.length + i
    const [first, latest] = quarter
    const levels = quarter.length === 4 ? { real: quarter[2], nominal: quarter[3] } : undefined
    points.push({
      forQtr,
      publishedAt: forQtr + PUBLICATION_LAG,
      value: first,
      revision: 0,
      errorBand: firstBand,
      ...(levels ? { levels } : {}),
    })
    const top = topRevisionAt(forQtr, GALLERY_NOW)
    if (top > 0) {
      points.push({
        forQtr,
        publishedAt: forQtr + PUBLICATION_LAG + REVISION_DELAYS[top],
        value: latest,
        revision: top,
        errorBand: firstBand * Math.pow(REVISION_BAND_DECAY, top),
        ...(levels ? { levels } : {}),
      })
    }
  })
  return { id, label, unit, points }
}

/**
 * Costona, 2040 Q1 – 2049 Q4. A boom, a five-year slump that takes the needle
 * off the bottom of the −15…15 face, and a sharp recovery — and the office
 * revising 2048 Q1 from +0.97 to +7.84 along the way, which is what earns the
 * REVISED stamp the gauge prints. Levels run 1228 → 1671 real.
 */
const GDP_GROWTH_QUARTERS: readonly FixtureQuarter[] = [
  [-1.85, 0.83, 1228, 1392],
  [0.74, 2.89, 1258, 1417],
  [-2.96, 2.07, 1254, 1407],
  [-0.37, 0.01, 1266, 1415],
  [0.57, 2.48, 1271, 1411],
  [-0.05, 1.35, 1279, 1413],
  [2.22, 3.86, 1295, 1417],
  [3.73, 2.64, 1306, 1420],
  [7.38, 3.34, 1328, 1437],
  [1.59, 2.83, 1312, 1413],
  [7.94, 3.56, 1337, 1432],
  [3.77, 2.31, 1342, 1433],
  [8.37, 5.87, 1347, 1431],
  [6.62, 3.66, 1365, 1448],
  [4.28, 3.42, 1389, 1474],
  [12.37, 13.61, 1422, 1500],
  [5.3, 7.5, 1452, 1537],
  [1.53, 2.95, 1467, 1565],
  [0.6, 0.69, 1475, 1590],
  [7.21, 0.46, 1480, 1612],
  [-1.37, -0.28, 1489, 1639],
  [2.6, -0.42, 1476, 1641],
  [-4.49, -2.09, 1464, 1640],
  [-1.49, -2.39, 1465, 1656],
  [-2.73, -2.02, 1458, 1650],
  [-1.31, -0.38, 1447, 1641],
  [1.15, -1.71, 1435, 1626],
  [-2.85, -1.42, 1442, 1627],
  [-2.83, -1.38, 1440, 1616],
  [-3.37, -3.53, 1423, 1591],
  [-9.08, -7.11, 1393, 1594],
  [-3.55, -4.85, 1384, 1606],
  [0.34, -2.07, 1380, 1605],
  [3.53, 3.36, 1392, 1584],
  [4.41, 3.07, 1405, 1562],
  [1.9, 5.22, 1417, 1540],
  [0.97, 7.84, 1442, 1532],
  [9.38, 12.03, 1467, 1522],
  [4.55, 4.55, 1474, 1497],
  [10.76, 10.76, 1671, 1659],
]

/** A fully-surveyed procedural century: households save through a good decade,
 * dip into drawdown below the DRAWDOWN mark on the face, and recover. */
const SAVING_RATE_QUARTERS: readonly FixtureQuarter[] = [
  [1.32, 2.39],
  [0.94, 2.58],
  [1.98, 2.95],
  [2.86, 3.75],
  [1.03, 3.95],
  [5.5, 4.03],
  [0.91, 3.4],
  [4.01, 2.62],
  [2.12, 3.05],
  [3.64, 2.51],
  [1.72, 2.45],
  [1.51, 2.24],
  [3.66, 2.55],
  [4.09, 2.73],
  [0.85, 1.75],
  [1.03, 2.48],
  [3.31, 2.37],
  [2.96, 2.11],
  [0.88, 2.01],
  [1.41, 2.17],
  [-0.96, 0.98],
  [0.54, 0.58],
  [1.33, 1.51],
  [0.13, 0.96],
  [2.12, 0.39],
  [-1.19, 0.55],
  [-0.43, -0.07],
  [-0.38, 0.07],
  [0.15, 0.81],
  [-0.61, 0.44],
  [1.31, 0.43],
  [0.61, 1.22],
  [3.47, 1.04],
  [0.09, 2.11],
  [0.49, 2.89],
  [1.53, 2.77],
  [3.24, 3.61],
  [3.54, 4.06],
  [3.24, 3.24],
  [3.52, 3.52],
]

/**
 * The two indicators worth putting in a board slot, and why each is here.
 *
 * `gdp_growth` is the only spec with `withLevels`, so it is the only tile
 * carrying `R…/N…` at all — and it holds one of the longest `terminal`
 * mnemonics in `labels.ts` (`REAL.GDP.GRW %/YR`) in the band above it, so it
 * loads both of a tile's two truncating halves at once.
 *
 * `household_saving_rate` is the widest of the rest: the only indicator still
 * carrying a `complement`, which puts `SPEND …` in the same truncating half
 * that `gdp_growth` fills with its levels — the other way that half gets
 * loaded, and the only way to exercise it.
 */
/**
 * Veltravia, fully surveyed, running research — 2040 Q1 – 2049 Q4. This is the
 * WIDEST FIGURE the wall can print: an index against 1946 that has passed a
 * thousand, carrying a ±12.5 band beside it. `gdp_growth` above holds the
 * longest mnemonic and the levels; this one holds the longest number, which is
 * the other way a header runs out of room.
 *
 * That matters because `GALLERY_INSTRUMENTS` is an ARRAY, not a total `Record`
 * over `IndicatorId` — the same trap `INDICATOR_SPECS` sets one layer down. A
 * new indicator is not covered by the shear probe until somebody puts it here,
 * and nothing fails if nobody does.
 */
const PRODUCTIVITY_QUARTERS: readonly FixtureQuarter[] = [
  [782.2, 821.5],
  [796.1, 819.2],
  [826.0, 811.2],
  [803.1, 827.9],
  [810.6, 839.8],
  [840.8, 847.0],
  [840.9, 861.8],
  [896.7, 885.3],
  [878.4, 895.4],
  [939.4, 913.9],
  [882.2, 939.2],
  [911.8, 955.1],
  [944.9, 960.5],
  [984.4, 969.1],
  [936.7, 976.4],
  [984.6, 973.4],
  [969.3, 990.7],
  [1011.6, 1002.2],
  [1000.4, 1002.4],
  [1016.8, 1005.6],
  [1005.6, 994.9],
  [974.5, 1001.3],
  [1008.5, 998.0],
  [969.0, 986.4],
  [948.3, 967.7],
  [917.4, 956.6],
  [1017.1, 936.9],
  [913.1, 928.5],
  [958.3, 910.4],
  [928.2, 927.6],
  [938.8, 924.3],
  [909.1, 923.9],
  [962.7, 931.6],
  [950.4, 931.5],
  [939.5, 931.8],
  [958.8, 942.7],
  [970.8, 944.0],
  [1001.3, 964.7],
  [1011.5, 1011.5],
  [992.7, 992.7],
]

export const GALLERY_INSTRUMENTS: readonly { indicator: IndicatorId; series: IndicatorSeries }[] = [
  {
    indicator: 'gdp_growth',
    series: buildSeries('gdp_growth', 'Real GDP growth', '% / yr', GDP_GROWTH_QUARTERS, 1.92),
  },
  {
    indicator: 'household_saving_rate',
    series: buildSeries(
      'household_saving_rate',
      'Household saving rate',
      '% disposable',
      SAVING_RATE_QUARTERS,
      2.3,
    ),
  },
  {
    indicator: 'productivity',
    series: buildSeries(
      'productivity',
      'Output per worker',
      '1946=100',
      PRODUCTIVITY_QUARTERS,
      12.5,
    ),
  },
]
