/**
 * Step 1.5 — demography. The century IS the transition window: a young
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
  HUMAN_CAPITAL_ADJUST_Q,
  MIG_EMIGRATION_CAP_Q,
  MIG_LABOR_GAIN,
  MIG_PERFORMANCE_GAIN_Q,
  MIG_PERFORMANCE_GAP_CAP,
  MIG_WORLD_FRONTIER_SHARE,
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
  type Cohort,
  type DemographyState,
  type TrueState,
  type WorkingClassId,
} from '../state/schema'
import type { PipelineStep } from './pipeline'
import { livingStandard, meanLogConsumption } from './derive'

const sumBands = (p: number[], from: number, to: number) => {
  let s = 0
  for (let i = from; i <= to; i++) s += p[i]
  return s
}

/** Crude birth/death rates a registrar would tally: annualized, per 1000
 * of the mid-quarter population. Shared by init and the step so the tick-0
 * state and the running economy agree on the formula. */
export function vitalRates(pyramid: number[], tfr: number, mortalityIndex: number) {
  const totalPop = sumBands(pyramid, 0, AGE_BANDS - 1)
  const totalDeaths = pyramid.reduce(
    (s, n, i) => s + n * (MORT_BASE_ANNUAL[i] / 4) * mortalityIndex,
    0,
  )
  const women = 0.5 * sumBands(pyramid, FERTILE_BANDS[0], FERTILE_BANDS[1])
  const births = (tfr * women) / (FERTILE_YEARS * 4)
  const per1000 = (flowQ: number) => (totalPop > 1e-9 ? ((flowQ * 4) / totalPop) * 1000 : 0)
  return {
    births,
    totalDeaths,
    crudeBirthRate: per1000(births),
    crudeDeathRate: per1000(totalDeaths),
  }
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
      : { ...c, size: nonRetired * classShares[c.id as WorkingClassId] },
  )
}

export interface MigrationFlow {
  /** domestic log-welfare progress minus the frontier-linked outside option */
  performanceGap: number
  /** desired flow before the cabinet's immigration ceiling, millions/quarter */
  desiredQ: number
  /** realized flow after inbound and outbound limits, millions/quarter */
  netQ: number
  /** the cabinet's maximum inward flow this quarter, millions */
  immigrationCapQ: number
}

/**
 * The migration decision, kept pure so its two asymmetric limits can be
 * tested directly. Domestic performance and the outside option both start at
 * the country's inherited 1946 welfare: migration therefore judges what this
 * government did with its inheritance rather than making a richer recipe win
 * before the first turn. The outside option then rides the global frontier,
 * while the local labor market supplies the immediate jobs signal.
 *
 * The immigration dial clips positive flows only. A closed border can refuse
 * arrivals; it cannot prevent residents from leaving a failing country.
 */
export function migrationFlow(state: TrueState): MigrationFlow {
  const p = state.demography.pyramid
  const totalPop = sumBands(p, 0, AGE_BANDS - 1)
  const workingAge = sumBands(p, WORKING_BANDS[0], WORKING_BANDS[1])
  const domesticProgress =
    state.demography.migrationBaselineWelfare === null
      ? 0
      : meanLogConsumption(state) - state.demography.migrationBaselineWelfare
  const outsideProgress =
    MIG_WORLD_FRONTIER_SHARE * Math.log(Math.max(state.tech.frontier, 1e-9))
  const performanceGap = clamp(
    domesticProgress - outsideProgress,
    -MIG_PERFORMANCE_GAP_CAP,
    MIG_PERFORMANCE_GAP_CAP,
  )
  const desiredQ =
    MIG_LABOR_GAIN * (NATURAL_UNEMPLOYMENT - state.flows.unemployment) * workingAge +
    MIG_PERFORMANCE_GAIN_Q * performanceGap * totalPop
  const immigrationCapQ = (state.gov.dials.immigrationLimit * totalPop) / 4
  const netQ =
    desiredQ >= 0
      ? Math.min(desiredQ, immigrationCapQ)
      : Math.max(desiredQ, -MIG_EMIGRATION_CAP_Q * totalPop)
  return { performanceGap, desiredQ, netQ, immigrationCapQ }
}

export const demography: PipelineStep = {
  name: 'demography',
  run(state) {
    const d = state.demography
    const p = d.pyramid
    const living = livingStandard(state)
    const lnLiving = Math.log(Math.max(living, 0.05))
    // Buildings arrive through fiscal in two years. People learn on a
    // generational clock, so the stock only closes a fraction of the gap to
    // the current school system each quarter. This happens before technology
    // so the same workforce fact prices absorption, staffing and fertility.
    const humanCapital = clamp(
      d.humanCapital +
        HUMAN_CAPITAL_ADJUST_Q * (state.gov.capacity.education - d.humanCapital),
      0,
      1,
    )

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
        FERT_EDU_GAIN * Math.max(0, humanCapital - EDUCATION_1946) -
        FERT_SECULAR_Q * state.meta.tick,
      FERT_MIN,
      FERT_MAX,
    )

    // --- cohort-component quarter: die, age, be born ---
    const deaths = p.map((n, i) => n * (MORT_BASE_ANNUAL[i] / 4) * mortalityIndex)
    // uniform age within a 5-year band: 1/20th graduates each quarter
    const aged = p.map((n, i) => (i < AGE_BANDS - 1 ? (n - deaths[i]) / 20 : 0))
    const { births, crudeBirthRate, crudeDeathRate } = vitalRates(p, tfr, mortalityIndex)

    const naturalPyramid = p.map((n, i) => {
      let next = n - deaths[i] - aged[i]
      if (i === 0) next += births
      else next += aged[i - 1]
      return Math.max(0, next)
    })

    // --- migration: relative performance sets the destination pressure;
    // policy clips arrivals, never departures ---
    const plannedNetMigrationQ = migrationFlow(state).netQ
    // Migrants are the young: spread across the fertile bands by weight. A
    // legal custom pyramid may put nobody in those bands. In that edge case
    // the model has nowhere to apply its young-adult flow, so record zero
    // rather than publish and politically price migration that never happened.
    const migBase = sumBands(p, FERTILE_BANDS[0], FERTILE_BANDS[1])
    let migrationClipped = false
    let appliedNetMigrationQ = 0
    const pyramid = naturalPyramid.map((natural, i) => {
      if (i < FERTILE_BANDS[0] || i > FERTILE_BANDS[1] || migBase <= 1e-9) return natural
      const migration = plannedNetMigrationQ * (p[i] / migBase)
      const candidate = natural + migration
      if (candidate < 0) migrationClipped = true
      const next = Math.max(0, candidate)
      appliedNetMigrationQ += next - natural
      return next
    })
    const netMigrationQ =
      migBase <= 1e-9
        ? 0
        : migrationClipped
          ? appliedNetMigrationQ
          : plannedNetMigrationQ

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
      demography: {
        ...d,
        pyramid,
        tfr,
        mortalityIndex,
        netMigrationQ,
        crudeBirthRate,
        crudeDeathRate,
        workerShareMult,
        humanCapital,
        classShares,
      },
      cohorts: classSizesFrom(pyramid, classShares, state.cohorts),
    }
  },
}
