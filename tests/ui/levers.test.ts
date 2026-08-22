/**
 * The lever tables the cabinet and the handbook share.
 *
 * This file used to guard a hole: `LEVER_GROUPS` was a hand-written array, and
 * a lever missing from it compiled perfectly while vanishing from both screens.
 * That hole is closed — each lever now declares its own drawer in `LEVER_COPY`,
 * which is total over `DialPath`, and the drawers are assembled from it. A new
 * lever cannot compile without naming where it belongs.
 *
 * So what is left to test is what a compiler still cannot see: that the
 * ASSEMBLY produces the cabinet somebody meant. Drawer order, membership and
 * within-drawer order are all now emergent rather than written down, and
 * emergent order is exactly the kind of thing that changes silently when
 * somebody moves an entry while editing prose. It is pinned below.
 */

import { describe, expect, it } from 'vitest'
import { CABINET_GROUPS } from '../../packages/ui/src/cabinetNavigation'
import { CAPACITY_IDS, SECTOR_IDS } from '@terrarium/engine'
import {
  CAPACITY_COPY,
  LEVER_COPY,
  LEVER_GROUPS,
  LEVER_PATHS,
  leverGroup,
} from '../../packages/ui/src/levers'

describe('the cabinet assembles itself from the levers', () => {
  it('puts every lever in exactly one drawer, and leaves none behind', () => {
    const grouped = LEVER_GROUPS.flatMap((group) => group.paths)
    expect(new Set(grouped).size).toBe(grouped.length)
    expect([...grouped].sort()).toEqual([...LEVER_PATHS].sort())
  })

  it('opens no empty drawer', () => {
    // a drawer whose levers all moved elsewhere still renders a tab, a brief
    // and a question above nothing at all
    for (const group of LEVER_GROUPS) expect(group.paths.length, group.group).toBeGreaterThan(0)
  })

  it('lays the cabinet out in exactly this order', () => {
    // the layout is emergent now — drawer order from CABINET_GROUPS, membership
    // and within-drawer order from declaration order in LEVER_COPY. Pinned so
    // that reordering the copy table cannot quietly reorder the rail.
    expect(LEVER_GROUPS.map((group) => [group.group, group.tab, ...group.paths])).toEqual([
      ['TAXATION', 'REVENUE', 'taxRates.income', 'taxRates.corporate', 'taxRates.tariff', 'taxRates.fuel'],
      ['SPENDING', 'SPENDING', 'spending.transfers', 'spending.procurement', 'spending.investment', 'spending.research'],
      ['MONEY', 'CENTRAL BANK', 'policyRate', 'assetPurchaseRate', 'capitalRequirement'],
      ['MIGRATION', 'BORDERS', 'immigrationLimit'],
      ['SUBSIDIES', 'INDUSTRY', ...SECTOR_IDS.map((sid) => `subsidies.${sid}`)],
    ])
  })

  it('follows the cabinet’s own tab order, not its own', () => {
    const drawerOrder = LEVER_GROUPS.map((group) => group.group)
    const cabinetOrder = CABINET_GROUPS.filter((group) => drawerOrder.includes(group as never))
    expect(drawerOrder).toEqual(cabinetOrder)
  })

  it('finds a drawer by the name the cabinet navigates by', () => {
    expect(leverGroup('TAXATION')?.tab).toBe('REVENUE')
    // the capacity and politics drawers are not lever drawers; the rail draws
    // them itself, and asking for one must be a miss rather than a wrong tab
    expect(leverGroup('STATE CAPACITY')).toBeUndefined()
    expect(leverGroup('THE ROOM')).toBeUndefined()
  })

  it('asks a question in every drawer, and briefs it', () => {
    for (const group of LEVER_GROUPS) {
      expect(group.question.endsWith('?'), group.group).toBe(true)
      expect(group.brief.length, group.group).toBeGreaterThan(40)
    }
  })
})

describe('what a player is told before pulling something', () => {
  it('gives every lever a plain sentence and a consequence', () => {
    for (const path of LEVER_PATHS) {
      const copy = LEVER_COPY[path]
      expect(copy.label, path).not.toBe('')
      // the label is what the slider is called; an id leaking into it is the
      // regression that made the subsidy rows read `manuf`
      expect(copy.label, path).not.toBe(path)
      expect(copy.hint.length, path).toBeGreaterThan(30)
      expect(copy.resists.length, path).toBeGreaterThan(30)
      expect(copy.hint, path).not.toBe(copy.resists)
    }
  })

  it('is reading a lever list that cannot silently shrink', () => {
    // LEVER_PATHS is derived from the total copy table, so this pins that the
    // derivation still sees every family of lever the engine defines
    expect(LEVER_PATHS).toContain('taxRates.income')
    expect(LEVER_PATHS).toContain('policyRate')
    for (const sid of SECTOR_IDS) expect(LEVER_PATHS).toContain(`subsidies.${sid}`)
    expect(LEVER_PATHS.length).toBeGreaterThanOrEqual(12 + SECTOR_IDS.length)
  })

  it('gives every ministry a hint, a one-line effect, and a longer answer', () => {
    for (const id of CAPACITY_IDS) {
      const copy = CAPACITY_COPY[id]
      expect(copy.label, id).not.toBe(id)
      expect(copy.effect.length, id).toBeGreaterThan(20)
      // the handbook's detail has to say more than the rail's tooltip, or the
      // manual is a longer way to read something already on screen
      expect(copy.detail.length, id).toBeGreaterThan(copy.hint.length)
    }
  })
})
