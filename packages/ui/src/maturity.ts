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

/** statistical capacity at which an instrument graduates to the terminal era */
export const TERMINAL_AT = 0.5

/** Distinguish a survey that does not exist from one whose first worksheet is
 * still travelling to the ministry. Both have no series yet, but only one
 * asks the player to spend political capital. */
export function accessForInstrument(
  indicator: IndicatorId,
  statisticalCapacity: number,
  hasReturns: boolean,
): InstrumentAccess {
  const fundedAt = INDICATOR_FUNDED_AT[indicator]
  const availability = hasReturns
    ? 'reporting'
    : statisticalCapacity >= fundedAt
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
    out[id] = accessForInstrument(id, pub.capacity.statistical, Boolean(pub.indicators[id]))
  }
  return out
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
