/** Pure UI arithmetic for the cabinet's recurring expenditure controls.
 *
 * It also owns THE official denominator — the office's published estimate of
 * nominal output — because that is what a GDP-share appropriation resolves
 * against. Anything else on the desk that divides by the size of the economy
 * (`stateFootprint.ts`) imports it from here rather than reading the prints
 * again, so a rule the cabinet voted and a share the wall reports can never
 * disagree about how big the country is. */

import type { SpendingProgramId, SpendingRuleMode } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'

export interface OfficialNominalGdp {
  value: number
  forQtr: number
}

/**
 * Every quarter the office has put a nominal level on, at its latest revision.
 *
 * A quarter is absent rather than zero when the office never estimated it, or
 * estimated something a denominator cannot be: a division that silently
 * returned Infinity would print a state of infinite size, which draws as a
 * blank chart and reads as a bug in the panel rather than in the arithmetic.
 */
export function officialNominalGdpByQuarter(pub: PublishedState): Map<number, number> {
  const byQtr = new Map<number, { value: number; revision: number }>()
  for (const point of pub.indicators.gdp_growth?.points ?? []) {
    const nominal = point.levels?.nominal
    if (nominal === undefined || !Number.isFinite(nominal) || nominal <= 0) continue
    const held = byQtr.get(point.forQtr)
    if (held === undefined || point.revision > held.revision) {
      byQtr.set(point.forQtr, { value: nominal, revision: point.revision })
    }
  }
  return new Map([...byQtr].map(([forQtr, held]) => [forQtr, held.value]))
}

/** The exact same published denominator the engine's GDP-share rule reads. */
export function latestOfficialNominalGdp(pub: PublishedState): OfficialNominalGdp | null {
  let latest: OfficialNominalGdp | null = null
  for (const [forQtr, value] of officialNominalGdpByQuarter(pub)) {
    if (latest === null || forQtr > latest.forQtr) latest = { value, forQtr }
  }
  return latest
}

/** A mode switch starts without a surprise spending jump. */
export function equivalentRuleValue(
  pub: PublishedState,
  programme: SpendingProgramId,
  mode: SpendingRuleMode,
): number | null {
  const currentAmount = pub.dials.spending[programme]
  if (mode !== 'gdpShare') return currentAmount
  const basis = latestOfficialNominalGdp(pub)
  return basis === null ? null : currentAmount / basis.value
}

export function currentRuleValue(
  pub: PublishedState,
  programme: SpendingProgramId,
): number {
  const rule = pub.spendingRules[programme]
  return rule.kind === 'gdpShare' ? rule.share : rule.amount
}

export function proposedSpending(
  pub: PublishedState,
  mode: SpendingRuleMode,
  value: number,
): number | null {
  if (mode !== 'gdpShare') return value
  const basis = latestOfficialNominalGdp(pub)
  return basis === null ? null : value * basis.value
}
