/** Assets and liabilities are surveyed on the ordinary publication clock.
 * Net worth is computed from the same surveyed components, never drawn again. */
import { WEALTH_SURVEY_FUNDED_AT, WEALTH_SURVEY_RELATIVE_SD,
  STAT_ERROR_BAND_CAPACITY_GATE, STAT_ERROR_BAND_Z, STAT_REVISION_SETTLING_RATE } from '../constants'
import { rngFor, type Seed } from '../rng/rng'
import type { StatRecord } from '../state/schema'
import { HOUSEHOLD_WEALTH_COMPONENT_IDS, type HouseholdWealth, type WealthPrint } from '../state/wealth'
import { lagFor, noiseScale, PUBLICATION_LAGS, REVISION_DELAYS } from './measurement'
import { householdNetWorth } from './wealth'

export function wealthPrintsDue(record: readonly StatRecord[], publishedAt: number, seed: Seed, full: boolean): WealthPrint[] {
  const out: WealthPrint[] = []
  for (let revision = 0; revision < REVISION_DELAYS.length; revision++) {
    for (const lag of PUBLICATION_LAGS) {
      const q = publishedAt - lag - REVISION_DELAYS[revision]
      const row = record[q]
      if (!row || (!full && row.statCapacity < WEALTH_SURVEY_FUNDED_AT) || lagFor(row.statCapacity) !== lag) continue
      const sd = WEALTH_SURVEY_RELATIVE_SD * noiseScale(row.statCapacity) * Math.pow(STAT_REVISION_SETTLING_RATE, revision)
      const household = {} as HouseholdWealth
      for (const id of HOUSEHOLD_WEALTH_COMPONENT_IDS) {
        const rng = rngFor(seed, `obs:wealth:${id}:${q}:${revision}`, 0)
        household[id] = Math.max(0, row.wealth.household[id] * (1 + rng.normal(0, sd)))
      }
      household.netWorth = householdNetWorth(household)
      // Survey gross claims before netting: offsetting assets and liabilities
      // cannot make a zero net position certain. Bands use estimated amounts.
      const publicComponents = [row.wealth.publicCapital, row.fund, row.centralBankAssets,
        row.reserves, -row.wealth.bankSettlement, -row.wealth.household.bonds - row.wealth.foreignBonds]
        .map((value, component) => value * (1 + rngFor(seed, `obs:wealth:public:${component}:${q}:${revision}`, 0).normal(0, sd)))
      const publicNetWorth = publicComponents.reduce((sum, value) => sum + value, 0)
      const errorBand = row.statCapacity >= STAT_ERROR_BAND_CAPACITY_GATE ? STAT_ERROR_BAND_Z * sd : 0
      const publicErrorBand = errorBand * publicComponents.reduce((sum, value) => sum + Math.abs(value), 0)
      const householdBand = errorBand * HOUSEHOLD_WEALTH_COMPONENT_IDS.reduce((sum, id) => sum + Math.abs(household[id]), 0)
      out.push({ forQtr: q, publishedAt, revision,
        errorBand, publicErrorBand, nationalErrorBand: publicErrorBand + householdBand,
        household, publicNetWorth, nationalNetWorth: household.netWorth + publicNetWorth })
    }
  }
  return out
}
