/**
 * The governments a dial-fit survey samples (#190).
 *
 * A dial face is fixed per indicator and cut from a measured century
 * (`packages/ui/src/domains.ts`). For years that century had ONE government
 * in it — build the four ministries, touch nothing else — and a real game
 * played well (#180's Oranga, investigation 0019 §6) ran fifteen faces off
 * their dials, `investment_share` for 98% of the century. Nothing in the
 * suite could see it: the coverage test and the faces it checks drew from the
 * same one-policy sample.
 *
 * So the survey samples policy as well as country, seed and time. Each arm is
 * a sampling strategy, not a model of good play, and each is here for the
 * corner of the instrument wall it reaches that the others do not.
 *
 * Every arm but the capacity builder runs with `unlimitedCapital` and
 * `protectedTenure`. The survey asks where the ECONOMY goes when a government
 * does these things, and a refused or deposed government measures the
 * capacity builder again — `regulatedPolicy` once came out identical to
 * developmental to two decimals for exactly that reason. Those are the rules
 * the player behind #180 had on, too.
 */

import {
  CAPACITY_IDS,
  STATUTE_IDS,
  STATUTE_LEVELS,
  ASSET_PURCHASE_RATE_MAX,
  CAPITAL_REQUIREMENT_MIN,
  IllegalActionError,
  applyActions,
  createCountryParams,
  generateParams,
  init,
  rngFor,
  step,
  type Action,
  type CapacityId,
  type CountryScenarioId,
  type GameRules,
  type SpendingProgramId,
  type TrueState,
} from '@terrarium/engine'
import { developmentalPolicy, maximalPolicy, type RunnerPolicy } from './policies'

export const SURVEY_ARM_IDS = ['developmental', 'welfare', 'maximal', 'money', 'extractive'] as const
export type SurveyArmId = (typeof SURVEY_ARM_IDS)[number]

export interface SurveyArm {
  policy: RunnerPolicy
  rules: Partial<GameRules>
}

const SANDBOX: Partial<GameRules> = { unlimitedCapital: true, protectedTenure: true }

/** Fund every one of `targets`. Over-offering is deliberate: the engine
 * refuses a ministry already at full strength, and the survey loop skips the
 * refusal. */
function buildMinistries(state: TrueState, targets: readonly CapacityId[], share: number): Action[] {
  const amount = share * state.flows.nominalGdp
  return targets.map((target) => ({ kind: 'investCapacity', target, amount }))
}

/** Vote a GDP-share rule only when it is not already the rule. */
function shareRule(state: TrueState, programme: SpendingProgramId, share: number): Action[] {
  const rule = state.gov.spendingRules[programme]
  return rule.kind === 'gdpShare' && Math.abs(rule.share - share) < 1e-9
    ? []
    : [{ kind: 'setSpendingRule', programme, mode: 'gdpShare', value: share }]
}

/** Interpolate from the 1946 setting to the late-century one over `span`
 * quarters, so a ramp is one line rather than a schedule. */
const ramp = (tick: number, from: number, to: number, span: number) =>
  from + (to - from) * Math.min(1, tick / span)

/**
 * The shape of #180's century: ministries built early and kept, every statute
 * at its top rung, the representative institutions widened, research near 3%
 * of GDP, and a welfare state that grows with the tax base — transfers 4.5% →
 * 27% of GDP and the income tax 26% → 75% over sixty-five years. It is the arm
 * that reaches the living standard a good player reaches, which is where
 * `life_expectancy`, the per-capita accounts and the expenditure shares leave
 * the capacity builder's dial.
 */
export const welfarePolicy: RunnerPolicy = (state, _rng, tick) => {
  const actions: Action[] = []
  if (tick % 4 === 0) {
    actions.push(...buildMinistries(state, CAPACITY_IDS, 0.03))
    for (const statute of STATUTE_IDS) {
      const top = STATUTE_LEVELS[statute].length - 1
      if (state.gov.statutes[statute].level < top) actions.push({ kind: 'enact', statute, level: top })
    }
  }
  if (tick % 16 === 0) {
    for (const institution of ['suffrage', 'press', 'labor_rights', 'courts'] as const) {
      actions.push({ kind: 'reform', institution, direction: 1 })
    }
  }
  if (tick % 8 === 2) {
    const SPAN = 260
    actions.push(
      ...shareRule(state, 'transfers', round3(ramp(tick, 0.045, 0.27, SPAN))),
      ...shareRule(state, 'procurement', round3(ramp(tick, 0.05, 0.085, SPAN))),
      ...shareRule(state, 'investment', round3(ramp(tick, 0.03, 0.07, SPAN))),
      ...shareRule(state, 'research', round3(ramp(tick, 0.02, 0.03, SPAN))),
      { kind: 'setDial', path: 'taxRates.income', value: round3(ramp(tick, 0.26, 0.75, SPAN)) },
      { kind: 'setDial', path: 'taxRates.corporate', value: round3(ramp(tick, 0.2, 0.35, SPAN)) },
    )
  }
  if (tick === 2) {
    actions.push(
      { kind: 'setDial', path: 'policyRate', value: 0.06 },
      { kind: 'setDial', path: 'capitalRequirement', value: 0.18 },
    )
  }
  return actions
}

/** Rules written on a three-decimal grid, so a ramp re-votes a rule a few
 * times a decade rather than every eighth quarter by a rounding error. */
const round3 = (x: number) => Math.round(x * 1000) / 1000

/**
 * The money dials driven end to end and back: a decade of no policy rate, the
 * central bank buying as fast as it is allowed and the bank-capital floor at
 * its legal minimum, then a decade of dear money and a high floor — on top of
 * the capacity builder's ministries, so the surveys exist to see it. The easy
 * half is the sweep that put `credit_to_gdp` at 112 and set that face by hand.
 */
export const moneyPolicy: RunnerPolicy = (state, rng, tick) => {
  const actions = developmentalPolicy(state, rng, tick)
  if (tick % 4 === 0) {
    const easy = Math.floor(tick / MONEY_REGIME_QTRS) % 2 === 0
    actions.push(
      { kind: 'setDial', path: 'policyRate', value: easy ? 0 : HARD_POLICY_RATE },
      { kind: 'setDial', path: 'assetPurchaseRate', value: easy ? ASSET_PURCHASE_RATE_MAX : 0 },
      {
        kind: 'setDial',
        path: 'capitalRequirement',
        value: easy ? CAPITAL_REQUIREMENT_MIN : HARD_CAPITAL_FLOOR,
      },
    )
  }
  return actions
}

/** a decade per regime: long enough for credit to compound, short enough
 * that both halves land in every era of the century */
const MONEY_REGIME_QTRS = 40
/** Dear money, held. #180's player went higher — 18% for five years, 30%
 * for a few quarters — but a DECADE of that shrinks credit to a sliver of
 * GDP, and a growth rate or a capital ratio taken on a sliver prints in the
 * thousands: 18% put `credit_growth` at p99 3,885% and a maximum of 18,587%.
 * Ten per cent for ten years reaches what that whole played century reached
 * (credit growth p99 104 against its 102, bank capital 95 against its 106). */
const HARD_POLICY_RATE = 0.1
const HARD_CAPITAL_FLOOR = 0.15

/**
 * The extractive state of the corridor's other bank: the ministries that
 * collect and count and none that teach; the franchise, the unions and the
 * press narrowed and the police widened; tariffs that protect incumbents and a
 * light tax on their profits; nothing spent on transfers or research. Its job
 * is the OTHER rail of every dial the builders push one way — a stalled skill
 * base, poverty, emigration, unrest, approval on the floor.
 */
export const extractivePolicy: RunnerPolicy = (state, _rng, tick) => {
  const actions: Action[] = []
  if (tick % 8 === 0) actions.push(...buildMinistries(state, ['tax', 'statistical', 'administrative'], 0.02))
  if (tick % 16 === 0) {
    actions.push(
      { kind: 'reform', institution: 'suffrage', direction: -1 },
      { kind: 'reform', institution: 'labor_rights', direction: -1 },
      { kind: 'reform', institution: 'press', direction: -1 },
      { kind: 'reform', institution: 'repression', direction: 1 },
    )
  }
  if (tick === 2) {
    actions.push(
      { kind: 'setDial', path: 'taxRates.income', value: 0.3 },
      { kind: 'setDial', path: 'taxRates.corporate', value: 0.1 },
      { kind: 'setDial', path: 'taxRates.tariff', value: 0.4 },
      ...shareRule(state, 'transfers', 0),
      ...shareRule(state, 'research', 0),
    )
  }
  return actions
}

export const SURVEY_ARMS: Record<SurveyArmId, SurveyArm> = {
  // the original survey government, under the original rules — kept so the
  // faces it already fits are still measured against it
  developmental: { policy: developmentalPolicy, rules: {} },
  welfare: { policy: welfarePolicy, rules: SANDBOX },
  maximal: { policy: maximalPolicy, rules: SANDBOX },
  money: { policy: moneyPolicy, rules: SANDBOX },
  extractive: { policy: extractivePolicy, rules: SANDBOX },
}

/**
 * One surveyed century under `arm`, calling `visit` with the TRUE state after
 * each quarter. The callers publish it themselves: this package stays on the
 * engine side of the fog, and both callers want `observe` anyway.
 *
 * Orders are applied one at a time and a refusal skips only that order, which
 * is `runOne`'s ordinary lenient mode — without its trajectory, because a
 * survey that keeps 400 quarters of drivers per century is paying for a
 * report nobody reads.
 */
export function surveyQuarters(
  seed: string,
  ticks: number,
  arm: SurveyArmId,
  country: CountryScenarioId | undefined,
  visit: (state: TrueState, tick: number) => void,
): void {
  const { policy, rules } = SURVEY_ARMS[arm]
  const params = country ? createCountryParams(country, seed) : generateParams(seed)
  let s = init(params, seed, rules)
  for (let t = 0; t < ticks; t++) {
    for (const action of policy(s, rngFor(seed, 'runner:policy', t), t)) {
      try {
        s = applyActions(s, [action])
      } catch (e) {
        if (!(e instanceof IllegalActionError)) throw e
      }
    }
    s = step(s)
    visit(s, t)
  }
}
