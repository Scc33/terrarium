/** Skill-demand allocation: who actually holds each sector's fixed posts. */

import {
  LABOR_SOURCE,
  OVERQUALIFIED_HIRING_PREFERENCE,
  SKILL_RANK,
} from '../constants'
import { clamp } from '../math'
import {
  COHORT_IDS,
  type CohortId,
  type Sector,
  type SectorId,
} from '../state/schema'

const SKILL_RANKS = COHORT_IDS.map((id) => SKILL_RANK[id])
const MAX_SKILL_RANK = Math.max(...SKILL_RANKS)
const MIN_SKILL_RANK = Math.min(...SKILL_RANKS)
const COHORT_POSITIONS_BY_RANK: number[][] = Array.from(
  { length: MAX_SKILL_RANK + 1 },
  (_, rank) => COHORT_IDS.map((_, ci) => ci).filter((ci) => SKILL_RANKS[ci] === rank),
)

/** `LADDER_BY_DISTANCE[d][wanted]` — who may fill a post that wanted `wanted`,
 * when the walk has reached distance `d`. Precomputed because the allocation
 * runs every quarter of every run. */
const LADDER_BY_DISTANCE: number[][][] = (() => {
  const span = MAX_SKILL_RANK - MIN_SKILL_RANK
  return Array.from({ length: span + 1 }, (_, distance) =>
    COHORT_IDS.map((wanted) =>
      COHORT_IDS.map((_, ci) => ci).filter(
        (ci) => Math.abs(SKILL_RANKS[ci] - SKILL_RANK[wanted]) === distance,
      ),
    ),
  )
})()

/** A fresh `[sector][cohort]` grid, filled with `value`. Positional arrays keep
 * the caller-supplied `sector.id` out of every write in this hot loop. */
function grid(sectorCount: number, value: number): number[][] {
  const out: number[][] = new Array<number[]>(sectorCount)
  for (let i = 0; i < sectorCount; i++) out[i] = new Array<number>(COHORT_IDS.length).fill(value)
  return out
}

/**
 * Ration the posts `LABOR_SOURCE` asks for against the people who exist.
 *
 * Two constraints are deliberately ordered (ADR-0035): every sector's posts
 * are always filled, and no cohort exceeds its supply whenever total hands can
 * cover total posts. After own-skill hiring settles, surplus higher-ranked
 * applicants may bump matched workers down one rung (ADR-0036).
 */
export function allocateStaffing(
  sectors: readonly Pick<Sector, 'id' | 'employment'>[],
  supply: Readonly<Record<CohortId, number>>,
  /** Zero reproduces ADR-0035 exactly; one lets every surplus applicant
   * contest a matched post on the immediately lower rung. */
  bumpingPreference = OVERQUALIFIED_HIRING_PREFERENCE,
): Record<SectorId, Record<CohortId, number>> {
  const nS = sectors.length
  const nC = COHORT_IDS.length
  let supplyTotal = 0
  for (let ci = 0; ci < nC; ci++) supplyTotal += supply[COHORT_IDS[ci]]
  const postsTotal = sectors.reduce((sum, sector) => sum + sector.employment, 0)
  const spare = COHORT_IDS.map((id) => supply[id])
  const remaining = grid(nS, 0)
  const heads = grid(nS, 0)
  for (let si = 0; si < nS; si++) {
    const row = LABOR_SOURCE[sectors[si].id]
    for (let ci = 0; ci < nC; ci++) {
      remaining[si][ci] = sectors[si].employment * (row[COHORT_IDS[ci]] ?? 0)
    }
  }

  const ladder = LADDER_BY_DISTANCE
  for (let distance = 0; distance < ladder.length; distance++) {
    // Each pass settles at least one cohort or one block of posts, so the
    // bound is the size of the problem rather than a tolerance.
    for (let pass = 0; pass <= nC; pass++) {
      const claims = new Array<number>(nC).fill(0)
      const eligibleFor = grid(nS, -1)
      let outstanding = 0
      for (let si = 0; si < nS; si++) {
        for (let wi = 0; wi < nC; wi++) {
          const posts = remaining[si][wi]
          if (posts <= 1e-12) continue
          const rungs = ladder[distance][wi]
          let eligible = 0
          for (const ci of rungs) eligible += spare[ci]
          if (eligible <= 1e-12) continue
          eligibleFor[si][wi] = eligible
          outstanding += posts
          for (const ci of rungs) claims[ci] += posts * (spare[ci] / eligible)
        }
      }
      if (outstanding <= 1e-12) break

      const served = new Array<number>(nC).fill(1)
      for (let ci = 0; ci < nC; ci++) {
        served[ci] = claims[ci] > 1e-12 ? Math.min(1, spare[ci] / claims[ci]) : 1
      }
      for (let si = 0; si < nS; si++) {
        for (let wi = 0; wi < nC; wi++) {
          const posts = remaining[si][wi]
          if (posts <= 1e-12) continue
          const eligible = eligibleFor[si][wi]
          if (eligible < 0) continue
          for (const ci of ladder[distance][wi]) {
            const take = posts * (spare[ci] / eligible) * served[ci]
            heads[si][ci] += take
            remaining[si][wi] -= take
          }
        }
      }
      for (let ci = 0; ci < nC; ci++) {
        spare[ci] = Math.max(0, spare[ci] - Math.min(claims[ci], spare[ci]))
      }
    }

    // Substitution above fills an absent class's empty post. Bumping instead
    // lets a surplus higher class displace a matched applicant from a post
    // already filled. Walk high to low so the displacement can cascade.
    if (distance === 0 && bumpingPreference > 0 && postsTotal <= supplyTotal + 1e-12) {
      const preference = clamp(bumpingPreference, 0, 1)
      for (let rank = MAX_SKILL_RANK; rank > 0; rank--) {
        const higher = COHORT_POSITIONS_BY_RANK[rank]
        const lower = COHORT_POSITIONS_BY_RANK[rank - 1]
        let applicants = 0
        for (const ci of higher) applicants += spare[ci]
        let matchedPosts = 0
        for (const wi of lower) {
          // A displaced scarce worker would only refill their own rung
          // elsewhere. Bump only after all of that class's posts have settled.
          let ownShortage = 0
          for (let si = 0; si < nS; si++) ownShortage += remaining[si][wi]
          if (ownShortage > 1e-12) continue
          for (let si = 0; si < nS; si++) matchedPosts += heads[si][wi]
        }
        const displaced = Math.min(preference * applicants, matchedPosts)
        if (displaced <= 1e-12 || applicants <= 1e-12 || matchedPosts <= 1e-12) continue

        for (let si = 0; si < nS; si++) {
          for (const wi of lower) {
            let ownShortage = 0
            for (let sj = 0; sj < nS; sj++) ownShortage += remaining[sj][wi]
            if (ownShortage > 1e-12) continue
            const fromPost = displaced * (heads[si][wi] / matchedPosts)
            if (fromPost <= 0) continue
            heads[si][wi] -= fromPost
            spare[wi] += fromPost
            for (const ci of higher) {
              heads[si][ci] += fromPost * (spare[ci] / applicants)
            }
          }
        }
        for (const ci of higher) {
          spare[ci] = Math.max(0, spare[ci] - displaced * (spare[ci] / applicants))
        }
      }
    }
  }

  // When posts exceed hands the constraints conflict and the wage bill wins:
  // spread the impossible part pro rata so every cohort carries the same jobs
  // per person. This is reachable only at init (investigation 0021).
  if (supplyTotal > 1e-12) {
    for (let si = 0; si < nS; si++) {
      let outstanding = 0
      for (let wi = 0; wi < nC; wi++) {
        const posts = remaining[si][wi]
        if (posts > 1e-12) outstanding += posts
      }
      if (outstanding <= 1e-12) continue
      for (let ci = 0; ci < nC; ci++) {
        heads[si][ci] += outstanding * (supply[COHORT_IDS[ci]] / supplyTotal)
      }
    }
  }

  // Close float dust exactly so every sector's wage bill reaches households.
  for (let si = 0; si < nS; si++) {
    let filled = 0
    for (let ci = 0; ci < nC; ci++) filled += heads[si][ci]
    const short = sectors[si].employment - filled
    if (Math.abs(short) <= 1e-12) continue
    let biggest = 0
    for (let ci = 0; ci < nC; ci++) if (heads[si][ci] > heads[si][biggest]) biggest = ci
    heads[si][biggest] = Math.max(0, heads[si][biggest] + short)
  }

  // `fromEntries` makes caller-supplied ids data rather than computed writes,
  // keeping `__proto__` from writing through to Object.prototype.
  return Object.fromEntries(
    sectors.map((sector, si) => [
      sector.id,
      Object.fromEntries(COHORT_IDS.map((id, ci) => [id, heads[si][ci]])),
    ]),
  ) as Record<SectorId, Record<CohortId, number>>
}
