/** Fogged industrial-census publication, separate from scalar indicators. */

import {
  INDUSTRY_CENSUS_FUNDED_AT,
  INDUSTRY_EMPLOYMENT_SD,
  INDUSTRY_VALUE_ADDED_SD,
} from '../constants'
import { rngFor, type Seed } from '../rng/rng'
import {
  INDUSTRY_TABLE_IDS,
  SECTOR_IDS,
  type IndustryPrint,
  type IndustryTableId,
  type SectorId,
  type StatRecord,
} from '../state/schema'
import { lagFor, noiseScale, PUBLICATION_LAGS, REVISION_DELAYS } from './measurement'

const INDUSTRY_SD: Record<IndustryTableId, number> = {
  valueAdded: INDUSTRY_VALUE_ADDED_SD,
  employment: INDUSTRY_EMPLOYMENT_SD,
}

/** Same clock and fog as the indicator machinery, applied to two vectors. */
export function industryPrintsDue(
  record: StatRecord[],
  publishedAt: number,
  seed: Seed,
  fullInstrumentation: boolean,
): IndustryPrint[] {
  const out: IndustryPrint[] = []
  for (let r = 0; r < REVISION_DELAYS.length; r++) {
    for (const lag of PUBLICATION_LAGS) {
      const q = publishedAt - lag - REVISION_DELAYS[r]
      if (q < 0 || q >= record.length) continue
      const cap = record[q].statCapacity
      if (!fullInstrumentation && cap < INDUSTRY_CENSUS_FUNDED_AT) continue
      if (lagFor(cap) !== lag) continue
      const settling = noiseScale(cap) * Math.pow(0.45, r)
      const truth = record[q].industry
      const tables = {} as Record<IndustryTableId, Record<SectorId, number>>
      const errorBand = {} as IndustryPrint['errorBand']
      for (const table of INDUSTRY_TABLE_IDS) {
        const sd = INDUSTRY_SD[table] * settling
        const rng = rngFor(seed, `obs:industry:${table}:${q}:${r}`, 0)
        const figures = {} as Record<SectorId, number>
        for (const sid of SECTOR_IDS) {
          figures[sid] = Math.max(0, truth[sid][table] * (1 + rng.normal(0, sd)))
        }
        tables[table] = figures
        errorBand[table] = cap >= 0.45 ? 1.96 * sd : 0
      }
      out.push({
        forQtr: q,
        publishedAt,
        revision: r,
        errorBand,
        valueAdded: tables.valueAdded,
        employment: tables.employment,
      })
    }
  }
  return out
}
