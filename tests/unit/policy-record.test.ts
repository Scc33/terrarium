/**
 * The policy record — the dials filed once per quarter, beside that quarter's
 * treasury books (schema v22, issue #54).
 *
 * The whole point is that it is a RECORD: a rate set in 1970 must not change
 * the answer to "what was the rate in 1950". Everything else on the wall is a
 * revisable estimate; this is the one series that is finished the moment it
 * is written, and the tests below are what stops it drifting into being
 * derived from the present.
 *
 * `votedAt` gets its own coverage because it is the only thing separating a
 * decision from a consequence: an indexed appropriation's amount moves on
 * every CPI print, and the UI's minute book files a decision exactly when
 * this stamp moves.
 */

import { describe, expect, it } from 'vitest'
import { applyAction, init, step, type Action, type TrueState } from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

const rich = (state: TrueState): TrueState => ({
  ...state,
  politics: { ...state.politics, politicalCapital: 1e9 },
})

/** play `ticks` quarters, applying whatever the script orders on the way in */
function play(ticks: number, script: Record<number, Action[]> = {}): TrueState {
  let s = rich(init(standardCountry, 'policy-record'))
  for (let t = 0; t < ticks; t++) {
    for (const action of script[t] ?? []) s = applyAction(s, action)
    s = rich(step(s))
  }
  return s
}

const setIncome = (value: number): Action => ({
  kind: 'setDial',
  path: 'taxRates.income',
  value,
})

describe('the policy record', () => {
  it('files exactly one row per quarter governed', () => {
    const pub = observe(play(24))
    expect(pub.policy).toHaveLength(24)
    expect(pub.policy.map((p) => p.tick)).toEqual([...Array(24).keys()])
  })

  it('its last row is the dials the game is currently showing', () => {
    const state = play(12)
    const pub = observe(state)
    const last = pub.policy[pub.policy.length - 1]
    // the record is written in the quarter it describes, so the newest row is
    // the quarter just played, not the one about to be
    expect(last.tick).toBe(pub.tick - 1)
    expect(last.taxRates).toEqual(pub.dials.taxRates)
    expect(last.policyRate).toBe(pub.dials.policyRate)
  })

  it('remembers a rate the cabinet has since moved away from', () => {
    // the literal question in the issue: the rate twenty quarters ago
    const pub = observe(play(24, { 4: [setIncome(0.3)], 20: [setIncome(0.05)] }))
    const at = (tick: number) => pub.policy.find((p) => p.tick === tick)!
    expect(at(0).taxRates.income).toBeCloseTo(0.15) // the 1946 settlement
    expect(at(3).taxRates.income).toBeCloseTo(0.15)
    expect(at(4).taxRates.income).toBeCloseTo(0.3) // set on the way into Q4
    expect(at(19).taxRates.income).toBeCloseTo(0.3)
    expect(at(23).taxRates.income).toBeCloseTo(0.05)
    expect(pub.dials.taxRates.income).toBeCloseTo(0.05)
  })

  it('is append-only: playing further never rewrites a filed quarter', () => {
    const early = observe(play(10, { 2: [setIncome(0.25)] })).policy
    const later = observe(play(30, { 2: [setIncome(0.25)], 15: [setIncome(0.4)] })).policy
    expect(later.slice(0, 10)).toEqual(early)
  })

  it('records every Layer-1 dial, not a hand-listed subset', () => {
    // `PolicyRecord` extends `DialState`, so this stays true of levers that do
    // not exist yet — the QE and bank-capital dials were added to the cabinet
    // after this record shipped and needed no change here to be captured
    const state = play(8, {
      3: [{ kind: 'setDial', path: 'assetPurchaseRate', value: 0.05 }],
      5: [{ kind: 'setDial', path: 'capitalRequirement', value: 0.12 }],
    })
    const pub = observe(state)
    const dialKeys = Object.keys(pub.dials).filter((k) => k !== 'subsidies')
    for (const row of pub.policy) {
      for (const key of dialKeys) expect(row, `tick ${row.tick}`).toHaveProperty(key)
    }
    const at = (tick: number) => pub.policy.find((p) => p.tick === tick)!
    expect(at(2).assetPurchaseRate).toBe(0)
    expect(at(3).assetPurchaseRate).toBeCloseTo(0.05)
    expect(at(4).capitalRequirement).not.toBeCloseTo(0.12)
    expect(at(5).capitalRequirement).toBeCloseTo(0.12)
  })

  it('fills every sector subsidy, including the ones never paid', () => {
    const pub = observe(play(6, { 1: [{ kind: 'setDial', path: 'subsidies.agri', value: 0.4 }] }))
    for (const row of pub.policy) {
      expect(Object.keys(row.subsidies).sort()).toEqual([
        'agri',
        'energy',
        'manuf',
        'services',
        'transport',
      ])
      expect(Object.values(row.subsidies).every(Number.isFinite)).toBe(true)
    }
    expect(pub.policy[0].subsidies.agri).toBe(0)
    expect(pub.policy[5].subsidies.agri).toBeCloseTo(0.4)
    expect(pub.policy[5].subsidies.manuf).toBe(0)
  })
})

describe('votedAt separates a decision from a consequence', () => {
  it('opens every appropriation stamped with the 1946 settlement', () => {
    const pub = observe(play(8))
    for (const row of pub.policy) {
      for (const programme of ['transfers', 'procurement', 'investment', 'research'] as const) {
        expect(row.rules[programme].votedAt, programme).toBe(0)
      }
    }
  })

  it('stamps the quarter a rule was written, and only that quarter', () => {
    const pub = observe(
      play(20, {
        9: [{ kind: 'setSpendingRule', programme: 'transfers', mode: 'indexed', value: 6 }],
      }),
    )
    for (const row of pub.policy) {
      expect(row.rules.transfers.votedAt, `tick ${row.tick}`).toBe(row.tick < 9 ? 0 : 9)
    }
  })

  it('does NOT re-stamp an indexed appropriation as inflation moves it', () => {
    const pub = observe(
      play(40, {
        4: [{ kind: 'setSpendingRule', programme: 'transfers', mode: 'indexed', value: 6 }],
      }),
    )
    const after = pub.policy.filter((p) => p.tick >= 4)
    // the money is expected to move — that is what indexation is for
    const amounts = new Set(after.map((p) => p.rules.transfers.value.toFixed(6)))
    expect(amounts.size).toBeGreaterThan(1)
    // …and the decision behind it is expected not to
    expect(new Set(after.map((p) => p.rules.transfers.votedAt))).toEqual(new Set([4]))
  })

  it('records the rule as voted, not as resolved, for a GDP-share appropriation', () => {
    const pub = observe(
      play(40, {
        30: [{ kind: 'setSpendingRule', programme: 'investment', mode: 'gdpShare', value: 0.04 }],
      }),
    )
    const row = pub.policy[pub.policy.length - 1]
    expect(row.rules.investment.mode).toBe('gdpShare')
    expect(row.rules.investment.value).toBeCloseTo(0.04) // a share, not money
    expect(row.spending.investment).toBeGreaterThan(0.04) // the money it bought
  })
})
