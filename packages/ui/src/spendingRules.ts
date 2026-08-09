/** Pure UI arithmetic for the cabinet's recurring expenditure controls. */

import type { SpendingProgramId, SpendingRuleMode } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'

export interface OfficialNominalGdp {
  value: number
  forQtr: number
}

/** The exact same published denominator the engine's GDP-share rule reads. */
export function latestOfficialNominalGdp(pub: PublishedState): OfficialNominalGdp | null {
  let latest: OfficialNominalGdp & { revision: number } | null = null
  for (const point of pub.indicators.gdp_growth?.points ?? []) {
    const nominal = point.levels?.nominal
    if (nominal === undefined || !Number.isFinite(nominal) || nominal <= 0) continue
    if (
      latest === null ||
      point.forQtr > latest.forQtr ||
      (point.forQtr === latest.forQtr && point.revision > latest.revision)
    ) {
      latest = { value: nominal, forQtr: point.forQtr, revision: point.revision }
    }
  }
  return latest && { value: latest.value, forQtr: latest.forQtr }
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
