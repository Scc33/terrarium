/**
 * Step 2.5 — the rest of world. Four abstract trading partners, each an
 * economy with its own business cycle, advance one quarter. Their strength
 * sets two things the domestic economy then lives inside:
 *   • how much of your exports they buy (a partner in recession buys less);
 *   • the world price of what they supply (a supplier's boom is cheap goods,
 *     its collapse a shortage) — so world prices are now semi-endogenous,
 *     not an exogenous walk.
 * Foreign conditions are not fogged the way domestic surveys are — a
 * government reads the foreign papers — so booms, slumps, and sudden stops
 * make the wire with certainty.
 *
 * The world-price walk lives here now (it used to be in `trade`): the shock
 * step's oil rupture is still an initial condition this walk unwinds, and
 * mean reversion keeps a partner's cycle a cycle rather than a ratchet.
 */

import {
  EXPORT_DEMAND_WEIGHTS,
  PARTNER_ACTIVITY_MAX,
  PARTNER_ACTIVITY_MIN,
  PARTNER_BOOM_AT,
  PARTNER_CYCLE,
  PARTNER_SLUMP_AT,
  WORLD_PRICE_REVERT,
  WORLD_PRICE_VOL,
  WORLD_SUPPLY_PRICE_GAIN,
  WORLD_SUPPLY_WEIGHTS,
} from '../constants'
import { clamp, sectorRecord } from '../math'
import {
  PARTNER_IDS,
  type NewsItem,
  type PartnerId,
  type SectorId,
  type WorldPartner,
} from '../state/schema'
import type { PipelineStep } from './pipeline'

const NEWS: Record<PartnerId, { boom: string; slump: string; crisis: string }> = {
  commodity: {
    boom: 'The commodity exporters are flush; raw-material prices ease worldwide.',
    slump: 'The commodity bloc cuts output; raw materials grow scarce and dear.',
    crisis: 'A commodity crash abroad: exporting nations slash output overnight.',
  },
  manufacturing: {
    boom: 'The manufacturing giant floods world markets with cheap goods.',
    slump: 'The great workshop idles; foreign demand for your goods softens.',
    crisis: 'The manufacturing giant seizes up; global supply chains snarl.',
  },
  financial: {
    boom: 'Easy money in the financial centres; foreign lending flows freely.',
    slump: 'The money centres turn cautious; foreign credit tightens.',
    crisis: 'A sudden stop: the world’s money centres freeze, lending dries up.',
  },
  regional: {
    boom: 'The regional economy is booming; your neighbours are buying.',
    slump: 'Recession spreads across the region; neighbours pull in their belts.',
    crisis: 'The regional economy collapses into crisis, and it is next door.',
  },
}

export const world: PipelineStep = {
  name: 'world',
  run(state, rng) {
    const { external } = state
    const news: NewsItem[] = []

    // --- advance each partner's cycle (AR(1) toward 1, with rare crises) ---
    const partners: WorldPartner[] = external.world.partners.map((p) => {
      const c = PARTNER_CYCLE[p.id]
      let a = 1 + c.drift + c.persistence * (p.activity - 1) + c.vol * rng.normal(0, 1)
      let crisis = false
      if (rng.next() < c.crisisProb) {
        a -= c.crisisDepth
        crisis = true
      }
      a = clamp(a, PARTNER_ACTIVITY_MIN, PARTNER_ACTIVITY_MAX)
      // foreign news: crises always, booms/slumps only as they cross the line
      if (crisis) news.push({ tick: state.meta.tick, text: NEWS[p.id].crisis, tone: 'bad' })
      else if (p.activity < PARTNER_BOOM_AT && a >= PARTNER_BOOM_AT)
        news.push({ tick: state.meta.tick, text: NEWS[p.id].boom, tone: 'good' })
      else if (p.activity > PARTNER_SLUMP_AT && a <= PARTNER_SLUMP_AT)
        news.push({ tick: state.meta.tick, text: NEWS[p.id].slump, tone: 'bad' })
      return { id: p.id, activity: a }
    })
    const activity = Object.fromEntries(partners.map((p) => [p.id, p.activity])) as Record<
      PartnerId,
      number
    >

    // --- export demand: how strong are the partners who buy each sector ---
    const exportDemand = sectorRecord((sid: SectorId) => {
      const w = EXPORT_DEMAND_WEIGHTS[sid]
      let sum = 0
      let wsum = 0
      for (const id of PARTNER_IDS) {
        const wt = w[id] ?? 0
        sum += wt * activity[id]
        wsum += wt
      }
      return wsum > 0 ? sum / wsum : 1
    })

    // --- world prices: reversion + supplier pressure + a little vol ---
    const worldPrices = sectorRecord((sid: SectorId) => {
      const p = external.worldPrices[sid]
      const sup = WORLD_SUPPLY_WEIGHTS[sid]
      let pressure = 0
      for (const id of PARTNER_IDS) pressure += (sup[id] ?? 0) * (activity[id] - 1)
      const move =
        WORLD_PRICE_REVERT * (1 - p) -
        WORLD_SUPPLY_PRICE_GAIN * pressure +
        rng.normal(0, WORLD_PRICE_VOL[sid])
      return clamp(p * (1 + move), 0.2, 8)
    })

    return {
      ...state,
      external: { ...external, worldPrices, world: { partners, exportDemand } },
      stats: news.length > 0 ? { ...state.stats, news: [...state.stats.news, ...news] } : state.stats,
    }
  },
}
