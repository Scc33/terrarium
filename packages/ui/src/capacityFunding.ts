/**
 * Size a ministry bid against room left after the cabinet's existing orders.
 * Revenue alone used to bid past full strength, paying for deliveries that
 * fiscal clamps away, and offered FUND even when the engine's in-flight gate
 * refused every bid. Commitments are exact government books, not hidden GDP.
 * The worker still validates the programme against its administration ceiling.
 */
import {
  CAPACITY_BUILD_QTRS,
  CAPACITY_COST_PER_POINT,
  CAPACITY_MINISTRY_FULL_STRENGTH_GATE,
  type CapacityId,
} from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'

export function capacityFunding(
  pub: Pick<PublishedState, 'capacity' | 'capacityBuilding'> & {
    treasury: Pick<PublishedState['treasury'], 'revenue'>
  },
  id: CapacityId,
) {
  const programmes = pub.capacityBuilding.filter((build) => build.target === id)
  const pending = programmes.reduce((sum, build) => sum + build.perQtr * build.remaining, 0)
  const committedCapacity = pub.capacity[id] + pending
  const full = committedCapacity >= CAPACITY_MINISTRY_FULL_STRENGTH_GATE
  // Keep the inherited revenue-based bid until the ministry cannot absorb it.
  const amount = full ? 0 : Math.min(
    Math.max(2, pub.treasury.revenue * 0.8),
    (1 - committedCapacity) * CAPACITY_COST_PER_POINT,
  )
  return {
    full,
    amount,
    moneyPerQtr: amount / CAPACITY_BUILD_QTRS,
    points: amount / CAPACITY_COST_PER_POINT,
    programmes: programmes.length,
    remaining: Math.max(0, ...programmes.map((build) => build.remaining)),
    activeMoneyPerQtr: programmes.reduce((sum, build) => sum + build.moneyPerQtr, 0),
    moneyRemaining: programmes.reduce((sum, build) => sum + build.moneyPerQtr * build.remaining, 0),
  }
}
