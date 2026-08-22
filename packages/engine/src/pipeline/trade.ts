/**
 * Step 4 — trade. Books the external flows production decided on, moves
 * reserves, and depreciates the currency when they run out. World prices and
 * export demand are set upstream by the `world` step; this step just
 * settles the balance of payments at them.
 */

import { DEPRECIATION_WHEN_BROKE } from '../constants'
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

    // Direct investment finances the capital-goods order when it enters;
    // earnings remitted to foreign owners are the matching ongoing outflow.
    let reserves =
      external.reserves +
      exportsValue -
      importsValue +
      flows.foreignDirectInvestmentValue -
      flows.foreignProfitRemittances
    let exchangeRate = external.exchangeRate
    if (reserves < 0) {
      reserves = 0
      exchangeRate *= 1 + DEPRECIATION_WHEN_BROKE // imports get dearer; that's the adjustment
    } else {
      exchangeRate *= 1 + 0.01 * rng.normal(0, 0.2) // small float wobble
    }

    return {
      ...state,
      external: { ...external, reserves, exchangeRate },
      flows: { ...flows, tariffBase: importsValue },
    }
  },
}
