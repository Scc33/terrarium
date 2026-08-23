/**
 * Step — the environment. What production costs outside the market (ADR-0028).
 *
 * Runs directly after `production`, because that is where output exists. It
 * computes this quarter's emissions and moves the burden toward them, and it
 * does nothing else: **no step reads the burden here.** The damage arrives in
 * two places that were already running — the mortality schedule in
 * `demography`, and the drought hazard in `shocks` — because "pollution
 * reduces GDP" is exactly the hand-authored effect arrow this engine exists to
 * refuse.
 *
 * Both of those steps run EARLIER in the tick than this one, which is correct
 * rather than a bug: they read the burden accumulated up to the start of the
 * quarter, and this step then adds the quarter's own emissions to it. Damage
 * from pollution you have not emitted yet would be the wrong way round.
 *
 * The burden is per head, not absolute. Land and area are not modelled, so an
 * absolute tonnage would make a big country dirtier than a small one purely by
 * being big, and nothing that reads this cares about total output — mortality
 * responds to what people breathe. Per head, the index follows income and
 * industrial structure, which is the environmental Kuznets shape and is
 * arrived at rather than written down.
 */

import {
  EMISSION_INTENSITY,
  EMISSION_TECH_GAIN,
  POLLUTION_ADJUST,
  POLLUTION_REFERENCE,
} from '../constants'
import { SECTOR_IDS, type TrueState } from '../state/schema'
import type { PipelineStep } from './pipeline'
import { statuteForce } from './derive'

/**
 * Emissions per head this quarter, in burden units.
 *
 * Shared with `init`, which seeds the stock at exactly this value so a run
 * does not open with a spurious ramp while the burden finds its level. That
 * sharing is the whole reason it is a function rather than inline arithmetic:
 * a seed and a step that computed emissions differently would put every
 * country's first two decades on a trend nobody chose.
 */
export function emissionsPerHead(state: TrueState, abatement = 0): number {
  const population = state.demography.pyramid.reduce((sum, people) => sum + people, 0)
  if (population <= 1e-9) return 0
  let dirty = 0
  for (const sid of SECTOR_IDS) {
    const sector = state.sectors.find((x) => x.id === sid)
    if (!sector) continue
    // a better technique is a cleaner one
    const technique = Math.pow(Math.max(state.tech.attained[sid], 1e-6), EMISSION_TECH_GAIN)
    dirty += (EMISSION_INTENSITY[sid] * Math.max(sector.output, 0)) / technique
  }
  return ((dirty / population) * (1 - abatement)) / POLLUTION_REFERENCE
}

export const environment: PipelineStep = {
  name: 'environment',
  run(state) {
    // The emissions standard's one fact: how much of the dirt is caught before
    // it leaves the chimney. Its other reader is the unit cost in `prices`,
    // because the equipment that catches it is not free.
    const abatement = statuteForce(state, 'emissions_standard')
    const emissionsQ = emissionsPerHead(state, abatement)
    const pollution =
      state.environment.pollution +
      POLLUTION_ADJUST * (emissionsQ - state.environment.pollution)
    // `baseline` is an init-time inheritance and never moves
    return { ...state, environment: { ...state.environment, pollution, emissionsQ } }
  },
}
