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
  const out: TrueState[] = []
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

  it('never asks a cohort for more people than it has', () => {
    for (const country of CURATED_COUNTRY_IDS) {
      for (const states of [century(country, []), century(country, CAPACITY_IDS)]) {
        for (const s of states) {
          const heads = staffing(s)
          const supply = laborForce(s)
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

  it('leaves a class in SURPLUS idle rather than underemployed — the gap #27 still has', () => {
    // Measured and deliberately pinned as a NEGATIVE. Substitution fills posts
    // a sector cannot staff; it cannot create posts. When professionals are in
    // surplus every lower rung is in surplus too, so there is no unfilled post
    // for a spare professional to take and they stay in the unemployment count
    // instead of taking a lesser job.
    //
    // Turning that into genuine underemployment needs employers to prefer the
    // better-qualified applicant for a post that is ALREADY being filled —
    // bumping down — which is a claim about hiring, not an accounting fix, and
    // belongs in its own change with its own measurement. If this test starts
    // failing, that change has landed and this expectation should become its
    // opposite.
    const late = century('costona', ['education'], 240).at(-1)!
    expect(skillTightness(late).professionals, 'professionals are not in surplus here').toBeLessThan(1)
    const heads = staffing(late)
    let outsideServices = 0
    for (const sector of late.sectors) {
      if (sector.id !== 'services') outsideServices += heads[sector.id].professionals
    }
    expect(outsideServices, 'a surplus professional took a lesser job — see the note above').toBe(0)
  })
})
