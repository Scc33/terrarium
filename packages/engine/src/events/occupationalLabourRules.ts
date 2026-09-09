/** The three labour-market readings the headline unemployment rate hides. */

import {
  NEWS_PROFESSIONAL_TIGHTNESS_AT,
  NEWS_PROFESSIONAL_UNDERUSE_AT,
  NEWS_UNEMPLOYMENT_IMPROVEMENT_AT,
  NEWS_URBAN_TRANSITION_WINDOW_Q,
  NEWS_URBAN_JOBLESS_AT,
} from '../constants'
import type { ConditionRule, EventContext } from './conditions'

/** The main desk owns the complete record lookup, so trend rules in this
 * focused table cannot quietly grow a second, positional history reader. */
type ReadPast = (context: EventContext, quarters: number) => EventContext['now']

export function occupationalLabourConditionRules(readPast: ReadPast): readonly ConditionRule[] {
  return [
    {
      // A worker with a lesser job is not jobless. Combining both readings
      // catches the school-to-work mismatch whether it has left professionals
      // idle or bumped them down a rung (ADR-0036).
      event: 'trained_workers_underused',
      cls: 'report',
      salience: 6,
      when: (c) =>
        c.now.labourMarket.professionals.jobless +
          c.now.labourMarket.professionals.underemployed >
        NEWS_PROFESSIONAL_UNDERUSE_AT,
    },
    {
      // The national headline can improve while the urban queue remains long:
      // rural work is absorbing the residual, not the cities having caught up.
      event: 'city_jobs_lag_transition',
      cls: 'report',
      salience: 6,
      when: (c) =>
        c.now.labourMarket.urban_workers.jobless > NEWS_URBAN_JOBLESS_AT &&
        readPast(c, NEWS_URBAN_TRANSITION_WINDOW_Q).unemployment - c.now.unemployment >
          NEWS_UNEMPLOYMENT_IMPROVEMENT_AT,
    },
    {
      // `jobless === 0` only says that every trained worker found SOME job.
      // The staffing demand is the needed second reading: posts still asking
      // for trained hands are a shortage, not merely high employment.
      event: 'skilled_posts_unfilled',
      cls: 'report',
      salience: 4,
      when: (c) => c.professionalTightness > NEWS_PROFESSIONAL_TIGHTNESS_AT,
    },
  ]
}
