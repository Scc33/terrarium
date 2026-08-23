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
 * decision. Diffing the money instead would file four hundred entries for a
 * cabinet that met once — the failure mode AGENTS.md calls a warning that
 * never turns off, and here it would be the whole feature.
 *
 * Rates carry no such machinery: nothing but an order moves a tax rate, so
 * they are diffed directly.
 *
 * Pure for the usual reason — the alternative is a change log that can only
 * be checked by playing eighty years of a save and squinting at it.
 */

import {
  SECTOR_IDS,
  SPENDING_PROGRAM_IDS,
  STATUTE_IDS,
  STATUTE_LEVELS,
  type SectorId,
} from '@terrarium/engine'
import {
  REVENUE_SOURCE_IDS,
  type PolicyPoint,
  type RevenueSourceId,
  type SpendingProgramId,
  type SpendingRuleMode,
} from '@terrarium/observation'

/** Which desk in the cabinet an entry belongs to — the same five groups the
 * control rail sets them on, so the record reads back in the order it was
 * written. */
export type PolicyGroup =
  | 'TAXATION'
  | 'CENTRAL BANK'
  | 'MIGRATION'
  | 'SPENDING'
  | 'SUBSIDIES'
  | 'STATUTES'

/** A rate is a percentage and comparable across a century; an appropriation
 * is money, and 4.0 in 1946 is not 4.0 in 2040. The distinction decides how a
 * value prints and whether it can honestly share an axis with its siblings. */
export type PolicyUnit = 'rate' | 'money' | 'statute'

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
  income: { label: 'INCOME TAX', note: 'A tax on workers’ pay. A stronger tax office collects more of the posted rate.' },
  corporate: { label: 'CORPORATE TAX', note: 'A tax on company profits.' },
  tariff: { label: 'TARIFF', note: 'A tax on imported goods, collected at the border.' },
  fuel: { label: 'FUEL EXCISE', note: 'A tax on fuel bought by households and businesses.' },
}

const PROGRAMME_FACE: Record<SpendingProgramId, { label: string; note: string }> = {
  transfers: { label: 'TRANSFERS', note: 'Pensions and relief, paid to households.' },
  procurement: { label: 'PROCUREMENT', note: 'Goods and services bought by the government.' },
  investment: { label: 'PUBLIC WORKS', note: 'Roads, power and other assets that support future production.' },
  research: { label: 'RESEARCH', note: 'Grants for better production methods. Recent funding matters more than old funding.' },
}

const SECTOR_FACE: Record<SectorId, string> = {
  agri: 'AGRICULTURE',
  manuf: 'MANUFACTURING',
  energy: 'ENERGY',
  services: 'SERVICES',
  transport: 'TRANSPORT',
}

/** What the minute book calls each statute, and the ladder it names its rungs
 * from. The names come from the ENGINE's own `STATUTE_LEVELS` rather than a
 * second table here, because a rung's name and the strength it carries are one
 * fact and a copy of it is a thing that can disagree. */
const STATUTE_FACE: Record<(typeof STATUTE_IDS)[number], { label: string; note: string }> = {
  minimum_wage: {
    label: 'MIN. WAGE',
    note: 'A legal floor under pay. It binds where the low wages are, and is obeyed as far as the state can enforce it.',
  },
  compulsory_schooling: {
    label: 'SCHOOL AGE',
    note: 'The age below which children must be in a classroom. Costs labour now and returns workforce skills over a generation.',
  },
  competition: {
    label: 'COMPETITION',
    note: 'Merger review and the power to break up dominant firms. It speeds up how fast the country adopts techniques the world already has.',
  },
}

/** How a statute's rung prints in the record: its name, not its number. */
export function statuteLevelName(key: string, level: number): string {
  const id = key.slice('statute.'.length) as (typeof STATUTE_IDS)[number]
  return STATUTE_LEVELS[id]?.[level]?.name ?? String(level)
}

/** The dials that are a bare number on the record rather than a table — every
 * `PolicyRecord` field that is not one of the table-valued groups below. Derived from
 * the type, so a lever added to the cabinet lands here on its own and the
 * total face record beneath refuses to compile until it has been named.
 * `assetPurchaseRate`, `capitalRequirement`, and `immigrationLimit` arrived exactly that way. */
type ScalarDialId = Exclude<
  keyof PolicyPoint,
  'tick' | 'taxRates' | 'spending' | 'subsidies' | 'rules' | 'statutes'
>

const SCALAR_DIAL_FACE: Record<ScalarDialId, { label: string; note: string; group: PolicyGroup }> = {
  policyRate: {
    label: 'POLICY RATE',
    note: 'The main interest rate. Higher rates cool borrowing and investment; lower rates encourage them.',
    group: 'CENTRAL BANK',
  },
  assetPurchaseRate: {
    label: 'ASSET PURCHASES',
    note: 'Central-bank purchases that lower borrowing costs when rates are near zero. They can also fuel risky lending and asset booms.',
    group: 'CENTRAL BANK',
  },
  capitalRequirement: {
    label: 'CAPITAL REQUIREMENT',
    note: 'The share of lending banks must fund with their own money. Higher levels slow credit booms and help banks survive losses.',
    group: 'CENTRAL BANK',
  },
  immigrationLimit: {
    label: 'IMMIGRATION CEILING',
    note: 'The most people the country will admit each year, as a share of the population. It limits arrivals, never departures.',
    group: 'MIGRATION',
  },
}

/** Insertion order of the face record — which is the order the cabinet desks
 * read in. */
const SCALAR_DIAL_IDS = Object.keys(SCALAR_DIAL_FACE) as ScalarDialId[]

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
  ...SCALAR_DIAL_IDS.map((id): PolicyLine => ({
    key: id,
    label: SCALAR_DIAL_FACE[id].label,
    group: SCALAR_DIAL_FACE[id].group,
    unit: 'rate',
    note: SCALAR_DIAL_FACE[id].note,
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
  // The statute book. A statute reads as its RUNG, not its strength: the
  // record is of what the cabinet wrote, and "level 2" is the decision it
  // took. Compliance is deliberately absent — it moves every quarter on its
  // own as the civil service grows and the blocs change their minds, so a log
  // that diffed it would file a decision every quarter for eighty years. Same
  // trap the indexed appropriations sprang, in a new register (ADR-0027).
  ...STATUTE_IDS.map((id): PolicyLine => ({
    key: `statute.${id}`,
    label: STATUTE_FACE[id].label,
    group: 'STATUTES',
    unit: 'statute',
    note: STATUTE_FACE[id].note,
    read: (p) => p.statutes[id].level,
  })),
]

export const POLICY_LINES_BY_GROUP: Record<PolicyGroup, readonly PolicyLine[]> = {
  TAXATION: POLICY_LINES.filter((l) => l.group === 'TAXATION'),
  'CENTRAL BANK': POLICY_LINES.filter((l) => l.group === 'CENTRAL BANK'),
  MIGRATION: POLICY_LINES.filter((l) => l.group === 'MIGRATION'),
  SPENDING: POLICY_LINES.filter((l) => l.group === 'SPENDING'),
  SUBSIDIES: POLICY_LINES.filter((l) => l.group === 'SUBSIDIES'),
  STATUTES: POLICY_LINES.filter((l) => l.group === 'STATUTES'),
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
 * move on the policy rate is a real decision; money follows the ledger; and a
 * statute prints the NAME of the rung it is on, because "2" is not a policy
 * and the record is meant to be read. */
export function formatPolicyValue(
  line: Pick<PolicyLine, 'unit' | 'key'>,
  value: number,
): string {
  if (line.unit === 'statute') return statuteLevelName(line.key, value)
  return line.unit === 'rate' ? `${value.toFixed(2)}%` : value.toFixed(2)
}

/** How a rule prints — a share is a percentage of GDP, everything else is
 * money per quarter. */
export function formatRuleValue(mode: SpendingRuleMode, value: number): string {
  return mode === 'gdpShare' ? `${(100 * value).toFixed(1)}% GDP` : value.toFixed(2)
}
