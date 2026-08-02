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
    expect(cabinetGroupForKey('TAXATION', 'ArrowLeft')).toBe('STATE CAPACITY')
    expect(cabinetGroupForKey('STATE CAPACITY', 'ArrowRight')).toBe('TAXATION')
  })

  it('supports edge jumps and stable aria ids', () => {
    expect(cabinetGroupForKey('MONEY', 'Home')).toBe('TAXATION')
    expect(cabinetGroupForKey('MONEY', 'End')).toBe('STATE CAPACITY')
    expect(cabinetTabId('STATE CAPACITY')).toBe('cabinet-tab-state-capacity')
    expect(CABINET_PANEL_ID).toBe('cabinet-tabpanel')
  })
})
