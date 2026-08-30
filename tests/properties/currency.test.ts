/**
 * The currency (issue #152, ADR-0033). These are the design's load-bearing
 * claims about the foreign exchange market, and each of them was written
 * against a bug the first draft of `trade.ts` actually shipped.
 *
 * The mechanism claims are asserted on the STEP, where the channel is visible
 * with everything else held still. What a standing order is worth in play is a
 * different question with a different answer — `pnpm currency` measures that,
 * and the two are allowed to disagree for the reason the statute book's
 * tuning lesson gives.
 */

import { describe, expect, it } from 'vitest'
import {
  applyActions,
  carryYieldSpread,
  createCountryParams,
  exchangeRateParity,
  fillableIntervention,
  init,
  realExchangeRate,
  rngFor,
  SECTOR_IDS,
  settleForeignExchange,
  step,
  TICK_ORDER,
  type TrueState,
} from '@terrarium/engine'
import { FX_INTERVENTION_MAX, POLICY_RATE_1946 } from '../../packages/engine/src/constants'

function runTrade(state: TrueState): TrueState {
  const trade = TICK_ORDER.find((candidate) => candidate.name === 'trade')!
  return trade.run(state, rngFor(state.meta.seed, trade.name, state.meta.tick))
}

/** A country a few years in, so the flows the step reads are real ones. */
function played(ticks = 24, seed = 'currency'): TrueState {
  let state = init(createCountryParams('meridia', seed), seed)
  for (let tick = 0; tick < ticks; tick++) state = step(state)
  return state
}

const withDial = (state: TrueState, value: number): TrueState => ({
  ...state,
  gov: { ...state.gov, dials: { ...state.gov.dials, fxIntervention: value } },
})

describe('the exchange rate is a price with a fundamental', () => {
  it('opens every country at its own parity, measured rather than assumed', () => {
    for (const id of ['meridia', 'costona', 'oranga', 'veltravia', 'kestrel'] as const) {
      const state = init(createCountryParams(id, 'parity'), 'parity')
      // `init` normalises both price vectors, so the inherited real rate is 1
      // for the whole catalogue — but it is READ off the vectors rather than
      // written down, which is the difference ADR-0028 paid for the hard way.
      expect(realExchangeRate(state), id).toBeCloseTo(1, 12)
      expect(exchangeRateParity(state), id).toBeCloseTo(state.external.exchangeRate, 12)
    }
  })

  it('follows the domestic price level, so inflation weakens the currency', () => {
    const base = played()
    const dearer = {
      ...base,
      market: {
        ...base.market,
        prices: Object.fromEntries(
          SECTOR_IDS.map((sid) => [sid, base.market.prices[sid] * 1.5]),
        ) as TrueState['market']['prices'],
      },
    }
    expect(exchangeRateParity(dearer)).toBeGreaterThan(exchangeRateParity(base))
  })

  it('depreciates the currency of a government that inflates', () => {
    // The end-to-end version of the claim above, and the one worth pinning: a
    // counterfactual that raises the price vector by hand also raises exports
    // AT UNCHANGED VOLUMES, which flatters the balance and tilts the currency
    // the other way. Only a run can hold the two honest against each other.
    const spend = (state: TrueState): TrueState => {
      try {
        return applyActions(state, [
          {
            kind: 'setDial',
            path: 'spending.transfers',
            value: state.gov.dials.spending.transfers + 0.05 * state.flows.nominalGdp,
          },
        ])
      } catch {
        return state
      }
    }
    let loose = init(createCountryParams('meridia', 'inflate'), 'inflate', {
      protectedTenure: true,
      unlimitedCapital: true,
    })
    let calm = loose
    for (let tick = 0; tick < 80; tick++) {
      loose = step(spend(loose))
      calm = step(calm)
    }
    const prices = (s: TrueState) => SECTOR_IDS.reduce((a, sid) => a + s.market.prices[sid], 0)
    expect(prices(loose)).toBeGreaterThan(prices(calm))
    expect(loose.external.exchangeRate).toBeGreaterThan(calm.external.exchangeRate)
  })

  it('strengthens the currency when the posted rate rises above the settlement', () => {
    const base = played()
    expect(carryYieldSpread(base)).toBeCloseTo(base.gov.dials.policyRate - POLICY_RATE_1946, 6)
    const tight = {
      ...base,
      gov: { ...base.gov, dials: { ...base.gov.dials, policyRate: POLICY_RATE_1946 + 0.05 } },
    }
    expect(settleForeignExchange(tight).target).toBeLessThan(settleForeignExchange(base).target)
  })

  it('does not move the currency for a rate the country never changed', () => {
    // The centre is the 1946 settlement, not zero and not the natural rate.
    // Against either of those a do-nothing government would be running a
    // permanent appreciation it never ordered, and a passive century would
    // deflate for a hundred years getting out from under it.
    const base = played()
    expect(carryYieldSpread(base)).toBeCloseTo(0, 12)
  })
})

describe('the standing order', () => {
  it('weakens the currency when the bank buys and strengthens it when it sells', () => {
    const base = played()
    const buying = settleForeignExchange(withDial(base, 0.06)).target
    const floating = settleForeignExchange(base).target
    const selling = settleForeignExchange(withDial(base, -0.03)).target
    expect(buying).toBeGreaterThan(floating)
    expect(selling).toBeLessThan(floating)
  })

  it('is inert at zero: a float posts the parity the balance implies', () => {
    // The dial's default must not be a policy. Anything else and the game
    // would ship a currency stance nobody chose.
    const base = played()
    expect(base.gov.dials.fxIntervention).toBe(0)
    expect(settleForeignExchange(base).ordered).toBeCloseTo(
      settleForeignExchange(withDial(base, 0)).ordered,
      12,
    )
  })

  it('cannot buy foreign exchange the country did not earn', () => {
    // The reserve book only grows out of a surplus that actually arrived. The
    // BID still moves the price — that is how a government holds its currency
    // below parity — but the money has to come from somewhere.
    expect(fillableIntervention(10, 3, 100)).toBe(3)
    expect(fillableIntervention(10, -5, 100)).toBe(0)
    expect(fillableIntervention(2, 3, 100)).toBe(2)
  })

  it('cannot sell reserves it does not hold', () => {
    expect(fillableIntervention(-10, 0, 4)).toBe(-4)
    expect(fillableIntervention(-10, 0, 0)).toBeCloseTo(0, 12)
    expect(fillableIntervention(-2, 0, 100)).toBe(-2)
  })
})

describe('a defence that runs out', () => {
  it('breaks the currency on the quarter the reserves go, and only that quarter', () => {
    // The first version tested only "the order was clipped", which is true
    // every quarter after the book is empty — so a standing sell order broke
    // the currency by 5% every quarter for the rest of the century, and the
    // paired study reported a currency DEFENCE that raised exports 25%.
    const base = played()
    const thin = {
      ...base,
      external: { ...base.external, reserves: base.flows.nominalGdp * 0.001 },
    }
    const defending = withDial(thin, -FX_INTERVENTION_MAX)
    expect(settleForeignExchange(defending).defenceFailed).toBe(true)

    const settled = runTrade(defending)
    expect(settled.external.reserves).toBe(0)
    const empty = withDial({ ...settled, gov: defending.gov }, -FX_INTERVENTION_MAX)
    expect(settleForeignExchange(empty).defenceFailed).toBe(false)
    expect(settleForeignExchange(empty).transacted).toBeCloseTo(0, 12)
  })

  it('leaves the reserve book alone when nobody ordered anything', () => {
    const base = played()
    expect(settleForeignExchange(base).defenceFailed).toBe(false)
  })
})

describe('the reserve book', () => {
  it('holds its inherited cover under a float instead of decaying to nothing', () => {
    // Reserves are frozen money while imports grow with the economy, so a bank
    // that only ever did what the dial told it would watch its cover halve
    // every twenty-three years — and a do-nothing country would spend the back
    // half of its century being told its reserves were thin. That is the
    // warning that never turns off.
    let state = init(createCountryParams('meridia', 'cover'), 'cover')
    for (let tick = 0; tick < 200; tick++) state = step(state)
    const cover = state.external.reserves / state.flows.tariffBase
    expect(cover).toBeGreaterThan(0.5 * state.external.coverTarget)
    expect(cover).toBeLessThan(1.5 * state.external.coverTarget)
  })

  it('accumulates when the cabinet orders it to, out of the balance it earns', () => {
    let pegged = init(createCountryParams('meridia', 'peg'), 'peg')
    let floating = pegged
    for (let tick = 0; tick < 60; tick++) {
      if (Math.abs(pegged.gov.dials.fxIntervention - 0.05) > 1e-9) {
        const next = Math.min(0.05, pegged.gov.dials.fxIntervention + 0.01)
        try {
          pegged = applyActions(pegged, [
            { kind: 'setDial', path: 'fxIntervention', value: next },
          ])
        } catch {
          /* the room has priced it beyond this quarter's capital; try again next */
        }
      }
      pegged = step(pegged)
      floating = step(floating)
    }
    expect(pegged.external.reserves).toBeGreaterThan(2 * floating.external.reserves)
    // …and the currency it bought is weaker than the one it did not.
    expect(pegged.external.exchangeRate).toBeGreaterThan(floating.external.exchangeRate)
  })
})
