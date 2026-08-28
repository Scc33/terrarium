/**
 * Step 2.5 — technology. Two trees: the global frontier advances on a
 * roughly historical schedule whether you exist or not; what you have
 * ATTAINED chases each sector's slice of it at a speed set by absorptive
 * capacity — schools first, openness second. Poor countries close the gap
 * fast when they can absorb at all (catch-up growth is real); countries
 * that never build schools watch the gap widen for a century.
 *
 * The frontier's HISTORICAL schedule is deterministic — it is history, not
 * dice. Your own contribution to it is not: original research is a hazard
 * process, and the lump lands when it lands (see `breakthroughHazard`).
 */

import {
  ABSORB_BASE,
  ABSORB_EDU_GAIN,
  ABSORB_OPENNESS_WEIGHT,
  adminEffectiveness,
  BREAKTHROUGH_HAZARD_MAX,
  BREAKTHROUGH_SIZE,
  CATCHUP_Q,
  FRONTIER_ERAS,
  FRONTIER_OWN_DRIFT_Q,
  RESEARCH_CATCHUP_GAIN_Q,
  RESEARCH_EFFECTIVE_SHARE_MAX,
  RESEARCH_FRONTIER_GAIN_Q,
  RESEARCH_FRONTIER_START,
  RESEARCH_SKILL_FLOOR,
  RESEARCH_STOCK_DECAY_Q,
  TECH_EXPOSURE,
} from '../constants'
import { fileDispatch } from '../events/file'
import { clamp, sectorRecord } from '../math'
import { FIRST_YEAR, SECTOR_IDS, type NewsItem, type SectorId, type TrueState } from '../state/schema'
import type { PipelineStep } from './pipeline'
import { creativeDestruction } from './derive'

/** annual frontier growth in force at a given quarter */
export function frontierGrowthAt(tick: number): number {
  const year = FIRST_YEAR + tick / 4
  let g = FRONTIER_ERAS[0].growthPerYear
  for (const era of FRONTIER_ERAS) if (year >= era.fromYear) g = era.growthPerYear
  return g
}

/**
 * How fast this country can drink from the frontier, 0..1.
 *
 * Schools first, openness second — and whether the incumbents will
 * allow it. Absorbing the frontier means new firms displacing old ones;
 * an entrenched interest that faces no organized society vetoes exactly that,
 * so the same schools buy less catch-up in a captured economy. Note what this
 * does NOT touch: capital widening. Forced industrialization still works. What
 * dies under an unchecked elite is the transition, which is why the extractive
 * ceiling is a ceiling and not a wall — the player discovers the Soviet growth
 * curve by driving into it.
 */
export function absorptiveCapacity(state: TrueState): number {
  const humanCapital = state.demography.humanCapital
  const opennessFactor =
    1 - ABSORB_OPENNESS_WEIGHT + ABSORB_OPENNESS_WEIGHT * clamp(state.params.openness, 0, 1.5) / 1.5
  return clamp(
    (ABSORB_BASE + ABSORB_EDU_GAIN * humanCapital) * opennessFactor * creativeDestruction(state),
    0,
    1,
  )
}

/** The flow-equivalent of a research stock: what a programme this size would
 * have been appropriating, had it been appropriating steadily. Everything
 * downstream reads THIS rather than the quarter's cheque, which is the whole
 * point of holding a stock — see `RESEARCH_STOCK_DECAY_Q`. */
export const researchIntensity = (stock: number): number => stock * RESEARCH_STOCK_DECAY_Q

export interface ResearchAllocation {
  /** appropriated research money that survives administration and staffing,
   * as a share of quarterly GDP. This is the CHEQUE — it enters the stock and
   * only reaches the laboratories through it. */
  effectiveShare: number
  /** the research base actually working this quarter, in the same units:
   * the stock's flow-equivalent. Equals `effectiveShare` in a steady state. */
  intensity: number
  /** share of effort devoted to adapting known techniques, per sector */
  catchupBySector: Record<SectorId, number>
  /** share devoted to original work at the frontier, per sector */
  frontierBySector: Record<SectorId, number>
  /** output-weighted aggregates of the two above — what the country's research
   * programme looks like from the ministry, one number each */
  catchupShare: number
  frontierShare: number
}

/**
 * The same research programme changes character as the gap closes. A country
 * behind the frontier funds adaptation; a country operating near it funds
 * original work. This split is derived from position, never chosen from a tech
 * tree, and the appropriated money still needs administrators and skilled
 * researchers before it becomes useful technique.
 *
 * Position is read PER SECTOR. An economy is not uniformly behind: the same
 * budget buys imitation in the fields and invention in the machine shops, and
 * a single blended split could not say that. The aggregates are output-weighted
 * so the ministry-level number still means what it used to.
 */
export function researchAllocation(state: TrueState): ResearchAllocation {
  const appropriatedShare =
    state.gov.dials.spending.research / Math.max(state.flows.nominalGdp, 1e-9)
  const delivery = adminEffectiveness(state.gov.capacity.administrative)
  const staffing =
    RESEARCH_SKILL_FLOOR + (1 - RESEARCH_SKILL_FLOOR) * state.demography.humanCapital
  const effectiveShare = clamp(
    appropriatedShare * delivery * staffing,
    0,
    RESEARCH_EFFECTIVE_SHARE_MAX,
  )

  const frontierBySector = sectorRecord((sid) => {
    const target = Math.pow(state.tech.frontier, TECH_EXPOSURE[sid])
    const position = clamp(state.tech.attained[sid] / Math.max(target, 1e-9), 0, 1)
    return clamp((position - RESEARCH_FRONTIER_START) / (1 - RESEARCH_FRONTIER_START), 0, 1)
  })
  const catchupBySector = sectorRecord((sid) => 1 - frontierBySector[sid])

  const frontierShare = outputWeighted(state, (sid) => frontierBySector[sid])
  return {
    effectiveShare,
    intensity: researchIntensity(state.tech.researchStock),
    catchupBySector,
    frontierBySector,
    catchupShare: 1 - frontierShare,
    frontierShare,
  }
}

/** Weight a per-sector quantity by current output. Falls back to an unweighted
 * mean in the degenerate quarter where nothing was produced at all. */
function outputWeighted(state: TrueState, f: (sid: SectorId) => number): number {
  let weighted = 0
  let weightSum = 0
  for (const sector of state.sectors) {
    const weight = Math.max(0, sector.output)
    weighted += weight * f(sector.id)
    weightSum += weight
  }
  if (weightSum > 1e-9) return weighted / weightSum
  return SECTOR_IDS.reduce((sum, sid) => sum + f(sid), 0) / SECTOR_IDS.length
}

/**
 * The chance that this quarter's original research actually lands something,
 * and with it the whole reason the frontier tree is not a second catch-up tree.
 *
 * Effort is output-weighted across sectors and weighted AGAIN by
 * `TECH_EXPOSURE`: a country at best practice in its machine shops pushes the
 * world's technique outward, one at best practice in its barbershops does not,
 * and the exposure table already says which is which. Then the whole thing is
 * gated on `creativeDestruction` — the incumbents who veto absorbing somebody
 * else's invention veto financing your own at least as hard. That gate
 * is the fix for a real inconsistency: before it, a captured economy could not
 * absorb what others had invented but could still buy original innovation with
 * money, which is backwards on this model's own logic.
 */
export function breakthroughHazard(
  state: TrueState,
  research: ResearchAllocation,
  intensity: number,
): number {
  const effort =
    intensity *
    creativeDestruction(state) *
    outputWeighted(state, (sid) => research.frontierBySector[sid] * TECH_EXPOSURE[sid])
  return clamp((RESEARCH_FRONTIER_GAIN_Q * effort) / BREAKTHROUGH_SIZE, 0, BREAKTHROUGH_HAZARD_MAX)
}

export const technology: PipelineStep = {
  name: 'technology',
  run(state, rng) {
    const historicalFrontier =
      state.tech.frontier * (1 + frontierGrowthAt(state.meta.tick) / 4)
    const research = researchAllocation(state)

    // the cheque joins the base, the base decays, and what is left is what the
    // laboratories can actually work with this quarter
    const researchStock =
      state.tech.researchStock * (1 - RESEARCH_STOCK_DECAY_Q) + research.effectiveShare
    const intensity = researchIntensity(researchStock)

    // A breakthrough is announced by the laboratory, not measured by the
    // office, so it makes the wire with certainty — the same rule a drought
    // gets. You may have no idea what it did to your productivity; you still
    // read about it in the newspaper.
    const news: NewsItem[] = []
    let frontier = historicalFrontier
    if (rng.next() < breakthroughHazard(state, research, intensity)) {
      frontier = historicalFrontier * (1 + BREAKTHROUGH_SIZE)
      // A hazard process clusters — two in a year is ordinary Poisson, not a
      // bug — so the wire rotates its phrasing, and since #160 it rotates by
      // ERA as well: a breakthrough in 1949 is an alloy and in 2030 it is a
      // machine that was trained rather than programmed.
      //
      // The bare draw below is deliberate and must stay. The phrasing used to
      // be chosen with it, off THIS step's economic substream; the wording now
      // comes from `obs:news:breakthrough`, orthogonal to the economy, which
      // is where it always belonged. Deleting the draw instead of stranding it
      // would shift every later draw in this step whenever a breakthrough
      // fires — so a copy-edit would rewrite the century, which is exactly the
      // coupling the events module exists to remove.
      rng.next()
      news.push(fileDispatch(state, 'breakthrough'))
    }

    // each sector chases its own slice of the frontier; the gap closes at a
    // rate human capital allows, at a rate the incumbents allow, and faster
    // where the country's own research is still adapting rather than inventing
    const absorption = absorptiveCapacity(state)
    const attained = sectorRecord((sid) => {
      const historicalTarget = Math.pow(historicalFrontier, TECH_EXPOSURE[sid])
      const target = Math.pow(frontier, TECH_EXPOSURE[sid])
      const a = state.tech.attained[sid]
      // Keep the zero-research term in the historical multiplication order so
      // adding the policy cannot perturb passive replays through floating-point
      // reassociation alone.
      const catchupRate =
        CATCHUP_Q * absorption +
        absorption * RESEARCH_CATCHUP_GAIN_Q * intensity * research.catchupBySector[sid]
      // A frontier country immediately owns the increment its laboratories
      // created; everybody else has to absorb that knowledge in later quarters.
      const ownInnovation = Math.max(0, target - historicalTarget)
      return (
        a * (1 + FRONTIER_OWN_DRIFT_Q) +
        catchupRate * Math.max(0, historicalTarget - a) +
        ownInnovation
      )
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

    return {
      ...state,
      sectors,
      tech: { frontier, attained, tfpGrowthQ, researchStock },
      stats:
        news.length > 0 ? { ...state.stats, news: [...state.stats.news, ...news] } : state.stats,
    }
  },
}
