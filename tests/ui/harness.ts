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
 * CLAUDE.md instead of faked here.
 *
 * "Fully surveyed" matters: an unfunded government publishes almost nothing,
 * so the widest honest range for every instrument comes from a country that
 * built every survey and kept it.
 */

import {
  applyActions,
  createCountryParams,
  generateParams,
  init,
  step,
  type CapacityId,
  type CountryScenarioId,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import type { PublishedState } from '@terrarium/observation'

/** typed, so a renamed capacity is a build error here rather than a funding
 * call this harness silently swallows and a century that measures nothing */
const CAPACITIES: readonly CapacityId[] = ['tax', 'statistical', 'administrative', 'education']

/**
 * Play `ticks` quarters keeping every survey funded, calling `visit` with the
 * published state after each one. Frames are not retained — a century of
 * PublishedState holds every print ever made, so tests accumulate the little
 * they need instead of the harness hoarding all of it.
 */
export function eachQuarter(
  seed: string,
  ticks: number,
  visit: (pub: PublishedState, tick: number) => void,
  country?: CountryScenarioId,
): void {
  const params = country ? createCountryParams(country, seed) : generateParams(seed)
  let s: TrueState = init(params, seed)
  for (let t = 0; t < ticks; t++) {
    if (t % 8 === 0) {
      for (const target of CAPACITIES) {
        try {
          s = applyActions(s, [{ kind: 'investCapacity', target, amount: 2 }])
        } catch {
          // unaffordable this quarter; the survey simply waits
        }
      }
    }
    s = step(s)
    visit(observe(s), t)
  }
}

/** The seeds and length the presentation invariants are measured over. A
 * capacity-building country does not push the per-capita accounts past their
 * old faces until after 2006, so this must cover the whole playable century;
 * a shorter survey makes the dial-fit test pass while the late game pegs. */
export const SURVEY_SEEDS = ['ui-a', 'ui-b', 'ui-c', 'ui-d']
export const SURVEY_TICKS = 400
