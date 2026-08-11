import { describe, expect, it } from 'vitest'
import type { MacroEvent, TrajectoryPoint } from '../../packages/runner/src/run'
import {
  analyzeStability,
  playableTrajectory,
  summarizeTails,
  type StabilityRun,
} from '../../packages/runner/src/stability'

function point(
  tick: number,
  options: {
    realGdp?: number
    inflation?: number
    unemployment?: number
    price?: number
    events?: MacroEvent[]
    publishedInflation?: number | null
    publishedRealGrowth?: number | null
    drivers?: Partial<TrajectoryPoint['drivers']>
  } = {},
): TrajectoryPoint {
  const price = options.price ?? 1
  return {
    tick,
    realGdp: options.realGdp ?? 100 + tick,
    nominalGdp: 100 + tick,
    inflationQ: (options.inflation ?? 0) / 400,
    unemployment: (options.unemployment ?? 10) / 100,
    prices: { agri: price, manuf: price, energy: price, services: price, transport: price },
    debtToGdp: 0.5,
    printedThisQtr: 0,
    approval: [0.5],
    politicalCapital: 10,
    inPower: true,
    publishedInflation: options.publishedInflation ?? null,
    publishedRealGrowth: options.publishedRealGrowth ?? null,
    events: options.events ?? [],
    drivers: {
      laborForce: 100 + tick,
      employment: 90 + tick,
      laborProductivity: (options.realGdp ?? 100 + tick) / (90 + tick),
      realWage: 1 + tick / 100,
      utilization: 0.85,
      demandSatisfaction: 1,
      tfpGrowthQ: 0.002,
      investmentRate: 0.2,
      finalDemand: 100 + tick,
      householdDemand: 80 + tick,
      investment: 20 + tick,
      governmentDemand: 5 + tick,
      exports: 10 + tick,
      ...options.drivers,
    },
  }
}

function run(
  trajectory: TrajectoryPoint[],
  options: { deposedAt?: number | null; priceExplosions?: number } = {},
): StabilityRun {
  return {
    seed: 'unit-seed',
    countryId: 'baseline',
    trajectory,
    deposedAt: options.deposedAt ?? null,
    priceExplosions: options.priceExplosions ?? 0,
  }
}

describe('long-horizon stability analysis', () => {
  it('summarizes fixed eras with annualized quarterly macro readings', () => {
    const report = analyzeStability([
      run([
        point(39, { realGdp: 100 }),
        point(40, {
          realGdp: 101,
          inflation: 2,
          unemployment: 9,
          publishedInflation: 5,
          publishedRealGrowth: 7,
        }),
        point(41, { realGdp: 102, inflation: 4, unemployment: 8 }),
        point(215, { realGdp: 200 }),
        point(216, { realGdp: 202, inflation: 6, unemployment: 7 }),
      ]),
    ])

    const postwar = report.eras.find((era) => era.era.id === 'postwar')!
    expect(postwar.quarters).toBe(2)
    expect(postwar.inflation.p50).toBe(3)
    expect(postwar.unemployment.p01).toBeCloseTo(8.01)
    expect(postwar.realGrowth.p50).toBeCloseTo(4.04, 2)
    expect(postwar.publishedInflation).toMatchObject({ count: 1, p50: 5 })
    expect(postwar.publishedRealGrowth).toMatchObject({ count: 1, p50: 7 })
    expect(postwar.quietDrivers.observations).toBe(2)
    expect(postwar.quietDrivers.laborProductivityGrowth.count).toBe(2)

    const early2000s = report.eras.find((era) => era.era.id === 'early_2000s')!
    expect(early2000s.quarters).toBe(1)
    expect(early2000s.inflation.p50).toBe(6)
  })

  it('separates raw engine failures from the trajectory a player can reach', () => {
    const trajectory = [point(1), point(2), point(3, { price: 60 })]
    const result = run(trajectory, { deposedAt: 2, priceExplosions: 1 })
    const report = analyzeStability([result])

    expect(playableTrajectory(result).map((entry) => entry.tick)).toEqual([1, 2])
    expect(report.rawPriceExplosionRuns).toEqual(['unit-seed'])
    expect(report.reachablePriceExplosionRuns).toEqual([])
  })

  it('treats a non-finite first release as a player-reachable failure', () => {
    const report = analyzeStability([
      run([point(1, { publishedInflation: Number.NaN })]),
    ])

    expect(report.reachableNonFiniteRuns).toEqual(['unit-seed'])
  })

  it('measures shock peaks, reversals, and rebounds over complete windows', () => {
    const trajectory = [
      point(215, { realGdp: 100 }),
      point(216, { realGdp: 98, inflation: 12, events: ['drought'] }),
      point(217, { realGdp: 97, inflation: 20 }),
      point(218, { realGdp: 99, inflation: 8 }),
      point(219, { realGdp: 102, inflation: -4 }),
      point(220, { realGdp: 103, inflation: -2 }),
      point(221, { realGdp: 104 }),
      point(222, { realGdp: 105 }),
      point(223, { realGdp: 106 }),
      point(224, { realGdp: 107 }),
      point(225, { realGdp: 108, inflation: 1 }),
    ]
    const shock = analyzeStability([run(trajectory)]).shocks.find(
      (entry) => entry.era.id === 'early_2000s' && entry.event === 'drought',
    )!

    expect(shock.onsets).toBe(1)
    expect(shock.completeWindows).toBe(1)
    expect(shock.peakInflation.p50).toBe(20)
    expect(shock.laterInflationTrough.p50).toBe(-4)
    expect(shock.reboundGrowth.p50).toBeCloseTo(12.68, 1)

    const era = analyzeStability([run(trajectory)]).eras.find(
      (entry) => entry.era.id === 'early_2000s',
    )!
    expect(era.quietQuarters).toBe(1)
    expect(era.quietInflation.p50).toBe(1)
  })

  it('drops non-finite observations instead of corrupting tail quantiles', () => {
    expect(summarizeTails([1, Number.NaN, 3])).toMatchObject({ count: 2, p50: 2 })
  })

  it('treats foreign partner crises as shocks when selecting quiet quarters', () => {
    const trajectory = [
      point(215, { realGdp: 100 }),
      point(216, { realGdp: 99, events: ['world_crisis'] }),
      ...Array.from({ length: 9 }, (_, index) =>
        point(217 + index, { realGdp: 100 + index }),
      ),
    ]
    const report = analyzeStability([run(trajectory)])
    const era = report.eras.find((entry) => entry.era.id === 'early_2000s')!
    const shock = report.shocks.find(
      (entry) => entry.era.id === 'early_2000s' && entry.event === 'world_crisis',
    )!

    expect(era.quietQuarters).toBe(1)
    expect(shock.onsets).toBe(1)
    expect(shock.completeWindows).toBe(1)
  })

  it('decomposes quiet GDP downside into additive productivity and employment contributions', () => {
    const report = analyzeStability([
      run([
        point(107, {
          realGdp: 100,
          drivers: { employment: 100, laborProductivity: 1 },
        }),
        point(108, {
          realGdp: 99,
          drivers: { employment: 99, laborProductivity: 1 },
        }),
      ]),
    ])
    const downside = report.eras.find((era) => era.era.id === 'late_century')!
      .quietDrivers.downside

    expect(downside.observations).toBe(1)
    expect(downside.laborProductivityContribution.p50).toBeCloseTo(0)
    expect(downside.employmentContribution.p50).toBeCloseTo(Math.log(0.99) * 400)
    expect(
      downside.laborProductivityContribution.p50 + downside.employmentContribution.p50,
    ).toBeCloseTo(Math.log(0.99) * 400)
  })
})
