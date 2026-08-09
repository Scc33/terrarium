/**
 * The treasury now has seven exact outlay lines, but a seven-colour pie is not
 * readable in the dossier register. Preserve every book entry in PublishedState
 * and combine the two state-building programmes only for chart geometry.
 */

import type { OutlaySplit } from '@terrarium/observation'

export const OUTLAY_CHART_IDS = [
  'transfers',
  'procurement',
  'investment',
  'subsidies',
  'state_building',
  'interest',
] as const

export type OutlayChartId = (typeof OUTLAY_CHART_IDS)[number]
export type OutlayChartValues = Record<OutlayChartId, number>

/** Bucket research and ministry construction into one stable sixth-or-fewer
 * chart category. The exact research line remains visible in the ledger
 * summary and in the underlying books. */
export function outlayChartValues(outlays: OutlaySplit): OutlayChartValues {
  return {
    transfers: outlays.transfers,
    procurement: outlays.procurement,
    investment: outlays.investment,
    subsidies: outlays.subsidies,
    state_building: outlays.research + outlays.capacity,
    interest: outlays.interest,
  }
}
