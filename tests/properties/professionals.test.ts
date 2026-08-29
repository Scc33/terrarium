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
  skillTightness,
  step,
  WORKING_CLASS_IDS,
  type CapacityId,
  type TrueState,
} from '@terrarium/engine'

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

const professionals = (s: TrueState) => s.demography.classShares.professionals

describe('schools make professionals', () => {
  it('is inert for a government that never opens a school, on every curated country', () => {
    for (const country of CURATED_COUNTRY_IDS) {
      const states = century(country, `inert-${country}`, [])
      const opening = states[0].demography.professionalBaseline
      for (const s of states) {
        // exact, not close: the passive century has to stay bit-identical, and
        // `x + 0 === x` is what makes it so
        expect(professionals(s)).toBe(opening)
        expect(s.demography.humanCapital).toBeLessThanOrEqual(s.demography.schoolingBaseline)
      }
    }
  })

  it('opens a country on its own ceiling, whatever its recipe authored', () => {
    for (const country of CURATED_COUNTRY_IDS) {
      const s = init(createCountryParams(country, `open-${country}`), `open-${country}`)
      expect(professionalCeiling(s.demography)).toBeCloseTo(professionals(s), 12)
    }
  })

  it('a schooling programme makes them: the flat line bends', () => {
    const schooled = century('meridia', 'schools', ['education'])
    const opening = schooled[0].demography.professionalBaseline
    // measured at the shipped constants: 12.2% → 20%+ over four hundred
    // quarters. The assertion is deliberately loose about the level and strict
    // about the direction — this is a channel test, not a snapshot.
    expect(professionals(schooled[399])).toBeGreaterThan(opening + 0.05)
    // and it takes a generation: skills lag the building programme, and the
    // crossing lags the skills
    expect(professionals(schooled[39])).toBeLessThan(opening + 0.01)
  })

  it('it is the schools and not the spending: every other ministry buys none', () => {
    const others = CAPACITY_IDS.filter((id) => id !== 'education')
    const withoutSchools = century('meridia', 'no-schools', others)
    const opening = withoutSchools[0].demography.professionalBaseline
    for (const s of withoutSchools) expect(professionals(s)).toBe(opening)
  })

  it('never crosses its own ceiling, and never the absolute one', () => {
    for (const country of CURATED_COUNTRY_IDS) {
      for (const s of century(country, `ceiling-${country}`, CAPACITY_IDS)) {
        expect(professionals(s)).toBeLessThanOrEqual(professionalCeiling(s.demography) + 1e-12)
        expect(professionals(s)).toBeLessThanOrEqual(PROFESSIONAL_SHARE_MAX + 1e-12)
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
