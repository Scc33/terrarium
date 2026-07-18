import { describe, expect, it } from 'vitest'
import { init, rngFor, step, TICK_ORDER, type TrueState } from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

function play(seed: string, ticks: number, statCapacity?: number): TrueState {
  const params =
    statCapacity === undefined
      ? standardCountry
      : { ...standardCountry, capacities: { ...standardCountry.capacities, statistical: statCapacity } }
  let s: TrueState = init(params, seed)
  for (let t = 0; t < ticks; t++) s = step(s)
  return s
}

const trueGrowth = (s: TrueState, q: number): number => {
  const rec = s.stats.record
  return (Math.pow(rec[q].realGdp / rec[Math.max(q - 1, 0)].realGdp, 4) - 1) * 100
}

describe('the fog', () => {
  it('publishes with a lag: no indicator point for the just-finished quarter at low capacity', () => {
    const state = play('fog-1', 12)
    const gdp = observe(state).indicators.gdp_growth!
    const newest = Math.max(...gdp.points.map((p) => p.forQtr))
    expect(newest).toBeLessThanOrEqual(state.meta.tick - 2)
  })

  it('is deterministic: same inputs, same published numbers', () => {
    expect(observe(play('fog-2', 16))).toEqual(observe(play('fog-2', 16)))
  })

  it('first prints get revised toward truth', () => {
    const state = play('fog-3', 20)
    const gdp = observe(state).indicators.gdp_growth!
    // pick a quarter with all three prints out
    const q = 4
    const prints = gdp.points.filter((p) => p.forQtr === q).sort((x, y) => x.revision - y.revision)
    expect(prints.length).toBe(3)
    const truth = trueGrowth(state, q)
    const err = (p: { value: number }) => Math.abs(p.value - truth)
    // final revision must sit closer to truth than the first print's noise floor
    expect(err(prints[2])).toBeLessThan(Math.max(err(prints[0]), 0.5))
  })

  it('unemployment series requires a funded labor force survey', () => {
    expect(observe(play('fog-4', 12, 0.1)).indicators.unemployment).toBeUndefined()
    expect(observe(play('fog-4', 12, 0.6)).indicators.unemployment).toBeDefined()
  })

  it('polling is an instrument you buy: no approval series until the office can field it', () => {
    expect(observe(play('fog-6', 12, 0.1)).indicators.approval).toBeUndefined()
    const polled = observe(play('fog-6', 12, 0.4)).indicators.approval
    expect(polled).toBeDefined()
    // a poll reads in sane percentage territory
    for (const p of polled!.points) {
      expect(p.value).toBeGreaterThan(-20)
      expect(p.value).toBeLessThan(120)
    }
  })

  it('higher statistical capacity shrinks the noise', () => {
    const noisy: number[] = []
    const clean: number[] = []
    for (let i = 0; i < 12; i++) {
      const measure = (s: TrueState, acc: number[]) => {
        for (const p of observe(s).indicators.gdp_growth!.points) {
          if (p.revision !== 0) continue
          acc.push(Math.abs(p.value - trueGrowth(s, p.forQtr)))
        }
      }
      measure(play(`fog-n-${i}`, 14, 0.1), noisy)
      measure(play(`fog-n-${i}`, 14, 0.9), clean)
    }
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    expect(mean(clean)).toBeLessThan(mean(noisy) * 0.5)
  })
})

describe('salience (§3.4)', () => {
  it('political capital follows the published number, not the truth', () => {
    const s0 = play('salience-1', 8)
    const politics = TICK_ORDER.find((st) => st.name === 'politics')!
    // identical economy, identical approval — only the headline print differs
    const withHeadline = (value: number): TrueState => ({
      ...s0,
      // healthy approval so PC accrual sits above its floor — the floor
      // would otherwise mask the salience term entirely
      cohorts: s0.cohorts.map((c) => ({ ...c, approval: 0.6 })),
      politics: { politicalCapital: 50, quartersToElection: 8, inPower: true, electionsWon: 0, deposedAt: null },
      stats: {
        ...s0.stats,
        series: {
          ...s0.stats.series,
          gdp_growth: [
            { forQtr: s0.meta.tick - 2, publishedAt: s0.meta.tick, value, revision: 0, errorBand: 0 },
          ],
        },
      },
    })
    const pcAfter = (v: number) =>
      politics.run(withHeadline(v), rngFor(s0.meta.seed, 'politics', s0.meta.tick)).politics
        .politicalCapital
    expect(pcAfter(5)).toBeGreaterThan(pcAfter(-5))
  })
})
