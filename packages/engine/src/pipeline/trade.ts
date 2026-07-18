/**
 * Step 2 — trade. Books the external flows production decided on, moves
 * reserves, depreciates the currency when they run out, and walks world
 * prices (exogenous in M1).
 */

import { DEPRECIATION_WHEN_BROKE, WORLD_PRICE_VOL } from '../constants'
import { sectorRecord } from '../math'
import { SECTOR_IDS } from '../state/schema'
import type { PipelineStep } from './pipeline'

export const trade: PipelineStep = {
  name: 'trade',
  run(state, rng) {
    const { flows, market, external } = state

    let exportsValue = 0
    let importsValue = 0 // what importers pay at the border, pre-tariff
    for (const sid of SECTOR_IDS) {
      exportsValue += market.prices[sid] * flows.exportsReal[sid]
      importsValue += external.worldPrices[sid] * external.exchangeRate * flows.importsReal[sid]
    }

    let reserves = external.reserves + exportsValue - importsValue
    let exchangeRate = external.exchangeRate
    if (reserves < 0) {
      reserves = 0
      exchangeRate *= 1 + DEPRECIATION_WHEN_BROKE // imports get dearer; that's the adjustment
    } else {
      exchangeRate *= 1 + 0.01 * rng.normal(0, 0.2) // small float wobble
    }

    const worldPrices = sectorRecord((sid) =>
      Math.max(0.2, external.worldPrices[sid] * (1 + rng.normal(0, WORLD_PRICE_VOL[sid]))),
    )

    return {
      ...state,
      external: { worldPrices, reserves, exchangeRate },
      flows: { ...flows, tariffBase: importsValue },
    }
  },
}
