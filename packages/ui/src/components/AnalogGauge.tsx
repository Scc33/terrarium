/**
 * Dossier-era instrument: an analog gauge on manila, brass-rimmed, with the
 * latest figure rubber-stamped beneath. The needle can only tell you so
 * much — that vagueness is the statistical office's actual competence, not a
 * styling choice. Revisions get a loud oxblood REVISED stamp (load-bearing:
 * the player must notice they acted on a number that moved).
 */

import type { IndicatorId, IndicatorSeries } from '@terrarium/observation'
import { niceBounds, qtrLabel, shapeSeries } from './series'

const LABELS: Record<IndicatorId, string> = {
  gdp_growth: 'GDP GROWTH · %/YR',
  inflation: 'INFLATION · %/YR',
  price_food: 'FOOD PRICES · 1946=100',
  price_fuel: 'FUEL PRICES · 1946=100',
  unemployment: 'UNEMPLOYMENT · %',
  payrolls: 'PAYROLLS EX-AGRI · M',
  capital_stock: 'CAPITAL STOCK · IDX',
  conf_consumer: 'CONSUMER CONFIDENCE',
  conf_business: 'BUSINESS CONFIDENCE',
  approval: 'APPROVAL POLL · %',
  gini: 'INEQUALITY · GINI PTS',
  birth_rate: 'BIRTH RATE · /1000',
  death_rate: 'DEATH RATE · /1000',
  terms_of_trade: 'TERMS OF TRADE · IDX',
}

// gauge geometry: 200×110 viewBox, arc centered at (100,100) r=78
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
  const [lo, hi] = niceBounds(
    Math.min(...points.map((p) => p.value)),
    Math.max(...points.map((p) => p.value)),
  )
  const frac = (v: number) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)))
  const needle = frac(latest.value)
  const band = latest.errorBand
  const recentlyRevised = points.slice(-6).some((p) => p.visiblyRevised)

  const ticks = Array.from({ length: 9 }, (_, i) => i / 8)

  return (
    <div className="flex h-full flex-col border-2 border-dossier-brass bg-dossier-paper">
      <div className="border-b border-dossier-ink/20 px-3 py-1.5 font-mono text-[10px] font-medium tracking-[0.2em] text-dossier-ink">
        {LABELS[indicator]}
      </div>
      <div className="relative flex-1 px-3 pt-1">
        <svg viewBox="0 0 200 112" className="block w-full">
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
            return <line key={t} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--color-dossier-ink)" strokeWidth={t === 0 || t === 1 ? 1.4 : 0.8} opacity="0.7" />
          })}
          <text x={CX - R - 2} y={CY + 10} fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.75">
            {lo}
          </text>
          <text x={CX + R + 2} y={CY + 10} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.75">
            {hi}
          </text>
          {/* needle */}
          {(() => {
            const [nx, ny] = polar(needle, R - 12)
            return (
              <g>
                <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="var(--color-dossier-ink)" strokeWidth="2" strokeLinecap="round" />
                <circle cx={CX} cy={CY} r="4.5" fill="var(--color-dossier-brass)" stroke="var(--color-dossier-ink)" strokeWidth="1" />
              </g>
            )
          })()}
        </svg>
        {recentlyRevised && (
          <div className="absolute right-2 top-1 -rotate-12 border-2 border-dossier-warn px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.2em] text-dossier-warn">
            REVISED
          </div>
        )}
      </div>
      {/* the stamped figure */}
      <div
        className="flex items-baseline justify-between border-t border-dossier-ink/20 px-3 py-1.5"
        title="The latest published figure, its confessed error band, and how stale it already was when it reached your desk."
      >
        <span className="font-mono text-xl font-medium tabular-nums text-dossier-ink">
          {latest.value.toFixed(1)}
          {band > 0 && <span className="text-[10px] opacity-60"> ±{band.toFixed(1)}</span>}
          {latest.levels && (
            <span
              className="ml-2 font-mono text-[10px] tabular-nums text-dossier-ink/70"
              title="The office's estimate of the GDP level behind that growth figure: real (base-year prices) and nominal (current prices)."
            >
              R{latest.levels.real.toFixed(0)} · N{latest.levels.nominal.toFixed(0)}
            </span>
          )}
        </span>
        <span className="font-mono text-[10px] tracking-[0.15em] text-dossier-ink/60">
          AS OF {qtrLabel(latest.forQtr).toUpperCase()} · {latest.lag}Q LATE
        </span>
      </div>
      {/* recent stamped prints — the dossier's idea of a chart */}
      <div className="flex gap-3 border-t border-dossier-ink/20 px-3 py-1">
        {points.slice(-5, -1).map((p) => (
          <span key={p.forQtr} className="font-mono text-[10px] tabular-nums text-dossier-ink/70">
            {qtrLabel(p.forQtr).slice(2)}{' '}
            <span className={p.visiblyRevised ? 'font-medium text-dossier-warn' : ''}>{p.value.toFixed(1)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
