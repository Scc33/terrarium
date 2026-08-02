export const CABINET_GROUPS = [
  'TAXATION',
  'SPENDING',
  'MONEY',
  'SUBSIDIES',
  'STATE CAPACITY',
] as const

export type CabinetGroup = (typeof CABINET_GROUPS)[number]
export type CabinetNavigationKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End'

export const CABINET_NAVIGATION_KEYS: readonly CabinetNavigationKey[] = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]

const TAB_IDS: Record<CabinetGroup, string> = {
  TAXATION: 'cabinet-tab-taxation',
  SPENDING: 'cabinet-tab-spending',
  MONEY: 'cabinet-tab-money',
  SUBSIDIES: 'cabinet-tab-subsidies',
  'STATE CAPACITY': 'cabinet-tab-state-capacity',
}

export const CABINET_PANEL_ID = 'cabinet-tabpanel'

export function cabinetTabId(group: CabinetGroup): string {
  return TAB_IDS[group]
}

/** Roving tab order for the cabinet's wrapped visual grid. Arrow keys follow
 * reading order, Home/End jump to the edges, and movement wraps. */
export function cabinetGroupForKey(
  current: CabinetGroup,
  key: CabinetNavigationKey,
): CabinetGroup {
  if (key === 'Home') return CABINET_GROUPS[0]
  if (key === 'End') return CABINET_GROUPS[CABINET_GROUPS.length - 1]
  const direction = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1
  const currentIndex = CABINET_GROUPS.indexOf(current)
  return CABINET_GROUPS[(currentIndex + direction + CABINET_GROUPS.length) % CABINET_GROUPS.length]
}
