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

/** The one sentence both faces below have to carry, so it is written once.
 * These books hold no standing cost of government: capacity is a stock that
 * decays for free, and the only money it ever costs is the eight-quarter build
 * an order pays for. A reader who assumes otherwise reads the ministries line
 * as a payroll the state cannot escape, which is the reading issue #168
 * arrived at from the label alone. */
const NO_STANDING_COST = 'Having a ministry costs nothing; building one does.'

/** Every exact outlay line, named. A total `Record`, so the day the engine
 * votes a new programme this file stops compiling until it has been named. */
export const OUTLAY_FACE: Record<OutlayId, { label: string; note: string }> = {
  transfers: { label: 'Transfers', note: 'Pensions and relief, paid to households. Delivery leaks through weak administration; the budget is charged in full regardless.' },
  procurement: { label: 'Procurement', note: 'The state buying goods and services from the economy.' },
  investment: { label: 'Public works', note: 'Construction that adds to the national capital stock.' },
  research: { label: 'Research', note: 'Public R&D grants. Administration and skilled staffing decide how much useful work the appropriation buys.' },
  subsidies: { label: 'Subsidies', note: 'All sector subsidies together. The per-sector split is on the control rail.' },
  capacity: { label: 'Ministries', note: `The state-capacity programmes you have ordered and are still paying for — tax administration, the statistical office, the civil service, the schools. Each order is spread over eight quarters and then stops. ${NO_STANDING_COST}` },
  interest: { label: 'Debt service', note: 'Coupons on outstanding debt, at the policy rate plus whatever premium the bond market charges you for the debt you already carry. The one line no dial reduces this quarter.' },
}

/** Seven exact outlay lines become six stable chart bands. Research and active
 * ministry construction are the common state-building bucket.
 *
 * The bucket names two programmes and, measured, almost always holds one: over
 * 400 quarters on all five curated countries the capacity baseline's band is
 * purely ministries in 99% of quarters and never once carries research, and
 * even under the adversarial policy 88% of the quarters it says anything at
 * all are one line or the other. So its note has to name both halves and say
 * which is which — a reader cannot get that from the figure — and the ledger's
 * summary prints the exact split beside the pie for the same reason (#168). */
export const OUTLAY_CHART_FACE: Record<OutlayChartId, { label: string; ink: string; note: string }> = {
  transfers: { ...OUTLAY_FACE.transfers, ink: SHARE_INKS[0] },
  procurement: { ...OUTLAY_FACE.procurement, ink: SHARE_INKS[1] },
  investment: { ...OUTLAY_FACE.investment, ink: SHARE_INKS[2] },
  subsidies: { ...OUTLAY_FACE.subsidies, ink: SHARE_INKS[3] },
  state_building: {
    label: 'Research & ministries',
    ink: SHARE_INKS[4],
    note: `Two exact lines drawn as one band, because the pie carries six inks and the books keep seven programmes. RESEARCH is the grant appropriation you voted. MINISTRIES is what the state-capacity programmes still building cost this quarter — eight quarters per order, then nothing. ${NO_STANDING_COST}`,
  },
  interest: { ...OUTLAY_FACE.interest, ink: SHARE_INKS[5] },
}
