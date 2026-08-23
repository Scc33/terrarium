/** The golden-replay case table, shared by tests/golden and tools/bless. */

import type { ActionLog, CountryParams } from '@terrarium/engine'
import { competitionActAtQ8, fuelTaxAtQ8, passive, standardCountry } from '@terrarium/fixtures'

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
  // A case that actually enacts something. Without one, every statute in the
  // register is reviewed by a diff that never fires it, and the bless workflow
  // would sign off on a channel nobody looked at.
  {
    name: 'competition-act-40q',
    params: standardCountry,
    seed: 'golden-1',
    script: competitionActAtQ8,
    ticks: 40,
  },
]
