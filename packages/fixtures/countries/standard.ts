import type { CountryParams } from '@terrarium/engine'

/** Fixed mid-poor 1946 country for tests — never regenerate, never tweak
 * casually: golden replays hash states built from this. */
export const standardCountry: CountryParams = {
  name: 'Meridia',
  development: 0.35,
  openness: 1.0,
  capacities: { tax: 0.25, statistical: 0.18, administrative: 0.3, education: 0.2 },
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
  // young 1946 pyramid: 35% under 15, 60+ sums to the 3.0 retiree class,
  // bands sum to the 27.5 total (5-year bands, 0–4 first)
  pyramid: [
    3.6, 3.2, 2.8, // 0–14
    2.45, 2.2, 1.95, 1.75, 1.55, 1.4, 1.3, 1.2, 1.1, // 15–59
    1.05, 0.85, 0.6, 0.35, 0.15, // 60+
  ],
}
