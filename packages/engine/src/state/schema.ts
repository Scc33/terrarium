/**
 * State schema (§3 of the architecture doc). One root object, plain data —
 * structured-clone-able, hashable, diffable. Reserved fields ship at zero.
 */

import type { Seed } from '../rng/rng'

export type Qtr = number // quarters since 1946Q1
export type Money = number // base-year units
export type Ratio = number // 0..1 unless noted

export const SECTOR_IDS = ['agri', 'manuf', 'energy', 'services', 'transport'] as const
export type SectorId = (typeof SECTOR_IDS)[number]

export const COHORT_IDS = [
  'rural_workers',
  'urban_workers',
  'professionals',
  'business_owners',
  'retirees',
] as const
export type CohortId = (typeof COHORT_IDS)[number]

export const CAPACITY_IDS = ['tax', 'statistical', 'administrative'] as const
export type CapacityId = (typeof CAPACITY_IDS)[number]

// ---------- country parameters (immutable after init) ----------
export interface CountryParams {
  name: string
  /** 0..1 development scalar; scales capital, tfp, capacities */
  development: number
  /** trade exposure: scales export/import bases */
  openness: number
  /** initial capacity stocks */
  capacities: Record<CapacityId, Ratio>
  /** persons, millions, per cohort */
  cohortSizes: Record<CohortId, number>
  /** starting enfranchisement weights */
  enfranchisement: Record<CohortId, Ratio>
}

// ---------- population ----------
export interface Cohort {
  id: CohortId
  size: number // persons (millions); static in M1
  employedIn: Partial<Record<SectorId, number>> // millions
  wageIncome: Money
  transferIncome: Money
  profitIncome: Money
  savings: Money
  consumptionWeights: Record<SectorId, Ratio> // sums to 1
  approval: Ratio
  enfranchisement: Ratio
  /** last tick's experienced real income (for growth calc) */
  lastRealIncome: Money
  /** last tick's own-basket price level (for experienced inflation) */
  lastCpi: number
}

// ---------- production ----------
export interface Sector {
  id: SectorId
  capital: Money
  tfp: number
  employment: number // millions
  output: Money // real units, this tick
  capacityUtilization: Ratio
  inventory: Money
  credit: Money // RESERVED — always 0 until M5
}

export interface IOTable {
  /** coeff[i][j] = units of sector i input per unit of sector j output */
  coeff: number[][]
}

// ---------- markets ----------
export interface MarketState {
  prices: Record<SectorId, number> // index, base = 1.0
  wages: Record<SectorId, number> // index, base = 1.0
  excessDemand: Record<SectorId, number> // last tick's, for damping
  tatonnement: {
    demandGain: number // λ_d in Δp = λ_d·(ED/supply)
    costGain: number // λ_c pull toward unit cost × markup
    markup: number
    maxMovePerTick: Ratio // hard cap on |Δp/p|
  }
}

// ---------- government ----------
export interface DialState {
  taxRates: { income: Ratio; corporate: Ratio; tariff: Ratio; fuel: Ratio }
  spending: { transfers: Money; procurement: Money; investment: Money }
  policyRate: number // annualized
  subsidies: Partial<Record<SectorId, Money>>
}

export interface CapacityBuild {
  target: CapacityId
  perQtr: number // capacity points delivered per quarter
  moneyPerQtr: Money // budget outlay per quarter while building
  remaining: Qtr
}

export interface GovernmentState {
  dials: DialState
  capacity: Record<CapacityId, Ratio>
  /** in-flight Layer-2 investments; capacity arrives with a lag */
  pipeline: CapacityBuild[]
  budget: { revenue: Money; outlays: Money; balance: Money }
  debt: Money
  /** cumulative money-financed deficit (the printing press) */
  printed: Money
}

// ---------- external ----------
export interface ExternalState {
  worldPrices: Record<SectorId, number>
  reserves: Money
  exchangeRate: number // domestic per foreign; up = depreciation
}

// ---------- politics ----------
export interface PoliticalState {
  politicalCapital: number
  quartersToElection: number
  inPower: boolean
  electionsWon: number
}

// ---------- fragility ----------
export interface FragilityLedger {
  inflationExpectations: number // annualized, adaptive in M1
  debtToGdp: number // cached
  /** previous tick's real GDP (cached for growth calc) */
  lastRealGdp: Money
  /** animal spirits, 0..1 with 0.55 neutral — surveyed only if you fund it */
  confidence: { consumer: Ratio; business: Ratio }
}

// ---------- per-tick flows (scratch, recomputed every tick; kept for inspectability) ----------
export interface TickFlows {
  /** final demand by sector, real units */
  finalDemand: Record<SectorId, number>
  /** gross output demanded (Leontief-required), real units */
  grossDemand: Record<SectorId, number>
  /** share of demand actually satisfied, 0..1 */
  satisfied: Record<SectorId, number>
  exportsReal: Record<SectorId, number>
  importsReal: Record<SectorId, number>
  profits: Record<SectorId, number>
  /** household real demand by sector (for fuel-tax base, CPI weights) */
  householdDemand: Record<SectorId, number>
  /** nominal spend per cohort this tick (for savings identity) */
  cohortSpend: Record<CohortId, number>
  /** private + public investment demand, real */
  investmentReal: number
  /** value of imports at border prices (tariff base) */
  tariffBase: Money
  /** subsidy money that actually reached each sector (post-leakage) */
  subsidyDelivered: Record<SectorId, number>
  taxRevenue: { income: Money; corporate: Money; tariff: Money; fuel: Money }
  /** coupons paid to (domestic) bondholders this tick — income */
  debtInterest: Money
  /** principal redeemed this tick — a portfolio swap into savings, not income */
  debtPrincipal: Money
  nominalGdp: Money
  realGdp: Money
  /** quarterly CPI inflation (not annualized) */
  inflationQ: number
  unemployment: Ratio
  /** money-financed deficit this tick */
  printedThisQtr: Money
}

// ---------- root ----------
export interface TrueState {
  meta: {
    schemaVersion: number
    engineVersion: string
    tick: Qtr
    seed: Seed
  }
  params: CountryParams
  cohorts: Cohort[]
  sectors: Sector[]
  io: IOTable
  market: MarketState
  gov: GovernmentState
  external: ExternalState
  politics: PoliticalState
  ledger: FragilityLedger
  flows: TickFlows
}

export const SCHEMA_VERSION = 2 // v2: FragilityLedger.confidence
export const ENGINE_VERSION = '0.1.0'
export const ELECTION_PERIOD = 16 // quarters

export function sectorIndex(id: SectorId): number {
  return SECTOR_IDS.indexOf(id)
}
