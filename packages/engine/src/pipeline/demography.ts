/**
 * Step 1.5 — demography (§8). The century IS the transition window: a young
 * 1946 pyramid ages quarter by quarter under endogenous fertility (falls
 * with income, cities, surviving children, and a slow norms drift),
 * income-driven mortality, and migration as a pressure valve. Cohort sizes
 * are DERIVED from the pyramid here — retirees are the 60+, the working
 * classes split the rest, and the pyramid's working-age share scales
 * participation. The dividend is a window, not a gift; nobody scripts the
 * baby boom, the youth bulge, or the pension squeeze.
 *
 * Deterministic on purpose: at millions scale, births and deaths are flows,
 * not draws — no RNG substream, so demography never perturbs the fog or the
 * crisis clock.
 */

import {
  BASE_WORKER_SHARE,
  EDUCATION_1946,
  FERT_EDU_GAIN,
  FERT_INCOME_GAIN,
  FERT_MAX,
  FERT_MIN,
  FERT_SECULAR_Q,
  FERT_SURVIVAL_GAIN,
  FERT_URBAN_GAIN,
  FERTILE_YEARS,
  MIG_CAP_Q,
  MIG_GAIN,
  MORT_BASE_ANNUAL,
  MORT_FLOOR,
  MORT_INCOME_GAIN,
  MORT_SECULAR_Q,
  NATURAL_UNEMPLOYMENT,
  URBANIZATION_GAIN,
} from '../constants'
import { clamp } from '../math'
import {
  AGE_BANDS,
  FERTILE_BANDS,
  RETIREMENT_BAND,
  WORKING_BANDS,
  WORKING_CLASS_IDS,
  type Cohort,
  type DemographyState,
} from '../state/schema'
import type { PipelineStep } from './pipeline'
import { livingStandard } from './derive'

const sumBands = (p: number[], from: number, to: number) => {
  let s = 0
  for (let i = from; i <= to; i++) s += p[i]
  return s
}

/** Split the non-retired population into the working classes and set the
 * retiree class to the 60+ — the one place cohort sizes are written. */
export function classSizesFrom(
  pyramid: number[],
  classShares: DemographyState['classShares'],
  cohorts: Cohort[],
): Cohort[] {
  const retired = sumBands(pyramid, RETIREMENT_BAND, AGE_BANDS - 1)
  const nonRetired = sumBands(pyramid, 0, RETIREMENT_BAND - 1)
  return cohorts.map((c) =>
    c.id === 'retirees'
      ? { ...c, size: retired }
      : { ...c, size: nonRetired * classShares[c.id as (typeof WORKING_CLASS_IDS)[number]] },
  )
}

export const demography: PipelineStep = {
  name: 'demography',
  run(state) {
    const d = state.demography
    const p = d.pyramid
    const living = livingStandard(state)
    const lnLiving = Math.log(Math.max(living, 0.05))

    // --- vital rates respond to how life actually is ---
    const mortalityIndex = clamp(
      Math.exp(-MORT_SECULAR_Q * state.meta.tick) * (1 - MORT_INCOME_GAIN * lnLiving),
      MORT_FLOOR,
      1.3,
    )
    const urbanShare = 1 - d.classShares.rural_workers
    const tfr = clamp(
      FERT_MAX -
        FERT_INCOME_GAIN * Math.max(0, lnLiving) -
        FERT_URBAN_GAIN * Math.max(0, urbanShare - 0.5) -
        FERT_SURVIVAL_GAIN * (1 - mortalityIndex) -
        FERT_EDU_GAIN * Math.max(0, state.gov.capacity.education - EDUCATION_1946) -
        FERT_SECULAR_Q * state.meta.tick,
      FERT_MIN,
      FERT_MAX,
    )

    // --- cohort-component quarter: die, age, be born ---
    const deaths = p.map((n, i) => n * (MORT_BASE_ANNUAL[i] / 4) * mortalityIndex)
    // uniform age within a 5-year band: 1/20th graduates each quarter
    const aged = p.map((n, i) => (i < AGE_BANDS - 1 ? (n - deaths[i]) / 20 : 0))
    const women = 0.5 * sumBands(p, FERTILE_BANDS[0], FERTILE_BANDS[1])
    const births = (tfr * women) / (FERTILE_YEARS * 4)

    // --- migration: slack pushes the young out, tightness pulls them in ---
    const totalPop = sumBands(p, 0, AGE_BANDS - 1)
    const workingAge = sumBands(p, WORKING_BANDS[0], WORKING_BANDS[1])
    const netMigrationQ = clamp(
      MIG_GAIN * (NATURAL_UNEMPLOYMENT - state.flows.unemployment) * workingAge,
      -MIG_CAP_Q * totalPop,
      MIG_CAP_Q * totalPop,
    )
    // migrants are the young: spread across the fertile bands by weight
    const migBase = sumBands(p, FERTILE_BANDS[0], FERTILE_BANDS[1])

    const pyramid = p.map((n, i) => {
      let next = n - deaths[i] - aged[i]
      if (i === 0) next += births
      else next += aged[i - 1]
      if (i >= FERTILE_BANDS[0] && i <= FERTILE_BANDS[1] && migBase > 1e-9) {
        next += netMigrationQ * (p[i] / migBase)
      }
      return Math.max(0, next)
    })

    // --- class structure: the cities pull when city wages pull, and only
    // when the cities have work — a slump stops the buses ---
    const w = state.market.wages
    const wageGap = (w.manuf + w.services) / 2 / Math.max(w.agri, 1e-9) - 1
    const jobsPull = clamp(1 - 5 * (state.flows.unemployment - NATURAL_UNEMPLOYMENT), 0, 1)
    const move =
      URBANIZATION_GAIN * d.classShares.rural_workers * clamp(wageGap, 0, 1) * jobsPull
    const classShares = {
      ...d.classShares,
      rural_workers: d.classShares.rural_workers - move,
      urban_workers: d.classShares.urban_workers + move,
    }

    const nonRetired = sumBands(pyramid, 0, RETIREMENT_BAND - 1)
    const workerShareMult =
      nonRetired > 1e-9
        ? sumBands(pyramid, WORKING_BANDS[0], WORKING_BANDS[1]) / nonRetired / BASE_WORKER_SHARE
        : 1

    return {
      ...state,
      demography: { pyramid, tfr, mortalityIndex, netMigrationQ, workerShareMult, classShares },
      cohorts: classSizesFrom(pyramid, classShares, state.cohorts),
    }
  },
}
