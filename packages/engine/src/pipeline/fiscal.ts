/**
 * Step 3 — fiscal. Tax collection is capacity-gated: the state taxes what it
 * can see, not true GDP. Spending executes with leakage. Deficits the bond
 * market won't absorb are monetized — the printing press is not a button the
 * player pushes, it's what happens when the arithmetic fails.
 *
 * And every quarter's balance leaves this step with a destination. A deficit
 * spends the sovereign fund, then borrows, then prints; a surplus redeems debt,
 * then splits between a rebate to households and the fund, on the standing
 * order in `gov.dials.surplusPayout` (ADR-0037). The identity is asserted in
 * `tests/properties/treasury-conservation.test.ts`.
 */

import {
  BOND_MARKET_DEPTH,
  CAPACITY_DECAY_BY_ID,
  DEBT_CEILING,
  FIN_FAVOR_DEPTH,
  FUEL_EFF_BASE,
  FUEL_EFF_CAPACITY_GAIN,
  FUND_YIELD,
  LAND_FAVOR_TAX,
  TARIFF_EFF_BASE,
  TARIFF_EFF_CAPACITY_GAIN,
  taxEfficiency,
} from '../constants'
import { clamp, sumRecord } from '../math'
import {
  CAPACITY_IDS,
  SECTOR_IDS,
  type CapacityBuild,
  type OutlaySplit,
  type RevenueSplit,
} from '../state/schema'
import type { PipelineStep } from './pipeline'
import { effectiveBlocPower, financierAnger } from './derive'
import { settleBondOwnership } from './bondOwnership'
import { couponBill, issueBonds, settleDebt } from './bonds'

export const fiscal: PipelineStep = {
  name: 'fiscal',
  run(state) {
    const { gov, flows, market, io } = state
    // The veto players reach the budget through two channels a treasury
    // would recognize: an aggrieved landed interest whose harvest stops being
    // reported, and a money interest that stops turning up to the auction
    const landAnger =
      Math.max(0, -state.institutions.blocs.landowners.favor) *
      effectiveBlocPower(state, 'landowners')
    const moneyAnger = financierAnger(state)
    const eff = taxEfficiency(gov.capacity.tax) * (1 - LAND_FAVOR_TAX * landAnger)
    const tariffEff = TARIFF_EFF_BASE + TARIFF_EFF_CAPACITY_GAIN * gov.capacity.tax // customs posts are easy to man
    const fuelEff = FUEL_EFF_BASE + FUEL_EFF_CAPACITY_GAIN * gov.capacity.tax // excise at the depot, likewise

    // --- revenue ---
    const wageBase = state.sectors.reduce((s, sec) => s + market.wages[sec.id] * sec.employment, 0)
    const profitBase = SECTOR_IDS.reduce((s, sid) => s + Math.max(0, flows.profits[sid]), 0)
    // fuel excise: taxed energy purchases = intermediate use + household use
    let energyUse = flows.householdDemand.energy
    const eIdx = SECTOR_IDS.indexOf('energy')
    for (let j = 0; j < SECTOR_IDS.length; j++) {
      energyUse += io.coeff[eIdx][j] * state.sectors[j].output
    }
    const revenueBySource: RevenueSplit = {
      income: wageBase * gov.dials.taxRates.income * eff,
      corporate: profitBase * gov.dials.taxRates.corporate * eff,
      tariff: flows.tariffBase * gov.dials.taxRates.tariff * tariffEff,
      fuel: market.prices.energy * energyUse * gov.dials.taxRates.fuel * fuelEff,
      // The one line no tax office collects: the return on the sovereign fund
      // (ADR-0037), on the stock as it stood at the open of the quarter — the
      // same convention the coupon bill below is charged on. It is not gated
      // by `eff`, because there is nothing here to evade.
      fund: (gov.fund * FUND_YIELD) / 4,
    }
    const revenue = sumRecord(revenueBySource)

    // --- outlays ---
    const debtToGdp = gov.debt / Math.max(4 * flows.nominalGdp, 1e-9)
    // Existing coupons are contracts. A capital strike raises the next
    // auction's quote, then reaches this bill as debt is issued or refinanced.
    const outlaysByProgramme: OutlaySplit = {
      transfers: gov.dials.spending.transfers,
      procurement: gov.dials.spending.procurement,
      investment: gov.dials.spending.investment,
      research: gov.dials.spending.research,
      subsidies: sumRecord(gov.dials.subsidies),
      capacity: gov.pipeline.reduce((s, b) => s + b.moneyPerQtr, 0),
      interest: couponBill(gov.bonds),
    }
    const interest = outlaysByProgramme.interest
    const outlays = sumRecord(outlaysByProgramme)

    const balance = revenue - outlays

    // --- financing: savings before borrowing, bonds before the press ---
    // Every quarter's balance leaves here with a destination, and there are
    // exactly four of them (ADR-0037):
    //
    //   balance = repaid − borrowed − printed + Δfund + rebate
    //
    // Before v44 a surplus with no debt left in front of it had none: `repaid`
    // clipped to a debt stock of zero and the money was collected and assigned
    // to nothing. That is reachable in ordinary play, not an edge case — the
    // developmental baseline retires its debt at a median quarter 62 and then
    // runs a structural surplus for the rest of the century (investigation
    // 0008).
    const drawn = balance < 0 ? Math.min(-balance, gov.fund) : 0
    const deficit = Math.max(0, -balance) - drawn
    // annualize (×4) then take one quarter of it back (×0.25) — a unit
    // round trip kept explicit for readability, not two independent levers.
    /* eslint-disable @typescript-eslint/no-magic-numbers -- the 4 above is
       already ignored; 0.25 is its pair, not a second tunable */
    const bondCapacity =
      debtToGdp > DEBT_CEILING
        ? 0
        : BOND_MARKET_DEPTH * 4 * flows.nominalGdp * 0.25 * (1 - FIN_FAVOR_DEPTH * moneyAnger)
    /* eslint-enable @typescript-eslint/no-magic-numbers */
    const operatingPrinting = Math.max(0, deficit - bondCapacity)
    const borrowed = deficit - operatingPrinting
    // Refinancing replaces a claim rather than demanding new household
    // savings. Only net new borrowing consumes the auction's new-money depth.
    const settlement = settleDebt(gov.bonds, Math.max(0, balance), debtToGdp <= DEBT_CEILING,
      state.meta.tick, state.finance.yieldCurve)
    const printedThisQtr = operatingPrinting + settlement.rolloverPrinting
    const repaid = settlement.cashRepaid
    const issued = issueBonds(borrowed + settlement.refinanced,
      gov.dials.debtMaturity, state.meta.tick, state.finance.yieldCurve)
    const holders = settleBondOwnership(state, settlement, issued, borrowed)
    const bonds = [...settlement.lots, ...holders.bonds]
    const debt = bonds.reduce((sum, lot) => sum + lot.principal, 0)

    // What is left of a surplus once the bondholders have been paid. The dial
    // is a standing order over this residual only, so nothing about bond
    // financing changes at any setting: a country still carrying debt pays it
    // down first whatever the cabinet has decided about surpluses.
    const residual = settlement.residualSurplus
    // A rebate is a REFUND, so it is gated on there being something to refund:
    // income-tax receipts, not merely a wage bill. A country with the rate at
    // zero (or a tax office that collects none of it) can still run a debt-free
    // surplus out of tariffs, fuel duty and the fund's own return — and paying
    // that out in proportion to wages would be a wage-weighted dividend wearing
    // a refund's name, reaching nobody who paid for it. The residual banks
    // instead, which is the whole point: the money always has a destination.
    const rebate = revenueBySource.income > 1e-9 ? residual * gov.dials.surplusPayout : 0
    const fundFlow = residual - rebate - drawn
    const fund = Math.max(0, gov.fund + fundFlow)

    // --- Layer-2 capacity: deliveries arrive, stocks decay ---
    const capacity = { ...gov.capacity }
    const pipeline: CapacityBuild[] = []
    for (const b of gov.pipeline) {
      capacity[b.target] = capacity[b.target] + b.perQtr
      if (b.remaining > 1) pipeline.push({ ...b, remaining: b.remaining - 1 })
    }
    for (const cid of CAPACITY_IDS) {
      capacity[cid] = clamp(capacity[cid] * (1 - CAPACITY_DECAY_BY_ID[cid]), 0, 1)
    }

    return {
      ...state,
      gov: {
        ...gov,
        capacity,
        pipeline,
        budget: { revenue, outlays, balance },
        debt,
        bonds,
        fund,
        printed: gov.printed + printedThisQtr,
      },
      external: { ...state.external, bondSettlement: state.external.bondSettlement + holders.foreignSettlement },
      ledger: { ...state.ledger, debtToGdp },
      // coupons are bondholder income; redemptions go back into their
      // savings — a surplus is neither money destroyed nor a spending spree.
      // The rebate is the third of these and the only one that is income the
      // household did not previously have: `cohorts` splits it by income tax
      // paid, and it reaches demand through the ordinary consumption function.
      flows: {
        ...flows,
        revenueBySource,
        outlaysByProgramme,
        printedThisQtr,
        debtInterest: interest,
        bondInterestByHolder: holders.interest,
        bondRedemptionsByHolder: holders.redeemed,
        bondPurchasesByHolder: holders.purchases,
        debtPrincipal: repaid,
        debtMaturing: settlement.maturing,
        bondsRefinanced: settlement.refinanced,
        debtBuybackAdjustment: settlement.buybackAdjustment,
        newBondBorrowing: borrowed,
        fiscalRebate: rebate,
        fundFlow,
      },
    }
  },
}
