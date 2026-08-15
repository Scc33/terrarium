/** Pure fiscal diagnostics shared by the batch report and investigation tools. */

import type { StatRecord } from '@terrarium/engine'

export const DEBT_FREE_RATIO = 1e-9

/** Public debt is a stock; quarterly nominal GDP must be annualized. */
export function debtToGdp(debt: number, quarterlyNominalGdp: number): number {
  return debt / Math.max(4 * quarterlyNominalGdp, 1e-9)
}

export function firstDebtFreeQuarter(
  trajectory: readonly { tick: number; debtToGdp: number }[],
): number | null {
  return trajectory.find((point) => point.debtToGdp <= DEBT_FREE_RATIO)?.tick ?? null
}

export interface FiscalRatios {
  revenue: number
  standingProgrammes: number
  capacity: number
  interest: number
  balance: number
}

export function standingProgrammeOutlays(record: StatRecord): number {
  const programmes = record.outlaysByProgramme
  return (
    programmes.transfers +
    programmes.procurement +
    programmes.investment +
    programmes.research +
    programmes.subsidies
  )
}

/** Shares of quarterly GDP. Debt/GDP itself uses an annualized denominator. */
export function fiscalRatios(record: StatRecord): FiscalRatios {
  const gdp = Math.max(record.nominalGdp, 1e-9)
  const programmes = record.outlaysByProgramme
  return {
    revenue: record.revenue / gdp,
    standingProgrammes: standingProgrammeOutlays(record) / gdp,
    capacity: programmes.capacity / gdp,
    interest: programmes.interest / gdp,
    balance: record.balance / gdp,
  }
}
