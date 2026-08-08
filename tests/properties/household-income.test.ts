/**
 * Household income — the level, and who it reached.
 *
 * The design claim these two instruments exist to make is that a Gini cannot
 * carry a level: it is a shape, so it cannot separate "everyone gained
 * unevenly" from "the top pulled away while the middle stood still". These
 * tests hold the arithmetic that makes the separation real, and the one
 * property that makes the pair worth two dials rather than one — that the
 * median/mean ratio moves for reasons the Gini does not have to agree with.
 */

import { describe, expect, it } from 'vitest'
import {
  applyAction,
  giniIndex,
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
    const naive =
      s.cohorts.reduce(
        (a, c) => a + (c.wageIncome + c.transferIncome + c.profitIncome) / Math.max(c.size, 1e-9),
        0,
      ) / s.cohorts.length
    expect(mean).toBeGreaterThan(0)
    expect(mean).not.toBeCloseTo(naive, 3)
  })

  it('puts the median at a cohort that actually exists', () => {
    // a grouped median is one of the group values by construction — if this
    // ever interpolates, it is inventing within-cohort spread the model does
    // not have (the same assumption giniIndex documents)
    for (const seed of ['med-a', 'med-b', 'med-c']) {
      const s = century(seed, 60)
      const { median } = realIncomePerHead(s)
      const perHead = s.cohorts
        .filter((c) => c.size > 1e-9)
        .map((c) => (c.wageIncome + c.transferIncome + c.profitIncome) / c.size)
      expect(perHead.some((y) => Math.abs(y / median - 1) < 0.5), seed).toBe(true)
    }
  })

  it('splits the population either side of the median cohort', () => {
    const s = century('med-split', 80)
    const { median } = realIncomePerHead(s)
    const rows = s.cohorts.filter((c) => c.size > 1e-9)
    const pop = rows.reduce((a, c) => a + c.size, 0)
    const below = rows
      .filter((c) => (c.wageIncome + c.transferIncome + c.profitIncome) / c.size < median)
      .reduce((a, c) => a + c.size, 0)
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
    const { mean, median } = realIncomePerHead(stripped)
    expect(Number.isFinite(mean)).toBe(true)
    expect(Number.isFinite(median)).toBe(true)
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
