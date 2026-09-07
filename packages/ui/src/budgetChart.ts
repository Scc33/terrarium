/**
 * The treasury now has seven exact outlay lines, but a seven-colour pie is not
 * readable in the dossier register. Preserve every book entry in PublishedState
 * and combine the two state-building programmes only for chart geometry.
 *
 * The printed faces live here too, beside the bucketing, because two panels
 * now draw the same budget in two denominators — the ledger in money, the
 * expenditure accounts as a share of output — and a programme that changed
 * colour between them would read as a different programme.
 */

import type { OutlayId, OutlaySplit } from '@terrarium/observation'
import { SHARE_INKS } from './shares'

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

/** Every exact outlay line, named. A total `Record`, so the day the engine
 * votes a new programme this file stops compiling until it has been named. */
export const OUTLAY_FACE: Record<OutlayId, { label: string; note: string }> = {
  transfers: { label: 'Transfers', note: 'Pensions and relief, paid to households. Delivery leaks through weak administration; the budget is charged in full regardless.' },
  procurement: { label: 'Procurement', note: 'The state buying goods and services from the economy.' },
  investment: { label: 'Public works', note: 'Construction that adds to the national capital stock.' },
  research: { label: 'Research', note: 'Public R&D grants. Administration and skilled staffing decide how much useful work the appropriation buys.' },
  subsidies: { label: 'Subsidies', note: 'All sector subsidies together. The per-sector split is on the control rail.' },
  capacity: { label: 'Ministries', note: 'Capacity programmes still building — tax administration, the statistical office, the civil service, the schools. Voted for years at a time.' },
  interest: { label: 'Debt service', note: 'Coupons on outstanding debt, at the policy rate plus whatever premium the bond market charges you for the debt you already carry. The one line no dial reduces this quarter.' },
}

/** Seven exact outlay lines become six stable chart bands. Research and active
 * ministry construction are the common state-building bucket; the ledger's
 * summary still prints research on its own line. */
export const OUTLAY_CHART_FACE: Record<OutlayChartId, { label: string; ink: string; note: string }> = {
  transfers: { ...OUTLAY_FACE.transfers, ink: SHARE_INKS[0] },
  procurement: { ...OUTLAY_FACE.procurement, ink: SHARE_INKS[1] },
  investment: { ...OUTLAY_FACE.investment, ink: SHARE_INKS[2] },
  subsidies: { ...OUTLAY_FACE.subsidies, ink: SHARE_INKS[3] },
  state_building: {
    label: 'Research & ministries',
    ink: SHARE_INKS[4],
    note: `${OUTLAY_FACE.research.note} ${OUTLAY_FACE.capacity.note}`,
  },
  interest: { ...OUTLAY_FACE.interest, ink: SHARE_INKS[5] },
}
