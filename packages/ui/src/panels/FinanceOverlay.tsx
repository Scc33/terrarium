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
import { ChartFrame, EmptyState, Modal, OverlayLayout, TimeSeriesChart } from '../components/ui'
import type { ChartRule } from '../components/ui'

const yearOf = (q: number) => 1946 + Math.floor(q / 4)

/** latest revision per measured quarter, oldest first */
function settled(points: IndicatorPoint[]): Array<{ tick: number; value: number }> {
  const best = new Map<number, { value: number; revision: number }>()
  for (const p of points) {
    const cur = best.get(p.forQtr)
    if (!cur || p.revision > cur.revision) best.set(p.forQtr, { value: p.value, revision: p.revision })
  }
  return [...best.entries()].map(([tick, v]) => ({ tick, value: v.value })).sort((a, b) => a.tick - b.tick)
}

/** banking-crisis onsets pulled off the wire — always visible, fog or none */
function crisisTicks(news: NewsItem[]): number[] {
  return news
    .filter((n) => /banking crisis|sudden stop/i.test(n.text))
    .map((n) => n.tick)
}

const CW = 470
const CH = 128

function FogLineChart({
  title,
  series,
  color,
  baseline,
  yFloor,
  crises,
  xMin,
  xMax,
  needs,
  blurb,
}: {
  title: string
  series: Array<{ tick: number; value: number }>
  color: string // a --color-dossier-* var name
  baseline: number // the reference line (100 for an index, 0 for a rate)
  yFloor?: number // force the axis to include this
  crises: number[]
  xMin: number
  xMax: number
  needs: string
  blurb: string
}) {
  const funded = series.length >= 2
  const vals = series.map((p) => p.value)
  const latest = series[series.length - 1]
  const ink = `var(--color-${color})`
  const summary = funded
    ? `${title}. Latest value ${latest.value.toFixed(1)}. Recorded range ${Math.min(...vals).toFixed(1)} to ${Math.max(...vals).toFixed(1)}. ${crises.length} crisis markers in the full record.`
    : `${title}. No series is available because the government has not funded ${needs.toLowerCase()}. ${crises.length} publicly known crisis markers remain visible.`

  // crises: always drawn, even over an empty plot — the crash is never fog
  const crisisRules: ChartRule[] = crises
    .filter((t) => t >= xMin && t <= xMax)
    .map((t) => ({ axis: 'x', at: t, color: 'var(--color-dossier-warn)', opacity: 0.75 }))

  return (
    <ChartFrame
      title={title}
      detail={funded ? 'PUBLISHED RETURNS' : `REQUIRES ${needs}`}
      value={funded && latest ? <span style={{ color: ink }}>{latest.value.toFixed(1)}</span> : '—'}
      legend={crises.length ? [{ label: 'CRISIS', color: 'var(--color-dossier-warn)', dashed: true }] : []}
      summary={summary}
    >
      {funded ? (
        <TimeSeriesChart
          width={CW}
          height={CH}
          traces={[{ key: 'series', points: series, color: ink, lead: true }]}
          include={yFloor === undefined ? [baseline] : [baseline, yFloor]}
          pad={0.08}
          rules={[{ axis: 'y', at: baseline, opacity: 0.3, dashed: false }, ...crisisRules]}
          formatTick={(t) => String(yearOf(t))}
          formatReading={(v) => v.toFixed(1)}
          summary={summary}
          hover
        />
      ) : (
        <div className="relative h-[128px] overflow-hidden">
          {/* the crashes still show through the brass — you knew they happened */}
          <svg viewBox={`0 0 ${CW} ${CH}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            {crises.map((t, i) =>
              t >= xMin && t <= xMax ? (
                <line
                  key={i}
                  x1={((t - xMin) / Math.max(xMax - xMin, 1)) * CW}
                  x2={((t - xMin) / Math.max(xMax - xMin, 1)) * CW}
                  y1={0}
                  y2={CH}
                  stroke="var(--color-dossier-warn)"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.55"
                />
              ) : null,
            )}
          </svg>
          <EmptyState title="NO RETURNS FILED" requirement={needs} compact>{blurb}</EmptyState>
        </div>
      )}
    </ChartFrame>
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
    <Modal title="THE FINANCIAL SYSTEM" onClose={onClose} size="wide">
      <OverlayLayout
        summary={(
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono text-[10px] tracking-[0.15em] text-dossier-ink/60">
              {crises.length === 0
                ? 'NO BANKING CRISIS ON RECORD'
                : `${crises.length} BANKING CRISI${crises.length === 1 ? 'S' : 'ES'} SINCE 1946`}
            </span>
            <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-dossier-ink/80">{leverageWord}</span>
          </div>
        )}
        note="A crash is public: runs, closures, and sudden stops always reach the wire. The dangerous build-up is different. Asset quotes require an exchange board; leverage requires bank supervision. Fund the institutions before you need the warning."
        footer="THE CRASH ALWAYS MAKES THE PAPERS · THE BUILD-UP ONLY MAKES YOURS"
      >
        <div className="flex flex-col gap-3">
          <FogLineChart
            title="ASSET PRICES · THE BUBBLE"
            series={asset}
            color="dossier-felt"
            baseline={100}
            crises={crises}
            xMin={xMin}
            xMax={xMax}
            needs="EXCHANGE BOARD"
            blurb="What capital sells for. When it floats far above what it earns, that is a bubble — and only the exchange quotes it."
          />
          <FogLineChart
            title="CREDIT GROWTH · THE LEVERAGE"
            series={credit}
            color="dossier-brass"
            baseline={0}
            yFloor={-6}
            crises={crises}
            xMin={xMin}
            xMax={xMax}
            needs="BANK SUPERVISION"
            blurb="How fast debt outruns the economy. Sustained and high is fragility building — the supervisor's ledger is the only place you see it coming."
          />
        </div>
      </OverlayLayout>
    </Modal>
  )
}
