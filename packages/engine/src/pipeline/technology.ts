/**
 * Step 2.5 — technology (§9). Two trees: the global frontier advances on a
 * roughly historical schedule whether you exist or not; what you have
 * ATTAINED chases each sector's slice of it at a speed set by absorptive
 * capacity — schools first, openness second. Poor countries close the gap
 * fast when they can absorb at all (catch-up growth is real); countries
 * that never build schools watch the gap widen for a century. Deterministic:
 * the frontier is history, not dice.
 */

import {
  ABSORB_BASE,
  ABSORB_EDU_GAIN,
  ABSORB_OPENNESS_WEIGHT,
  CATCHUP_Q,
  FRONTIER_ERAS,
  FRONTIER_OWN_DRIFT_Q,
  TECH_EXPOSURE,
} from '../constants'
import { clamp, sectorRecord } from '../math'
import type { TrueState } from '../state/schema'
import type { PipelineStep } from './pipeline'
import { creativeDestruction } from './derive'

/** annual frontier growth in force at a given quarter */
export function frontierGrowthAt(tick: number): number {
  const year = 1946 + tick / 4
  let g = FRONTIER_ERAS[0].growthPerYear
  for (const era of FRONTIER_ERAS) if (year >= era.fromYear) g = era.growthPerYear
  return g
}

/**
 * How fast this country can drink from the frontier, 0..1.
 *
 * Schools first, openness second — and from M6, whether the incumbents will
 * allow it (§4.3). Absorbing the frontier means new firms displacing old ones;
 * an entrenched interest that faces no organized society vetoes exactly that,
 * so the same schools buy less catch-up in a captured economy. Note what this
 * does NOT touch: capital widening. Forced industrialization still works. What
 * dies under an unchecked elite is the transition, which is why the extractive
 * ceiling is a ceiling and not a wall — the player discovers the Soviet growth
 * curve by driving into it.
 */
export function absorptiveCapacity(state: TrueState): number {
  const education = state.gov.capacity.education
  const opennessFactor =
    1 - ABSORB_OPENNESS_WEIGHT + ABSORB_OPENNESS_WEIGHT * clamp(state.params.openness, 0, 1.5) / 1.5
  return clamp(
    (ABSORB_BASE + ABSORB_EDU_GAIN * education) * opennessFactor * creativeDestruction(state),
    0,
    1,
  )
}

export const technology: PipelineStep = {
  name: 'technology',
  run(state) {
    const frontier = state.tech.frontier * (1 + frontierGrowthAt(state.meta.tick) / 4)

    // each sector chases its own slice of the frontier; the gap closes at a
    // rate human capital allows, and at a rate the incumbents allow
    const absorption = absorptiveCapacity(state)
    const attained = sectorRecord((sid) => {
      const target = Math.pow(frontier, TECH_EXPOSURE[sid])
      const a = state.tech.attained[sid]
      return a * (1 + FRONTIER_OWN_DRIFT_Q) + CATCHUP_Q * absorption * Math.max(0, target - a)
    })

    // realized tfp growth lands on the sectors (multiplicative, so drought
    // severity restores cleanly on top) and wage bargaining reads the
    // output-weighted average
    let growthSum = 0
    let weightSum = 0
    const sectors = state.sectors.map((s) => {
      const g = attained[s.id] / state.tech.attained[s.id]
      growthSum += (g - 1) * s.output
      weightSum += s.output
      return { ...s, tfp: s.tfp * g }
    })
    const tfpGrowthQ = weightSum > 1e-9 ? growthSum / weightSum : 0

    return { ...state, sectors, tech: { frontier, attained, tfpGrowthQ } }
  },
}
