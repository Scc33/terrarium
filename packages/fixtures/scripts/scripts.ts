import type { ActionLog } from '@terrarium/engine'

/** Named action scripts for tests and the runner. A script is just an
 * action log — the same shape as a save file's. */

export const passive: ActionLog = []

/** Load-bearing fuel-tax mechanism probe: one fuel tax, quarter 8. */
export const fuelTaxAtQ8: ActionLog = [
  { tick: 8, actions: [{ kind: 'setDial', path: 'taxRates.fuel', value: 0.5 }] },
]

/**
 * The statute book's golden probe: a competition act at quarter 8.
 *
 * A golden case that enacts nothing reviews a register that never fires, and
 * the whole point of `pnpm diff-state` is that somebody reads what moved. This
 * is the smallest script that puts a statute through its phase-in and into the
 * economy inside the 40-quarter golden window.
 */
export const competitionActAtQ8: ActionLog = [
  { tick: 8, actions: [{ kind: 'enact', statute: 'competition', level: 2 }] },
]

/** exit-criterion (b) probe: a fat farm subsidy in a low-capacity state */
export const agriSubsidyAtQ8 = (nominalGdp: number): ActionLog => [
  { tick: 8, actions: [{ kind: 'setDial', path: 'subsidies.agri', value: 0.08 * nominalGdp }] },
]

/** build the statistical office early */
export const investStatsAtQ4 = (nominalGdp: number): ActionLog => [
  { tick: 4, actions: [{ kind: 'investCapacity', target: 'statistical', amount: 0.3 * nominalGdp }] },
]

/** a UBI the tax base can't support, phased in as PC allows */
export const ubiPush = (nominalGdp: number): ActionLog => [
  { tick: 8, actions: [{ kind: 'setDial', path: 'spending.transfers', value: 0.12 * nominalGdp }] },
  { tick: 12, actions: [{ kind: 'setDial', path: 'spending.transfers', value: 0.24 * nominalGdp }] },
  { tick: 16, actions: [{ kind: 'setDial', path: 'spending.transfers', value: 0.36 * nominalGdp }] },
]

export const scripts = { passive, fuelTaxAtQ8, competitionActAtQ8 }
