/**
 * Action application. Validates legality (dial bounds, PC affordability)
 * and rejects loudly — an illegal action in a replay means a bug or a
 * version mismatch, never a silent skip (§5).
 *
 * From M6 every lever is also priced by the room (§4.3). A bloc that is
 * powerful, unchecked by an organized society, and opposed to what you are
 * about to do makes it cost multiples of what it costs a government the
 * elites are indifferent to. It never makes it *impossible*: the game does not
 * say no, it lets you find out — and finding out means the bloc's goodwill
 * collapses and the consequence arrives through the economy a few quarters
 * later, as a capital strike, an investment strike, a wage push, or a harvest
 * that goes unreported.
 *
 * The stance tables below are PREFERENCES, not effect arrows. Knowing that an
 * industrialist minds a corporate tax rise is the same kind of primitive as
 * knowing a rural household spends 48 % of its income on food. What the tax
 * then DOES still has to propagate through the economy on its own.
 */

import {
  ASSET_PURCHASE_RATE_MAX,
  BLOC_DEFIANCE,
  CAPACITY_BUILD_QTRS,
  CAPACITY_COST_PER_POINT,
  CAPITAL_REQUIREMENT_MAX,
  CAPITAL_REQUIREMENT_MIN,
  COALITION_FAVOR_GAIN,
  COALITION_FAVOR_SNUB,
  COALITION_SWING_GAIN,
  FRANCHISE_SUFFRAGE_STEP,
  LARGESSE_BUMP,
  LARGESSE_SWING_GAIN,
  PC_COST_CAMPAIGN,
  PC_COST_CAPACITY,
  PC_COST_DIAL_BASE,
  PC_COST_DIAL_SLOPE,
  PC_COST_REFORM,
  PLATFORM_BLOC_COST,
  PLATFORM_SWING,
  PLEDGE_QTRS,
  PLEDGE_VETO_MULT,
  REFORM_STEP,
  REFORM_WINDOW_AT,
  REFORM_WINDOW_DISCOUNT,
  REFORM_WINDOW_VETO_RELIEF,
  SUPPRESSION_REPRESSION_STEP,
  VETO_COST_GAIN,
} from '../constants'
import { clamp } from '../math'
import { effectiveBlocPower } from '../pipeline/derive'
import {
  BLOC_IDS,
  CAMPAIGN_WINDOW,
  SECTOR_IDS,
  type BlocId,
  type InstitutionId,
  type PlatformId,
  type SectorId,
  type SpendingProgramId,
  type TrueState,
} from '../state/schema'
import {
  createSpendingRule,
  scaleSpendingRule,
  spendingRuleTarget,
} from '../state/spending'
import type { Action, DialPath } from './types'

export class IllegalActionError extends Error {}

/** How much each bloc minds an INCREASE in a lever, −1..1. Negative means they
 * want it higher. Moving a lever their way earns goodwill on the same scale. */
type Stance = Partial<Record<BlocId, number>>

const SUBSIDY_STANCE: Record<SectorId, Stance> = {
  agri: { landowners: -0.9, financiers: 0.3 },
  manuf: { industrialists: -0.8, financiers: 0.3 },
  energy: { industrialists: -0.7, financiers: 0.3 },
  transport: { industrialists: -0.6, financiers: 0.3 },
  services: { industrialists: -0.3, financiers: 0.2 },
}

const DIAL_STANCE: Record<DialPath, Stance> = {
  'taxRates.income': { landowners: 0.5, industrialists: 0.3, financiers: 0.2, unions: 0.4 },
  'taxRates.corporate': { industrialists: 0.9, financiers: 0.5, landowners: 0.3, unions: -0.3 },
  'taxRates.tariff': { industrialists: -0.5, landowners: -0.3, financiers: 0.3, unions: 0.2 },
  'taxRates.fuel': { industrialists: 0.6, unions: 0.5, landowners: 0.4 },
  'spending.transfers': { financiers: 0.5, unions: -0.6, landowners: 0.2, industrialists: 0.2 },
  'spending.procurement': { industrialists: -0.4, financiers: 0.4 },
  'spending.investment': { industrialists: -0.5, financiers: 0.3, unions: -0.3 },
  'spending.research': { industrialists: -0.4, financiers: 0.4, unions: -0.2 },
  policyRate: { financiers: -0.6, industrialists: 0.6, unions: 0.4 },
  assetPurchaseRate: { financiers: 0.4, industrialists: -0.5, unions: -0.2 },
  capitalRequirement: { financiers: 0.9, industrialists: 0.3, unions: -0.2 },
  ...(Object.fromEntries(
    SECTOR_IDS.map((sid) => [`subsidies.${sid}`, SUBSIDY_STANCE[sid]]),
  ) as Record<`subsidies.${SectorId}`, Stance>),
}

/** §4.3 Layer 3, and the reason reform is hard: the people who would lose by
 * it are, by construction, the people currently holding the veto. */
const REFORM_STANCE: Record<InstitutionId, Stance> = {
  suffrage: { landowners: 0.9, industrialists: 0.4, financiers: 0.2, unions: -0.8 },
  press: { landowners: 0.4, industrialists: 0.3, financiers: 0.1, unions: -0.5 },
  labor_rights: { industrialists: 0.9, landowners: 0.7, financiers: 0.4, unions: -1 },
  courts: { landowners: 0.2, industrialists: -0.3, financiers: -0.6, unions: -0.2 },
  repression: { unions: 0.9, landowners: -0.5, industrialists: -0.2, financiers: -0.1 },
}

/** §4.3 reform windows: revolutionary pressure is the only thing that prises
 * open reforms elites would otherwise veto. */
export function reformWindowOpen(state: TrueState): boolean {
  return state.institutions.unrest >= REFORM_WINDOW_AT
}

/** What the room thinks of a move, per bloc: positive = they mind, negative =
 * they are pleased, scaled by how big a move it is. */
function objections(stance: Stance, sign: number, magnitude: number): Record<BlocId, number> {
  const m = clamp(magnitude, 0, 1)
  const out = {} as Record<BlocId, number>
  for (const id of BLOC_IDS) out[id] = (stance[id] ?? 0) * sign * m
  return out
}

/**
 * The premium the veto players put on an action. Multiplies the PC cost.
 * A pledge made at the last election doubles the objections of the bloc you
 * made it to; an open reform window discounts everyone's.
 */
export function vetoMultiplier(
  state: TrueState,
  objection: Record<BlocId, number>,
  windowOpen = false,
): number {
  let weight = 0
  for (const id of BLOC_IDS) {
    const minds = Math.max(0, objection[id])
    if (minds <= 0) continue
    const pledged = state.institutions.pledge?.bloc === id ? PLEDGE_VETO_MULT : 1
    weight += effectiveBlocPower(state, id) * minds * pledged
  }
  if (windowOpen) weight *= REFORM_WINDOW_VETO_RELIEF
  return 1 + VETO_COST_GAIN * weight
}

/** Defiance is not free: you spend goodwill in proportion to how much they
 * minded, and earn it when you move a lever their way. */
function applyObjections(state: TrueState, objection: Record<BlocId, number>): TrueState {
  const blocs = { ...state.institutions.blocs }
  let touched = false
  for (const id of BLOC_IDS) {
    if (Math.abs(objection[id]) < 1e-9) continue
    touched = true
    blocs[id] = {
      ...blocs[id],
      favor: clamp(blocs[id].favor - BLOC_DEFIANCE * objection[id], -1, 1),
    }
  }
  return touched ? { ...state, institutions: { ...state.institutions, blocs } } : state
}

function shiftFavor(state: TrueState, deltas: Partial<Record<BlocId, number>>): TrueState {
  const blocs = { ...state.institutions.blocs }
  for (const [id, d] of Object.entries(deltas) as Array<[BlocId, number]>) {
    blocs[id] = { ...blocs[id], favor: clamp(blocs[id].favor + d, -1, 1) }
  }
  return { ...state, institutions: { ...state.institutions, blocs } }
}

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

const spend = (key: 'transfers' | 'procurement' | 'investment' | 'research'): DialSpec => ({
  get: (s) => s.gov.dials.spending[key],
  set: (s, v) => ({
    ...s,
    gov: {
      ...s.gov,
      dials: { ...s.gov.dials, spending: { ...s.gov.dials.spending, [key]: v } },
      // Legacy `setDial` spending actions remain valid save inputs. Their
      // semantics are exactly the old semantics: vote a fixed cash amount.
      spendingRules: { ...s.gov.spendingRules, [key]: { kind: 'fixed', amount: v } },
    },
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
  'spending.research': spend('research'),
  policyRate: {
    get: (s) => s.gov.dials.policyRate,
    set: (s, v) => ({ ...s, gov: { ...s.gov, dials: { ...s.gov.dials, policyRate: v } } }),
    min: 0,
    max: () => 0.5,
    scale: () => 0.1,
  },
  assetPurchaseRate: {
    get: (s) => s.gov.dials.assetPurchaseRate,
    set: (s, v) => ({
      ...s,
      gov: { ...s.gov, dials: { ...s.gov.dials, assetPurchaseRate: v } },
    }),
    min: 0,
    max: () => ASSET_PURCHASE_RATE_MAX,
    scale: () => 0.1,
  },
  capitalRequirement: {
    get: (s) => s.gov.dials.capitalRequirement,
    set: (s, v) => ({
      ...s,
      gov: { ...s.gov, dials: { ...s.gov.dials, capitalRequirement: v } },
    }),
    min: CAPITAL_REQUIREMENT_MIN,
    max: () => CAPITAL_REQUIREMENT_MAX,
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

/** The room's objection to a dial move, at the size it is actually being made. */
function dialObjections(state: TrueState, path: DialPath, value: number): Record<BlocId, number> {
  const spec = DIALS[path]
  const delta = value - spec.get(state)
  return objections(DIAL_STANCE[path], Math.sign(delta), Math.abs(delta) / spec.scale(state))
}

const spendingPath = (programme: SpendingProgramId): DialPath => `spending.${programme}`

function targetForSpendingRule(
  state: TrueState,
  action: Extract<Action, { kind: 'setSpendingRule' }>,
): number {
  try {
    return spendingRuleTarget(state, action.mode, action.value)
  } catch (error) {
    throw new IllegalActionError(error instanceof Error ? error.message : 'invalid spending rule')
  }
}

function spendingRuleObjections(
  state: TrueState,
  programme: SpendingProgramId,
  target: number,
): Record<BlocId, number> {
  return dialObjections(state, spendingPath(programme), target)
}

/** …and to a reform, which is always a full step. */
function reformObjections(institution: InstitutionId, direction: 1 | -1): Record<BlocId, number> {
  return objections(REFORM_STANCE[institution], direction, 1)
}

/** How far a reform would actually move the stock, clamped to the rails.
 * Throws when there is no move left to make, so the quote and the application
 * agree about what is on offer. */
function reformTarget(state: TrueState, institution: InstitutionId, direction: 1 | -1): number {
  const current = state.institutions.stocks[institution]
  if (current === undefined) throw new IllegalActionError(`unknown institution: ${institution}`)
  const target = clamp(current + direction * REFORM_STEP, 0, 1)
  if (Math.abs(target - current) < 1e-9) {
    throw new IllegalActionError(
      `${institution} is already as ${direction > 0 ? 'broad' : 'narrow'} as it goes`,
    )
  }
  return target
}

/** Validate a campaign order. Shared by the quote and the application so a
 * platform that cannot be announced is never priced. */
function checkCampaign(state: TrueState, action: Extract<Action, { kind: 'campaign' }>): void {
  const { politics: pol } = state
  if (pol.quartersToElection > CAMPAIGN_WINDOW || pol.quartersToElection <= 0) {
    throw new IllegalActionError('there is no election to fight yet')
  }
  if (pol.campaign) throw new IllegalActionError('the platform is already announced')
  if (action.platform === 'coalition' && !action.bloc) {
    throw new IllegalActionError('a coalition platform must name the bloc being courted')
  }
}

/** Quote one order using the same validation and cost formula as application.
 * The worker exposes this cost to the cabinet UI without exposing true state. */
export function politicalCostOfAction(state: TrueState, action: Action): number {
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
      // …and then the room prices it (§4.3)
      return (
        (PC_COST_DIAL_BASE + PC_COST_DIAL_SLOPE * relChange) *
        vetoMultiplier(state, dialObjections(state, action.path, action.value))
      )
    }
    case 'setSpendingRule': {
      const { programme, mode, value } = action
      if (!Number.isFinite(value)) {
        throw new IllegalActionError(`non-finite ${mode} spending rule on ${programme}`)
      }
      if (value < 0 || (mode === 'gdpShare' && value > 1)) {
        throw new IllegalActionError(
          `${programme} ${mode} rule=${value} out of bounds [0, ${mode === 'gdpShare' ? '1' : 'current GDP'}]`,
        )
      }
      const target = targetForSpendingRule(state, action)
      if (target > state.flows.nominalGdp) {
        throw new IllegalActionError(
          `${programme} rule exceeds the current statutory spending ceiling`,
        )
      }
      const path = spendingPath(programme)
      const spec = DIALS[path]
      const relChange = Math.abs(target - spec.get(state)) / spec.scale(state)
      return (
        (PC_COST_DIAL_BASE + PC_COST_DIAL_SLOPE * relChange) *
        vetoMultiplier(state, spendingRuleObjections(state, programme, target))
      )
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
      return PC_COST_CAPACITY
    }
    case 'reform': {
      const { institution, direction } = action
      reformTarget(state, institution, direction) // validates; the rails are part of the quote
      const windowOpen = reformWindowOpen(state)
      return (
        PC_COST_REFORM *
        vetoMultiplier(state, reformObjections(institution, direction), windowOpen) *
        (windowOpen ? REFORM_WINDOW_DISCOUNT : 1)
      )
    }
    case 'campaign': {
      checkCampaign(state, action)
      return PC_COST_CAMPAIGN
    }
  }
}

export function applyAction(state: TrueState, action: Action): TrueState {
  const cost = politicalCostOfAction(state, action)
  switch (action.kind) {
    case 'setDial': {
      const spec = DIALS[action.path]
      // defiance is not free: goodwill is spent in proportion to how much they
      // minded, and earned when the lever moves their way
      const objection = dialObjections(state, action.path, action.value)
      return spec.set(applyObjections(spendPc(state, cost, action.path), objection), action.value)
    }
    case 'setSpendingRule': {
      const { programme, mode, value } = action
      const target = targetForSpendingRule(state, action)
      const objection = spendingRuleObjections(state, programme, target)
      const s = applyObjections(
        spendPc(state, cost, `set ${programme} spending rule`),
        objection,
      )
      return {
        ...s,
        gov: {
          ...s.gov,
          dials: {
            ...s.gov.dials,
            spending: { ...s.gov.dials.spending, [programme]: target },
          },
          spendingRules: {
            ...s.gov.spendingRules,
            [programme]: createSpendingRule(state, mode, value),
          },
        },
      }
    }
    case 'investCapacity': {
      const { target, amount } = action
      const s = spendPc(state, cost, `invest in ${target} capacity`)
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
    case 'reform': {
      const { institution, direction } = action
      const target = reformTarget(state, institution, direction)
      const s = applyObjections(
        spendPc(state, cost, `reform ${institution}`),
        reformObjections(institution, direction),
      )
      return {
        ...s,
        institutions: {
          ...s.institutions,
          stocks: { ...s.institutions.stocks, [institution]: target },
        },
      }
    }
    case 'campaign': {
      const platform: PlatformId = action.platform
      let s = spendPc(state, cost, `campaign on ${platform}`)
      let swing = PLATFORM_SWING[platform]
      const bloc = action.bloc ?? null

      switch (platform) {
        case 'largesse': {
          // the giveaway is real money and it STAYS spent — the hangover is
          // that walking it back is a cut, and cuts cost approval too
          const before = s.gov.dials.spending.transfers
          const after = Math.min(before * (1 + LARGESSE_BUMP), s.flows.nominalGdp)
          const factor = before > 1e-9 ? after / before : 1
          swing += LARGESSE_SWING_GAIN * ((after - before) / Math.max(s.flows.nominalGdp, 1e-9))
          s = {
            ...s,
            gov: {
              ...s.gov,
              dials: { ...s.gov.dials, spending: { ...s.gov.dials.spending, transfers: after } },
              spendingRules: {
                ...s.gov.spendingRules,
                transfers: scaleSpendingRule(s.gov.spendingRules.transfers, factor),
              },
            },
          }
          break
        }
        case 'coalition': {
          const b = bloc as BlocId
          const machine = s.institutions.blocs[b]
          swing += COALITION_SWING_GAIN * machine.power * (0.5 + 0.5 * machine.favor)
          s = shiftFavor(s, {
            ...(Object.fromEntries(
              BLOC_IDS.filter((x) => x !== b).map((x) => [x, COALITION_FAVOR_SNUB]),
            ) as Partial<Record<BlocId, number>>),
            [b]: COALITION_FAVOR_GAIN,
          })
          // the debt comes due on every lever they mind, for a full term
          s = {
            ...s,
            institutions: { ...s.institutions, pledge: { bloc: b, quartersLeft: PLEDGE_QTRS } },
          }
          break
        }
        case 'suppression':
          s = {
            ...s,
            institutions: {
              ...s.institutions,
              stocks: {
                ...s.institutions.stocks,
                repression: clamp(
                  s.institutions.stocks.repression + SUPPRESSION_REPRESSION_STEP,
                  0,
                  1,
                ),
              },
            },
          }
          break
        case 'franchise':
          // §4.3: you are rewriting the rubric you will be scored against.
          // The swing above is only the enthusiasm of a first vote — the real
          // effect is that different people's approval now counts.
          s = {
            ...s,
            institutions: {
              ...s.institutions,
              stocks: {
                ...s.institutions.stocks,
                suffrage: clamp(s.institutions.stocks.suffrage + FRANCHISE_SUFFRAGE_STEP, 0, 1),
              },
            },
          }
          break
        case 'record':
          break
      }

      s = shiftFavor(s, PLATFORM_BLOC_COST[platform])
      return { ...s, politics: { ...s.politics, campaign: { platform, bloc, swing } } }
    }
  }
}
