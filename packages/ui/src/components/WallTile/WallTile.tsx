/**
 * The frame every instrument on the wall sits in — and the one place the
 * wall's layout contract is written down.
 *
 * THE CONTRACT: a wall tile fills exactly the slot the wall gives it and
 * clips. It never sizes itself to its content.
 *
 * That sounds obvious and is easy to get wrong in three different ways, all
 * of which shipped at least once:
 *
 *   - a `flex-col` tile whose flexing child lacks `min-h-0`, so the child
 *     floors at its content height and pushes the tile past its slot;
 *   - an SVG with `h-full w-full` inside an auto-height parent, which falls
 *     back to its viewBox aspect ratio and becomes 400 px tall in a 175 px
 *     bay (this is what happened to the corridor plot);
 *   - a grid band with implicit `auto` rows, where a child's `h-full`
 *     resolves against its own content instead of the band;
 *   - and the same mistake one axis over: definite ROWS but an implicit
 *     `auto` COLUMN, which resolves to max-content. The widest child — in
 *     practice the footer's figure line — then sets a track wider than the
 *     tile, every sibling stretches to it, and `overflow-hidden` quietly
 *     shears off the right-hand edge of all of them. This is why a gauge's
 *     upper-bound label vanished the moment a dial needed three digits
 *     instead of two, while two-digit dials had hidden it for four
 *     milestones. `min-w-0` on the root does NOT prevent it: that constrains
 *     the tile against its own parent, not the tile's column track against
 *     its content.
 *
 * All four are invisible in review and invisible in jsdom — they only show
 * up as content painted outside the card, underneath the tile below, which
 * is exactly how earlier wall layouts hid every figure they published. So
 * the fix is structural: use this component, get definite rows and columns,
 * `min-h-0` on the body, and `overflow-hidden` on the root, for free.
 *
 * Tiles are sized by `../wallPlan`, which is where "does the war room fit on
 * one screen" is computed and asserted. If you are adding a tile, add it
 * there too — the budget test is what tells you when the wall is full.
 */

import type { ReactNode } from 'react'
import { Tooltip } from '../ui'

interface WallTileProps {
  /** border/background — the tile's era, per the design language */
  className?: string
  /** fixed-height band at the top; omit for a tile that is all face */
  header?: ReactNode
  /** fixed-height band at the bottom */
  footer?: ReactNode
  /** the flexing middle. Anything here must tolerate being clipped. */
  children: ReactNode
  /** extra classes for the body band (padding, mostly) */
  bodyClassName?: string
  /** present ⇒ the tile is a button (the ledger opens its full books) */
  onClick?: () => void
  title?: string
}

/**
 * Definite rows: `auto` for the fixed bands, `minmax(0,1fr)` for the body.
 * The `minmax(0,…)` is the load-bearing half — a plain `1fr` floors at
 * min-content, which lets the tile grow past its slot all over again.
 *
 * Spelled out as literals rather than interpolated, because Tailwind
 * generates utilities by scanning source text: a template string like
 * `grid-rows-[${rows}]` produces a class that exists in the DOM and in no
 * stylesheet, which fails silently and looks exactly like the bug this
 * component is here to prevent.
 */
const ROWS = {
  both: 'grid-rows-[auto_minmax(0,1fr)_auto]',
  header: 'grid-rows-[auto_minmax(0,1fr)]',
  footer: 'grid-rows-[minmax(0,1fr)_auto]',
  neither: 'grid-rows-[minmax(0,1fr)]',
} as const

export function WallTile({ className = '', header, footer, children, bodyClassName = '', onClick, title }: WallTileProps) {
  const rows = ROWS[header && footer ? 'both' : header ? 'header' : footer ? 'footer' : 'neither']
  // one definite column, for the same reason the rows are definite: the
  // implicit `auto` track sizes to max-content and takes every sibling with it
  const root = `grid h-full min-h-0 min-w-0 overflow-hidden grid-cols-[minmax(0,1fr)] ${rows} ${className}`
  const body = <div className={`relative min-h-0 min-w-0 ${bodyClassName}`}>{children}</div>

  if (onClick) {
    const tile = (
      <button type="button" onClick={onClick} className={`${root} text-left`}>
        {header}
        {body}
        {footer}
      </button>
    )
    return title ? <Tooltip content={title}>{tile}</Tooltip> : tile
  }
  const tile = (
    <div className={root} tabIndex={title ? 0 : undefined}>
      {header}
      {body}
      {footer}
    </div>
  )
  return title ? <Tooltip content={title}>{tile}</Tooltip> : tile
}
