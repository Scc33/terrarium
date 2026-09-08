/** The occupational labour-survey contract, kept out of the root state schema. */

export const LABOUR_CLASS_IDS = ['rural_workers', 'urban_workers', 'professionals'] as const
export type LabourClassId = (typeof LABOUR_CLASS_IDS)[number]

export const LABOUR_MARKET_TABLE_IDS = ['jobless', 'underemployed'] as const
export type LabourMarketTableId = (typeof LABOUR_MARKET_TABLE_IDS)[number]

export type LabourMarketRecord = Record<
  LabourClassId,
  { jobless: number; underemployed: number }
>

/** One release of joblessness and lower-rung work by occupational class. */
export interface LabourMarketPrint {
  forQtr: number
  publishedAt: number
  revision: number
  /** Absolute half-widths in rate units; zero is the office's usual shrug. */
  errorBand: Record<LabourMarketTableId, number>
  jobless: Record<LabourClassId, number>
  underemployed: Record<LabourClassId, number>
}
