/**
 * Invariant checks (dev builds and test suites). Throws with a pointed
 * message — a violated invariant is a bug in a step, never a shrug.
 */

import { IMMIGRATION_LIMIT_MAX, STATUTE_LEVELS } from '../constants'
import { effectiveConsumptionWeights } from '../pipeline/derive'
import {
  BLOC_IDS,
  INSTITUTION_IDS,
  SECTOR_IDS,
  SPENDING_PROGRAM_IDS,
  STATUTE_IDS,
  type TrueState,
} from './schema'

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
    finite(s.credit, `credit[${s.id}]`)
    if (s.credit < 0) throw new InvariantError(`credit[${s.id}] < 0`)
  }
  finite(state.finance.assetPrice, 'finance.assetPrice')
  finite(state.finance.creditToGdp, 'finance.creditToGdp')
  finite(state.finance.bankCapital, 'finance.bankCapital')
  finite(state.external.foreignOwnedCapital, 'external.foreignOwnedCapital')
  if (state.finance.assetPrice <= 0) throw new InvariantError('finance.assetPrice ≤ 0')
  if (state.finance.bankCapital < 0) throw new InvariantError('finance.bankCapital < 0')
  if (state.external.foreignOwnedCapital < 0) {
    throw new InvariantError('external.foreignOwnedCapital < 0')
  }
  finite(state.demography.humanCapital, 'demography.humanCapital')
  if (state.demography.humanCapital < 0 || state.demography.humanCapital > 1) {
    throw new InvariantError('demography.humanCapital out of [0,1]')
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
    // The authored recipe above is checked because a bad table is a bad
    // country; the DERIVED basket is checked because it is what the economy
    // actually spends, and a NaN in it silently zeroes a sector's demand
    // rather than throwing anywhere (ADR-0029).
    finite(c.engelReference, `engelReference[${c.id}]`)
    const effective = effectiveConsumptionWeights(state, c.id)
    let eSum = 0
    for (const sid of SECTOR_IDS) {
      finite(effective[sid], `effectiveConsumptionWeights[${c.id}][${sid}]`)
      if (effective[sid] < 0) {
        throw new InvariantError(`effectiveConsumptionWeights[${c.id}][${sid}] < 0`)
      }
      eSum += effective[sid]
    }
    if (Math.abs(eSum - 1) > 1e-6) {
      throw new InvariantError(`effectiveConsumptionWeights[${c.id}] sum to ${eSum}`)
    }
  }
  finite(state.gov.debt, 'debt')
  finite(state.gov.budget.balance, 'budget.balance')
  finite(state.gov.dials.immigrationLimit, 'immigrationLimit')
  if (
    state.gov.dials.immigrationLimit < 0 ||
    state.gov.dials.immigrationLimit > IMMIGRATION_LIMIT_MAX
  ) {
    throw new InvariantError('immigrationLimit out of range')
  }
  for (const programme of SPENDING_PROGRAM_IDS) {
    const amount = state.gov.dials.spending[programme]
    const rule = state.gov.spendingRules[programme]
    finite(amount, `spending[${programme}]`)
    if (amount < 0) throw new InvariantError(`spending[${programme}] < 0`)
    if (rule.kind === 'gdpShare') {
      finite(rule.share, `spendingRules[${programme}].share`)
      if (rule.share < 0 || rule.share > 1) {
        throw new InvariantError(`spendingRules[${programme}].share out of [0,1]`)
      }
    } else {
      finite(rule.amount, `spendingRules[${programme}].amount`)
      if (rule.amount < 0) throw new InvariantError(`spendingRules[${programme}].amount < 0`)
    }
  }
  finite(state.ledger.inflationExpectations, 'inflationExpectations')
  finite(state.flows.realGdp, 'realGdp')
  finite(state.flows.nominalGdp, 'nominalGdp')
  finite(state.flows.privateDomesticDemandReal, 'privateDomesticDemandReal')
  finite(state.flows.governmentDomesticDemandReal, 'governmentDomesticDemandReal')
  finite(state.flows.publicInvestmentReal, 'publicInvestmentReal')
  finite(state.flows.foreignDirectInvestmentReal, 'foreignDirectInvestmentReal')
  finite(state.flows.foreignDirectInvestmentValue, 'foreignDirectInvestmentValue')
  finite(state.flows.foreignProfitRemittances, 'foreignProfitRemittances')
  if (state.gov.debt < 0) throw new InvariantError('debt < 0')
  if (state.flows.realGdp < 0) throw new InvariantError('realGdp < 0')
  if (state.flows.privateDomesticDemandReal < 0) {
    throw new InvariantError('privateDomesticDemandReal < 0')
  }
  if (state.flows.governmentDomesticDemandReal < 0) {
    throw new InvariantError('governmentDomesticDemandReal < 0')
  }
  if (state.flows.foreignDirectInvestmentReal < 0) {
    throw new InvariantError('foreignDirectInvestmentReal < 0')
  }
  if (state.flows.foreignDirectInvestmentValue < 0) {
    throw new InvariantError('foreignDirectInvestmentValue < 0')
  }
  if (state.flows.foreignProfitRemittances < 0) {
    throw new InvariantError('foreignProfitRemittances < 0')
  }
  // the state's demand is procurement plus public works, so the works can
  // never exceed it — and the expenditure accounts get government final
  // consumption by subtracting one from the other
  if (state.flows.publicInvestmentReal > state.flows.governmentDomesticDemandReal + 1e-9) {
    throw new InvariantError('publicInvestmentReal exceeds government demand')
  }
  for (const [cid, v] of Object.entries(state.gov.capacity)) {
    finite(v, `capacity[${cid}]`)
    if (v < 0 || v > 1) throw new InvariantError(`capacity[${cid}] out of [0,1]`)
  }
  // The statute book. A level off the end of its own ladder is the failure
  // worth catching here: `STATUTE_LEVELS[id][level]` would be undefined, and
  // `statuteForce` would quietly read a strength of 0 — a statute the player
  // enacted and paid for, doing nothing, with no error anywhere.
  for (const id of STATUTE_IDS) {
    const statute = state.gov.statutes[id]
    const { level, enactedAt } = statute
    if (!Number.isInteger(level) || level < 0 || level >= STATUTE_LEVELS[id].length) {
      throw new InvariantError(`statutes[${id}].level = ${level} is off its ladder`)
    }
    finite(enactedAt, `statutes[${id}].enactedAt`)
    if (enactedAt < 0 || enactedAt > state.meta.tick) {
      throw new InvariantError(`statutes[${id}].enactedAt = ${enactedAt} is not a past quarter`)
    }
  }
  const inst = state.institutions
  for (const id of INSTITUTION_IDS) {
    finite(inst.stocks[id], `institutions.stocks[${id}]`)
    if (inst.stocks[id] < 0 || inst.stocks[id] > 1) {
      throw new InvariantError(`institutions.stocks[${id}] out of [0,1]`)
    }
  }
  for (const [name, v] of [
    ['societalPower', inst.societalPower],
    ['statePower', inst.statePower],
    ['unrest', inst.unrest],
  ] as const) {
    finite(v, `institutions.${name}`)
    if (v < 0 || v > 1) throw new InvariantError(`institutions.${name} out of [0,1]`)
  }
  for (const id of BLOC_IDS) {
    const b = inst.blocs[id]
    finite(b.power, `blocs[${id}].power`)
    finite(b.favor, `blocs[${id}].favor`)
    if (b.power < 0 || b.power > 1) throw new InvariantError(`blocs[${id}].power out of [0,1]`)
    if (b.favor < -1 || b.favor > 1) throw new InvariantError(`blocs[${id}].favor out of [-1,1]`)
  }
  for (const c of state.cohorts) {
    if (c.enfranchisement < 0 || c.enfranchisement > 1) {
      throw new InvariantError(`enfranchisement[${c.id}] out of [0,1]`)
    }
  }
}
