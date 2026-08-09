/**
 * The budget, disaggregated (schema 11).
 *
 * Two promises hold this feature up, and both are testable:
 *
 *   1. **The split IS the total.** The books are the one exact thing a
 *      government has; a breakdown that doesn't add up to the headline is
 *      worse than no breakdown, because the player would act on it.
 *   2. **A dial shows up in its own line.** The whole point of publishing the
 *      composition is that "what happens to revenue if I cut the income tax"
 *      becomes a thing the player can read off the books instead of guess.
 *
 * The second is also where the interesting economics is: the yield of a tax
 * is not the rate times a fixed base. Cutting a rate hands income back to
 * households, who spend it, which moves every other base too — so the honest
 * claim is about the line you moved, not about the total.
 */

import { describe, expect, it } from 'vitest'
import {
  applyActions,
  init,
  OUTLAY_IDS,
  REVENUE_SOURCE_IDS,
  step,
  type ActionLog,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

function play(seed: string, ticks: number, script: ActionLog = []): TrueState {
  const byTick = new Map(script.map((t) => [t.tick, t.actions]))
  let s = init(standardCountry, seed)
  for (let t = 0; t < ticks; t++) {
    const actions = byTick.get(s.meta.tick)
    if (actions) s = applyActions(s, actions)
    s = step(s)
  }
  return s
}

const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0)

describe('the treasury books add up', () => {
  it('every quarter of the record: the splits equal the headline totals', () => {
    const pub = observe(play('books-balance', 60))
    expect(pub.books.length).toBeGreaterThan(50)
    for (const b of pub.books) {
      expect(sum(b.revenueBySource), `revenue split ≠ revenue at q${b.tick}`).toBeCloseTo(b.revenue, 9)
      expect(sum(b.outlaysByProgramme), `outlay split ≠ outlays at q${b.tick}`).toBeCloseTo(b.outlays, 9)
      expect(b.revenue - b.outlays).toBeCloseTo(b.balance, 9)
    }
  })

  it('the live treasury view agrees with the last quarter filed', () => {
    const pub = observe(play('books-live', 24))
    const last = pub.books[pub.books.length - 1]
    expect(sum(pub.treasury.revenueBySource)).toBeCloseTo(pub.treasury.revenue, 9)
    expect(sum(pub.treasury.outlaysByProgramme)).toBeCloseTo(pub.treasury.outlays, 9)
    expect(pub.treasury.revenueBySource).toEqual(last.revenueBySource)
    expect(pub.treasury.outlaysByProgramme).toEqual(last.outlaysByProgramme)
  })

  it('carries every catalogued line, and nothing else, with no negative entries', () => {
    const pub = observe(play('books-lines', 40, [
      { tick: 4, actions: [{ kind: 'investCapacity', target: 'statistical', amount: 3 }] },
      { tick: 8, actions: [{ kind: 'setDial', path: 'subsidies.agri', value: 0.6 }] },
      { tick: 12, actions: [{ kind: 'setDial', path: 'spending.research', value: 0.4 }] },
    ]))
    for (const b of pub.books) {
      expect(Object.keys(b.revenueBySource).sort()).toEqual([...REVENUE_SOURCE_IDS].sort())
      expect(Object.keys(b.outlaysByProgramme).sort()).toEqual([...OUTLAY_IDS].sort())
      for (const [k, v] of Object.entries({ ...b.revenueBySource, ...b.outlaysByProgramme })) {
        expect(Number.isFinite(v), `${k} not finite at q${b.tick}`).toBe(true)
        expect(v, `${k} negative at q${b.tick}`).toBeGreaterThanOrEqual(0)
      }
    }
    // the two lines the scripted actions bought must actually appear
    const late = pub.books[pub.books.length - 1]
    expect(late.outlaysByProgramme.subsidies).toBeGreaterThan(0)
    expect(late.outlaysByProgramme.research).toBeCloseTo(0.4)
    expect(pub.books.some((b) => b.outlaysByProgramme.capacity > 0)).toBe(true)
  })
})

describe('a tax cut is visible in the books it cut', () => {
  const TICKS = 32
  const CUT: ActionLog = [{ tick: 12, actions: [{ kind: 'setDial', path: 'taxRates.income', value: 0.05 }] }]

  it('halving the income tax collapses income receipts — and only that line directly', () => {
    let cutFell = 0
    const seeds = Array.from({ length: 20 }, (_, i) => `cut-${i}`)
    for (const seed of seeds) {
      const base = observe(play(seed, TICKS))
      const cut = observe(play(seed, TICKS, CUT))
      const b = base.treasury.revenueBySource
      const c = cut.treasury.revenueBySource
      // the line whose rate moved falls hard, and its share of the whole with it
      if (c.income < b.income * 0.85) cutFell++
      expect(c.income / cut.treasury.revenue).toBeLessThan(b.income / base.treasury.revenue)
    }
    expect(cutFell).toBe(seeds.length)
  })

  it('but the other bases move too — which is exactly why the breakdown is worth publishing', () => {
    // a rate cut is not a static loss: the money goes to households, who
    // spend it, and the tariff and fuel bases feel that within a few years.
    // If this ever stops being true, the "take per point of rate" figure the
    // ledger prints has quietly become a forecast, and the caveat beside it
    // in `LedgerOverlay` is no longer a caveat but a lie.
    let othersMoved = 0
    const seeds = Array.from({ length: 20 }, (_, i) => `spill-${i}`)
    for (const seed of seeds) {
      const base = observe(play(seed, TICKS)).treasury.revenueBySource
      const cut = observe(play(seed, TICKS, CUT)).treasury.revenueBySource
      const others = (r: typeof base) => r.corporate + r.tariff + r.fuel
      if (Math.abs(others(cut) / others(base) - 1) > 0.002) othersMoved++
    }
    expect(othersMoved).toBeGreaterThanOrEqual(seeds.length * 0.8)
  })
})

describe('debt service is a line no dial reduces this quarter', () => {
  it('a government that borrows heavily watches interest crowd the budget', () => {
    // spend far beyond the tax base for a decade: the interest line grows as
    // a share of outlays even though the player never voted for it
    const spend: ActionLog = [
      { tick: 4, actions: [{ kind: 'setDial', path: 'spending.transfers', value: 6 }] },
      { tick: 8, actions: [{ kind: 'setDial', path: 'spending.procurement', value: 6 }] },
    ]
    const pub = observe(play('debt-service', 60, spend))
    const shareAt = (i: number) =>
      pub.books[i].outlaysByProgramme.interest / Math.max(pub.books[i].outlays, 1e-9)
    expect(shareAt(pub.books.length - 1)).toBeGreaterThan(shareAt(4))
    expect(pub.treasury.debt).toBeGreaterThan(0)
  })
})
