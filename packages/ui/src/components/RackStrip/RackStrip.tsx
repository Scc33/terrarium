/**
 * One instrument, compressed to a single line — the rack's unit.
 *
 * The rack exists because a wall of sixteen full-size gauges cannot fit on
 * one screen and never could; the old grid pretended otherwise and clipped
 * them. Here every instrument is always present at a fixed, known height, in
 * a stable order, so the player can see the entire state of their measurement
 * apparatus at a glance — including, deliberately, the instruments they have
 * not built. An unfitted strip naming the survey that would create it is the
 * blank brass plate's job done in 26 pixels: an invitation to act, not an
 * empty state to apologise for.
 *
 * The three maturities keep their own register here exactly as they do at
 * full size — brass, manila, phosphor — so the rack reads as the patchwork
 * the capacity mechanic actually is.
 */

import type { IndicatorId, IndicatorSeries } from '@terrarium/observation'
import type { Maturity } from '../../maturity'
import { gaugeDomain } from '../../domains'
import { NAMES } from '../labels'
import { quarterDelta, shapeSeries, stampWorthyRevision } from '../series'
import { RACK_ROW_H } from '../../wallPlan'

interface RackStripProps {
  indicator: IndicatorId
  maturity: Maturity
  series?: IndicatorSeries
  now: number
  pinned: boolean
  /** one-based position on the watch board */
  slot?: number
  onPin: () => void
}

function Delta({ delta, digits, className }: { delta: number | null; digits: number; className: string }) {
  if (delta === null || Math.abs(delta) < Math.pow(10, -digits) / 2) return null
  return (
    <span className={`tabular-nums ${className}`}>
      {delta > 0 ? '▲' : '▼'}
      {Math.abs(delta).toFixed(digits)}
    </span>
  )
}

export function RackStrip({ indicator, maturity, series, now, pinned, slot, onPin }: RackStripProps) {
  const names = NAMES[indicator]
  const points = series ? shapeSeries(series, 24, now) : []
  const latest = points.length ? points[points.length - 1] : null
  const stamped = series
    ? stampWorthyRevision(points, gaugeDomain(indicator, series.points.map((p) => p.value)))
    : null

  // one row, one height, whatever is inside it
  const frame = 'group flex w-full items-center gap-2 overflow-hidden border pr-2 text-left'
  const skin =
    maturity === 'terminal'
      ? 'border-terminal-grid bg-terminal-bg text-terminal-primary hover:border-terminal-primary/60'
      : maturity === 'dossier'
        ? 'border-dossier-brass/70 bg-dossier-paper text-dossier-ink hover:border-dossier-ink/60'
        : 'border-dossier-brass/60 bg-dossier-brass/80 text-dossier-ink/80 hover:border-dossier-ink/50'

  return (
    <button
      type="button"
      onClick={onPin}
      style={{ height: RACK_ROW_H }}
      className={`${frame} ${skin} ${pinned ? 'ring-1 ring-inset ring-current' : ''}`}
      title={
        latest
          ? `${names.dossier} — ${latest.value.toFixed(1)}, ${latest.lag}Q late. Click to ${pinned ? 'replace on' : 'put on'} the watch board.`
          : `Not fitted. Fund ${names.needs.toLowerCase()} to bring this instrument online. Click to ${pinned ? 'replace on' : 'put on'} the watch board.`
      }
      aria-pressed={pinned}
    >
      <span
        className={`flex h-full w-7 shrink-0 items-center justify-center border-r font-mono text-[8px] font-medium leading-none ${
          pinned
            ? 'border-current bg-current/10'
            : 'border-current/20 opacity-35 group-hover:opacity-70'
        }`}
        aria-hidden="true"
      >
        {pinned ? String(slot ?? 0).padStart(2, '0') : '+'}
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-[10px] tracking-[0.06em]">{names.short}</span>

      {latest ? (
        <span className="flex shrink-0 items-baseline gap-1.5 font-mono text-[10px]">
          {stamped && (
            <span
              className={maturity === 'terminal' ? 'text-terminal-alert' : 'text-dossier-warn'}
              title={`Revised by ${stamped.revisionDelta.toFixed(1)} since first print`}
            >
              ✱
            </span>
          )}
          <span className="font-medium tabular-nums">{latest.value.toFixed(1)}</span>
          <Delta delta={quarterDelta(points)} digits={1} className="text-[9px] opacity-70" />
          <span className="text-[9px] opacity-50">{latest.lag}Q</span>
        </span>
      ) : (
        <span className="max-w-[48%] shrink-0 truncate font-mono text-[9px] tracking-[0.1em] opacity-70">{names.needs}</span>
      )}
    </button>
  )
}
