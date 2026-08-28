/**
 * State schema (§3 of the architecture doc). One root object, plain data —
 * structured-clone-able, hashable, diffable. Reserved fields ship at zero.
 */

import type { Seed } from '../rng/rng'

export type Qtr = number // quarters since 1946Q1
export type Money = number // base-year units
export type Ratio = number // 0..1 unless noted

/**
 * The rules of the run: safeties chosen before the opening state exists and
 * immutable afterwards (ADR-0015, ADR-0020). Each changes what the same
 * country, seed, and action log produce, so each is an engine input recorded
 * in the save — never a UI preference.
 *
 * They are deliberately a SET of independent flags rather than a ladder of
 * named modes. Three safeties spell eight named modes, and nobody would keep
 * eight of them honest; a player who wants every survey without immortality
 * is asking for one rule, not for a difficulty setting.
 */
export const GAME_RULE_IDS = ['protectedTenure', 'fullInstrumentation', 'unlimitedCapital'] as const
export type GameRuleId = (typeof GAME_RULE_IDS)[number]
export type GameRules = Record<GameRuleId, boolean>

/** Ordinary play: every safety off. */
export const STANDARD_RULES: GameRules = {
  /** lost elections, revolts, and coups are recorded but never end the run */
  protectedTenure: false,
  /** the statistical office reports every survey whatever it can afford —
   * prints stay lagged and noisy, so capacity still buys accuracy */
  fullInstrumentation: false,
  /** orders are still priced and the room still objects; the bill is never charged */
  unlimitedCapital: false,
}

/** The pre-v27 spelling: one scalar for the tenure rule. Saves written before
 * the rule set carry it, and `gameRules` maps it forward. */
export type GameMode = 'standard' | 'god'

/** Normalize whatever a caller supplied — the legacy mode string, a partial
 * set, or nothing — into the full rule record state holds. */
export function gameRules(input: GameMode | Partial<GameRules> = 'standard'): GameRules {
  if (typeof input === 'string') return { ...STANDARD_RULES, protectedTenure: input === 'god' }
  return { ...STANDARD_RULES, ...input }
}

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

/** Equal fifths of the population, ranked by real disposable income. These
 * are survey bins, not socioeconomic cohorts: a large cohort may span more
 * than one quintile, and a quintile may contain pieces of several cohorts. */
export const INCOME_QUINTILE_IDS = ['lowest', 'second', 'middle', 'fourth', 'highest'] as const
export type IncomeQuintileId = (typeof INCOME_QUINTILE_IDS)[number]

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
 * so both are kept as a split the treasury books exactly (a government
 * never needs a survey to know what it collected and what it voted). */
export const REVENUE_SOURCE_IDS = ['income', 'corporate', 'tariff', 'fuel'] as const
export type RevenueSourceId = (typeof REVENUE_SOURCE_IDS)[number]
export type RevenueSplit = Record<RevenueSourceId, Money>

/** `capacity` is the Layer-2 build pipeline; `interest` is the coupon bill.
 * Neither is a dial you move this quarter. Interest does not silently cut a
 * voted programme: it enlarges the funding need, and bond issuance crowds
 * private finance through the ordinary rate channel. */
export const OUTLAY_IDS = [
  'transfers',
  'procurement',
  'investment',
  'research',
  'subsidies',
  'capacity',
  'interest',
] as const
export type OutlayId = (typeof OUTLAY_IDS)[number]
export type OutlaySplit = Record<OutlayId, Money>

/** The four recurring programmes the cabinet can write a spending rule for.
 * Capacity builds, subsidies, and interest have their own causal controls. */
export const SPENDING_PROGRAM_IDS = ['transfers', 'procurement', 'investment', 'research'] as const
export type SpendingProgramId = (typeof SPENDING_PROGRAM_IDS)[number]

/** A voted appropriation can stay nominal, follow the official CPI print, or
 * claim a share of the latest officially published nominal GDP. Indexed
 * amounts advance only on first releases: revisions do not rewrite cheques
 * that have already gone out. */
/** `votedAt` is the quarter the cabinet last WROTE this rule, and it is the
 * only thing that distinguishes a decision from a consequence: an indexed
 * appropriation's `amount` moves on every CPI print, so a record that diffed
 * amounts would report a policy change every quarter forever. Stamped where
 * the rule is written and carried through resolution untouched. */
export type SpendingRule =
  | { kind: 'fixed'; amount: Money; votedAt: Qtr }
  | { kind: 'indexed'; amount: Money; lastIndexedForQtr: Qtr | null; votedAt: Qtr }
  | { kind: 'gdpShare'; share: Ratio; votedAt: Qtr }
export type SpendingRuleMode = SpendingRule['kind']
export type SpendingRules = Record<SpendingProgramId, SpendingRule>

/**
 * The statute book (ADR-0027). Rules the government writes, as opposed to the
 * numbers it sets — a register between the dials and the constitution.
 *
 * A statute is an ORDINAL with named levels rather than a scalar, and the
 * naming is the point: a rule that is *called* something is what separates
 * this from a second rack of sliders. Each ladder lives in `STATUTE_LEVELS`;
 * a statute needing more than about three rungs was a number all along and
 * belongs in the cabinet as a dial.
 *
 * What reaches the economy is never the posted level. It is the level times
 * what the state can actually enforce — the third instance of a gap this game
 * already teaches twice, after `taxEfficiency` (a posted rate is not collected
 * revenue) and `adminEffectiveness` (a voted appropriation is not delivered
 * money). See `statuteForce` in `pipeline/derive.ts`; every step that reads a
 * statute reads that and nothing else.
 */
export const STATUTE_IDS = [
  'minimum_wage',
  'compulsory_schooling',
  'competition',
  'emissions_standard',
] as const
export type StatuteId = (typeof STATUTE_IDS)[number]

/** A statute as it stands on the books. Deliberately holds NOTHING that can be
 * computed: compliance is a function of quantities the desk already publishes
 * exactly, and a second copy of a derivable number is a second thing that can
 * be wrong. `enactedAt` is stored because both the phase-in and the repeal
 * premium read it — a law gets harder to undo the longer it has stood, which
 * is the whole difference between a statute and a dial. */
export interface Statute {
  /** index into `STATUTE_LEVELS[id]`; 0 is always "no statute" */
  level: number
  /** the quarter this level was written */
  enactedAt: Qtr
}
export type StatuteBook = Record<StatuteId, Statute>

/** Institutional reforms are generational, ratcheting, and contested. These are the stocks
 * that edit your own objective function: `suffrage` rewrites the ballot
 * weights the PC formula scores you on, `repression` buys the state's coercive
 * arm at society's expense. Reform moves them a step at a time. */
export const INSTITUTION_IDS = ['suffrage', 'press', 'labor_rights', 'courts', 'repression'] as const
export type InstitutionId = (typeof INSTITUTION_IDS)[number]

/** The veto players. Not a scripted faction system: each bloc's POWER
 * is read off the economy it owns, so a crisis that guts a bloc's base is a
 * political opening — and the elites' hold on the levers loosens for free. */
export const BLOC_IDS = ['landowners', 'industrialists', 'financiers', 'unions'] as const
export type BlocId = (typeof BLOC_IDS)[number]

/** How you fight the election and hold a coalition together. Each is a
 * real fork with a real bill: largesse mortgages the budget, coalition
 * mortgages the levers, suppression mortgages the corridor, franchise
 * mortgages your own scoring rubric. */
export const PLATFORM_IDS = ['record', 'largesse', 'coalition', 'suppression', 'franchise'] as const
export type PlatformId = (typeof PLATFORM_IDS)[number]

export const INDICATOR_IDS = [
  'gdp_growth',
  'gdp_per_capita',
  'debt_to_gdp',
  'consumption_per_capita',
  'household_saving_rate',
  // The expenditure accounts: who the economy's output is FOR. A
  // country turning itself into an exporter, or eating its own capital
  // formation, shows up here as composition rather than as a headline that
  // happens to be growing. Each is surveyed separately, so the prints do NOT
  // sum to 100 — that gap is the office's, and the composition views
  // renormalize rather than pretend otherwise.
  //
  // The fourth component of the identity — the state's own final consumption
  // — is measured (`StatRecord.governmentShare`) but deliberately NOT
  // published as an instrument. It runs under 1% of final expenditure here
  // because this engine's state has no payroll: it buys goods and pays
  // transfers, it does not employ teachers. A dial reading "government: 0.7%"
  // would be true and would badly misinform, and the state's real footprint
  // already has an exact home in the treasury ledger.
  'consumption_share',
  'investment_share',
  'export_share',
  /** inward foreign direct investment as a share of GDP. This is a FLOW,
   * distinct from the foreign-owned capital stock that accumulates behind it
   * and whose profits are remitted through the external account. */
  'fdi_inflows',
  'inflation',
  'price_food',
  'price_fuel',
  'unemployment',
  'labor_force_participation',
  /** the slow stock carried by the workforce, built by schools over a
   * generation rather than identical to the school system itself */
  'human_capital',
  'payrolls',
  'capital_stock',
  'technology_attainment',
  // What the technology instrument beside it cannot say. `technology_attainment`
  // is a RATIO to a frontier you can push, so a country that funds research
  // hard raises its own denominator and the needle goes quiet while the
  // economy underneath it transforms — measured, the dial moves ten points in
  // the first decade and four points in the eighty years after. Output per
  // worker is the level that kept moving.
  'productivity',
  'conf_consumer',
  'conf_business',
  'approval',
  'gini',
  'income_real',
  /** population below the fixed real basic-needs line (ADR-0030) */
  'poverty_rate',
  /** expected years lived by a synthetic newborn under today's age-specific
   * mortality schedule — period life expectancy, not current age at death */
  'life_expectancy',
  /** registered net migration, annualized per 1,000 residents. Positive is
   * immigration; negative is emigration. */
  'net_migration',
  'birth_rate',
  'death_rate',
  'terms_of_trade',
  'asset_prices',
  'credit_growth',
  // The LEVEL of leverage, beside its rate of change. Both are needed and
  // they are not substitutes: the banking crisis hazard reads
  // `max(0, credit/GDP − CRISIS_LEVERAGE_SAFE) × max(0, q − CRISIS_ASSET_SAFE)`,
  // a PRODUCT of two excesses, so a government that can see how fast credit
  // is growing but not where the stock stands is reading one term of a
  // multiplication. Publishing the growth rate alone made half the crisis
  // clock unobservable.
  'credit_to_gdp',
  /** bank capital as a share of credit outstanding — the shock absorber, and
   * the only way to see whether the `capitalRequirement` floor actually binds.
   * At the inherited 6% floor it is slack for a whole century; a government
   * that raises the floor cannot otherwise tell it did anything. */
  'bank_capital_ratio',
  /** the pollution burden the economy is carrying, standard 1946 country ≈ 100.
   * Fogged like everything else, and behind a monitoring gate for the reason
   * the whole instrument wall exists: a state that has not built an
   * environmental service cannot see what its own industry is doing, which is
   * the historical fact rather than a flourish. */
  'pollution',
  'unrest',
] as const
export type IndicatorId = (typeof INDICATOR_IDS)[number]

/** The rest of world: a handful of abstract trading partners. */
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
   * Optional for older saves — init synthesizes one to match
   * cohortSizes when absent. */
  pyramid?: number[]
  /** Optional structural opening conditions. Saves from before schema 13 omit
   * this block and receive the historical Meridia defaults. Multipliers are
   * relative to the standard 1946 sector mix and are normalized by init, so
   * they change composition without silently changing the country's scale. */
  structure?: CountryStructure
  /** True when a player wrote this vector rather than drawing it from the
   * recipe catalogue. Provenance only — `init` and every pipeline step ignore
   * it, and a country is not easier or harder for carrying it. It exists so
   * that a report card earned on a country nobody has balanced says so, and
   * keeps saying so after export and reload (the ADR-0015 argument, applied to
   * a fact about the run rather than a rule of it). Absent on every catalogue
   * recipe and on every save written before schema 26. */
  authored?: boolean
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

// ---------- demography: the century is the transition window ----------
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
  /** mean log consumption inherited in 1946. Migration keeps this country
   * baseline even when the player's report-card baseline opens at a later
   * appointment (ADR-0021, ADR-0022). */
  migrationBaselineWelfare: number | null
  /** crude birth/death rates this quarter, annualized per 1000 — engine
   * truth; only PUBLISHED once civil registration is funded */
  crudeBirthRate: number
  crudeDeathRate: number
  /** (working-age / non-retired) relative to the 1946 baseline — scales
   * participation, so the dividend and the aging squeeze reach the labor
   * market through one number */
  workerShareMult: number
  /** workforce knowledge and skills, 0..1. Schools are the institution that
   * replenishes this stock; educated people persist when a building project
   * finishes or a ministry later decays. */
  humanCapital: Ratio
  /** how the non-retired population splits into the four working classes */
  classShares: Record<WorkingClassId, Ratio>
}

// ---------- population ----------
export interface Cohort {
  id: CohortId
  size: number // persons (millions)
  employedIn: Partial<Record<SectorId, number>> // millions
  wageIncome: Money
  transferIncome: Money
  profitIncome: Money
  savings: Money
  /** the basket this cohort was AUTHORED with — the recipe, not what it buys.
   * `effectiveConsumptionWeights` is what the economy is subject to; read that
   * (ADR-0030). Sums to 1. */
  consumptionWeights: Record<SectorId, Ratio> // sums to 1
  /** real income per head at init, sealed. The Engel shift is measured against
   * the country's OWN 1946 standard of living, so the basket opens exactly
   * where its recipe put it and answers only to growth from there — the same
   * inherited-baseline rule as `environment.baseline` (ADR-0030). */
  engelReference: number
  /** the smoothed standard of living the Engel shift actually reads, PER HEAD.
   * Deliberately not `lastRealIncome / size`: that divides a lagging AGGREGATE
   * EMA by a current headcount, so a cohort the urbanisation flow is draining
   * looks richer than it is and one it is filling looks poorer — measured up to
   * 4% at its worst over a century, entirely from membership moving. Kept as
   * its own per-head EMA rather than re-basing `lastRealIncome`, because that
   * one IS the habitual income households spend against and the main damper of
   * the business cycle. */
  engelIncome: number
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
   * by capital share; it levers investment and sours in a crisis */
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
  spending: { transfers: Money; procurement: Money; investment: Money; research: Money }
  /** maximum annual immigration as a share of the resident population. This
   * clips arrivals only: a government cannot keep people in by closing it. */
  immigrationLimit: Ratio
  policyRate: number // annualized
  /** annualized central-bank asset purchases, as a share of annual GDP */
  assetPurchaseRate: Ratio
  /** bank equity required per unit of credit outstanding */
  capitalRequirement: Ratio
  subsidies: Partial<Record<SectorId, Money>>
}

/** The dials as they stood in one quarter — filed beside that quarter's
 * treasury books, and exact for the same reason: there is no fog on yourself.
 * A government that cannot remember what it set cannot be asked to answer for
 * it, and until this existed the only record of a rate was the rate now.
 *
 * `spending` is the money the economy actually got; `rules` is what was
 * VOTED — the two differ the moment an appropriation is indexed or written as
 * a share of GDP, and the difference is precisely the thing a player wants
 * back when they ask what their expenditure policy was.
 *
 * It extends `DialState` rather than restating it so a lever added to the
 * cabinet is recorded from the day it exists. Listing the fields here would
 * compile perfectly while quietly leaving a new dial out of the record — and
 * the omission would only surface years of game-time later, as a lever with
 * no history. `subsidies` is the one field that is widened: a `Partial` with
 * holes in it cannot be stacked or diffed. */
export interface PolicyRecord extends Omit<DialState, 'subsidies'> {
  /** total over `SECTOR_IDS`: an unset subsidy is 0, not absent, so a century
   * of them stacks without holes */
  subsidies: Record<SectorId, Money>
  /** the standing appropriation behind each `spending` figure. `value` is
   * money/quarter for fixed and indexed rules, a 0..1 share for GDP rules —
   * the same convention `setSpendingRule` takes. `votedAt` is what makes a
   * change log possible; see the note on `SpendingRule`. */
  rules: Record<SpendingProgramId, { mode: SpendingRuleMode; value: number; votedAt: Qtr }>
  /** the statute book as it stood, level and enactment quarter only.
   *
   * A total `Record`, so a statute added later joins the minute book without a
   * second list to keep in step — the same reason `subsidies` above is widened
   * from its `Partial`.
   *
   * Compliance is deliberately NOT here. The minute book files DECISIONS, and
   * compliance moves every quarter on its own as the civil service grows and
   * the blocs change their minds: filing it would report a policy change every
   * quarter for eighty years, and it would look entirely plausible in review.
   * That is the trap indexed appropriations sprang once already — see the note
   * on `SpendingRule.votedAt`. */
  statutes: Record<StatuteId, Statute>
}

export interface CapacityBuild {
  target: CapacityId
  perQtr: number // capacity points delivered per quarter
  moneyPerQtr: Money // budget outlay per quarter while building
  remaining: Qtr
}

export interface GovernmentState {
  dials: DialState
  /** Standing appropriations. `dials.spending` is the amount currently
   * resolved from these rules and remains the common input to the economy. */
  spendingRules: SpendingRules
  /** The rules the government has written, as opposed to the numbers it has
   * set (ADR-0027). What the economy is subject to is never what is stored
   * here — read it through `statuteForce`, never directly. */
  statutes: StatuteBook
  capacity: Record<CapacityId, Ratio>
  /** in-flight Layer-2 investments; capacity arrives with a lag */
  pipeline: CapacityBuild[]
  budget: { revenue: Money; outlays: Money; balance: Money }
  debt: Money
  /** cumulative money-financed deficit (the printing press) */
  printed: Money
}

// ---------- external ----------
/** One abstract foreign economy — a coarse model: an activity level
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
  /** productive capital owned abroad, in the same real units as Sector.capital.
   * It depreciates with the rest of the capital stock; new FDI adds to it and
   * the foreign share of after-tax profits leaves through the external account. */
  foreignOwnedCapital: Money
  /** the rest of world: partner cycles that drive prices and export demand */
  world: WorldState
  /** the crisis clock's live wires */
  shocks: {
    /** quarters of failed harvest still to run; 0 = no drought */
    droughtQtrsLeft: Qtr
    /** agri tfp multiplier applied while the drought runs (restored after) */
    droughtSeverity: number
  }
}

// ---------- the environment: what production costs outside the market ----------
/**
 * The externality (ADR-0028). One slow stock, plus the flow that feeds it.
 *
 * `pollution` is a burden index normalised so a standard 1946 country reads
 * about 1. It is PER HEAD rather than absolute, because land and area are not
 * modelled and an absolute tonnage would make a big country dirtier than a
 * small one purely by being big — meaningless to everything that reads it.
 * Per head it follows income and industrial structure instead, which is the
 * environmental Kuznets story arrived at rather than authored.
 *
 * It is a STOCK, chasing current emissions slowly, so a country that
 * industrialises hard carries the burden for decades after it stops and a
 * clean-up is a generation's work. That inertia is what makes this an
 * externality rather than a running cost.
 *
 * Nothing reads it directly. The damage arrives through two channels that
 * already existed — mortality in `demography`, and the drought hazard in
 * `shocks` — because "pollution reduces GDP" is the effect arrow this engine
 * exists to refuse.
 */
export interface EnvironmentState {
  /** pollution burden, standard 1946 country ≈ 1 */
  pollution: number
  /**
   * The burden this country INHERITED, sealed at init and never moved.
   *
   * Both damage channels read the excess over THIS, not over the standard
   * country's 1.0, and the distinction is not a detail: the catalogue opens
   * anywhere between 0.62 (agrarian Costona) and 1.57 (industrial Veltravia),
   * so a global threshold charged Veltravia excess mortality and a 12% higher
   * drought hazard in 1946Q1 — before it had industrialised at all — for the
   * authored structure of its recipe rather than for anything a player did.
   *
   * That penalty was invisible in the passive baseline because the baseline is
   * measured on Meridia, which IS the reference country and opens at exactly
   * 1.0. Same shape as `demography.migrationBaselineWelfare`: a country
   * anchor, kept separate from a global one, because the mechanic is about
   * what this government did to this country.
   */
  baseline: number
  /** this quarter's emissions per head, in the same index — what the stock
   * chases. Kept for inspection and for the fogged instrument. */
  emissionsQ: number
}

// ---------- technology: two trees and the gap ----------
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
  /** the research base: accumulated appropriations that are still delivering,
   * as a share of quarterly GDP. Laboratories and trained people outlive the
   * cheque that bought them, so this decays rather than resets — a programme
   * coasts through a bad budget year, and strangling one takes a while to
   * show up in anything the player can see. */
  researchStock: number
}

// ---------- the financial sector: fragility ----------
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

// ---------- institutions and the Narrow Corridor ----------
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
  /** Corridor y-axis — society's capacity to organize and constrain the state.
   * Slow: it tracks a target set by franchise, organization, education,
   * urbanization, inequality and the boot, at a generation's pace. */
  societalPower: Ratio
  /** Corridor x-axis — the Leviathan: the ministries you built, plus the
   * coercive arm repression buys */
  statePower: Ratio
  /** Revolutionary pressure, 0..1. High pressure prises open reforms
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
  /** mandates taken by force rather than consent — graded separately */
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
  inflationExpectations: number // annualized and adaptive
  debtToGdp: number // cached
  /** animal spirits, 0..1 with 0.55 neutral — surveyed only if you fund it */
  confidence: { consumer: Ratio; business: Ratio }
}

// ---------- the statistics office (lives INSIDE the state so politics reads the fog) ----------
export interface StatPrint {
  forQtr: Qtr // period measured
  publishedAt: Qtr // period released (lag = publishedAt − forQtr)
  value: number
  revision: number // 0 = first print
  errorBand: number // half-width; 0 = the office can't even estimate it
  /** GDP only: the office's level estimates behind the growth print */
  levels?: { real: number; nominal: number }
}

/** What a wire item IS, independent of how it is worded.
 *
 * The finance overlay used to find banking crises by matching
 * `/banking crisis|sudden stop/i` against `text`, which meant the crisis
 * markers on every chart were one copy-edit away from silently vanishing —
 * and silently is the whole problem: a chart with no markers looks exactly
 * like a century with no crises. So an event names itself, and the prose is
 * free to change.
 *
 * `kind` is REQUIRED, so a new wire item cannot ship without joining this
 * list, and anything filtering the wire fails to compile rather than quietly
 * missing the event it was built to catch. */
export const NEWS_KINDS = [
  // finance
  'banking_crisis',
  'banking_recovery',
  'asset_bubble',
  // the world outside
  'partner_crisis',
  'partner_boom',
  'partner_slump',
  // shocks
  'drought_begins',
  'drought_ends',
  'fuel_shock',
  // the constitution
  'corridor_exit',
  'corridor_return',
  'reform_window',
  // the government's tenure
  'revolt',
  'coup',
  'election',
  // the economy at large
  'breakthrough',
  /** the statistical office's rumor mill — a fogged hint, not an event */
  'rumor',
] as const
export type NewsKind = (typeof NEWS_KINDS)[number]

export interface NewsItem {
  tick: Qtr
  text: string
  tone: 'good' | 'bad' | 'neutral'
  kind: NewsKind
}

/** The two tables one census release carries. A `const` tuple like every
 * other id list here, so the band record, the noise table in `statistics.ts`
 * and the overlay's lens all index the same keys — a table added without a
 * noise constant or a printed name fails the build rather than borrowing its
 * neighbour's band. */
export const INDUSTRY_TABLE_IDS = ['valueAdded', 'employment'] as const
export type IndustryTableId = (typeof INDUSTRY_TABLE_IDS)[number]

/**
 * One quarter of the industrial census, exactly as the office released it —
 * the PRODUCTION side of the same output the headline measures. `gdp_growth`
 * says the economy grew; this says which industries grew it and who they put
 * to work, which is the only form in which the question "what kind of country
 * is this becoming" can be asked.
 *
 * It is a vector rather than a family of indicators on purpose. Five sectors
 * times two tables is ten dials, and the wall has room for six more strips in
 * total; more to the point, a sector share has no honest FIXED dial face
 * (ADR-0006) when the countries in the catalogue open anywhere between 5% and
 * 60% agricultural. The census is paperwork, so it is read as paperwork.
 *
 * Each industry is estimated separately, so the parts do NOT sum to the
 * published GDP and the employment column does not sum to the published
 * payrolls — the same confession the expenditure accounts make. The
 * composition views renormalize rather than pretend otherwise.
 */
export interface IndustryPrint {
  forQtr: Qtr // period measured
  publishedAt: Qtr // period released
  revision: number // 0 = first print
  /** Half-width the office confesses on each table, as a FRACTION of each
   * figure — the industries differ by an order of magnitude in size, so one
   * absolute band honest about services would print energy negative. 0 means
   * the office cannot even estimate its error, which is a shrug and must
   * never be shown as certainty.
   *
   * ONE BAND PER TABLE, because the two are surveyed to different accuracy: an
   * enumerator can count heads at a factory gate and has to estimate what the
   * factory made. A single band would overstate the employment survey's
   * uncertainty by half at every capacity — the office confessing an error it
   * did not make. */
  errorBand: Record<IndustryTableId, number>
  /** real value added at base prices, by industry. The truth behind this sums
   * exactly to real GDP; these estimates do not. */
  valueAdded: Record<SectorId, Money>
  /** people at work, millions, by industry */
  employment: Record<SectorId, number>
}

/**
 * One household-budget survey release. The poverty-rate headline is a normal
 * scalar indicator on the wall; this vector is the paperwork behind it: how
 * national income is divided among five equal population groups, how much
 * each fifth receives against the 1946 national mean, and how far below the
 * basic-needs line the poor remain.
 *
 * The five figures are derived from the engine's socioeconomic cohorts but
 * never expose those cohorts. They are lagged, noisy and revised like every
 * other survey, and their shares sum to one because one release ranks and
 * reconciles one set of household returns.
 */
export interface HouseholdSurveyPrint {
  forQtr: Qtr
  publishedAt: Qtr
  revision: number
  /** fractional half-width around each quintile income estimate; zero is the
   * office's usual "cannot yet estimate the error" shrug */
  incomeErrorBand: Ratio
  /** absolute half-width around the poverty-gap ratio */
  povertyGapErrorBand: Ratio
  /** each quintile's real disposable income per head, national 1946 mean=100 */
  incomeReal: Record<IncomeQuintileId, number>
  /** share of total real disposable household income received by each fifth */
  incomeShare: Record<IncomeQuintileId, Ratio>
  /** mean normalized shortfall below the poverty line, counting non-poor as zero */
  povertyGap: Ratio
  /** fixed basic-needs line in the same national-1946-mean index as incomeReal */
  povertyLine: number
}

/** One quarter's measurable truth, filed at measurement time. The office
 * revises against THIS worksheet later — and the capacity that existed when
 * the quarter happened decides forever whether it was surveyed at all. */
export interface StatRecord {
  tick: Qtr
  realGdp: Money
  nominalGdp: Money
  /** annualized real national output per person */
  realGdpPerCapita: number
  /** annualized real household consumption per person, own baskets deflated */
  realConsumptionPerCapita: number
  /** disposable income not consumed this quarter; may be negative in a drawdown */
  householdSavingRate: number
  /** the expenditure side of the accounts, as shares of TOTAL FINAL
   * EXPENDITURE (household consumption + capital formation + government
   * final consumption + gross exports, all real at base prices). Every
   * component is non-negative, so a pie can say them; they sum to 1 in the
   * truth and only approximately in the prints, because the office surveys
   * each one separately.
   *
   * Capital formation is booked as investment whoever paid for it — the
   * question "is this an investment economy" does not care whether the
   * concrete was poured by a firm or a ministry — so `governmentShare` is
   * the state's final CONSUMPTION (delivered procurement) alone. Transfers
   * and subsidies are not final demand: they finance the household and firm
   * spending already counted here, and double-counting them would make the
   * state's footprint look twice its size. Imports are netted inside the
   * Leontief solve, not booked as a negative claim. */
  consumptionShare: Ratio
  investmentShare: Ratio
  governmentShare: Ratio
  exportShare: Ratio
  /** inward direct-investment flow divided by quarterly nominal GDP. The
   * conventional annualized numerator and denominator have the same ratio. */
  foreignDirectInvestmentShare: Ratio
  inflationQ: number
  unemployment: Ratio
  /** labor force as a share of the whole census population. This is the
   * LF / population term in the exact per-capita growth identity; unlike the
   * live head count, the published share comes from the labour force survey. */
  laborForceParticipation: Ratio
  /** workforce knowledge and skills, filed by the education/labour census */
  humanCapital: Ratio
  payrolls: number // millions, ex-agri
  /** annualized real output per employed person, economy-wide and INCLUDING
   * agriculture. The published indicator indexes it against its own 1946
   * value; the level is kept here because it is the honest thing to file.
   *
   * Economy-wide is the deliberate choice, and it is the opposite of the
   * `payrolls` convention beside it. The subsistence valve keeps the
   * impoverished nominally employed in the fields, so an ex-agri productivity
   * series would quietly delete the dual-economy drag — the exact fact this
   * instrument exists to show. A country that industrializes moves people from
   * a sector with low output per head to one with high output per head, and
   * this number is supposed to notice. */
  labourProductivity: number
  capitalTotal: Money
  /** the industrial census's worksheet: real value added at base prices and
   * heads at work, by industry. Value added sums to `realGdp` exactly — it is
   * the same GDP read down the production side rather than the expenditure
   * side — and employment sums to the whole employed workforce, of which
   * `payrolls` above is the ex-agricultural part. */
  industry: Record<SectorId, { valueAdded: Money; employment: number }>
  /** output-weighted domestic technique relative to the sector-adjusted world frontier */
  technologyAttainment: number
  confConsumer: Ratio
  confBusiness: Ratio
  /** enfranchisement-weighted approval — what a pollster would find */
  approvalIndex: Ratio
  /** consumer-facing prices off the market boards (fuel includes the excise) */
  priceFood: number
  priceFuel: number
  /** income Gini across cohorts, 0..1 — what a household survey would find */
  gini: Ratio
  /** real household income per head, population-weighted, base-year units.
   * A LEVEL here; the published indicator indexes it against its own 1946
   * value. The level is the thing the Gini beside it cannot carry. */
  incomeMeanReal: Money
  /** share below the fixed real basic-needs line */
  povertyRate: Ratio
  /** mean normalized shortfall below that line, non-poor counted as zero */
  povertyGap: Ratio
  /** the five equal-population groups behind the household-budget survey */
  incomeQuintileReal: Record<IncomeQuintileId, Money>
  incomeQuintileShare: Record<IncomeQuintileId, Ratio>
  /** period life expectancy at birth from the age-specific mortality schedule */
  lifeExpectancy: number
  /** crude birth/death rates (per 1000/yr) — what a civil registrar records */
  birthRate: number
  deathRate: number
  /** registered net migration, annualized per 1,000 residents */
  netMigrationRate: number
  /** the exact head count and age pyramid this quarter — census-grade, no
   * fog: you can always count people, even when you can't survey them */
  population: number
  pyramid: number[]
  /** where those heads live, in millions — the other question a census form
   * asks, and exact for the same reason. `rural + urban` is the population
   * the register classifies (the under-60s), NOT `population`: see
   * `derive.residence` for why the 60+ are counted by age alone rather than
   * split at the working-age rate. The occupational structure behind the
   * split stays fogged — a labour survey estimates that. */
  residence: { rural: number; urban: number }
  /** terms of trade: world price of your export basket ÷ your import basket,
   * indexed to 1946=100 — what the customs statisticians would compile */
  termsOfTrade: number
  /** Tobin's q × 100: market valuation per unit of replacement-cost capital */
  assetPrice: number
  /** credit outstanding / annual GDP — what a bank supervisor would tabulate */
  creditToGdp: number
  /** bank capital ÷ credit outstanding: the banking system's own buffer,
   * filed as the RATIO rather than the level because the ratio is the number
   * a supervisor publishes and the only one directly comparable to the
   * `capitalRequirement` floor the government sets. A level would have to be
   * divided by a fogged GDP before it could be read against the dial. */
  bankCapitalRatio: Ratio
  /** the pollution burden, standard 1946 country = 1 — what an environmental
   * monitoring service would find in the air. Fogged like everything else,
   * and unmeasurable at all until somebody funds the monitors. */
  pollution: number
  /** revolutionary pressure, 0..1 — what the provincial governors' reports
   * would add up to if anyone collated them. Fogged like everything
   * else: a state that cannot survey its own people cannot see the street. */
  unrest: Ratio
  /** The corridor's two coordinates. Exact, not fogged: a government
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
  /** and the dials that were in force while all of the above happened —
   * exact, unrevised, and the only record of them that survives the quarter */
  policy: PolicyRecord
}

export interface StatsOffice {
  /** raw worksheets, one per quarter, appended by the statistics step */
  record: StatRecord[]
  /** everything ever published, in publication order */
  series: Partial<Record<IndicatorId, StatPrint[]>>
  /** the industrial census, in publication order. A vector release rather
   * than an `IndicatorId`, for the reasons on `IndustryPrint`. */
  industry: IndustryPrint[]
  /** household-budget survey releases, in publication order. Quintiles are a
   * vector rather than five separate wall indicators (ADR-0030). */
  households: HouseholdSurveyPrint[]
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
  /** the foreign-financed part of investment, in real capital-goods units */
  foreignDirectInvestmentReal: number
  /** the same inward flow at current capital-goods prices, for the balance of payments */
  foreignDirectInvestmentValue: Money
  /** after-tax profits paid to foreign owners this quarter */
  foreignProfitRemittances: Money
  /** the public half of `investmentReal`, at base prices. Split out because
   * the expenditure accounts book capital formation as investment whoever
   * pays for it, so government FINAL CONSUMPTION is the rest of the state's
   * demand — `governmentDomesticDemandReal` minus this. */
  publicInvestmentReal: number
  /** household consumption + domestically financed private investment, at base prices */
  privateDomesticDemandReal: number
  /** delivered procurement + public investment + research, at base prices */
  governmentDomesticDemandReal: number
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
    /** part of the replay contract: a protected run must reload protected */
    rules: GameRules
    /** The quarter the PLAYER takes office. Zero is the ordinary 1946 posting;
     * a later appointment means the quarters before it were governed by a
     * caretaker administration and belong to somebody else's record (ADR-0021).
     * A replay input like `rules`, sealed into the save, because the same
     * country, seed, and action log produce a different century without it. */
    appointedAt: Qtr
  }
  params: CountryParams
  demography: DemographyState
  /** what production costs outside the market (ADR-0028) */
  environment: EnvironmentState
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
  /** Prosperity: cumulative discounted welfare, accumulated as the run
   * happens — a scorched-earth sprint to 2049 must not score */
  score: {
    /** Σ β^t · (population-weighted mean log real consumption per capita) */
    discountedWelfare: number
    discountWeight: number // Σ β^t, for normalizing to an average
    /** welfare inherited at the appointment (mean log), the report-card yardstick */
    baselineWelfare: number | null
    /** Position: quarters of your tenure spent inside the corridor, and
     * the tenure they are counted against. Accumulated as the run happens for
     * the same reason welfare is — the path is the grade, not the endpoint. */
    corridorQuarters: number
    governedQuarters: number
  }
  flows: TickFlows
}

// v11 was the disaggregated budget, which landed on master while this was in
// flight; politics-as-a-game therefore becomes v12.
export const SCHEMA_VERSION = 38 // v38: publish period life expectancy at birth
export const ENGINE_VERSION = '0.1.0'
export const ELECTION_PERIOD = 16 // quarters
/** the campaign opens this many quarters before the vote: the scene needs a
 * turn of its own, or the choice is made in the same breath as the result */
export const CAMPAIGN_WINDOW = 2
/** 1946Q1 + 416 quarters = 2050: the historians close the book */
export const END_OF_HISTORY_TICK = 416
/** Quarter zero. The engine counts quarters, not dates — this is the one place
 * that knows which year quarter zero is, and the only reason it needs to is the
 * frontier's growth schedule (`FRONTIER_ERAS`), which is written in calendar
 * years because the history it imitates was. */
export const FIRST_YEAR = 1946

export const yearOfTick = (tick: Qtr): number => FIRST_YEAR + Math.floor(tick / 4)

/** The first quarter of a calendar year. Unclamped: callers that take a year
 * from a player or a save clamp it themselves (`appointmentTick`). */
export const tickForYear = (year: number): Qtr => (Math.floor(year) - FIRST_YEAR) * 4

/** The last quarter a government can be appointed in and still have a tenure:
 * the book closes at `END_OF_HISTORY_TICK`, and a run needs at least one
 * quarter on the near side of it to bank a welfare baseline and be graded. */
export const LAST_APPOINTMENT_TICK = END_OF_HISTORY_TICK - 1

/** Bring an arbitrary quarter back into the playable century. Anything the
 * engine is handed becomes a legal appointment or it becomes 1946 — a save
 * naming quarter 900, or NaN, must not open a game whose player never arrives.
 * Lives here rather than beside the interregnum so `init` and its callers
 * cannot disagree about what a legal appointment is.
 *
 * It clamps to `LAST_APPOINTMENT_TICK`, not to the end of history, and the
 * distinction is the whole point of the function: an appointment ON the closing
 * quarter arrives to a ledger that has already shut, so nothing accumulates,
 * `baselineWelfare` stays null, `reportCardOf` can never return a verdict — and
 * the government stays in power, advancing quarters past 2050 in a run that
 * cannot end. Arriving one quarter early is a one-quarter tenure, which is a
 * bad posting rather than a broken one. */
export function appointmentTick(tick: number): Qtr {
  if (!Number.isFinite(tick)) return 0
  return Math.max(0, Math.min(LAST_APPOINTMENT_TICK, Math.floor(tick)))
}

export function sectorIndex(id: SectorId): number {
  return SECTOR_IDS.indexOf(id)
}
