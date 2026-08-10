/**
 * Recurring expenditure rules. The economy still consumes one resolved
 * money-per-quarter number per programme; this module is the single place
 * standing rules turn into those numbers.
 *
 * GDP rules deliberately read the latest PUBLISHED national-accounts level,
 * never `flows.nominalGdp`. A percentage rule is not a back door through the
 * statistical fog. CPI indexation likewise follows first official releases;
 * later revisions cannot retroactively change cheques already paid.
 */

import { clamp } from '../math'
import {
  SPENDING_PROGRAM_IDS,
  type SpendingProgramId,
  type SpendingRule,
  type SpendingRuleMode,
  type StatPrint,
  type TrueState,
} from './schema'

function latestByReferenceQuarter(points: StatPrint[]): StatPrint | null {
  let latest: StatPrint | null = null
  for (const point of points) {
    if (
      latest === null ||
      point.forQtr > latest.forQtr ||
      (point.forQtr === latest.forQtr && point.revision > latest.revision)
    ) {
      latest = point
    }
  }
  return latest
}

/** Latest nominal-GDP level the statistics office has actually published. */
export function officialNominalGdp(state: TrueState): number | null {
  const points = (state.stats.series.gdp_growth ?? []).filter(
    (point) => point.levels && Number.isFinite(point.levels.nominal) && point.levels.nominal > 0,
  )
  return latestByReferenceQuarter(points)?.levels?.nominal ?? null
}

function firstInflationPrintsAfter(state: TrueState, forQtr: number | null): StatPrint[] {
  return (state.stats.series.inflation ?? [])
    .filter((point) => point.revision === 0 && point.forQtr > (forQtr ?? -1))
    .sort((a, b) => a.forQtr - b.forQtr)
}

export function latestInitialInflationQuarter(state: TrueState): number | null {
  const prints = firstInflationPrintsAfter(state, null)
  return prints.length > 0 ? prints[prints.length - 1].forQtr : null
}

/** What a newly drafted rule would spend using today's official references. */
export function spendingRuleTarget(
  state: TrueState,
  mode: SpendingRuleMode,
  value: number,
): number {
  if (mode !== 'gdpShare') return value
  const nominalGdp = officialNominalGdp(state)
  if (nominalGdp === null) {
    throw new Error('a GDP-share rule requires published national accounts')
  }
  return value * nominalGdp
}

export function createSpendingRule(
  state: TrueState,
  mode: SpendingRuleMode,
  value: number,
): SpendingRule {
  switch (mode) {
    case 'fixed':
      return { kind: 'fixed', amount: value }
    case 'indexed':
      return {
        kind: 'indexed',
        amount: value,
        lastIndexedForQtr: latestInitialInflationQuarter(state),
      }
    case 'gdpShare':
      return { kind: 'gdpShare', share: value }
  }
}

/** Preserve a campaign's permanent transfer rise in whichever rule owns it. */
export function scaleSpendingRule(rule: SpendingRule, factor: number): SpendingRule {
  switch (rule.kind) {
    case 'fixed':
      return { ...rule, amount: rule.amount * factor }
    case 'indexed':
      return { ...rule, amount: rule.amount * factor }
    case 'gdpShare':
      return { ...rule, share: clamp(rule.share * factor, 0, 1) }
  }
}

function resolveRule(
  state: TrueState,
  programme: SpendingProgramId,
  rule: SpendingRule,
): { rule: SpendingRule; amount: number } {
  switch (rule.kind) {
    case 'fixed':
      return { rule, amount: rule.amount }
    case 'gdpShare': {
      const nominalGdp = officialNominalGdp(state)
      return {
        rule,
        // Before the first national-accounts release, hold the last voted
        // amount. The rule wakes up as soon as an official denominator exists.
        amount: nominalGdp === null ? state.gov.dials.spending[programme] : rule.share * nominalGdp,
      }
    }
    case 'indexed': {
      let amount = rule.amount
      let lastIndexedForQtr = rule.lastIndexedForQtr
      for (const print of firstInflationPrintsAfter(state, lastIndexedForQtr)) {
        // The published figure is annualized percentage inflation. Convert it
        // back to a one-quarter factor and keep a pathological print from
        // making a nominal appropriation negative.
        amount *= Math.max(0, 1 + print.value / 400)
        lastIndexedForQtr = print.forQtr
      }
      return {
        rule: { ...rule, amount, lastIndexedForQtr },
        amount,
      }
    }
  }
}

/** Resolve standing rules into the amounts the next quarter will read. */
export function resolveSpendingRules(state: TrueState): TrueState {
  const spending = { ...state.gov.dials.spending }
  const spendingRules = { ...state.gov.spendingRules }
  for (const programme of SPENDING_PROGRAM_IDS) {
    const resolved = resolveRule(state, programme, spendingRules[programme])
    spending[programme] = resolved.amount
    spendingRules[programme] = resolved.rule
  }
  return {
    ...state,
    gov: {
      ...state.gov,
      dials: { ...state.gov.dials, spending },
      spendingRules,
    },
  }
}
