/** Read the asset-and-liability survey as released. Never add liquid claims
 * to productive capital to manufacture a national total: the office has
 * consolidated the counterparties before publication. */
import { WEALTH_SURVEY_FUNDED_AT } from '@terrarium/engine'
import { HOUSEHOLD_WEALTH_COMPONENT_IDS, type PublishedState, type WealthPrint,
  type HouseholdWealthComponentId } from '@terrarium/observation'
import { censusByQuarter, perPerson, type PopulationBasis } from './perPerson'

export const WEALTH_FACE: Record<HouseholdWealthComponentId, { label: string; liability: boolean; note: string }> = {
  deposits: { label: 'Liquid deposits', liability: false, note: 'Household cash balances, with matching bank liabilities.' },
  bonds: { label: 'Government bonds', liability: false, note: 'The paper households actually hold, priced at current quoted yields. New subscriptions cost deposits; maturity and buybacks return cash.' },
  productiveAssets: { label: 'Owned business capital', liability: false, note: 'Domestic private productive assets at current capital-goods prices and market valuation. Public and foreign ownership are excluded.' },
  bankEquity: { label: 'Bank equity', liability: false, note: 'Domestic household ownership of the banking system’s net worth, at book value.' },
  businessLoans: { label: 'Business loans', liability: true, note: 'Bank debt of household-owned businesses. Subtracted once from the productive assets above.' },
  overdrafts: { label: 'Household overdrafts', liability: true, note: 'Cash shortfalls carried as debt. Positive cash pays these down before accumulating deposits.' },
}

export function wealthAvailability(pub: PublishedState): 'unfunded' | 'awaiting' | 'reporting' {
  if (pub.wealth.length) return 'reporting'
  return pub.rules.fullInstrumentation || pub.capacity.statistical >= WEALTH_SURVEY_FUNDED_AT ? 'awaiting' : 'unfunded'
}

export function wealthHistory(pub: PublishedState, basis: PopulationBasis): WealthPrint[] {
  const latest = new Map<number, WealthPrint>()
  for (const point of pub.wealth) {
    const current = latest.get(point.forQtr)
    if (!current || point.revision > current.revision) latest.set(point.forQtr, point)
  }
  const census = censusByQuarter(pub)
  return [...latest.values()].sort((a, b) => a.forQtr - b.forQtr).flatMap(point => {
    if (basis === 'total') return [point]
    const population = census.get(point.forQtr)
    if (perPerson(1, population) === null) return []
    const household = { ...point.household }
    for (const id of HOUSEHOLD_WEALTH_COMPONENT_IDS) household[id] /= population!
    household.netWorth /= population!
    return [{ ...point, household, publicNetWorth: point.publicNetWorth / population!, nationalNetWorth: point.nationalNetWorth / population!,
      publicErrorBand: point.publicErrorBand / population!, nationalErrorBand: point.nationalErrorBand / population! }]
  })
}

/** Bands on a difference are sums of component half-widths. Multiplying
 * net worth by a relative band would claim certainty when assets equal debt. */
export function householdWealthBand(point: WealthPrint): number {
  return point.errorBand * HOUSEHOLD_WEALTH_COMPONENT_IDS.reduce((sum, id) => sum + Math.abs(point.household[id]), 0)
}
