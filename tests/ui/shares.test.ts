/**
 * The share charts' geometry (`ui/src/shares.ts`).
 *
 * Same reasoning as the rest of `tests/ui/`: a rendered pie proves nothing in
 * a DOM with no layout engine, so the arithmetic that decides where the wedge
 * boundaries fall lives in a pure module and gets pinned here. A wedge that
 * silently emits `NaN` in its path draws nothing at all and looks, in review,
 * exactly like a category with no money in it.
 */

import { describe, expect, it } from 'vitest'
import { donutSlices, SHARE_INKS, stackPlot, thin, type Share, type StackRow } from '../../packages/ui/src/shares'

const G = { cx: 60, cy: 60, r: 60, ri: 30 }
const share = (key: string, value: number, i = 0): Share => ({
  key,
  label: key,
  value,
  ink: SHARE_INKS[i % SHARE_INKS.length],
})

const BUDGET = [share('income', 40, 0), share('corporate', 30, 1), share('tariff', 20, 2), share('fuel', 10, 3)]
const finitePath = (d: string) => !/NaN|Infinity|undefined/.test(d)

describe('donut slices', () => {
  it('divides the whole among the categories, in the order given', () => {
    const slices = donutSlices(BUDGET, G)
    expect(slices.map((s) => s.key)).toEqual(['income', 'corporate', 'tariff', 'fuel'])
    expect(slices.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 12)
    expect(slices[0].share).toBeCloseTo(0.4, 12)
  })

  it('draws every wedge with finite coordinates', () => {
    for (const s of donutSlices(BUDGET, G)) expect(finitePath(s.path), `${s.key}: ${s.path}`).toBe(true)
  })

  it('drops categories with nothing in them rather than drawing a zero wedge', () => {
    const slices = donutSlices([share('income', 40), share('fuel', 0), share('tariff', 20)], G)
    expect(slices.map((s) => s.key)).toEqual(['income', 'tariff'])
    expect(slices.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 12)
  })

  it('draws a full ring when one category is the entire budget — a wedge cannot turn 360°', () => {
    const slices = donutSlices([share('income', 12), share('fuel', 0)], G)
    expect(slices).toHaveLength(1)
    expect(slices[0].share).toBe(1)
    expect(finitePath(slices[0].path)).toBe(true)
    // two subpaths: the outer disc and the hole punched out of it
    expect(slices[0].path.match(/M/g)).toHaveLength(2)
  })

  it('returns nothing to draw when nothing sums to a positive total', () => {
    expect(donutSlices([], G)).toEqual([])
    expect(donutSlices([share('a', 0), share('b', 0)], G)).toEqual([])
    expect(donutSlices([share('a', -5)], G)).toEqual([])
    expect(donutSlices([share('a', NaN)], G)).toEqual([])
  })

  it('uses the large-arc flag exactly when a wedge exceeds half the circle', () => {
    const [big, small] = donutSlices([share('a', 90), share('b', 10)], G)
    expect(big.path).toMatch(/A60\.00,60\.00 0 1 1/)
    expect(small.path).toMatch(/A60\.00,60\.00 0 0 1/)
  })
})

const BOX = { w: 400, h: 100, padL: 20, padR: 5, padT: 5, padB: 10 }
const KEYS = BUDGET.map((s) => ({ key: s.key, ink: s.ink }))
const rows: StackRow[] = Array.from({ length: 12 }, (_, i) => ({
  tick: i,
  values: { income: 10 + i, corporate: 8, tariff: 4, fuel: i },
}))

describe('stacked bands over time', () => {
  it('gives every category a band, even one that is flat zero — colours stay pinned', () => {
    const plot = stackPlot(
      rows.map((r) => ({ ...r, values: { ...r.values, fuel: 0 } })),
      KEYS,
      BOX,
    )
    expect(plot.bands.map((b) => b.key)).toEqual(['income', 'corporate', 'tariff', 'fuel'])
    for (const b of plot.bands) expect(finitePath(b.path), `${b.key}: ${b.path}`).toBe(true)
  })

  it('scales money mode to the tallest quarter', () => {
    const plot = stackPlot(rows, KEYS, BOX, 'money')
    const tallest = Math.max(...rows.map((r) => Object.values(r.values).reduce((a, b) => a + b, 0)))
    expect(plot.yMax).toBeGreaterThanOrEqual(tallest)
    expect(plot.sy(plot.yMax)).toBeCloseTo(BOX.padT, 9)
    expect(plot.sy(0)).toBeCloseTo(BOX.h - BOX.padB, 9)
  })

  it('normalises every quarter to its own total in share mode', () => {
    const plot = stackPlot(rows, KEYS, BOX, 'share')
    expect(plot.yMax).toBe(1)
    // the top band's ceiling must reach 100% at every quarter it draws
    const top = plot.bands[plot.bands.length - 1].path
    const firstY = Number(top.slice(1).split('L')[0].split(',')[1])
    expect(firstY).toBeCloseTo(plot.sy(1), 6)
  })

  it('survives a quarter in which the books are empty', () => {
    const empty: StackRow[] = [
      { tick: 0, values: { income: 0, corporate: 0, tariff: 0, fuel: 0 } },
      { tick: 1, values: { income: 5, corporate: 0, tariff: 0, fuel: 0 } },
    ]
    for (const mode of ['money', 'share'] as const) {
      for (const b of stackPlot(empty, KEYS, BOX, mode).bands) {
        expect(finitePath(b.path), `${mode}/${b.key}: ${b.path}`).toBe(true)
      }
    }
  })

  it('draws nothing from a record one quarter old', () => {
    expect(stackPlot(rows.slice(0, 1), KEYS, BOX).bands).toEqual([])
    expect(stackPlot([], KEYS, BOX).bands).toEqual([])
  })

  it('spans the ticks it was given', () => {
    const plot = stackPlot(rows, KEYS, BOX)
    expect(plot.sx(plot.x0)).toBeCloseTo(BOX.padL, 9)
    expect(plot.sx(plot.x1)).toBeCloseTo(BOX.w - BOX.padR, 9)
  })
})

describe('thinning a century', () => {
  it('keeps the first and last quarter whatever the stride', () => {
    const century = Array.from({ length: 417 }, (_, i) => i)
    for (const max of [10, 50, 280, 500]) {
      const t = thin(century, max)
      expect(t.length).toBeLessThanOrEqual(max + 1)
      expect(t[0]).toBe(0)
      expect(t[t.length - 1]).toBe(416)
    }
  })

  it('leaves a short series alone', () => {
    expect(thin([1, 2, 3], 10)).toEqual([1, 2, 3])
  })
})
