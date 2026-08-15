/**
 * The minute book: what the cabinet SET, quarter by quarter.
 *
 * Two questions look alike and are not. "What was the policy rate in 1958?"
 * is a lookup against `pub.policy`, which records the dials as they stood.
 * "When did I last change transfers?" is a question about DECISIONS, and the
 * two answers diverge the moment an appropriation is indexed or written as a
 * share of GDP: those figures move every quarter on their own, and nobody
 * voted for any of it.
 *
 * So the change log never diffs a resolved appropriation. It reads the
 * engine's `votedAt` stamp, which moves only when a rule is actually written
 * (§4.1). Diffing the money instead would file four hundred entries for a
 * cabinet that met once — the failure mode AGENTS.md calls a warning that
 * never turns off, and here it would be the whole feature.
 *
 * Rates carry no such machinery: nothing but an order moves a tax rate, so
 * they are diffed directly.
 *
 * Pure for the usual reason — the alternative is a change log that can only
 * be checked by playing eighty years of a save and squinting at it.
 */

import { SECTOR_IDS, SPENDING_PROGRAM_IDS, type SectorId } from '@terrarium/engine'
import {
  REVENUE_SOURCE_IDS,
  type PolicyPoint,
  type RevenueSourceId,
  type SpendingProgramId,
  type SpendingRuleMode,
} from '@terrarium/observation'

/** Which desk in the cabinet an entry belongs to — the same four groups the
 * control rail sets them on, so the record reads back in the order it was
 * written. */
export type PolicyGroup = 'TAXATION' | 'CENTRAL BANK' | 'SPENDING' | 'SUBSIDIES'

/** A rate is a percentage and comparable across a century; an appropriation
 * is money, and 4.0 in 1946 is not 4.0 in 2040. The distinction decides how a
 * value prints and whether it can honestly share an axis with its siblings. */
export type PolicyUnit = 'rate' | 'money'

export interface PolicyLine {
  key: string
  label: string
  group: PolicyGroup
  unit: PolicyUnit
  /** longer form for the tooltip on the readout */
  note: string
  read: (point: PolicyPoint) => number
}

const TAX_FACE: Record<RevenueSourceId, { label: string; note: string }> = {
  income: { label: 'INCOME TAX', note: 'Levied on wages, collected as well as your tax administration allows.' },
  corporate: { label: 'CORPORATE TAX', note: 'Levied on positive sector profits.' },
  tariff: { label: 'TARIFF', note: 'Levied at the border on imports.' },
  fuel: { label: 'FUEL EXCISE', note: 'Levied on every energy purchase, household and industrial.' },
}

const PROGRAMME_FACE: Record<SpendingProgramId, { label: string; note: string }> = {
  transfers: { label: 'TRANSFERS', note: 'Pensions and relief, paid to households.' },
  procurement: { label: 'PROCUREMENT', note: 'The state buying goods and services from the economy.' },
  investment: { label: 'PUBLIC WORKS', note: 'Construction that adds to the national capital stock.' },
  research: { label: 'RESEARCH', note: 'Public R&D grants, banked as a stock that decays.' },
}

const SECTOR_FACE: Record<SectorId, string> = {
  agri: 'AGRICULTURE',
  manuf: 'MANUFACTURING',
  energy: 'ENERGY',
  services: 'SERVICES',
  transport: 'TRANSPORT',
}

/** The dials that are a bare number on the record rather than a table — every
 * `PolicyRecord` field that is not one of the four groups below. Derived from
 * the type, so a lever added to the cabinet lands here on its own and the
 * total face record beneath refuses to compile until it has been named.
 * `assetPurchaseRate` and `capitalRequirement` arrived exactly that way. */
type CentralBankDialId = Exclude<
  keyof PolicyPoint,
  'tick' | 'taxRates' | 'spending' | 'subsidies' | 'rules'
>

const CENTRAL_BANK_FACE: Record<CentralBankDialId, { label: string; note: string }> = {
  policyRate: {
    label: 'POLICY RATE',
    note: 'The annualized rate the central bank lends at. It prices credit, and through the real rate it decides whether cheap money inflates a bubble.',
  },
  assetPurchaseRate: {
    label: 'ASSET PURCHASES',
    note: 'Quantitative easing — the annual purchase pace as a share of GDP. It lowers private funding costs when the policy rate has no room left, and feeds credit and asset prices while it does.',
  },
  capitalRequirement: {
    label: 'CAPITAL REQUIREMENT',
    note: 'Bank equity required per unit of credit outstanding. Raising the floor leans against a boom; cutting it frees credit now and leaves less room for losses.',
  },
}

/** Insertion order of the face record — which is the order the cabinet's
 * central-bank desk reads in. */
const CENTRAL_BANK_DIAL_IDS = Object.keys(CENTRAL_BANK_FACE) as CentralBankDialId[]

export const RULE_MODE_LABEL: Record<SpendingRuleMode, string> = {
  fixed: 'FIXED',
  indexed: 'CPI',
  gdpShare: '% GDP',
}

/** Every dial the minute book tracks, in cabinet order. Built from the
 * engine's own id lists over TOTAL face records, so a new tax, programme or
 * sector stops this file compiling until it has been named — the same
 * compile-enforcement the ledger's ink tables carry. */
export const POLICY_LINES: readonly PolicyLine[] = [
  ...REVENUE_SOURCE_IDS.map((id): PolicyLine => ({
    key: `tax.${id}`,
    label: TAX_FACE[id].label,
    group: 'TAXATION',
    unit: 'rate',
    note: TAX_FACE[id].note,
    read: (p) => 100 * p.taxRates[id],
  })),
  ...CENTRAL_BANK_DIAL_IDS.map((id): PolicyLine => ({
    key: id,
    label: CENTRAL_BANK_FACE[id].label,
    group: 'CENTRAL BANK',
    unit: 'rate',
    note: CENTRAL_BANK_FACE[id].note,
    read: (p) => 100 * p[id],
  })),
  ...SPENDING_PROGRAM_IDS.map((id): PolicyLine => ({
    key: `spending.${id}`,
    label: PROGRAMME_FACE[id].label,
    group: 'SPENDING',
    unit: 'money',
    note: PROGRAMME_FACE[id].note,
    read: (p) => p.spending[id],
  })),
  ...SECTOR_IDS.map((id): PolicyLine => ({
    key: `subsidy.${id}`,
    label: `${SECTOR_FACE[id]} SUBSIDY`,
    group: 'SUBSIDIES',
    unit: 'money',
    note: `Money paid to ${SECTOR_FACE[id].toLowerCase()} firms. Delivery leaks through weak administration.`,
    read: (p) => p.subsidies[id],
  })),
]

export const POLICY_LINES_BY_GROUP: Record<PolicyGroup, readonly PolicyLine[]> = {
  TAXATION: POLICY_LINES.filter((l) => l.group === 'TAXATION'),
  'CENTRAL BANK': POLICY_LINES.filter((l) => l.group === 'CENTRAL BANK'),
  SPENDING: POLICY_LINES.filter((l) => l.group === 'SPENDING'),
  SUBSIDIES: POLICY_LINES.filter((l) => l.group === 'SUBSIDIES'),
}

/** One entry in the minute book. `from` is null for the opening settlement:
 * the 1946 dials were inherited, not decided. */
export interface PolicyChange {
  tick: number
  key: string
  label: string
  group: PolicyGroup
  unit: PolicyUnit
  from: number | null
  to: number
  /** set only on an appropriation — how the money was voted, and what the
   * rule itself says (money/quarter, or a 0..1 share of published GDP) */
  rule?: { mode: SpendingRuleMode; value: number }
}

/** A rate set from a slider lands on values like 0.15000000000000002. Two
 * settings closer together than this are the same setting. */
const EPSILON = 1e-9

/** The 1946 settlement is worth a row for every dial that was actually set to
 * something, and for none of the ones that were not: a tax nobody levied and
 * a programme nobody funded both open at zero, and neither is a decision the
 * cabinet can be shown having taken. Moving a dial TO zero later is — that
 * one has a `from` to compare against. */
function opensWithADecision(value: number): boolean {
  return Math.abs(value) > EPSILON
}

/** Read the dials as they stood in a given quarter — the latest record at or
 * before it, so a scrubber can sit anywhere and still answer. */
export function policyAt(record: readonly PolicyPoint[], tick: number): PolicyPoint | null {
  let found: PolicyPoint | null = null
  for (const point of record) {
    if (point.tick > tick) break
    found = point
  }
  return found ?? record[0] ?? null
}

/**
 * Every decision in the record, oldest first.
 *
 * Rates are diffed. Appropriations are NOT: they are reported exactly when
 * the engine says the rule was rewritten, because the resolved money drifts
 * on its own under a CPI or GDP rule.
 */
export function policyChanges(record: readonly PolicyPoint[]): PolicyChange[] {
  const out: PolicyChange[] = []
  const rateLines = POLICY_LINES.filter((line) => !line.key.startsWith('spending.'))

  for (let i = 0; i < record.length; i++) {
    const now = record[i]
    const before = i > 0 ? record[i - 1] : null

    for (const line of rateLines) {
      const to = line.read(now)
      const from = before === null ? null : line.read(before)
      if (from === null ? !opensWithADecision(to) : Math.abs(to - from) <= EPSILON) continue
      out.push({ tick: now.tick, key: line.key, label: line.label, group: line.group, unit: line.unit, from, to })
    }

    for (const programme of SPENDING_PROGRAM_IDS) {
      const rule = now.rules[programme]
      // `votedAt` is the whole trick: it equals this quarter only when the
      // cabinet wrote the rule in it. Indexation and GDP re-resolution leave
      // it alone, so drift files nothing.
      if (rule.votedAt !== now.tick) continue
      const line = POLICY_LINES.find((l) => l.key === `spending.${programme}`)
      if (!line) continue
      // an unfunded programme in the opening settlement is not an order
      if (before === null && !opensWithADecision(line.read(now))) continue
      out.push({
        tick: now.tick,
        key: line.key,
        label: line.label,
        group: line.group,
        unit: line.unit,
        from: before === null ? null : line.read(before),
        to: line.read(now),
        rule: { mode: rule.mode, value: rule.value },
      })
    }
  }
  return out
}

/** How a dial's value prints. Rates get a decimal because a quarter-point
 * move on the policy rate is a real decision; money follows the ledger. */
export function formatPolicyValue(unit: PolicyUnit, value: number): string {
  return unit === 'rate' ? `${value.toFixed(2)}%` : value.toFixed(2)
}

/** How a rule prints — a share is a percentage of GDP, everything else is
 * money per quarter. */
export function formatRuleValue(mode: SpendingRuleMode, value: number): string {
  return mode === 'gdpShare' ? `${(100 * value).toFixed(1)}% GDP` : value.toFixed(2)
}
