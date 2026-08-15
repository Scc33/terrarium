import { describe, expect, it } from 'vitest'

/**
 * Executable record of investigation 0007, measured at e6ff368 with 120
 * all-country passive runs and 120 all-country developmental runs through
 * 2050. Era values are means of annualized log-growth contributions in quiet
 * player-reachable quarters; downside values are marginal medians within the
 * worst 5% of quiet aggregate growth and therefore need not add exactly.
 */
const QUIET_GROWTH = {
  passive: {
    lateCentury: {
      aggregate: 2.72,
      perCapita: 1.63,
      population: 1.10,
      productivity: 1.38,
      employmentRate: 0.06,
      laborForceShare: 0.19,
      laborForce: 1.28,
    },
    future: {
      aggregate: 1.52,
      perCapita: 1.00,
      population: 0.52,
      productivity: 0.92,
      employmentRate: 0.06,
      laborForceShare: 0.02,
      laborForce: 0.54,
    },
  },
  developmental: {
    lateCentury: {
      aggregate: 3.01,
      perCapita: 2.53,
      population: 0.48,
      productivity: 2.06,
      employmentRate: 0.14,
      laborForceShare: 0.33,
      laborForce: 0.81,
    },
    future: {
      aggregate: 0.52,
      perCapita: 1.13,
      population: -0.60,
      productivity: 1.23,
      employmentRate: 0.07,
      laborForceShare: -0.17,
      laborForce: -0.78,
    },
  },
} as const

const FUTURE_LABOR_CONTRACTION = {
  passive: {
    observations: 2_226,
    quietQuarters: 6_663,
    laborForce: -0.44,
    aggregate: 0.54,
    perCapita: 0.90,
    population: -0.36,
  },
  developmental: {
    observations: 4_639,
    quietQuarters: 5_264,
    laborForce: -0.91,
    aggregate: 0.41,
    perCapita: 1.11,
    population: -0.71,
  },
} as const

const DOWNSIDE = {
  passive: {
    lateCentury: { aggregate: -1.80, perCapita: -2.36, population: 0.40 },
    future: { aggregate: -4.31, perCapita: -4.28, population: -0.21 },
  },
  developmental: {
    lateCentury: { aggregate: -2.58, perCapita: -2.54, population: -0.19 },
    future: { aggregate: -5.46, perCapita: -4.69, population: -0.84 },
  },
} as const

const SURVIVOR_TREND = {
  passive: { survivors: 95, aggregateCagr: 2.55, perCapitaCagr: 1.37, populationCagr: 1.16 },
  developmental: {
    survivors: 70,
    aggregateCagr: 2.28,
    perCapitaCagr: 2.07,
    populationCagr: 0.30,
  },
} as const

describe('aggregate versus per-capita late growth experiment', () => {
  it('freezes the two exact quiet-growth identities', () => {
    for (const policy of Object.values(QUIET_GROWTH)) {
      for (const era of Object.values(policy)) {
        expect(era.aggregate).toBeCloseTo(era.perCapita + era.population, 1)
        expect(era.perCapita).toBeCloseTo(
          era.productivity + era.employmentRate + era.laborForceShare,
          1,
        )
        expect(era.laborForce).toBeCloseTo(era.population + era.laborForceShare, 1)
      }
    }
  })

  it('records that developmental late growth is lower only in aggregate', () => {
    expect(QUIET_GROWTH.developmental.future.aggregate).toBeLessThan(
      QUIET_GROWTH.passive.future.aggregate - 0.9,
    )
    expect(QUIET_GROWTH.developmental.future.perCapita).toBeGreaterThan(
      QUIET_GROWTH.passive.future.perCapita + 0.1,
    )
    expect(SURVIVOR_TREND.developmental.aggregateCagr).toBeLessThan(
      SURVIVOR_TREND.passive.aggregateCagr,
    )
    expect(SURVIVOR_TREND.developmental.perCapitaCagr).toBeGreaterThan(
      SURVIVOR_TREND.passive.perCapitaCagr + 0.6,
    )
  })

  it('records that a shrinking labor force is not itself a recession', () => {
    expect(FUTURE_LABOR_CONTRACTION.passive.observations).toBeGreaterThan(
      FUTURE_LABOR_CONTRACTION.passive.quietQuarters * 0.3,
    )
    expect(FUTURE_LABOR_CONTRACTION.developmental.observations).toBeGreaterThan(
      FUTURE_LABOR_CONTRACTION.developmental.quietQuarters * 0.85,
    )
    for (const result of Object.values(FUTURE_LABOR_CONTRACTION)) {
      expect(result.laborForce).toBeLessThan(0)
      expect(result.population).toBeLessThan(0)
      expect(result.aggregate).toBeGreaterThan(0)
      expect(result.perCapita).toBeGreaterThan(result.aggregate)
    }
  })

  it('records that most future downside deterioration remains per-capita', () => {
    for (const policy of Object.values(DOWNSIDE)) {
      const aggregateDeterioration = Math.abs(
        policy.future.aggregate - policy.lateCentury.aggregate,
      )
      const perCapitaDeterioration = Math.abs(
        policy.future.perCapita - policy.lateCentury.perCapita,
      )
      expect(perCapitaDeterioration / aggregateDeterioration).toBeGreaterThan(0.7)
      expect(Math.abs(policy.future.perCapita)).toBeGreaterThan(
        Math.abs(policy.future.population) * 4,
      )
    }
  })
})
