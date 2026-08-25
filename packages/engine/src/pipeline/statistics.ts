/**
 * Step 8 — statistics. The office measures the quarter, files the worksheet,
 * and releases whatever falls due: first prints after a lag, revisions at
 * +2 and +5 quarters. Noise draws come from `obs:*` substreams keyed by
 * (indicator, measured quarter, revision) — orthogonal to the economic RNG,
 * so the fog never perturbs the economy, only what anyone believes about it.
 * The office lives inside TrueState because its output is now causal:
 * politics reads these prints, not the truth (ADR-0003).
 */

import { rngFor, type Seed } from '../rng/rng'
import {
  HOUSEHOLD_INCOME_SD,
  HOUSEHOLD_POVERTY_GAP_SD,
  HOUSEHOLD_SURVEY_FUNDED_AT,
  INDICATOR_FUNDED_AT,
  INDUSTRY_CENSUS_FUNDED_AT,
  INDUSTRY_EMPLOYMENT_SD,
  INDUSTRY_VALUE_ADDED_SD,
  POVERTY_LINE_REAL,
} from '../constants'
import { clamp } from '../math'
import {
  INCOME_QUINTILE_IDS,
  INDUSTRY_TABLE_IDS,
  SECTOR_IDS,
  SPENDING_PROGRAM_IDS,
  STATUTE_IDS,
  type IndicatorId,
  type HouseholdSurveyPrint,
  type IncomeQuintileId,
  type IndustryPrint,
  type IndustryTableId,
  type NewsItem,
  type PolicyRecord,
  type SectorId,
  type StatPrint,
  type StatRecord,
  type TrueState,
} from '../state/schema'
import type { PipelineStep } from './pipeline'
import {
  approvalIndex,
  effectivePrice,
  householdIncomeDistribution,
  householdSavingRate,
  realConsumptionPerCapita,
  residence,
  sectorValueAdded,
  technologyAttainment,
  termsOfTrade,
  totalLaborForce,
} from './derive'

interface IndicatorSpec {
  id: IndicatorId
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

export const INDICATOR_SPECS: IndicatorSpec[] = [
  {
    id: 'gdp_growth',
    trueValue: (h, q) => {
      const prev = q > 0 ? h[q - 1].realGdp : h[q].realGdp
      return prev > 1e-9 ? (Math.pow(h[q].realGdp / prev, 4) - 1) * 100 : 0
    },
    baseSd: 2.5,
    withLevels: true,
  },
  {
    id: 'gdp_per_capita',
    trueValue: (h, q) => h[q].realGdpPerCapita,
    baseSd: 0.035,
    relativeSd: true,
  },
  {
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
  {
    id: 'consumption_per_capita',
    trueValue: (h, q) => h[q].realConsumptionPerCapita,
    baseSd: 0.05,
    relativeSd: true,
  },
  {
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
  {
    id: 'consumption_share',
    // the biggest component and the best surveyed: retail returns and the
    // household budget survey both bear on it
    trueValue: (h, q) => h[q].consumptionShare * 100,
    baseSd: 0.04,
    relativeSd: true,
  },
  {
    id: 'investment_share',
    // the hardest line in the accounts. Capital formation has to be inferred
    // from company returns and construction permits, and it is the component
    // that swings most between quarters, so a poor office guesses worst here.
    trueValue: (h, q) => h[q].investmentShare * 100,
    baseSd: 0.25,
    relativeSd: true,
  },
  {
    id: 'export_share',
    // customs count what crosses the border, so the volume is well observed
    trueValue: (h, q) => h[q].exportShare * 100,
    baseSd: 0.1,
    relativeSd: true,
  },
  {
    id: 'fdi_inflows',
    // Company returns and cross-border transactions are reconciled against
    // nominal GDP. Both numerator and denominator are quarterly here; their
    // ratio is the conventional annual FDI/GDP ratio without another ×4.
    trueValue: (h, q) => h[q].foreignDirectInvestmentShare * 100,
    baseSd: 0.12,
    relativeSd: true,
  },
  {
    id: 'inflation',
    trueValue: (h, q) => h[q].inflationQ * 4 * 100,
    baseSd: 3.0,
  },
  {
    id: 'price_food',
    trueValue: (h, q) => h[q].priceFood * 100,
    baseSd: 0.04,
    relativeSd: true,
    fastLag: true,
  },
  {
    id: 'price_fuel',
    trueValue: (h, q) => h[q].priceFuel * 100,
    baseSd: 0.04,
    relativeSd: true,
    fastLag: true,
  },
  {
    id: 'unemployment',
    trueValue: (h, q) => h[q].unemployment * 100,
    baseSd: 2.0,
  },
  {
    id: 'labor_force_participation',
    trueValue: (h, q) => h[q].laborForceParticipation * 100,
    // The numerator comes from the same household returns as unemployment;
    // the census denominator is exact, so uncertainty is in percentage
    // points rather than proportional to the size of the population.
    baseSd: 1.5,
  },
  {
    id: 'human_capital',
    trueValue: (h, q) => h[q].humanCapital * 100,
    // Completion records are reconciled against a labour-force sample. The
    // uncertainty is in index points, not proportional to how few skills a
    // country inherited.
    baseSd: 2.5,
  },
  {
    id: 'payrolls',
    trueValue: (h, q) => h[q].payrolls,
    baseSd: 0.05,
    relativeSd: true,
  },
  {
    id: 'capital_stock',
    trueValue: (h, q) => h[q].capitalTotal,
    baseSd: 0.05,
    relativeSd: true,
  },
  {
    id: 'technology_attainment',
    trueValue: (h, q) => h[q].technologyAttainment * 100,
    // Productivity accounts are model-heavy international comparisons: noisy
    // in points of frontier attainment, even when the factories are countable.
    baseSd: 3,
  },
  {
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
  {
    id: 'conf_consumer',
    trueValue: (h, q) => h[q].confConsumer * 100,
    baseSd: 5,
  },
  {
    id: 'conf_business',
    trueValue: (h, q) => h[q].confBusiness * 100,
    baseSd: 5,
  },
  {
    id: 'approval',
    trueValue: (h, q) => h[q].approvalIndex * 100,
    baseSd: 6,
  },
  {
    id: 'gini',
    trueValue: (h, q) => h[q].gini * 100,
    baseSd: 3,
  },
  {
    // The LEVEL, against the 1946 household. This is the thing the Gini
    // beside it cannot say: a shape statistic reports the same 42 points for
    // a country three times richer than it was, so on its own it can neither
    // congratulate a good century nor condemn a wasted one.
    id: 'income_real',
    trueValue: (h, q) => (h[0].incomeMeanReal > 1e-12 ? (100 * h[q].incomeMeanReal) / h[0].incomeMeanReal : 100),
    baseSd: 0.05,
    relativeSd: true,
  },
  {
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
  {
    id: 'net_migration',
    trueValue: (h, q) => h[q].netMigrationRate,
    // Border registers count entries and exits, but a weak office still has
    // informal crossings and delayed local returns to reconcile.
    baseSd: 1.5,
  },
  {
    id: 'birth_rate',
    trueValue: (h, q) => h[q].birthRate,
    baseSd: 2.5,
  },
  {
    id: 'death_rate',
    trueValue: (h, q) => h[q].deathRate,
    baseSd: 2,
  },
  {
    id: 'terms_of_trade',
    trueValue: (h, q) => h[q].termsOfTrade,
    baseSd: 2.5,
  },
  {
    id: 'asset_prices',
    trueValue: (h, q) => h[q].assetPrice * 100,
    baseSd: 0.05,
    relativeSd: true,
    fastLag: true, // markets mark to market same-quarter
  },
  {
    id: 'unrest',
    trueValue: (h, q) => h[q].unrest * 100,
    baseSd: 12,
  },
  {
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
  {
    id: 'credit_growth',
    trueValue: (h, q) => {
      const prev = q > 0 ? h[q - 1].creditToGdp : h[q].creditToGdp
      return prev > 1e-9 ? (Math.pow(h[q].creditToGdp / prev, 4) - 1) * 100 : 0
    },
    baseSd: 4,
  },
  {
    // the leverage LEVEL, in points of annual GDP. Relative noise: a
    // supervisor's count of loan books is proportionally uncertain, and an
    // absolute band wide enough for a 110%-of-GDP boom would swamp the 37%
    // a poor 1946 economy starts at.
    id: 'credit_to_gdp',
    trueValue: (h, q) => h[q].creditToGdp * 100,
    baseSd: 0.06,
    relativeSd: true,
  },
  {
    id: 'bank_capital_ratio',
    trueValue: (h, q) => h[q].bankCapitalRatio * 100,
    baseSd: 0.06,
    relativeSd: true,
  },
]

const REVISION_DELAYS = [0, 2, 5] // quarters after first publication
const LAGS = [1, 2]
const lagFor = (cap: number) => (cap >= 0.5 ? 1 : 2)
const noiseScale = (cap: number) => 1 - 0.85 * cap

function recordOf(state: TrueState): StatRecord {
  const { flows, sectors, gov, external, ledger, finance, institutions: inst } = state
  const population = state.demography.pyramid.reduce((s, n) => s + n, 0)
  const households = householdIncomeDistribution(state)
  // the expenditure side: four non-negative claims on one quarter's output.
  // Consumption and exports come from the sector demand vectors, capital
  // formation is public and private together, and what is left of the state's
  // demand after the works is its final consumption.
  const consumption = SECTOR_IDS.reduce((s, sid) => s + flows.householdDemand[sid], 0)
  const exports = SECTOR_IDS.reduce((s, sid) => s + flows.exportsReal[sid], 0)
  const governmentConsumption = flows.governmentDomesticDemandReal - flows.publicInvestmentReal
  const finalExpenditure = consumption + flows.investmentReal + governmentConsumption + exports
  const shareOf = (part: number) => (finalExpenditure > 1e-9 ? part / finalExpenditure : 0)
  return {
    tick: state.meta.tick,
    realGdp: flows.realGdp,
    nominalGdp: flows.nominalGdp,
    realGdpPerCapita: population > 1e-9 ? (4 * flows.realGdp) / population : 0,
    realConsumptionPerCapita: realConsumptionPerCapita(state),
    householdSavingRate: householdSavingRate(state),
    consumptionShare: shareOf(consumption),
    investmentShare: shareOf(flows.investmentReal),
    governmentShare: shareOf(governmentConsumption),
    exportShare: shareOf(exports),
    foreignDirectInvestmentShare:
      flows.foreignDirectInvestmentValue / Math.max(flows.nominalGdp, 1e-9),
    inflationQ: flows.inflationQ,
    unemployment: flows.unemployment,
    laborForceParticipation: population > 1e-9 ? totalLaborForce(state) / population : 0,
    humanCapital: state.demography.humanCapital,
    payrolls: sectors.reduce((s, x) => s + (x.id === 'agri' ? 0 : x.employment), 0),
    labourProductivity: (() => {
      const employed = sectors.reduce((s, x) => s + x.employment, 0)
      return employed > 1e-9 ? (4 * flows.realGdp) / employed : 0
    })(),
    capitalTotal: sectors.reduce((s, x) => s + x.capital, 0),
    industry: (() => {
      const valueAdded = sectorValueAdded(state)
      const out = {} as StatRecord['industry']
      for (let i = 0; i < SECTOR_IDS.length; i++) {
        out[SECTOR_IDS[i]] = {
          valueAdded: valueAdded[SECTOR_IDS[i]],
          employment: sectors[i].employment,
        }
      }
      return out
    })(),
    technologyAttainment: technologyAttainment(state),
    confConsumer: ledger.confidence.consumer,
    confBusiness: ledger.confidence.business,
    approvalIndex: approvalIndex(state),
    priceFood: effectivePrice(state, 'agri'),
    priceFuel: effectivePrice(state, 'energy'),
    gini: households.gini,
    incomeMeanReal: households.mean,
    povertyRate: households.povertyRate,
    povertyGap: households.povertyGap,
    incomeQuintileReal: { ...households.incomeQuintileReal },
    incomeQuintileShare: { ...households.incomeQuintileShare },
    birthRate: state.demography.crudeBirthRate,
    deathRate: state.demography.crudeDeathRate,
    netMigrationRate:
      population > 1e-9 ? (4000 * state.demography.netMigrationQ) / population : 0,
    population,
    pyramid: [...state.demography.pyramid],
    residence: residence(state),
    termsOfTrade: termsOfTrade(state),
    assetPrice: finance.assetPrice,
    creditToGdp: finance.creditToGdp,
    bankCapitalRatio: finance.bankCapital / Math.max(finance.creditOutstanding, 1e-9),
    pollution: state.environment.pollution,
    unrest: inst.unrest,
    statePower: inst.statePower,
    societalPower: inst.societalPower,
    statCapacity: gov.capacity.statistical,
    satisfiedAgri: flows.satisfied.agri,
    printedShare: flows.printedThisQtr / Math.max(flows.nominalGdp, 1e-9),
    reservesQtrs: external.reserves / Math.max(flows.tariffBase, 1e-9),
    utilization: sectors.reduce((s, x) => s + x.capacityUtilization, 0) / sectors.length,
    revenue: gov.budget.revenue,
    outlays: gov.budget.outlays,
    balance: gov.budget.balance,
    debt: gov.debt,
    reserves: external.reserves,
    revenueBySource: { ...flows.revenueBySource },
    outlaysByProgramme: { ...flows.outlaysByProgramme },
    policy: policyRecordOf(gov),
  }
}

/** The dials, frozen as this quarter found them. `statistics` runs after the
 * economy has spent them and before `resolveSpendingRules` redraws the
 * cheques for the next quarter, so what is filed here is what was actually in
 * force — including a `setDial` the player made this turn. */
function policyRecordOf(gov: TrueState['gov']): PolicyRecord {
  const subsidies = {} as Record<SectorId, number>
  for (const sid of SECTOR_IDS) subsidies[sid] = gov.dials.subsidies[sid] ?? 0
  const rules = {} as PolicyRecord['rules']
  for (const programme of SPENDING_PROGRAM_IDS) {
    const rule = gov.spendingRules[programme]
    rules[programme] = {
      mode: rule.kind,
      value: rule.kind === 'gdpShare' ? rule.share : rule.amount,
      votedAt: rule.votedAt,
    }
  }
  // The statute book, cloned so a later enactment cannot reach back into a
  // filed quarter. Levels and enactment quarters only: compliance is a
  // consequence and the minute book files decisions (ADR-0027).
  const statutes = {} as PolicyRecord['statutes']
  for (const id of STATUTE_IDS) statutes[id] = { ...gov.statutes[id] }
  // spread the dials rather than name them: a lever added to the cabinet is
  // recorded from the day it exists, with no second list to keep in step
  return {
    ...gov.dials,
    statutes,
    // These are the only nested dial records. Clone them explicitly rather
    // than asking structuredClone to discover that shape every quarter; the
    // spread above still makes a future top-level lever part of the record.
    taxRates: { ...gov.dials.taxRates },
    spending: { ...gov.dials.spending },
    subsidies,
    rules,
  }
}

/** Every print of this indicator whose release date is exactly `publishedAt`.
 * Candidates are enumerated backward: for each (revision, lag) the measured
 * quarter is fixed, and the lag frozen at measurement time must match.
 *
 * `fullInstrumentation` fits every survey whatever the office can afford. It
 * lifts the FUNDING gate and nothing else: the print is still lagged, still
 * noised by `noiseScale(cap)`, and still revised, because the rule is about
 * which instruments exist, not about how well a poor office measures. A
 * sandbox that also handed over exact figures would be the truth inspector
 * with extra steps, and the fog is what politics reads. */
function printsDue(
  spec: IndicatorSpec,
  record: StatRecord[],
  publishedAt: number,
  seed: Seed,
  fullInstrumentation: boolean,
): StatPrint[] {
  const out: StatPrint[] = []
  for (let r = 0; r < REVISION_DELAYS.length; r++) {
    for (const lag of LAGS) {
      const q = publishedAt - lag - REVISION_DELAYS[r]
      if (q < 0 || q >= record.length) continue
      const cap = record[q].statCapacity
      // the survey didn't exist that quarter
      if (!fullInstrumentation && cap < INDICATOR_FUNDED_AT[spec.id]) continue
      if ((spec.fastLag ? 1 : lagFor(cap)) !== lag) continue
      const truth = spec.trueValue(record, q)
      const sd =
        spec.baseSd * (spec.relativeSd ? Math.abs(truth) : 1) * noiseScale(cap) * Math.pow(0.45, r)
      const rng = rngFor(seed, `obs:${spec.id}:${q}:${r}`, 0)
      const print: StatPrint = {
        forQtr: q,
        publishedAt,
        value: truth + rng.normal(0, sd),
        revision: r,
        errorBand: cap >= 0.45 ? 1.96 * sd : 0,
      }
      if (spec.withLevels) {
        const relErr = 1 + rng.normal(0, 0.03 * noiseScale(cap) * Math.pow(0.45, r))
        print.levels = {
          real: record[q].realGdp * relErr,
          nominal: record[q].nominalGdp * relErr,
        }
      }
      out.push(print)
    }
  }
  return out
}

/** The noise on each of the census's two tables, as a fraction of the figure
 * at zero capacity. A total `Record` over the table ids, and the ONLY place
 * either number is read: the wobble the office applies and the band it
 * confesses come from this one entry, in the same loop iteration, so they
 * cannot drift into two different accounts of how well it measured. (The same
 * rule `politicalCostOfAction` keeps for a quote and its charge.) */
const INDUSTRY_SD: Record<IndustryTableId, number> = {
  valueAdded: INDUSTRY_VALUE_ADDED_SD,
  employment: INDUSTRY_EMPLOYMENT_SD,
}

/**
 * The industrial census's releases dated `publishedAt` — the same clock,
 * funding gate, lag and revision schedule the indicators run on, applied to a
 * vector instead of a scalar.
 *
 * It deliberately reuses `lagFor` and `noiseScale` rather than owning a
 * second measurement model: this is the same office, and an industry survey
 * that got sharper faster than the accounts it has to reconcile with would be
 * a statement about the fog nobody meant to make. What it does NOT reuse is
 * `IndicatorSpec`, because a spec is a scalar with a dial face and this has
 * neither (see `IndustryPrint`).
 *
 * Each industry gets an INDEPENDENT draw, which is why the published parts do
 * not sum to the published GDP. That is the office confessing its method, not
 * a bug: the
 * office is estimating five things, not dividing one thing five ways. The
 * two tables draw from separate substreams so that adding a third column
 * later cannot shift the census a century of saves already published.
 */
function industryPrintsDue(
  record: StatRecord[],
  publishedAt: number,
  seed: Seed,
  fullInstrumentation: boolean,
): IndustryPrint[] {
  const out: IndustryPrint[] = []
  for (let r = 0; r < REVISION_DELAYS.length; r++) {
    for (const lag of LAGS) {
      const q = publishedAt - lag - REVISION_DELAYS[r]
      if (q < 0 || q >= record.length) continue
      const cap = record[q].statCapacity
      if (!fullInstrumentation && cap < INDUSTRY_CENSUS_FUNDED_AT) continue
      if (lagFor(cap) !== lag) continue
      const settling = noiseScale(cap) * Math.pow(0.45, r)
      const truth = record[q].industry
      const tables = {} as Record<IndustryTableId, Record<SectorId, number>>
      const errorBand = {} as IndustryPrint['errorBand']
      for (const table of INDUSTRY_TABLE_IDS) {
        const sd = INDUSTRY_SD[table] * settling
        const rng = rngFor(seed, `obs:industry:${table}:${q}:${r}`, 0)
        const figures = {} as Record<SectorId, number>
        for (const sid of SECTOR_IDS) {
          // A negative industry is not a thing a census can report, and a
          // negative wedge cannot be drawn at all (`donutSlices` drops it).
          // The floor bites only where the truth is already near zero.
          figures[sid] = Math.max(0, truth[sid][table] * (1 + rng.normal(0, sd)))
        }
        tables[table] = figures
        // the same threshold the indicators confess a band at, and relative
        // for the same reason the noise is
        errorBand[table] = cap >= 0.45 ? 1.96 * sd : 0
      }
      out.push({
        forQtr: q,
        publishedAt,
        revision: r,
        errorBand,
        valueAdded: tables.valueAdded,
        employment: tables.employment,
      })
    }
  }
  return out
}

/**
 * Household-budget survey releases. The office estimates five ranked real
 * incomes, then reconciles their shares from that same set of estimates. That
 * keeps the shares at exactly 100% and the quintile means ordered even though
 * each underlying return carries independent sampling error.
 */
function householdPrintsDue(
  record: StatRecord[],
  publishedAt: number,
  seed: Seed,
  fullInstrumentation: boolean,
): HouseholdSurveyPrint[] {
  const out: HouseholdSurveyPrint[] = []
  for (let r = 0; r < REVISION_DELAYS.length; r++) {
    for (const lag of LAGS) {
      const q = publishedAt - lag - REVISION_DELAYS[r]
      if (q < 0 || q >= record.length) continue
      const cap = record[q].statCapacity
      if (!fullInstrumentation && cap < HOUSEHOLD_SURVEY_FUNDED_AT) continue
      if (lagFor(cap) !== lag) continue

      const settling = noiseScale(cap) * Math.pow(0.45, r)
      const incomeSd = HOUSEHOLD_INCOME_SD * settling
      const gapSd = HOUSEHOLD_POVERTY_GAP_SD * settling
      const measuredIncome = INCOME_QUINTILE_IDS.map((id) => {
        const rng = rngFor(seed, `obs:households:income:${id}:${q}:${r}`, 0)
        return Math.max(0, record[q].incomeQuintileReal[id] * (1 + rng.normal(0, incomeSd)))
      }).sort((a, b) => a - b)
      const measuredTotal = measuredIncome.reduce((sum, value) => sum + value, 0)
      const baseline = Math.max(record[0].incomeMeanReal, 1e-9)
      const incomeReal = {} as Record<IncomeQuintileId, number>
      const incomeShare = {} as Record<IncomeQuintileId, number>
      for (let i = 0; i < INCOME_QUINTILE_IDS.length; i++) {
        const id = INCOME_QUINTILE_IDS[i]
        incomeReal[id] = 100 * measuredIncome[i] / baseline
        incomeShare[id] = measuredTotal > 1e-9 ? measuredIncome[i] / measuredTotal : 0
      }

      const gapRng = rngFor(seed, `obs:households:poverty-gap:${q}:${r}`, 0)
      const povertyGap = clamp(
        record[q].povertyGap * (1 + gapRng.normal(0, gapSd)),
        0,
        1,
      )
      out.push({
        forQtr: q,
        publishedAt,
        revision: r,
        incomeErrorBand: cap >= 0.45 ? 1.96 * incomeSd : 0,
        povertyGapErrorBand:
          cap >= 0.45 ? 1.96 * gapSd * Math.abs(record[q].povertyGap) : 0,
        incomeReal,
        incomeShare,
        povertyGap,
        povertyLine: 100 * POVERTY_LINE_REAL / baseline,
      })
    }
  }
  return out
}

const NEWS_RULES: Array<{
  when(s: StatRecord): boolean
  tone: NewsItem['tone']
  texts: string[]
}> = [
  {
    when: (s) => s.satisfiedAgri < 0.93,
    tone: 'bad',
    texts: [
      'Bread queues reported in the capital.',
      'Grain merchants say the warehouses are thin.',
      'Provincial papers report empty market stalls.',
    ],
  },
  {
    when: (s) => s.inflationQ * 4 > 0.12,
    tone: 'bad',
    texts: [
      'Shopkeepers are repricing goods by the week.',
      'Housewives protest the cost of the market basket.',
      'Wage earners say pay packets no longer stretch.',
    ],
  },
  {
    when: (s) => s.unemployment > 0.12,
    tone: 'bad',
    texts: [
      'Idle men gather at the factory gates.',
      'The unions demand public works.',
      'Provincial governors report men riding the rails for work.',
    ],
  },
  {
    when: (s) => s.printedShare > 0.005,
    tone: 'bad',
    texts: [
      'Bank clerks whisper that the mint is running hot.',
      'The treasury bill auction found few takers, dealers say.',
    ],
  },
  {
    when: (s) => s.reservesQtrs < 0.7,
    tone: 'bad',
    texts: [
      'Importers scramble for foreign exchange.',
      'The central bank is said to be counting its gold twice.',
    ],
  },
  {
    // the street needs no statistical office to be visible from a window
    when: (s) => s.unrest > 0.5,
    tone: 'bad',
    texts: [
      'Students and strikers march on the ministries.',
      'The gendarmerie asks for reinforcements it does not have.',
      'Pamphlets circulate in the provinces that no censor has seen.',
    ],
  },
  {
    when: (s) => s.utilization > 0.97,
    tone: 'neutral',
    texts: [
      'Factories report order books full to year’s end.',
      'Employers complain they cannot find hands.',
    ],
  },
  {
    when: (s) => s.inflationQ * 4 < 0.005 && s.unemployment < 0.08 && s.utilization > 0.8,
    tone: 'good',
    texts: [
      'Steady trade and quiet prices, the merchants report.',
      'The chamber of commerce calls conditions satisfactory.',
    ],
  },
]

/** The rumor mill: unreliable — real conditions surface ~60% of the time,
 * and one rumor per quarter is plenty. */
function rumorFor(snap: StatRecord, seed: Seed): NewsItem | null {
  const rng = rngFor(seed, 'obs:news', snap.tick)
  for (const rule of NEWS_RULES) {
    if (rule.when(snap) && rng.next() < 0.6) {
      return {
        tick: snap.tick,
        text: rule.texts[Math.floor(rng.next() * rule.texts.length)],
        tone: rule.tone,
        kind: 'rumor',
      }
    }
  }
  return null
}

export const statistics: PipelineStep = {
  name: 'statistics',
  run(state) {
    const seed = state.meta.seed
    const record = [...state.stats.record, recordOf(state)]
    // releases dated t+1 are what lands on the desk as the next quarter opens
    const releaseDate = state.meta.tick + 1
    const series = { ...state.stats.series }
    for (const spec of INDICATOR_SPECS) {
      const due = printsDue(spec, record, releaseDate, seed, state.meta.rules.fullInstrumentation)
      if (due.length > 0) series[spec.id] = [...(series[spec.id] ?? []), ...due]
    }
    const censusDue = industryPrintsDue(
      record,
      releaseDate,
      seed,
      state.meta.rules.fullInstrumentation,
    )
    const industry =
      censusDue.length > 0 ? [...state.stats.industry, ...censusDue] : state.stats.industry
    const householdDue = householdPrintsDue(
      record,
      releaseDate,
      seed,
      state.meta.rules.fullInstrumentation,
    )
    const households =
      householdDue.length > 0
        ? [...state.stats.households, ...householdDue]
        : state.stats.households
    const rumor = rumorFor(record[record.length - 1], seed)
    const news = rumor ? [...state.stats.news, rumor] : state.stats.news
    return { ...state, stats: { record, series, industry, households, news } }
  },
}
