/** Exact self-accounts. These projections add no economic behavior or surveys. */
import type { TrueState } from './schema'

export function treasuryFinancing(state: TrueState) {
  const { flows } = state
  return {
    fundFlow: flows.fundFlow,
    fiscalRebate: flows.fiscalRebate,
    bondsIssued: flows.newBondBorrowing,
    debtRepaid: flows.debtPrincipal,
    deficitPrinting: flows.printedThisQtr,
    debtMaturing: flows.debtMaturing,
    bondsRefinanced: flows.bondsRefinanced,
    debtBuybackAdjustment: flows.debtBuybackAdjustment,
  }
}

/** Copied into each completed quarter's worksheet. */
export function publicAccountRecord(state: TrueState) {
  const { gov, flows, external } = state
  return {
    ...treasuryFinancing(state),
    centralBankAssets: state.finance.centralBankAssets,
    assetPurchases: flows.assetPurchases,
    assetRunoff: flows.assetRunoff,
    yieldCurve: {
      ...state.finance.yieldCurve,
      benchmark: { ...state.finance.yieldCurve.benchmark },
      yields: { ...state.finance.yieldCurve.yields },
    },
    fxIntervention: flows.fxIntervention,
    revenue: gov.budget.revenue,
    outlays: gov.budget.outlays,
    balance: gov.budget.balance,
    debt: gov.debt,
    fund: gov.fund,
    reserves: external.reserves,
    exchangeRate: external.exchangeRate,
    revenueBySource: { ...flows.revenueBySource },
    outlaysByProgramme: { ...flows.outlaysByProgramme },
  }
}
