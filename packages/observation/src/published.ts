/**
 * PublishedState — the ONLY types the ui package may import (§3.1).
 * Everything here is what a government of the period could actually know:
 * its own dials and books exactly, the economy only through its statistical
 * apparatus, plus rumors. The prints themselves are made in the engine's
 * statistics step (they must be — politics reads them); this package owns
 * their presentation.
 */

import type {
  BlocId,
  CapacityId,
  DialState,
  ElectionResult,
  GameRules,
  HouseholdSurveyPrint,
  IndicatorId,
  IndustryPrint,
  InstitutionId,
  NewsItem,
  OutlaySplit,
  PlatformId,
  PolicyRecord,
  Qtr,
  Ratio,
  RevenueSplit,
  SectorId,
  StatPrint,
  StatuteId,
  SpendingRules,
} from '@terrarium/engine'


export {
  INDICATOR_IDS,
  INCOME_QUINTILE_IDS,
  INDUSTRY_TABLE_IDS,
  SECTOR_IDS,
  OUTLAY_IDS,
  REVENUE_SOURCE_IDS,
  BLOC_IDS,
  INSTITUTION_IDS,
  PLATFORM_IDS,
  GAME_RULE_IDS,
  STANDARD_RULES,
  STATUTE_IDS,
  STATUTE_LEVELS,
} from '@terrarium/engine'
export type { GameRuleId, GameRules } from '@terrarium/engine'
export type { OutlayId, OutlaySplit, RevenueSourceId, RevenueSplit } from '@terrarium/engine'
export type { SpendingProgramId, SpendingRuleMode } from '@terrarium/engine'
export type { IndicatorId, NewsItem, BlocId, InstitutionId, PlatformId, ElectionResult, PolicyRecord, SectorId }
export type { IncomeQuintileId, IndustryTableId, Statute, StatuteId } from '@terrarium/engine'

/** One quarter of the government's own record of itself. */
export type PolicyPoint = PolicyRecord & { tick: Qtr }

/** A published figure, exactly as the office released it. */
export type IndicatorPoint = StatPrint

export interface IndicatorSeries {
  id: IndicatorId
  label: string
  unit: string
  points: IndicatorPoint[]
}

/** One release of the industrial census — the production side of the same
 * output the headline measures, by industry. Fogged like everything the office
 * compiles: lagged, noisy, revised, and absent entirely until the
 * establishment survey is funded. See `IndustryPrint` in the engine for why
 * this is a vector release rather than a family of indicators. */
export type IndustryPoint = IndustryPrint

/** One fogged household-budget survey release. */
export type HouseholdIncomePoint = HouseholdSurveyPrint

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

/** The historians' verdict. Axes are graded separately, never summed.
 * Only exists once the run is over — no mid-run truth leak. */
export interface ReportCard {
  endedBy: 'deposition' | 'history' // history = the book closes at 2050
  quartersGoverned: Qtr
  electionsWon: number
  /** discounted geometric-mean real consumption per person per quarter */
  prosperity: number
  /** prosperity relative to the standard of living inherited on the day the
   * player took office — 1946 on an ordinary posting, later on an ADR-0021 one */
  vsBaseline: number
  /** annualized welfare growth over the tenure, %/yr — what gets graded */
  prosperityRate: number
  prosperityGrade: Grade
  /** consent: survival to 2050 or mandates won before the fall */
  legitimacyGrade: Grade
  /** mandates taken rather than won — shown beside the count, never netted
   * into it (elections won vs elections suppressed is visible) */
  electionsSuppressed: number
  /** Position: the share of your tenure spent inside the corridor, and
   * where the dot finished. The path, not the endpoint. */
  corridorShare: number
  finalStatePower: number
  finalSocietalPower: number
  positionGrade: Grade
  /** how the run ended — the street and the palace are not the ballot box */
  deposedBy: 'poll' | 'revolt' | 'coup' | null
}

/**
 * One statute, as the government's own law officers would report it. Exact,
 * not fogged, and deliberately so: every input to `compliance` — the civil
 * service, the courts, and each bloc's power and favour — is already published
 * unfogged, so a player with a pencil could derive this figure from what the
 * desk already shows. Publishing it leaks nothing (ADR-0027).
 *
 * The gap between `level` and `inForce` is the thing this whole register
 * exists to say: what you wrote, against what the country is actually subject
 * to. A statute posted by a government with no inspectorate shows a full level
 * and almost no force, which is the same lesson `taxEfficiency` teaches about
 * a posted rate.
 */
export interface PublishedStatute {
  id: StatuteId
  /** which rung of the ladder is posted; 0 is no statute */
  level: number
  /** the ladder itself, so the desk can name every rung it offers */
  levels: readonly { name: string; strength: number }[]
  /** the quarter this level was written; null when nothing has been enacted */
  enactedAt: Qtr | null
  /** what share of the posted rule the country obeys, 0..1 */
  compliance: Ratio
  /** what the economy is actually subject to: posted strength × compliance ×
   * phase-in. Below `strength × compliance` while a change is still arriving. */
  inForce: number
  /** what a move to each rung would cost right now — entrenchment premium and
   * veto premium already applied, and null for a rung not on offer (the one
   * it is already on). Straight from `politicalCostOfAction`, so the quote
   * cannot drift from the charge. */
  cost: readonly (number | null)[]
  /** who is declining to obey it, and how much of the shortfall each accounts
   * for. The whip count for a law rather than a lever. */
  resistance: readonly { bloc: BlocId; weight: number }[]
}

/** A veto player, as the government's own whip count sees it. Exact, not
 * fogged: you always know who is in the room. */
export interface PublishedBloc {
  id: BlocId
  /** clout, 0..1 — read off the economy this bloc owns */
  power: Ratio
  /** how it feels about you, −1..1 */
  favor: number
  /** power after an organized society's check — what actually prices levers */
  effectivePower: Ratio
}

/** The Narrow Corridor, live. Exact: a government knows which ministries it
 * built and which liberties it granted. */
export interface PublishedCorridor {
  statePower: number
  societalPower: number
  /** state − society. Positive is toward despotism, negative toward anarchy */
  offset: number
  halfWidth: number
  inCorridor: boolean
  /** the traced path, one point per quarter */
  trail: Array<{ tick: Qtr; x: number; y: number }>
}

/** The campaign now open, if one is. */
export interface PublishedCampaign {
  quartersToElection: Qtr
  /** what the platform already committed to is, once it is announced */
  committed: { platform: PlatformId; bloc: BlocId | null; swing: number } | null
  /** enfranchisement-weighted approval as it stands — the ballot-box number */
  support: number
  /** the bar to clear; repression lowers it */
  threshold: number
}

export interface PublishedState {
  tick: Qtr
  /** The quarter the player took office — zero for an ordinary 1946 posting,
   * a later quarter when the years before it were somebody else's (ADR-0021).
   * Published because it is the baseline every "since you arrived" reading on
   * the desk is measured from, the report card's included. */
  appointedAt: Qtr
  country: string
  /** True when the posting was written by a player rather than drawn from the
   * recipe catalogue. Nothing in the simulation reads it; the wall and the
   * report card do, so a grade earned on a country nobody has balanced is not
   * quietly filed beside grades earned on ones that were. */
  countryAuthored: boolean
  /** exact opening rules: the government knows which safeties are on */
  rules: GameRules
  /** only funded indicators appear at all — unless `rules.fullInstrumentation` */
  indicators: Partial<Record<IndicatorId, IndicatorSeries>>
  /** the industrial census, in publication order — value added and heads at
   * work by industry. Empty until the establishment survey is funded
   * (`INDUSTRY_CENSUS_FUNDED_AT`), which is the same thing every other
   * unfunded survey says: the country has industries, the ministry has no
   * means of counting them apart. */
  industry: IndustryPoint[]
  /** Household-budget survey, absent until the same enumerators that produce
   * the Gini are funded. Five equal population bins, never true cohorts. */
  households: HouseholdIncomePoint[]
  /** you always know your own settings */
  dials: DialState
  /** the statute book: the rules you have written, what each is costing to
   * change, and how much of each the country is actually obeying */
  statutes: readonly PublishedStatute[]
  /** Exact standing appropriations; the economic denominator remains fogged. */
  spendingRules: SpendingRules
  /** the treasury keeps exact books on itself — including *which* tax paid
   * for *which* programme, the question a headline balance cannot answer */
  treasury: {
    revenue: number
    outlays: number
    balance: number
    debt: number
    printed: number
    revenueBySource: RevenueSplit
    outlaysByProgramme: OutlaySplit
  }
  capacity: Record<CapacityId, number>
  capacityBuilding: Array<{ target: CapacityId; remaining: Qtr }>
  /** the treasury's own books, every quarter, exact — no fog on yourself */
  books: Array<{
    tick: Qtr
    revenue: number
    outlays: number
    balance: number
    debt: number
    reserves: number
    /** the composition, quarter by quarter: a century of it is the only way
     * to see a tax base erode or an interest bill eat the budget */
    revenueBySource: RevenueSplit
    outlaysByProgramme: OutlaySplit
  }>
  /** Census-grade facts: the transition is the century. */
  population: { total: number; laborForce: number; pyramid: number[] }
  /** the census over time — exact head counts and age pyramids, one per
   * quarter, no fog (heads are countable even when surveys aren't funded) */
  census: Array<{ tick: Qtr; population: number; pyramid: number[] }>
  /** every quarter's dials, exact — the government's minute book. `dials`
   * above is only the current row of this, and a rate you set twenty quarters
   * ago is otherwise unrecoverable. Deliberately carries no denominator: the
   * appropriations are money, because the GDP you would divide them by is
   * fogged and belongs to the indicators. */
  policy: PolicyPoint[]
  reserves: number
  exchangeRate: number
  politicalCapital: number
  quartersToElection: number
  inPower: boolean
  electionsWon: number
  electionsSuppressed: number
  news: NewsItem[]
  /** Institutional stocks you can reform, and what reform costs today. */
  institutions: Record<InstitutionId, Ratio>
  /** revolutionary pressure as the government judges it. Note this is the
   * TRUE value: the fogged, published version is the `unrest` indicator, and
   * the gap between them is the point — this one is only used to price
   * reforms and warn, never to draw the instrument. */
  reformWindowOpen: boolean
  /** PC each reform would cost right now, veto premium and window discount
   * already applied — the whip count made legible */
  reformCost: Record<InstitutionId, { up: number | null; down: number | null }>
  blocs: PublishedBloc[]
  /** a bloc courted at the last election still has its claim on you */
  pledge: { bloc: BlocId; quartersLeft: Qtr } | null
  corridor: PublishedCorridor
  /** Non-null only while a campaign is open. */
  campaign: PublishedCampaign | null
  /** the last election, for the results scene */
  lastElection: ElectionResult | null
  /** present only when the run has ended (deposition or 2050) */
  reportCard?: ReportCard
}
