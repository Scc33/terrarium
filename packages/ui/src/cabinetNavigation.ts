export const CABINET_GROUPS = [
  'TAXATION',
  'SPENDING',
  'MONEY',
  'MIGRATION',
  'SUBSIDIES',
  // The statute book: rules the government writes rather than numbers it sets
  // (ADR-0027). It sits after the levers and before state capacity because
  // that is the order of commitment — a dial is this quarter's, a statute is
  // a decade's, a ministry is a generation's.
  'STATUTES',
  'STATE CAPACITY',
  // Institutional reforms and the veto players who price them. These sit last because
  // they are the slowest things on the desk — a reform is generational, and
  // the whip count is read, not set.
  'INSTITUTIONS',
  'THE ROOM',
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
  MIGRATION: 'cabinet-tab-migration',
  SUBSIDIES: 'cabinet-tab-subsidies',
  STATUTES: 'cabinet-tab-statutes',
  'STATE CAPACITY': 'cabinet-tab-state-capacity',
  INSTITUTIONS: 'cabinet-tab-institutions',
  'THE ROOM': 'cabinet-tab-the-room',
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
