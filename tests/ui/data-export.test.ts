import { describe, expect, it } from 'vitest'
import {
  createCountryParams,
  createSave,
  gameRules,
  init,
  step,
  type ActionLog,
  type TrueState,
} from '@terrarium/engine'
import {
  createHistoricalDataExport,
  DATA_EXPORT_FORMAT,
  DATA_EXPORT_VERSION,
  INDICATOR_IDS,
  observe,
} from '@terrarium/observation'

const SEED = 'data-export'

function played(ticks: number): { state: TrueState; actions: ActionLog } {
  const params = createCountryParams('meridia', SEED)
  const rules = gameRules({ fullInstrumentation: true })
  let state = init(params, SEED, rules)
  for (let tick = 0; tick < ticks; tick++) state = step(state)
  return { state, actions: [] }
}

describe('published historical data export', () => {
  it('files every public historical record with replay provenance', () => {
    const { state, actions } = played(12)
    const pub = observe(state)
    const save = createSave(state.params, SEED, actions, state.meta.tick, state.meta.rules)
    const record = createHistoricalDataExport(pub, save)

    expect(record.format).toBe(DATA_EXPORT_FORMAT)
    expect(record.formatVersion).toBe(DATA_EXPORT_VERSION)
    expect(record.calendar).toEqual({ firstYear: 1946, quartersPerYear: 4 })
    expect(record.run).toEqual(save)
    expect(record.records.industryReleases).toEqual(pub.industry)
    expect(record.records.treasury).toEqual(pub.books)
    expect(record.records.census).toEqual(pub.census)
    expect(record.records.policy).toEqual(pub.policy)
    expect(record.records.news).toEqual(pub.news)
    expect(record.records.corridor).toEqual(pub.corridor.trail)

    const expectedReleases = INDICATOR_IDS.reduce(
      (count, id) => count + (pub.indicators[id]?.points.length ?? 0),
      0,
    )
    expect(record.records.indicatorReleases).toHaveLength(expectedReleases)
    expect(record.records.indicatorReleases[0]).toEqual(
      expect.objectContaining({
        indicator: expect.any(String),
        label: expect.any(String),
        unit: expect.any(String),
        forQtr: expect.any(Number),
        publishedAt: expect.any(Number),
        revision: expect.any(Number),
        value: expect.any(Number),
        errorBand: expect.any(Number),
      }),
    )
  })

  it('keeps long histories out of the current snapshot and round-trips as JSON', () => {
    const { state, actions } = played(8)
    const pub = observe(state)
    const save = createSave(state.params, SEED, actions, state.meta.tick, state.meta.rules)
    const record = createHistoricalDataExport(pub, save)

    expect(record.snapshot.tick).toBe(pub.tick)
    expect(record.snapshot.corridor).toEqual({
      statePower: pub.corridor.statePower,
      societalPower: pub.corridor.societalPower,
      offset: pub.corridor.offset,
      halfWidth: pub.corridor.halfWidth,
      inCorridor: pub.corridor.inCorridor,
    })
    expect(record.snapshot).not.toHaveProperty('indicators')
    expect(record.snapshot).not.toHaveProperty('books')
    expect(record.snapshot.corridor).not.toHaveProperty('trail')
    expect(JSON.parse(JSON.stringify(record))).toEqual(record)
  })

  it('does not retain mutable references to the live desk or save', () => {
    const { state, actions } = played(8)
    const pub = observe(state)
    const save = createSave(state.params, SEED, actions, state.meta.tick, state.meta.rules)
    const record = createHistoricalDataExport(pub, save)

    pub.books[0].revenue = -1
    save.seed = 'altered-after-export'

    expect(record.records.treasury[0].revenue).not.toBe(-1)
    expect(record.run.seed).toBe(SEED)
  })
})
