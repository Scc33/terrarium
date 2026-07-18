/**
 * Instrument maturity is derived HERE, once, from PublishedState — never in
 * individual components (terrarium-design skill §component pattern). If a
 * threshold or a new tier arrives, this is the one place that changes.
 */

import type { IndicatorId, PublishedState } from '@terrarium/observation'
import { INDICATOR_IDS } from '@terrarium/observation'

export type Maturity = 'unmeasured' | 'dossier' | 'terminal'

/** statistical capacity at which an instrument graduates to the terminal era */
const TERMINAL_AT = 0.5

export function deriveMaturity(pub: PublishedState): Record<IndicatorId, Maturity> {
  const out = {} as Record<IndicatorId, Maturity>
  for (const id of INDICATOR_IDS) {
    if (!pub.indicators[id]) out[id] = 'unmeasured'
    else if (pub.capacity.statistical >= TERMINAL_AT) out[id] = 'terminal'
    else out[id] = 'dossier'
  }
  return out
}
