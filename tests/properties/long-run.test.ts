/**
 * The report card's long-run record: the office's prints and the truth, run
 * through one arithmetic. These pin the two promises the record makes — the
 * truth column is the quantity the prints estimate, and the printed column is
 * exactly what the desk could have computed from what it was shown.
 */

import { describe, expect, it } from 'vitest'
import { END_OF_HISTORY_TICK, init, step, tickForYear, type TrueState } from '@terrarium/engine'
import { LONG_RUN_FORM, LONG_RUN_RECORD, longRunTrail, observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

function century(seed: string, opts: { statistical?: number; fullInstrumentation?: boolean; appointedAt?: number } = {}): TrueState {
  const params =
    opts.statistical === undefined
      ? standardCountry
      : { ...standardCountry, capacities: { ...standardCountry.capacities, statistical: opts.statistical } }
  let s = init(params, seed, { protectedTenure: true, fullInstrumentation: opts.fullInstrumentation ?? false }, opts.appointedAt ?? 0)
  while (s.meta.tick < END_OF_HISTORY_TICK) s = step(s)
  return s
}

describe('the long-run record', () => {
  const full = century('long-run-full', { fullInstrumentation: true })
  const pub = observe(full)
  const card = pub.reportCard!

  it('reads true growth as the pace that carries output from the first quarter to the last', () => {
    const rec = full.stats.record
    const last = rec.length - 1
    // the first quarter of 1946 has no predecessor, so it counts as a quarter of no growth
    const chained = 100 * (Math.pow(rec[last].realGdp / rec[0].realGdp, 4 / rec.length) - 1)
    expect(card.longRun.gdp_growth.actual!.value).toBeCloseTo(chained, 9)
    expect(card.longRun.gdp_growth.actual!.from).toBe(0)
    expect(card.longRun.gdp_growth.actual!.to).toBe(last)
  })

  it('reads true capital growth off the first and last worksheet', () => {
    const rec = full.stats.record
    const last = rec.length - 1
    const cagr = 100 * (Math.pow(rec[last].capitalTotal / rec[0].capitalTotal, 4 / last) - 1)
    expect(card.longRun.capital_stock.actual!.value).toBeCloseTo(cagr, 9)
  })

  it('prints exactly what the TERM view would have shown from the published series', () => {
    for (const id of LONG_RUN_RECORD) {
      const trail = longRunTrail(pub.indicators[id]!.points, LONG_RUN_FORM[id], pub.appointedAt, pub.tick)
      expect(card.longRun[id].reported, id).toEqual(trail[trail.length - 1])
    }
  })

  it('is frozen when the book closes, however long the state keeps stepping', () => {
    // the office goes on revising quarters of the closed term; the verdict
    // was issued on what had been published by then
    let later = full
    for (let t = 0; t < 12; t++) later = step(later)
    expect(observe(later).reportCard!.longRun).toEqual(card.longRun)
  })

  it('is fogged, not biased: a century of prints lands near the truth', () => {
    for (const id of LONG_RUN_RECORD) {
      const { reported, actual } = card.longRun[id]
      expect(reported, id).not.toBeNull()
      expect(reported!.value, id).not.toBe(actual!.value)
      expect(Math.abs(reported!.value - actual!.value), id).toBeLessThan(0.5)
    }
  })
})

describe('the long-run record keeps the term, not the century', () => {
  it('says never measured, rather than zero, for a figure the office never printed', () => {
    const card = observe(century('long-run-blind', { statistical: 0 })).reportCard!
    expect(card.longRun.capital_stock.reported).toBeNull()
    expect(card.longRun.capital_stock.actual).not.toBeNull()
  })

  it('opens at the appointment on a later posting (ADR-0021)', () => {
    const appointedAt = tickForYear(1973)
    const card = observe(century('long-run-posting', { appointedAt })).reportCard!
    for (const id of LONG_RUN_RECORD) {
      expect(card.longRun[id].actual!.from, id).toBe(appointedAt)
      if (card.longRun[id].reported) expect(card.longRun[id].reported.from, id).toBeGreaterThanOrEqual(appointedAt)
    }
  })
})
