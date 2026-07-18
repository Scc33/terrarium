import { describe, expect, it } from 'vitest'
import { init, step, type TrueState } from '@terrarium/engine'
import { observe, snapshotOf, type TrueSnapshot } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

function play(seed: string, ticks: number, statCapacity?: number) {
  const params =
    statCapacity === undefined
      ? standardCountry
      : { ...standardCountry, capacities: { ...standardCountry.capacities, statistical: statCapacity } }
  let s: TrueState = init(params, seed)
  const history: TrueSnapshot[] = []
  for (let t = 0; t < ticks; t++) {
    const prev = s
    s = step(s)
    history.push(snapshotOf(prev, s))
  }
  return { state: s, history }
}

describe('the fog', () => {
  it('publishes with a lag: no indicator point for the just-finished quarter at low capacity', () => {
    const { state, history } = play('fog-1', 12)
    const pub = observe(state, history, 'fog-1')
    const gdp = pub.indicators.gdp_growth!
    const newest = Math.max(...gdp.points.map((p) => p.forQtr))
    expect(newest).toBeLessThanOrEqual(state.meta.tick - 2)
  })

  it('is deterministic: same inputs, same published numbers', () => {
    const a = play('fog-2', 16)
    const b = play('fog-2', 16)
    expect(observe(a.state, a.history, 'fog-2')).toEqual(observe(b.state, b.history, 'fog-2'))
  })

  it('first prints get revised toward truth', () => {
    const { state, history } = play('fog-3', 20)
    const pub = observe(state, history, 'fog-3')
    const gdp = pub.indicators.gdp_growth!
    // pick a quarter with all three prints out
    const q = 4
    const prints = gdp.points.filter((p) => p.forQtr === q).sort((x, y) => x.revision - y.revision)
    expect(prints.length).toBe(3)
    const truth = (Math.pow(history[q].realGdp / history[q - 1].realGdp, 4) - 1) * 100
    const err = (p: { value: number }) => Math.abs(p.value - truth)
    // final revision must sit closer to truth than the first print's noise floor
    expect(err(prints[2])).toBeLessThan(Math.max(err(prints[0]), 0.5))
  })

  it('unemployment series requires a funded labor force survey', () => {
    const poor = play('fog-4', 12, 0.1)
    expect(observe(poor.state, poor.history, 'fog-4').indicators.unemployment).toBeUndefined()
    const funded = play('fog-4', 12, 0.6)
    expect(observe(funded.state, funded.history, 'fog-4').indicators.unemployment).toBeDefined()
  })

  it('higher statistical capacity shrinks the noise', () => {
    const noisy: number[] = []
    const clean: number[] = []
    for (let i = 0; i < 12; i++) {
      const lo = play(`fog-n-${i}`, 14, 0.1)
      const hi = play(`fog-n-${i}`, 14, 0.9)
      const measure = (r: typeof lo, cap: number[]) => {
        const pub = observe(r.state, r.history, `fog-n-${i}`)
        for (const p of pub.indicators.gdp_growth!.points) {
          if (p.revision !== 0) continue
          const truth =
            (Math.pow(r.history[p.forQtr].realGdp / r.history[Math.max(p.forQtr - 1, 0)].realGdp, 4) - 1) * 100
          cap.push(Math.abs(p.value - truth))
        }
      }
      measure(lo, noisy)
      measure(hi, clean)
    }
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    expect(mean(clean)).toBeLessThan(mean(noisy) * 0.5)
  })
})
