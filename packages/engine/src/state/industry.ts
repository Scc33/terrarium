import type { Money, Qtr, SectorId } from './schema'

/** The two tables one census release carries. A `const` tuple like every
 * other id list here, so the band record, the noise table in `statistics.ts`
 * and the overlay's lens all index the same keys — a table added without a
 * noise constant or a printed name fails the build rather than borrowing its
 * neighbour's band. */
export const INDUSTRY_TABLE_IDS = ['valueAdded', 'employment'] as const
export type IndustryTableId = (typeof INDUSTRY_TABLE_IDS)[number]

/**
 * One quarter of the industrial census, exactly as the office released it —
 * the PRODUCTION side of the same output the headline measures. `gdp_growth`
 * says the economy grew; this says which industries grew it and who they put
 * to work, which is the only form in which the question "what kind of country
 * is this becoming" can be asked.
 *
 * It is a vector rather than a family of indicators on purpose. Five sectors
 * times two tables is ten dials, and the wall has room for six more strips in
 * total; more to the point, a sector share has no honest FIXED dial face
 * (ADR-0006) when the countries in the catalogue open anywhere between 5% and
 * 60% agricultural. The census is paperwork, so it is read as paperwork.
 *
 * Each industry is estimated separately, so the parts do NOT sum to the
 * published GDP and the employment column does not sum to the published
 * payrolls — the same confession the expenditure accounts make. The
 * composition views renormalize rather than pretend otherwise.
 */
export interface IndustryPrint {
  forQtr: Qtr // period measured
  publishedAt: Qtr // period released
  revision: number // 0 = first print
  /** Half-width the office confesses on each table, as a FRACTION of each
   * figure — the industries differ by an order of magnitude in size, so one
   * absolute band honest about services would print energy negative. 0 means
   * the office cannot even estimate its error, which is a shrug and must
   * never be shown as certainty.
   *
   * ONE BAND PER TABLE, because the two are surveyed to different accuracy: an
   * enumerator can count heads at a factory gate and has to estimate what the
   * factory made. A single band would overstate the employment survey's
   * uncertainty by half at every capacity — the office confessing an error it
   * did not make. */
  errorBand: Record<IndustryTableId, number>
  /** real value added at base prices, by industry. The truth behind this sums
   * exactly to real GDP; these estimates do not. */
  valueAdded: Record<SectorId, Money>
  /** people at work, millions, by industry */
  employment: Record<SectorId, number>
}
