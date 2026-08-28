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
  WORLD_PHASE_COOLDOWN_Q,
  WORLD_SUPPLY_WEIGHTS,
} from '../constants'
import { fileDispatch, fileIfNotRecent } from '../events/file'
import type { EventId } from '../events/ids'
import { clamp, sectorRecord } from '../math'
import {
  PARTNER_IDS,
  type NewsItem,
  type PartnerId,
  type SectorId,
  type WorldPartner,
} from '../state/schema'
import type { PipelineStep } from './pipeline'

/** Which event each partner's phase raises. The COPY lives in
 * `events/catalogue.ts` with everything else the wire says; this is only the
 * mapping from a partner's cycle to a name. */
const PARTNER_EVENTS: Record<PartnerId, { boom: EventId; slump: EventId; crisis: EventId }> = {
  commodity: {
    boom: 'world_commodity_boom',
    slump: 'world_commodity_slump',
    crisis: 'world_commodity_crisis',
  },
  manufacturing: {
    boom: 'world_manufacturing_boom',
    slump: 'world_manufacturing_slump',
    crisis: 'world_manufacturing_crisis',
  },
  financial: {
    boom: 'world_financial_boom',
    slump: 'world_financial_slump',
    crisis: 'world_financial_crisis',
  },
  regional: {
    boom: 'world_regional_boom',
    slump: 'world_regional_slump',
    crisis: 'world_regional_crisis',
  },
}

export const world: PipelineStep = {
  name: 'world',
  run(state, rng) {
    const { external } = state
    const news: NewsItem[] = []
    const push = (item: NewsItem | null) => {
      if (item) news.push(item)
    }

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
      // A crisis always files: the runner's event windows and the stability
      // harness both read `partner_crisis`, so suppressing one would silently
      // stop a foreign shock being excluded from the quiet tails.
      //
      // A boom or a slump is a threshold crossing on an AR(1), and a series
      // that wobbles across its own line files the same dispatch three times
      // in four quarters — which is noise reported as news. Those crossings
      // wait out `WORLD_PHASE_COOLDOWN_Q`; nothing downstream reads them.
      if (crisis) news.push(fileDispatch(state, PARTNER_EVENTS[p.id].crisis))
      else if (p.activity < PARTNER_BOOM_AT && a >= PARTNER_BOOM_AT)
        push(fileIfNotRecent(state, PARTNER_EVENTS[p.id].boom, WORLD_PHASE_COOLDOWN_Q))
      else if (p.activity > PARTNER_SLUMP_AT && a <= PARTNER_SLUMP_AT)
        push(fileIfNotRecent(state, PARTNER_EVENTS[p.id].slump, WORLD_PHASE_COOLDOWN_Q))
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
