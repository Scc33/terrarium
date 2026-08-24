/**
 * Household income — the level, poverty, and who it reached.
 *
 * The design claim these two instruments exist to make is that a Gini cannot
 * carry a level: it is a shape, so it cannot separate "everyone gained
 * unevenly" from "the top pulled away while the middle stood still". These
 * tests hold the shared disposable-real worksheet behind all three, plus the
 * equal-population split that makes a quintile mean what its label says.
 */

import { describe, expect, it } from 'vitest'
import {
  applyAction,
  giniIndex,
  householdIncomeDistribution,
  householdIncomeGroups,
  INCOME_QUINTILE_IDS,
  init,
  generateParams,
  realIncomePerHead,
  step,
  type TrueState,
} from '../../packages/engine/src'

const century = (seed: string, ticks: number, each?: (s: TrueState, t: number) => TrueState) => {
  let s = init(generateParams(seed), seed)
  for (let t = 0; t < ticks; t++) {
    if (each) s = each(s, t)
    s = step(s)
  }
  return s
}

describe('the measure itself', () => {
  it('is a population-weighted mean, not a mean of cohort averages', () => {
    // the distinction bites whenever cohorts differ in size, which is always:
    // averaging five per-head figures would weight a million retirees the same
    // as twenty million rural workers
    const s = century('income-mean', 24)
    const { mean } = realIncomePerHead(s)
    const groups = householdIncomeGroups(s)
    const weighted = groups.reduce((sum, group) => sum + group.population * group.realPerHead, 0)
      / groups.reduce((sum, group) => sum + group.population, 0)
    const naive = groups.reduce((sum, group) => sum + group.realPerHead, 0) / groups.length
    expect(mean).toBeGreaterThan(0)
    expect(mean).toBeCloseTo(weighted, 12)
    expect(mean).not.toBeCloseTo(naive, 3)
  })

  it('puts the median at a cohort that actually exists', () => {
    // a grouped median is one of the group values by construction — if this
    // ever interpolates, it is inventing within-cohort spread the model does
    // not have (the same assumption giniIndex documents)
    for (const seed of ['med-a', 'med-b', 'med-c']) {
      const s = century(seed, 60)
      const { median } = realIncomePerHead(s)
      const perHead = householdIncomeGroups(s).map((group) => group.realPerHead)
      expect(perHead).toContain(median)
    }
  })

  it('splits the population either side of the median cohort', () => {
    const s = century('med-split', 80)
    const { median } = realIncomePerHead(s)
    const rows = householdIncomeGroups(s)
    const pop = rows.reduce((a, group) => a + group.population, 0)
    const below = rows
      .filter((group) => group.realPerHead < median)
      .reduce((a, group) => a + group.population, 0)
    // strictly-poorer cohorts are under half the country; adding the median
    // cohort itself takes it over — that is what "the middle household" means
    expect(below).toBeLessThan(0.5 * pop)
  })

  it('survives a country with no income at all rather than emitting NaN', () => {
    const s = init(generateParams('degenerate'), 'degenerate')
    const stripped: TrueState = {
      ...s,
      cohorts: s.cohorts.map((c) => ({ ...c, wageIncome: 0, transferIncome: 0, profitIncome: 0 })),
    }
    const distribution = householdIncomeDistribution(stripped)
    const { mean, median } = distribution
    expect(Number.isFinite(mean)).toBe(true)
    expect(Number.isFinite(median)).toBe(true)
    expect(distribution.povertyRate).toBe(1)
    expect(distribution.povertyGap).toBe(1)
  })

  it('forms five ordered equal-population bins whose income shares sum to one', () => {
    for (const seed of ['quintile-a', 'quintile-b', 'quintile-c']) {
      const distribution = householdIncomeDistribution(century(seed, 80))
      const incomes = INCOME_QUINTILE_IDS.map((id) => distribution.incomeQuintileReal[id])
      const shares = INCOME_QUINTILE_IDS.map((id) => distribution.incomeQuintileShare[id])
      expect(incomes.every(Number.isFinite), seed).toBe(true)
      expect(shares.every((share) => share >= 0 && share <= 1), seed).toBe(true)
      expect(shares.reduce((sum, share) => sum + share, 0), seed).toBeCloseTo(1, 12)
      for (let i = 1; i < incomes.length; i++) {
        expect(incomes[i], `${seed}: quintile ${i} was poorer than ${i - 1}`).toBeGreaterThanOrEqual(incomes[i - 1])
      }
    }
  })

  it('keeps poverty and its gap bounded, with the gap no larger than the headcount', () => {
    for (const seed of ['poverty-a', 'poverty-b', 'poverty-c']) {
      const { povertyRate, povertyGap } = householdIncomeDistribution(century(seed, 80))
      expect(povertyRate).toBeGreaterThanOrEqual(0)
      expect(povertyRate).toBeLessThanOrEqual(1)
      expect(povertyGap).toBeGreaterThanOrEqual(0)
      expect(povertyGap).toBeLessThanOrEqual(povertyRate)
    }
  })

  it('does not make the distribution more unequal when every household income is scaled equally', () => {
    const base = century('income-scale', 60)
    const doubled: TrueState = {
      ...base,
      cohorts: base.cohorts.map((cohort) => ({
        ...cohort,
        wageIncome: 2 * cohort.wageIncome,
        transferIncome: 2 * cohort.transferIncome,
        profitIncome: 2 * cohort.profitIncome,
      })),
    }
    const before = householdIncomeDistribution(base)
    const after = householdIncomeDistribution(doubled)
    expect(after.gini).toBeCloseTo(before.gini, 12)
    for (const id of INCOME_QUINTILE_IDS) {
      expect(after.incomeQuintileShare[id]).toBeCloseTo(before.incomeQuintileShare[id], 12)
      expect(after.incomeQuintileReal[id]).toBeCloseTo(2 * before.incomeQuintileReal[id], 12)
    }
    expect(after.povertyRate).toBeLessThanOrEqual(before.povertyRate)
    expect(after.povertyGap).toBeLessThanOrEqual(before.povertyGap)
  })

  it('records progress in the poverty gap before a grouped headcount necessarily crosses', () => {
    const base = century('poverty-transfer', 40)
    const lifted: TrueState = {
      ...base,
      cohorts: base.cohorts.map((cohort) => ({
        ...cohort,
        // A modest per-person transfer lifts every return without changing
        // employment, prices or the population being counted.
        transferIncome: cohort.transferIncome + 0.1 * cohort.size,
      })),
    }
    const before = householdIncomeDistribution(base)
    const after = householdIncomeDistribution(lifted)
    expect(after.povertyRate).toBeLessThanOrEqual(before.povertyRate)
    expect(after.povertyGap).toBeLessThan(before.povertyGap)
  })
})

describe('the claim the level is on the wall to make', () => {
  it('carries a level the Gini cannot', () => {
    // the whole argument for the instrument: a century of growth is invisible
    // to a shape statistic, which can report the same inequality for a country
    // three times richer than it was
    const early = century('level', 40)
    const late = century('level', 240)
    expect(realIncomePerHead(late).mean).toBeGreaterThan(1.5 * realIncomePerHead(early).mean)
    expect(Math.abs(giniIndex(late) - giniIndex(early))).toBeLessThan(0.15)
  })
})

describe('why the median is measured but not published', () => {
  it('median over mean moves AGAINST the Gini under redistribution', () => {
    // This is the reason `income_median` is not an indicator, pinned so that
    // nobody re-adds the obvious companion gauge without meeting the evidence.
    // Transfers land on retirees and the rural and urban poor, the bottom of
    // the distribution — but the multiplier lifts the top in absolute terms
    // faster than it lifts the middle household, so the ratio falls while
    // inequality genuinely improves. A dial that worsens when the player
    // redistributes is worse than no dial.
    const seed = 'redistribution'
    const base = century(seed, 60)
    const generous = century(seed, 60, (s, t) =>
      t === 0
        ? applyAction(s, {
            kind: 'setDial',
            path: 'spending.transfers',
            value: s.gov.dials.spending.transfers + 3,
          })
        : s,
    )
    const ratio = (s: TrueState) => {
      const { mean, median } = realIncomePerHead(s)
      return median / mean
    }
    expect(giniIndex(generous)).toBeLessThan(giniIndex(base)) // inequality fell
    expect(ratio(generous)).toBeLessThan(ratio(base)) // …and the ratio says otherwise
  })
})
