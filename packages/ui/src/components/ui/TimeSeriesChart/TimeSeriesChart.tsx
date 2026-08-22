/**
 * The one time-series painter. Every line, area and ribbon in the game goes
 * through it — the wall's terminal ticker, the treasury ledger, the
 * expenditure accounts, the finance overlay, the census.
 *
 * It replaced five hand-rolled charts that each carried a private copy of
 * `sx`/`sy` and disagreed about the things a player actually reads: one
 * clamped its trace into a fixed face, one auto-scaled, two forced a zero
 * floor with different padding; one had a hover crosshair, one had invisible
 * hit-circles carrying a `<title>`, three had nothing at all. Consolidating
 * them is not tidiness — it is the only way a fix to the axis, the readout,
 * range comparison or accessible summary reaches every figure at once.
 *
 * Geometry lives in `../../../plot`; this file paints. It knows nothing about
 * indicators, budgets or censuses: callers own the subject matter, the units,
 * the colours and the words, exactly as `DonutChart` and `StackedAreaChart` do.
 *
 * Three rules it must not break:
 *
 * 1. IT DOES NOT CLAMP OR BORROW A DIAL FACE. The chart scales the displayed
 *    record and prints its own axis (ADR-0024). Drawing a trace flat along a
 *    rail is the bug this component was built to end.
 * 2. IT FILLS ITS SLOT WHEN ASKED. `fill` puts the SVG in a `min-h-0 flex-1`
 *    box so a docked wall tile's bay is the height budget. Without it the SVG
 *    takes height from its viewBox ratio, which is WallTile failure mode 2 —
 *    a 400px chart in a 175px bay.
 * 3. THE RULES SIT ON TOP OF THE INK. A gridline hidden under the trace it
 *    exists to measure is decoration, so rules and labels paint after traces.
 */

import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import {
  axisDecimals,
  nearestPoint,
  rangeBetween,
  timePlot,
  type BandPoint,
  type PlotPoint,
  type TimePlot,
} from '../../../plot'

/** which visual register the figure is drawn in — brass on manila, phosphor
 * on near-black, or the quieter cartographic hand */
export type ChartRegister = 'dossier' | 'terminal' | 'map'

export interface ChartTrace {
  key: string
  points: readonly PlotPoint[]
  /** a CSS colour; defaults to the register's own ink */
  color?: string
  width?: number
  dashed?: boolean
  /** fill from the trace down to this value — an area rather than a line */
  fillTo?: number
  fillOpacity?: number
  /** draw the quarter markers and take the hover readout from this trace.
   * With no trace marked, the first one leads. */
  lead?: boolean
}

/** a reference line the rules put there: zero, an index baseline, an election
 * threshold, a banking crisis, the year a scrubber is parked on */
export interface ChartRule {
  axis: 'x' | 'y'
  at: number
  label?: string
  color?: string
  /** solid by default; a dashed rule reads as an annotation rather than a
   * measurement, which is what a crisis marker and a scrub line are */
  dashed?: boolean
  opacity?: number
}

export interface TimeSeriesChartProps {
  traces: readonly ChartTrace[]
  /** a shaded ±band around one series — the office's confessed uncertainty */
  ribbon?: { points: readonly BandPoint[]; color?: string }
  /** shade the region between two traces, named by key */
  wedge?: { over: string; under: string; color?: string; opacity?: number }
  /** values the axis must contain whatever the data does */
  include?: readonly number[]
  /** breathing room as a fraction of the data span */
  pad?: number
  /** pin the horizontal extent instead of taking it from the data. Stacked
   * figures reading the same century (the census's vital rates over its head
   * count) must share an axis even when one of them published fewer quarters. */
  xDomain?: { x0: number; x1: number }
  rules?: readonly ChartRule[]
  register?: ChartRegister
  width?: number
  height?: number
  /** fill a definite-height parent instead of taking height from the viewBox
   * ratio. Docked wall tiles pass this; their slot is the budget. */
  fill?: boolean
  /** how a value prints on the axis. Defaults to a precision taken from the
   * gridline step, so every label on one axis agrees — leave it alone unless
   * the axis carries a unit. */
  format?: (value: number) => string
  /** how a value prints in the hover readout; defaults to `format`. The
   * terminal register carries a digit more here than on its axis. */
  formatReading?: (value: number) => string
  /** how values print in a selected-range comparison. Defaults to the axis
   * format so a unit is not repeated until the readout no longer fits. */
  formatRange?: (value: number) => string
  /** how a tick prints on the x axis — quarters or years, caller's choice */
  formatTick?: (tick: number) => string
  /** plain-language reading beside the visual, for assistive technology */
  summary: string
  /** what to say when there is not enough published record to draw */
  emptyLabel?: string
  /** a crosshair and a readout following the pointer */
  hover?: boolean
  /** drag or Shift+Arrow to compare two releases. Defaults to `hover`, so
   * every chart that already offers point inspection gets range inspection. */
  rangeSelection?: boolean
  /** extra lines in the hover readout. The point is the LEAD trace's own
   * object, so a caller whose points carry more than `{tick, value}` gets
   * them back — pass the richer array and narrow it here. */
  hoverDetail?: (point: PlotPoint) => ReactNode
  /** instrument-specific ink — revision marks, a "NOW" flag — painted over
   * the traces with the plot's own scales. The escape hatch that keeps this
   * component from growing per-instrument knowledge. */
  overlay?: (plot: TimePlot) => ReactNode
  className?: string
}

interface RegisterSkin {
  ink: string
  grid: string
  gridOpacity: number
  axisOpacity: number
  labelOpacity: number
  /** the readout's own paper, so it is legible over the trace */
  readout: string
  empty: string
}

const SKINS: Record<ChartRegister, RegisterSkin> = {
  dossier: {
    ink: 'var(--color-dossier-ink)',
    grid: 'var(--color-dossier-ink)',
    gridOpacity: 0.14,
    axisOpacity: 0.35,
    labelOpacity: 0.6,
    readout: 'border-dossier-ink/30 bg-dossier-paper text-dossier-ink',
    empty: 'border-dossier-ink/20 text-dossier-ink/55',
  },
  terminal: {
    ink: 'var(--color-terminal-primary)',
    grid: 'var(--color-terminal-grid)',
    gridOpacity: 1,
    axisOpacity: 1,
    labelOpacity: 0.6,
    readout: 'border-terminal-grid bg-terminal-bg text-terminal-primary',
    empty: 'border-terminal-grid text-terminal-primary/60',
  },
  map: {
    ink: 'var(--color-map-line)',
    grid: 'var(--color-map-line)',
    gridOpacity: 0.18,
    axisOpacity: 0.5,
    labelOpacity: 0.7,
    readout: 'border-map-line/50 bg-map-field text-map-line',
    empty: 'border-map-line/40 text-map-line/70',
  },
}

export function TimeSeriesChart({
  traces,
  ribbon,
  wedge,
  include,
  pad = 0,
  xDomain,
  rules = [],
  register = 'dossier',
  width = 300,
  height = 140,
  fill = false,
  format,
  formatReading,
  formatRange,
  formatTick = (t) => String(t),
  summary,
  emptyLabel = 'INSUFFICIENT HISTORY',
  hover = false,
  rangeSelection = hover,
  hoverDetail,
  overlay,
  className = '',
}: TimeSeriesChartProps) {
  const [cursorTick, setCursorTick] = useState<number | null>(null)
  const [selectionTicks, setSelectionTicksState] = useState<{
    anchor: number
    focus: number
  } | null>(null)
  const selectionTicksRef = useRef(selectionTicks)
  const dragPointer = useRef<number | null>(null)
  const skin = SKINS[register]

  const lead = traces.find((t) => t.lead) ?? traces[0]
  const drawable = traces.some((t) => t.points.length >= 2)
  if (!drawable) {
    return (
      <div
        className={`flex min-h-14 items-center justify-center border border-dashed font-mono text-[9px] tracking-[0.12em] ${skin.empty} ${fill ? 'h-full' : ''} ${className}`}
      >
        {emptyLabel}
      </div>
    )
  }

  // Padding is generous on the left because a y label is the widest text on
  // the chart and an analytical scale can grow a digit mid-century.
  const box = { w: width, h: height, padL: 34, padR: 8, padT: 8, padB: 15 }
  // A ribbon is published ink too. Scale to its confessed bounds rather than
  // letting the SVG clip uncertainty that extends beyond the point estimate.
  const scaleInclude = [
    ...(include ?? []),
    ...(ribbon?.points.flatMap((point) => {
      const band = Math.abs(point.band)
      return [point.value - band, point.value + band]
    }) ?? []),
  ]
  const plot = timePlot(
    traces.map((t) => t.points),
    box,
    // a short strip wants fewer rules than a full figure; `niceTicks`
    // guarantees the floor of two either way
    { include: scaleInclude, pad, ticks: height >= 110 ? 4 : 3 },
    xDomain,
  )
  const { y } = plot
  const yLabelX = box.padL - 4
  const baseY = height - box.padB
  // precision belongs to the scale, not the value: decided once so the axis
  // never reads `0.0, 20, 40`
  const fmt = format ?? ((v: number) => v.toFixed(axisDecimals(y)))
  const reading = formatReading ?? fmt
  const rangeReading = formatRange ?? fmt

  const readablePoints = (lead?.points ?? []).filter(
    (point) => Number.isFinite(point.tick) && Number.isFinite(point.value),
  )
  const cursor = cursorTick === null ? null : nearestPoint(readablePoints, cursorTick)
  const selected = selectionTicks
    ? rangeBetween(readablePoints, selectionTicks.anchor, selectionTicks.focus)
    : null
  const range = selected && selected.quarters > 0 ? selected : null

  const setSelectionTicks = (next: { anchor: number; focus: number } | null) => {
    selectionTicksRef.current = next
    setSelectionTicksState(next)
  }

  const pointAtClientX = (clientX: number, svg: SVGSVGElement) => {
    if (!lead) return null
    const rect = svg.getBoundingClientRect()
    if (!(rect.width > 0)) return null
    const rawX = ((clientX - rect.left) / rect.width) * width
    const px = Math.max(box.padL, Math.min(width - box.padR, rawX))
    const tick = plot.x0 + ((px - box.padL) / (width - box.padL - box.padR)) * (plot.x1 - plot.x0)
    return nearestPoint(readablePoints, tick)
  }

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!hover || !lead) return
    const point = pointAtClientX(e.clientX, e.currentTarget)
    if (!point) return
    if (rangeSelection && dragPointer.current === e.pointerId) {
      const anchor = selectionTicksRef.current?.anchor ?? point.tick
      setSelectionTicks({ anchor, focus: point.tick })
      setCursorTick(null)
    } else if (!range) {
      setCursorTick(point.tick)
    }
  }

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!hover || !rangeSelection || !lead) return
    const point = pointAtClientX(e.clientX, e.currentTarget)
    if (!point) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragPointer.current = e.pointerId
    setSelectionTicks({ anchor: point.tick, focus: point.tick })
    setCursorTick(point.tick)
  }

  const finishPointer = (e: PointerEvent<SVGSVGElement>) => {
    if (dragPointer.current !== e.pointerId) return
    const point = pointAtClientX(e.clientX, e.currentTarget)
    const selection = selectionTicksRef.current
    if (point && selection) {
      const next = { ...selection, focus: point.tick }
      if (next.anchor === next.focus) {
        setSelectionTicks(null)
        setCursorTick(point.tick)
      } else {
        setSelectionTicks(next)
        setCursorTick(null)
      }
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragPointer.current = null
  }

  const cancelPointer = (e: PointerEvent<SVGSVGElement>) => {
    if (dragPointer.current !== e.pointerId) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragPointer.current = null
    setSelectionTicks(null)
    setCursorTick(null)
  }

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!hover || readablePoints.length === 0) return
    if (e.key === 'Escape') {
      if (range || cursor) e.preventDefault()
      setSelectionTicks(null)
      setCursorTick(null)
      return
    }
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()

    const currentTick = selectionTicksRef.current?.focus ?? cursor?.tick ?? readablePoints[readablePoints.length - 1].tick
    const current = nearestPoint(readablePoints, currentTick)!
    const currentIndex = Math.max(0, readablePoints.indexOf(current))
    const nextIndex =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? readablePoints.length - 1
          : Math.max(
              0,
              Math.min(readablePoints.length - 1, currentIndex + (e.key === 'ArrowLeft' ? -1 : 1)),
            )
    const next = readablePoints[nextIndex]

    if (e.shiftKey && rangeSelection) {
      const anchor = selectionTicksRef.current?.anchor ?? current.tick
      setSelectionTicks({ anchor, focus: next.tick })
      setCursorTick(null)
    } else {
      setSelectionTicks(null)
      setCursorTick(next.tick)
    }
  }

  const wedgePath = wedge
    ? plot.wedge(
        traces.find((t) => t.key === wedge.over)?.points ?? [],
        traces.find((t) => t.key === wedge.under)?.points ?? [],
      )
    : null
  const ribbonPath = ribbon ? plot.ribbon(ribbon.points) : null

  return (
    // `relative` unconditionally: the hover readout is absolutely positioned,
    // and without a positioned ancestor here it escapes to whichever container
    // happens to have one — which for a docked tile is the whole wall.
    <div className={`relative ${fill ? 'flex h-full min-h-0 flex-col' : ''} ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className={`block w-full ${fill ? 'min-h-0 flex-1' : ''} ${hover ? 'cursor-crosshair focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-2px]' : ''}`}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={finishPointer}
        onPointerCancel={cancelPointer}
        onPointerLeave={() => {
          if (dragPointer.current === null && !range) setCursorTick(null)
        }}
        onKeyDown={onKeyDown}
        tabIndex={hover ? 0 : undefined}
        role="img"
        aria-label={summary}
        aria-keyshortcuts={
          rangeSelection
            ? 'ArrowLeft ArrowRight Home End Shift+ArrowLeft Shift+ArrowRight Escape'
            : undefined
        }
        data-chart-interactive={hover ? '' : undefined}
      >
        {/* No `<title>`: it renders as the browser's own bubble, which drifts in
            after a second and sits on top of the crosshair readout this chart
            already paints under the cursor. `aria-label` carries the same
            sentence to assistive tech without competing for the pointer. */}

        {/* gridlines first — everything measured paints over them */}
        {y.ticks.map((v) => (
          <line
            key={`grid-${v}`}
            x1={box.padL}
            x2={width - box.padR}
            y1={plot.sy(v)}
            y2={plot.sy(v)}
            stroke={skin.grid}
            strokeWidth="0.5"
            opacity={skin.gridOpacity}
          />
        ))}

        {range && (
          <rect
            x={Math.min(plot.sx(range.start.tick), plot.sx(range.end.tick))}
            y={box.padT}
            width={Math.max(1, Math.abs(plot.sx(range.end.tick) - plot.sx(range.start.tick)))}
            height={baseY - box.padT}
            fill={skin.ink}
            opacity="0.08"
            data-chart-range=""
          />
        )}

        {wedgePath && (
          <path d={wedgePath} fill={wedge!.color ?? skin.ink} opacity={wedge!.opacity ?? 0.12} />
        )}
        {ribbonPath && <path d={ribbonPath} fill={ribbon!.color ?? skin.ink} opacity="0.1" />}

        {traces.map((t) => {
          const areaPath = t.fillTo === undefined ? null : plot.area(t.points, t.fillTo)
          const linePath = plot.line(t.points)
          return (
            <g key={t.key}>
              {areaPath && (
                <path d={areaPath} fill={t.color ?? skin.ink} opacity={t.fillOpacity ?? 0.08} />
              )}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={t.color ?? skin.ink}
                  strokeWidth={t.width ?? 1.4}
                  strokeLinejoin="round"
                  strokeDasharray={t.dashed ? '3 2' : undefined}
                />
              )}
            </g>
          )
        })}

        {overlay?.(plot)}

        {rules.map((rule, i) => {
          const p = rule.axis === 'y' ? plot.sy(rule.at) : plot.sx(rule.at)
          const color = rule.color ?? skin.ink
          return (
            <g key={`rule-${rule.axis}-${rule.at}-${i}`} opacity={rule.opacity ?? 0.5}>
              <line
                x1={rule.axis === 'y' ? box.padL : p}
                x2={rule.axis === 'y' ? width - box.padR : p}
                y1={rule.axis === 'y' ? p : box.padT}
                y2={rule.axis === 'y' ? p : baseY}
                stroke={color}
                strokeWidth="0.8"
                strokeDasharray={rule.dashed === false ? undefined : '2 3'}
              />
              {rule.label && rule.axis === 'y' && (
                <text
                  x={width - box.padR}
                  y={p - 2.5}
                  textAnchor="end"
                  fontSize="7"
                  fontFamily="var(--font-mono)"
                  letterSpacing="0.5"
                  fill={color}
                >
                  {rule.label}
                </text>
              )}
            </g>
          )
        })}

        {/* frame */}
        <line x1={box.padL} x2={box.padL} y1={box.padT} y2={baseY} stroke={skin.grid} strokeWidth="0.8" opacity={skin.axisOpacity} />
        <line x1={box.padL} x2={width - box.padR} y1={baseY} y2={baseY} stroke={skin.grid} strokeWidth="0.8" opacity={skin.axisOpacity} />

        {y.ticks.map((v) => (
          <text
            key={`ylab-${v}`}
            x={yLabelX}
            y={plot.sy(v) + 2.5}
            textAnchor="end"
            fontSize="7.5"
            fontFamily="var(--font-mono)"
            fill={skin.ink}
            opacity={skin.labelOpacity}
          >
            {fmt(v)}
          </text>
        ))}

        <text x={box.padL} y={height - 3.5} fontSize="7.5" fontFamily="var(--font-mono)" fill={skin.ink} opacity={skin.labelOpacity}>
          {formatTick(plot.x0)}
        </text>
        <text x={width - box.padR} y={height - 3.5} textAnchor="end" fontSize="7.5" fontFamily="var(--font-mono)" fill={skin.ink} opacity={skin.labelOpacity}>
          {formatTick(plot.x1)}
        </text>

        {range ? (
          <g>
            {[range.start, range.end].map((point) => (
              <g key={`selection-${point.tick}`}>
                <line
                  x1={plot.sx(point.tick)}
                  x2={plot.sx(point.tick)}
                  y1={box.padT}
                  y2={baseY}
                  stroke={skin.ink}
                  strokeWidth="0.8"
                  opacity="0.7"
                />
                <circle
                  cx={plot.sx(point.tick)}
                  cy={plot.sy(point.value)}
                  r="2.4"
                  fill={lead?.color ?? skin.ink}
                />
              </g>
            ))}
          </g>
        ) : cursor ? (
          <g>
            <line
              x1={plot.sx(cursor.tick)}
              x2={plot.sx(cursor.tick)}
              y1={box.padT}
              y2={baseY}
              stroke={skin.ink}
              strokeWidth="0.7"
              opacity="0.5"
            />
            <circle cx={plot.sx(cursor.tick)} cy={plot.sy(cursor.value)} r="2.2" fill={lead?.color ?? skin.ink} />
          </g>
        ) : null}
      </svg>

      {range ? (
        <div
          className={`pointer-events-none absolute right-1 top-1 max-w-[calc(100%-0.5rem)] border px-2 py-1 font-mono text-[9px] leading-relaxed ${skin.readout}`}
          role="status"
          aria-live="polite"
          data-chart-range-readout=""
        >
          <div className="whitespace-nowrap">
            {formatTick(range.start.tick)} → {formatTick(range.end.tick)}
          </div>
          <div className="whitespace-nowrap tabular-nums">
            {rangeReading(range.start.value)} → {rangeReading(range.end.value)}
          </div>
          <div className="whitespace-nowrap tabular-nums">
            Δ {range.change > 0 ? '+' : ''}{rangeReading(range.change)} · {range.quarters}Q
          </div>
          <div className="whitespace-nowrap tabular-nums opacity-60">
            RANGE {rangeReading(range.low)}…{rangeReading(range.high)} · ESC TO CLEAR
          </div>
        </div>
      ) : cursor ? (
        <div
          className={`pointer-events-none absolute right-1 top-1 border px-2 py-1 font-mono text-[9px] leading-relaxed ${skin.readout}`}
        >
          <div>{formatTick(cursor.tick)}</div>
          <div className="tabular-nums">{reading(cursor.value)}</div>
          {hoverDetail?.(cursor)}
          {rangeSelection && <div className="opacity-60">DRAG TO COMPARE</div>}
        </div>
      ) : null}
      <p className="sr-only">{summary}</p>
    </div>
  )
}
