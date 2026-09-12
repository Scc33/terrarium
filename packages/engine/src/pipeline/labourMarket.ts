/** Exact worksheet behind the occupational labour survey. */

import { OVERQUALIFIED_HIRING_PREFERENCE } from '../constants'
import { LABOUR_CLASS_IDS, type LabourClassId } from '../state/labour'
import type { TrueState } from '../state/schema'
import { laborForce } from './derive'
import { allocateStaffingDetailed } from './staffing'

export interface LabourMarketReading {
  byClass: Record<LabourClassId, { jobless: number; underemployed: number }>
  /** Open joblessness plus underemployment, as a share of the surveyed labour force. */
  underuse: number
}

/**
 * Retains the desired-post rung from the existing staffing allocation so a
 * professional in an urban post is counted even inside a mixed-skill sector.
 * It is a pure reporting read: nothing here changes the allocation or feeds
 * back into the economy.
 */
export function labourMarket(state: TrueState): LabourMarketReading {
  const supply = laborForce(state)
  const { heads, underemployed } = allocateStaffingDetailed(
    state.sectors,
    supply,
    OVERQUALIFIED_HIRING_PREFERENCE,
  )
  const byClass = {} as LabourMarketReading['byClass']
  let labourForceTotal = 0
  let underused = 0
  for (const id of LABOUR_CLASS_IDS) {
    const labourForce = supply[id]
    const employed = state.sectors.reduce((sum, sector) => sum + heads[sector.id][id], 0)
    // Staffing closes sector wage-bill dust at 1e-12. Close the same dust
    // before reporting class joblessness: an exactly filled class must not
    // acquire a positive survey reading from a one-ULP allocation remainder.
    const gap = labourForce - employed
    const jobless = gap <= 1e-12 ? 0 : gap
    const mismatched = Math.min(employed, Math.max(0, underemployed[id]))
    byClass[id] = {
      jobless: labourForce > 1e-9 ? jobless / labourForce : 0,
      underemployed: labourForce > 1e-9 ? mismatched / labourForce : 0,
    }
    labourForceTotal += labourForce
    underused += jobless + mismatched
  }
  return { byClass, underuse: labourForceTotal > 1e-9 ? underused / labourForceTotal : 0 }
}
