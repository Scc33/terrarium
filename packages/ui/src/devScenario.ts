/**
 * Dev scenarios — "start me in 1975 with a big, rich, well-surveyed country."
 *
 * The save is (params, seed, actionLog, tick) and everything else is derived by
 * replay (ADR-0001), so there is no such thing as *setting* GDP. A scenario is
 * therefore a set of **opening conditions** plus a number of quarters to run:
 * you don't set the economy, you specify a country and let it live.
 *
 * That constraint is a feature for testing. A scenario is reproducible from its
 * own description, so a bug found at 1975 is a bug anyone can reach.
 *
 * Pure on purpose — the arithmetic here decides what the dev console produces,
 * and arithmetic pushed into a component is arithmetic nobody can test.
 */

import type { CapacityId, CountryParams } from '@terrarium/engine'

/** quarters since 1946Q1 is the engine's clock; this is its human face */
export const YEAR_ZERO = 1946

export const yearOfTick = (tick: number): number => YEAR_ZERO + Math.floor(tick / 4)

export const quarterOfTick = (tick: number): number => (tick % 4) + 1

export const tickLabel = (tick: number): string => `${yearOfTick(tick)} Q${quarterOfTick(tick)}`

/** first tick of a calendar year, clamped to the playable century */
export function tickForYear(year: number, endOfHistory: number): number {
  const raw = (Math.floor(year) - YEAR_ZERO) * 4
  return Math.max(0, Math.min(endOfHistory, raw))
}

export interface DevScenario {
  seed: string
  /** calendar year to fast-forward to; 1946 means "don't run at all" */
  year: number
  /** multiplies every cohort — a bigger or smaller country */
  populationScale?: number
  /** 0..1; scales starting capital, TFP and capacities */
  development?: number
  /** trade exposure multiplier */
  openness?: number
  /** override individual starting capacity stocks (0..1) */
  capacities?: Partial<Record<CapacityId, number>>
}

export const DEFAULT_SCENARIO: DevScenario = { seed: 'dev', year: YEAR_ZERO }

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/**
 * Fold a scenario's overrides onto generated params. Only fields the scenario
 * actually names are touched, so an empty scenario is exactly `generateParams`
 * and a dev run stays a legitimate, replayable game.
 */
export function applyScenario(base: CountryParams, sc: DevScenario): CountryParams {
  const next: CountryParams = { ...base }

  if (sc.development !== undefined) next.development = clamp01(sc.development)
  if (sc.openness !== undefined) next.openness = Math.max(0, sc.openness)

  if (sc.capacities) {
    next.capacities = { ...base.capacities }
    for (const [id, v] of Object.entries(sc.capacities)) {
      if (v !== undefined) next.capacities[id as CapacityId] = clamp01(v)
    }
  }

  // population scales the cohorts AND the age pyramid together — scaling only
  // the cohorts would leave init synthesizing a pyramid that contradicts them,
  // and the demography step would spend a decade reconciling the two.
  if (sc.populationScale !== undefined && sc.populationScale > 0) {
    const k = sc.populationScale
    next.cohortSizes = { ...base.cohortSizes }
    for (const id of Object.keys(next.cohortSizes) as Array<keyof CountryParams['cohortSizes']>) {
      next.cohortSizes[id] = base.cohortSizes[id] * k
    }
    if (base.pyramid) next.pyramid = base.pyramid.map((n) => n * k)
  }

  return next
}
