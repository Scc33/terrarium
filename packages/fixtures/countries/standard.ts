import type { CountryParams } from '@terrarium/engine'

/** Fixed mid-poor 1946 country for tests — never regenerate, never tweak
 * casually: golden replays hash states built from this. */
export const standardCountry: CountryParams = {
  name: 'Meridia',
  development: 0.35,
  openness: 1.0,
  capacities: { tax: 0.25, statistical: 0.18, administrative: 0.3 },
  cohortSizes: {
    rural_workers: 12,
    urban_workers: 8,
    professionals: 3,
    business_owners: 1.5,
    retirees: 3,
  },
  enfranchisement: {
    rural_workers: 0.6,
    urban_workers: 0.8,
    professionals: 1,
    business_owners: 1,
    retirees: 0.9,
  },
}
