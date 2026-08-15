/** Named runner policies. These are sampling strategies, not engine rules. */

import { CAPACITY_IDS, SECTOR_IDS, type Action, type Rng, type TrueState } from '@terrarium/engine'

export const POLICY_IDS = ['passive', 'developmental', 'random'] as const
export type PolicyId = (typeof POLICY_IDS)[number]
export type RunnerPolicy = (state: TrueState, rng: Rng, tick: number) => Action[]

/** Capacity-isolation baseline: keep building the four state capacities while
 * leaving the inherited fixed-cash programme rules unchanged. This is useful
 * for attributing capacity effects, but it is not a balanced fiscal policy or
 * a historical debt baseline. Illegal or temporarily unaffordable attempts
 * are skipped by runOne's ordinary lenient-policy behavior. */
export const developmentalPolicy: RunnerPolicy = (_state, _rng, tick) =>
  tick % 8 === 0
    ? CAPACITY_IDS.map((target) => ({ kind: 'investCapacity', target, amount: 2 }))
    : []

/** Adversarial exploration, not a model of expert play. Useful for reaching
 * unusual states quickly; long-horizon reports must truncate at deposition. */
export const randomPolicy: RunnerPolicy = (state, rng) => {
  if (rng.next() > 0.15) return [] // most quarters: leave the dials alone
  const gdp = state.flows.nominalGdp
  const roll = rng.next()
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rng.next() * xs.length)]
  if (roll < 0.2) {
    const path = pick(['taxRates.income', 'taxRates.corporate', 'taxRates.tariff', 'taxRates.fuel'] as const)
    return [{ kind: 'setDial', path, value: rng.range(0, 0.6) }]
  }
  if (roll < 0.45) {
    const path = pick([
      'spending.transfers',
      'spending.procurement',
      'spending.investment',
      'spending.research',
    ] as const)
    return [{ kind: 'setDial', path, value: rng.range(0, 0.12) * gdp }]
  }
  if (roll < 0.6) {
    const monetary = pick([
      { path: 'policyRate', min: 0, max: 0.2 },
      { path: 'assetPurchaseRate', min: 0, max: 0.2 },
      { path: 'capitalRequirement', min: 0.03, max: 0.25 },
    ] as const)
    return [{ kind: 'setDial', path: monetary.path, value: rng.range(monetary.min, monetary.max) }]
  }
  if (roll < 0.8) {
    return [{ kind: 'setDial', path: `subsidies.${pick(SECTOR_IDS)}`, value: rng.range(0, 0.05) * gdp }]
  }
  return [{ kind: 'investCapacity', target: pick(CAPACITY_IDS), amount: rng.range(0.02, 0.2) * gdp }]
}

export function policyFor(id: PolicyId): RunnerPolicy | undefined {
  if (id === 'passive') return undefined
  return id === 'developmental' ? developmentalPolicy : randomPolicy
}
