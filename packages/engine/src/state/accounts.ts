/** Exact self-accounts. These projections add no economic behavior or surveys. */
import type { TrueState } from './schema'

export function treasuryFinancing(state: TrueState) {
  const { gov, flows } = state
  const drawn = Math.max(0, -flows.fundFlow)
  return {
    fundFlow: flows.fundFlow,
    fiscalRebate: flows.fiscalRebate,
    bondsIssued: Math.max(0, -gov.budget.balance - drawn - flows.printedThisQtr),
    debtRepaid: flows.debtPrincipal,
    deficitPrinting: flows.printedThisQtr,
  }
}

/** Copied into each completed quarter's worksheet. */
export function publicAccountRecord(state: TrueState) {
  const { gov, flows, external } = state
  return {
    ...treasuryFinancing(state),
    centralBankAssets: state.finance.centralBankAssets,
    assetPurchases: flows.assetPurchases,
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
