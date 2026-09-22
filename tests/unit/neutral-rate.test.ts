/**
 * The neutral-rate arithmetic (`pipeline/funding.ts`, ADR-0043).
 *
 * The truth and the central-bank desk's estimate of it share one formula,
 * exposed on scalars beside the state-reading versions. Two things have to
 * stay true for that sharing to mean anything: the scalar helper fed the
 * truth's own inputs gives the truth's own answer, bit for bit — a refactor
 * that reordered an operand would move every golden hash while every test on
 * the helper alone still passed — and `neutralPolicyRateOf` is the exact
 * inverse it claims to be, the posted rate at which the private real rate
 * reads the anchor.
 */

import { describe, expect, it } from 'vitest'
import {
  applyActions,
  assetPurchaseRateEquivalent,
  bondIssuanceShare,
  domesticBondFundingShare,
  financierAnger,
  init,
  NATURAL_REAL_RATE,
  neutralPolicyRateOf,
  privateFundingSpread,
  privateFundingSpreadOf,
  privateRealRate,
  privateRealRateOf,
  sovereignRiskPremium,
  sovereignRiskPremiumOf,
  step,
  type TrueState,
} from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'

function play(ticks: number, order?: Parameters<typeof applyActions>[1]): TrueState {
  let s = init(standardCountry, 'neutral-rate-unit')
  if (order) s = applyActions(s, order)
  for (let t = 0; t < ticks; t++) s = step(s)
  return s
}

describe('the scalar helpers are the truth on scalars', () => {
  const states = [
    play(0),
    play(12),
    play(40),
    play(40, [{ kind: 'setDial', path: 'assetPurchaseRate', value: 0.08 }]),
    play(24, [{ kind: 'setDial', path: 'policyRate', value: 0 }]),
  ]

  it('sovereignRiskPremiumOf(debt ratio, anger) is sovereignRiskPremium(state)', () => {
    for (const s of states) {
      const debtToGdp = s.gov.debt / Math.max(4 * s.flows.nominalGdp, 1e-9)
      expect(sovereignRiskPremiumOf(debtToGdp, financierAnger(s))).toBe(sovereignRiskPremium(s))
    }
  })

  it('privateFundingSpreadOf(auction, domestic share, premium) is privateFundingSpread(state)', () => {
    for (const s of states) {
      expect(
        privateFundingSpreadOf(
          bondIssuanceShare(s),
          domesticBondFundingShare(s.params.openness),
          sovereignRiskPremium(s),
        ),
      ).toBe(privateFundingSpread(s))
    }
  })

  it('privateRealRateOf(...) is privateRealRate(state), including the purchase pace', () => {
    for (const s of states) {
      expect(
        privateRealRateOf(
          s.gov.dials.policyRate,
          s.ledger.inflationExpectations,
          privateFundingSpread(s),
          s.gov.dials.assetPurchaseRate,
        ),
      ).toBe(privateRealRate(s))
    }
  })
})

describe('neutralPolicyRateOf', () => {
  it('is the posted rate at which the private real rate reads the anchor', () => {
    for (const [expected, spread, pace] of [
      [0.03, 0.0, 0.0],
      [-0.033, 0.0094, 0.0],
      [0.02, 0.004, 0.1],
      [0.5, 0.05, 0.25],
    ]) {
      const neutral = neutralPolicyRateOf(expected, spread, pace)
      expect(privateRealRateOf(neutral, expected, spread, pace)).toBeCloseTo(NATURAL_REAL_RATE, 12)
    }
  })

  it('moves point for point with expectations, against the spread, and with the purchase pace at its gain', () => {
    const base = neutralPolicyRateOf(0.03, 0.01, 0)
    expect(neutralPolicyRateOf(0.04, 0.01, 0) - base).toBeCloseTo(0.01, 12)
    expect(neutralPolicyRateOf(0.03, 0.02, 0) - base).toBeCloseTo(-0.01, 12)
    expect(neutralPolicyRateOf(0.03, 0.01, 0.1) - base).toBeCloseTo(assetPurchaseRateEquivalent(0.1), 12)
  })

  it('agrees with the neutral-rate study’s reading of the truth', () => {
    // `tools/measure-neutral-rate.ts` defines neutral as the posted rate less
    // the real-rate gap; the closed form must be the same number
    for (const s of [play(8), play(20), play(80)]) {
      const fromGap = s.gov.dials.policyRate - (privateRealRate(s) - NATURAL_REAL_RATE)
      expect(
        neutralPolicyRateOf(s.ledger.inflationExpectations, privateFundingSpread(s), s.gov.dials.assetPurchaseRate),
      ).toBeCloseTo(fromGap, 12)
    }
  })
})
