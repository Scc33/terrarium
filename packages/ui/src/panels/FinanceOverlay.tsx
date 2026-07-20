/**
 * The financial system — drill-down paperwork (design doc §3.2), and a fog
 * lesson with a twist. A banking crisis ALWAYS makes the papers (onset is on
 * the wire, unfogged — a bank run is not a thing you can hide), so even an
 * unfunded government sees, in oxblood, that the crash happened. But the
 * build-up — the bubble inflating, leverage climbing toward the cliff — is
 * only legible if you funded the exchange board and the bank supervisor.
 * You always learn a crisis hit. Seeing it coming is a thing you buy.
 */

import type { IndicatorPoint, NewsItem, PublishedState } from '@terrarium/observation'
import { Overlay } from '../components/Overlay'

const yearOf = (q: number) => 1946 + Math.floor(q / 4)

/** latest revision per measured quarter, oldest first */
function settled(points: IndicatorPoint[]): Array<{ q: number; value: number }> {
  const best = new Map<number, { value: number; revision: number }>()
  for (const p of points) {
    const cur = best.get(p.forQtr)
    if (!cur || p.revision > cur.revision) best.set(p.forQtr, { value: p.value, revision: p.revision })
  }
  return [...best.entries()].map(([q, v]) => ({ q, value: v.value })).sort((a, b) => a.q - b.q)
}

/** banking-crisis onsets pulled off the wire — always visible, fog or none */
function crisisTicks(news: NewsItem[]): number[] {
  return news
    .filter((n) => /banking crisis|sudden stop/i.test(n.text))
    .map((n) => n.tick)
}

const CW = 470
const CH = 128
const PL = 30
const PR = 8
const PT = 10
const PB = 16

function FogLineChart({
  title,
  series,
  color,
  baseline,
  yFloor,
  yPad,
  crises,
  xMin,
  xMax,
  needs,
  blurb,
}: {
  title: string
  series: Array<{ q: number; value: number }>
  color: string // a --color-dossier-* var name
  baseline: number // the reference line (100 for an index, 0 for a rate)
  yFloor?: number // force the axis to include this
  yPad: number
  crises: number[]
  xMin: number
  xMax: number
  needs: string
  blurb: string
}) {
  const funded = series.length >= 2
  const vals = series.map((p) => p.value)
  const lo = Math.min(baseline, yFloor ?? Infinity, ...vals) - yPad
  const hi = Math.max(baseline, ...vals) + yPad
  const sx = (q: number) => PL + ((q - xMin) / Math.max(xMax - xMin, 1)) * (CW - PL - PR)
  const sy = (v: number) => PT + ((hi - v) / Math.max(hi - lo, 1e-9)) * (CH - PT - PB)
  const path = series
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.q).toFixed(1)},${sy(p.value).toFixed(1)}`)
    .join(' ')
  // a few round gridline values across the domain
  const ticks = [lo, baseline, hi].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className="border border-dossier-ink/25 bg-dossier-paper">
      <div className="flex items-center justify-between border-b border-dossier-ink/20 px-2 py-1">
        <span className="font-mono text-[9px] font-medium tracking-[0.25em] text-dossier-ink/70">
          {title}
        </span>
        {funded && series.length > 0 && (
          <span className="font-mono text-[10px] font-semibold tabular-nums" style={{ color: `var(--color-${color})` }}>
            {series[series.length - 1].value.toFixed(1)}
          </span>
        )}
      </div>
      {funded ? (
        <svg viewBox={`0 0 ${CW} ${CH}`} className="block w-full">
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PL} x2={CW - PR} y1={sy(v)} y2={sy(v)} stroke="var(--color-dossier-ink)" strokeWidth="0.4" opacity={v === baseline ? 0.3 : 0.12} />
              <text x={PL - 3} y={sy(v) + 3} textAnchor="end" fontSize="7" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.6">
                {v.toFixed(0)}
              </text>
            </g>
          ))}
          {/* crises: always drawn, even here — the crash is never fog */}
          {crises.map((t, i) =>
            t >= xMin && t <= xMax ? (
              <line key={i} x1={sx(t)} x2={sx(t)} y1={PT} y2={CH - PB} stroke="var(--color-dossier-warn)" strokeWidth="1" strokeDasharray="2 2" opacity="0.75" />
            ) : null,
          )}
          <path d={path} fill="none" stroke={`var(--color-${color})`} strokeWidth="1.4" />
          <text x={PL} y={CH - 4} fontSize="7" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.6">
            {yearOf(xMin)}
          </text>
          <text x={CW - PR} y={CH - 4} textAnchor="end" fontSize="7" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.6">
            {yearOf(xMax)}
          </text>
        </svg>
      ) : (
        <div className="relative flex h-[128px] flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#c2a06b] to-dossier-brass">
          {/* the crashes still show through the brass — you knew they happened */}
          <svg viewBox={`0 0 ${CW} ${CH}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            {crises.map((t, i) =>
              t >= xMin && t <= xMax ? (
                <line key={i} x1={sx(t)} x2={sx(t)} y1={0} y2={CH} stroke="var(--color-dossier-warn)" strokeWidth="1" strokeDasharray="2 2" opacity="0.55" />
              ) : null,
            )}
          </svg>
          <div className="z-10 font-mono text-[10px] font-medium tracking-[0.2em] text-dossier-ink">
            NO RETURNS FILED
          </div>
          <div className="z-10 font-mono text-[9px] tracking-[0.15em] text-dossier-ink/70">REQUIRES: {needs}</div>
          <div className="z-10 mt-1 max-w-[320px] text-center font-dossier text-[11px] italic leading-snug text-dossier-ink/70">
            {blurb}
          </div>
        </div>
      )}
    </div>
  )
}

export function FinanceOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const asset = settled(pub.indicators.asset_prices?.points ?? [])
  const credit = settled(pub.indicators.credit_growth?.points ?? [])
  const crises = crisisTicks(pub.news)
  const xMin = 0
  const xMax = pub.tick

  const latestCredit = credit.length ? credit[credit.length - 1].value : null
  const leverageWord =
    latestCredit === null
      ? '— UNSUPERVISED'
      : latestCredit > 8
        ? 'CREDIT RUNNING HOT'
        : latestCredit < -4
          ? 'CREDIT CONTRACTING'
          : 'CREDIT STEADY'

  return (
    <Overlay title="THE FINANCIAL SYSTEM" onClose={onClose} wide>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-[0.15em] text-dossier-ink/60">
          {crises.length === 0
            ? 'NO BANKING CRISIS ON RECORD'
            : `${crises.length} BANKING CRISI${crises.length === 1 ? 'S' : 'ES'} SINCE 1946`}
        </span>
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-dossier-ink/80">
          {leverageWord}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <FogLineChart
          title="ASSET PRICES · 1946=100 · THE BUBBLE"
          series={asset}
          color="dossier-felt"
          baseline={100}
          yPad={12}
          crises={crises}
          xMin={xMin}
          xMax={xMax}
          needs="EXCHANGE BOARD"
          blurb="What capital sells for. When it floats far above what it earns, that is a bubble — and only the exchange quotes it."
        />
        <FogLineChart
          title="CREDIT GROWTH · % / YR OF GDP · THE LEVERAGE"
          series={credit}
          color="dossier-brass"
          baseline={0}
          yFloor={-6}
          yPad={4}
          crises={crises}
          xMin={xMin}
          xMax={xMax}
          needs="BANK SUPERVISION"
          blurb="How fast debt outruns the economy. Sustained and high is fragility building — the supervisor's ledger is the only place you see it coming."
        />
      </div>

      <p className="mt-4 text-center font-mono text-[9px] tracking-[0.2em] text-dossier-ink/50">
        THE CRASH ALWAYS MAKES THE PAPERS · THE BUILD-UP ONLY MAKES YOURS
      </p>
    </Overlay>
  )
}
