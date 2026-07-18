/**
 * Country generation. A country is a parameter vector (§10 of the design
 * doc); init() calibrates a TrueState from it so the economy starts near
 * equilibrium — tfp is solved from target outputs rather than guessed, so
 * tick 1 doesn't open with a shock.
 */

import { rngFor, type Seed } from '../rng/rng'
import {
  adminEffectiveness,
  taxEfficiency,
  CONF_NEUTRAL,
  CAPITAL_ELASTICITY,
  CONSUMPTION_WEIGHTS,
  IO_COEFF,
  LABOR_ELASTICITY,
  LABOR_SHARE,
  LABOR_SOURCE,
  PC_START,
  PROFIT_SHARE,
  RESERVES_INIT_QTRS,
  IMPORT_BASE_SHARE,
  TATONNEMENT,
  TRANSFER_SHARE,
  UTILIZATION_AT_INIT,
} from '../constants'
import { sectorRecord } from '../math'
import {
  COHORT_IDS,
  ELECTION_PERIOD,
  ENGINE_VERSION,
  SCHEMA_VERSION,
  SECTOR_IDS,
  type Cohort,
  type CountryParams,
  type SectorId,
  type TickFlows,
  type TrueState,
} from './schema'

// baseline gross outputs / employment / capital for a 27.5M-person country
// at development 0.35 (a mid-poor 1946 economy)
const BASE_GROSS: Record<SectorId, number> = { agri: 30, manuf: 25, energy: 12, services: 28, transport: 10 }
const BASE_EMPLOYMENT: Record<SectorId, number> = { agri: 5.4, manuf: 2.7, energy: 0.35, services: 2.7, transport: 0.75 }
const BASE_CAPITAL: Record<SectorId, number> = { agri: 40, manuf: 60, energy: 30, services: 35, transport: 20 }
const BASE_POP = 27.5
const BASE_DEVELOPMENT = 0.35

const NAMES = ['Arcadia', 'Meridia', 'Costona', 'Veltravia', 'Kestrel', 'Oranga', 'Sellandia', 'Tavor']

/** Sample a plausible country from parameter space (procedural mode). */
export function generateParams(seed: Seed): CountryParams {
  const rng = rngFor(seed, 'genParams', 0)
  const popScale = rng.range(0.85, 1.15)
  return {
    name: NAMES[Math.floor(rng.next() * NAMES.length)],
    development: rng.range(0.28, 0.45),
    openness: rng.range(0.8, 1.2),
    capacities: {
      tax: rng.range(0.18, 0.3),
      statistical: rng.range(0.12, 0.25),
      administrative: rng.range(0.22, 0.35),
    },
    cohortSizes: {
      rural_workers: 12 * popScale * rng.range(0.9, 1.1),
      urban_workers: 8 * popScale * rng.range(0.9, 1.1),
      professionals: 3 * popScale * rng.range(0.9, 1.1),
      business_owners: 1.5 * popScale,
      retirees: 3 * popScale * rng.range(0.9, 1.1),
    },
    enfranchisement: {
      rural_workers: 0.6,
      urban_workers: 0.8,
      professionals: 1,
      business_owners: 1,
      retirees: 0.9,
    },
  }
}

export function init(params: CountryParams, seed: Seed): TrueState {
  const totalPop = Object.values(params.cohortSizes).reduce((a, b) => a + b, 0)
  const popScale = totalPop / BASE_POP
  const devScale = params.development / BASE_DEVELOPMENT

  // targets scaled by population; development scales productivity (via solved tfp)
  const gross = sectorRecord((id) => BASE_GROSS[id] * popScale * devScale)
  const employment = sectorRecord((id) => BASE_EMPLOYMENT[id] * popScale)
  const capital = sectorRecord((id) => BASE_CAPITAL[id] * popScale * devScale)

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
  const debt0 = 0.3 * gdp0 * 4 // 30% of annual GDP
  const interest0 = (debt0 * 0.04) / 4
  // a small structural deficit is period-realistic and sustainable
  const grossBudget0 = Math.max(0, 1.05 * revenue0 - interest0)
  const spendingDials = {
    transfers: 0.36 * grossBudget0,
    procurement: 0.39 * grossBudget0,
    investment: 0.25 * grossBudget0,
  }
  const transfersDelivered = spendingDials.transfers * adminEff

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
    const profitTotal = (1 - LABOR_SHARE) * gdp0
    const income =
      wageIncome + profitTotal * PROFIT_SHARE[cid] + transfersDelivered * TRANSFER_SHARE[cid]
    return {
      id: cid,
      size: params.cohortSizes[cid],
      employedIn,
      wageIncome,
      transferIncome: transfersDelivered * TRANSFER_SHARE[cid],
      profitIncome: profitTotal * PROFIT_SHARE[cid],
      savings: income * (cid === 'retirees' ? 8 : 1), // retirees hold war bonds

      consumptionWeights: { ...CONSUMPTION_WEIGHTS[cid] },
      approval: 0.55, // a modest honeymoon
      enfranchisement: params.enfranchisement[cid],
      // slightly below true income so tick-0 bookkeeping shifts don't read
      // as a recession through the loss-aversion multiplier
      lastRealIncome: income * 0.99,
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
    tariffBase: 0,
    subsidyDelivered: sectorRecord(() => 0),
    taxRevenue: { income: 0, corporate: 0, tariff: 0, fuel: 0 },
    debtInterest: interest0,
    debtPrincipal: 0,
    nominalGdp: gdp0,
    realGdp: gdp0,
    inflationQ: 0,
    unemployment: 0.07,
    printedThisQtr: 0,
  }

  return {
    meta: { schemaVersion: SCHEMA_VERSION, engineVersion: ENGINE_VERSION, tick: 0, seed },
    params,
    cohorts,
    sectors: SECTOR_IDS.map((id) => ({
      id,
      capital: capital[id],
      tfp: tfp[id],
      employment: employment[id],
      output: gross[id],
      capacityUtilization: UTILIZATION_AT_INIT,
      inventory: 0,
      credit: 0,
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
        policyRate: 0.04,
        subsidies: {},
      },
      capacity: { ...params.capacities },
      pipeline: [],
      budget: { revenue: 0, outlays: 0, balance: 0 },
      debt: debt0,
      printed: 0,
    },
    external: {
      worldPrices: sectorRecord(() => 1),
      reserves: importsValue * RESERVES_INIT_QTRS,
      exchangeRate: 1,
    },
    politics: {
      politicalCapital: PC_START,
      quartersToElection: ELECTION_PERIOD,
      inPower: true,
      electionsWon: 0,
    },
    ledger: {
      inflationExpectations: 0.03,
      debtToGdp: 0.3,
      confidence: { consumer: CONF_NEUTRAL, business: CONF_NEUTRAL },
    },
    stats: { record: [], series: {}, news: [] },
    flows,
  }
}
