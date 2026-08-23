/** Named runner policies. These are sampling strategies, not engine rules. */

import {
  CAPACITY_IDS,
  IMMIGRATION_LIMIT_MAX,
  PC_COST_CAPACITY,
  SECTOR_IDS,
  STATUTE_IDS,
  STATUTE_LEVELS,
  type Action,
  type Rng,
  type TrueState,
} from '@terrarium/engine'

export const POLICY_IDS = ['passive', 'developmental', 'random', 'regulated'] as const
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
  if (rng.next() > 0.15) {
    // Preserve the established mix of economic orders below. Border policy
    // explores a small share of what were previously no-op quarters, rather
    // than silently making subsidies or state-building rarer.
    return rng.next() < 0.02
      ? [{ kind: 'setDial', path: 'immigrationLimit', value: rng.range(0, IMMIGRATION_LIMIT_MAX) }]
      : []
  }
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
  if (roll < 0.75) {
    return [{ kind: 'setDial', path: `subsidies.${pick(SECTOR_IDS)}`, value: rng.range(0, 0.05) * gdp }]
  }
  if (roll < 0.85) {
    // The statute book has to be in the adversarial sweep or nothing ever
    // stress-tests it: this is the run that finds a NaN, a price explosion, or
    // a rule nobody can reach. A rung equal to the one in force is refused by
    // the engine, and runOne is lenient about exactly that.
    const statute = pick(STATUTE_IDS)
    return [
      { kind: 'enact', statute, level: Math.floor(rng.next() * STATUTE_LEVELS[statute].length) },
    ]
  }
  return [{ kind: 'investCapacity', target: pick(CAPACITY_IDS), amount: rng.range(0.02, 0.2) * gdp }]
}

/**
 * The statute book's own baseline: build the ministries, then climb every
 * ladder a rung at a time as the political capital comes in.
 *
 * It exists because none of the other three policies exercises a statute in a
 * comparable way — passive and developmental write nothing, and random writes
 * rules at random moments and repeals them again. A century that can be
 * compared with the developmental one needs the statutes enacted deliberately
 * and left alone.
 *
 * ONE RUNG AT A TIME, and persistently, because the first version of this was
 * a fixed schedule — one statute per year at its top rung — and it measured
 * nothing. A top-rung enactment is priced around 23 PC against the ~11 a
 * capacity-building government is holding, so two of the three orders were
 * refused as unaffordable and lenient mode skipped them: the resulting
 * "regulated" century was developmental to two decimal places in every column.
 * That is what an unreachable mechanic looks like in a results table — not an
 * error, just a baseline quietly measuring nothing.
 */
export const regulatedPolicy: RunnerPolicy = (state, _rng, tick) => {
  if (tick % 8 === 0) {
    return CAPACITY_IDS.map((target) => ({ kind: 'investCapacity', target, amount: 2 }))
  }
  // legislate once the ministries exist to enforce anything
  if (tick < 40 || tick % 4 !== 1) return []
  // …but never at the expense of the capacity path this arm shares with
  // `developmentalPolicy`. Both arms spend the same political-capital stock,
  // and `runOne` leniently skips whatever it cannot afford, so an enactment
  // that drained the stock would silently cost the NEXT capacity batch and the
  // reported regulated-vs-developmental difference would confound statutes
  // with missing ministries. Measured, that never actually happened — both
  // arms finish with identical capacities — but holding it by construction is
  // worth four lines, because the margin it relies on is only as stable as
  // PC_COST_CAPACITY and the accrual constants.
  if (state.politics.politicalCapital < CAPACITY_RESERVE) return []
  for (const statute of STATUTE_IDS) {
    const { level } = state.gov.statutes[statute]
    if (level < STATUTE_LEVELS[statute].length - 1) {
      return [{ kind: 'enact', statute, level: level + 1 }]
    }
  }
  return []
}

/** what one `tick % 8` capacity batch costs, kept whole so legislating can
 * never eat it */
const CAPACITY_RESERVE = PC_COST_CAPACITY * CAPACITY_IDS.length

const POLICIES: Record<Exclude<PolicyId, 'passive'>, RunnerPolicy> = {
  developmental: developmentalPolicy,
  random: randomPolicy,
  regulated: regulatedPolicy,
}

export function policyFor(id: PolicyId): RunnerPolicy | undefined {
  return id === 'passive' ? undefined : POLICIES[id]
}
