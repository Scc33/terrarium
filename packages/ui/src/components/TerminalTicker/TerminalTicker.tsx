/**
 * Terminal-era instrument: dense phosphor line on near-black, tight bands,
 * live-feeling readout. Superseded first prints stay on screen with a
 * strikethrough beside the reprint — the machine remembers what it told you.
 * No shadows, no gradients, no rounding: hairlines only.
 *
 * Shares the dossier gauge's two structural rules: it fits its box by
 * construction (fixed header row, flexing `overflow-hidden` chart row, SVG
 * scaled with `preserveAspectRatio`), and it reads the same fixed face from
 * `../domains`. That second one matters more than it looks — an indicator
 * graduating from brass to phosphor should be the same quantity better
 * measured, not a different-shaped chart the player has to relearn.
 */

import { useState } from 'react'
import type { IndicatorId, IndicatorSeries } from '@terrarium/observation'
import { gaugeDomain } from '../../domains'
import { NAMES } from '../labels'
import { qtrLabel, quarterDelta, shapeSeries, type ShapedPoint } from '../series'
import { WallTile } from '../WallTile/WallTile'

// The viewBox aspect is chosen to match a board slot, not to be a tidy
// number. The SVG scales with `preserveAspectRatio="meet"`, so a wide, short
// viewBox in a tall bay letterboxes — a 104-unit chart left the bottom 40%
// of a terminal tile as empty black, which is the opposite of the dense
// readout the phosphor era is supposed to be. `none` is not the fix: it would
// stretch the axis labels along with the trace.
const W = 300
const H = 300
const PAD_L = 34
const PAD_R = 8
const PAD_T = 10
const PAD_B = 18

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
  const [fullHistory, setFullHistory] = useState(false)
  const points = shapeSeries(series, fullHistory ? Number.MAX_SAFE_INTEGER : 40, now)
  if (points.length < 2) return null
  const latest = points[points.length - 1]

  const x0 = points[0].forQtr
  const x1 = Math.max(latest.forQtr, x0 + 4)
  // the same fixed face the dossier gauge prints — the axis does not move
  // under the trace as the window rolls
  const { lo, hi } = gaugeDomain(
    indicator,
    series.points.map((p) => p.value),
  )

  const sx = (q: number) => PAD_L + ((q - x0) / (x1 - x0)) * (W - PAD_L - PAD_R)
  const clampY = (v: number) => Math.min(hi, Math.max(lo, v))
  const sy = (v: number) => PAD_T + ((hi - clampY(v)) / (hi - lo)) * (H - PAD_T - PAD_B)
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
    <WallTile
      className="border border-terminal-grid bg-terminal-bg"
      header={
      <div className="flex items-baseline justify-between gap-2 border-b border-terminal-grid px-2.5 py-1">
        <span className="flex items-baseline gap-2 font-mono text-[10px] font-medium tracking-[0.15em] text-terminal-primary">
          {NAMES[indicator].terminal}
          <button
            onClick={() => setFullHistory((v) => !v)}
            title="Toggle between the recent window and the whole published history"
            className="border border-terminal-grid px-1 text-[8px] tracking-normal text-terminal-primary/70 hover:text-terminal-primary"
          >
            {fullHistory ? 'ALL' : '40Q'}
          </button>
        </span>
        <span className="font-mono text-[10px] tabular-nums text-terminal-primary">
          {latest.levels && (
            <span
              className="mr-2 opacity-70"
              title="Estimated GDP level behind the growth print: Real (base-year prices) / Nominal (current prices)."
            >
              R{latest.levels.real.toFixed(0)}/N{latest.levels.nominal.toFixed(0)}
            </span>
          )}
          {latest.value.toFixed(2)}
          {latest.errorBand > 0 && <span className="opacity-60">±{latest.errorBand.toFixed(1)}</span>}
          {(() => {
            const d = quarterDelta(points)
            if (d === null || Math.abs(d) < 0.005) return null
            return (
              <span className="ml-1.5 opacity-80">
                {d > 0 ? '▲' : '▼'}
                {Math.abs(d).toFixed(2)}
              </span>
            )
          })()}
          <span className="terminal-cursor">▮</span>
        </span>
      </div>
      }
    >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full cursor-crosshair"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* hairline frame + zero line */}
          <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={H - PAD_B} stroke="var(--color-terminal-grid)" strokeWidth="1" />
          <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} stroke="var(--color-terminal-grid)" strokeWidth="1" />
          {zeroVisible && (
            <line x1={PAD_L} x2={W - PAD_R} y1={sy(0)} y2={sy(0)} stroke="var(--color-terminal-grid)" strokeWidth="1" strokeDasharray="2 3" />
          )}
          <text x={PAD_L - 4} y={sy(hi) + 6} textAnchor="end" fontSize="8" fontFamily="var(--font-mono)" fill="var(--color-terminal-primary)" opacity="0.6">
            {hi}
          </text>
          <text x={PAD_L - 4} y={sy(lo)} textAnchor="end" fontSize="8" fontFamily="var(--font-mono)" fill="var(--color-terminal-primary)" opacity="0.6">
            {lo}
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
    </WallTile>
  )
}
