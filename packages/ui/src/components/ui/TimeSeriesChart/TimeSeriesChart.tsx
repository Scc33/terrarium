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
 * them is not tidiness — it is the only way a fix to the axis, the readout or
 * the accessible summary reaches every figure in the game at once.
 *
 * Geometry lives in `../../../plot`; this file paints. It knows nothing about
 * indicators, budgets or censuses: callers own the subject matter, the units,
 * the colours and the words, exactly as `DonutChart` and `StackedAreaChart` do.
 *
 * Three rules it must not break:
 *
 * 1. IT DOES NOT CLAMP. A value outside the frame extends the frame (see the
 *    y-axis note in `plot.ts`). Drawing a trace flat along a rail is the bug
 *    this component was built to end.
 * 2. IT FILLS ITS SLOT WHEN ASKED. `fill` puts the SVG in a `min-h-0 flex-1`
 *    box so a docked wall tile's bay is the height budget. Without it the SVG
 *    takes height from its viewBox ratio, which is WallTile failure mode 2 —
 *    a 400px chart in a 175px bay.
 * 3. THE RULES SIT ON TOP OF THE INK. A gridline hidden under the trace it
 *    exists to measure is decoration, so rules and labels paint after traces.
 */

import { useState, type ReactNode } from 'react'
import type { Domain } from '../../../domains'
import {
  axisDecimals,
  nearestPoint,
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
  /** frame against a fixed dial face; the axis extends past it rather than
   * clamping, and the face's own rails are ruled where it did */
  face?: Domain
  /** values the axis must contain whatever the data does */
  include?: readonly number[]
  /** breathing room as a fraction of the data span, where no face pins a rail */
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
  /** how a tick prints on the x axis — quarters or years, caller's choice */
  formatTick?: (tick: number) => string
  /** plain-language reading beside the visual, for assistive technology */
  summary: string
  /** what to say when there is not enough published record to draw */
  emptyLabel?: string
  /** a crosshair and a readout following the pointer */
  hover?: boolean
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
  face,
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
  formatTick = (t) => String(t),
  summary,
  emptyLabel = 'INSUFFICIENT HISTORY',
  hover = false,
  hoverDetail,
  overlay,
  className = '',
}: TimeSeriesChartProps) {
  const [cursor, setCursor] = useState<PlotPoint | null>(null)
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
  // the chart and an axis extended past its face can grow a digit mid-century.
  const box = { w: width, h: height, padL: 34, padR: 8, padT: 8, padB: 15 }
  const plot = timePlot(
    traces.map((t) => t.points),
    box,
    // a short strip wants fewer rules than a full figure; `niceTicks`
    // guarantees the floor of two either way
    { face, include, pad, ticks: height >= 110 ? 4 : 3 },
    xDomain,
  )
  const { y } = plot
  const yLabelX = box.padL - 4
  const baseY = height - box.padB
  // precision belongs to the scale, not the value: decided once so the axis
  // never reads `0.0, 20, 40`
  const fmt = format ?? ((v: number) => v.toFixed(axisDecimals(y)))
  const reading = formatReading ?? fmt

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!hover || !lead) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * width
    const tick = plot.x0 + ((px - box.padL) / (width - box.padL - box.padR)) * (plot.x1 - plot.x0)
    setCursor(nearestPoint(lead.points, tick))
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
        className={`block w-full ${fill ? 'min-h-0 flex-1' : ''} ${hover ? 'cursor-crosshair' : ''}`}
        onMouseMove={onMove}
        onMouseLeave={() => setCursor(null)}
        role="img"
        aria-label={summary}
      >
        <title>{summary}</title>

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

        {/* The face's own rails, where the economy left the dial. Drawn after
            the trace so the excursion is visibly ABOVE the line it crossed —
            which is the whole reading. */}
        {[
          y.faceHi === null ? null : { at: y.faceHi, label: 'DIAL LIMIT' },
          y.faceLo === null ? null : { at: y.faceLo, label: 'DIAL LIMIT' },
        ].map((rail) =>
          rail === null ? null : (
            <g key={`face-${rail.at}`} opacity="0.8">
              <line
                x1={box.padL}
                x2={width - box.padR}
                y1={plot.sy(rail.at)}
                y2={plot.sy(rail.at)}
                stroke={register === 'terminal' ? 'var(--color-terminal-alert)' : 'var(--color-dossier-warn)'}
                strokeWidth="0.8"
                strokeDasharray="4 3"
              />
              <text
                x={width - box.padR}
                y={plot.sy(rail.at) - 2.5}
                textAnchor="end"
                fontSize="7"
                fontFamily="var(--font-mono)"
                letterSpacing="0.5"
                fill={register === 'terminal' ? 'var(--color-terminal-alert)' : 'var(--color-dossier-warn)'}
              >
                {rail.label}
              </text>
            </g>
          ),
        )}

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

        {cursor && (
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
        )}
      </svg>

      {cursor && (
        <div
          className={`pointer-events-none absolute right-1 top-1 border px-2 py-1 font-mono text-[9px] leading-relaxed ${skin.readout}`}
        >
          <div>{formatTick(cursor.tick)}</div>
          <div className="tabular-nums">{reading(cursor.value)}</div>
          {hoverDetail?.(cursor)}
        </div>
      )}
      <p className="sr-only">{summary}</p>
    </div>
  )
}
