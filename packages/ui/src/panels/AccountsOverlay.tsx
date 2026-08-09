/**
 * The expenditure accounts, opened out — what the economy's output was FOR.
 *
 * The wall can tell you output grew. It cannot tell you whether it grew
 * because households finally had money, because you built something, or
 * because the world started buying — and those are three different countries
 * with three different futures. So this is the same anatomy as the treasury
 * ledger (a pie for this quarter, the same inks stacked across the century
 * beside it) pointed at the demand side instead of the budget.
 *
 * Unlike the ledger, NOTHING here is exact. These are surveys, and each of
 * the three is compiled separately, so the prints carry bands and do not sum
 * to a hundred. The shortfall is shown rather than smoothed away — see
 * `../accounts`.
 */

import type { PublishedState } from '@terrarium/observation'
import { DonutChart, EmptyState, LineChart, Metric, Modal, OverlayLayout, SegmentedControl, StackedAreaChart } from '../components/ui'
import { shapeSeries } from '../components/series'
import { accountRows, publishedSum, readAccounts, toShares, type AccountId } from '../accounts'
import { useState } from 'react'

const pct = (v: number) => `${v.toFixed(1)}%`
const yearOf = (q: number) => 1946 + Math.floor(q / 4)

/**
 * A confessed half-width, or a shrug.
 *
 * The office states no band at all below 0.45 statistical capacity, and it
 * arrives here as a literal zero. Printing that as "±0.0" says the exact
 * opposite of what it means — a ministry too poor to estimate its own error
 * would be shown as the most certain it has ever been. So a zero band is
 * NOT a number here — it is a shrug, and it prints as one. (It has to stay
 * short: the legend's last column is ten characters of mono, and a longer
 * string pushes the figure it is annotating off the right edge.)
 */
const band = (half: number | undefined): string =>
  half === undefined ? '—' : half > 0 ? `±${half.toFixed(1)}` : '±?'

type Lens = 'mix' | 'drift'

export function AccountsOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const [lens, setLens] = useState<Lens>('mix')
  const readings = readAccounts(pub)

  if (!readings) {
    return (
      <Modal title="THE EXPENDITURE ACCOUNTS — WHO THE OUTPUT IS FOR" onClose={onClose} size="wide">
        <EmptyState title="THE OFFICE CANNOT YET COMPILE THE EXPENDITURE SIDE" requirement="EXPENDITURE ACCOUNTS">
          Counting output is one job; establishing who bought it is another. Until the
          statistical office can survey capital formation and collate customs volumes, the
          ministry knows how much the country produced and not what kind of country produced it.
        </EmptyState>
      </Modal>
    )
  }

  const shares = toShares(readings)
  const rows = accountRows(pub)
  const sum = publishedSum(readings)
  const measured = readings[0].forQtr
  const series = (key: AccountId) => {
    const s = pub.indicators[key]
    return s ? shapeSeries(s, Number.MAX_SAFE_INTEGER, pub.tick).map((p) => ({ tick: p.forQtr, value: p.value })) : []
  }

  return (
    <Modal title="THE EXPENDITURE ACCOUNTS — WHO THE OUTPUT IS FOR" onClose={onClose} size="wide">
      <OverlayLayout
        summary={(
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            {readings.map((r) => (
              <Metric
                key={r.key}
                label={r.label.toUpperCase()}
                value={pct(r.value)}
                title={`${r.note} Measured for ${yearOf(r.forQtr)} Q${(r.forQtr % 4) + 1}; the office's own band on that print: ${band(r.errorBand)}.`}
              />
            ))}
            <Metric
              label="SINCE THE FIRST SURVEY"
              value={readings
                .map((r) => `${r.sinceFirst >= 0 ? '+' : ''}${r.sinceFirst.toFixed(1)}`)
                .join(' / ')}
              title="Percentage points moved since the accounts were first compiled, in the order above. This is the drift that says what kind of economy you are building."
            />
          </div>
        )}
        toolbar={(
          <SegmentedControl
            label="Accounts view"
            value={lens}
            onChange={setLens}
            options={[
              { value: 'mix', label: 'THE MIX', title: 'This quarter’s composition, and the same bands across the century.' },
              { value: 'drift', label: 'EACH ACCOUNT', title: 'Each share on its own scale — the only way to see a small component move.' },
            ]}
          />
        )}
        note={(
          <>
            The three prints sum to {sum.toFixed(1)}, not 100. Each is a separate survey with its
            own error, and the remainder also holds the state’s own purchases, which are never
            published as a share — the treasury’s exact books are a better account of the
            government’s footprint than a fogged sliver of a pie would be.
          </>
        )}
        footer={`SURVEYED · MEASURED FOR ${yearOf(measured)} Q${(measured % 4) + 1} · REVISABLE`}
      >
        {lens === 'mix' ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[352px_minmax(0,1fr)]">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between font-mono text-[9px] tracking-[0.2em] text-dossier-ink/60">
                <span>THIS SURVEY</span>
                <span className="tabular-nums">{yearOf(measured)}</span>
              </div>
              <DonutChart
                shares={shares}
                format={pct}
                extra={(s) => band(readings.find((x) => x.key === s.key)?.errorBand)}
                emptyNote="NOTHING COMPILED"
              />
              <div
                className="mt-0.5 text-right font-mono text-[8px] tracking-[0.1em] text-dossier-ink/45"
                title="The half-width the statistical office confessed on this print. A poor office prints a wide band; a rich one narrows it and revises less. Below 0.45 statistical capacity it will not put a number on its own error at all, and says so."
              >
                LAST COLUMN: THE OFFICE’S OWN BAND ⓘ
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1">
              <div className="font-mono text-[9px] tracking-[0.2em] text-dossier-ink/60">THE MIX, QUARTER BY QUARTER</div>
              <StackedAreaChart rows={rows} keys={shares} mode="share" markTick={measured} format={pct} height={158} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-3">
            {readings.map((r) => (
              <LineChart
                key={r.key}
                label={<span style={{ color: r.ink }}>{r.label.toUpperCase()} · %</span>}
                data={series(r.key)}
                height={104}
                summary={`${r.label} as a share of final expenditure, ${pct(r.value)} at the latest survey.`}
              />
            ))}
          </div>
        )}
      </OverlayLayout>
    </Modal>
  )
}
