/**
 * How the desk reads the world's turbulence (ADR-0046).
 *
 * The setting is an engine input sealed into the save; this module owns only
 * what the player is told about it. The "how often" in every caption is read
 * off the engine's own `TURBULENCE` table rather than typed, so a retune of the
 * dial cannot leave the posting room promising a world the engine no longer
 * runs. `TURBULENCE_COPY` is a total `Record` over the id list, so a new level
 * fails the build until it has words.
 */

import { TURBULENCE, type Turbulence } from '@terrarium/engine'

export interface TurbulenceCopy {
  /** the segment's label in the posting room */
  label: string
  /** what the setting does, shown under the control as it is chosen */
  caption: string
  /** the letterhead's stamp; null for the world the game was calibrated in */
  mark: string | null
}

/** A multiplier as a frequency a reader can hold: "half as often". */
export function howOften(multiplier: number): string {
  if (multiplier === 1) return 'as often as ever'
  if (multiplier === 0.5) return 'half as often'
  if (multiplier === 2) return 'twice as often'
  return `${multiplier.toFixed(1).replace(/\.0$/, '')}× as often`
}

const ruptures = (t: Turbulence) =>
  `Failed harvests, fuel shocks, foreign crises and bank panics out of a clear sky come ${howOften(TURBULENCE[t].hazard)}`

export const TURBULENCE_COPY: Record<Turbulence, TurbulenceCopy> = {
  calm: {
    label: 'CALM',
    caption: `${ruptures('calm')}, and the trading partners' booms and slumps run shallower. What does strike, strikes as hard.`,
    mark: 'CALM WORLD',
  },
  ordinary: {
    label: 'ORDINARY',
    caption:
      'The world the economy was calibrated in. Harvests fail, fuel spikes and partners slump at the rates the difficulty ratings were measured against.',
    mark: null,
  },
  turbulent: {
    label: 'TURBULENT',
    caption: `${ruptures('turbulent')}, and the trading partners' cycles swing wider. Nothing you cause is any likelier.`,
    mark: 'TURBULENT WORLD',
  },
}
