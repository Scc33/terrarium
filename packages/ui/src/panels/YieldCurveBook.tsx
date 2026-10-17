import type { PublishedState } from '@terrarium/observation'
import { ChartFrame, Metric, TimeSeriesChart } from '../components/ui'
import { readYieldCurve, YIELD_LABELS } from '../yieldCurve'
import { YIELD_IDS } from '@terrarium/engine'

const pct = (v: number) => `${(100 * v).toFixed(2)}%`

export function YieldCurveBook({ pub }: { pub: PublishedState }) {
  const curve = readYieldCurve(pub)
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartFrame title="GOVERNMENT YIELDS · ANNUAL %" detail="DEALER QUOTES · NEW BORROWING"
        value={curve.slope < 0 ? 'INVERTED' : 'RISING'}
        legend={[{ label: 'LATEST QUOTE', color: 'var(--color-dossier-felt)' },
          { label: 'PREVIOUS QUARTER', color: 'var(--color-dossier-brass)', dashed: true }]}
        summary="Government borrowing yields by maturity. An inversion is a price shape, not a guaranteed recession.">
        <TimeSeriesChart width={500} height={190} traces={[
          { key: 'current', points: curve.current, color: 'var(--color-dossier-felt)', lead: true },
          { key: 'previous', points: curve.previous, color: 'var(--color-dossier-brass)', dashed: true },
        ]} formatTick={i => YIELD_LABELS[YIELD_IDS[Math.round(i)]] ?? ''}
          formatReading={v => `${v.toFixed(2)}%`} pad={0.1}
          summary="Three-month, one-year, five-year and ten-year government yields; maturities are spaced equally." hover rangeSelection={false} />
      </ChartFrame>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {curve.quotes.map(quote => <Metric key={quote.id} label={quote.label} value={pct(quote.value)}
            title={quote.change === null ? 'Opening quote.' : `Change from previous quarter: ${(100 * quote.change).toFixed(2)} percentage points.`} />)}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-dossier-ink/20 pt-2">
          <Metric label="POLICY HISTORY ANCHOR" value={pct(curve.anchor)} title="Dealers slowly learn from observed policy rates. This anchor is a market belief, not a promised future order." />
          <Metric label="SOVEREIGN PREMIUM" value={pct(curve.risk)} title="The premium on new government paper, priced from the public debt book, official GDP and lender relations." />
        </div>
        <p className="font-dossier text-[12px] leading-snug text-dossier-ink/80">
          The short end follows the rate you set. Longer yields combine dealers’ expected rate path,
          a premium for waiting, and the effect of central-bank purchases and remaining holdings.
          Investment and asset values follow five-year funding; bank credit follows the short rate.
        </p>
      </div>
    </div>
  )
}
