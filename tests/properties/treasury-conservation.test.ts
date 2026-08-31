/**
 * The treasury's books close (issue #211, ADR-0036).
 *
 * `budget-composition.test.ts` checks that the splits equal the headline
 * totals — `revenue − outlays === balance` — and stops exactly where this
 * file starts. It could not have caught the defect this one exists for,
 * because that defect was on the other side of the balance: a surplus arriving
 * at a treasury with no debt left to redeem was collected by `revenue` and then
 * assigned to nothing at all. Not spent, not saved, not returned. Gone.
 *
 * And reachable in ordinary play rather than at some contrived extreme: under
 * the developmental baseline debt hits zero at a median quarter 62 and the
 * government then runs a structural surplus for the remaining eighty-five years
 * (investigation 0008). Most long games spend most of their length there.
 *
 * So the claim asserted here is an identity, not a behaviour:
 *
 *     balance = repaid − borrowed − printed + Δfund + rebate
 *
 * every quarter, on every policy, at every setting of the dial. Written in the
 * stocks it can be read off the state as
 *
 *     balance + Δdebt + Δprinted − Δfund − rebate = 0
 *
 * which is the form below, because those are the four things a quarter's money
 * can become and there is deliberately no fifth.
 *
 * One thing this file is NOT is a whole-economy money conservation test, and
 * the distinction matters. The engine leaks money on purpose in one place: a
 * voted appropriation is charged to the treasury in full and reaches households
 * scaled by `adminEffectiveness`, and the difference is the point of having a
 * civil service to build. The rebate deliberately does not leak — the tax
 * office refunds against wages it already assessed — but a test that demanded
 * closure across the whole economy would be asserting that programme delivery
 * is free.
 */

import { describe, expect, it } from 'vitest'
import {
  applyActions,
  createCountryParams,
  init,
  IllegalActionError,
  rngFor,
  step,
  validate,
  type Action,
  type TrueState,
} from '@terrarium/engine'
import {
  developmentalPolicy,
  randomPolicy,
  regulatedPolicy,
  type RunnerPolicy,
} from '../../packages/runner/src/policies'

/** A quarter's worth of treasury readings, taken either side of one `step`. */
interface Quarter {
  tick: number
  balance: number
  deltaDebt: number
  deltaFund: number
  printed: number
  rebate: number
  debt: number
  fund: number
  residualToNowhere: number
}

/**
 * Play a century and read the books each quarter.
 *
 * Lenient about refused orders in exactly the way `runOne` is — an unaffordable
 * capacity bid is a fact about the country, not a failure of the harness — and
 * never lenient about the thing under test. Any arm measuring the dial passes
 * `unlimitedCapital`, and its control passes it too: the surplus rule is quoted
 * near 94 PC against the 20 a new cabinet holds, so the first draft of the
 * rebate arm was a developmental century with the dial still at zero and two
 * results identical to the last decimal. That is the statute book's
 * lenient-experiment lesson, and it caught this file as well.
 */
function books(
  seed: string,
  ticks: number,
  policy?: RunnerPolicy,
  opening: Action[] = [],
  rules: Parameters<typeof init>[2] = 'standard',
): Quarter[] {
  let state = init(createCountryParams('meridia', seed), seed, rules)
  if (opening.length > 0) state = applyActions(state, opening)
  const quarters: Quarter[] = []
  for (let tick = 0; tick < ticks; tick++) {
    if (policy) {
      const actions = policy(state, rngFor(seed, 'policy', tick), tick)
      if (actions.length > 0) {
        try {
          state = applyActions(state, actions)
        } catch (error) {
          if (!(error instanceof IllegalActionError)) throw error
        }
      }
    }
    const before = state.gov
    state = step(state)
    const after = state.gov
    quarters.push({
      tick,
      balance: after.budget.balance,
      deltaDebt: after.debt - before.debt,
      deltaFund: after.fund - before.fund,
      printed: after.printed - before.printed,
      rebate: state.flows.fiscalRebate,
      debt: after.debt,
      fund: after.fund,
      residualToNowhere: Math.max(0, after.budget.balance) - Math.min(Math.max(0, after.budget.balance), before.debt),
    })
  }
  return quarters
}

/** The identity, in the units it is stated in. Absolute rather than relative,
 * scaled to the quarter's own turnover: a century-end fund is a large number
 * and an unaccounted penny beside it must still fail. */
function unaccounted(q: Quarter): number {
  return q.balance + q.deltaDebt + q.printed - q.deltaFund - q.rebate
}

const TICKS = 240

describe('every quarter’s balance has exactly one destination', () => {
  const arms: Array<[string, RunnerPolicy | undefined]> = [
    ['passive', undefined],
    ['developmental', developmentalPolicy],
    ['random', randomPolicy],
    ['regulated', regulatedPolicy],
  ]

  for (const [name, policy] of arms) {
    it(`closes the books every quarter under ${name} play`, () => {
      for (const seed of [`conserve-${name}-0`, `conserve-${name}-1`]) {
        const quarters = books(seed, TICKS, policy)
        for (const q of quarters) {
          const scale = Math.max(1, Math.abs(q.balance), q.fund, q.debt)
          expect(
            Math.abs(unaccounted(q)) / scale,
            `${seed} q${q.tick}: ${unaccounted(q)} unaccounted for`,
          ).toBeLessThan(1e-9)
        }
      }
    })
  }

  it('closes them at every setting of the dial, not only the default', () => {
    for (const payout of [0, 0.25, 0.5, 0.75, 1]) {
      const quarters = books(
        `conserve-payout-${payout}`,
        TICKS,
        developmentalPolicy,
        [{ kind: 'setDial', path: 'surplusPayout', value: payout }],
        { unlimitedCapital: true },
      )
      for (const q of quarters) {
        const scale = Math.max(1, Math.abs(q.balance), q.fund, q.debt)
        expect(Math.abs(unaccounted(q)) / scale, `payout ${payout} at q${q.tick}`).toBeLessThan(1e-9)
      }
    }
  })
})

describe('the defect this closes was reachable in ordinary play', () => {
  it('a debt-free treasury still books a surplus somewhere', () => {
    // The regime the old arithmetic dropped money in: `repaid` clipped to a
    // debt stock of zero while `balance` stayed positive. Assert the regime is
    // reached at all before asserting anything about it — a mechanic nothing
    // reaches is a mechanic nothing tests.
    const quarters = books('conserve-debtfree', TICKS, developmentalPolicy)

    const stranded = quarters.filter((q) => q.residualToNowhere > 1e-9)
    expect(stranded.length, 'no quarter reached the debt-free surplus').toBeGreaterThan(TICKS / 4)
    for (const q of stranded) {
      expect(q.deltaFund + q.rebate, `q${q.tick} banked nothing`).toBeCloseTo(q.residualToNowhere, 9)
    }
  })

  it('hands the surplus back rather than banking it when the dial says so', () => {
    // Both arms under the same rules, so the only difference between them is
    // the order itself. The room's objection to that order is not a confound
    // to be paired away — it is what the order costs.
    const rules = { unlimitedCapital: true }
    const banked = books('conserve-split', TICKS, developmentalPolicy, [], rules)
    const returned = books(
      'conserve-split',
      TICKS,
      developmentalPolicy,
      [{ kind: 'setDial', path: 'surplusPayout', value: 1 }],
      rules,
    )
    const sum = (qs: Quarter[], f: (q: Quarter) => number) => qs.reduce((a, q) => a + f(q), 0)
    expect(sum(banked, (q) => q.rebate)).toBe(0)
    expect(banked[banked.length - 1].fund).toBeGreaterThan(0)
    expect(sum(returned, (q) => q.rebate)).toBeGreaterThan(0)
    // Not a claim that the fund is empty — the two arms are different
    // economies from the first rebate onward, and a quarter that runs a deficit
    // in one and not the other banks differently — only that the doctrine
    // shows: money handed back is money not banked.
    expect(returned[returned.length - 1].fund).toBeLessThan(banked[banked.length - 1].fund)
  })
})

describe('the fund and the debt are one net position', () => {
  it('never holds both, on any policy', () => {
    for (const [name, policy] of [
      ['passive', undefined],
      ['random', randomPolicy],
    ] as Array<[string, RunnerPolicy | undefined]>) {
      for (const q of books(`net-position-${name}`, TICKS, policy)) {
        expect(Math.min(q.debt, q.fund), `${name} q${q.tick}`).toBeLessThan(1e-6)
      }
    }
  })

  it('spends the fund before it borrows, and borrows only once it is empty', () => {
    // A country given a fund and then a bill it cannot pay: the fund must go
    // first, and no bond may be issued while a penny of it remains. This is
    // the mirror of redeeming debt before banking anything, and it is why the
    // sovereign premium can go on reading `gov.debt` alone.
    let state = init(createCountryParams('meridia', 'drawdown'), 'drawdown', {
      unlimitedCapital: true,
    })
    for (let tick = 0; tick < 8; tick++) state = step(state)
    const seeded: TrueState = { ...state, gov: { ...state.gov, debt: 0, fund: 40 } }
    expect(() => validate(seeded)).not.toThrow()

    let s = applyActions(seeded, [
      { kind: 'setDial', path: 'spending.transfers', value: 8 * seeded.flows.nominalGdp * 0.1 },
    ])
    let sawDrawdown = false
    for (let tick = 0; tick < 24; tick++) {
      const before = s.gov
      s = step(s)
      const drawn = before.fund - s.gov.fund
      if (drawn > 1e-9) {
        sawDrawdown = true
        // while the fund is being spent nothing is borrowed and nothing printed
        if (s.gov.fund > 1e-6) {
          expect(s.gov.debt, `borrowed at q${tick} with ${s.gov.fund} still in the fund`).toBe(0)
          expect(s.flows.printedThisQtr).toBe(0)
        }
      }
      if (s.gov.debt > 1e-6) expect(s.gov.fund, `held both at q${tick}`).toBeLessThan(1e-6)
    }
    expect(sawDrawdown, 'the deficit never reached the fund').toBe(true)
  })
})

describe('the rebate reaches households, whole', () => {
  it('what fiscal books is exactly what the cohorts receive', () => {
    // The treasury identity above closes on the BOOKED rebate. If `cohorts`
    // distributed less than that, the treasury's books would still balance and
    // the money would vanish between the two steps — the same defect one
    // pipeline stage further along, and invisible to every other assertion in
    // this file.
    let state = init(createCountryParams('meridia', 'rebate-split'), 'rebate-split', {
      unlimitedCapital: true,
    })
    state = applyActions(state, [{ kind: 'setDial', path: 'surplusPayout', value: 1 }])
    let paid = 0
    for (let tick = 0; tick < 160; tick++) {
      state = applyActions(state, developmentalPolicy(state, rngFor('rebate-split', 'policy', tick), tick))
      state = step(state)
      const booked = state.flows.fiscalRebate
      const received = state.cohorts.reduce((sum, c) => sum + c.rebateIncome, 0)
      expect(received, `q${tick}: booked ${booked}, received ${received}`).toBeCloseTo(booked, 9)
      paid += booked
      // and it follows the wage bill: nobody outside it is paid
      expect(state.cohorts.find((c) => c.id === 'retirees')!.rebateIncome).toBe(0)
    }
    expect(paid, 'no rebate was ever paid').toBeGreaterThan(0)
  })
})

describe('a rebate needs somebody who paid the tax', () => {
  it('banks the residual rather than losing it when there is no wage bill', () => {
    // Degenerate, and reachable only by doctoring a state — but the branch is
    // the one place the rebate could quietly delete money, which is the whole
    // class of defect this file exists for. A country with no employment has
    // nobody to refund, so the residual must still land somewhere.
    let state = init(createCountryParams('meridia', 'no-wages'), 'no-wages', {
      unlimitedCapital: true,
    })
    for (let tick = 0; tick < 8; tick++) state = step(state)
    const idle: TrueState = {
      ...state,
      gov: { ...state.gov, debt: 0, dials: { ...state.gov.dials, surplusPayout: 1 } },
      sectors: state.sectors.map((sector) => ({ ...sector, employment: 0 })),
    }
    const before = idle.gov
    const after = step(idle)
    expect(after.flows.fiscalRebate).toBe(0)
    expect(
      after.gov.budget.balance +
        (after.gov.debt - before.debt) +
        (after.gov.printed - before.printed) -
        (after.gov.fund - before.fund) -
        after.flows.fiscalRebate,
    ).toBeCloseTo(0, 9)
  })
})

describe('the fund is a stock with a return, and the return is a revenue line', () => {
  it('pays the budget on the stock it opened the quarter with', () => {
    let state = init(createCountryParams('meridia', 'yield'), 'yield')
    for (let tick = 0; tick < 8; tick++) state = step(state)
    const withFund: TrueState = { ...state, gov: { ...state.gov, debt: 0, fund: 100 } }
    const without: TrueState = { ...state, gov: { ...state.gov, debt: 0, fund: 0 } }
    const a = step(withFund)
    const b = step(without)
    expect(a.flows.revenueBySource.fund).toBeCloseTo((100 * 0.02) / 4, 12)
    expect(b.flows.revenueBySource.fund).toBe(0)
    expect(a.gov.budget.revenue - b.gov.budget.revenue).toBeCloseTo(0.5, 12)
  })
})
