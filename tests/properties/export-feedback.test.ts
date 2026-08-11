import { describe, expect, it } from 'vitest'
import { END_OF_HISTORY_TICK, MERIDIA_PARAMS } from '@terrarium/engine'
import {
  analyzeExportFeedback,
  runExportFeedbackExperiment,
} from '../../packages/runner/src/export-feedback'
import { runOne } from '../../packages/runner/src/run'

describe('export-demand household-feedback experiment', () => {
  it('keeps its untreated path exactly equivalent to the engine runner', () => {
    const seed = 'export-feedback-equivalence'
    const ticks = 48
    const experiment = runExportFeedbackExperiment({ seed, ticks, params: MERIDIA_PARAMS })
    const baseline = runOne({ seed, ticks, params: MERIDIA_PARAMS })

    expect(experiment.normal.stateHash).toBe(baseline.stateHash)
    expect(experiment.normal.trajectory).toEqual(baseline.trajectory)
  })

  it('blocks only lagged household inputs, leaving the first direct export response intact', () => {
    const experiment = runExportFeedbackExperiment({
      seed: 'export-feedback-first-quarter',
      ticks: 1,
      params: { ...MERIDIA_PARAMS, openness: 1.55 },
    })

    expect(experiment.habitClamped.stateHash).toBe(experiment.normal.stateHash)
    expect(experiment.householdClamped.stateHash).toBe(experiment.normal.stateHash)
    expect(experiment.neutralExports.stateHash).not.toBe(experiment.normal.stateHash)
  })

  it('retains a runnable quiet-quarter response experiment through 2050', () => {
    const params = { ...MERIDIA_PARAMS, openness: 1.55 }
    const experiments = Array.from({ length: 4 }, (_, index) =>
      runExportFeedbackExperiment({
        seed: `export-feedback-property-${index}`,
        ticks: END_OF_HISTORY_TICK,
        params,
      }),
    )
    const future = analyzeExportFeedback(experiments).eras.find(
      (entry) => entry.era.id === 'future',
    )!

    expect(future.quietObservations).toBeGreaterThan(100)
    expect(future.contractionOnsets).toBeGreaterThan(4)
    expect(future.contractionCutoff).toBeLessThan(0)
    for (const horizon of future.horizons) {
      expect(horizon.observations).toBeGreaterThan(0)
      expect(horizon.totalExportEffect.count).toBe(horizon.observations)
      expect(Number.isFinite(horizon.householdFeedbackEffect.p50)).toBe(true)
    }
  })
})
