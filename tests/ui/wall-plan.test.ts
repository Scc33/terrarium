/**
 * The war room fits on one screen.
 *
 * This is the test that would have caught the old wall's headline bug. The wall
 * put all sixteen instruments in one uniform auto-row grid and simply hoped;
 * every fitted gauge was handed ~174 px for ~250 px of content and painted
 * its figure, vintage line and history strip outside the card, underneath
 * the tile below. At 1280×720 the wall showed needles and no numbers at all,
 * and it got worse the more surveys you funded — the reward for playing the
 * capacity mechanic well was a less readable screen.
 *
 * Nobody caught it because "does it fit" was never a number. Now it is one,
 * and the growth test below is the point: when a later milestone adds
 * indicators, it learns from a red build that the wall is full, rather than
 * from a player staring at a clipped gauge.
 */

import { describe, expect, it } from 'vitest'
import { INDICATOR_IDS, type IndicatorId } from '@terrarium/observation'
import {
  BOARD_SLOTS,
  DEFAULT_PINS,
  RACK_ROW_H,
  REFERENCE_VIEWPORT,
  planWall,
  rackColumns,
  rackHeadroom,
  resolveBoard,
  toggleBoardPin,
  wallBudgetPx,
  wallFits,
} from '../../packages/ui/src/wallPlan'

/** stand-ins for indicators a future milestone might add */
const future = (n: number) => Array.from({ length: n }, (_, i) => `future_${i}` as IndicatorId)

describe('the wall fits the reference viewport', () => {
  it('fits today, with room to spare', () => {
    const plan = planWall(DEFAULT_PINS, INDICATOR_IDS)
    expect(wallFits(plan), `needs ${plan.requiredH}px of ${wallBudgetPx()}px`).toBe(true)
  })

  it('fits on the taller desktops too', () => {
    for (const h of [720, 800, 900, 1080]) {
      const viewport = { w: 1280, h }
      expect(wallFits(planWall(DEFAULT_PINS, INDICATOR_IDS, viewport), viewport), `at ${h}px`).toBe(true)
    }
  })

  it('reports honest headroom for the milestones after this one', () => {
    const room = rackHeadroom(INDICATOR_IDS)
    // if this ever reads 0, the wall is full: the next indicator needs a
    // layout decision (a denser rack, a second page, a taller strip), not
    // another row quietly shoved off the bottom of the screen
    expect(room, 'the wall is full — see the module note in wallPlan.ts').toBeGreaterThan(0)
    console.info(
      `wall headroom: ${INDICATOR_IDS.length} instruments fitted, room for ${room} more at ${REFERENCE_VIEWPORT.w}×${REFERENCE_VIEWPORT.h}`,
    )
  })

  it('uses a six-bay dense roster without changing the four-slot watch board', () => {
    expect(rackColumns(1280)).toBe(6)
    expect(rackColumns(1279)).toBe(4)
    expect(rackColumns(1023)).toBe(3)
    expect(rackColumns(639)).toBe(2)
    expect(BOARD_SLOTS).toBe(4)
  })

  it('still fits with everything the roadmap could plausibly add', () => {
    const grown = [...INDICATOR_IDS, ...future(rackHeadroom(INDICATOR_IDS))]
    expect(wallFits(planWall(DEFAULT_PINS, grown))).toBe(true)
  })

  it('and fails loudly one row past that, rather than clipping', () => {
    const overfull = [...INDICATOR_IDS, ...future(rackHeadroom(INDICATOR_IDS) + rackColumns() + 1)]
    expect(wallFits(planWall(DEFAULT_PINS, overfull))).toBe(false)
  })

  it('the rack costs exactly what it says it costs', () => {
    const plan = planWall(DEFAULT_PINS, INDICATOR_IDS)
    expect(plan.rackRows).toBe(Math.ceil(INDICATOR_IDS.length / plan.rackCols))
    const wider = planWall(DEFAULT_PINS, [...INDICATOR_IDS, ...future(plan.rackCols)])
    expect(wider.requiredH - plan.requiredH).toBe(RACK_ROW_H)
  })
})

describe('the board is always exactly full', () => {
  it('holds BOARD_SLOTS instruments with no repeats', () => {
    const cases: IndicatorId[][] = [
      [],
      [...DEFAULT_PINS],
      ['gini'],
      ['gini', 'gini', 'gini'],
      [...INDICATOR_IDS],
    ]
    for (const pins of cases) {
      const board = resolveBoard(pins, INDICATOR_IDS)
      expect(board).toHaveLength(BOARD_SLOTS)
      expect(new Set(board).size).toBe(BOARD_SLOTS)
      for (const id of board) expect(INDICATOR_IDS).toContain(id)
    }
  })

  it('a stale preference naming a removed indicator degrades to defaults', () => {
    // the pins live in localStorage and outlive any single build, so a save
    // from a version with an indicator this build dropped must not leave the
    // player looking at a board with a hole in it
    const board = resolveBoard(['no_such_indicator' as IndicatorId, 'gini'], INDICATOR_IDS)
    expect(board).toHaveLength(BOARD_SLOTS)
    expect(board).toContain('gini')
    expect(board).not.toContain('no_such_indicator')
  })

  it('honours the player’s pins before the defaults', () => {
    const pins: IndicatorId[] = ['gini', 'birth_rate', 'death_rate', 'asset_prices']
    expect(resolveBoard(pins, INDICATOR_IDS)).toEqual(pins)
  })

  it('swaps a selected instrument out instead of immediately backfilling it', () => {
    const next = toggleBoardPin(DEFAULT_PINS, 'gdp_growth', INDICATOR_IDS)
    expect(next).toHaveLength(BOARD_SLOTS)
    expect(next).not.toContain('gdp_growth')
  })

  it('puts a newly selected instrument in the newest board slot', () => {
    const next = toggleBoardPin(DEFAULT_PINS, 'gini', INDICATOR_IDS)
    expect(next).toEqual(['inflation', 'unemployment', 'approval', 'gini'])
  })

  it('every default pin is a real indicator', () => {
    for (const id of DEFAULT_PINS) expect(INDICATOR_IDS).toContain(id)
  })
})
