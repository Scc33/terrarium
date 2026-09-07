/**
 * The measurement catalogue — one specification per published indicator: what
 * the office is trying to measure, and how badly it measures it at zero
 * capacity. Nothing here measures anything. `pipeline/statistics.ts` owns the
 * machinery (funding gates, lags, revisions, the `obs:*` noise draws) and
 * reads this table; separating them keeps the half that grows every time an
 * instrument ships away from the half where a mistake moves the economy.
 *
 * A spec's noise is drawn on `obs:<indicator>:<quarter>:<revision>`, a named
 * substream per (indicator, measured quarter, revision), so no draw depends on
 * how many draws preceded it. Entry order therefore cannot move a number —
 * but it IS the insertion order of `state.stats.series`, and `stableStringify`
 * does not sort keys, so reordering this record moves every long-run state
 * hash while leaving every published value bit-identical. A record LOOKS
 * unordered, which is what makes alphabetizing it a tempting, invisible and
 * expensive change. Add to the end; `tests/unit/indicator-specs.test.ts` pins
 * the existing order as a prefix.
 */

import type { IndicatorId, StatRecord } from '../state/schema'

/** Everything the office measures directly. `human_development` is the one
 * indicator with no true value of its own — it is constructed from published
 * component prints, never from TrueState. */
type DirectIndicatorId = Exclude<IndicatorId, 'human_development'>

/** Generic in its own id so the catalogue below can tie each KEY to the spec
 * filed under it. Left unparameterized — `DirectIndicatorSpec` — it is the
 * ordinary wide spec every reader wants. */
export interface DirectIndicatorSpec<
  K extends DirectIndicatorId = DirectIndicatorId,
> {
  id: K
  /** true value for measured quarter q (may need q−1 for growth) */
  trueValue(record: StatRecord[], q: number): number
  baseSd: number // first-print noise, in indicator units, at zero capacity
  /** if set, baseSd is a fraction of the true value (level series) */
  relativeSd?: boolean
  /** GDP only: attach level estimates to each print */
  withLevels?: boolean
  /** price boards are read off the market same-quarter: always lag 1,
   * even when the office is too poor to compile anything else quickly */
  fastLag?: boolean
}

export const HUMAN_DEVELOPMENT_COMPONENT_IDS = [
  'life_expectancy',
  'human_capital',
  'gdp_per_capita',
] as const satisfies readonly IndicatorId[]

export type HumanDevelopmentComponentId = (typeof HUMAN_DEVELOPMENT_COMPONENT_IDS)[number]

export interface ConstructedIndicatorSpec {
  id: 'human_development'
  /** Constructed releases read official component prints, never TrueState. */
  derivedFrom: typeof HUMAN_DEVELOPMENT_COMPONENT_IDS
}

export type IndicatorSpec = DirectIndicatorSpec | ConstructedIndicatorSpec

export const isDirectIndicatorSpec = (spec: IndicatorSpec): spec is DirectIndicatorSpec =>
  'trueValue' in spec

/** One spec per indicator, and the KEY is the spec's id. The mapped type is
 * what makes the catalogue total: omit an indicator, invent a key, or file
 * `gdp_growth: { id: 'inflation' }` and the build stops. It used to be an
 * array, which is why the `add-indicator` skill had to open by warning that a
 * missing entry compiles clean and leaves a blank plate on the wall forever. */
type IndicatorSpecsById = {
  [K in IndicatorId]: K extends 'human_development'
    ? ConstructedIndicatorSpec
    : DirectIndicatorSpec<Exclude<K, 'human_development'>>
}

export const INDICATOR_SPECS: IndicatorSpecsById = {
  gdp_growth: {
    id: 'gdp_growth',
    trueValue: (h, q) => {
      const prev = q > 0 ? h[q - 1].realGdp : h[q].realGdp
      return prev > 1e-9 ? (Math.pow(h[q].realGdp / prev, 4) - 1) * 100 : 0
    },
    baseSd: 2.5,
    withLevels: true,
  },
  gdp_per_capita: {
    id: 'gdp_per_capita',
    trueValue: (h, q) => h[q].realGdpPerCapita,
    baseSd: 0.035,
    relativeSd: true,
  },
  debt_to_gdp: {
    id: 'debt_to_gdp',
    // Debt is a stock; the worksheet's GDP is a quarterly flow. Annualize the
    // denominator before reporting the conventional public-debt ratio.
    trueValue: (h, q) =>
      h[q].nominalGdp > 1e-9 ? (100 * h[q].debt) / (4 * h[q].nominalGdp) : 0,
    // The treasury knows the numerator exactly. Uncertainty comes from the
    // office's nominal-output estimate, so it scales with the ratio itself.
    baseSd: 0.05,
    relativeSd: true,
  },
  consumption_per_capita: {
    id: 'consumption_per_capita',
    trueValue: (h, q) => h[q].realConsumptionPerCapita,
    baseSd: 0.05,
    relativeSd: true,
  },
  household_saving_rate: {
    id: 'household_saving_rate',
    trueValue: (h, q) => h[q].householdSavingRate * 100,
    baseSd: 3,
  },
  // The expenditure accounts. Each share is compiled from its own source, so
  // each carries its own error — and they are noised independently for that
  // reason, which is why the four prints do not sum to 100. The office is not
  // hiding a residual; it never had one to reconcile.
  //
  // All four take RELATIVE noise, which is not cosmetic. The components differ
  // by two orders of magnitude in this economy (consumption ~78% against
  // government ~1%), so one absolute band wide enough to be honest about
  // consumption prints the small components NEGATIVE — a share below zero is
  // not a thing a pie can draw, and a dial that reads −2% of the economy is
  // worse than no dial. A statistical office's error on a small aggregate is
  // proportional anyway: it is estimating a total, not counting to it.
  consumption_share: {
    id: 'consumption_share',
    // the biggest component and the best surveyed: retail returns and the
    // household budget survey both bear on it
    trueValue: (h, q) => h[q].consumptionShare * 100,
    baseSd: 0.04,
    relativeSd: true,
  },
  investment_share: {
    id: 'investment_share',
    // the hardest line in the accounts. Capital formation has to be inferred
    // from company returns and construction permits, and it is the component
    // that swings most between quarters, so a poor office guesses worst here.
    trueValue: (h, q) => h[q].investmentShare * 100,
    baseSd: 0.25,
    relativeSd: true,
  },
  export_share: {
    id: 'export_share',
    // customs count what crosses the border, so the volume is well observed
    trueValue: (h, q) => h[q].exportShare * 100,
    baseSd: 0.1,
    relativeSd: true,
  },
  fdi_inflows: {
    id: 'fdi_inflows',
    // Company returns and cross-border transactions are reconciled against
    // nominal GDP. Both numerator and denominator are quarterly here; their
    // ratio is the conventional annual FDI/GDP ratio without another ×4.
    trueValue: (h, q) => h[q].foreignDirectInvestmentShare * 100,
    baseSd: 0.12,
    relativeSd: true,
  },
  inflation: {
    id: 'inflation',
    trueValue: (h, q) => h[q].inflationQ * 4 * 100,
    baseSd: 3.0,
  },
  price_food: {
    id: 'price_food',
    trueValue: (h, q) => h[q].priceFood * 100,
    baseSd: 0.04,
    relativeSd: true,
    fastLag: true,
  },
  price_fuel: {
    id: 'price_fuel',
    trueValue: (h, q) => h[q].priceFuel * 100,
    baseSd: 0.04,
    relativeSd: true,
    fastLag: true,
  },
  unemployment: {
    id: 'unemployment',
    trueValue: (h, q) => h[q].unemployment * 100,
    baseSd: 2.0,
  },
  labor_force_participation: {
    id: 'labor_force_participation',
    trueValue: (h, q) => h[q].laborForceParticipation * 100,
    // The numerator comes from the same household returns as unemployment;
    // the census denominator is exact, so uncertainty is in percentage
    // points rather than proportional to the size of the population.
    baseSd: 1.5,
  },
  human_capital: {
    id: 'human_capital',
    trueValue: (h, q) => h[q].humanCapital * 100,
    // Completion records are reconciled against a labour-force sample. The
    // uncertainty is in index points, not proportional to how few skills a
    // country inherited.
    baseSd: 2.5,
  },
  payrolls: {
    id: 'payrolls',
    trueValue: (h, q) => h[q].payrolls,
    baseSd: 0.05,
    relativeSd: true,
  },
  capital_stock: {
    id: 'capital_stock',
    trueValue: (h, q) => h[q].capitalTotal,
    baseSd: 0.05,
    relativeSd: true,
  },
  technology_attainment: {
    id: 'technology_attainment',
    trueValue: (h, q) => h[q].technologyAttainment * 100,
    // Productivity accounts are model-heavy international comparisons: noisy
    // in points of frontier attainment, even when the factories are countable.
    baseSd: 3,
  },
  productivity: {
    // Output per worker, against this country's own 1946. The companion to
    // `technology_attainment`, and the one that carries the LEVEL: attainment
    // is a ratio to a moving frontier and saturates near 90 for anybody
    // running a decent research programme, which makes it silent about the
    // eighty years in which the economy tripled its output per head.
    //
    // Deliberately labour productivity and not TFP. A statistical office can
    // count output and count workers; TFP is a RESIDUAL from an assumed
    // production function, which is a thing this engine knows and an office
    // does not. Capital deepening is inside this number on purpose — the
    // player who built the capital stock did that too.
    id: 'productivity',
    trueValue: (h, q) =>
      h[0].labourProductivity > 1e-12
        ? (100 * h[q].labourProductivity) / h[0].labourProductivity
        : 100,
    // Two independently surveyed aggregates divided by each other, so the
    // error is roughly the sum of the accounts' and the labour survey's.
    baseSd: 0.06,
    relativeSd: true,
  },
  conf_consumer: {
    id: 'conf_consumer',
    trueValue: (h, q) => h[q].confConsumer * 100,
    baseSd: 5,
  },
  conf_business: {
    id: 'conf_business',
    trueValue: (h, q) => h[q].confBusiness * 100,
    baseSd: 5,
  },
  approval: {
    id: 'approval',
    trueValue: (h, q) => h[q].approvalIndex * 100,
    baseSd: 6,
  },
  gini: {
    id: 'gini',
    trueValue: (h, q) => h[q].gini * 100,
    baseSd: 3,
  },
  income_real: {
    // The LEVEL, against the 1946 household. This is the thing the Gini
    // beside it cannot say: a shape statistic reports the same 42 points for
    // a country three times richer than it was, so on its own it can neither
    // congratulate a good century nor condemn a wasted one.
    id: 'income_real',
    trueValue: (h, q) => (h[0].incomeMeanReal > 1e-12 ? (100 * h[q].incomeMeanReal) / h[0].incomeMeanReal : 100),
    baseSd: 0.05,
    relativeSd: true,
  },
  poverty_rate: {
    // The headcount is an absolute basic-needs measure. Unlike the Gini it
    // can fall when every household becomes richer without the distribution
    // changing; unlike the income index it says how many people were left
    // below the line.
    id: 'poverty_rate',
    trueValue: (h, q) => h[q].povertyRate * 100,
    // Proportional sampling error keeps a low poverty rate from printing
    // negative while remaining honest about a large poor population.
    baseSd: 0.08,
    relativeSd: true,
  },
  life_expectancy: {
    id: 'life_expectancy',
    trueValue: (h, q) => h[q].lifeExpectancy,
    // Life tables are estimates even when deaths are registered: small errors
    // in age-specific hazards accumulate over an entire synthetic lifetime.
    baseSd: 1.5,
  },
  human_development: {
    id: 'human_development',
    derivedFrom: HUMAN_DEVELOPMENT_COMPONENT_IDS,
  },
  net_migration: {
    id: 'net_migration',
    trueValue: (h, q) => h[q].netMigrationRate,
    // Border registers count entries and exits, but a weak office still has
    // informal crossings and delayed local returns to reconcile.
    baseSd: 1.5,
  },
  birth_rate: {
    id: 'birth_rate',
    trueValue: (h, q) => h[q].birthRate,
    baseSd: 2.5,
  },
  death_rate: {
    id: 'death_rate',
    trueValue: (h, q) => h[q].deathRate,
    baseSd: 2,
  },
  terms_of_trade: {
    id: 'terms_of_trade',
    trueValue: (h, q) => h[q].termsOfTrade,
    baseSd: 2.5,
  },
  asset_prices: {
    id: 'asset_prices',
    trueValue: (h, q) => h[q].assetPrice * 100,
    baseSd: 0.05,
    relativeSd: true,
    fastLag: true, // markets mark to market same-quarter
  },
  unrest: {
    id: 'unrest',
    trueValue: (h, q) => h[q].unrest * 100,
    baseSd: 12,
  },
  pollution: {
    // Indexed against the standard 1946 country, so 100 is "as dirty as a
    // 1946 economy" and the needle means the same thing in every country and
    // every decade. Relative noise: a monitoring service estimates a burden
    // proportionally, and an absolute band honest about a filthy century would
    // print a clean one negative.
    id: 'pollution',
    trueValue: (h, q) => h[q].pollution * 100,
    baseSd: 0.07,
    relativeSd: true,
  },
  credit_growth: {
    id: 'credit_growth',
    trueValue: (h, q) => {
      const prev = q > 0 ? h[q - 1].creditToGdp : h[q].creditToGdp
      return prev > 1e-9 ? (Math.pow(h[q].creditToGdp / prev, 4) - 1) * 100 : 0
    },
    baseSd: 4,
  },
  credit_to_gdp: {
    // the leverage LEVEL, in points of annual GDP. Relative noise: a
    // supervisor's count of loan books is proportionally uncertain, and an
    // absolute band wide enough for a 110%-of-GDP boom would swamp the 37%
    // a poor 1946 economy starts at.
    id: 'credit_to_gdp',
    trueValue: (h, q) => h[q].creditToGdp * 100,
    baseSd: 0.06,
    relativeSd: true,
  },
  bank_capital_ratio: {
    id: 'bank_capital_ratio',
    trueValue: (h, q) => h[q].bankCapitalRatio * 100,
    baseSd: 0.06,
    relativeSd: true,
  },
}
