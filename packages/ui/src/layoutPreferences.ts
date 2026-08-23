/**
 * Browser-only layout preferences. These change how much of the war room is
 * visible, never what the country does, so they live beside the wall pins in
 * localStorage rather than in a save or the game store.
 */

export const CABINET_COLLAPSED_KEY = 'terrarium:layout:cabinet-collapsed'

/** The default is the complete war room: a missing or unreadable preference
 * leaves the cabinet open, including in private-browsing modes that deny
 * storage entirely. */
export function cabinetStartsCollapsed(): boolean {
  try {
    return localStorage.getItem(CABINET_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export function rememberCabinetCollapsed(collapsed: boolean): void {
  try {
    if (collapsed) localStorage.setItem(CABINET_COLLAPSED_KEY, '1')
    else localStorage.removeItem(CABINET_COLLAPSED_KEY)
  } catch {
    /* private browsing, quota — collapse still works for this session */
  }
}
