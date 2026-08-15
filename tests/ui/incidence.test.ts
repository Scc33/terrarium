/**
 * Fiscal incidence (`ui/src/incidence.ts`).
 *
 * The failure mode this guards is a silent wrong sign. A transfer cut
 * rendered as a gain — or a leak applied in the wrong direction, so the
 * player is told a cut hurts households MORE than it saves the treasury —
 * looks entirely reasonable in a screenshot and is exactly backwards. So the
 * arithmetic lives in a pure module and the signs get pinned here.
 *
 * The other claim under test is a boundary one: incidence is offered ONLY
 * where the government has a programme rule to read. The moment this module
 * starts estimating a tax base it is publishing fogged truth through the
 * cabinet, which is the one thing the fog exists to prevent.
 */

import { describe, expect, it } from 'vitest'
import { adminEffectiveness, COHORT_IDS, TRANSFER_SHARE } from '../../packages/engine/src'
import type { PublishedState } from '@terrarium/observation'
import { dialIncidence, transferIncidence } from '../../packages/ui/src/incidence'

const CAP = 0.6
const total = (rows: Array<{ delivered: number }>) => rows.reduce((s, r) => s + r.delivered, 0)

describe('transfer incidence', () => {
  it('hands every delivered penny to some cohort', () => {
    const inc = transferIncidence(4, CAP)
    expect(total(inc.rows)).toBeCloseTo(inc.delivered, 12)
    expect(inc.rows.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1, 12)
  })

  it('leaks: households move by less than the books do, both directions', () => {
    for (const booked of [8, -8]) {
      const inc = transferIncidence(booked, CAP)
      expect(Math.abs(inc.delivered)).toBeLessThan(Math.abs(inc.booked))
      expect(inc.delivered).toBeCloseTo(booked * adminEffectiveness(CAP), 12)
      // …and never crosses zero doing it: a cut is a cut
      expect(Math.sign(inc.delivered)).toBe(Math.sign(booked))
    }
  })

  it('a cut takes from every cohort it reaches, and only those', () => {
    const inc = transferIncidence(-3, CAP)
    for (const row of inc.rows) {
      expect(row.delivered, row.cohort).toBeLessThan(0)
      expect(TRANSFER_SHARE[row.cohort], row.cohort).toBeGreaterThan(0)
    }
    const listed = new Set(inc.rows.map((r) => r.cohort))
    for (const id of COHORT_IDS) {
      // a cohort with no claim is absent, not present at zero — a nil row
      // reads as "reached, but barely", which is the opposite of the truth
      expect(listed.has(id), id).toBe(TRANSFER_SHARE[id] > 0)
    }
  })

  it('ranks by who has most at stake', () => {
    const shares = transferIncidence(-3, CAP).rows.map((r) => r.share)
    expect(shares).toEqual([...shares].sort((a, b) => b - a))
  })

  it('a better civil service delivers more of the same order', () => {
    const weak = transferIncidence(5, 0.1)
    const strong = transferIncidence(5, 0.9)
    expect(strong.delivered).toBeGreaterThan(weak.delivered)
    expect(strong.booked).toBe(weak.booked) // the books pay full either way
  })
})

describe('which dials have a rule to read', () => {
  const pub = { capacity: { administrative: CAP } } as unknown as PublishedState

  it('reads the transfer line', () => {
    expect(dialIncidence('spending.transfers', -2, pub)?.programme).toBe('transfers')
  })

  it('declines every dial whose incidence would need a survey', () => {
    // each of these needs a BASE the government can only estimate — profits,
    // wages, household baskets. Offering a number here would be presenting
    // fogged truth as a programme rule.
    for (const path of ['taxRates.income', 'taxRates.corporate', 'taxRates.fuel', 'taxRates.tariff', 'spending.procurement', 'spending.investment', 'spending.research', 'policyRate', 'assetPurchaseRate', 'capitalRequirement'] as const) {
      expect(dialIncidence(path, 1, pub), path).toBeNull()
    }
  })
})
