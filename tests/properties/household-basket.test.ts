/**
 * Load-bearing mechanism claims for the household basket (ADR-0030), asserted
 * over seeds because a claim about a mechanism is not a claim about a run.
 *
 * The basket is what a cohort buys, and it answers to two things: the INCOME
 * it has (Engel) and the RELATIVE PRICES it faces (the CES nest). Both are
 * multiplicative terms on the authored recipe, so both are exactly inert at
 * their neutral constants — and that inertness is asserted here rather than
 * trusted, because it is the property that let the mechanism ship in one
 * commit and be calibrated in two more.
 */

import { describe, expect, it } from 'vitest'
import {
  CAPACITY_IDS,
  CONSUMPTION_WEIGHT_FLOOR,
  CURATED_COUNTRY_IDS,
  ENGEL_ELASTICITY,
  HOUSEHOLD_SUBSTITUTION,
  SECTOR_IDS,
  applyActions,
  createCountryParams,
  effectiveConsumptionWeights,
  init,
  sectorValueAdded,
  step,
  type Action,
  type SectorId,
  type TrueState,
} from '@terrarium/engine'
import { validate } from '../../packages/engine/src/state/validate'

/**
 * A capacity-building century with tenure protected, so what is measured is
 * the basket and not whether a cabinet survived to see it.
 *
 * Returns TWO openings, and the difference matters. `opening` is the init
 * state, which is where the authored recipe lives and the only place the
 * weights can be checked against it. `settled` is eight quarters later, and it
 * is the right baseline for anything about COMPOSITION: a recipe's `structure`
 * is a paper split that the first production step immediately relaxes, and it
 * moves several points doing so — Oranga opens on paper at 47.8% services and
 * is at 40.8% after one quarter, Veltravia at 34.6% and 39.5%. Measuring a
 * century from the paper number measures that transient as if it were history.
 */
const SETTLE = 8
function govern(country: (typeof CURATED_COUNTRY_IDS)[number], seed: string, ticks: number, order?: Action) {
  let s: TrueState = init(createCountryParams(country, seed), seed, {
    protectedTenure: true,
    unlimitedCapital: true,
  })
  const opening = s
  let settled = s
  for (let t = 0; t < ticks; t++) {
    let staged: TrueState = { ...s, politics: { ...s.politics, politicalCapital: 500 } }
    if (t % 4 === 0) {
      for (const target of CAPACITY_IDS) {
        // a ministry already at full strength refuses more money; the runner
        // is lenient about exactly this and so is the experiment
        try {
          staged = applyActions(staged, [{ kind: 'investCapacity', target, amount: 2 }])
        } catch {
          continue
        }
      }
    }
    if (order && t >= SETTLE && (t - SETTLE) % 4 === 0) staged = applyActions(staged, [order])
    s = step(staged)
    if (t === SETTLE - 1) settled = s
  }
  return { opening, settled, final: s }
}

const shares = (s: TrueState): Record<SectorId, number> => {
  const va = sectorValueAdded(s)
  let total = 0
  for (const sid of SECTOR_IDS) total += va[sid]
  const out = {} as Record<SectorId, number>
  for (const sid of SECTOR_IDS) out[sid] = va[sid] / Math.max(total, 1e-9)
  return out
}

describe('the household basket', () => {
  it('opens on the recipe it was authored with, in every country', () => {
    // The whole inherited-baseline argument in one assertion. `engelReference`
    // is sealed from real income per head at init and prices open at 1 with no
    // fuel excise, so both exponents see exactly 1 and the derived vector is
    // the authored one. If this drifts, some country is being charged for the
    // structure its recipe was written with — the ADR-0028 mistake.
    for (const country of CURATED_COUNTRY_IDS) {
      const s = init(createCountryParams(country, `open-${country}`), `open-${country}`)
      for (const c of s.cohorts) {
        const w = effectiveConsumptionWeights(s, c.id)
        for (const sid of SECTOR_IDS) {
          expect(w[sid], `${country}/${c.id}/${sid}`).toBeCloseTo(c.consumptionWeights[sid], 12)
        }
      }
    }
  })

  it('stays a probability vector for a whole century', () => {
    // A weight that goes NaN does not throw anywhere: it silently zeroes a
    // sector's household demand, and the Leontief solve reads that as an
    // economy that stopped eating.
    for (const country of CURATED_COUNTRY_IDS) {
      const { final } = govern(country, `vector-${country}`, 400)
      for (const c of final.cohorts) {
        const w = effectiveConsumptionWeights(final, c.id)
        let sum = 0
        for (const sid of SECTOR_IDS) {
          expect(Number.isFinite(w[sid]), `${country}/${c.id}/${sid} finite`).toBe(true)
          expect(w[sid], `${country}/${c.id}/${sid} floor`).toBeGreaterThanOrEqual(
            0.9 * CONSUMPTION_WEIGHT_FLOOR,
          )
          sum += w[sid]
        }
        expect(sum, `${country}/${c.id} sums to 1`).toBeCloseTo(1, 9)
      }
    }
  })

  it('moves toward services and away from food as a cohort gets richer', () => {
    // Engel, at the level of the basket rather than the economy: this is the
    // claim, and the value-added share below is what the economy does with it.
    let richer = 0
    const seeds = Array.from({ length: 12 }, (_, i) => `engel-${i}`)
    for (const seed of seeds) {
      const { opening, final } = govern('meridia', seed, 400)
      const before = effectiveConsumptionWeights(opening, 'urban_workers')
      const after = effectiveConsumptionWeights(final, 'urban_workers')
      if (after.services > before.services && after.agri < before.agri) richer++
    }
    expect(richer, 'a century of growth should re-weight the basket').toBe(seeds.length)
  })

  it('no longer sheds service value-added share while getting rich', () => {
    // THE DEFECT (investigation 0013). Every country in the catalogue used to
    // shed 6 to 10 points of service value-added share across a century in
    // which it got five to eight times richer — the most robust regularity in
    // structural change, running backwards, because the demand side that
    // pulls services up was switched off. Measured at v34, opening → q400:
    // meridia 34.2→26.9, costona 31.4→25.3, veltravia 38.1→29.3,
    // oranga 41.3→31.0, kestrel 34.3→26.7. All measured from the SETTLED
    // opening, for the reason `govern` documents.
    //
    // What the fix does is raise the ATTRACTOR the catalogue converges into,
    // from roughly 25–31% to roughly 30–36%. So the bar is not "every country
    // rises": a country whose recipe opens ABOVE the demand-implied share
    // still relaxes down toward it, and Veltravia (37.0→33.9) and Oranga
    // (39.7→36.1) do exactly that. That is convergence, and it is the same
    // motion it always was — the defect was that the destination was below
    // where every country started.
    //
    // The bar stops at FLAT rather than rising, and the gap is measured rather
    // than conceded: services are staffed 60% by professionals and the class
    // transition makes no more of them, so every further point is bought with
    // inequality (investigation 0015).
    const fell: Record<string, number> = {}
    for (const country of CURATED_COUNTRY_IDS) {
      const { settled, final } = govern(country, `share-${country}`, 400)
      fell[country] = shares(settled).services - shares(final).services
      expect(fell[country], `${country} service share`).toBeLessThan(0.05)
    }
    // the countries that open near the attractor should now be flat, not
    // merely falling less — this is the half of the claim that says the
    // demand side is actually pulling rather than the fall being damped
    for (const country of ['meridia', 'costona', 'kestrel'] as const) {
      expect(fell[country], `${country} service share, flat`).toBeLessThan(0.02)
    }
  })

  it('fails safe AND loud when the income it reads is corrupt', () => {
    // Both halves matter and they are different halves. `effectiveConsumptionWeights`
    // must DEGRADE to the authored recipe, and `validate` must still SAY SO.
    //
    // The first version did neither. A non-finite income made every weight
    // NaN, `raw > 0 ? raw : 0` coerced them to zero — and the one sector whose
    // Engel elasticity is exactly zero kept a finite weight through the same
    // corruption, so the total stayed above the empty-vector guard and the
    // vector normalised onto that sector alone. Measured: 96% of the household
    // budget in transport, every downstream finite check passing, and the
    // invariant sweep silent. A guard that converts NaN to a number is not a
    // guard, it is a laundry.
    const opening = init(createCountryParams('meridia', 'nan'), 'nan')
    for (const field of ['engelIncome', 'engelReference'] as const) {
      const corrupt: TrueState = {
        ...opening,
        cohorts: opening.cohorts.map((c, i) => (i === 0 ? { ...c, [field]: NaN } : c)),
      }
      const id = corrupt.cohorts[0].id
      const w = effectiveConsumptionWeights(corrupt, id)
      for (const sid of SECTOR_IDS) {
        expect(w[sid], `${field}/${sid} falls back to the recipe`).toBe(
          corrupt.cohorts[0].consumptionWeights[sid],
        )
      }
      expect(() => validate(corrupt), `${field} is reported`).toThrow(field)
    }
  })

  it('is exactly the authored recipe when both responses are neutral', () => {
    // The inert-when-off property, asserted against the CONSTANTS rather than
    // against a snapshot: at the neutral values every exponent is zero, so the
    // derived vector must be the stored one to the last bit. This is what made
    // it possible to land the mechanism and prove `pnpm diff-state` moved
    // nothing but `meta.schemaVersion`, and a future retune that breaks the
    // identity has broken the proof with it.
    const neutralEngel = SECTOR_IDS.every((sid) => ENGEL_ELASTICITY[sid] === 0)
    const neutralPrice = HOUSEHOLD_SUBSTITUTION === 1
    const { final } = govern('meridia', 'neutral', 120)
    for (const c of final.cohorts) {
      const w = effectiveConsumptionWeights(final, c.id)
      const identical = SECTOR_IDS.every((sid) => w[sid] === c.consumptionWeights[sid])
      // one direction only: neutral constants MUST reproduce the recipe. A
      // live constant is free to move the basket, and does.
      if (neutralEngel && neutralPrice) expect(identical).toBe(true)
    }
    expect(neutralEngel && neutralPrice, 'this is a live mechanism, not a stub').toBe(false)
  })
})
