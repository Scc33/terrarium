/**
 * A single published-indicator chart. Solid dots are final figures; hollow
 * dots are prints still subject to revision; the shaded band is the
 * statistical office's own confessed uncertainty (shown only once it is
 * competent enough to estimate one).
 */

import { useMemo, useState } from 'react'
import type { IndicatorSeries } from '@terrarium/observation'

interface Props {
  series: IndicatorSeries
  color: string
  now: number
  windowQtrs?: number
}

interface PlotPoint {
  forQtr: number
  value: number
  errorBand: number
  final: boolean
  revision: number
  lag: number
}

const W = 340
const H = 128
const PAD_L = 44
const PAD_R = 12
const PAD_T = 12
const PAD_B = 22

const qtrLabel = (q: number) => `${1946 + Math.floor(q / 4)} Q${(q % 4) + 1}`

export function LineChart({ series, color, now, windowQtrs = 48 }: Props) {
  const [hover, setHover] = useState<PlotPoint | null>(null)

  const points = useMemo(() => {
    // latest available print per measured quarter
    const byQtr = new Map<number, PlotPoint>()
    for (const p of series.points) {
      const cur = byQtr.get(p.forQtr)
      if (!cur || p.revision > cur.revision) {
        byQtr.set(p.forQtr, {
          forQtr: p.forQtr,
          value: p.value,
          errorBand: p.errorBand,
          final: p.revision >= 2,
          revision: p.revision,
          lag: p.publishedAt - p.forQtr,
        })
      }
    }
    return [...byQtr.values()]
      .filter((p) => p.forQtr >= now - windowQtrs)
      .sort((a, b) => a.forQtr - b.forQtr)
  }, [series, now, windowQtrs])

  if (points.length < 2) {
    return <div className="fine">Too little published data to plot yet.</div>
  }

  const x0 = points[0].forQtr
  const x1 = Math.max(points[points.length - 1].forQtr, x0 + 4)
  const values = points.flatMap((p) => [p.value - p.errorBand, p.value + p.errorBand])
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (hi - lo < 2) {
    const mid = (hi + lo) / 2
    lo = mid - 1
    hi = mid + 1
  }
  const pad = (hi - lo) * 0.12
  lo -= pad
  hi += pad

  const sx = (q: number) => PAD_L + ((q - x0) / (x1 - x0)) * (W - PAD_L - PAD_R)
  const sy = (v: number) => PAD_T + ((hi - v) / (hi - lo)) * (H - PAD_T - PAD_B)

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.forQtr).toFixed(1)},${sy(p.value).toFixed(1)}`).join(' ')
  const banded = points.filter((p) => p.errorBand > 0)
  const band =
    banded.length >= 2
      ? banded.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.forQtr).toFixed(1)},${sy(p.value + p.errorBand).toFixed(1)}`).join(' ') +
        [...banded].reverse().map((p) => `L${sx(p.forQtr).toFixed(1)},${sy(p.value - p.errorBand).toFixed(1)}`).join(' ') +
        'Z'
      : null

  const zeroVisible = lo < 0 && hi > 0
  const latest = points[points.length - 1]

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * W
    let best: PlotPoint | null = null
    let bestD = Infinity
    for (const p of points) {
      const d = Math.abs(sx(p.forQtr) - mx)
      if (d < bestD) {
        bestD = d
        best = p
      }
    }
    setHover(best)
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* recessive frame */}
        {zeroVisible && (
          <line x1={PAD_L} x2={W - PAD_R} y1={sy(0)} y2={sy(0)} stroke="rgba(2,24,43,0.25)" strokeWidth="1" strokeDasharray="1 3" />
        )}
        <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={H - PAD_B} stroke="rgba(2,24,43,0.15)" strokeWidth="1" />
        <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} stroke="rgba(2,24,43,0.15)" strokeWidth="1" />
        {/* y extremes */}
        <text x={PAD_L - 6} y={sy(hi - pad) + 3} textAnchor="end" fontSize="9" fontFamily="var(--mono)" fill="rgba(2,24,43,0.5)">
          {(hi - pad).toFixed(1)}
        </text>
        <text x={PAD_L - 6} y={sy(lo + pad) + 3} textAnchor="end" fontSize="9" fontFamily="var(--mono)" fill="rgba(2,24,43,0.5)">
          {(lo + pad).toFixed(1)}
        </text>
        {/* x extremes */}
        <text x={PAD_L} y={H - 8} fontSize="9" fontFamily="var(--mono)" fill="rgba(2,24,43,0.5)">
          {qtrLabel(x0)}
        </text>
        <text x={W - PAD_R} y={H - 8} textAnchor="end" fontSize="9" fontFamily="var(--mono)" fill="rgba(2,24,43,0.5)">
          {qtrLabel(points[points.length - 1].forQtr)}
        </text>

        {band && <path d={band} fill={color} opacity="0.09" />}
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p) =>
          p.final ? (
            <circle key={p.forQtr} cx={sx(p.forQtr)} cy={sy(p.value)} r="2.2" fill={color} />
          ) : (
            <circle key={p.forQtr} cx={sx(p.forQtr)} cy={sy(p.value)} r="2.6" fill="var(--paper)" stroke={color} strokeWidth="1.2" />
          ),
        )}

        {/* direct label on the latest print */}
        <text
          x={Math.min(sx(latest.forQtr) + 6, W - PAD_R)}
          y={sy(latest.value) - 7}
          textAnchor="end"
          fontSize="11"
          fontFamily="var(--mono)"
          fill={color}
        >
          {latest.value.toFixed(1)}
        </text>

        {hover && (
          <line x1={sx(hover.forQtr)} x2={sx(hover.forQtr)} y1={PAD_T} y2={H - PAD_B} stroke="rgba(2,24,43,0.3)" strokeWidth="1" />
        )}
      </svg>

      {hover && (
        <div
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            background: 'var(--paper)',
            border: '1px solid rgba(2,24,43,0.2)',
            padding: '6px 10px',
            fontSize: 11,
            fontFamily: 'var(--mono)',
            pointerEvents: 'none',
            lineHeight: 1.6,
          }}
        >
          <div>{qtrLabel(hover.forQtr)}</div>
          <div style={{ color }}>
            {hover.value.toFixed(2)} {series.unit}
            {hover.errorBand > 0 ? ` ± ${hover.errorBand.toFixed(1)}` : ''}
          </div>
          <div style={{ opacity: 0.55 }}>
            {hover.final ? 'final figure' : `print ${hover.revision + 1}, may revise`} · {hover.lag}q lag
          </div>
        </div>
      )}
    </div>
  )
}
