/**
 * M4 §8 — the century IS the demographic transition window, and none of it
 * is scripted: fertility falls because incomes rise and children survive;
 * the pyramid ages because fertility fell; the dividend opens and then the
 * pension arithmetic arrives. These are the engine's demographic exit
 * criteria.
 */

import { describe, expect, it } from 'vitest'
import { AGE_BANDS, init, RETIREMENT_BAND, step, type TrueState } from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'

function century(seed: string, ticks = 416): TrueState[] {
  let s = init(standardCountry, seed)
  const out: TrueState[] = []
  for (let t = 0; t < ticks; t++) {
    s = step(s)
    out.push(s)
  }
  return out
}

const pop = (s: TrueState) => s.demography.pyramid.reduce((a, b) => a + b, 0)
const share = (s: TrueState, from: number, to: number) =>
  s.demography.pyramid.slice(from, to + 1).reduce((a, b) => a + b, 0) / pop(s)

describe('the demographic transition (§8)', () => {
  const states = century('demo-test-1')
  const at = (year: number) => states[(year - 1946) * 4 - 1]

  it('happens: fertility falls by half and population growth slows, unscripted', () => {
    expect(at(1956).demography.tfr).toBeGreaterThan(4.5)
    expect(at(2046).demography.tfr).toBeLessThan(3.0)
    const growth = (a: TrueState, b: TrueState, years: number) =>
      (Math.pow(pop(b) / pop(a), 1 / years) - 1) * 100
    const early = growth(at(1950), at(1970), 20)
    const late = growth(at(2026), at(2046), 20)
    expect(early).toBeGreaterThan(1.2) // the boom is real…
    expect(late).toBeLessThan(early - 0.8) // …and it ends
  })

  it('mortality falls with income and time; the pyramid ages', () => {
    expect(at(2046).demography.mortalityIndex).toBeLessThan(0.8)
    // the endgame trap: the 60+ share grows while children thin out
    const oldShare = (s: TrueState) => share(s, RETIREMENT_BAND, AGE_BANDS - 1)
    const childShare = (s: TrueState) => share(s, 0, 2)
    expect(oldShare(at(2046))).toBeGreaterThan(1.4 * oldShare(at(1956)))
    expect(childShare(at(2046))).toBeLessThan(childShare(at(1966)))
  })

  it('opens the dividend window: working-age share rises as the boom cohorts grow up', () => {
    const wsm = (year: number) => at(year).demography.workerShareMult
    expect(wsm(2036)).toBeGreaterThan(wsm(1956) + 0.1)
  })

  it('books balance: cohort sizes are the pyramid, retirees are the 60+', () => {
    const s = at(2000)
    const classTotal = s.cohorts.reduce((a, c) => a + c.size, 0)
    expect(classTotal).toBeCloseTo(pop(s), 6)
    const retired = s.demography.pyramid.slice(RETIREMENT_BAND).reduce((a, b) => a + b, 0)
    expect(s.cohorts.find((c) => c.id === 'retirees')!.size).toBeCloseTo(retired, 6)
    for (const n of s.demography.pyramid) expect(n).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(pop(s))).toBe(true)
  })

  it('cities fill because city wages pull: urbanization rises, then stalls in slumps', () => {
    const rural = (s: TrueState) => s.demography.classShares.rural_workers
    expect(rural(at(2046))).toBeLessThan(rural(at(1950)) - 0.1)
  })

  it('richer countries transition faster: development buys the fertility fall', () => {
    const rich = { ...standardCountry, development: 0.5 }
    let a: TrueState = init(standardCountry, 'demo-cmp')
    let b: TrueState = init(rich, 'demo-cmp')
    for (let t = 0; t < 200; t++) {
      a = step(a)
      b = step(b)
    }
    expect(b.demography.tfr).toBeLessThan(a.demography.tfr)
  })
})
