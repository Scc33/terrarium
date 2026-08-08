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

/** the classes whose size is the non-retired population, split by share */
export const WORKING_CLASS_IDS = [
  'rural_workers',
  'urban_workers',
  'professionals',
  'business_owners',
] as const
export type WorkingClassId = (typeof WORKING_CLASS_IDS)[number]

export const CAPACITY_IDS = ['tax', 'statistical', 'administrative', 'education'] as const
export type CapacityId = (typeof CAPACITY_IDS)[number]

/** The two sides of the budget, disaggregated. Headline revenue and outlays
 * hide the only fiscal question that matters — *which* tax, *which* programme —
 * so both are kept as a split the treasury books exactly (§6.1: a government
 * never needs a survey to know what it collected and what it voted). */
export const REVENUE_SOURCE_IDS = ['income', 'corporate', 'tariff', 'fuel'] as const
export type RevenueSourceId = (typeof REVENUE_SOURCE_IDS)[number]
export type RevenueSplit = Record<RevenueSourceId, Money>

/** `capacity` is the Layer-2 build pipeline; `interest` is the coupon bill.
 * Neither is a dial you move this quarter — that they crowd out the ones you
 * can is exactly what the breakdown is for. */
export const OUTLAY_IDS = [
  'transfers',
  'procurement',
  'investment',
  'subsidies',
  'capacity',
  'interest',
] as const
export type OutlayId = (typeof OUTLAY_IDS)[number]
export type OutlaySplit = Record<OutlayId, Money>

/** Layer 3 (§4.3) — generational, ratcheting, contested. These are the stocks
 * that edit your own objective function: `suffrage` rewrites the ballot
 * weights the PC formula scores you on, `repression` buys the state's coercive
 * arm at society's expense. Reform moves them a step at a time. */
export const INSTITUTION_IDS = ['suffrage', 'press', 'labor_rights', 'courts', 'repression'] as const
export type InstitutionId = (typeof INSTITUTION_IDS)[number]

/** the veto players (§4.3). Not a scripted faction system: each bloc's POWER
 * is read off the economy it owns, so a crisis that guts a bloc's base is a
 * political opening — and the elites' hold on the levers loosens for free. */
export const BLOC_IDS = ['landowners', 'industrialists', 'financiers', 'unions'] as const
export type BlocId = (typeof BLOC_IDS)[number]

/** how you fight the election (§3.1: hold a coalition together). Each is a
 * real fork with a real bill: largesse mortgages the budget, coalition
 * mortgages the levers, suppression mortgages the corridor, franchise
 * mortgages your own scoring rubric. */
export const PLATFORM_IDS = ['record', 'largesse', 'coalition', 'suppression', 'franchise'] as const
export type PlatformId = (typeof PLATFORM_IDS)[number]

export const INDICATOR_IDS = [
  'gdp_growth',
  'inflation',
  'price_food',
  'price_fuel',
  'unemployment',
  'payrolls',
  'capital_stock',
  'conf_consumer',
  'conf_business',
  'approval',
  'gini',
  'birth_rate',
  'death_rate',
  'terms_of_trade',
  'asset_prices',
  'credit_growth',
  'unrest',
] as const
export type IndicatorId = (typeof INDICATOR_IDS)[number]

/** the rest of world: a handful of abstract trading partners (§10) */
export const PARTNER_IDS = ['commodity', 'manufacturing', 'financial', 'regional'] as const
export type PartnerId = (typeof PARTNER_IDS)[number]

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
  /** 1946 age pyramid, persons (millions) per 5-year band, 0–4 first.
   * Optional for saves from before M4 — init synthesizes one to match
   * cohortSizes when absent. */
  pyramid?: number[]
  /** Optional structural opening conditions. Saves from before schema 13 omit
   * this block and receive the historical Meridia defaults. Multipliers are
   * relative to the standard 1946 sector mix and are normalized by init, so
   * they change composition without silently changing the country's scale. */
  structure?: CountryStructure
}

/** What differs between countries beyond size and development. This remains
 * immutable input — no live state is smuggled into a scenario, and a save is
 * still fully replayable from (params, seed, actionLog). */
export interface CountryStructure {
  outputMix: Record<SectorId, number>
  employmentMix: Record<SectorId, number>
  capitalMix: Record<SectorId, number>
  /** opening stocks, expressed against annual GDP or quarterly imports */
  debtToGdp: number
  creditToGdp: number
  reserveCoverage: number
  /** constitutional inheritance before the first reform */
  institutions: Record<InstitutionId, Ratio>
}

// ---------- demography (§8: the century IS the transition window) ----------
export const AGE_BANDS = 17 // 0–4, 5–9, …, 80+
/** band index at which people leave the labor force (60+: period-realistic,
 * and it makes the pension arithmetic bite when the pyramid inverts) */
export const RETIREMENT_BAND = 12
/** first and last band of working age (15–59) */
export const WORKING_BANDS: [number, number] = [3, 11]
/** childbearing bands (15–39) */
export const FERTILE_BANDS: [number, number] = [3, 7]

export interface DemographyState {
  /** persons (millions) per 5-year band */
  pyramid: number[]
  /** total fertility rate currently implied by income/urbanization/norms */
  tfr: number
  /** multiplier on the base mortality schedule (falls with income + time) */
  mortalityIndex: number
  /** net migration this quarter, millions (+ = immigration) */
  netMigrationQ: number
  /** crude birth/death rates this quarter, annualized per 1000 — engine
   * truth; only PUBLISHED once civil registration is funded (§8 fog) */
  crudeBirthRate: number
  crudeDeathRate: number
  /** (working-age / non-retired) relative to the 1946 baseline — scales
   * participation, so the dividend and the aging squeeze reach the labor
   * market through one number */
  workerShareMult: number
  /** how the non-retired population splits into the four working classes */
  classShares: Record<WorkingClassId, Ratio>
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
  /** credit outstanding to this sector's firms — the aggregate is allocated
   * by capital share (§12 M5); it levers investment and sours in a crisis */
  credit: Money
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
/** one abstract foreign economy (§10) — a coarse model: an activity level
 * (output gap, 1.0 neutral) evolving on its own business cycle. */
export interface WorldPartner {
  id: PartnerId
  activity: number
}

export interface WorldState {
  partners: WorldPartner[]
  /** per-sector multiplier on export demand (~1 neutral), set by how strong
   * the partners who buy that sector currently are */
  exportDemand: Record<SectorId, number>
}

export interface ExternalState {
  worldPrices: Record<SectorId, number>
  reserves: Money
  exchangeRate: number // domestic per foreign; up = depreciation
  /** the rest of world: partner cycles that drive prices and export demand */
  world: WorldState
  /** the crisis clock's live wires (Pillar 4) */
  shocks: {
    /** quarters of failed harvest still to run; 0 = no drought */
    droughtQtrsLeft: Qtr
    /** agri tfp multiplier applied while the drought runs (restored after) */
    droughtSeverity: number
  }
}

// ---------- technology (§9: two trees and the gap) ----------
export interface TechState {
  /** the global frontier — advancing on a roughly historical schedule,
   * mostly indifferent to you (index, 1946 = 1) */
  frontier: number
  /** what this country has actually attained, per sector (1946 = 1).
   * The gap to the sector's frontier is the whole drama of development. */
  attained: Record<SectorId, number>
  /** economy-wide attained tfp growth last quarter — what wage bargaining
   * passes through near full employment */
  tfpGrowthQ: number
}

// ---------- the financial sector (§12 M5: fragility) ----------
export interface FinanceState {
  /** asset valuation per unit of capital — a Tobin's q, 1946 = 1. The bubble
   * variable: departs from its profitability/rate fundamental on credit and
   * animal spirits, and production reads it as the price of investing. */
  assetPrice: number
  /** the banking system's net worth — the buffer against loan losses. Crises
   * write it down; the interest margin rebuilds it. Thin capital → a crunch. */
  bankCapital: Money
  /** total credit outstanding = Σ sector.credit (cached for cheap reads) */
  creditOutstanding: Money
  /** credit / annual nominal GDP — the leverage gauge and the fragility clock */
  creditToGdp: number
  /** last quarter's change in credit/GDP, annualized — the boom signal a
   * bank supervisor would report; also what bids asset prices up */
  creditGrowth: number
  /** quarters of an active banking crisis still to run; 0 = calm */
  crisisQtrsLeft: Qtr
  /** how hard the current crisis hit, 0..1 — sizes the crunch and the drag */
  crisisSeverity: number
}

// ---------- institutions (§4.3 Layer 3, §6.3 the corridor) ----------
/** One veto player. `power` is DERIVED from the economy each quarter — the
 * share of the country a bloc owns — so nothing about it is hand-authored;
 * `favor` is how it feels about the government right now, and it is the thing
 * that turns into a capital strike, a wage push, or a coup. */
export interface Bloc {
  /** clout, 0..1: read off the bloc's economic base */
  power: Ratio
  /** −1 (implacable) .. +1 (in your pocket) */
  favor: number
}

export interface InstitutionState {
  /** Layer-3 stocks, 0..1. Generational: reforms move them a step at a time */
  stocks: Record<InstitutionId, Ratio>
  /** §6.3 y-axis — society's capacity to organize and constrain the state.
   * Slow: it tracks a target set by franchise, organization, education,
   * urbanization, inequality and the boot, at a generation's pace. */
  societalPower: Ratio
  /** §6.3 x-axis — the Leviathan: the ministries you built, plus the
   * coercive arm repression buys */
  statePower: Ratio
  /** §4.3 revolutionary pressure, 0..1. High pressure prises open reforms
   * elites would otherwise veto — and can end you outright. */
  unrest: Ratio
  blocs: Record<BlocId, Bloc>
  /** a bloc courted at the last election has a claim on you until this
   * expires: everything they dislike costs double while the debt stands */
  pledge: { bloc: BlocId; quartersLeft: Qtr } | null
}

// ---------- politics ----------
/** What the last election actually was — the scene, kept so the UI can play
 * it back rather than reduce it to one line on the wire. */
export interface ElectionResult {
  tick: Qtr
  platform: PlatformId
  /** the bloc courted, when the platform was `coalition` */
  bloc: BlocId | null
  /** enfranchisement-weighted approval going in */
  support: Ratio
  /** what the campaign itself was worth, in approval points */
  swing: number
  /** the bar you had to clear (repression lowers it) */
  threshold: Ratio
  won: boolean
  /** won by suppressing the vote rather than winning it */
  suppressed: boolean
}

export interface PoliticalState {
  politicalCapital: number
  quartersToElection: number
  inPower: boolean
  electionsWon: number
  /** mandates taken by force rather than consent — graded separately (§3.3) */
  electionsSuppressed: number
  /** the quarter the government fell; null while it stands */
  deposedAt: Qtr | null
  /** how it ended: at the polls, or by the street / the palace */
  deposedBy: 'poll' | 'revolt' | 'coup' | null
  /** the platform committed to for the election now approaching. The swing is
   * banked when the promise is made, not when the votes are counted — a
   * giveaway is worth what it was worth on the day you announced it. */
  campaign: { platform: PlatformId; bloc: BlocId | null; swing: number } | null
  /** the last election, for the results scene */
  lastElection: ElectionResult | null
}

// ---------- fragility ----------
export interface FragilityLedger {
  inflationExpectations: number // annualized, adaptive in M1
  debtToGdp: number // cached
  /** animal spirits, 0..1 with 0.55 neutral — surveyed only if you fund it */
  confidence: { consumer: Ratio; business: Ratio }
}

// ---------- the statistics office (lives INSIDE the state: §3.4 salience) ----------
export interface StatPrint {
  forQtr: Qtr // period measured
  publishedAt: Qtr // period released (lag = publishedAt − forQtr)
  value: number
  revision: number // 0 = first print
  errorBand: number // half-width; 0 = the office can't even estimate it
  /** GDP only: the office's level estimates behind the growth print */
  levels?: { real: number; nominal: number }
}

export interface NewsItem {
  tick: Qtr
  text: string
  tone: 'good' | 'bad' | 'neutral'
}

/** One quarter's measurable truth, filed at measurement time. The office
 * revises against THIS worksheet later — and the capacity that existed when
 * the quarter happened decides forever whether it was surveyed at all. */
export interface StatRecord {
  tick: Qtr
  realGdp: Money
  nominalGdp: Money
  inflationQ: number
  unemployment: Ratio
  payrolls: number // millions, ex-agri
  capitalTotal: Money
  confConsumer: Ratio
  confBusiness: Ratio
  /** enfranchisement-weighted approval — what a pollster would find */
  approvalIndex: Ratio
  /** consumer-facing prices off the market boards (fuel includes the excise) */
  priceFood: number
  priceFuel: number
  /** income Gini across cohorts, 0..1 — what a household survey would find */
  gini: Ratio
  /** crude birth/death rates (per 1000/yr) — what a civil registrar records */
  birthRate: number
  deathRate: number
  /** the exact head count and age pyramid this quarter — census-grade, no
   * fog: you can always count people, even when you can't survey them */
  population: number
  pyramid: number[]
  /** terms of trade: world price of your export basket ÷ your import basket,
   * indexed to 1946=100 — what the customs statisticians would compile */
  termsOfTrade: number
  /** asset price index (1946=100) — what a stock/property board would quote */
  assetPrice: number
  /** credit outstanding / annual GDP — what a bank supervisor would tabulate */
  creditToGdp: number
  /** revolutionary pressure, 0..1 — what the provincial governors' reports
   * would add up to if anyone collated them (§4.3). Fogged like everything
   * else: a state that cannot survey its own people cannot see the street. */
  unrest: Ratio
  /** the corridor's two coordinates (§6.3). Exact, not fogged: a government
   * knows which ministries it built and which liberties it granted — the
   * uncertainty in this game is about the economy, not about the constitution */
  statePower: Ratio
  societalPower: Ratio
  /** statistical capacity when measured: freezes lag, noise, existence */
  statCapacity: Ratio
  // rumor-mill inputs
  satisfiedAgri: Ratio
  printedShare: number
  reservesQtrs: number
  utilization: Ratio
  // the treasury's own books — exact, no fog on yourself
  revenue: Money
  outlays: Money
  balance: Money
  debt: Money
  reserves: Money
  /** and the same books disaggregated, so the century of composition is on
   * the record: which taxes carried the state, what the money went to */
  revenueBySource: RevenueSplit
  outlaysByProgramme: OutlaySplit
}

export interface StatsOffice {
  /** raw worksheets, one per quarter, appended by the statistics step */
  record: StatRecord[]
  /** everything ever published, in publication order */
  series: Partial<Record<IndicatorId, StatPrint[]>>
  news: NewsItem[]
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
  /** receipts by tax, after capacity-gated collection — what each rate
   * actually brought in, not what it was set to bring in */
  revenueBySource: RevenueSplit
  /** outlays by programme, as booked (money voted and paid, before delivery
   * leakage — the treasury knows what it spent, not what arrived) */
  outlaysByProgramme: OutlaySplit
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
  demography: DemographyState
  tech: TechState
  finance: FinanceState
  cohorts: Cohort[]
  sectors: Sector[]
  io: IOTable
  market: MarketState
  gov: GovernmentState
  external: ExternalState
  institutions: InstitutionState
  politics: PoliticalState
  ledger: FragilityLedger
  stats: StatsOffice
  /** §3.3 Prosperity: cumulative discounted welfare, accumulated as the run
   * happens — a scorched-earth sprint to 2049 must not score */
  score: {
    /** Σ β^t · (population-weighted mean log real consumption per capita) */
    discountedWelfare: number
    discountWeight: number // Σ β^t, for normalizing to an average
    /** quarter-zero welfare (mean log), the "vs 1946" yardstick */
    baselineWelfare: number | null
    /** §3.3 Position: quarters of your tenure spent inside the corridor, and
     * the tenure they are counted against. Accumulated as the run happens for
     * the same reason welfare is — the path is the grade, not the endpoint. */
    corridorQuarters: number
    governedQuarters: number
  }
  flows: TickFlows
}

// v11 was the disaggregated budget, which landed on master while this was in
// flight; politics-as-a-game therefore becomes v12.
export const SCHEMA_VERSION = 13 // v13: replayable country structures and scenario catalogue
export const ENGINE_VERSION = '0.1.0'
export const ELECTION_PERIOD = 16 // quarters
/** the campaign opens this many quarters before the vote: the scene needs a
 * turn of its own, or the choice is made in the same breath as the result */
export const CAMPAIGN_WINDOW = 2
/** 1946Q1 + 416 quarters = 2050: the historians close the book */
export const END_OF_HISTORY_TICK = 416

export function sectorIndex(id: SectorId): number {
  return SECTOR_IDS.indexOf(id)
}
