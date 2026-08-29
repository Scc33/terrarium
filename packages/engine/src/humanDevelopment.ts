/**
 * Terrarium's Human Development Index (ADR-0033).
 *
 * It preserves HDI's three dimensions and geometric mean without claiming
 * inputs the simulation does not have: workforce skills stand in for years of
 * schooling, and annual real domestic output per head in engine units stands
 * in for PPP gross national income. Publication composes these functions over
 * aligned OFFICIAL prints in `pipeline/statistics.ts`; this module knows
 * nothing about TrueState or the observation RNG.
 */

import {
  HUMAN_DEVELOPMENT_INCOME_MAX,
  HUMAN_DEVELOPMENT_INCOME_MIN,
  HUMAN_DEVELOPMENT_LIFE_MAX,
  HUMAN_DEVELOPMENT_LIFE_MIN,
} from './constants'
import { clamp } from './math'
import type { HumanDevelopmentDimensions } from './state/schema'

export interface HumanDevelopmentInputs {
  lifeExpectancy: number
  /** Published workforce-skills reading on its 0–100 instrument scale. */
  workforceSkills: number
  /** Published annual real GDP per head, in fixed engine units. */
  realGdpPerCapita: number
}

export function humanDevelopmentDimensions(
  inputs: HumanDevelopmentInputs,
): HumanDevelopmentDimensions {
  const health = clamp(
    (inputs.lifeExpectancy - HUMAN_DEVELOPMENT_LIFE_MIN) /
      (HUMAN_DEVELOPMENT_LIFE_MAX - HUMAN_DEVELOPMENT_LIFE_MIN),
    0,
    1,
  )
  const skills = clamp(inputs.workforceSkills / 100, 0, 1)
  const income = clamp(
    (Math.log(Math.max(inputs.realGdpPerCapita, HUMAN_DEVELOPMENT_INCOME_MIN)) -
      Math.log(HUMAN_DEVELOPMENT_INCOME_MIN)) /
      (Math.log(HUMAN_DEVELOPMENT_INCOME_MAX) -
        Math.log(HUMAN_DEVELOPMENT_INCOME_MIN)),
    0,
    1,
  )
  return { health, skills, income }
}

export function humanDevelopmentIndex(dimensions: HumanDevelopmentDimensions): number {
  return Math.cbrt(dimensions.health * dimensions.skills * dimensions.income)
}
