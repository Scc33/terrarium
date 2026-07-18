/** The golden-replay case table, shared by tests/golden and tools/bless. */

import type { ActionLog, CountryParams } from '@terrarium/engine'
import { fuelTaxAtQ8, passive, standardCountry } from '@terrarium/fixtures'

export interface GoldenCase {
  name: string
  params: CountryParams
  seed: string
  script: ActionLog
  ticks: number
}

export const GOLDEN_CASES: GoldenCase[] = [
  { name: 'passive-40q', params: standardCountry, seed: 'golden-1', script: passive, ticks: 40 },
  { name: 'fuel-tax-40q', params: standardCountry, seed: 'golden-1', script: fuelTaxAtQ8, ticks: 40 },
]
