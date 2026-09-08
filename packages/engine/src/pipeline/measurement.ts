/** The one publication clock shared by scalar and vector surveys. */

import {
  STAT_ERROR_BAND_CAPACITY_GATE,
  STAT_ERROR_BAND_Z,
  STAT_FAST_LAG_CAPACITY,
  STAT_NOISE_CAPACITY_GAIN,
  STAT_REVISION_DELAYS,
  STAT_REVISION_SETTLING_RATE,
  STAT_LAGS,
} from '../constants'

export const REVISION_DELAYS = STAT_REVISION_DELAYS
export const PUBLICATION_LAGS = STAT_LAGS
export const lagFor = (capacity: number): number => (capacity >= STAT_FAST_LAG_CAPACITY ? 1 : 2)
export const noiseScale = (capacity: number): number => 1 - STAT_NOISE_CAPACITY_GAIN * capacity
/** A revision's noise relative to a first print at this capacity: the
 * capacity floor times how far this revision has settled toward the truth. */
export const settlingFor = (capacity: number, revision: number): number =>
  noiseScale(capacity) * Math.pow(STAT_REVISION_SETTLING_RATE, revision)
/** The office's usual shrug below `STAT_ERROR_BAND_CAPACITY_GATE`: report a
 * bare figure and confess no band. */
export const errorBandFor = (capacity: number, sd: number): number =>
  capacity >= STAT_ERROR_BAND_CAPACITY_GATE ? STAT_ERROR_BAND_Z * sd : 0
