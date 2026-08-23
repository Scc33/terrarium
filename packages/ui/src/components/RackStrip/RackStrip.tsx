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
import type { InstrumentAccess } from '../../maturity'
import { gaugeDomain } from '../../domains'
import { NAMES, readingDigits } from '../labels'
import { quarterDelta, shapeSeries, stampWorthyRevision } from '../series'
import { RACK_ROW_H } from '../../wallPlan'
import { Tooltip } from '../ui'

interface RackStripProps {
  indicator: IndicatorId
  access: InstrumentAccess
  series?: IndicatorSeries
  now: number
  pinned: boolean
  /** one-based position on the watch board */
  slot?: number
  onPin: () => void
}

function Delta({ delta, digits, className }: { delta: number | null; digits: number; className: string }) {
  if (delta === null || Math.abs(delta) < Math.pow(10, -digits) / 2) return null
  const magnitude = Math.abs(delta).toFixed(digits)
  return (
    <span
      className={`tabular-nums ${className}`}
      aria-label={`Change since the previous quarter: ${delta > 0 ? '+' : '-'}${magnitude}`}
    >
      {delta > 0 ? '▲' : '▼'}
      <span className="rack-delta-magnitude">{magnitude}</span>
    </span>
  )
}

export function RackStrip({ indicator, access, series, now, pinned, slot, onPin }: RackStripProps) {
  const names = NAMES[indicator]
  const { maturity } = access
  const points = series ? shapeSeries(series, 24, now) : []
  const latest = points.length ? points[points.length - 1] : null
  const stamped = series
    ? stampWorthyRevision(points, gaugeDomain(indicator, series.points.map((p) => p.value)))
    : null

  // one row, one height, whatever is inside it
  const frame = 'group flex w-full items-center overflow-hidden border text-left'
  const skin =
    maturity === 'terminal'
      ? 'border-terminal-grid bg-terminal-bg text-terminal-primary hover:border-terminal-primary/60'
      : maturity === 'dossier'
        ? 'border-dossier-brass/70 bg-dossier-paper text-dossier-ink hover:border-dossier-ink/60'
        : 'border-dossier-brass/60 bg-dossier-brass/80 text-dossier-ink/80 hover:border-dossier-ink/50'
  const help = latest
    ? `${names.note} Latest reading: ${latest.value.toFixed(readingDigits(latest.value))}. It was already ${latest.lag} quarter${latest.lag === 1 ? '' : 's'} old when published.${stamped ? ' The office later revised this figure.' : ''} Select to ${pinned ? 'replace it on' : 'put it on'} the watch board.`
    : access.availability === 'awaiting'
      ? `${names.needs} is funded, but its first report has not arrived. Select to ${pinned ? 'replace it on' : 'put it on'} the watch board.`
      : `This measurement needs ${names.needs}. Raise the statistics office from ${Math.round(access.currentCapacity * 100)} to ${Math.round(access.fundedAt * 100)} to unlock it.`

  return (
    <Tooltip content={help}>
      <button
        type="button"
        onClick={onPin}
        style={{ height: RACK_ROW_H }}
        className={`${frame} ${latest ? 'gap-[3px] pr-[3px]' : 'gap-1 pr-1'} ${skin} ${pinned ? 'ring-1 ring-inset ring-current' : ''}`}
        aria-label={help}
        aria-pressed={pinned}
      >
        {/* A few pixels are load-bearing in the populated six-column roster:
            w-5 leaves ten-character names only 57px once value, direction and
            release age arrive. w-3.5 still holds “04”; the literal 3px gaps and
            right padding return the remaining width without shrinking type. */}
        <span
          className={`flex h-full shrink-0 items-center justify-center border-r font-mono text-[8px] font-medium leading-none ${latest ? 'w-3.5' : 'w-5'} ${
            pinned
              ? 'border-current bg-current/10'
              : 'border-current/20 opacity-35 group-hover:opacity-70'
          }`}
          aria-hidden="true"
        >
          {pinned ? String(slot ?? 0).padStart(2, '0') : '+'}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[10px]">{names.short}</span>

        {latest ? (
          <span className="flex shrink-0 items-baseline gap-1 font-mono text-[10px]">
            {stamped && (
              <span
                className={maturity === 'terminal' ? 'text-terminal-alert' : 'text-dossier-warn'}
                aria-label={`Revised by ${stamped.revisionDelta.toFixed(1)} since first published`}
              >
                ✱
              </span>
            )}
            <span className="font-medium tabular-nums">
              {latest.value.toFixed(readingDigits(latest.value))}
            </span>
            <Delta
              delta={quarterDelta(points)}
              digits={readingDigits(latest.value)}
              className="text-[9px] opacity-70"
            />
            <span className="text-[9px] opacity-50">{latest.lag}Q</span>
          </span>
        ) : (
          <span className="max-w-[52%] shrink-0 truncate font-mono text-[8px] tracking-[0.08em] opacity-75">
            {access.availability === 'awaiting'
              ? 'PENDING'
              : `NEEDS ${Math.round(access.fundedAt * 100)}`}
          </span>
        )}
      </button>
    </Tooltip>
  )
}
