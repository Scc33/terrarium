/**
 * Step 3.75 — foreign direct investment. Direct investors build productive
 * capital rather than buying a liquid claim, so the flow is sticky and enters
 * the ordinary investment order book. Attraction is systemic: small-country
 * scale, trade access, catch-up room, administration, returns, confidence and
 * the foreign cycle all matter. The accumulated foreign-owned stock later
 * earns remitted profits; this is capital with a balance-of-payments cost, not
 * a free openness bonus.
 */

import {
  adminEffectiveness,
  CONF_NEUTRAL,
  FDI_BASE_ANNUAL_GDP_SHARE,
  FDI_CATCHUP_FLOOR,
  FDI_CATCHUP_GAIN,
  FDI_CONFIDENCE_GAIN,
  FDI_CRISIS_MULTIPLIER,
  FDI_EXPORT_GAIN,
  FDI_NORMAL_AFTER_TAX_PROFIT_SHARE,
  FDI_OWNERSHIP_SATURATION,
  FDI_PRICE_INSTABILITY_AT,
  FDI_PRICE_INSTABILITY_DRAG,
  FDI_RETURN_GAIN,
  fdiStructuralAttraction,
  taxEfficiency,
} from '../constants'
import { clamp } from '../math'
import { SECTOR_IDS } from '../state/schema'
import type { PipelineStep } from './pipeline'
import { technologyAttainment } from './derive'

export const foreignInvestment: PipelineStep = {
  name: 'foreignInvestment',
  run(state) {
    const { external, finance, flows, gov, market } = state
    const population = state.demography.pyramid.reduce((sum, people) => sum + people, 0)
    const capital = state.sectors.reduce((sum, sector) => sum + sector.capital, 0)
    const foreignOwnership = external.foreignOwnedCapital / Math.max(capital, 1e-9)
    const saturation = clamp(1 - foreignOwnership / FDI_OWNERSHIP_SATURATION, 0, 1)

    const nominalGdp = Math.max(flows.nominalGdp, 1e-9)
    const positiveProfits = SECTOR_IDS.reduce(
      (sum, id) => sum + Math.max(0, flows.profits[id]),
      0,
    )
    const corporateTax = gov.dials.taxRates.corporate * taxEfficiency(gov.capacity.tax)
    const afterTaxProfitShare = (positiveProfits * (1 - corporateTax)) / nominalGdp
    const returnFactor = clamp(
      1 + FDI_RETURN_GAIN * (afterTaxProfitShare - FDI_NORMAL_AFTER_TAX_PROFIT_SHARE),
      0.45,
      1.6,
    )

    const exportsValue = SECTOR_IDS.reduce(
      (sum, id) => sum + market.prices[id] * flows.exportsReal[id],
      0,
    )
    const exportShare = exportsValue / nominalGdp
    const exportFactor = clamp(1 + FDI_EXPORT_GAIN * (exportShare - 0.15), 0.7, 1.5)
    const confidenceFactor = clamp(
      1 + FDI_CONFIDENCE_GAIN * (state.ledger.confidence.business - CONF_NEUTRAL),
      0.5,
      1.4,
    )
    const priceInstability = Math.max(
      0,
      Math.abs(flows.inflationQ * 4) - FDI_PRICE_INSTABILITY_AT,
    )
    const macroStabilityFactor = clamp(
      1 - FDI_PRICE_INSTABILITY_DRAG * priceInstability,
      0.15,
      1,
    )
    const catchUpFactor = clamp(
      FDI_CATCHUP_FLOOR + FDI_CATCHUP_GAIN * (1 - technologyAttainment(state)),
      0.5,
      1.25,
    )
    const administrativeFactor = 0.5 + 0.5 * adminEffectiveness(gov.capacity.administrative)
    const tariffFactor = clamp(1 - 0.6 * gov.dials.taxRates.tariff, 0.4, 1)

    const activity = (id: 'financial' | 'manufacturing' | 'regional') =>
      external.world.partners.find((partner) => partner.id === id)?.activity ?? 1
    const foreignCycle = clamp(
      0.5 * activity('financial') +
        0.3 * activity('manufacturing') +
        0.2 * activity('regional'),
      0.35,
      1.5,
    )
    const crisisFactor = finance.crisisQtrsLeft > 0 ? FDI_CRISIS_MULTIPLIER : 1
    const structural = fdiStructuralAttraction(
      population,
      state.params.development,
      state.params.openness,
    )

    const foreignDirectInvestmentValue =
      nominalGdp *
      FDI_BASE_ANNUAL_GDP_SHARE *
      structural *
      catchUpFactor *
      administrativeFactor *
      returnFactor *
      exportFactor *
      confidenceFactor *
      macroStabilityFactor *
      tariffFactor *
      foreignCycle *
      crisisFactor *
      saturation
    const capitalGoodsPrice = (market.prices.manuf + market.prices.services) / 2
    const foreignDirectInvestmentReal =
      foreignDirectInvestmentValue / Math.max(capitalGoodsPrice, 1e-9)

    return {
      ...state,
      flows: {
        ...flows,
        foreignDirectInvestmentReal,
        foreignDirectInvestmentValue,
      },
    }
  },
}
