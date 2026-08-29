/**
 * Country generation. A country is a parameter vector (ADR-0011);
 * init() calibrates a TrueState from it so the economy starts near
 * equilibrium — tfp is solved from target outputs rather than guessed, so
 * tick 1 doesn't open with a shock.
 */

import type { Seed } from '../rng/rng'
import { emissionsPerHead } from '../pipeline/environment'
import {
  adminEffectiveness,
  taxEfficiency,
  ASSET_PURCHASE_RATE_DEFAULT,
  BANK_TARGET_RATIO,
  CAPITAL_REQUIREMENT_DEFAULT,
  CONF_NEUTRAL,
  CREDIT_BASE,
  DEBT_TO_GDP_1946,
  CAPITAL_ELASTICITY,
  CONSUMPTION_WEIGHTS,
  IO_COEFF,
  LABOR_ELASTICITY,
  LABOR_SHARE,
  LABOR_SOURCE,
  PC_START,
  BOND_HOLDING,
  PROFIT_SHARE,
  RESERVES_INIT_QTRS,
  IMPORT_BASE_SHARE,
  TATONNEMENT,
  TRANSFER_SHARE,
  UTILIZATION_AT_INIT,
} from '../constants'
import { sectorRecord } from '../math'
import {
  AGE_BANDS,
  COHORT_IDS,
  ELECTION_PERIOD,
  ENGINE_VERSION,
  PARTNER_IDS,
  RETIREMENT_BAND,
  SCHEMA_VERSION,
  SECTOR_IDS,
  STATUTE_IDS,
  WORKING_BANDS,
  WORKING_CLASS_IDS,
  appointmentTick,
  gameRules,
  type Cohort,
  type CountryParams,
  type DemographyState,
  type GameMode,
  type GameRules,
  type Qtr,
  type SectorId,
  type StatuteBook,
  type TickFlows,
  type TrueState,
} from './schema'
import {
  BASE_WORKER_SHARE,
  EDUCATION_1946,
  IMMIGRATION_LIMIT_DEFAULT,
  FERT_MAX,
  FDI_OPENING_OWNERSHIP_BASE,
  FDI_PROFIT_REMIT_SHARE,
  TECH_ATTAINED_BASE,
  TECH_ATTAINED_DEV_GAIN,
  fdiStructuralAttraction,
} from '../constants'
import { vitalRates } from '../pipeline/demography'
import { initialInstitutions } from '../pipeline/institutions'
import { validateCountryParams } from '../countries'

// baseline gross outputs / employment / capital for a 27.5M-person country
// at development 0.35 (a mid-poor 1946 economy)
const BASE_GROSS: Record<SectorId, number> = { agri: 30, manuf: 25, energy: 12, services: 28, transport: 10 }
const BASE_EMPLOYMENT: Record<SectorId, number> = { agri: 5.4, manuf: 2.7, energy: 0.35, services: 2.7, transport: 0.75 }
const BASE_CAPITAL: Record<SectorId, number> = { agri: 40, manuf: 60, energy: 30, services: 35, transport: 20 }
const BASE_POP = 27.5
const BASE_DEVELOPMENT = 0.35

/** The standard 1946 pyramid for a 27.5M mid-poor country: young and broad
 * (35% under 15), thinning fast past 60. Bands sum to BASE_POP; 60+ sums to
 * 3.0 (the standard retiree class). */
const PYRAMID_1946 = [
  3.6, 3.2, 2.8, // 0–14
  2.45, 2.2, 1.95, 1.75, 1.55, 1.4, 1.3, 1.2, 1.1, // 15–59
  1.05, 0.85, 0.6, 0.35, 0.15, // 60+
]

/** Synthesize a 1946-shaped pyramid consistent with class sizes: the
 * standard shape, rescaled so the non-retired bands sum to the working
 * classes and the 60+ bands to the retiree class. Also the lenient path for
 * older saves whose params carry no pyramid. */
export function synthPyramid(cohortSizes: CountryParams['cohortSizes']): number[] {
  const retired = cohortSizes.retirees
  const nonRetired =
    cohortSizes.rural_workers +
    cohortSizes.urban_workers +
    cohortSizes.professionals +
    cohortSizes.business_owners
  const baseNonRetired = PYRAMID_1946.slice(0, RETIREMENT_BAND).reduce((a, b) => a + b, 0)
  const baseRetired = PYRAMID_1946.slice(RETIREMENT_BAND).reduce((a, b) => a + b, 0)
  return PYRAMID_1946.map((n, i) =>
    i < RETIREMENT_BAND ? (n * nonRetired) / baseNonRetired : (n * retired) / baseRetired,
  )
}

function initialDemography(params: CountryParams): DemographyState {
  const pyramid =
    params.pyramid && params.pyramid.length === AGE_BANDS
      ? [...params.pyramid]
      : synthPyramid(params.cohortSizes)
  const nonRetired = pyramid.slice(0, RETIREMENT_BAND).reduce((a, b) => a + b, 0)
  const workingAge = pyramid
    .slice(WORKING_BANDS[0], WORKING_BANDS[1] + 1)
    .reduce((a, b) => a + b, 0)
  const classTotal = WORKING_CLASS_IDS.reduce((s, id) => s + params.cohortSizes[id], 0)
  const classShares = Object.fromEntries(
    WORKING_CLASS_IDS.map((id) => [id, params.cohortSizes[id] / Math.max(classTotal, 1e-9)]),
  ) as DemographyState['classShares']
  const { crudeBirthRate, crudeDeathRate } = vitalRates(pyramid, FERT_MAX, 1)
  return {
    pyramid,
    tfr: FERT_MAX,
    mortalityIndex: 1,
    netMigrationQ: 0,
    migrationBaselineWelfare: null,
    crudeBirthRate,
    crudeDeathRate,
    workerShareMult: nonRetired > 1e-9 ? workingAge / nonRetired / BASE_WORKER_SHARE : 1,
    // The opening workforce inherits the schooling system encoded by the
    // country recipe. From quarter one the people and the institution become
    // separate stocks: schools can be built quickly; skills cannot.
    humanCapital:
      (params.capacities.education as number | undefined) ?? EDUCATION_1946,
    classShares,
    // The pair the professional ceiling is a ratio to. Read off the recipe
    // rather than a constant, so opening a country gives back that country:
    // at the opening school system the ceiling IS the opening share, and the
    // second leg of the class transition contributes nothing until the
    // government schools somebody.
    professionalBaseline: classShares.professionals,
    schoolingBaseline:
      (params.capacities.education as number | undefined) ?? EDUCATION_1946,
  }
}

/** Reweight a standard sector vector while preserving its aggregate. The
 * country changes shape here, not scale — population and development remain
 * the sole owners of scale. The no-structure branch stays bit-identical to
 * schema 12 for old saves and Meridia's golden baseline. */
function reweight(
  base: Record<SectorId, number>,
  mix: Record<SectorId, number> | undefined,
): Record<SectorId, number> {
  if (!mix) return base
  // A uniform mix means "no reweighting", and it has to be an EXACT identity,
  // not an arithmetic one: `base * before / after` with `before === after` is
  // mathematically x but numerically x ± 1 ulp, and a country editor that
  // writes an implicit opening down explicitly (`materializeStructure`) sends
  // exactly this vector. One ulp of employment compounds into a visibly
  // different century, so a country would stop being itself the moment someone
  // opened it as a draft. Non-uniform mixes are untouched.
  if (SECTOR_IDS.every((id) => mix[id] === 1)) return base
  const before = SECTOR_IDS.reduce((sum, id) => sum + base[id], 0)
  const weighted = sectorRecord((id) => base[id] * mix[id])
  const after = SECTOR_IDS.reduce((sum, id) => sum + weighted[id], 0)
  return sectorRecord((id) => (weighted[id] * before) / Math.max(after, 1e-9))
}

export function init(
  params: CountryParams,
  seed: Seed,
  rules: GameMode | Partial<GameRules> = 'standard',
  appointedAt: Qtr = 0,
): TrueState {
  validateCountryParams(params)
  const totalPop = Object.values(params.cohortSizes).reduce((a, b) => a + b, 0)
  const popScale = totalPop / BASE_POP
  const devScale = params.development / BASE_DEVELOPMENT

  // targets scaled by population; development scales productivity (via solved tfp)
  const gross = reweight(
    sectorRecord((id) => BASE_GROSS[id] * popScale * devScale),
    params.structure?.outputMix,
  )
  const employment = reweight(
    sectorRecord((id) => BASE_EMPLOYMENT[id] * popScale),
    params.structure?.employmentMix,
  )
  const capital = reweight(
    sectorRecord((id) => BASE_CAPITAL[id] * popScale * devScale),
    params.structure?.capitalMix,
  )

  // solve tfp so potential output = target / initial utilization
  const tfp = sectorRecord(
    (id) =>
      gross[id] /
      UTILIZATION_AT_INIT /
      (Math.pow(capital[id], CAPITAL_ELASTICITY) * Math.pow(employment[id], LABOR_ELASTICITY)),
  )

  // value added per sector at unit prices; wages from the labor share
  const colSum = sectorRecord((_, j) => IO_COEFF.reduce((s, row) => s + row[j], 0))
  const valueAdded = sectorRecord((id) => gross[id] * (1 - colSum[id]))
  const wages = sectorRecord((id) => (LABOR_SHARE * valueAdded[id]) / employment[id])
  const gdp0 = SECTOR_IDS.reduce((s, id) => s + valueAdded[id], 0)

  // the banking system opens in equilibrium: credit at its steady-state share
  // of annual GDP, spread across sectors by capital, banks capitalized to
  // their target so no crunch and no boom until policy or the world moves it
  const annualGdp0 = 4 * gdp0
  const creditToGdp0 = params.structure?.creditToGdp ?? CREDIT_BASE
  const creditOutstanding0 = creditToGdp0 * annualGdp0
  const capitalTotal0 = SECTOR_IDS.reduce((s, id) => s + capital[id], 0)

  // the government starts spending what its narrow tax base actually
  // covers: estimate quarter-one revenue with the same formulas the fiscal
  // step uses, net out interest, and allocate the rest across the dials —
  // an unbalanced opening budget compounds into a scripted depression
  const adminEff = adminEffectiveness(params.capacities.administrative)
  const taxEff = taxEfficiency(params.capacities.tax)
  const importsValue = SECTOR_IDS.reduce(
    (s, id) => s + IMPORT_BASE_SHARE[id] * (gross[id] / UTILIZATION_AT_INIT) * params.openness,
    0,
  )
  const wageBill0 = SECTOR_IDS.reduce((s, id) => s + wages[id] * employment[id], 0)
  const profits0 = (1 - LABOR_SHARE) * gdp0
  const revenue0 =
    wageBill0 * 0.15 * taxEff +
    profits0 * 0.2 * taxEff +
    importsValue * 0.1 * (0.5 + 0.5 * params.capacities.tax)
  const debtToGdp0 = params.structure?.debtToGdp ?? DEBT_TO_GDP_1946
  const debt0 = debtToGdp0 * gdp0 * 4
  const interest0 = (debt0 * 0.04) / 4
  // a small structural deficit is period-realistic and sustainable
  const grossBudget0 = Math.max(0, 1.05 * revenue0 - interest0)
  const spendingDials = {
    transfers: 0.36 * grossBudget0,
    procurement: 0.39 * grossBudget0,
    investment: 0.25 * grossBudget0,
    // Research is a policy choice rather than a hidden passive growth subsidy.
    // Leaving it at zero keeps the inherited economy on the historical track.
    research: 0,
  }
  const transfersDelivered = spendingDials.transfers * adminEff

  const demography = initialDemography(params)
  const openingPopulation = demography.pyramid.reduce((sum, people) => sum + people, 0)
  const foreignOwnedCapital0 =
    capitalTotal0 *
    Math.min(
      0.3,
      FDI_OPENING_OWNERSHIP_BASE *
        fdiStructuralAttraction(openingPopulation, params.development, params.openness),
    )

  // Profits, and the slice of them that leaves the country. `production`
  // computes this from the inherited foreign ownership on the very first tick
  // and `cohorts.run` subtracts it before distributing, so a seed that handed
  // households the whole pot would walk down one more basis change.
  const profitTotal = (1 - LABOR_SHARE) * gdp0
  const remittances0 =
    FDI_PROFIT_REMIT_SHARE *
    Math.min(1, foreignOwnedCapital0 / Math.max(capitalTotal0, 1e-9)) *
    profitTotal *
    (1 - 0.2 * taxEff)

  // cohort employment from the staffing matrix
  const cohorts: Cohort[] = COHORT_IDS.map((cid) => {
    const employedIn: Cohort['employedIn'] = {}
    let wageIncome = 0
    for (const sid of SECTOR_IDS) {
      const share = LABOR_SOURCE[sid][cid] ?? 0
      if (share > 0) {
        const workers = employment[sid] * share
        employedIn[sid] = workers
        wageIncome += workers * wages[sid]
      }
    }
    // Capital income on the SAME BASIS `cohorts.run` recomputes it: profits
    // net of corporate tax, plus the coupon on the inherited debt. Seeded
    // gross and coupon-less, the treasury booked the corporate tax as revenue
    // AND the household booked it as income, and the bondholders' interest
    // simply did not exist for one quarter — so the habit was 5-10% too high
    // for business owners and 8-28% too LOW for retirees, who hold paper and
    // earn no wages. Opposite signs, same bug as the wage leg below.
    const profitIncome =
      (profitTotal * (1 - 0.2 * taxEff) - remittances0) * PROFIT_SHARE[cid] +
      interest0 * BOND_HOLDING[cid]
    const size = params.cohortSizes[cid]
    // The habitual standard of living, and every leg of it must be seeded on
    // the SAME BASIS `cohorts.run` recomputes it on — wages after income tax,
    // profits after corporate tax, plus the coupon — or the EMA spends its
    // first years walking to a basis change rather than reacting to the
    // economy. Each leg was wrong in a different direction and for a different
    // cohort, which is why one is not enough: gross wages cost the wage
    // earners 3-9%, gross profits gave business owners 5-10% they never got,
    // and the missing coupon took 8-28% from retirees, who hold paper and earn
    // no wages. `engelReference` is sealed from this, so a biased seed tips
    // that cohort's basket permanently (ADR-0030) — and `growth` below reads
    // it through the loss-aversion multiplier, which is what the 0.99 is for.
    const incomeAfterTax =
      wageIncome * (1 - 0.15 * taxEff) +
      profitIncome +
      transfersDelivered * TRANSFER_SHARE[cid]
    // Opening wealth is a multiple of what the household actually has to live
    // on, so it reads the SAME disposable figure — a hybrid of gross wages and
    // net profits would recalibrate the war-bond inheritance for one cohort and
    // not another, and `SAVINGS_DRAWDOWN` spends it from the first quarter.
    const savings = incomeAfterTax * (cid === 'retirees' ? 8 : 1)
    const lastRealIncome = incomeAfterTax * 0.99
    return {
      id: cid,
      size,
      employedIn,
      wageIncome,
      transferIncome: transfersDelivered * TRANSFER_SHARE[cid],
      profitIncome,
      savings, // retirees hold war bonds

      consumptionWeights: { ...CONSUMPTION_WEIGHTS[cid] },
      // Sealed from the SAME expression the Engel shift reads each quarter —
      // disposable income per head, and WITHOUT the 0.99 above. That discount
      // is a deliberate bias for one reader, the loss-aversion multiplier, and
      // it must not reach these two: `cohorts.run` moves `engelIncome` toward
      // the undiscounted truth while the reference would have stayed
      // discounted, so the ratio converged on 1/0.99 and every basket drifted
      // ~1% toward luxuries on a stationary economy that had earned nothing.
      // Both fields take the same value, so the opening ratio is still exactly
      // 1; prices open at 1 and the fuel dial at 0, so the price half is
      // neutral too, and every country starts on the recipe it was written
      // with.
      engelReference: incomeAfterTax / Math.max(size, 1e-9),
      engelIncome: incomeAfterTax / Math.max(size, 1e-9),
      approval: 0.55, // a modest honeymoon
      enfranchisement: params.enfranchisement[cid],
      lastRealIncome,
      lastCpi: 1,
    }
  })

  const flows: TickFlows = {
    finalDemand: sectorRecord(() => 0),
    grossDemand: { ...gross },
    satisfied: sectorRecord(() => 1),
    exportsReal: sectorRecord(() => 0),
    importsReal: sectorRecord(() => 0),
    profits: sectorRecord((id) => (1 - LABOR_SHARE) * valueAdded[id]),
    householdDemand: sectorRecord(() => 0),
    cohortSpend: Object.fromEntries(COHORT_IDS.map((c) => [c, 0])) as Record<
      (typeof COHORT_IDS)[number],
      number
    >,
    investmentReal: 0,
    foreignDirectInvestmentReal: 0,
    foreignDirectInvestmentValue: 0,
    foreignProfitRemittances: 0,
    publicInvestmentReal: 0,
    privateDomesticDemandReal: 0,
    governmentDomesticDemandReal: 0,
    tariffBase: 0,
    subsidyDelivered: sectorRecord(() => 0),
    revenueBySource: { income: 0, corporate: 0, tariff: 0, fuel: 0 },
    outlaysByProgramme: {
      transfers: 0,
      procurement: 0,
      investment: 0,
      research: 0,
      subsidies: 0,
      capacity: 0,
      interest: interest0,
    },
    debtInterest: interest0,
    debtPrincipal: 0,
    nominalGdp: gdp0,
    realGdp: gdp0,
    inflationQ: 0,
    unemployment: 0.07,
    printedThisQtr: 0,
  }


  // the constitution is opened last, against the economy this function just
  // built — bloc power is read off agriculture's share, the credit stock and
  // the debt, so it must not be guessed before those exist
  const provisional: TrueState = {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      engineVersion: ENGINE_VERSION,
      tick: 0,
      seed,
      rules: gameRules(rules),
      // clamped, never trusted: this is the door a hand-edited save comes
      // through, and quarter 900 would open a game whose player never arrives
      appointedAt: appointmentTick(appointedAt),
    },
    params,
    demography,
    tech: {
      frontier: 1,
      // development buys position: the gap to the 1946 frontier is open from
      // quarter one, so catch-up is immediately available to whoever can absorb
      attained: sectorRecord(
        () => TECH_ATTAINED_BASE + TECH_ATTAINED_DEV_GAIN * params.development,
      ),
      tfpGrowthQ: 0,
      // 1946 opens with no research appropriation at all, so there is no base
      // to inherit and nothing to calibrate here — the stock is whatever the
      // player builds
      researchStock: 0,
    },
    cohorts,
    finance: {
      assetPrice: 1,
      bankCapital: BANK_TARGET_RATIO * creditOutstanding0,
      creditOutstanding: creditOutstanding0,
      creditToGdp: creditToGdp0,
      creditGrowth: 0,
      crisisQtrsLeft: 0,
      crisisSeverity: 0,
    },
    sectors: SECTOR_IDS.map((id) => ({
      id,
      capital: capital[id],
      tfp: tfp[id],
      employment: employment[id],
      output: gross[id],
      capacityUtilization: UTILIZATION_AT_INIT,
      inventory: 0,
      credit: (creditOutstanding0 * capital[id]) / Math.max(capitalTotal0, 1e-9),
    })),
    io: { coeff: IO_COEFF.map((row) => [...row]) },
    market: {
      prices: sectorRecord(() => 1),
      wages,
      excessDemand: sectorRecord(() => 0),
      tatonnement: { ...TATONNEMENT },
    },
    gov: {
      dials: {
        taxRates: { income: 0.15, corporate: 0.2, tariff: 0.1, fuel: 0 },
        spending: spendingDials,
        immigrationLimit: IMMIGRATION_LIMIT_DEFAULT,
        policyRate: 0.04,
        assetPurchaseRate: ASSET_PURCHASE_RATE_DEFAULT,
        capitalRequirement: CAPITAL_REQUIREMENT_DEFAULT,
        subsidies: {},
      },
      // the 1946 settlement: voted at quarter zero, by someone else
      spendingRules: {
        transfers: { kind: 'fixed', amount: spendingDials.transfers, votedAt: 0 },
        procurement: { kind: 'fixed', amount: spendingDials.procurement, votedAt: 0 },
        investment: { kind: 'fixed', amount: spendingDials.investment, votedAt: 0 },
        research: { kind: 'fixed', amount: spendingDials.research, votedAt: 0 },
      },
      // The statute book opens empty (ADR-0027): every country inherits a
      // 1946 in which none of these rules has been written. `enactedAt: 0`
      // beside level 0 is the same statement twice — nothing is in force, and
      // nothing is phasing in — and it keeps the record shape uniform so the
      // minute book has no absent quarters to reason about.
      statutes: Object.fromEntries(
        STATUTE_IDS.map((id) => [id, { level: 0, enactedAt: 0 }]),
      ) as StatuteBook,
      // Older saves carry no education capacity — backfill the 1946 default.
      capacity: {
        ...params.capacities,
        education: (params.capacities.education as number | undefined) ?? EDUCATION_1946,
      },
      pipeline: [],
      budget: { revenue: 0, outlays: 0, balance: 0 },
      debt: debt0,
      printed: 0,
    },
    external: {
      worldPrices: sectorRecord(() => 1),
      reserves: importsValue * (params.structure?.reserveCoverage ?? RESERVES_INIT_QTRS),
      exchangeRate: 1,
      foreignOwnedCapital: foreignOwnedCapital0,
      world: {
        partners: PARTNER_IDS.map((id) => ({ id, activity: 1 })),
        exportDemand: sectorRecord(() => 1),
      },
      shocks: { droughtQtrsLeft: 0, droughtSeverity: 1 },
    },
    // seeded at equilibrium two lines below, once the sectors exist to emit
    environment: { pollution: 0, baseline: 0, emissionsQ: 0 },
    institutions: {
      stocks: { suffrage: 0, press: 0, labor_rights: 0, courts: 0, repression: 0 },
      societalPower: 0,
      statePower: 0,
      unrest: 0,
      blocs: {
        landowners: { power: 0, favor: 0 },
        industrialists: { power: 0, favor: 0 },
        financiers: { power: 0, favor: 0 },
        unions: { power: 0, favor: 0 },
      },
      pledge: null,
    },
    politics: {
      politicalCapital: PC_START,
      quartersToElection: ELECTION_PERIOD,
      inPower: true,
      electionsWon: 0,
      electionsSuppressed: 0,
      deposedAt: null,
      deposedBy: null,
      campaign: null,
      lastElection: null,
    },
    ledger: {
      inflationExpectations: 0.03,
      debtToGdp: debtToGdp0,
      confidence: { consumer: CONF_NEUTRAL, business: CONF_NEUTRAL },
    },
    stats: { record: [], series: {}, industry: [], households: [], news: [] },
    score: {
      discountedWelfare: 0,
      discountWeight: 0,
      baselineWelfare: null,
      corridorQuarters: 0,
      governedQuarters: 0,
    },
    flows,
  }

  // The burden opens AT its equilibrium, not at zero, and this is the whole
  // reason `emissionsPerHead` is a shared function rather than arithmetic
  // inside the step: a country seeded at zero would spend its first two
  // decades on a rising trend nobody chose, and every early-century
  // measurement would be reading that ramp instead of the economy. Countries
  // differ here because their industrial structures differ, which is the
  // correct reason to differ (ADR-0028).
  const opening = emissionsPerHead(provisional)
  const seeded: TrueState = {
    ...provisional,
    // `baseline` is the inheritance the damage channels measure excess
    // against, so an industrial recipe is not charged for being industrial
    // before its player has done anything.
    environment: { pollution: opening, baseline: opening, emissionsQ: opening },
  }
  return { ...seeded, institutions: initialInstitutions(seeded) }
}
