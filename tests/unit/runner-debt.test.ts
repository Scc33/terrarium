import { MERIDIA_PARAMS, init, step } from '@terrarium/engine'
import { describe, expect, it } from 'vitest'
import { runBatch, runSummaryBatch } from '../../packages/runner/src/batch'
import {
  debtToGdp,
  firstDebtFreeQuarter,
  fiscalRatios,
} from '../../packages/runner/src/debt'
import { runOne, runSummary, trajectoryPoint } from '../../packages/runner/src/run'
import { cagr, meanAnnualInflation, meanUnemployment } from '../../packages/runner/src/metrics'

describe('runner debt diagnostics', () => {
  it('annualizes quarterly GDP and finds the first debt-free quarter', () => {
    expect(debtToGdp(120, 100)).toBe(0.3)
    expect(firstDebtFreeQuarter([
      { tick: 1, debtToGdp: 0.2 },
      { tick: 2, debtToGdp: 0 },
      { tick: 3, debtToGdp: 0.1 },
    ])).toBe(2)
  })

  it('reports post-fiscal debt instead of the cached opening ratio', () => {
    const initial = init(MERIDIA_PARAMS, 'runner-debt-current')
    const state = {
      ...initial,
      gov: { ...initial.gov, debt: 120 },
      flows: { ...initial.flows, nominalGdp: 100 },
      ledger: { ...initial.ledger, debtToGdp: 0.9 },
    }
    expect(trajectoryPoint(state, []).debtToGdp).toBe(0.3)
  })

  it('separates standing programmes, capacity, and interest', () => {
    const state = step(init(MERIDIA_PARAMS, 'runner-debt-fiscal'))
    const record = {
      ...state.stats.record[0],
      nominalGdp: 100,
      revenue: 20,
      balance: 5,
      outlaysByProgramme: {
        transfers: 2,
        procurement: 3,
        investment: 4,
        research: 1,
        subsidies: 2,
        capacity: 2,
        interest: 1,
      },
    }
    expect(fiscalRatios(record)).toEqual({
      revenue: 0.2,
      standingProgrammes: 0.12,
      capacity: 0.02,
      interest: 0.01,
      balance: 0.05,
    })
  })

  it('drops full final states from multi-run batches', () => {
    const [run] = runBatch({ runs: 1, ticks: 2, policy: 'passive' }).runs
    expect(run).not.toHaveProperty('finalState')
    expect(run.trajectory).toHaveLength(2)
  })

  it('streams the aggregate batch report without retaining trajectories or hashes', () => {
    const options = { seed: 'runner-summary', ticks: 24 }
    const detailed = runOne(options)
    const summary = runSummary(options)
    expect(summary.realGrowth).toBe(cagr(detailed))
    expect(summary.meanAnnualInflation).toBe(meanAnnualInflation(detailed))
    expect(summary.meanUnemployment).toBe(meanUnemployment(detailed))
    expect(summary.finalDebtToGdp).toBe(detailed.trajectory.at(-1)!.debtToGdp)
    expect(summary.firstDebtFreeQuarter).toBe(firstDebtFreeQuarter(detailed.trajectory))

    const [batched] = runSummaryBatch({ runs: 1, ticks: 24, policy: 'passive' }).runs
    expect(batched).not.toHaveProperty('trajectory')
    expect(batched).not.toHaveProperty('finalState')
    expect(batched).not.toHaveProperty('stateHash')
  })

  it('can skip an exact final-state hash when a diagnostic never reads it', () => {
    expect(runOne({ seed: 'runner-no-hash', ticks: 2, includeStateHash: false }))
      .not.toHaveProperty('stateHash')
  })
})
