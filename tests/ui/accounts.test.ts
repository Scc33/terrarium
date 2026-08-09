/**
 * The expenditure accounts' reading arithmetic (`ui/src/accounts.ts`).
 *
 * Same reasoning as `shares.test.ts`: what this module returns decides what
 * the pie claims the country is, and every way it can be wrong produces a
 * chart that looks entirely convincing. The two failures worth pinning are a
 * partial survey drawn as a zero band (which reads as "capital formation
 * collapsed" — the most misleading sentence this chart could utter) and a
 * negative print punching a hole through the stack.
 */

import { describe, expect, it } from 'vitest'
import type { IndicatorSeries, PublishedState } from '@terrarium/observation'
import { ACCOUNT_FACE, ACCOUNT_IDS, accountRows, publishedSum, readAccounts, toShares } from '../../packages/ui/src/accounts'
import { eachQuarter } from './harness'

/** the smallest PublishedState this module actually touches */
function pubWith(indicators: Partial<Record<string, IndicatorSeries>>, tick = 40): PublishedState {
  return { tick, indicators } as unknown as PublishedState
}

function seriesOf(id: string, values: Array<{ forQtr: number; value: number; errorBand?: number }>): IndicatorSeries {
  return {
    id,
    label: id,
    unit: '%',
    points: values.map((v) => ({
      forQtr: v.forQtr,
      publishedAt: v.forQtr + 1,
      value: v.value,
      revision: 0,
      errorBand: v.errorBand ?? 1,
    })),
  } as IndicatorSeries
}

const full = (c: number, i: number, x: number, qtrs = [0, 1, 2]) =>
  pubWith({
    consumption_share: seriesOf('consumption_share', qtrs.map((q) => ({ forQtr: q, value: c }))),
    investment_share: seriesOf('investment_share', qtrs.map((q) => ({ forQtr: q, value: i }))),
    export_share: seriesOf('export_share', qtrs.map((q) => ({ forQtr: q, value: x }))),
  })

describe('reading the expenditure accounts', () => {
  it('names every published account exactly once, in draw order', () => {
    expect(Object.keys(ACCOUNT_FACE).sort()).toEqual([...ACCOUNT_IDS].sort())
    const readings = readAccounts(full(78, 3, 18))!
    expect(readings.map((r) => r.key)).toEqual([...ACCOUNT_IDS])
    // the inks are pinned to categories, or the century chart recolours itself
    expect(new Set(readings.map((r) => r.ink)).size).toBe(ACCOUNT_IDS.length)
  })

  it('is all-or-nothing: a partial set is no accounts at all', () => {
    expect(readAccounts(full(78, 3, 18))).not.toBeNull()
    expect(readAccounts(pubWith({ consumption_share: seriesOf('consumption_share', [{ forQtr: 0, value: 78 }]) }))).toBeNull()
    expect(readAccounts(pubWith({}))).toBeNull()
  })

  it('reports the drift since the first survey, not just the latest quarter', () => {
    const drifting = pubWith({
      consumption_share: seriesOf('consumption_share', [{ forQtr: 0, value: 82 }, { forQtr: 1, value: 74 }]),
      investment_share: seriesOf('investment_share', [{ forQtr: 0, value: 3 }, { forQtr: 1, value: 5 }]),
      export_share: seriesOf('export_share', [{ forQtr: 0, value: 12 }, { forQtr: 1, value: 18 }]),
    })
    const readings = readAccounts(drifting)!
    expect(readings.map((r) => r.sinceFirst)).toEqual([-8, 2, 6])
  })

  it('surfaces the office’s inconsistency rather than scaling it away', () => {
    // three separate surveys of one identity; they are not required to agree
    expect(publishedSum(readAccounts(full(78, 3, 18))!)).toBeCloseTo(99, 10)
    expect(toShares(readAccounts(full(78, 3, 18))!).map((s) => s.value)).toEqual([78, 3, 18])
  })
})

describe('the century of the mix', () => {
  it('drops quarters the office did not compile in full', () => {
    // investment is missing for q2 — zero-filling it would draw a collapse
    const partial = pubWith({
      consumption_share: seriesOf('consumption_share', [{ forQtr: 1, value: 78 }, { forQtr: 2, value: 77 }]),
      investment_share: seriesOf('investment_share', [{ forQtr: 1, value: 3 }]),
      export_share: seriesOf('export_share', [{ forQtr: 1, value: 18 }, { forQtr: 2, value: 19 }]),
    })
    expect(accountRows(partial).map((r) => r.tick)).toEqual([1])
  })

  it('clamps a negative print instead of punching a hole in the band', () => {
    const wrong = pubWith({
      consumption_share: seriesOf('consumption_share', [{ forQtr: 0, value: 80 }, { forQtr: 1, value: 80 }]),
      investment_share: seriesOf('investment_share', [{ forQtr: 0, value: -1.5 }, { forQtr: 1, value: 2 }]),
      export_share: seriesOf('export_share', [{ forQtr: 0, value: 18 }, { forQtr: 1, value: 18 }]),
    })
    const rows = accountRows(wrong)
    expect(rows).toHaveLength(2)
    expect(rows[0].values.investment_share).toBe(0)
  })

  it('returns nothing at all when the accounts were never compiled', () => {
    expect(accountRows(pubWith({}))).toEqual([])
  })
})

describe('against a surveyed century', () => {
  it('compiles a complete, ordered mix once the office is built', () => {
    let last: PublishedState | null = null
    eachQuarter('accounts-overlay', 160, (pub) => {
      last = pub
    })
    const pub = last!
    const readings = readAccounts(pub)
    expect(readings, 'a fully surveyed century published no expenditure accounts').not.toBeNull()

    const rows = accountRows(pub)
    expect(rows.length).toBeGreaterThan(50)
    for (let i = 1; i < rows.length; i++) expect(rows[i].tick).toBeGreaterThan(rows[i - 1].tick)
    for (const row of rows) {
      for (const id of ACCOUNT_IDS) expect(Number.isFinite(row.values[id])).toBe(true)
    }
    // the identity is exhaustive in the truth; the prints are three surveys of
    // it, so they land near a hundred without being made to
    expect(publishedSum(readings!)).toBeGreaterThan(85)
    expect(publishedSum(readings!)).toBeLessThan(112)
  })
})
