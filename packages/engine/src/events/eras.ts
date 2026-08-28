/**
 * The century has six presses, and the paper on the desk in 2043 is not the
 * paper that was on it in 1947.
 *
 * This is the answer to the oldest complaint about the wire: a dispatch that
 * reads the same in the first quarter and the four-hundredth makes a hundred
 * years feel like one. An era selects COPY and nothing else — no threshold, no
 * hazard and no economic quantity is read from this table, which is why it
 * lives beside the prose it selects rather than in `constants.ts` with the
 * behavioural constants (ADR-0007). If you ever find yourself reaching for
 * `eraAt()` inside a pipeline step's arithmetic, you have found a mechanic
 * pretending to be a masthead; put the number in `constants.ts` instead.
 *
 * Era boundaries are chosen to sit on the same joints the rest of the game
 * already bends at — `FRONTIER_ERAS` and the postings in `APPOINTMENTS` — so a
 * player who takes office in 1973 opens a paper that has just changed its
 * typeface.
 */

import { yearOfTick } from '../state/schema'
import type { DeskId } from './ids'

export const PRESS_ERA_IDS = ['wireless', 'boom', 'crisis', 'market', 'network', 'stream'] as const
export type PressEraId = (typeof PRESS_ERA_IDS)[number]

export interface PressEra {
  id: PressEraId
  /** first YEAR this press is on the streets */
  fromYear: number
  /** what the age called itself, for the archive's era rail */
  label: string
}

/**
 * Ordered, earliest first. `eraAt` walks backwards, so the last entry whose
 * `fromYear` has arrived wins and the table is extended by appending.
 */
export const PRESS_ERAS: readonly PressEra[] = [
  { id: 'wireless', fromYear: 1946, label: 'The Wireless Age' },
  { id: 'boom', fromYear: 1958, label: 'The Long Boom' },
  { id: 'crisis', fromYear: 1973, label: 'The Years of Crisis' },
  { id: 'market', fromYear: 1985, label: 'The Market Age' },
  { id: 'network', fromYear: 1995, label: 'The Network Age' },
  { id: 'stream', fromYear: 2012, label: 'The Feed' },
]

/** Which press is on the streets in a given year. Clamps below the first era
 * rather than returning null: a save written before the table existed, or a
 * tick somehow before 1946, still has to print something. */
export function eraAtYear(year: number): PressEraId {
  let found: PressEraId = PRESS_ERAS[0].id
  for (const era of PRESS_ERAS) if (year >= era.fromYear) found = era.id
  return found
}

export const eraAtTick = (tick: number): PressEraId => eraAtYear(yearOfTick(tick))

/** Index of an era in `PRESS_ERAS`, for walking backwards to inherited copy. */
export function eraOrdinal(era: PressEraId): number {
  return PRESS_ERAS.findIndex((e) => e.id === era)
}

/**
 * Who files the story.
 *
 * A masthead is not decoration here: it is the one place the wire says out
 * loud what the press-freedom stock has been doing. Below `PRESS_CAPTURED_AT`
 * the independent titles stop appearing and the same events arrive over the
 * state's own wire service — the reader learns that they are being TOLD the
 * news rather than shown it, which is information the instruments cannot
 * carry.
 *
 * Load-bearing: the outlet changes, the dispatch does NOT. A captured press
 * never suppresses an event, never softens a tone and never drops a `kind`.
 * `ui/src/finance.ts` reads crisis episodes off `NewsItem.kind`, and a chart
 * with no markers looks exactly like a century with no crises — so the moment
 * press freedom could delete a dispatch, every downstream reader of the wire
 * would silently become a reader of the government's opinion of the wire.
 */
export interface OutletRoster {
  /** what an unmuzzled press is called in this age */
  independent: string[]
  /** and what replaces it when the government owns the presses */
  official: string[]
  /** desks with a specialist title of their own; the general list otherwise */
  byDesk?: Partial<Record<DeskId, string[]>>
}

export const OUTLETS: Record<PressEraId, OutletRoster> = {
  wireless: {
    independent: ['THE DAILY RECORD', 'THE MORNING POST', 'THE NATIONAL HERALD'],
    official: ['MINISTRY OF INFORMATION', 'THE STATE GAZETTE', 'OFFICIAL BULLETIN'],
    byDesk: {
      finance: ['THE COMMERCIAL ADVERTISER'],
      land: ['THE COUNTRY WEEKLY'],
      labour: ['THE WORKERS’ CHRONICLE'],
      abroad: ['FOREIGN DESPATCHES'],
    },
  },
  boom: {
    independent: ['THE DAILY RECORD', 'THE EVENING STANDARD-BEARER', 'THE NATIONAL HERALD'],
    official: ['THE STATE GAZETTE', 'NATIONAL BROADCASTING NEWS', 'OFFICIAL BULLETIN'],
    byDesk: {
      finance: ['THE COMMERCIAL ADVERTISER', 'THE INVESTORS’ GAZETTE'],
      land: ['THE COUNTRY WEEKLY'],
      labour: ['THE WORKERS’ CHRONICLE'],
      science: ['SCIENCE AND INDUSTRY'],
    },
  },
  crisis: {
    independent: ['THE DAILY RECORD', 'THE NATIONAL HERALD', 'THE EVENING DESPATCH'],
    official: ['THE STATE GAZETTE', 'NATIONAL BROADCASTING NEWS', 'CENTRAL NEWS AGENCY'],
    byDesk: {
      finance: ['THE FINANCIAL RECORD'],
      labour: ['THE WORKERS’ CHRONICLE', 'THE PICKET'],
      abroad: ['WORLD SERVICE'],
      science: ['SCIENCE AND INDUSTRY'],
    },
  },
  market: {
    independent: ['THE DAILY RECORD', 'THE NATIONAL HERALD', 'THE CITY TELEGRAPH'],
    official: ['THE STATE GAZETTE', 'NATIONAL BROADCASTING NEWS', 'CENTRAL NEWS AGENCY'],
    byDesk: {
      finance: ['THE FINANCIAL RECORD', 'MARKET WATCH'],
      industry: ['THE TRADE JOURNAL'],
      abroad: ['WORLD SERVICE'],
    },
  },
  network: {
    independent: ['THE DAILY RECORD', 'THE NATIONAL HERALD', 'ROLLING NEWS 24'],
    official: ['THE STATE GAZETTE', 'NATIONAL BROADCASTING NEWS', 'CENTRAL NEWS AGENCY'],
    byDesk: {
      finance: ['THE FINANCIAL RECORD', 'MARKET WATCH'],
      science: ['THE TECHNOLOGY REVIEW'],
      abroad: ['WORLD SERVICE'],
    },
  },
  stream: {
    independent: ['THE DAILY RECORD', 'THE NATIONAL HERALD', 'THE FEED'],
    official: ['THE STATE GAZETTE', 'CENTRAL NEWS AGENCY', 'OFFICIAL CHANNEL'],
    byDesk: {
      finance: ['MARKET WATCH'],
      science: ['THE TECHNOLOGY REVIEW'],
      politics: ['THE OPEN LEDGER'],
    },
  },
}
