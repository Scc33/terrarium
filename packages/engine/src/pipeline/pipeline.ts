/**
 * The tick is an ordered fold over pipeline steps (§4). Order is explicit
 * and versioned — reordering is a schema-version event. Steps communicate
 * only through state; each gets its own RNG substream keyed by
 * (seed, step name, tick), so adding a draw in one step never shifts
 * another step's sequence.
 */

import { rngFor, type Rng } from '../rng/rng'
import type { TrueState } from '../state/schema'

export interface PipelineStep {
  name: string // doubles as the RNG substream label
  run(s: TrueState, rng: Rng): TrueState
}

import { shocks } from './shocks'
import { demography } from './demography'
import { technology } from './technology'
import { world } from './world'
import { production } from './production'
import { trade } from './trade'
import { fiscal } from './fiscal'
import { monetary } from './monetary'
import { prices } from './prices'
import { labor } from './labor'
import { cohorts } from './cohorts'
import { statistics } from './statistics'
import { politics } from './politics'

export const TICK_ORDER: PipelineStep[] = [
  shocks, // the crisis clock: ruptures land before anyone works — schema v4
  demography, // the pyramid ages; cohort sizes are derived from it — schema v6
  technology, // the frontier advances; attainment chases it — schema v7
  world, // partner cycles set export demand and world prices — schema v9
  production, // output given prices, capital, labor, I/O table
  trade, // books external flows, reserves, exchange rate
  fiscal, // capacity-gated collection; spending with leakage; the press
  monetary, // expectations adapt; printing feeds them
  prices, // tâtonnement with cost anchor
  labor, // employment, wages, capital accumulation
  cohorts, // incomes, savings, approval drifts toward experienced truth
  statistics, // the office measures, publishes, revises — schema v3
  politics, // PC accrual from PUBLISHED numbers, elections every 16 ticks
]

export function runTick(state: TrueState): TrueState {
  let s = state
  for (const step of TICK_ORDER) {
    s = step.run(s, rngFor(s.meta.seed, step.name, s.meta.tick))
  }
  return { ...s, meta: { ...s.meta, tick: s.meta.tick + 1 } }
}
