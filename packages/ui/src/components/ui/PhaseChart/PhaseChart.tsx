/**
 * Two measured series plotted against each other, with a shaded corner.
 *
 * The one figure in the game whose x axis is not time. It exists because the
 * banking-crisis hazard is a PRODUCT of two excesses, and a product cannot be
 * read off two time charts side by side: high borrowing with cheap assets and
 * dear assets with no borrowing draw identically alarming lines, and neither
 * is dangerous. Against each other they land in different corners, and only
 * one corner is shaded.
 *
 * The decision to have this figure at all, and the four alternatives it beat,
 * is ADR-0026.
 *
 * Like `TimeSeriesChart` it knows nothing about its subject — it takes
 * coordinates, thresholds and words, and the caller owns what they mean.
 * Geometry is in `../../../plot`; this file paints. It follows the same three
 * rules that component states, with the middle one adapted:
 *
 * 1. IT DOES NOT CLAMP. Both axes come from the displayed record plus the
 *    anchors the caller passes through `includeX`/`includeY` (ADR-0025). A
 *    position outside the drawn face is a bug in the caller's anchors, never
 *    something to quietly pull back to a rail.
 * 2. IT IS SQUARE BY DEFAULT AND SIZED BY ITS SLOT. The viewBox is fixed and
 *    `preserveAspectRatio` letterboxes it; callers give it a definite box.
 * 3. THE CORNER SITS UNDER THE INK AND THE RULES SIT OVER IT. The shaded
 *    region is terrain, the trail is the measurement, and the threshold rules
 *    have to stay legible where the trail crosses them.
 */

import { useRef, useState, type PointerEvent } from 'react'
import { axisDecimals, phasePlot, type PhasePoint } from '../../../plot'

export interface PhaseChartProps {
  points: readonly PhasePoint[]
  /** the shaded corner's lower-left origin, in data units */
  corner?: { x: number; y: number }
  cornerLabel?: string
  /** values each axis must contain whatever the data does */
  includeX?: readonly number[]
  includeY?: readonly number[]
  labelX: string
  labelY: string
  /** how a value prints; defaults to a precision taken from the gridline step */
  formatX?: (value: number) => string
  formatY?: (value: number) => string
  /** what to call one point in the readout — a quarter, a year */
  formatPoint?: (point: PhasePoint) => string
  width?: number
  height?: number
  /** fill a definite-height parent instead of taking height from the viewBox */
  fill?: boolean
  summary: string
  emptyLabel?: string
  className?: string
}

const n1 = (x: number) => x.toFixed(1)

/** Narrower than this and the corner label would overrun its own region and
 * cross the threshold rule. Sized for the longest label in use at 8px mono
 * with 1px tracking ("CRISIS RISK", 11 characters). */
const CORNER_LABEL_MIN_W = 62

export function PhaseChart({
  points,
  corner,
  cornerLabel,
  includeX = [],
  includeY = [],
  labelX,
  labelY,
  formatX,
  formatY,
  formatPoint = (p) => String(p.tick),
  width = 340,
  height = 300,
  fill = false,
  summary,
  emptyLabel = 'INSUFFICIENT HISTORY',
  className = '',
}: PhaseChartProps) {
  const [cursor, setCursor] = useState<PhasePoint | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  if (points.length < 2) {
    return (
      <div
        className={`flex min-h-14 items-center justify-center border border-dashed border-dossier-ink/20 font-mono text-[9px] tracking-[0.12em] text-dossier-ink/55 ${fill ? 'h-full' : ''} ${className}`}
      >
        {emptyLabel}
      </div>
    )
  }

  // Left padding carries the y labels, bottom padding two lines: the x labels
  // and the axis caption under them.
  const box = { w: width, h: height, padL: 38, padR: 10, padT: 10, padB: 30 }
  const plot = phasePlot(
    points,
    box,
    { include: [...includeX, ...(corner ? [corner.x] : [])], pad: 0.08, ticks: 4 },
    { include: [...includeY, ...(corner ? [corner.y] : [])], pad: 0.08, ticks: 4 },
  )
  const fmtX = formatX ?? ((v: number) => v.toFixed(axisDecimals(plot.x)))
  const fmtY = formatY ?? ((v: number) => v.toFixed(axisDecimals(plot.y)))

  const trail = plot.path(points)
  const latest = [...points].sort((a, b) => a.tick - b.tick)[points.length - 1]
  const danger = corner ? plot.corner(corner.x, corner.y) : null
  const baseY = height - box.padB

  const nearest = (px: number, py: number): PhasePoint | null => {
    let best: PhasePoint | null = null
    let bestD = Infinity
    for (const p of points) {
      const dx = plot.sx(p.x) - px
      const dy = plot.sy(p.y) - py
      const d = dx * dx + dy * dy
      if (d < bestD) {
        bestD = d
        best = p
      }
    }
    return best
  }

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const ctm = svg.getScreenCTM()
    let px: number | null = null
    let py: number | null = null
    if (ctm) {
      try {
        const point = svg.createSVGPoint()
        point.x = e.clientX
        point.y = e.clientY
        const local = point.matrixTransform(ctm.inverse())
        px = local.x
        py = local.y
      } catch {
        // detached or partially implemented matrix — fall through to the rect
      }
    }
    if (px === null || py === null) {
      const rect = svg.getBoundingClientRect()
      const scale = Math.min(rect.width / width, rect.height / height)
      if (!(scale > 0)) return
      px = (e.clientX - rect.left - (rect.width - width * scale) / 2) / scale
      py = (e.clientY - rect.top - (rect.height - height * scale) / 2) / scale
    }
    setCursor(nearest(px, py))
  }

  const shown = cursor ?? latest

  return (
    <div className={`relative ${fill ? 'flex h-full min-h-0 flex-col' : ''} ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className={`block w-full cursor-crosshair ${fill ? 'min-h-0 flex-1' : ''}`}
        onPointerMove={onMove}
        onPointerLeave={() => setCursor(null)}
        role="img"
        aria-label={summary}
      >
        {/* the danger corner is terrain: under every measured thing */}
        {danger && (
          <rect
            x={danger.x}
            y={danger.y}
            width={danger.w}
            height={danger.h}
            fill="var(--color-dossier-warn)"
            opacity="0.12"
          />
        )}

        {plot.x.ticks.map((v) => (
          <line
            key={`gx-${v}`}
            x1={plot.sx(v)}
            x2={plot.sx(v)}
            y1={box.padT}
            y2={baseY}
            stroke="var(--color-dossier-ink)"
            strokeWidth="0.5"
            opacity="0.12"
          />
        ))}
        {plot.y.ticks.map((v) => (
          <line
            key={`gy-${v}`}
            x1={box.padL}
            x2={width - box.padR}
            y1={plot.sy(v)}
            y2={plot.sy(v)}
            stroke="var(--color-dossier-ink)"
            strokeWidth="0.5"
            opacity="0.12"
          />
        ))}

        {trail && (
          <path
            d={trail}
            fill="none"
            stroke="var(--color-dossier-ink)"
            strokeWidth="1"
            strokeLinejoin="round"
            opacity="0.5"
          />
        )}

        {/* the threshold rules, over the trail that crosses them */}
        {danger && corner && (
          <>
            <line
              x1={plot.sx(corner.x)}
              x2={plot.sx(corner.x)}
              y1={box.padT}
              y2={baseY}
              stroke="var(--color-dossier-warn)"
              strokeWidth="1"
              strokeDasharray="3 2"
              opacity="0.8"
            />
            <line
              x1={box.padL}
              x2={width - box.padR}
              y1={plot.sy(corner.y)}
              y2={plot.sy(corner.y)}
              stroke="var(--color-dossier-warn)"
              strokeWidth="1"
              strokeDasharray="3 2"
              opacity="0.8"
            />
            {/* The label goes INSIDE the region it names, and only when the
                region is wide enough to hold it. Right-aligning it to the
                plot edge unconditionally puts the text across the vertical
                rail whenever the country is far from the threshold — which
                is most of the time, and is exactly when the figure is most
                often looked at. The shading and the two rules carry the
                meaning on their own; `summary` always carries the words. */}
            {cornerLabel && danger.w >= CORNER_LABEL_MIN_W && (
              <text
                x={width - box.padR - 4}
                y={box.padT + 10}
                textAnchor="end"
                className="font-mono"
                fontSize="8"
                letterSpacing="1"
                fill="var(--color-dossier-warn)"
                opacity="0.85"
              >
                {cornerLabel}
              </text>
            )}
          </>
        )}

        {/* where the country stands now, and where the cursor is reading */}
        <circle cx={plot.sx(latest.x)} cy={plot.sy(latest.y)} r="3.5" fill="var(--color-dossier-felt)" />
        {cursor && cursor.tick !== latest.tick && (
          <circle
            cx={plot.sx(cursor.x)}
            cy={plot.sy(cursor.y)}
            r="2.5"
            fill="none"
            stroke="var(--color-dossier-ink)"
            strokeWidth="1"
          />
        )}

        {/* axes */}
        <line x1={box.padL} x2={box.padL} y1={box.padT} y2={baseY} stroke="var(--color-dossier-ink)" strokeWidth="0.5" opacity="0.4" />
        <line x1={box.padL} x2={width - box.padR} y1={baseY} y2={baseY} stroke="var(--color-dossier-ink)" strokeWidth="0.5" opacity="0.4" />

        {plot.x.ticks.map((v) => (
          <text
            key={`lx-${v}`}
            x={plot.sx(v)}
            y={baseY + 10}
            textAnchor="middle"
            className="font-mono"
            fontSize="8"
            fill="var(--color-dossier-ink)"
            opacity="0.6"
          >
            {fmtX(v)}
          </text>
        ))}
        {plot.y.ticks.map((v) => (
          <text
            key={`ly-${v}`}
            x={box.padL - 4}
            y={plot.sy(v) + 3}
            textAnchor="end"
            className="font-mono"
            fontSize="8"
            fill="var(--color-dossier-ink)"
            opacity="0.6"
          >
            {fmtY(v)}
          </text>
        ))}

        <text
          x={box.padL + (width - box.padL - box.padR) / 2}
          y={height - 6}
          textAnchor="middle"
          className="font-mono"
          fontSize="8"
          letterSpacing="1.2"
          fill="var(--color-dossier-ink)"
          opacity="0.55"
        >
          {labelX}
        </text>
        <text
          x={10}
          y={box.padT + (baseY - box.padT) / 2}
          textAnchor="middle"
          transform={`rotate(-90 10 ${n1(box.padT + (baseY - box.padT) / 2)})`}
          className="font-mono"
          fontSize="8"
          letterSpacing="1.2"
          fill="var(--color-dossier-ink)"
          opacity="0.55"
        >
          {labelY}
        </text>
      </svg>

      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 font-mono text-[9px] tabular-nums text-dossier-ink/70">
        <span className="tracking-[0.12em]">{formatPoint(shown)}</span>
        <span>
          {fmtX(shown.x)} · {fmtY(shown.y)}
        </span>
      </div>
    </div>
  )
}
