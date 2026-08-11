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
 *
 * …which is also why the readout sits in a FOOTER band, exactly where the
 * dossier gauge stamps its figure, rather than sharing one line with the
 * instrument's name. It used to share that line, and the line quietly
 * overflowed: a flex row's items floor at min-content, so once name + figures
 * no longer fit a 213 px board slot the figures simply hung off the right of
 * the tile and `WallTile`'s `overflow-hidden` sheared them away. That is the
 * fourth WallTile failure mode one level down — the tile's own COLUMN track is
 * definite, but nothing was making the header's contents respect it — and it
 * is invisible twice over, because the sheared pixels are clipped rather than
 * painted over the tile below, so the wall's vertical overflow probe reports
 * a clean screen while the numbers are gone.
 *
 * `gdp_growth` found it, being the only indicator carrying a levels string
 * (`R…/N…`), and it got worse every decade as nominal GDP grew a digit. The
 * fix is structural, not a shorter string: both bands are two-column grids
 * whose first track is `minmax(0,1fr)` and whose second is `auto`, so the
 * SUPPLEMENTARY half (the name up top, the levels below) is what truncates
 * when the century runs out of room, and the figures the player flies by are
 * never the thing that yields.
 */

import { useState } from 'react'
import type { IndicatorId, IndicatorSeries } from '@terrarium/observation'
import { gaugeDomain } from '../../domains'
import { complementReading, NAMES, readingDigits } from '../labels'
import {
  qtrLabel,
  quarterDelta,
  rollingAverage,
  shapeSeries,
  type RollingMonths,
  type ShapedPoint,
} from '../series'
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

type ChartView = 'recent' | 'all' | 'rolling3' | 'rolling6' | 'rolling12'

const CHART_VIEWS: readonly {
  view: ChartView
  label: string
  title: string
  rollingMonths?: RollingMonths
}[] = [
  { view: 'recent', label: '40Q', title: 'Raw releases from the most recent 40 quarters' },
  { view: 'all', label: 'ALL', title: 'Raw releases from the whole published history' },
  { view: 'rolling3', label: 'R3M', title: 'Rolling 3-month mean (one quarterly release)', rollingMonths: 3 },
  { view: 'rolling6', label: 'R6M', title: 'Rolling 6-month mean (two quarterly releases)', rollingMonths: 6 },
  { view: 'rolling12', label: 'R12M', title: 'Rolling 12-month mean (four quarterly releases)', rollingMonths: 12 },
]

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
  const [chartView, setChartView] = useState<ChartView>('recent')
  const allPoints = shapeSeries(series, Number.MAX_SAFE_INTEGER, now)
  if (allPoints.length < 2) return null
  const latest = allPoints[allPoints.length - 1]
  const viewIndex = CHART_VIEWS.findIndex((candidate) => candidate.view === chartView)
  const view = CHART_VIEWS[viewIndex]
  const recentCutoff = now - 40
  const points = (
    view.rollingMonths
      ? rollingAverage(allPoints, view.rollingMonths)
      : chartView === 'all'
        ? allPoints
        : allPoints.filter((point) => point.forQtr >= recentCutoff)
  ).filter((point) => chartView === 'all' || point.forQtr >= recentCutoff)
  // The phosphor register is the SAME quantity better measured (see the module
  // note), so it keeps exactly one digit more than the brass one rather than a
  // fixed two: a rate reads 6.21 against the gauge's 6.2, and an index past a
  // thousand reads 992.7 against the gauge's 993 instead of claiming 992.70 on
  // a confessed ±12.5 band. Graduating an instrument must not restate its
  // precision — that is a number the player has to relearn.
  const digits = readingDigits(latest.value) + 1
  const complement = complementReading(indicator, latest.value, digits)

  const chartLatest = points[points.length - 1]
  const x0 = points[0]?.forQtr ?? Math.max(0, latest.forQtr - 4)
  const x1 = Math.max(chartLatest?.forQtr ?? latest.forQtr, x0 + 4)
  // the same fixed face the dossier gauge prints — the axis does not move
  // under the trace as the window rolls
  const { lo, hi } = gaugeDomain(
    indicator,
    series.points.map((p) => p.value),
  )

  const sx = (q: number) => PAD_L + ((q - x0) / (x1 - x0)) * (W - PAD_L - PAD_R)
  const clampY = (v: number) => Math.min(hi, Math.max(lo, v))
  const sy = (v: number) => PAD_T + ((hi - clampY(v)) / (hi - lo)) * (H - PAD_T - PAD_B)
  const line = points.length >= 2
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.forQtr).toFixed(1)},${sy(p.value).toFixed(1)}`).join(' ')
    : null
  const banded = points.filter((p) => p.errorBand > 0)
  const band =
    banded.length >= 2
      ? banded.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.forQtr).toFixed(1)},${sy(p.value + p.errorBand).toFixed(1)}`).join(' ') +
        [...banded].reverse().map((p) => `L${sx(p.forQtr).toFixed(1)},${sy(p.value - p.errorBand).toFixed(1)}`).join(' ') +
        'Z'
      : null
  const zeroVisible = lo < 0 && hi > 0
  const chartSummary = `${NAMES[indicator].plate}. ${view.title}. The readout below remains the latest raw published figure.`

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

  // Both bands: `minmax(0,1fr)` for the half that may truncate, `auto` for the
  // half that must not. Spelled out as literals — Tailwind scans source text,
  // so an interpolated track exists in the DOM and in no stylesheet.
  //
  // The padding and gap are tight on purpose. At 1280×720 a board slot leaves
  // the name ~154 px once the window toggle is paid for, and `GOV/PRIVATE
  // DEMAND %` — the longest name in `NAMES` — wants 150 of them. At the old
  // `gap-2 px-2.5` it ellipsised its own unit away. See the budget noted on
  // `IndicatorNames.terminal`.
  const BAND = 'grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-1.5 px-2 py-1'

  const header = (
    <div className={`${BAND} border-b border-terminal-grid`} title={NAMES[indicator].note}>
      <span className="truncate font-mono text-[10px] font-medium tracking-[0.15em] text-terminal-primary">
        {NAMES[indicator].terminal}
      </span>
      <button
        type="button"
        onClick={() => setChartView(CHART_VIEWS[(viewIndex + 1) % CHART_VIEWS.length].view)}
        title={`${view.title}. Click to cycle 40Q, ALL, R3M, R6M and R12M.`}
        aria-label={`Chart view: ${view.title}. Click to cycle chart views.`}
        className="border border-terminal-grid px-1 font-mono text-[8px] text-terminal-primary/70 hover:text-terminal-primary"
      >
        {view.label}
      </button>
    </div>
  )

  const footer = (
    <div
      className={`${BAND} border-t border-terminal-grid font-mono text-[10px] tabular-nums text-terminal-primary`}
      title="The latest published figure, its confessed error band, and the change since the previous print."
    >
      {latest.levels ? (
        <span
          className="truncate opacity-70"
          title="Estimated GDP level behind the growth print: Real (base-year prices) / Nominal (current prices)."
        >
          R{latest.levels.real.toFixed(0)}/N{latest.levels.nominal.toFixed(0)}
        </span>
      ) : (
        <span className="truncate opacity-60">{complement}</span>
      )}
      <span className="whitespace-nowrap">
        {latest.value.toFixed(digits)}
        {latest.errorBand > 0 && <span className="opacity-60">±{latest.errorBand.toFixed(1)}</span>}
        {(() => {
          const d = quarterDelta(allPoints)
          if (d === null || Math.abs(d) < Math.pow(10, -digits) / 2) return null
          return (
            <span className="ml-1.5 opacity-80">
              {d > 0 ? '▲' : '▼'}
              {Math.abs(d).toFixed(digits)}
            </span>
          )
        })()}
        <span className="terminal-cursor">▮</span>
      </span>
    </div>
  )

  return (
    <WallTile className="border border-terminal-grid bg-terminal-bg" header={header} footer={footer}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full cursor-crosshair"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={chartSummary}
        >
          <title>{chartSummary}</title>
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
            {qtrLabel(chartLatest?.forQtr ?? latest.forQtr)}
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
          {line ? (
            <path d={line} fill="none" stroke="var(--color-terminal-primary)" strokeWidth="1.6" strokeLinejoin="round" />
          ) : (
            <text
              x={W / 2}
              y={H / 2}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fill="var(--color-terminal-primary)"
              opacity="0.6"
            >
              {view.rollingMonths ? `${view.rollingMonths}M AVG NEEDS MORE HISTORY` : 'INSUFFICIENT HISTORY'}
            </text>
          )}
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
            {view.rollingMonths && <div className="opacity-60">{view.rollingMonths}M ROLLING AVG</div>}
            <div>
              {hover.value.toFixed(digits)}
              {hover.errorBand > 0 ? ` ±${hover.errorBand.toFixed(1)}` : ''}
            </div>
            {hover.visiblyRevised ? (
              <div className="text-terminal-alert">
                <s>{hover.firstPrint.toFixed(digits)}</s> REVISED
              </div>
            ) : (
              <div className="opacity-60">{hover.revision >= 2 ? 'FINAL' : `PRINT ${hover.revision + 1}`}</div>
            )}
          </div>
        )}
    </WallTile>
  )
}
