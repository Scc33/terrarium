/**
 * The rules of the run (ADR-0020). Each is a safety, and a safety is only
 * worth having if it does exactly one thing: these tests pin what each rule
 * changes AND what it must leave alone, because a sandbox switch that quietly
 * moved the economy would make every run taken under it uncomparable with the
 * published matrix.
 */

import { describe, expect, it } from 'vitest'
import {
  applyAction,
  hashState,
  init,
  INDICATOR_FUNDED_AT,
  politicalCostOfAction,
  step,
  IllegalActionError,
  STANDARD_RULES,
  type Action,
  type TrueState,
} from '@terrarium/engine'
import { INDICATOR_IDS, observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

/** A country whose statistical office can afford almost nothing: at 0.05 only
 * the three unlock-at-zero instruments are fitted. */
const poorOffice = {
  ...standardCountry,
  capacities: { ...standardCountry.capacities, statistical: 0.05 },
}

function play(state: TrueState, ticks: number): TrueState {
  let s = state
  for (let t = 0; t < ticks; t++) s = step(s)
  return s
}

describe('the rules are inert when they are off', () => {
  it('a standard run is bit-identical however the rules are spelled', () => {
    const fromNothing = play(init(standardCountry, 'rules-inert'), 24)
    const fromString = play(init(standardCountry, 'rules-inert', 'standard'), 24)
    const fromRecord = play(init(standardCountry, 'rules-inert', STANDARD_RULES), 24)
    expect(hashState(fromString)).toBe(hashState(fromNothing))
    expect(hashState(fromRecord)).toBe(hashState(fromNothing))
  })
})

describe('fullInstrumentation fits every survey (#59)', () => {
  it('publishes instruments an office this poor could never afford', () => {
    const funded = observe(play(init(poorOffice, 'instr-off'), 20))
    const all = observe(play(init(poorOffice, 'instr-on', { fullInstrumentation: true }), 20))

    const gated = INDICATOR_IDS.filter((id) => INDICATOR_FUNDED_AT[id] > 0.05)
    expect(gated.length).toBeGreaterThan(20) // the rule has to be worth having
    for (const id of gated) expect(funded.indicators[id], id).toBeUndefined()
    for (const id of INDICATOR_IDS) {
      expect(all.indicators[id]?.points.length, id).toBeGreaterThan(0)
    }
  })

  it('lifts the funding gate and nothing else: the prints are still fogged', () => {
    const state = play(init(poorOffice, 'instr-fog', { fullInstrumentation: true }), 20)
    const unemployment = observe(state).indicators.unemployment!

    // still lagged — a poor office compiles nothing in one quarter
    expect(Math.max(...unemployment.points.map((p) => p.forQtr))).toBeLessThanOrEqual(state.meta.tick - 2)
    // still revised, and still wrong: an office at 0.05 has no error band to
    // confess and its first prints miss by points, not by rounding
    expect(unemployment.points.some((p) => p.revision > 0)).toBe(true)
    expect(unemployment.points.every((p) => p.errorBand === 0)).toBe(true)
    const firstPrints = unemployment.points.filter((p) => p.revision === 0)
    const truth = (q: number) => state.stats.record[q].unemployment * 100
    expect(firstPrints.some((p) => Math.abs(p.value - truth(p.forQtr)) > 0.5)).toBe(true)
  })

  it('does not touch the economy: measurement rides its own RNG substreams', () => {
    // §3.4 the `obs:*` streams are orthogonal to the economic ones, so fitting
    // more instruments must not move a single real quantity. (The one legitimate
    // coupling is an INDEXED appropriation, which follows published CPI — the
    // 1946 settlement votes fixed cash, so nothing here reads a print.)
    const off = play(init(poorOffice, 'instr-econ'), 40)
    const on = play(init(poorOffice, 'instr-econ', { fullInstrumentation: true }), 40)
    expect(on.flows.realGdp).toBe(off.flows.realGdp)
    expect(on.gov.debt).toBe(off.gov.debt)
    expect(on.politics.politicalCapital).toBe(off.politics.politicalCapital)
    for (let q = 0; q < off.stats.record.length; q++) {
      expect(on.stats.record[q].realGdp, `q${q}`).toBe(off.stats.record[q].realGdp)
    }
  })
})

describe('unlimitedCapital never presents the bill (#91)', () => {
  const raise: Action = { kind: 'setDial', path: 'taxRates.income', value: 0.6 }

  it('applies an order the cabinet could not possibly afford', () => {
    const broke = (rules?: { unlimitedCapital: true }): TrueState => {
      const base = init(standardCountry, 'pc-broke', rules)
      return { ...base, politics: { ...base.politics, politicalCapital: 0 } }
    }
    expect(() => applyAction(broke(), raise)).toThrow(IllegalActionError)

    const sandbox = broke({ unlimitedCapital: true })
    const after = applyAction(sandbox, raise)
    expect(after.gov.dials.taxRates.income).toBe(0.6)
    expect(after.politics.politicalCapital).toBe(0)
  })

  it('still quotes the order at its real price, and the room still minds', () => {
    const standard = init(standardCountry, 'pc-quote')
    const sandbox = init(standardCountry, 'pc-quote', { unlimitedCapital: true })
    // the quote is the whip count made legible; free orders would make the
    // veto players invisible, which is most of what the game is about
    expect(politicalCostOfAction(sandbox, raise)).toBe(politicalCostOfAction(standard, raise))

    const before = sandbox.institutions.blocs.industrialists.favor
    const after = applyAction(sandbox, raise)
    expect(after.institutions.blocs.industrialists.favor).toBeLessThan(before)
  })

  it('leaves accrual alone, so the meter is honest about what was earned', () => {
    const sandbox = play(init(standardCountry, 'pc-accrual', { unlimitedCapital: true }), 8)
    const standard = play(init(standardCountry, 'pc-accrual'), 8)
    expect(sandbox.politics.politicalCapital).toBe(standard.politics.politicalCapital)
  })
})
