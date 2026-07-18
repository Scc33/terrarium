/**
 * Step 5 — prices. Tâtonnement with a cost anchor: excess demand pulls
 * prices up, excess supply down, and prices also drift toward unit cost ×
 * markup — that second term is how a fuel tax works its way from the
 * refinery through the trucking industry into bread.
 */

import { LABOR_SHARE, NORMAL_UTILIZATION, SLACK_GAIN_RATIO } from '../constants'
import { clamp, sectorRecord } from '../math'
import { SECTOR_IDS } from '../state/schema'
import type { PipelineStep } from './pipeline'
import { effectivePrice, potentialOutput } from './derive'

export const prices: PipelineStep = {
  name: 'prices',
  run(state, rng) {
    const { market, io, flows, ledger } = state
    const { demandGain, costGain, markup, maxMovePerTick } = market.tatonnement

    const newPrices = sectorRecord((sid, j) => {
      const sector = state.sectors[j]
      const p = market.prices[sid]
      const qPot = Math.max(potentialOutput(sector), 1e-9)

      // unit cost at buyer-effective input prices (fuel tax included)
      let unitInterCost = 0
      for (let i = 0; i < SECTOR_IDS.length; i++) {
        unitInterCost += effectivePrice(state, SECTOR_IDS[i]) * io.coeff[i][j]
      }
      // unit costs are structural: computed at normal-utilization output so a
      // demand dip doesn't mechanically inflate cost-per-unit and spiral
      const q = NORMAL_UTILIZATION * qPot
      const unitLabor = (market.wages[sid] * sector.employment) / q
      const unitSubsidy = flows.subsidyDelivered[sid] / q
      // capital's required return scales with the wage bill via the factor
      // shares (VA splits LABOR_SHARE / 1−LABOR_SHARE), so full unit cost
      // covers intermediates, labor, and capital
      const unitCapital = unitLabor * ((1 - LABOR_SHARE) / LABOR_SHARE)
      const unitCost = Math.max(0.01, unitInterCost + unitLabor + unitCapital - unitSubsidy)
      const targetPrice = unitCost * (1 + markup)

      // pressure is measured against normal utilization, not full capacity —
      // an economy with ordinary headroom is price-neutral
      const gap = (market.excessDemand[sid] + (1 - NORMAL_UTILIZATION) * qPot) / qPot
      const edTerm = demandGain * (gap > 0 ? gap : SLACK_GAIN_RATIO * gap)
      const costTerm = costGain * ((targetPrice - p) / p)
      const driftTerm = 0.15 * (ledger.inflationExpectations / 4)
      const noise = rng.normal(0, 0.003)

      const move = clamp(edTerm + costTerm + driftTerm + noise, -maxMovePerTick, maxMovePerTick)
      return Math.max(0.05, p * (1 + move))
    })

    // CPI over aggregate household consumption (weights = last tick's spend)
    const totalHh = Object.values(flows.householdDemand).reduce((a, b) => a + b, 0)
    let cpiOld = 0
    let cpiNew = 0
    for (const sid of SECTOR_IDS) {
      const w = totalHh > 1e-9 ? flows.householdDemand[sid] / totalHh : 0.2
      const fuel = sid === 'energy' ? 1 + state.gov.dials.taxRates.fuel : 1
      cpiOld += w * market.prices[sid] * fuel
      cpiNew += w * newPrices[sid] * fuel
    }
    const inflationQ = cpiOld > 1e-9 ? cpiNew / cpiOld - 1 : 0

    return {
      ...state,
      market: { ...market, prices: newPrices },
      flows: { ...flows, inflationQ },
    }
  },
}
