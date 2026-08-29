/**
 * The second boundary the class transition crosses (#169, ADR-0032).
 *
 * The design claim is a pair, and each half is a separate test below: SCHOOLS
 * decide how many people could do professional work, and the SHORTAGE of
 * professional work decides how many cross. Get either half wrong and the
 * mechanism still looks plausible in a table — the first version gated the
 * crossing on a service wage premium, which is negative until roughly 2005 in
 * every century the catalogue runs, so it was a mechanic nobody could reach.
 *
 * The inertness test is the load-bearing one. The professional ceiling is a
 * ratio to the pair the country OPENED with, so a government that never builds
 * a classroom sits on its opening share forever and the passive century is
 * bit-identical. An absolute law would have moved four of the five curated
 * countries in 1946Q1 for their authored structure — the bug ADR-0028's
 * pollution baseline exists to prevent, one register over.
 */

import { describe, expect, it } from 'vitest'
import {
  applyActions,
  CAPACITY_IDS,
  createCountryParams,
  CURATED_COUNTRY_IDS,
  init,
  PROFESSIONAL_SHARE_MAX,
  professionalCeiling,
  pyramidFor,
  skillTightness,
  step,
  WORKING_CLASS_IDS,
  type CapacityId,
  type CountryParams,
  type TrueState,
} from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'

/** A century under one government. `fund` names the ministries it builds; an
 * empty list is a passive century. Tenure is protected and capital unlimited
 * so what is measured is the labour market and not whether a cabinet lived to
 * see it. */
function century(
  country: (typeof CURATED_COUNTRY_IDS)[number],
  seed: string,
  fund: readonly CapacityId[],
  ticks = 400,
): TrueState[] {
  return centuryFrom(createCountryParams(country, seed), seed, fund, ticks)
}

/** The same century from a params vector, so a DRAFTED country can be driven
 * through it — the curated recipes cannot reach the edges of the legal box. */
function centuryFrom(
  params: CountryParams,
  seed: string,
  fund: readonly CapacityId[],
  ticks = 400,
): TrueState[] {
  let s: TrueState = init(params, seed, {
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

const professionals_ = (s: TrueState) => s.demography.classShares.professionals

describe('schools make professionals', () => {
  it('is inert for a government that never opens a school, on every curated country', () => {
    for (const country of CURATED_COUNTRY_IDS) {
      const states = century(country, `inert-${country}`, [])
      const opening = states[0].demography.professionalBaseline
      for (const s of states) {
        // exact, not close: the passive century has to stay bit-identical, and
        // `x + 0 === x` is what makes it so
        expect(professionals_(s)).toBe(opening)
        expect(s.demography.humanCapital).toBeLessThanOrEqual(s.demography.schoolingBaseline)
      }
    }
  })

  it('opens a country on its own ceiling, whatever its recipe authored', () => {
    for (const country of CURATED_COUNTRY_IDS) {
      const s = init(createCountryParams(country, `open-${country}`), `open-${country}`)
      expect(professionalCeiling(s.demography)).toBeCloseTo(professionals_(s), 12)
    }
  })

  it('…including a DRAFTED country with barely any schools, or none at all', () => {
    // The curated recipes all open between 0.09 and 0.48, so they cannot see
    // the case that matters: `validateCountryParams` allows an education
    // capacity anywhere in [0,1] and the drafting room mirrors it exactly, so
    // a player can author a country with no school system whatever. Flooring
    // only the DENOMINATOR of the ceiling's ratio opened such a country at a
    // fraction of its own professional share — zero, at education zero — which
    // is ADR-0028's bug in a second register, and the loop above was blind to
    // it by construction.
    for (const education of [0, 0.001, 0.005, 0.019, 0.02, 0.5, 1]) {
      const params = {
        ...standardCountry,
        capacities: { ...standardCountry.capacities, education },
      }
      const s = init(params, `draft-${education}`)
      expect(professionalCeiling(s.demography)).toBeCloseTo(professionals_(s), 12)
    }
  })

  it('…and a DRAFTED country that is nearly all professionals already', () => {
    // The other end of the same invariant, and the other bound guarding the
    // ratio. `COUNTRY_DRAFT_DOMAIN.cohortSize` is { min: 0.1, max: 45 }, so a
    // player can legally put 45m professionals beside 0.1m of every other
    // class — 99% of the working classes, far above `PROFESSIONAL_SHARE_MAX`.
    // A bare `Math.min` against that cap handed such a country a ceiling below
    // where it already was, which kills the mechanism and charges the country
    // for its own recipe: the low-school bug above, from the opposite end.
    for (const professionals of [3, 10, 20, 45]) {
      const cohortSizes = {
        rural_workers: 0.1,
        urban_workers: 0.1,
        professionals,
        business_owners: 0.1,
        retirees: 3,
      }
      const params = {
        ...standardCountry,
        cohortSizes,
        pyramid: pyramidFor(cohortSizes, 'balanced'),
      }
      const s = init(params, `dense-${professionals}`)
      expect(professionals_(s)).toBeGreaterThan(PROFESSIONAL_SHARE_MAX)
      expect(professionalCeiling(s.demography)).toBeCloseTo(professionals_(s), 12)
    }
  })

  it('the cap still bounds GROWTH for a country that opens under it', () => {
    // …and the lift above must not have turned the cap off. A well-schooled
    // century on an ordinary recipe still cannot cross it.
    for (const s of century('veltravia', 'cap-bound', CAPACITY_IDS)) {
      expect(professionals_(s)).toBeLessThanOrEqual(PROFESSIONAL_SHARE_MAX + 1e-12)
    }
  })

  it('a schoolless draft is inert until it builds schools, and then it is not', () => {
    const params = {
      ...standardCountry,
      capacities: { ...standardCountry.capacities, education: 0 },
    }
    const passive = centuryFrom(params, 'draft-passive', [])
    const opening = passive[0].demography.professionalBaseline
    for (const s of passive) expect(professionals_(s)).toBe(opening)

    // and the mechanism is not merely disabled for it — the country that opens
    // with nothing has the most to gain
    const schooled = centuryFrom(params, 'draft-passive', ['education'])
    expect(professionals_(schooled[399])).toBeGreaterThan(opening + 0.05)
  })

  it('a schooling programme makes them: the flat line bends', () => {
    const schooled = century('meridia', 'schools', ['education'])
    const opening = schooled[0].demography.professionalBaseline
    // measured at the shipped constants: 12.2% → 20%+ over four hundred
    // quarters. The assertion is deliberately loose about the level and strict
    // about the direction — this is a channel test, not a snapshot.
    expect(professionals_(schooled[399])).toBeGreaterThan(opening + 0.05)
    // and it takes a generation: skills lag the building programme, and the
    // crossing lags the skills
    expect(professionals_(schooled[39])).toBeLessThan(opening + 0.01)
  })

  it('it is the schools and not the spending: every other ministry buys none', () => {
    const others = CAPACITY_IDS.filter((id) => id !== 'education')
    const withoutSchools = century('meridia', 'no-schools', others)
    const opening = withoutSchools[0].demography.professionalBaseline
    for (const s of withoutSchools) expect(professionals_(s)).toBe(opening)
  })

  it('never crosses its own ceiling, and never the absolute one', () => {
    for (const country of CURATED_COUNTRY_IDS) {
      for (const s of century(country, `ceiling-${country}`, CAPACITY_IDS)) {
        expect(professionals_(s)).toBeLessThanOrEqual(professionalCeiling(s.demography) + 1e-12)
        expect(professionals_(s)).toBeLessThanOrEqual(PROFESSIONAL_SHARE_MAX + 1e-12)
      }
    }
  })

  it('keeps the class structure a partition: four shares, non-negative, summing to one', () => {
    for (const country of CURATED_COUNTRY_IDS) {
      for (const s of century(country, `partition-${country}`, CAPACITY_IDS)) {
        let total = 0
        for (const id of WORKING_CLASS_IDS) {
          expect(s.demography.classShares[id]).toBeGreaterThanOrEqual(0)
          total += s.demography.classShares[id]
        }
        expect(total).toBeCloseTo(1, 10)
      }
    }
  })

  it('answers the shortage it is named for: the staffing table stops asking for people who do not exist', () => {
    // `skillTightness` is the jobs the staffing table hands a cohort against
    // the people in it. Above 1 it is asking for workers who are not there —
    // and on master a developmental Meridia ended the century asking for 1.7
    // professionals per professional.
    const schooled = century('meridia', 'shortage', CAPACITY_IDS)
    const withoutSchools = century(
      'meridia',
      'shortage',
      CAPACITY_IDS.filter((id) => id !== 'education'),
    )
    const short = (s: TrueState) => skillTightness(s).professionals
    expect(short(withoutSchools[399])).toBeGreaterThan(1.4)
    expect(short(schooled[399])).toBeLessThan(short(withoutSchools[399]) - 0.3)
  })
})
