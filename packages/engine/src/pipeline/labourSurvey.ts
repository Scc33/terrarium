/** Fogged publication of the occupational labour worksheet. */

import {
  LABOUR_JOBLESS_SD,
  LABOUR_SURVEY_FUNDED_AT,
  LABOUR_UNDEREMPLOYED_SD,
} from '../constants'
import { clamp } from '../math'
import { rngFor, type Seed } from '../rng/rng'
import {
  LABOUR_CLASS_IDS,
  LABOUR_MARKET_TABLE_IDS,
  type LabourMarketPrint,
  type LabourMarketTableId,
} from '../state/labour'
import type { StatRecord } from '../state/schema'
import { errorBandFor, lagFor, PUBLICATION_LAGS, REVISION_DELAYS, settlingFor } from './measurement'

const LABOUR_SD: Record<LabourMarketTableId, number> = {
  jobless: LABOUR_JOBLESS_SD,
  underemployed: LABOUR_UNDEREMPLOYED_SD,
}

/** Every class/table cell gets its own substream, independent of the headline. */
export function labourPrintsDue(
  record: StatRecord[],
  publishedAt: number,
  seed: Seed,
  fullInstrumentation: boolean,
): LabourMarketPrint[] {
  const out: LabourMarketPrint[] = []
  for (let r = 0; r < REVISION_DELAYS.length; r++) {
    for (const lag of PUBLICATION_LAGS) {
      const q = publishedAt - lag - REVISION_DELAYS[r]
      if (q < 0 || q >= record.length) continue
      const cap = record[q].statCapacity
      if (!fullInstrumentation && cap < LABOUR_SURVEY_FUNDED_AT) continue
      if (lagFor(cap) !== lag) continue
      const settling = settlingFor(cap, r)
      const tables = {} as Record<
        LabourMarketTableId,
        Record<(typeof LABOUR_CLASS_IDS)[number], number>
      >
      const errorBand = {} as LabourMarketPrint['errorBand']
      for (const table of LABOUR_MARKET_TABLE_IDS) {
        const sd = LABOUR_SD[table] * settling
        const figures = {} as LabourMarketPrint[typeof table]
        for (const id of LABOUR_CLASS_IDS) {
          const rng = rngFor(seed, `obs:labour:${table}:${id}:${q}:${r}`, 0)
          figures[id] = clamp(record[q].labourMarket[id][table] + rng.normal(0, sd), 0, 1)
        }
        tables[table] = figures
        errorBand[table] = errorBandFor(cap, sd)
      }
      out.push({ forQtr: q, publishedAt, revision: r, errorBand,
        jobless: tables.jobless, underemployed: tables.underemployed })
    }
  }
  return out
}
