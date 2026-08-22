/**
 * Terminal-era instrument: dense phosphor line on near-black, tight bands,
 * live-feeling readout. Superseded first prints stay on screen with a
 * strikethrough beside the reprint — the machine remembers what it told you.
 * No shadows, no gradients, no rounding: hairlines only.
 *
 * It shares the dossier gauge's fitted-box construction (fixed header row,
 * flexing `overflow-hidden` chart row, SVG scaled with
 * `preserveAspectRatio`), but not its fixed face. A dial's position must keep
 * the same meaning forever; this chart prints its own axis and scales the
 * record on screen. Borrowing the dial face produced the orange DIAL LIMIT
 * rail players quite reasonably read as a chart constraint. ADR-0024 keeps
 * the two instruments separate while retaining the no-clamp guarantee.
 *
 * The geometry and the painting both live one level down now — `../../plot`
 * for the scales, `../ui/TimeSeriesChart` for the ink. What stays here is
 * what only this instrument knows: which window is on screen, the phosphor
 * era's extra digit, and the strike marks over superseded first prints.
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
import { FACE_MARK } from '../../domains'
import { complementReading, NAMES, readingDigits } from '../labels'
import {
  qtrLabel,
  quarterDelta,
  rollingAverage,
  shapeSeries,
  type RollingMonths,
  type ShapedPoint,
} from '../series'
import { TimeSeriesChart, Tooltip, TooltipLabel } from '../ui'
import { WallTile } from '../WallTile/WallTile'

// The viewBox aspect is chosen to match a board slot, not to be a tidy
// number. The SVG scales with `preserveAspectRatio="meet"`, so a wide, short
// viewBox in a tall bay letterboxes — a 104-unit chart left the bottom 40%
// of a terminal tile as empty black, which is the opposite of the dense
// readout the phosphor era is supposed to be. `none` is not the fix: it would
// stretch the axis labels along with the trace.
const W = 300
const H = 300

/** the plot's own points, carrying the shaped print they came from so the
 * hover readout can speak about revisions rather than just a number */
type TickerPoint = ShapedPoint & { tick: number }

/** Base-year references that are part of the quantity, not the gauge face.
 * FACE_MARK supplies rule/threshold references such as zero or the frontier;
 * these six series additionally define 100 as their inherited 1946 level. */
const INDEX_BASELINE: Partial<Record<IndicatorId, { at: number; label: string }>> = {
  price_food: { at: 100, label: '1946 BASE' },
  price_fuel: { at: 100, label: '1946 BASE' },
  productivity: { at: 100, label: '1946 BASE' },
  income_real: { at: 100, label: '1946 BASE' },
  terms_of_trade: { at: 100, label: '1946 BASE' },
  asset_prices: { at: 100, label: '1946 BASE' },
}

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

  const plotted: TickerPoint[] = points.map((p) => ({ ...p, tick: p.forQtr }))
  // A known baseline or threshold is subject-matter context, not a borrowed
  // dial rail. Keep it on the analytical scale even when the displayed record
  // lies wholly to one side: 100 for a base-year index or frontier, zero for a
  // signed rate, and the rule line for the remaining marked instruments.
  const reference = FACE_MARK[indicator] ?? INDEX_BASELINE[indicator] ?? null
  // Superseded first prints are still painted as strike marks. They therefore
  // belong to the scale just as much as the current trace and its error band;
  // otherwise an unusually large revision can be clipped outside the SVG.
  const scaleAnchors = [
    ...(reference === null ? [] : [reference.at]),
    ...plotted.filter((point) => point.visiblyRevised).map((point) => point.firstPrint),
  ]
  const banded = plotted.filter((p) => p.errorBand > 0).map((p) => ({ ...p, band: p.errorBand }))
  const chartSummary = `${NAMES[indicator].plate}. ${view.title}. Drag across the chart to compare two releases. The readout below remains the latest raw published figure.`

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
    <div className={`${BAND} border-b border-terminal-grid`}>
      <TooltipLabel label={NAMES[indicator].plate} content={NAMES[indicator].note} className="truncate font-mono text-[10px] font-medium tracking-[0.15em] text-terminal-primary">
        {NAMES[indicator].terminal}
      </TooltipLabel>
      <Tooltip content={`${view.title}. Select to cycle 40Q, ALL, R3M, R6M and R12M.`}>
        <button
          type="button"
          onClick={() => setChartView(CHART_VIEWS[(viewIndex + 1) % CHART_VIEWS.length].view)}
          aria-label={`Chart view: ${view.title}. Select to cycle 40Q, ALL, R3M, R6M and R12M.`}
          className="border border-terminal-grid px-1 font-mono text-[8px] text-terminal-primary/70 hover:text-terminal-primary"
        >
          {view.label}
        </button>
      </Tooltip>
    </div>
  )

  const footerHelp = latest.levels
    ? 'R is output after price rises are removed; N is output at current prices. The right side is the latest growth reading, its uncertainty and its change.'
    : 'The left side is the matching share. The right side is the latest reading, its uncertainty and its change.'
  const footer = (
    <Tooltip content={footerHelp}>
      <div tabIndex={0} className={`${BAND} border-t border-terminal-grid font-mono text-[10px] tabular-nums text-terminal-primary focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-terminal-primary`}>
        {latest.levels ? (
          <span className="truncate opacity-70">
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
    </Tooltip>
  )

  return (
    <WallTile className="border border-terminal-grid bg-terminal-bg" header={header} footer={footer}>
      <TimeSeriesChart
        register="terminal"
        width={W}
        height={H}
        fill
        traces={[{ key: indicator, points: plotted, width: 1.6, lead: true }]}
        ribbon={banded.length >= 2 ? { points: banded } : undefined}
        include={scaleAnchors}
        pad={0.08}
        rules={reference === null ? [] : [{ axis: 'y', at: reference.at, label: reference.label }]}
        formatReading={(v) => v.toFixed(digits)}
        formatRange={(v) => v.toFixed(digits)}
        formatTick={qtrLabel}
        summary={chartSummary}
        emptyLabel={
          view.rollingMonths ? `${view.rollingMonths}M AVG NEEDS MORE HISTORY` : 'INSUFFICIENT HISTORY'
        }
        hover
        hoverDetail={(point) => {
          const p = point as TickerPoint
          return (
            <>
              {view.rollingMonths && <div className="opacity-60">{view.rollingMonths}M ROLLING AVG</div>}
              {p.errorBand > 0 && <div className="opacity-60">±{p.errorBand.toFixed(1)}</div>}
              {p.visiblyRevised ? (
                <div className="text-terminal-alert">
                  <s>{p.firstPrint.toFixed(digits)}</s> REVISED
                </div>
              ) : (
                <div className="opacity-60">{p.revision >= 2 ? 'FINAL' : `PRINT ${p.revision + 1}`}</div>
              )}
            </>
          )
        }}
        overlay={({ sx, sy }) => (
          <>
            {/* superseded first prints: struck through, dim — the machine
                remembers what it told you */}
            {plotted
              .filter((p) => p.visiblyRevised)
              .map((p) => (
                <g key={`rev-${p.tick}`} opacity="0.55">
                  <line
                    x1={sx(p.tick) - 4}
                    x2={sx(p.tick) + 4}
                    y1={sy(p.firstPrint)}
                    y2={sy(p.firstPrint)}
                    stroke="var(--color-terminal-alert)"
                    strokeWidth="1.4"
                  />
                  <line
                    x1={sx(p.tick)}
                    x2={sx(p.tick)}
                    y1={sy(p.firstPrint)}
                    y2={sy(p.value)}
                    stroke="var(--color-terminal-alert)"
                    strokeWidth="0.7"
                    strokeDasharray="1.5 1.5"
                  />
                </g>
              ))}
            {plotted.map((p) =>
              p.revision >= 2 ? (
                <circle key={p.tick} cx={sx(p.tick)} cy={sy(p.value)} r="1.6" fill="var(--color-terminal-primary)" />
              ) : (
                <rect
                  key={p.tick}
                  x={sx(p.tick) - 1.8}
                  y={sy(p.value) - 1.8}
                  width="3.6"
                  height="3.6"
                  fill="var(--color-terminal-bg)"
                  stroke="var(--color-terminal-primary)"
                  strokeWidth="0.9"
                />
              ),
            )}
          </>
        )}
      />
    </WallTile>
  )
}
