import { describe, expect, it } from 'vitest'
import {
  CABINET_PANEL_ID,
  cabinetGroupForKey,
  cabinetTabId,
} from '../../packages/ui/src/cabinetNavigation'

describe('cabinet navigation', () => {
  it('moves through the visual reading order and wraps', () => {
    expect(cabinetGroupForKey('TAXATION', 'ArrowRight')).toBe('SPENDING')
    expect(cabinetGroupForKey('SPENDING', 'ArrowDown')).toBe('MONEY')
    expect(cabinetGroupForKey('MONEY', 'ArrowRight')).toBe('MIGRATION')
    expect(cabinetGroupForKey('STATE CAPACITY', 'ArrowRight')).toBe('INSTITUTIONS')
    // the cabinet wraps, so the ends meet — the last two groups are adjacent
    expect(cabinetGroupForKey('TAXATION', 'ArrowLeft')).toBe('THE ROOM')
    expect(cabinetGroupForKey('THE ROOM', 'ArrowRight')).toBe('TAXATION')
  })

  it('supports edge jumps and stable aria ids', () => {
    expect(cabinetGroupForKey('MONEY', 'Home')).toBe('TAXATION')
    expect(cabinetGroupForKey('MONEY', 'End')).toBe('THE ROOM')
    expect(cabinetTabId('STATE CAPACITY')).toBe('cabinet-tab-state-capacity')
    expect(cabinetTabId('MIGRATION')).toBe('cabinet-tab-migration')
    expect(cabinetTabId('INSTITUTIONS')).toBe('cabinet-tab-institutions')
    expect(CABINET_PANEL_ID).toBe('cabinet-tabpanel')
  })
})
