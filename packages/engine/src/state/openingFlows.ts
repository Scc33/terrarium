/** Opening flow worksheet, kept separate from country calibration. */
import { BANK_DIVIDEND_Q, BANK_MARGIN, BANK_SPREAD, INIT_UNEMPLOYMENT, LABOR_SHARE,
  LOAN_LOSS_BASE_Q, POLICY_RATE_1946 } from '../constants'
import { sectorRecord } from '../math'
import { COHORT_IDS, type SectorId, type TickFlows } from './schema'
import { emptyHoldings } from '../pipeline/bondOwnership'

/** Seed the household income basis with the same margin and dividend rules
 * finance will book, so its first move is not a newly discovered expense. */
export function openingBankDistribution(credit: number) {
  const bankRetainedMargin = BANK_MARGIN * credit * (POLICY_RATE_1946 + BANK_SPREAD) / 4
  const bankDividends = BANK_DIVIDEND_Q * Math.max(0, bankRetainedMargin - LOAN_LOSS_BASE_Q * credit)
  return { bankRetainedMargin, bankDividends }
}

export function openingFlows(gross: Record<SectorId, number>, valueAdded: Record<SectorId, number>, interest0: number, gdp0: number, credit: number): TickFlows {
  return {
    privateInvestmentFunding: 0,
    businessCreditFlow: 0,
    loanWriteoffs: 0,
    ...openingBankDistribution(credit),
    bondInterestByHolder: emptyHoldings(),
    bondRedemptionsByHolder: emptyHoldings(),
    bondPurchasesByHolder: emptyHoldings(),
    finalDemand: sectorRecord(() => 0),
    grossDemand: { ...gross },
    satisfied: sectorRecord(() => 1),
    exportsReal: sectorRecord(() => 0),
    importsReal: sectorRecord(() => 0),
    profits: sectorRecord((id) => (1 - LABOR_SHARE) * valueAdded[id]),
    householdDemand: sectorRecord(() => 0),
    cohortSpend: Object.fromEntries(COHORT_IDS.map((c) => [c, 0])) as Record<
      (typeof COHORT_IDS)[number],
      number
    >,
    foodBill: { farmGate: 0, margin: 0 },
    investmentReal: 0,
    foreignDirectInvestmentReal: 0,
    foreignDirectInvestmentValue: 0,
    foreignProfitRemittances: 0,
    publicInvestmentReal: 0,
    privateDomesticDemandReal: 0,
    governmentDomesticDemandReal: 0,
    tariffBase: 0,
    currentAccount: 0,
    fxIntervention: 0,
    assetPurchases: 0,
    assetRunoff: 0,
    debtMaturing: 0,
    bondsRefinanced: 0,
    debtBuybackAdjustment: 0,
    newBondBorrowing: 0,
    subsidyDelivered: sectorRecord(() => 0),
    revenueBySource: { income: 0, corporate: 0, tariff: 0, fuel: 0, fund: 0 },
    outlaysByProgramme: {
      transfers: 0,
      procurement: 0,
      investment: 0,
      research: 0,
      subsidies: 0,
      capacity: 0,
      interest: interest0,
    },
    debtInterest: interest0,
    debtPrincipal: 0,
    fiscalRebate: 0,
    fundFlow: 0,
    nominalGdp: gdp0,
    realGdp: gdp0,
    inflationQ: 0,
    unemployment: INIT_UNEMPLOYMENT,
    printedThisQtr: 0,
  }
}
