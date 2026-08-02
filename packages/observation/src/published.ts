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
  IndicatorId,
  InstitutionId,
  NewsItem,
  PlatformId,
  Qtr,
  Ratio,
  StatPrint,
} from '@terrarium/engine'

export { INDICATOR_IDS, BLOC_IDS, INSTITUTION_IDS, PLATFORM_IDS } from '@terrarium/engine'
export type { IndicatorId, NewsItem, BlocId, InstitutionId, PlatformId, ElectionResult }

/** A published figure, exactly as the office released it. */
export type IndicatorPoint = StatPrint

export interface IndicatorSeries {
  id: IndicatorId
  label: string
  unit: string
  points: IndicatorPoint[]
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

/** §3.3: the historians' verdict. Axes are graded separately, never summed.
 * Only exists once the run is over — no mid-run truth leak. */
export interface ReportCard {
  endedBy: 'deposition' | 'history' // history = the book closes at 2050
  quartersGoverned: Qtr
  electionsWon: number
  /** discounted geometric-mean real consumption per person per quarter */
  prosperity: number
  /** prosperity relative to the 1946 standard of living */
  vsBaseline: number
  /** annualized welfare growth over the tenure, %/yr — what gets graded */
  prosperityRate: number
  prosperityGrade: Grade
  /** consent: survival to 2050 or mandates won before the fall */
  legitimacyGrade: Grade
  /** mandates taken rather than won — shown beside the count, never netted
   * into it (§3.3: elections won vs elections suppressed is visible) */
  electionsSuppressed: number
  /** §3.3 Position: the share of your tenure spent inside the corridor, and
   * where the dot finished. The path, not the endpoint. */
  corridorShare: number
  finalStatePower: number
  finalSocietalPower: number
  positionGrade: Grade
  /** how the run ended — the street and the palace are not the ballot box */
  deposedBy: 'poll' | 'revolt' | 'coup' | null
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

/** §6.3 — the corridor, live. Exact: a government knows which ministries it
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

/** The campaign now open, if one is (§3.1: the election is a scene). */
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
  country: string
  /** only funded indicators appear at all */
  indicators: Partial<Record<IndicatorId, IndicatorSeries>>
  /** you always know your own settings */
  dials: DialState
  /** the treasury keeps exact books on itself */
  treasury: {
    revenue: number
    outlays: number
    balance: number
    debt: number
    printed: number
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
  }>
  /** census-grade facts — live from M4 on: the transition is the century */
  population: { total: number; laborForce: number; pyramid: number[] }
  /** the census over time — exact head counts and age pyramids, one per
   * quarter, no fog (heads are countable even when surveys aren't funded) */
  census: Array<{ tick: Qtr; population: number; pyramid: number[] }>
  reserves: number
  exchangeRate: number
  politicalCapital: number
  quartersToElection: number
  inPower: boolean
  electionsWon: number
  electionsSuppressed: number
  news: NewsItem[]
  /** §4.3 Layer 3 — the stocks you can reform, and what reform costs today */
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
  /** non-null only while a campaign is open (§3.1) */
  campaign: PublishedCampaign | null
  /** the last election, for the results scene */
  lastElection: ElectionResult | null
  /** present only when the run has ended (deposition or 2050) */
  reportCard?: ReportCard
}
