import { describe, expect, it } from 'vitest'
import {
  applyActions,
  init,
  politicalCostOfAction,
  rngFor,
  step,
  STATUTE_IDS,
  STATUTE_LEVELS,
  TICK_ORDER,
  totalLaborForce,
  type TrueState,
} from '@terrarium/engine'
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

  it('the labor force survey publishes unemployment and participation together', () => {
    const dark = observe(play('fog-4', 12, 0.1))
    expect(dark.indicators.unemployment).toBeUndefined()
    expect(dark.indicators.labor_force_participation).toBeUndefined()

    const surveyedState = play('fog-4', 12, 0.6)
    const surveyed = observe(surveyedState)
    expect(surveyed.indicators.unemployment).toBeDefined()
    expect(surveyed.indicators.labor_force_participation).toBeDefined()

    const latestRecord = surveyedState.stats.record.at(-1)!
    const population = surveyedState.demography.pyramid.reduce((sum, people) => sum + people, 0)
    expect(latestRecord.laborForceParticipation).toBeCloseTo(
      totalLaborForce(surveyedState) / population,
      10,
    )
    for (const point of surveyed.indicators.labor_force_participation!.points) {
      expect(point.value).toBeGreaterThan(0)
      expect(point.value).toBeLessThan(100)
    }
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

describe('headline salience', () => {
  it('political capital follows the published number, not the truth', () => {
    const s0 = play('salience-1', 8)
    const politics = TICK_ORDER.find((st) => st.name === 'politics')!
    // identical economy, identical approval — only the headline print differs
    const withHeadline = (value: number): TrueState => ({
      ...s0,
      // healthy approval so PC accrual sits above its floor — the floor
      // would otherwise mask the salience term entirely
      cohorts: s0.cohorts.map((c) => ({ ...c, approval: 0.6 })),
      politics: { ...s0.politics, politicalCapital: 50, quartersToElection: 8, inPower: true },
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

describe('the statute book on the desk', () => {
  it('publishes every statute, its ladder, and what it would cost to change', () => {
    const pub = observe(play('statutes-desk', 8))
    expect(pub.statutes.length).toBe(STATUTE_IDS.length)
    for (const statute of pub.statutes) {
      expect(statute.levels.length).toBe(STATUTE_LEVELS[statute.id].length)
      expect(statute.cost.length).toBe(statute.levels.length)
      // the rung already in force is not on offer, and every other one is
      expect(statute.cost[statute.level]).toBeNull()
      for (let rung = 0; rung < statute.cost.length; rung++) {
        if (rung === statute.level) continue
        expect(statute.cost[rung], `${statute.id} rung ${rung}`).toBeGreaterThan(0)
      }
    }
  })

  it('quotes what the engine will actually charge, never a second opinion', () => {
    const state = play('statutes-quote', 8)
    for (const statute of observe(state).statutes) {
      for (let rung = 0; rung < statute.cost.length; rung++) {
        if (statute.cost[rung] === null) continue
        expect(statute.cost[rung]).toBeCloseTo(
          politicalCostOfAction(state, { kind: 'enact', statute: statute.id, level: rung }),
          9,
        )
      }
    }
  })

  it('says "no statute" rather than "in force since 1946" for a rule nobody wrote', () => {
    for (const statute of observe(play('statutes-empty', 8)).statutes) {
      expect(statute.level).toBe(0)
      expect(statute.enactedAt).toBeNull()
      expect(statute.inForce).toBe(0)
      // …and the compliance is still a real figure: nobody obeys a rule that
      // does not exist, but the state's capacity to enforce one is a fact
      // about the state, not about the rule
      expect(statute.compliance).toBeGreaterThan(0)
    }
  })

  it('shows the gap between what was written and what the country is subject to', () => {
    const opening = play('statutes-gap', 8)
    let state = applyActions(
      { ...opening, politics: { ...opening.politics, politicalCapital: 500 } },
      [{ kind: 'enact', statute: 'minimum_wage', level: 2 }],
    )
    for (let t = 0; t < 12; t++) state = step(state)
    const statute = observe(state).statutes.find((s) => s.id === 'minimum_wage')!
    expect(statute.level).toBe(2)
    expect(statute.enactedAt).not.toBeNull()
    // fully phased in, so force is exactly the posted strength times what the
    // state can enforce — and a mid-century civil service enforces some of it
    expect(statute.inForce).toBeCloseTo(statute.compliance * statute.levels[2].strength, 9)
    expect(statute.inForce).toBeLessThan(statute.levels[2].strength)
    expect(statute.inForce).toBeGreaterThan(0)
  })

  it('names the blocs declining to obey, and nobody who is content', () => {
    const base = play('statutes-resist', 8)
    const angry: TrueState = {
      ...base,
      institutions: {
        ...base.institutions,
        blocs: { ...base.institutions.blocs, industrialists: { power: 1, favor: -1 } },
      },
    }
    const statute = observe(angry).statutes.find((s) => s.id === 'minimum_wage')!
    const names = statute.resistance.map((r) => r.bloc)
    expect(names).toContain('industrialists')
    // labour wants a minimum wage, so it can never appear as resistance to one
    expect(names).not.toContain('unions')
    for (const entry of statute.resistance) expect(entry.weight).toBeGreaterThan(0)
  })
})
