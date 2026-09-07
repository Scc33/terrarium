/**
 * `INDICATOR_SPECS` is a total keyed record, so completeness, uniqueness, and
 * key-matches-`spec.id` are all compile errors now — the test that asserted
 * them at runtime went with the array.
 *
 * What no type can see is ORDER, and order is load-bearing: the step inserts
 * into `state.stats.series` as it iterates the catalogue, and `stableStringify`
 * rounds values without sorting keys, so the insertion order of that object is
 * part of every state hash. A record LOOKS unordered, which is exactly why
 * alphabetizing it is a tempting and invisible change: every published value
 * stays bit-identical while every long-run hash moves. The 40-quarter goldens
 * cannot see it either — they publish four of these thirty-seven series.
 *
 * So this pins the order of the entries that exist as a PREFIX. Appending a new
 * indicator needs no change here; reordering or inserting one fails by name.
 */

import { describe, expect, it } from 'vitest'
import type { INDICATOR_IDS } from '@terrarium/engine'
import { INDICATOR_SPECS } from '../../packages/engine/src/pipeline/indicatorSpecs'

/** Catalogue order at schema 44. Deliberately NOT `INDICATOR_IDS` — the two
 * agree for 32 entries and then diverge, which is the trap this guards. */
const PINNED_ORDER = [
  'gdp_growth', 'gdp_per_capita', 'debt_to_gdp',
  'consumption_per_capita', 'household_saving_rate', 'consumption_share',
  'investment_share', 'export_share', 'fdi_inflows',
  'inflation', 'price_food', 'price_fuel',
  'unemployment', 'labor_force_participation', 'human_capital',
  'payrolls', 'capital_stock', 'technology_attainment',
  'productivity', 'conf_consumer', 'conf_business',
  'approval', 'gini', 'income_real',
  'poverty_rate', 'life_expectancy', 'human_development',
  'net_migration', 'birth_rate', 'death_rate',
  'terms_of_trade', 'asset_prices', 'unrest',
  'pollution', 'credit_growth', 'credit_to_gdp',
  'bank_capital_ratio',
] as const satisfies readonly (typeof INDICATOR_IDS)[number][]

describe('the indicator measurement catalogue', () => {
  it('keeps its established entry order, because series key order is in the state hash', () => {
    const keys = Object.keys(INDICATOR_SPECS)
    expect(
      keys.slice(0, PINNED_ORDER.length),
      'reordering the catalogue moves every long-run state hash while leaving every published value bit-identical. Append new indicators at the end.',
    ).toEqual([...PINNED_ORDER])
  })
})
