/**
 * The terms of the next posting other than the country: the quarter the player
 * takes office (ADR-0021) and how often the world breaks (ADR-0046). They live
 * in the app rather than in the posting room because the drafting room's own
 * ACCEPT starts a game too, and a year or a world chosen next door is still the
 * one that player means. Shaped as the posting room's props, so the app spreads
 * it straight in.
 */

import { useState } from 'react'
import { ORDINARY_TURBULENCE, type Turbulence } from '@terrarium/engine'

export function usePostingTerms() {
  const [appointedAt, onAppointedAt] = useState(0)
  const [turbulence, onTurbulence] = useState<Turbulence>(ORDINARY_TURBULENCE)
  return { appointedAt, onAppointedAt, turbulence, onTurbulence }
}
