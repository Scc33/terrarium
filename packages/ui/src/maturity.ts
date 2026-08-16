/**
 * Instrument maturity is derived HERE, once, from PublishedState — never in
 * individual components. If a
 * threshold or a new tier arrives, this is the one place that changes.
 */

import { INDICATOR_FUNDED_AT } from '@terrarium/engine'
import type { IndicatorId, PublishedState } from '@terrarium/observation'
import { INDICATOR_IDS } from '@terrarium/observation'

export type Maturity = 'unmeasured' | 'dossier' | 'terminal'
export type InstrumentAvailability = 'unfunded' | 'awaiting' | 'reporting'

export interface InstrumentAccess {
  availability: InstrumentAvailability
  maturity: Maturity
  currentCapacity: number
  fundedAt: number
  remaining: number
}

export interface InstrumentUnlock {
  fundedAt: number
  indicators: IndicatorId[]
}

export interface InstrumentStatusCounts {
  reporting: number
  awaiting: number
  unfunded: number
}

/** statistical capacity at which an instrument graduates to the terminal era */
export const TERMINAL_AT = 0.5

/** Distinguish a survey that does not exist from one whose first worksheet is
 * still travelling to the ministry. Both have no series yet, but only one
 * asks the player to spend political capital.
 *
 * `fitted` is the `fullInstrumentation` rule: every survey exists whatever the
 * office can afford. It has to be read HERE and not only where the series
 * arrives, because for the first two quarters of such a run nothing has
 * returned yet — and a wall that spends them telling the player to fund
 * instruments they already have is worse than no wall. */
export function accessForInstrument(
  indicator: IndicatorId,
  statisticalCapacity: number,
  hasReturns: boolean,
  fitted = false,
): InstrumentAccess {
  const fundedAt = INDICATOR_FUNDED_AT[indicator]
  const availability = hasReturns
    ? 'reporting'
    : fitted || statisticalCapacity >= fundedAt
      ? 'awaiting'
      : 'unfunded'
  return {
    availability,
    maturity: hasReturns
      ? statisticalCapacity >= TERMINAL_AT ? 'terminal' : 'dossier'
      : 'unmeasured',
    currentCapacity: statisticalCapacity,
    fundedAt,
    remaining: Math.max(0, Number((fundedAt - statisticalCapacity).toFixed(8))),
  }
}

export function deriveInstrumentAccess(pub: PublishedState): Record<IndicatorId, InstrumentAccess> {
  const out = {} as Record<IndicatorId, InstrumentAccess>
  for (const id of INDICATOR_IDS) {
    out[id] = accessForInstrument(
      id,
      pub.capacity.statistical,
      Boolean(pub.indicators[id]),
      pub.rules.fullInstrumentation,
    )
  }
  return out
}

/** A compact, honest census for wall chrome. "Live" used to mean terminal
 * maturity here, even while analog instruments were visibly publishing
 * returns. Count the access states the player can actually act on instead. */
export function countInstrumentStatuses(instruments: readonly InstrumentAccess[]): InstrumentStatusCounts {
  return instruments.reduce<InstrumentStatusCounts>((counts, instrument) => {
    counts[instrument.availability] += 1
    return counts
  }, { reporting: 0, awaiting: 0, unfunded: 0 })
}

export function instrumentStatusSummary(counts: InstrumentStatusCounts): string {
  const parts: string[] = []
  if (counts.reporting > 0) parts.push(`${counts.reporting} REPORTING`)
  if (counts.awaiting > 0) parts.push(`${counts.awaiting} PENDING`)
  if (counts.unfunded > 0) parts.push(`${counts.unfunded} UNFITTED`)
  return parts.join(' · ') || 'NO INSTRUMENTS'
}

/** The next distinct batch of surveys the statistical office will unlock. */
export function nextInstrumentUnlock(statisticalCapacity: number): InstrumentUnlock | null {
  const nextAt = Math.min(
    ...INDICATOR_IDS
      .map((id) => INDICATOR_FUNDED_AT[id])
      .filter((threshold) => threshold > statisticalCapacity + 1e-9),
  )
  if (!Number.isFinite(nextAt)) return null
  return {
    fundedAt: nextAt,
    indicators: INDICATOR_IDS.filter((id) => INDICATOR_FUNDED_AT[id] === nextAt),
  }
}
