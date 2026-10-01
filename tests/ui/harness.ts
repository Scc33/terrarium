/**
 * A fully-surveyed century, quarter by quarter — the fixture the wall's
 * presentation invariants are checked against.
 *
 * The UI tests in this directory deliberately test PURE MODULES rather than
 * rendered components. That is the repo's line (see vitest.config.ts: the
 * coverage floor measures the engine and its projection, and the UI is
 * verified in a real browser) and it is a line worth defending — the layout
 * bugs this milestone fixed were all invisible to a DOM without a layout
 * engine, so a jsdom render test would have passed while the wall clipped
 * every figure it published.
 *
 * The way to make UI behaviour testable, then, is to keep the DECISIONS out
 * of the components: which face a dial prints (`domains.ts`), how much room
 * the wall has (`wallPlan.ts`), when a revision is worth a stamp
 * (`series.ts`). Those are pure, and they are what these tests pin. Anything
 * that needs real layout gets verified in the browser and written down in
 * the terrarium-ui skill instead of faked here.
 *
 * "Fully surveyed" matters: an unfunded government publishes almost nothing,
 * so the widest honest range for every instrument comes from a country that
 * built every survey and kept it.
 */

import type { CountryScenarioId } from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import type { PublishedState } from '@terrarium/observation'
import { surveyQuarters, type SurveyArmId } from '../../packages/runner/src/survey'

export { SURVEY_ARM_IDS, type SurveyArmId } from '../../packages/runner/src/survey'

/**
 * Play `ticks` quarters under one of the survey's governments — by default
 * the capacity builder, which keeps every survey funded and touches nothing
 * else — calling `visit` with the published state after each one. Frames are
 * not retained — a century of PublishedState holds every print ever made, so
 * tests accumulate the little they need instead of the harness hoarding all
 * of it.
 */
export function eachQuarter(
  seed: string,
  ticks: number,
  visit: (pub: PublishedState, tick: number) => void,
  country?: CountryScenarioId,
  arm: SurveyArmId = 'developmental',
): void {
  surveyQuarters(seed, ticks, arm, country, (state, tick) => visit(observe(state), tick))
}

/** The seeds and length the presentation invariants are measured over. A
 * capacity-building country does not push the per-capita accounts past their
 * old faces until after 2006, so this must cover the whole playable century;
 * a shorter survey makes the dial-fit test pass while the late game pegs. */
export const SURVEY_SEEDS = ['ui-a', 'ui-b', 'ui-c', 'ui-d']
export const SURVEY_TICKS = 400
