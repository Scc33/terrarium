/** Independent true-state oracle for country fuzzing. It checks worksheets
 * against the country measured, not against a display helper's own inverse. */
import { InvariantError, wealthAccounts, type TrueState } from '@terrarium/engine'

export function perPersonDiagnostics(state: TrueState) {
  const population = state.demography.pyramid.reduce((sum, people) => sum + people, 0)
  if (!Number.isFinite(population) || population <= 0) throw new InvariantError('per-person denominator is invalid')
  const capital = state.sectors.reduce((sum, sector) => sum + sector.capital, 0)
  const wealth = wealthAccounts(state)
  const row = state.stats.record.at(-1)
  const close = (actual: number, expected: number, label: string) => {
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > 1e-8 * Math.max(1, Math.abs(expected))) {
      throw new InvariantError(`per-person ${label}: ${actual} != ${expected}`)
    }
  }
  if (row) {
    close(row.population, population, 'worksheet census')
    close(row.realGdpPerCapita, 4 * state.flows.realGdp / population, 'GDP annualization')
    close(row.capitalTotal, capital, 'capital stock')
    close(row.wealth.nationalNetWorth, row.wealth.productiveCapital + row.wealth.netForeignAssets, 'wealth consolidation')
  }
  const values = {
    population,
    capitalPerPerson: capital / population,
    liquidSavingsPerPerson: state.cohorts.reduce((sum, cohort) => sum + cohort.savings, 0) / population,
    householdNetWorthPerPerson: wealth.household.netWorth / population,
    nationalNetWorthPerPerson: wealth.nationalNetWorth / population,
  }
  for (const [key, value] of Object.entries(values)) if (!Number.isFinite(value)) throw new InvariantError(`per-person ${key} is non-finite`)
  return values
}
