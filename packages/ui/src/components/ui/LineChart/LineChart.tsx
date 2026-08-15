/**
 * The compact labelled line — a `TimeSeriesChart` preset for dense bays.
 *
 * It is a caption row (a caller-coloured label, the latest figure) over a
 * plot, which is what the treasury ledger, the full books and the expenditure
 * accounts all want and what a full `ChartFrame` is too heavy for. It owns no
 * geometry: that was the point of consolidating it. Anything needing a face,
 * a ribbon, reference rules or an overlay should reach for `TimeSeriesChart`
 * directly rather than growing props here.
 */

import { qtrLabel } from '../../series'
import { TimeSeriesChart } from '../TimeSeriesChart/TimeSeriesChart'

export interface LineChartProps {
  data: Array<{ tick: number; value: number }>
  height?: number
  /** a node, not a string, so a caller can colour the series names in the
   * label itself and spend no vertical room on a separate legend */
  label?: React.ReactNode
  /** color a second reference series (e.g. outlays against revenue) */
  compare?: Array<{ tick: number; value: number }>
  primaryColor?: string
  comparisonColor?: string
  emptyLabel?: string
  /** Plain-language reading exposed beside the visual for assistive tech. */
  summary?: string
  /** Fill a definite-height parent instead of taking height from the SVG's
   * width/viewBox ratio. Used by docked wall tiles, whose slot is the budget. */
  fill?: boolean
}

export function LineChart({
  data,
  height = 84,
  label,
  compare,
  primaryColor = 'var(--color-dossier-ink)',
  comparisonColor = 'var(--color-dossier-warn)',
  emptyLabel = 'INSUFFICIENT HISTORY',
  summary,
  fill = false,
}: LineChartProps) {
  const latest = data[data.length - 1]
  const all = [...data, ...(compare ?? [])].map((d) => d.value)
  const reading =
    summary ??
    (data.length >= 2
      ? `Series from ${qtrLabel(data[0].tick)} to ${qtrLabel(latest.tick)}. Latest value ${latest.value.toFixed(1)}; observed range ${Math.min(...all).toFixed(1)} to ${Math.max(...all).toFixed(1)}.`
      : emptyLabel)

  return (
    <div className={fill ? 'flex h-full min-h-0 flex-col' : undefined}>
      {label && (
        <div className="mb-0.5 flex items-baseline justify-between">
          <span className="font-mono text-[9px] tracking-[0.2em] text-dossier-ink/70">{label}</span>
          {latest && (
            <span className="font-mono text-[10px] tabular-nums text-dossier-ink">
              {latest.value.toFixed(1)}
            </span>
          )}
        </div>
      )}
      <TimeSeriesChart
        width={260}
        height={height}
        fill={fill}
        traces={[
          ...(compare ? [{ key: 'compare', points: compare, color: comparisonColor, width: 1.1 }] : []),
          { key: 'primary', points: data, color: primaryColor, width: 1.2, lead: true },
        ]}
        // zero is the reading on a balance or a rate, so keep it on the face
        // even in a century that never crossed it
        include={all.some((v) => v < 0) ? [0] : undefined}
        pad={0.06}
        formatTick={qtrLabel}
        formatReading={(v) => v.toFixed(1)}
        summary={reading}
        emptyLabel={emptyLabel}
        hover
        className={fill ? 'min-h-0 flex-1' : undefined}
      />
    </div>
  )
}
