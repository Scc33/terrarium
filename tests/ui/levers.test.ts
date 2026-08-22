/**
 * The lever tables the cabinet and the handbook share.
 *
 * The compiler already guarantees totality — `LEVER_COPY` is a `Record` over
 * `DialPath`, `CAPACITY_COPY` over `CapacityId`. What it cannot check is the
 * ARRAY: `LEVER_GROUPS` is what both the cabinet's drawers and the handbook's
 * chapter walk, and a path missing from it compiles perfectly and simply
 * never appears on either screen. That is the failure this file exists for.
 */

import { describe, expect, it } from 'vitest'
import { CAPACITY_IDS, SECTOR_IDS, type DialPath } from '@terrarium/engine'
import { CAPACITY_COPY, LEVER_COPY, LEVER_GROUPS, leverGroup } from '../../packages/ui/src/levers'

/**
 * Every lever the engine has, taken from the runtime keys of the total copy
 * table rather than typed out here.
 *
 * A hand-written list looks equivalent and is not. `LEVER_COPY` is a `Record`
 * over `DialPath`, so a new lever forces an entry there — but nothing forces a
 * literal array in a test file to grow. If a new path were then also missed in
 * `LEVER_GROUPS`, which is the exact omission this file exists to catch, BOTH
 * sides of the comparison would be missing it and the test would pass while
 * the lever was absent from the cabinet and the handbook alike.
 */
const ALL_PATHS = Object.keys(LEVER_COPY) as DialPath[]

describe('the cabinet drawers', () => {
  it('reach every lever the engine has, exactly once', () => {
    const grouped = LEVER_GROUPS.flatMap((group) => group.paths)
    expect(new Set(grouped).size).toBe(grouped.length)
    expect([...grouped].sort()).toEqual([...ALL_PATHS].sort())
  })

  it('is checking against a list that cannot silently shrink', () => {
    // the guard on the guard: ALL_PATHS is derived, so this pins that the
    // derivation still sees every family of lever the engine defines
    expect(ALL_PATHS).toContain('taxRates.income')
    expect(ALL_PATHS).toContain('policyRate')
    for (const sid of SECTOR_IDS) expect(ALL_PATHS).toContain(`subsidies.${sid}`)
    expect(ALL_PATHS.length).toBeGreaterThanOrEqual(11 + SECTOR_IDS.length)
  })

  it('finds a drawer by the name the cabinet navigates by', () => {
    expect(leverGroup('TAXATION')?.tab).toBe('REVENUE')
    // the capacity and politics drawers are not lever drawers; the rail draws
    // them itself, and asking for one must be a miss rather than a wrong tab
    expect(leverGroup('STATE CAPACITY')).toBeUndefined()
    expect(leverGroup('THE ROOM')).toBeUndefined()
  })

  it('asks a question, and answers it in the same words the group is named', () => {
    for (const group of LEVER_GROUPS) {
      expect(group.question.endsWith('?'), group.group).toBe(true)
      expect(group.brief.length, group.group).toBeGreaterThan(40)
      expect(group.paths.length, group.group).toBeGreaterThan(0)
    }
  })
})

describe('what a player is told before pulling something', () => {
  it('gives every lever a plain sentence and a consequence', () => {
    for (const path of ALL_PATHS) {
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
