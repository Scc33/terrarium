/**
 * Terminal-era instrument: dense phosphor line on near-black, tight bands,
 * live-feeling readout. Superseded first prints stay on screen with a
 * strikethrough beside the reprint — the machine remembers what it told you.
 * No shadows, no gradients, no rounding: hairlines only.
 */

import { useState } from 'react'
import type { IndicatorId, IndicatorSeries } from '@terrarium/observation'
import { qtrLabel, shapeSeries, type ShapedPoint } from './series'

const LABELS: Record<IndicatorId, string> = {
  gdp_growth: 'GDP.GROWTH %/YR',
  inflation: 'CPI.INFL %/YR',
  unemployment: 'UNEMP %',
}

const W = 300
const H = 104
const PAD_L = 34
const PAD_R = 8
const PAD_T = 8
const PAD_B = 14

export function TerminalTicker({
  indicator,
  series,
  now,
}: {
  indicator: IndicatorId
  series: IndicatorSeries
  now: number
}) {
  const [hover, setHover] = useState<ShapedPoint | null>(null)
  const points = shapeSeries(series, 40, now)
  if (points.length < 2) return null
  const latest = points[points.length - 1]

  const x0 = points[0].forQtr
  const x1 = Math.max(latest.forQtr, x0 + 4)
  const values = points.flatMap((p) => [p.value - p.errorBand, p.value + p.errorBand, p.firstPrint])
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (hi - lo < 2) {
    const mid = (hi + lo) / 2
    lo = mid - 1
    hi = mid + 1
  }
  const pad = (hi - lo) * 0.1
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

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * W
    let best: ShapedPoint | null = null
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
    <div className="flex h-full flex-col border border-terminal-grid bg-terminal-bg">
      <div className="flex items-baseline justify-between border-b border-terminal-grid px-2.5 py-1">
        <span className="font-mono text-[10px] font-medium tracking-[0.15em] text-terminal-primary">
          {LABELS[indicator]}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-terminal-primary">
          {latest.value.toFixed(2)}
          {latest.errorBand > 0 && <span className="opacity-60">±{latest.errorBand.toFixed(1)}</span>}
          <span className="terminal-cursor">▮</span>
        </span>
      </div>
      <div className="relative flex-1">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full cursor-crosshair" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {/* hairline frame + zero line */}
          <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={H - PAD_B} stroke="var(--color-terminal-grid)" strokeWidth="1" />
          <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} stroke="var(--color-terminal-grid)" strokeWidth="1" />
          {zeroVisible && (
            <line x1={PAD_L} x2={W - PAD_R} y1={sy(0)} y2={sy(0)} stroke="var(--color-terminal-grid)" strokeWidth="1" strokeDasharray="2 3" />
          )}
          <text x={PAD_L - 4} y={sy(hi - pad) + 3} textAnchor="end" fontSize="8" fontFamily="var(--font-mono)" fill="var(--color-terminal-primary)" opacity="0.6">
            {(hi - pad).toFixed(0)}
          </text>
          <text x={PAD_L - 4} y={sy(lo + pad) + 3} textAnchor="end" fontSize="8" fontFamily="var(--font-mono)" fill="var(--color-terminal-primary)" opacity="0.6">
            {(lo + pad).toFixed(0)}
          </text>
          <text x={PAD_L} y={H - 3} fontSize="8" fontFamily="var(--font-mono)" fill="var(--color-terminal-primary)" opacity="0.55">
            {qtrLabel(x0)}
          </text>
          <text x={W - PAD_R} y={H - 3} textAnchor="end" fontSize="8" fontFamily="var(--font-mono)" fill="var(--color-terminal-primary)" opacity="0.55">
            {qtrLabel(latest.forQtr)}
          </text>

          {band && <path d={band} fill="var(--color-terminal-primary)" opacity="0.08" />}
          {/* superseded first prints: struck through, dim */}
          {points
            .filter((p) => p.visiblyRevised)
            .map((p) => (
              <g key={`rev-${p.forQtr}`} opacity="0.55">
                <line
                  x1={sx(p.forQtr) - 4}
                  x2={sx(p.forQtr) + 4}
                  y1={sy(p.firstPrint)}
                  y2={sy(p.firstPrint)}
                  stroke="var(--color-terminal-alert)"
                  strokeWidth="1.4"
                />
                <line
                  x1={sx(p.forQtr)}
                  x2={sx(p.forQtr)}
                  y1={sy(p.firstPrint)}
                  y2={sy(p.value)}
                  stroke="var(--color-terminal-alert)"
                  strokeWidth="0.7"
                  strokeDasharray="1.5 1.5"
                />
              </g>
            ))}
          <path d={line} fill="none" stroke="var(--color-terminal-primary)" strokeWidth="1.6" strokeLinejoin="round" />
          {points.map((p) =>
            p.revision >= 2 ? (
              <circle key={p.forQtr} cx={sx(p.forQtr)} cy={sy(p.value)} r="1.6" fill="var(--color-terminal-primary)" />
            ) : (
              <rect
                key={p.forQtr}
                x={sx(p.forQtr) - 1.8}
                y={sy(p.value) - 1.8}
                width="3.6"
                height="3.6"
                fill="var(--color-terminal-bg)"
                stroke="var(--color-terminal-primary)"
                strokeWidth="0.9"
              />
            ),
          )}
          {hover && (
            <line x1={sx(hover.forQtr)} x2={sx(hover.forQtr)} y1={PAD_T} y2={H - PAD_B} stroke="var(--color-terminal-primary)" strokeWidth="0.7" opacity="0.5" />
          )}
        </svg>
        {hover && (
          <div className="pointer-events-none absolute right-1 top-1 border border-terminal-grid bg-terminal-bg px-2 py-1 font-mono text-[9px] leading-relaxed text-terminal-primary">
            <div>{qtrLabel(hover.forQtr)}</div>
            <div>
              {hover.value.toFixed(2)}
              {hover.errorBand > 0 ? ` ±${hover.errorBand.toFixed(1)}` : ''}
            </div>
            {hover.visiblyRevised ? (
              <div className="text-terminal-alert">
                <s>{hover.firstPrint.toFixed(2)}</s> REVISED
              </div>
            ) : (
              <div className="opacity-60">{hover.revision >= 2 ? 'FINAL' : `PRINT ${hover.revision + 1}`}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
