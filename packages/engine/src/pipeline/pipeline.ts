/**
 * The tick is an ordered fold over pipeline steps (§4). Order is explicit
 * and versioned — reordering is a schema-version event. Steps communicate
 * only through state; each gets its own RNG substream keyed by
 * (seed, step name, tick), so adding a draw in one step never shifts
 * another step's sequence.
 */

import { rngFor, type Rng } from '../rng/rng'
import type { TrueState } from '../state/schema'
import { resolveSpendingRules } from '../state/spending'

export interface PipelineStep {
  name: string // doubles as the RNG substream label
  run(s: TrueState, rng: Rng): TrueState
}

import { shocks } from './shocks'
import { demography } from './demography'
import { technology } from './technology'
import { world } from './world'
import { finance } from './finance'
import { foreignInvestment } from './foreignInvestment'
import { production } from './production'
import { environment } from './environment'
import { trade } from './trade'
import { fiscal } from './fiscal'
import { monetary } from './monetary'
import { prices } from './prices'
import { labor } from './labor'
import { cohorts } from './cohorts'
import { institutions } from './institutions'
import { statistics } from './statistics'
import { politics } from './politics'

export const TICK_ORDER: PipelineStep[] = [
  shocks, // the crisis clock: ruptures land before anyone works — schema v4
  demography, // the pyramid ages; cohort sizes are derived from it — schema v6
  technology, // the frontier advances; attainment chases it — schema v7
  world, // partner cycles set export demand and world prices — schema v9
  finance, // credit, asset prices, banking crises — the fragility clock — schema v10
  foreignInvestment, // inward productive capital and its foreign ownership — schema v23
  production, // output given prices, capital, labor, I/O table
  environment, // emissions from that output; the burden that damages elsewhere — schema v34
  trade, // books external flows, reserves, exchange rate
  fiscal, // capacity-gated collection; spending with leakage; the press
  monetary, // expectations adapt; printing feeds them
  prices, // tâtonnement with cost anchor
  labor, // employment, wages, capital accumulation
  cohorts, // incomes, savings, approval drifts toward experienced truth
  institutions, // societal power, the veto players, revolutionary pressure — schema v11
  statistics, // the office measures, publishes, revises — schema v3
  politics, // PC accrual from PUBLISHED numbers, elections, revolt and coup
]

export function runTick(state: TrueState): TrueState {
  let s = state
  for (const step of TICK_ORDER) {
    s = step.run(s, rngFor(s.meta.seed, step.name, s.meta.tick))
  }
  // The statistics step may just have put a new CPI or GDP release on the
  // desk. Resolve standing appropriations now so the published dials and the
  // next quarter agree. This is preparation around the existing fold, not a
  // new pipeline step: the economic order and every RNG substream are intact.
  s = resolveSpendingRules(s)
  return { ...s, meta: { ...s.meta, tick: s.meta.tick + 1 } }
}
