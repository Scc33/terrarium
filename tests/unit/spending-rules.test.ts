import { describe, expect, it } from 'vitest'
import {
  applyAction,
  init,
  IllegalActionError,
  politicalCostOfAction,
  type StatPrint,
  type TrueState,
} from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'
import { resolveSpendingRules } from '../../packages/engine/src/state/spending'

const fresh = () => init(standardCountry, 'spending-rules')
const rich = (state: TrueState): TrueState => ({
  ...state,
  politics: { ...state.politics, politicalCapital: 1e9 },
})

function point(
  forQtr: number,
  value: number,
  revision = 0,
  nominal?: number,
): StatPrint {
  return {
    forQtr,
    publishedAt: forQtr + revision + 1,
    value,
    revision,
    errorBand: 0,
    ...(nominal === undefined ? {} : { levels: { real: nominal * 0.9, nominal } }),
  }
}

function withSeries(
  state: TrueState,
  series: Partial<TrueState['stats']['series']>,
): TrueState {
  return { ...state, stats: { ...state.stats, series: { ...state.stats.series, ...series } } }
}

describe('recurring expenditure rules', () => {
  it('starts every programme on the legacy fixed-cash semantics', () => {
    const state = fresh()
    for (const programme of ['transfers', 'procurement', 'investment'] as const) {
      expect(state.gov.spendingRules[programme]).toEqual({
        kind: 'fixed',
        amount: state.gov.dials.spending[programme],
      })
    }
  })

  it('keeps legacy spending setDial actions valid and makes them fixed rules', () => {
    const state = applyAction(rich(fresh()), {
      kind: 'setDial',
      path: 'spending.transfers',
      value: 4,
    })
    expect(state.gov.dials.spending.transfers).toBe(4)
    expect(state.gov.spendingRules.transfers).toEqual({ kind: 'fixed', amount: 4 })
  })

  it('uses published nominal GDP, including its latest revision, never true GDP', () => {
    const state = rich(
      withSeries(
        { ...fresh(), flows: { ...fresh().flows, nominalGdp: 999 } },
        {
          gdp_growth: [point(3, 0, 0, 50), point(4, 0, 0, 60), point(4, 0, 1, 64)],
        },
      ),
    )
    const action = {
      kind: 'setSpendingRule',
      programme: 'investment',
      mode: 'gdpShare',
      value: 0.1,
    } as const
    const cost = politicalCostOfAction(state, action)
    const ruled = applyAction(state, action)
    expect(state.politics.politicalCapital - ruled.politics.politicalCapital).toBeCloseTo(cost)
    expect(ruled.gov.spendingRules.investment).toEqual({ kind: 'gdpShare', share: 0.1 })
    expect(ruled.gov.dials.spending.investment).toBeCloseTo(6.4)

    const newRelease = withSeries(ruled, {
      gdp_growth: [...ruled.stats.series.gdp_growth!, point(5, 0, 0, 70)],
    })
    expect(resolveSpendingRules(newRelease).gov.dials.spending.investment).toBeCloseTo(7)
  })

  it('will not quote a GDP-share rule before national accounts exist', () => {
    expect(() =>
      politicalCostOfAction(rich(fresh()), {
        kind: 'setSpendingRule',
        programme: 'procurement',
        mode: 'gdpShare',
        value: 0.05,
      }),
    ).toThrow(IllegalActionError)
  })

  it('does not reveal hidden GDP when a published-GDP rule exceeds the legal ceiling', () => {
    const state = rich(
      withSeries(
        { ...fresh(), flows: { ...fresh().flows, nominalGdp: 3.14159 } },
        { gdp_growth: [point(1, 0, 0, 100)] },
      ),
    )
    let message = ''
    try {
      politicalCostOfAction(state, {
        kind: 'setSpendingRule',
        programme: 'procurement',
        mode: 'gdpShare',
        value: 0.5,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(IllegalActionError)
      message = error instanceof Error ? error.message : ''
    }
    expect(message).toMatch(/statutory spending ceiling/)
    expect(message).not.toContain('3.14')
    expect(message).not.toContain('50.00')
  })

  it('indexes once per new first-release CPI print and ignores revisions', () => {
    const based = rich(withSeries(fresh(), { inflation: [point(2, 8)] }))
    const ruled = applyAction(based, {
      kind: 'setSpendingRule',
      programme: 'transfers',
      mode: 'indexed',
      value: 10,
    })
    expect(ruled.gov.spendingRules.transfers).toMatchObject({
      kind: 'indexed',
      amount: 10,
      lastIndexedForQtr: 2,
    })

    const releases = withSeries(ruled, {
      inflation: [point(2, 8), point(2, 40, 1), point(3, -4), point(4, 12)],
    })
    const once = resolveSpendingRules(releases)
    expect(once.gov.dials.spending.transfers).toBeCloseTo(10 * 0.99 * 1.03)
    expect(once.gov.spendingRules.transfers).toMatchObject({ lastIndexedForQtr: 4 })
    expect(resolveSpendingRules(once).gov.dials.spending.transfers).toBeCloseTo(
      once.gov.dials.spending.transfers,
    )
  })

  it('rejects non-finite, negative, and over-100-percent rules', () => {
    const state = rich(withSeries(fresh(), { gdp_growth: [point(1, 0, 0, 50)] }))
    for (const value of [Number.NaN, -0.1, 1.01]) {
      expect(() =>
        politicalCostOfAction(state, {
          kind: 'setSpendingRule',
          programme: 'transfers',
          mode: 'gdpShare',
          value,
        }),
      ).toThrow(IllegalActionError)
    }
  })
})
