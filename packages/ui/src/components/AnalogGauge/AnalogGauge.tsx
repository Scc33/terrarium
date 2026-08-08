/**
 * Dossier-era instrument: an analog gauge on manila, brass-rimmed, with the
 * latest figure rubber-stamped beneath. The needle can only tell you so
 * much — that vagueness is the statistical office's actual competence, not a
 * styling choice.
 *
 * Two rules this component must not break, both learned the hard way:
 *
 * 1. IT FITS ITS BOX. The card is a three-row grid — header, face, footer —
 *    where only the face flexes, it is `overflow-hidden`, and the face is an
 *    SVG scaled with `preserveAspectRatio`. There is no arrangement of props
 *    that can make this card paint outside its slot. The previous version
 *    laid itself out at its natural height and painted its own figure and
 *    history strip underneath the tile below, so at 1280×720 the wall showed
 *    needles and no numbers at all.
 * 2. THE FACE IS FIXED (see ../domains). Bounds are a per-indicator constant,
 *    not something derived from the trailing window — a dial redrawn under
 *    its own needle teaches the player nothing.
 */

import type { IndicatorId, IndicatorSeries } from '@terrarium/observation'
import { FACE_MARK, gaugeDomain, readNeedle } from '../../domains'
import { complementReading, NAMES } from '../labels'
import { qtrLabel, quarterDelta, shapeSeries, stampWorthyRevision } from '../series'
import { WallTile } from '../WallTile/WallTile'

// gauge geometry: 200×118 viewBox, arc centered at (100,100) r=78
const CX = 100
const CY = 100
const R = 78
const polar = (frac: number, r: number): [number, number] => {
  const a = Math.PI * (1 - frac) // 0 → left, 1 → right
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)]
}
const arcPath = (f0: number, f1: number, r: number) => {
  const [x0, y0] = polar(f0, r)
  const [x1, y1] = polar(f1, r)
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`
}

/** the trend arrow a needle can't give you */
function DeltaChip({ delta, digits }: { delta: number | null; digits: number }) {
  if (delta === null || Math.abs(delta) < Math.pow(10, -digits) / 2) {
    return <span className="font-mono text-[10px] tabular-nums text-dossier-ink/45">—</span>
  }
  return (
    <span className="font-mono text-[10px] font-medium tabular-nums text-dossier-ink/75">
      {delta > 0 ? '▲' : '▼'}
      {Math.abs(delta).toFixed(digits)}
    </span>
  )
}

export function AnalogGauge({
  indicator,
  series,
  now,
}: {
  indicator: IndicatorId
  series: IndicatorSeries
  now: number
}) {
  const points = shapeSeries(series, 24, now)
  if (points.length === 0) return null
  const latest = points[points.length - 1]

  // the ratcheting faces need the WHOLE history, not the display window —
  // that is what makes them monotone (see ../domains)
  const domain = gaugeDomain(
    indicator,
    series.points.map((p) => p.value),
  )
  const { frac: needle, pegged } = readNeedle(domain, latest.value)
  const band = latest.errorBand
  const frac = (v: number) => readNeedle(domain, v).frac
  const stamped = stampWorthyRevision(points, domain)
  const mark = FACE_MARK[indicator]
  const complement = complementReading(indicator, latest.value)
  const ticks = Array.from({ length: 9 }, (_, i) => i / 8)

  const header = (
    <div
      className="flex items-baseline justify-between gap-2 border-b border-dossier-ink/20 px-3 py-1 font-mono text-[10px] font-medium tracking-[0.2em] text-dossier-ink"
      title={NAMES[indicator].note}
    >
      <span className="truncate">{NAMES[indicator].dossier}</span>
      {latest.levels && (
        <span
          className="shrink-0 font-mono text-[9px] tracking-normal tabular-nums text-dossier-ink/60"
          title="The office's estimate of the GDP level behind that growth figure: real (base-year prices) and nominal (current prices)."
        >
          R{latest.levels.real.toFixed(0)}·N{latest.levels.nominal.toFixed(0)}
        </span>
      )}
      {!latest.levels && complement && (
        <span className="shrink-0 font-mono text-[9px] tracking-normal tabular-nums text-dossier-ink/60">
          {complement}
        </span>
      )}
    </div>
  )

  const footer = (
    <div>
      <div
        className="flex items-baseline justify-between gap-2 border-t border-dossier-ink/20 px-3 py-1"
        title="The latest published figure, its confessed error band, the change since the previous print, and how stale it already was when it reached your desk."
      >
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="font-mono text-lg font-medium leading-tight tabular-nums text-dossier-ink">
            {latest.value.toFixed(1)}
          </span>
          {band > 0 && <span className="font-mono text-[10px] tabular-nums text-dossier-ink/55">±{band.toFixed(1)}</span>}
          <DeltaChip delta={quarterDelta(points)} digits={1} />
        </span>
        <span className="shrink truncate font-mono text-[9px] tracking-[0.1em] text-dossier-ink/55">
          {qtrLabel(latest.forQtr).slice(2)} · {latest.lag}Q LATE
        </span>
      </div>
      <div className="flex justify-between gap-1 overflow-hidden border-t border-dossier-ink/20 px-3 py-0.5">
        {points.slice(-4, -1).map((p) => (
          <span key={p.forQtr} className="truncate font-mono text-[9px] tabular-nums text-dossier-ink/60">
            {qtrLabel(p.forQtr).slice(2)}{' '}
            <span className={p.visiblyRevised ? 'font-medium text-dossier-warn' : ''}>{p.value.toFixed(1)}</span>
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <WallTile
      className="border-2 border-dossier-brass bg-dossier-paper"
      bodyClassName="px-3 py-1"
      header={header}
      footer={footer}
    >
        <svg viewBox="0 0 200 118" preserveAspectRatio="xMidYMid meet" className="block h-full w-full">
          {/* brass rim + face */}
          <path d={arcPath(0, 1, R + 9)} fill="none" stroke="var(--color-dossier-brass)" strokeWidth="7" />
          <path d={arcPath(0, 1, R)} fill="none" stroke="var(--color-dossier-ink)" strokeWidth="1" opacity="0.6" />
          {/* error band wedge — the office's confessed uncertainty */}
          {band > 0 && (
            <path
              d={arcPath(frac(latest.value - band), frac(latest.value + band), R - 7)}
              fill="none"
              stroke="var(--color-dossier-brass)"
              strokeWidth="12"
              opacity="0.35"
            />
          )}
          {/* ticks + bound labels */}
          {ticks.map((t) => {
            const [x0, y0] = polar(t, R - 4)
            const [x1, y1] = polar(t, R + 3)
            return (
              <line
                key={t}
                x1={x0}
                y1={y0}
                x2={x1}
                y2={y1}
                stroke="var(--color-dossier-ink)"
                strokeWidth={t === 0 || t === 1 ? 1.4 : 0.8}
                opacity="0.7"
              />
            )
          })}
          <text x={CX - R - 8} y={CY + 12} fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.75">
            {domain.lo}
          </text>
          <text x={CX + R + 8} y={CY + 12} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.75">
            {domain.hi}
          </text>

          {/* a line the rules put on the face — the electoral threshold, zero.
              Certain, even when the reading against it is not. */}
          {mark && (() => {
            const f = frac(mark.at)
            const [mx0, my0] = polar(f, R - 10)
            const [mx1, my1] = polar(f, R + 6)
            const [lx, ly] = polar(f, R + 15)
            return (
              <g opacity="0.85">
                <line x1={mx0} y1={my0} x2={mx1} y2={my1} stroke="var(--color-dossier-warn)" strokeWidth="1.4" />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  fontSize="7"
                  fontFamily="var(--font-mono)"
                  letterSpacing="0.5"
                  fill="var(--color-dossier-warn)"
                >
                  {mark.label}
                </text>
              </g>
            )
          })()}

          {/* needle; pegged at the rail with a chevron when the economy has
              left the dial — going off-scale is information, not a reason to
              redraw the face */}
          {(() => {
            const [nx, ny] = polar(needle, R - 12)
            const [px, py] = polar(needle, R - 2)
            return (
              <g>
                <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="var(--color-dossier-ink)" strokeWidth="2" strokeLinecap="round" />
                {pegged && (
                  <text
                    x={px}
                    y={py}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    fill="var(--color-dossier-warn)"
                  >
                    {pegged === 'hi' ? '»' : '«'}
                  </text>
                )}
                <circle cx={CX} cy={CY} r="4.5" fill="var(--color-dossier-brass)" stroke="var(--color-dossier-ink)" strokeWidth="1" />
              </g>
            )
          })()}
        </svg>

        {stamped && (
          <div
            className="absolute right-2 top-1 -rotate-12 border-2 border-dossier-warn px-1.5 py-0.5 text-center font-mono text-[9px] font-medium leading-tight tracking-[0.2em] text-dossier-warn"
            title={`The office has revised ${qtrLabel(stamped.forQtr)} by ${stamped.revisionDelta.toFixed(1)} since it first printed ${stamped.firstPrint.toFixed(1)}. You may have acted on the old number.`}
          >
            REVISED
            <span className="block tracking-normal tabular-nums">
              {stamped.revisionDelta > 0 ? '+' : ''}
              {stamped.revisionDelta.toFixed(1)}
            </span>
          </div>
        )}
    </WallTile>
  )
}
