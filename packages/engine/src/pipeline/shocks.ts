/**
 * Step 0 — shocks. The crisis clock. Rare exogenous ruptures land
 * here, at the head of the tick, so every later step lives in the shocked
 * world: an oil crisis is a jump in the world energy price (imports dear,
 * exports tempting — the tâtonnement and the I/O table do the rest, through
 * transport into bread, unscripted); a drought is a transient cut to agri
 * tfp that hiring, costs, and the queues all see. Onset makes the wire with
 * certainty — a drought is not fog, everyone can see the sky.
 */

import {
  DROUGHT_EXTRA_QTRS,
  DROUGHT_P,
  DROUGHT_SEVERITY,
  ENERGY_SHOCK_JUMP,
  ENERGY_SHOCK_P,
  POLLUTION_DROUGHT_GAIN,
  POLLUTION_DROUGHT_MAX,
} from '../constants'
import type { NewsItem, TrueState } from '../state/schema'
import type { PipelineStep } from './pipeline'

/** How much likelier a failed harvest is, given the burden the country is
 * carrying. Exactly 1 at the 1946 burden and capped, because a filthy century
 * should make drought common and never make it certain. */
export function droughtHazardMultiplier(state: TrueState): number {
  const excess = Math.max(0, state.environment.pollution - 1)
  return Math.min(1 + POLLUTION_DROUGHT_GAIN * excess, POLLUTION_DROUGHT_MAX)
}

export const shocks: PipelineStep = {
  name: 'shocks',
  run(state, rng) {
    const { external, stats } = state
    let sectors = state.sectors
    let worldPrices = external.worldPrices
    let { droughtQtrsLeft, droughtSeverity } = external.shocks
    const news: NewsItem[] = []

    // --- drought bookkeeping: run down, then the next harvest comes in ---
    if (droughtQtrsLeft > 0) {
      droughtQtrsLeft -= 1
      if (droughtQtrsLeft === 0) {
        sectors = sectors.map((s) => (s.id === 'agri' ? { ...s, tfp: s.tfp / droughtSeverity } : s))
        droughtSeverity = 1
        news.push({
          tick: state.meta.tick,
          text: 'Rains return; the provinces expect a decent harvest.',
          tone: 'good',
          kind: 'drought_ends',
        })
      }
      // The climatic half of the pollution externality (ADR-0028): a heavier
      // burden makes the rains fail more often. It multiplies the hazard and
      // reuses the ENTIRE drought response below — severity, duration, the
      // agricultural tfp cut, the wire item, the recovery — so nothing about
      // what a drought does had to be modelled twice. A country at its 1946
      // burden faces exactly the hazard it always did, which is what keeps
      // this inert for anyone who has not industrialised past their
      // inheritance.
      //
      // Note this reads the burden at the START of the quarter, because
      // `environment` runs after `production` and therefore after this step.
      // Damage from pollution not yet emitted would be the wrong way round.
    } else if (rng.next() < DROUGHT_P * droughtHazardMultiplier(state)) {
      droughtSeverity = rng.range(...DROUGHT_SEVERITY)
      droughtQtrsLeft = Math.floor(rng.range(DROUGHT_EXTRA_QTRS[0], DROUGHT_EXTRA_QTRS[1] + 1))
      sectors = sectors.map((s) => (s.id === 'agri' ? { ...s, tfp: s.tfp * droughtSeverity } : s))
      news.push({
        tick: state.meta.tick,
        text: 'Drought grips the growing provinces; the harvest is given up for lost.',
        tone: 'bad',
        kind: 'drought_begins',
      })
    }

    // --- world energy rupture: a jump the reverting walk takes years to unwind ---
    if (rng.next() < ENERGY_SHOCK_P) {
      const jump = rng.range(...ENERGY_SHOCK_JUMP)
      worldPrices = { ...worldPrices, energy: worldPrices.energy * jump }
      news.push({
        tick: state.meta.tick,
        text: 'Crisis abroad: world fuel markets are in tumult.',
        tone: 'bad',
        kind: 'fuel_shock',
      })
    }

    if (
      sectors === state.sectors &&
      worldPrices === external.worldPrices &&
      droughtQtrsLeft === external.shocks.droughtQtrsLeft
    ) {
      return state // a quiet quarter — most are
    }
    return {
      ...state,
      sectors,
      external: { ...external, worldPrices, shocks: { droughtQtrsLeft, droughtSeverity } },
      stats: news.length > 0 ? { ...stats, news: [...stats.news, ...news] } : stats,
    }
  },
}
