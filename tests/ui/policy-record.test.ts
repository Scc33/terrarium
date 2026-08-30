/**
 * The minute book (`ui/src/policyRecord.ts`).
 *
 * The load-bearing claim is negative and cannot be seen by looking at the
 * screen: an appropriation that is CPI-indexed or written as a share of GDP
 * moves every quarter without anyone deciding anything, and a change log that
 * diffed the resolved money would file a decision every quarter for eighty
 * years. That log would look plausible in review — it is full of real
 * numbers — and it would be worthless. So the drift case is pinned first.
 */

import { describe, expect, it } from 'vitest'
import type { PolicyPoint } from '@terrarium/observation'
import {
  POLICY_LINES,
  policyAt,
  policyChanges,
  formatPolicyValue,
} from '../../packages/ui/src/policyRecord'

/** a quarter of the record, with the 1946 settlement as the default */
function point(tick: number, over: Partial<PolicyPoint> = {}): PolicyPoint {
  return {
    tick,
    taxRates: { income: 0.15, corporate: 0.2, tariff: 0.1, fuel: 0 },
    spending: { transfers: 4, procurement: 3, investment: 2, research: 1 },
    immigrationLimit: 0.012,
    policyRate: 0.04,
    assetPurchaseRate: 0,
    capitalRequirement: 0.06,
    fxIntervention: 0,
    subsidies: { agri: 0, manuf: 0, energy: 0, services: 0, transport: 0 },
    rules: {
      transfers: { mode: 'fixed', value: 4, votedAt: 0 },
      procurement: { mode: 'fixed', value: 3, votedAt: 0 },
      investment: { mode: 'fixed', value: 2, votedAt: 0 },
      research: { mode: 'fixed', value: 1, votedAt: 0 },
    },
    statutes: {
      minimum_wage: { level: 0, enactedAt: 0 },
      compulsory_schooling: { level: 0, enactedAt: 0 },
      competition: { level: 0, enactedAt: 0 },
      emissions_standard: { level: 0, enactedAt: 0 },
    },
    ...over,
  }
}

/** the same century twice: one where nothing was ever decided after 1946 */
const passive = Array.from({ length: 40 }, (_, t) => point(t))

describe('the minute book files decisions, not consequences', () => {
  it('files nothing after the opening settlement when the cabinet never met', () => {
    const after1946 = policyChanges(passive).filter((c) => c.tick > 0)
    expect(after1946).toEqual([])
  })

  it('files the 1946 settlement once, and only for dials that were set', () => {
    const opening = policyChanges(passive).filter((c) => c.tick === 0)
    expect(opening.map((c) => c.key).sort()).toEqual([
      'capitalRequirement',
      'immigrationLimit',
      'policyRate',
      'spending.investment',
      'spending.procurement',
      'spending.research',
      'spending.transfers',
      'tax.corporate',
      'tax.income',
      'tax.tariff',
    ])
    // the fuel excise, asset purchases and every subsidy opened at zero: an
    // instrument nobody reached for is not a decision anybody took
    expect(opening.some((c) => c.key === 'tax.fuel')).toBe(false)
    expect(opening.some((c) => c.key === 'assetPurchaseRate')).toBe(false)
    expect(opening.some((c) => c.key.startsWith('subsidy.'))).toBe(false)
    expect(opening.every((c) => c.from === null)).toBe(true)
  })

  it('does not file an unfunded programme as an opening order', () => {
    // a country that opened with no research budget did not decide to spend
    // nothing on research — the line simply did not exist
    const unfunded = passive.map((p) =>
      point(p.tick, { spending: { ...p.spending, research: 0 } }),
    )
    const opening = policyChanges(unfunded).filter((c) => c.tick === 0)
    expect(opening.some((c) => c.key === 'spending.research')).toBe(false)
    expect(opening.some((c) => c.key === 'spending.transfers')).toBe(true)
  })

  it('still files an appropriation cut to zero — abolishing a programme is', () => {
    const record = passive.map((p, t) =>
      t < 16
        ? p
        : point(t, {
            spending: { ...p.spending, research: 0 },
            rules: { ...p.rules, research: { mode: 'fixed', value: 0, votedAt: 16 } },
          }),
    )
    const filed = policyChanges(record).filter((c) => c.key === 'spending.research' && c.tick === 16)
    expect(filed).toHaveLength(1)
    expect(filed[0]).toMatchObject({ from: 1, to: 0 })
  })

  it('IGNORES an indexed appropriation drifting with the CPI', () => {
    // transfers voted once in 1946 and indexed thereafter: the money moves
    // every quarter, the decision does not
    const drifting = Array.from({ length: 40 }, (_, t) =>
      point(t, {
        spending: { transfers: 4 * 1.02 ** t, procurement: 3, investment: 2, research: 1 },
        rules: {
          transfers: { mode: 'indexed', value: 4 * 1.02 ** t, votedAt: 0 },
          procurement: { mode: 'fixed', value: 3, votedAt: 0 },
          investment: { mode: 'fixed', value: 2, votedAt: 0 },
          research: { mode: 'fixed', value: 1, votedAt: 0 },
        },
      }),
    )
    const transfers = policyChanges(drifting).filter((c) => c.key === 'spending.transfers')
    expect(transfers).toHaveLength(1)
    expect(transfers[0].tick).toBe(0)
  })

  it('IGNORES a GDP-share appropriation re-resolving against a growing economy', () => {
    const growing = Array.from({ length: 40 }, (_, t) =>
      point(t, {
        spending: { transfers: 4, procurement: 3, investment: 2 + 0.1 * t, research: 1 },
        rules: {
          transfers: { mode: 'fixed', value: 4, votedAt: 0 },
          procurement: { mode: 'fixed', value: 3, votedAt: 0 },
          investment: { mode: 'gdpShare', value: 0.03, votedAt: 0 },
          research: { mode: 'fixed', value: 1, votedAt: 0 },
        },
      }),
    )
    expect(policyChanges(growing).filter((c) => c.key === 'spending.investment')).toHaveLength(1)
  })

  it('files an appropriation the quarter its rule was actually written', () => {
    const record = passive.map((p, t) =>
      t < 12
        ? p
        : point(t, {
            spending: { transfers: 9, procurement: 3, investment: 2, research: 1 },
            rules: { ...p.rules, transfers: { mode: 'gdpShare', value: 0.05, votedAt: 12 } },
          }),
    )
    const filed = policyChanges(record).filter((c) => c.key === 'spending.transfers')
    expect(filed).toHaveLength(2) // the settlement, then the decision
    expect(filed[1]).toMatchObject({
      tick: 12,
      from: 4,
      to: 9,
      rule: { mode: 'gdpShare', value: 0.05 },
    })
  })

  it('files a rule rewritten to the same money — a mode switch IS a decision', () => {
    const record = passive.map((p, t) =>
      t < 8 ? p : point(t, { rules: { ...p.rules, research: { mode: 'indexed', value: 1, votedAt: 8 } } }),
    )
    const filed = policyChanges(record).filter((c) => c.key === 'spending.research' && c.tick === 8)
    expect(filed).toHaveLength(1)
    expect(filed[0]).toMatchObject({ from: 1, to: 1, rule: { mode: 'indexed' } })
  })
})

describe('the minute book files rate changes by diffing them', () => {
  it('files a tax rate the quarter it moved, with both sides of the move', () => {
    const record = passive.map((p, t) =>
      t < 20 ? p : point(t, { taxRates: { income: 0.22, corporate: 0.2, tariff: 0.1, fuel: 0 } }),
    )
    const filed = policyChanges(record).filter((c) => c.key === 'tax.income')
    expect(filed).toHaveLength(2)
    expect(filed[1]).toMatchObject({ tick: 20, from: 15, to: 22 })
  })

  it('files a rate cut back to zero — abolishing a tax is a decision', () => {
    const record = passive.map((p, t) =>
      t < 20 ? p : point(t, { taxRates: { income: 0.15, corporate: 0.2, tariff: 0, fuel: 0 } }),
    )
    const filed = policyChanges(record).filter((c) => c.key === 'tax.tariff' && c.tick === 20)
    expect(filed).toHaveLength(1)
    expect(filed[0].to).toBe(0)
  })

  it('does not file floating-point noise as a decision', () => {
    const noisy = passive.map((p, t) =>
      point(t, { taxRates: { ...p.taxRates, income: 0.15 + (t % 2) * 1e-15 } }),
    )
    expect(policyChanges(noisy).filter((c) => c.tick > 0)).toEqual([])
  })

  it('files a subsidy the quarter it was first paid', () => {
    const record = passive.map((p, t) =>
      t < 30 ? p : point(t, { subsidies: { agri: 1.5, manuf: 0, energy: 0, services: 0, transport: 0 } }),
    )
    const filed = policyChanges(record).filter((c) => c.key === 'subsidy.agri')
    expect(filed).toHaveLength(1)
    expect(filed[0]).toMatchObject({ tick: 30, from: 0, to: 1.5 })
  })
})

describe('reading the dials back', () => {
  it('answers for any quarter in the record', () => {
    expect(policyAt(passive, 12)?.tick).toBe(12)
  })

  it('answers with the last decision still in force, not nothing', () => {
    // a scrubber parked past the end of the record still has an answer
    expect(policyAt(passive, 999)?.tick).toBe(39)
  })

  it('has no answer for an empty record rather than inventing one', () => {
    expect(policyAt([], 4)).toBeNull()
  })

  it('covers every dial the cabinet can set', () => {
    // 4 taxes · 4 central-bank dials · 1 migration dial · 4 appropriations ·
    // 5 sector subsidies · 4 statutes. The scalar count is derived from
    // `PolicyRecord`, so a lever added to the cabinet fails the build here
    // until it has been named and faced — which is how `assetPurchaseRate`,
    // `capitalRequirement` and `fxIntervention` all arrived.
    expect(POLICY_LINES).toHaveLength(4 + 4 + 1 + 4 + 5 + 4)
    expect(new Set(POLICY_LINES.map((l) => l.key)).size).toBe(POLICY_LINES.length)
  })

  it('gives every central-bank dial a label, a note and a reading', () => {
    const bank = POLICY_LINES.filter((l) => l.group === 'CENTRAL BANK')
    expect(bank.map((l) => l.key)).toEqual([
      'policyRate',
      'assetPurchaseRate',
      'capitalRequirement',
      'fxIntervention',
    ])
    for (const line of bank) {
      expect(line.label.length, line.key).toBeGreaterThan(0)
      expect(line.note.length, line.key).toBeGreaterThan(0)
      expect(line.unit).toBe('rate')
    }
  })

  it('files the immigration ceiling on its own desk', () => {
    const migration = POLICY_LINES.filter((l) => l.group === 'MIGRATION')
    expect(migration.map((l) => l.key)).toEqual(['immigrationLimit'])
    expect(migration[0].read(point(0))).toBeCloseTo(1.2)
  })

  it('reads every line off a record without emitting NaN', () => {
    for (const line of POLICY_LINES) {
      expect(Number.isFinite(line.read(point(0))), line.key).toBe(true)
    }
  })

  it('prints a rate as a percentage and money as money', () => {
    expect(formatPolicyValue({ unit: 'rate', key: 'tax.income' }, 15)).toBe('15.00%')
    expect(formatPolicyValue({ unit: 'money', key: 'spending.transfers' }, 4)).toBe('4.00')
  })

  it('prints a statute as the name of the rung, never as its number', () => {
    // "2" is not a policy. The minute book is meant to be read back years
    // later, and a bare rung index is unreadable the moment a ladder changes.
    const printed = formatPolicyValue({ unit: 'statute', key: 'statute.minimum_wage' }, 2)
    expect(printed).toBe('Living wage')
    expect(formatPolicyValue({ unit: 'statute', key: 'statute.minimum_wage' }, 0)).toBe(
      'No statutory wage',
    )
  })

  it('files an enactment as a decision and never files compliance', () => {
    // The load-bearing negative, in the statute register this time: a statute
    // is filed when its LEVEL moves, and compliance — which drifts every
    // quarter as the civil service grows — is not on the record at all.
    const century = Array.from({ length: 40 }, (_, t) =>
      point(t, {
        statutes: {
          minimum_wage: { level: t >= 10 ? 2 : 0, enactedAt: t >= 10 ? 10 : 0 },
          compulsory_schooling: { level: 0, enactedAt: 0 },
          competition: { level: 0, enactedAt: 0 },
      emissions_standard: { level: 0, enactedAt: 0 },
        },
      }),
    )
    const filed = policyChanges(century).filter((c) => c.key === 'statute.minimum_wage')
    expect(filed).toHaveLength(1)
    expect(filed[0].tick).toBe(10)
    expect(filed[0].from).toBe(0)
    expect(filed[0].to).toBe(2)
  })
})
