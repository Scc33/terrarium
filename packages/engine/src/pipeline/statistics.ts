/**
 * Step 8 — statistics. The office measures the quarter, files the worksheet,
 * and releases whatever falls due: first prints after a lag, revisions at
 * +2 and +5 quarters. Noise draws come from `obs:*` substreams keyed by
 * (indicator, measured quarter, revision) — orthogonal to the economic RNG,
 * so the fog never perturbs the economy, only what anyone believes about it.
 * The office lives inside TrueState because its output is now causal:
 * politics reads these prints, not the truth (ADR-0003).
 *
 * What is measured lives next door in `indicatorSpecs.ts`; this file is how.
 */

import { publicAccountRecord } from '../state/accounts'
import { rngFor, type Seed } from '../rng/rng'
import {
  HOUSEHOLD_INCOME_SD,
  HOUSEHOLD_POVERTY_GAP_SD,
  HOUSEHOLD_SURVEY_FUNDED_AT,
  INDICATOR_FUNDED_AT,
  POVERTY_LINE_REAL,
  STAT_ERROR_BAND_CAPACITY_GATE,
  STAT_ERROR_BAND_Z,
  STAT_GDP_LEVEL_RELATIVE_SD,
  STAT_REVISION_DELAYS,
  STAT_REVISION_SETTLING_RATE,
} from '../constants'
import { conditionDispatches } from '../events/conditions'
import { clamp } from '../math'
import { humanDevelopmentDimensions, humanDevelopmentIndex } from '../humanDevelopment'
import {
  INCOME_QUINTILE_IDS,
  SECTOR_IDS,
  SPENDING_PROGRAM_IDS,
  STATUTE_IDS,
  type IndicatorId,
  type HouseholdSurveyPrint,
  type IncomeQuintileId,
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
  lifeExpectancyAtBirth,
  realConsumptionPerCapita,
  residence,
  sectorValueAdded,
  technologyAttainment,
  termsOfTrade,
  totalLaborForce,
} from './derive'
import { labourMarket } from './labourMarket'
import { industryPrintsDue } from './industrySurvey'
import { labourPrintsDue } from './labourSurvey'
import { lagFor, noiseScale, PUBLICATION_LAGS, REVISION_DELAYS } from './measurement'
import {
  HUMAN_DEVELOPMENT_COMPONENT_IDS,
  INDICATOR_SPECS,
  isDirectIndicatorSpec,
  type DirectIndicatorSpec,
  type HumanDevelopmentComponentId,
} from './indicatorSpecs'

function recordOf(state: TrueState): StatRecord {
  const { flows, sectors, gov, external, ledger, finance, institutions: inst } = state
  const population = state.demography.pyramid.reduce((s, n) => s + n, 0)
  const households = householdIncomeDistribution(state)
  const labour = labourMarket(state)
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
    labourMarket: labour.byClass,
    labourUnderuse: labour.underuse,
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
    lifeExpectancy: lifeExpectancyAtBirth(state),
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
    ...publicAccountRecord(state),
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
  spec: DirectIndicatorSpec,
  record: StatRecord[],
  publishedAt: number,
  seed: Seed,
  fullInstrumentation: boolean,
): StatPrint[] {
  const out: StatPrint[] = []
  for (let r = 0; r < REVISION_DELAYS.length; r++) {
    for (const lag of PUBLICATION_LAGS) {
      const q = publishedAt - lag - REVISION_DELAYS[r]
      if (q < 0 || q >= record.length) continue
      const cap = record[q].statCapacity
      // the survey didn't exist that quarter
      if (!fullInstrumentation && cap < INDICATOR_FUNDED_AT[spec.id]) continue
      if ((spec.fastLag ? 1 : lagFor(cap)) !== lag) continue
      const truth = spec.trueValue(record, q)
      const sd =
        spec.baseSd * (spec.relativeSd ? Math.abs(truth) : 1) * noiseScale(cap) * Math.pow(STAT_REVISION_SETTLING_RATE, r)
      const rng = rngFor(seed, `obs:${spec.id}:${q}:${r}`, 0)
      const print: StatPrint = {
        forQtr: q,
        publishedAt,
        value: truth + rng.normal(0, sd),
        revision: r,
        errorBand: cap >= STAT_ERROR_BAND_CAPACITY_GATE ? STAT_ERROR_BAND_Z * sd : 0,
      }
      if (spec.withLevels) {
        const relErr = 1 + rng.normal(0, STAT_GDP_LEVEL_RELATIVE_SD * noiseScale(cap) * Math.pow(STAT_REVISION_SETTLING_RATE, r))
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

interface AlignedDevelopmentPrints {
  life: StatPrint
  skills: StatPrint
  income: StatPrint
}

/** Series are append-only in publication-date order. Binary-search the first
 * release in one date's bucket, then walk only that bucket; a century archive
 * therefore costs O(log n + releases today), not O(n), each quarter. */
function printsPublishedAt(
  points: readonly StatPrint[],
  publishedAt: number,
): readonly StatPrint[] {
  let lo = 0
  let hi = points.length
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (points[mid].publishedAt < publishedAt) lo = mid + 1
    else hi = mid
  }
  let end = lo
  while (end < points.length && points[end].publishedAt === publishedAt) end++
  return points.slice(lo, end)
}

function alignedDevelopmentPrints(
  series: Partial<Record<IndicatorId, StatPrint[]>>,
  record: readonly Pick<StatRecord, 'statCapacity'>[],
  forQtr: number,
  revision: number,
): AlignedDevelopmentPrints | null {
  const cap = record[forQtr]?.statCapacity
  const revisionDelay = STAT_REVISION_DELAYS[revision]
  if (cap === undefined || revisionDelay === undefined) return null
  const find = (id: HumanDevelopmentComponentId) => {
    // The source spec decides the date on which an aligned component can
    // exist. The catalogue is keyed, so the spec is here and is direct by
    // construction — this used to be an indexed search past a runtime guard.
    const spec = INDICATOR_SPECS[id]
    const componentPublishedAt =
      forQtr + (spec.fastLag ? 1 : lagFor(cap)) + revisionDelay
    return printsPublishedAt(series[id] ?? [], componentPublishedAt).find(
      (print) => print.forQtr === forQtr && print.revision === revision,
    )
  }
  const life = find('life_expectancy')
  const skills = find('human_capital')
  const income = find('gdp_per_capita')
  return life && skills && income ? { life, skills, income } : null
}

function dimensionsForPrints(
  prints: AlignedDevelopmentPrints,
  direction: -1 | 0 | 1,
) {
  return humanDevelopmentDimensions({
    lifeExpectancy: prints.life.value + direction * prints.life.errorBand,
    workforceSkills: prints.skills.value + direction * prints.skills.errorBand,
    realGdpPerCapita: prints.income.value + direction * prints.income.errorBand,
  })
}

/**
 * Releases of Terrarium's Human Development Index dated `publishedAt`.
 *
 * This is intentionally a join over the office's RELEASES, not a fourth
 * `trueValue` specification. A candidate exists only when all three inputs
 * have the same reference quarter and revision, and when the office met the
 * composite's own funding gate in that reference quarter. Its value and band
 * are fully determined by those prints, with no `obs:human_development` RNG
 * stream. `fullInstrumentation` lifts this funding gate just as it does for a
 * direct indicator; it does not invent a component print that has not arrived.
 */
export function humanDevelopmentPrintsDue(
  series: Partial<Record<IndicatorId, StatPrint[]>>,
  record: readonly Pick<StatRecord, 'statCapacity'>[],
  publishedAt: number,
  fullInstrumentation: boolean,
): StatPrint[] {
  const candidates = new Map<string, { forQtr: number; revision: number }>()
  for (const id of HUMAN_DEVELOPMENT_COMPONENT_IDS) {
    for (const print of printsPublishedAt(series[id] ?? [], publishedAt)) {
      candidates.set(`${print.forQtr}:${print.revision}`, {
        forQtr: print.forQtr,
        revision: print.revision,
      })
    }
  }

  const existing = new Set(
    printsPublishedAt(series.human_development ?? [], publishedAt).map(
      (print) => `${print.forQtr}:${print.revision}`,
    ),
  )
  const out: StatPrint[] = []
  for (const [key, candidate] of candidates) {
    if (existing.has(key)) continue
    const cap = record[candidate.forQtr]?.statCapacity
    if (cap === undefined) continue
    if (!fullInstrumentation && cap < INDICATOR_FUNDED_AT.human_development) continue
    const aligned = alignedDevelopmentPrints(
      series,
      record,
      candidate.forQtr,
      candidate.revision,
    )
    if (!aligned) continue
    const components = dimensionsForPrints(aligned, 0)
    const value = humanDevelopmentIndex(components)
    const low = humanDevelopmentIndex(dimensionsForPrints(aligned, -1))
    const high = humanDevelopmentIndex(dimensionsForPrints(aligned, 1))
    out.push({
      forQtr: candidate.forQtr,
      publishedAt,
      revision: candidate.revision,
      value,
      errorBand: Math.max(value - low, high - value),
      components,
    })
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
    for (const lag of PUBLICATION_LAGS) {
      const q = publishedAt - lag - REVISION_DELAYS[r]
      if (q < 0 || q >= record.length) continue
      const cap = record[q].statCapacity
      if (!fullInstrumentation && cap < HOUSEHOLD_SURVEY_FUNDED_AT) continue
      if (lagFor(cap) !== lag) continue

      const settling = noiseScale(cap) * Math.pow(STAT_REVISION_SETTLING_RATE, r)
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
        incomeErrorBand: cap >= STAT_ERROR_BAND_CAPACITY_GATE ? STAT_ERROR_BAND_Z * incomeSd : 0,
        povertyGapErrorBand:
          cap >= STAT_ERROR_BAND_CAPACITY_GATE ? STAT_ERROR_BAND_Z * gapSd * Math.abs(record[q].povertyGap) : 0,
        incomeReal,
        incomeShare,
        povertyGap,
        povertyLine: 100 * POVERTY_LINE_REAL / baseline,
      })
    }
  }
  return out
}

/**
 * The rumour mill moved out (#160).
 *
 * It used to be a seven-rule table right here, each rule carrying two or
 * three interchangeable sentences, and the office filed the FIRST rule that
 * matched at a flat sixty per cent. That shape is why the wire read the same
 * in 1949 and 2043: the first matching rule is nearly always the same rule,
 * and nothing in it knew what decade it was.
 *
 * The rules now live in `events/conditions.ts`, the prose in
 * `events/catalogue.ts`, and the office simply asks the desk what it filed.
 * The sixty per cent survives as `NEWS_REPORT_P` — unreliability is the
 * point, and a wire that reports every true thing is an instrument rather
 * than a rumour.
 */

export const statistics: PipelineStep = {
  name: 'statistics',
  run(state) {
    const seed = state.meta.seed
    const record = [...state.stats.record, recordOf(state)]
    // releases dated t+1 are what lands on the desk as the next quarter opens
    const releaseDate = state.meta.tick + 1
    const series = { ...state.stats.series }
    for (const spec of Object.values(INDICATOR_SPECS)) {
      if (!isDirectIndicatorSpec(spec)) continue
      const due = printsDue(spec, record, releaseDate, seed, state.meta.rules.fullInstrumentation)
      if (due.length > 0) series[spec.id] = [...(series[spec.id] ?? []), ...due]
    }
    const developmentDue = humanDevelopmentPrintsDue(
      series,
      record,
      releaseDate,
      state.meta.rules.fullInstrumentation,
    )
    if (developmentDue.length > 0) {
      series.human_development = [
        ...(series.human_development ?? []),
        ...developmentDue,
      ]
    }
    const censusDue = industryPrintsDue(
      record,
      releaseDate,
      seed,
      state.meta.rules.fullInstrumentation,
    )
    const industry =
      censusDue.length > 0 ? [...state.stats.industry, ...censusDue] : state.stats.industry
    const labourDue = labourPrintsDue(
      record,
      releaseDate,
      seed,
      state.meta.rules.fullInstrumentation,
    )
    const labour =
      labourDue.length > 0 ? [...state.stats.labour, ...labourDue] : state.stats.labour
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
    // The desk reads the country AFTER the office has written this quarter's
    // worksheet, so a condition reports on the quarter it describes rather
    // than on the one before it.
    const filed = conditionDispatches(state, record)
    const news = filed.length > 0 ? [...state.stats.news, ...filed] : state.stats.news
    return { ...state, stats: { record, series, industry, labour, households, news } }
  },
}
