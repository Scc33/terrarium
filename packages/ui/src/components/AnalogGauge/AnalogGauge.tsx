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
import { FACE_MARK, faceScale, gaugeDomain, readNeedle } from '../../domains'
import {
  complementReading,
  dossierParts,
  HUMAN_DEVELOPMENT_COMPONENTS,
  humanDevelopmentBreakdown,
  NAMES,
  readingDigits,
} from '../labels'
import { qtrLabel, quarterDelta, shapeSeries, stampWorthyRevision } from '../series'
import { WallTile } from '../WallTile/WallTile'
import { Tooltip, TooltipLabel } from '../ui'

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
  // one rule for the whole tile, so the headline, its band, the delta chip and
  // the revision row can never disagree about how precise this print was
  const digits = readingDigits(latest.value, indicator)
  const ticks = Array.from({ length: 9 }, (_, i) => i / 8)
  const title = dossierParts(indicator)
  const scale = faceScale(domain)
  const reading = `${NAMES[indicator].plate}: ${latest.value.toFixed(digits)}${title.unit ? ` ${title.unit.toLowerCase()}` : ''} on a dial from ${scale.lo} to ${scale.hi}${pegged ? `, off the scale ${pegged === 'hi' ? 'high' : 'low'}` : ''}.`
  const ink = pegged ? 'var(--color-dossier-warn)' : 'var(--color-dossier-ink)'

  const header = (
    <div className="flex items-baseline justify-between gap-2 border-b border-dossier-ink/20 px-3 py-1 font-mono text-[10px] font-medium tracking-[0.14em] text-dossier-ink">
      <TooltipLabel label={NAMES[indicator].plate} content={NAMES[indicator].note} className="truncate">
        {title.name}
      </TooltipLabel>
      {latest.levels && (
        <TooltipLabel
          label="Real and nominal output"
          content="R removes price rises; N uses current prices. Both are the office’s estimate of total output."
          className="shrink-0 font-mono text-[9px] tracking-normal tabular-nums text-dossier-ink/60"
        >
          R{latest.levels.real.toFixed(0)}·N{latest.levels.nominal.toFixed(0)}
        </TooltipLabel>
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
      <Tooltip content="Latest reading; ± is the office’s uncertainty, the arrow is the change, and Q LATE says how old the figure was when published.">
        <div tabIndex={0} className="flex items-baseline justify-between gap-2 border-t border-dossier-ink/20 px-3 py-1 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-brass">
          {/* the reading never yields: when the row is short the date
              truncates, rather than the reading sliding under it — the
              delta used to print straight into the quarter (`▲6.249 Q4`) */}
          <span className="flex shrink-0 items-baseline gap-1.5">
            <span className="font-mono text-lg font-medium leading-tight tabular-nums text-dossier-ink">
              {latest.value.toFixed(digits)}
            </span>
            {band > 0 && (
              <span className="font-mono text-[10px] tabular-nums text-dossier-ink/55">
                ±{band.toFixed(digits)}
              </span>
            )}
            <DeltaChip delta={quarterDelta(points)} digits={digits} />
          </span>
          <span className="min-w-0 truncate font-mono text-[9px] tracking-[0.1em] text-dossier-ink/55">
            {qtrLabel(latest.forQtr).slice(2)} · {latest.lag}Q LATE
          </span>
        </div>
      </Tooltip>
      {latest.components ? (
        <Tooltip content={`Current normalized components: ${humanDevelopmentBreakdown(latest.components)}. Each runs from zero to one; the index is their geometric mean.`}>
          <div tabIndex={0} className="flex justify-between gap-1 overflow-hidden border-t border-dossier-ink/20 px-3 py-0.5 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-brass">
            {HUMAN_DEVELOPMENT_COMPONENTS.map(({ key, label }) => (
              <span key={key} className="truncate font-mono text-[8px] tabular-nums text-dossier-ink/65">
                {label} {latest.components![key].toFixed(2)}
              </span>
            ))}
          </div>
        </Tooltip>
      ) : (
        <div className="flex justify-between gap-1 overflow-hidden border-t border-dossier-ink/20 px-3 py-0.5">
          {points.slice(-4, -1).map((p) => (
            <span key={p.forQtr} className="truncate font-mono text-[9px] tabular-nums text-dossier-ink/60">
              {qtrLabel(p.forQtr).slice(2)}{' '}
              <span className={p.visiblyRevised ? 'font-medium text-dossier-warn' : ''}>
                {p.value.toFixed(digits)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <WallTile
      className="border-2 border-dossier-brass bg-dossier-paper"
      bodyClassName="px-3 py-1"
      header={header}
      footer={footer}
    >
        <svg
          viewBox="0 0 200 118"
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full"
          role="img"
          aria-label={reading}
        >
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
          {/* ticks, and the scale printed on the face: both rails, the
              midpoint, and the unit beneath the hub where a real gauge
              prints it */}
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
                strokeWidth={t === 0 || t === 0.5 || t === 1 ? 1.4 : 0.8}
                opacity="0.7"
              />
            )
          })}
          <text x={CX - R - 8} y={CY + 12} fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.75">
            {scale.lo}
          </text>
          <text x={CX} y={CY - R + 22} textAnchor="middle" fontSize="7" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.6">
            {scale.mid}
          </text>
          <text x={CX + R + 8} y={CY + 12} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.75">
            {scale.hi}
          </text>
          {title.unit && (
            <text x={CX} y={CY + 12} textAnchor="middle" fontSize="6.5" letterSpacing="0.5" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.55">
              {title.unit}
            </text>
          )}

          {/* a line the rules put on the face — the electoral threshold, zero.
              Certain, even when the reading against it is not. Near a rail the
              label hangs inward so it is never cut by the edge of the card. */}
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
                  textAnchor={f > 0.85 ? 'end' : f < 0.15 ? 'start' : 'middle'}
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

          {/* needle. Off the dial it pegs at the rail, turns warning-red and
              says so in words — going off-scale is information, not a reason
              to redraw the face, and a needle lying quietly along the rail
              read as a calm reading for half of #180's century. A pegged
              needle is horizontal, so the legend above the hub is always
              clear of it. */}
          {(() => {
            const [nx, ny] = polar(needle, R - 12)
            return (
              <g>
                {pegged && (
                  <>
                    <path d={pegged === 'hi' ? arcPath(0.94, 1, R + 9) : arcPath(0, 0.06, R + 9)} fill="none" stroke="var(--color-dossier-warn)" strokeWidth="7" />
                    <text
                      x={CX}
                      y={CY - 22}
                      textAnchor="middle"
                      fontSize="8"
                      letterSpacing="1.2"
                      fontFamily="var(--font-mono)"
                      fontWeight="600"
                      fill="var(--color-dossier-warn)"
                    >
                      {pegged === 'hi' ? 'OFF SCALE ▸' : '◂ OFF SCALE'}
                    </text>
                  </>
                )}
                <line x1={CX} y1={CY} x2={nx} y2={ny} stroke={ink} strokeWidth="2" strokeLinecap="round" />
                <circle cx={CX} cy={CY} r="4.5" fill="var(--color-dossier-brass)" stroke={ink} strokeWidth="1" />
              </g>
            )
          })()}

          {/* the rubber stamp, in the corner the arc leaves empty: tilted
              -6° about (176,14), its lowest corner sits a unit clear of the
              rim and its highest just inside the top of the face, so it no
              longer stamps over the scale it annotates */}
          {stamped && (
            <g transform="translate(176 14) rotate(-6)" aria-hidden="true">
              <rect x="-22" y="-11" width="44" height="22" fill="var(--color-dossier-paper)" fillOpacity="0.6" stroke="var(--color-dossier-warn)" strokeWidth="1.3" />
              <text y="-2.5" textAnchor="middle" fontSize="8" letterSpacing="0.5" fontFamily="var(--font-mono)" fontWeight="600" fill="var(--color-dossier-warn)">
                REVISED
              </text>
              <text y="7.5" textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill="var(--color-dossier-warn)">
                {stamped.revisionDelta > 0 ? '+' : ''}
                {stamped.revisionDelta.toFixed(1)}
              </text>
            </g>
          )}
        </svg>
        {stamped && (
          <span className="sr-only">
            The office revised {qtrLabel(stamped.forQtr)} by {stamped.revisionDelta.toFixed(1)} since first publication.
          </span>
        )}
    </WallTile>
  )
}
