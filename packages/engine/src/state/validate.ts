/**
 * Invariant checks (dev builds and test suites). Throws with a pointed
 * message — a violated invariant is a bug in a step, never a shrug.
 */

import { SECTOR_IDS, type TrueState } from './schema'

export class InvariantError extends Error {}

function finite(x: number, what: string): void {
  if (!Number.isFinite(x)) throw new InvariantError(`${what} is ${x}`)
}

export function validate(state: TrueState): void {
  for (const sid of SECTOR_IDS) {
    finite(state.market.prices[sid], `price[${sid}]`)
    finite(state.market.wages[sid], `wage[${sid}]`)
    if (state.market.prices[sid] <= 0) throw new InvariantError(`price[${sid}] ≤ 0`)
  }
  for (const s of state.sectors) {
    finite(s.output, `output[${s.id}]`)
    finite(s.capital, `capital[${s.id}]`)
    finite(s.employment, `employment[${s.id}]`)
    if (s.capital < 0) throw new InvariantError(`capital[${s.id}] < 0`)
    if (s.credit !== 0) throw new InvariantError(`credit[${s.id}] must stay 0 until M5`)
  }
  for (const c of state.cohorts) {
    finite(c.savings, `savings[${c.id}]`)
    finite(c.approval, `approval[${c.id}]`)
    if (c.savings < 0) throw new InvariantError(`savings[${c.id}] < 0`)
    if (c.approval < 0 || c.approval > 1) throw new InvariantError(`approval[${c.id}] out of [0,1]`)
    const wSum = SECTOR_IDS.reduce((s, sid) => s + c.consumptionWeights[sid], 0)
    if (Math.abs(wSum - 1) > 1e-6) {
      throw new InvariantError(`consumptionWeights[${c.id}] sum to ${wSum}`)
    }
  }
  finite(state.gov.debt, 'debt')
  finite(state.gov.budget.balance, 'budget.balance')
  finite(state.ledger.inflationExpectations, 'inflationExpectations')
  finite(state.flows.realGdp, 'realGdp')
  finite(state.flows.nominalGdp, 'nominalGdp')
  if (state.gov.debt < 0) throw new InvariantError('debt < 0')
  if (state.flows.realGdp < 0) throw new InvariantError('realGdp < 0')
  for (const [cid, v] of Object.entries(state.gov.capacity)) {
    finite(v, `capacity[${cid}]`)
    if (v < 0 || v > 1) throw new InvariantError(`capacity[${cid}] out of [0,1]`)
  }
}
