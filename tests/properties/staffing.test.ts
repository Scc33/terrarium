/**
 * Who fills a post (#195/#196, ADR-0035). These are the design's load-bearing
 * claims: if one of them breaks, the change is wrong, not the test.
 *
 * The two invariants are a PAIR and neither is decorative:
 *
 *   every post is filled          — because `production` charges each sector
 *                                   `wages[sid] × employment[sid]`, so a post
 *                                   the allocation leaves empty is money that
 *                                   left the firm and reached no household
 *   nobody works two jobs         — the whole point; the table used to hand
 *                                   out 120-126% of the rural labour force
 *
 * The first is the one that is easy to lose. A future change that adds a
 * skill the ladder cannot reach, or clamps a cohort somewhere else, will
 * satisfy the second and silently delete wages — and the deletion shows up in
 * the accounts as slightly weaker household demand, which looks exactly like
 * an ordinary business cycle.
 */

import { describe, expect, it } from 'vitest'
import {
  allocateStaffing,
  applyActions,
  CAPACITY_IDS,
  createCountryParams,
  CURATED_COUNTRY_IDS,
  init,
  laborForce,
  skillTightness,
  staffing,
  step,
  type CapacityId,
  type TrueState,
} from '@terrarium/engine'
import { COHORT_IDS } from '../../packages/engine/src/state/schema'

/** A century under one government, both safeties on, so what is measured is
 * the labour market and not whether a cabinet lived to see it. */
function century(
  country: (typeof CURATED_COUNTRY_IDS)[number],
  fund: readonly CapacityId[],
  ticks = 240,
): TrueState[] {
  const seed = `staffing-${country}`
  let s: TrueState = init(createCountryParams(country, seed), seed, {
    protectedTenure: true,
    unlimitedCapital: true,
  })
  // The OPENING state is in this list on purpose. The first version of these
  // tests started at q1, and the two curated countries that open with more jobs
  // than people (Costona, Kestrel) sailed through every assertion below.
  const out: TrueState[] = [s]
  for (let t = 0; t < ticks; t++) {
    let staged: TrueState = { ...s, politics: { ...s.politics, politicalCapital: 500 } }
    if (fund.length > 0 && t % 4 === 0) {
      for (const target of fund) {
        try {
          staged = applyActions(staged, [{ kind: 'investCapacity', target, amount: 2 }])
        } catch {
          continue // a ministry at full strength refuses more money
        }
      }
    }
    s = step(staged)
    out.push(s)
  }
  return out
}

describe('the staffing allocation', () => {
  it('fills every post, so the wage bill firms pay reaches households exactly', () => {
    for (const country of CURATED_COUNTRY_IDS) {
      for (const states of [century(country, []), century(country, CAPACITY_IDS)]) {
        for (const s of states) {
          const heads = staffing(s)
          for (const sector of s.sectors) {
            let filled = 0
            for (const id of COHORT_IDS) filled += heads[sector.id][id]
            expect(
              Math.abs(filled - sector.employment) / Math.max(sector.employment, 1e-9),
              `${country} q${s.meta.tick} ${sector.id}: posts unfilled`,
            ).toBeLessThan(1e-9)
          }
        }
      }
    }
  })

  it('never asks a cohort for more people than it has, once the country HAS them', () => {
    // The bound is conditional, and the condition is the one `labor` enforces
    // every quarter: total posts under `EMPLOYMENT_CEILING x` the labour force.
    // It does not hold at tick zero, because `init` applies no such ceiling —
    // that is investigation 0021 and it is asserted separately below.
    let feasibleStates = 0
    for (const country of CURATED_COUNTRY_IDS) {
      for (const states of [century(country, []), century(country, CAPACITY_IDS)]) {
        for (const s of states) {
          const supply = laborForce(s)
          const posts = s.sectors.reduce((a, sec) => a + sec.employment, 0)
          const hands = COHORT_IDS.reduce((a, id) => a + supply[id], 0)
          if (posts > hands) continue
          feasibleStates++
          const heads = staffing(s)
          for (const id of COHORT_IDS) {
            let working = 0
            for (const sector of s.sectors) working += heads[sector.id][id]
            expect(working, `${country} q${s.meta.tick} ${id}: negative heads`).toBeGreaterThanOrEqual(0)
            expect(
              working,
              `${country} q${s.meta.tick} ${id}: ${working} working against ${supply[id]} available`,
            ).toBeLessThanOrEqual(supply[id] + 1e-9)
          }
        }
      }
    }
    // and the skip above must not have quietly eaten the whole suite
    expect(feasibleStates).toBeGreaterThan(2000)
  })

  it('spreads an overdrawn opening evenly instead of blaming one class', () => {
    // Costona opens at 1.021 jobs per person and Kestrel at 1.034 — `init`
    // applies no employment ceiling, so the wage bill and the head count are
    // genuinely incompatible for one tick. The wage bill wins; what this pins
    // is that everybody carries the same share of the impossible part.
    //
    // The first implementation handed the whole shortfall to whichever cohort
    // was already largest in a sector, which read as ONE class at 1.113x with
    // its neighbours at 1.000 — a plausible-looking number that survived review.
    for (const country of ['costona', 'kestrel'] as const) {
      const seed = `staffing-${country}`
      const s = init(createCountryParams(country, seed), seed)
      const supply = laborForce(s)
      const heads = staffing(s)
      const posts = s.sectors.reduce((a, sec) => a + sec.employment, 0)
      const hands = COHORT_IDS.reduce((a, id) => a + supply[id], 0)
      expect(posts / hands, `${country} is no longer overdrawn — re-pick the fixture`).toBeGreaterThan(1)

      const multiples: number[] = []
      for (const id of COHORT_IDS) {
        if (supply[id] <= 1e-9) continue
        let working = 0
        for (const sector of s.sectors) working += heads[sector.id][id]
        multiples.push(working / supply[id])
      }
      // every class at the same multiple of itself, and that multiple IS the
      // country's jobs-per-person — so the overdraft reads as one fact
      expect(Math.max(...multiples) - Math.min(...multiples)).toBeLessThan(1e-9)
      expect(Math.max(...multiples)).toBeCloseTo(posts / hands, 9)
    }
  })

  it('leaves a cohort nobody employs with no jobs at all', () => {
    // Retirees and business owners have zero participation, so they have no
    // labour force to draw on and the ladder must never reach them — a rung
    // that recruited from a cohort with no supply would create workers.
    for (const s of century('meridia', CAPACITY_IDS)) {
      const heads = staffing(s)
      for (const id of ['retirees', 'business_owners'] as const) {
        for (const sector of s.sectors) {
          expect(heads[sector.id][id], `${id} employed in ${sector.id}`).toBe(0)
        }
      }
    }
  })

  it('keeps skillTightness the UNRATIONED demand signal ADR-0032 gates on', () => {
    // Read off the allocation this could never exceed 1, and the crossing into
    // the professions is gated on exactly the excess above 1 — so a "tidy-up"
    // that re-expressed it on `staffing` would silently kill that leg while
    // every other test still passed.
    const states = century('costona', [])
    const peak = Math.max(...states.map((s) => skillTightness(s).professionals))
    expect(peak, 'professional demand never exceeds supply — is this reading the allocation?')
      .toBeGreaterThan(1)
  })

  it('staffs the farms from the towns once the countryside is short', () => {
    // The one direction substitution actually fires in, and it is worth
    // pinning because it is the only evidence the ladder is wired at all.
    // Agriculture's recipe names ONLY rural workers, and rural workers run
    // short (tightness 1.18-1.28) as the countryside empties — so every
    // urban worker in a field got there by substitution.
    const late = century('costona', ['education'], 240).at(-1)!
    const heads = staffing(late)
    expect(
      heads.agri.urban_workers,
      'nobody from the towns is working the land — is the ladder wired?',
    ).toBeGreaterThan(0)
  })

  it('lets a surplus professional take a lesser job, and is exactly inert at zero', () => {
    // The negative #200 deliberately left behind, flipped for #201. Ordinary
    // substitution can only fill an empty post; bumping lets a better-qualified
    // applicant displace the matched applicant from a post already being filled.
    const late = century('costona', ['education'], 240).at(-1)!
    expect(skillTightness(late).professionals, 'professionals are not in surplus here').toBeLessThan(1)
    const heads = staffing(late)
    const neutral = allocateStaffing(late.sectors, laborForce(late), 0)
    let outsideServices = 0
    let neutralOutsideServices = 0
    for (const sector of late.sectors) {
      if (sector.id === 'services') continue
      outsideServices += heads[sector.id].professionals
      neutralOutsideServices += neutral[sector.id].professionals
    }
    expect(neutralOutsideServices, 'zero preference no longer reproduces ADR-0035').toBe(0)
    expect(outsideServices, 'no surplus professional took a lesser job').toBeGreaterThan(0)
  })
})
