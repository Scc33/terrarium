/**
 * The wall's height budget — the module that keeps the war room on one screen.
 *
 * The old wall put all sixteen instruments in one uniform auto-row grid. That
 * grid had no idea how tall a fitted instrument actually is, so every gauge
 * was handed ~170 px for ~250 px of content and quietly painted its own
 * figure, vintage line and history strip outside the card, underneath the
 * tile below. The wall got LESS readable the more surveys you funded, which
 * inverts the whole point of the capacity mechanic.
 *
 * The fix is structural, not cosmetic. The wall is now:
 *
 *   BOARD   a few pinned instruments at full size — the dials you fly by
 *   RACK    every instrument as a fixed-height strip, in a stable order —
 *           the whole measurement apparatus at a glance, including what you
 *           have not built yet
 *   DOCKED  the treasury ledger and the Narrow Corridor, permanently
 *
 * The rack is fixed-height and complete, so it costs a known number of
 * pixels. The board and the docked band are flexible and absorb the slack.
 * That makes "does the war room fit on one screen" a number this module can
 * compute — and `tests/ui/wall-plan.test.ts` asserts it, so the day a milestone
 * adds more indicators the build tells you whether the wall still fits
 * instead of silently clipping them.
 */

import type { IndicatorId } from '@terrarium/observation'

/** the smallest desktop we promise a single-screen war room on; below the
 * `lg` breakpoint the app stacks and scrolls, which is the mobile contract */
export const REFERENCE_VIEWPORT = { w: 1280, h: 720 } as const

/** chrome outside the wall, measured against the running app */
export const CHROME = {
  header: 46,
  wire: 30,
  /** the instrument grid's own p-2 */
  wallPadding: 16,
  gap: 8,
  /** the control rail, at lg and up */
  rail: 384,
} as const

/** a board slot must be at least this tall for an analog gauge to be legible:
 * header 26 + face 110 + stamped figure 36 + history strip 28 */
export const BOARD_SLOT_MIN_H = 200
/** one rack strip: a single line of mono at text-[11px] with breathing room */
export const RACK_ROW_H = 26
/** the ledger's sparkline and the corridor plot both need real estate */
export const DOCKED_MIN_H = 150
/** compact labels above the watch board and the complete instrument rack */
export const SECTION_BAR_H = 20
/** how many instruments the board holds */
export const BOARD_SLOTS = 4
/** a rack strip narrower than this cannot show label + figure + delta */
export const RACK_MIN_COL_W = 200

/** the dials a new government finds already on the wall: the two halves of
 * the misery index, the growth number politics actually reads, and the poll
 * that decides whether you keep your job */
export const DEFAULT_PINS: IndicatorId[] = ['gdp_growth', 'inflation', 'unemployment', 'approval']

export interface WallPlan {
  /** exactly BOARD_SLOTS entries; may include unmeasured indicators, because
   * a blank plate on the board is a legitimate thing to stare at */
  board: IndicatorId[]
  /** every indicator, always, in engine order — a stable roster the player
   * builds muscle memory on. Pinned ones appear here too, marked. */
  rack: readonly IndicatorId[]
  rackCols: number
  rackRows: number
  /** minimum pixels the wall needs; board and docked grow beyond this */
  requiredH: number
}

/** pixels available to the instrument grid's content at a given viewport */
export function wallBudgetPx(viewportH: number = REFERENCE_VIEWPORT.h): number {
  return viewportH - CHROME.header - CHROME.wire - CHROME.wallPadding
}

/** pixels available across the instrument grid's content at a given viewport */
export function wallWidthPx(viewportW: number = REFERENCE_VIEWPORT.w): number {
  return viewportW - CHROME.rail - CHROME.wallPadding
}

export function rackColumns(viewportW: number = REFERENCE_VIEWPORT.w): number {
  const usable = wallWidthPx(viewportW)
  return Math.max(1, Math.min(BOARD_SLOTS, Math.floor(usable / RACK_MIN_COL_W)))
}

/**
 * Resolve pins into exactly BOARD_SLOTS board entries. Unknown or duplicate
 * pins are dropped and the defaults backfill, so a stale preference from an
 * older save can never leave the board short.
 */
export function resolveBoard(pinned: readonly IndicatorId[], all: readonly IndicatorId[]): IndicatorId[] {
  const valid = new Set(all)
  const board: IndicatorId[] = []
  for (const id of [...pinned, ...DEFAULT_PINS, ...all]) {
    if (board.length >= BOARD_SLOTS) break
    if (valid.has(id) && !board.includes(id)) board.push(id)
  }
  return board
}

/**
 * A rack press always produces an honest board change. Adding a fifth item
 * evicts the oldest pin; removing a visible item pulls in the first instrument
 * not already on the board. The board never appears to ignore an "unpin" just
 * because a default pin was immediately backfilled.
 */
export function toggleBoardPin(
  pinned: readonly IndicatorId[],
  id: IndicatorId,
  all: readonly IndicatorId[],
): IndicatorId[] {
  const board = resolveBoard(pinned, all)
  if (!board.includes(id)) return [...board, id].slice(-BOARD_SLOTS)

  const remaining = board.filter((candidate) => candidate !== id)
  const replacement = all.find((candidate) => candidate !== id && !remaining.includes(candidate))
  return replacement ? [...remaining, replacement] : remaining
}

export function planWall(
  pinned: readonly IndicatorId[],
  all: readonly IndicatorId[],
  viewport: { w: number; h: number } = REFERENCE_VIEWPORT,
): WallPlan {
  const rackCols = rackColumns(viewport.w)
  const rackRows = Math.ceil(all.length / rackCols)
  return {
    board: resolveBoard(pinned, all),
    rack: all,
    rackCols,
    rackRows,
    requiredH:
      BOARD_SLOT_MIN_H +
      RACK_ROW_H * rackRows +
      DOCKED_MIN_H +
      SECTION_BAR_H * 2 +
      CHROME.gap * 4,
  }
}

export function wallFits(plan: WallPlan, viewport: { w: number; h: number } = REFERENCE_VIEWPORT): boolean {
  return plan.requiredH <= wallBudgetPx(viewport.h)
}

/**
 * How many more indicators the wall can take before the single-screen promise
 * breaks. The budget test prints this, so a future milestone learns it has run
 * out of wall from a passing test rather than from a clipped gauge.
 */
export function rackHeadroom(
  all: readonly IndicatorId[],
  viewport: { w: number; h: number } = REFERENCE_VIEWPORT,
): number {
  const cols = rackColumns(viewport.w)
  const spare = wallBudgetPx(viewport.h) - planWall([], all, viewport).requiredH
  return Math.max(0, Math.floor(spare / RACK_ROW_H)) * cols
}
