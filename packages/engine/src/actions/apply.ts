/**
 * Action application. Validates legality (dial bounds, PC affordability)
 * and rejects loudly — an illegal action in a replay means a bug or a
 * version mismatch, never a silent skip (§5).
 */

import {
  CAPACITY_BUILD_QTRS,
  CAPACITY_COST_PER_POINT,
  PC_COST_CAPACITY,
  PC_COST_DIAL_BASE,
  PC_COST_DIAL_SLOPE,
} from '../constants'
import { SECTOR_IDS, type SectorId, type TrueState } from '../state/schema'
import type { Action, DialPath } from './types'

export class IllegalActionError extends Error {}

interface DialSpec {
  get(s: TrueState): number
  set(s: TrueState, v: number): TrueState
  min: number
  max(s: TrueState): number
  /** denominator for the PC cost of a change */
  scale(s: TrueState): number
}

const rate = (key: 'income' | 'corporate' | 'tariff' | 'fuel', max: number): DialSpec => ({
  get: (s) => s.gov.dials.taxRates[key],
  set: (s, v) => ({
    ...s,
    gov: { ...s.gov, dials: { ...s.gov.dials, taxRates: { ...s.gov.dials.taxRates, [key]: v } } },
  }),
  min: 0,
  max: () => max,
  scale: () => 1,
})

const spend = (key: 'transfers' | 'procurement' | 'investment'): DialSpec => ({
  get: (s) => s.gov.dials.spending[key],
  set: (s, v) => ({
    ...s,
    gov: { ...s.gov, dials: { ...s.gov.dials, spending: { ...s.gov.dials.spending, [key]: v } } },
  }),
  min: 0,
  // you can announce a UBI your tax base can't support — the game never says no
  max: (s) => s.flows.nominalGdp * 1.0,
  scale: (s) => 0.1 * s.flows.nominalGdp,
})

const subsidy = (sid: SectorId): DialSpec => ({
  get: (s) => s.gov.dials.subsidies[sid] ?? 0,
  set: (s, v) => ({
    ...s,
    gov: { ...s.gov, dials: { ...s.gov.dials, subsidies: { ...s.gov.dials.subsidies, [sid]: v } } },
  }),
  min: 0,
  max: (s) => 0.2 * s.flows.nominalGdp,
  scale: (s) => 0.1 * s.flows.nominalGdp,
})

const DIALS: Record<DialPath, DialSpec> = {
  'taxRates.income': rate('income', 0.8),
  'taxRates.corporate': rate('corporate', 0.8),
  'taxRates.tariff': rate('tariff', 1.0),
  'taxRates.fuel': rate('fuel', 2.0),
  'spending.transfers': spend('transfers'),
  'spending.procurement': spend('procurement'),
  'spending.investment': spend('investment'),
  policyRate: {
    get: (s) => s.gov.dials.policyRate,
    set: (s, v) => ({ ...s, gov: { ...s.gov, dials: { ...s.gov.dials, policyRate: v } } }),
    min: 0,
    max: () => 0.5,
    scale: () => 0.1,
  },
  ...(Object.fromEntries(SECTOR_IDS.map((sid) => [`subsidies.${sid}`, subsidy(sid)])) as Record<
    `subsidies.${SectorId}`,
    DialSpec
  >),
}

function spendPc(s: TrueState, cost: number, what: string): TrueState {
  if (s.politics.politicalCapital < cost) {
    throw new IllegalActionError(
      `not enough political capital for ${what}: need ${cost.toFixed(1)}, have ${s.politics.politicalCapital.toFixed(1)}`,
    )
  }
  return {
    ...s,
    politics: { ...s.politics, politicalCapital: s.politics.politicalCapital - cost },
  }
}

export function applyAction(state: TrueState, action: Action): TrueState {
  if (!state.politics.inPower) {
    throw new IllegalActionError('you have been deposed; the dials are no longer yours')
  }
  switch (action.kind) {
    case 'setDial': {
      const spec = DIALS[action.path]
      if (!spec) throw new IllegalActionError(`unknown dial: ${action.path}`)
      const { value } = action
      if (!Number.isFinite(value)) throw new IllegalActionError(`non-finite dial value on ${action.path}`)
      if (value < spec.min || value > spec.max(state)) {
        throw new IllegalActionError(
          `${action.path}=${value} out of bounds [${spec.min}, ${spec.max(state).toFixed(2)}]`,
        )
      }
      const relChange = Math.abs(value - spec.get(state)) / spec.scale(state)
      const cost = PC_COST_DIAL_BASE + PC_COST_DIAL_SLOPE * relChange
      return spec.set(spendPc(state, cost, action.path), value)
    }
    case 'investCapacity': {
      const { target, amount } = action
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new IllegalActionError(`bad capacity investment amount: ${amount}`)
      }
      if (amount > 0.4 * state.flows.nominalGdp) {
        throw new IllegalActionError('capacity program too large to administer at once')
      }
      // a ministry at (or building toward) full strength can't absorb more
      const inFlight = state.gov.pipeline
        .filter((b) => b.target === target)
        .reduce((s, b) => s + b.perQtr * b.remaining, 0)
      if (state.gov.capacity[target] + inFlight >= 0.95) {
        throw new IllegalActionError(`the ${target} ministry is already at full strength`)
      }
      const s = spendPc(state, PC_COST_CAPACITY, `invest in ${target} capacity`)
      const points = amount / CAPACITY_COST_PER_POINT
      return {
        ...s,
        gov: {
          ...s.gov,
          pipeline: [
            ...s.gov.pipeline,
            {
              target,
              perQtr: points / CAPACITY_BUILD_QTRS,
              moneyPerQtr: amount / CAPACITY_BUILD_QTRS,
              remaining: CAPACITY_BUILD_QTRS,
            },
          ],
        },
      }
    }
  }
}
