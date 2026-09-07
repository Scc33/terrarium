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
 * Unlike the ledger, NOTHING here is exact — with one deliberate exception.
 * The three accounts are surveys, each compiled separately, so the prints
 * carry bands and do not sum to a hundred; the shortfall is shown rather than
 * smoothed away (see `../accounts`). Beside them sits the one figure a survey
 * of demand can never give: the size of the state, which is the treasury's own
 * exact books over the office's estimate of output (see `../stateFootprint`).
 * It is a lens of its own rather than a fourth wedge, because a reader who
 * takes it for one has double-counted every transfer in the budget.
 *
 * EVERY LENS IS GATED ON ITS OWN DATA, and that is load-bearing rather than
 * tidy. The three accounts need a 0.35 statistical office; the state's weight
 * needs only the treasury's books and the headline output estimate, which is
 * published from the first quarter at zero capacity. Gating the whole room on
 * the expenditure survey — which the first version did — hid the one reading
 * that does not depend on it behind the funding of the ones that do: measured,
 * a passive Meridia and a passive Costona never compile the accounts at all in
 * sixty years, while the footprint is on the desk from 1946 Q2. So an unfunded
 * survey blanks its own lens with the requirement named, exactly as an
 * unfunded instrument does on the rack, and the state's lens opens anyway.
 */

import type { PublishedState } from '@terrarium/observation'
import { DonutChart, EmptyState, LineChart, Metric, Modal, OverlayLayout, SegmentedControl, StackedAreaChart, TimeSeriesChart, TooltipLabel } from '../components/ui'
import { qtrLabel, shapeSeries } from '../components/series'
import { accountRows, publishedSum, readAccounts, toShares, type AccountId } from '../accounts'
import { OUTLAY_CHART_FACE, OUTLAY_CHART_IDS } from '../budgetChart'
import { footprintSeries, programmeRows, stateFootprint } from '../stateFootprint'
import type { Share } from '../shares'
import { useState } from 'react'

const pct = (v: number) => `${v.toFixed(1)}%`
const yearOf = (q: number) => 1946 + Math.floor(q / 4)
const qOf = (q: number) => (q % 4) + 1

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

type Lens = 'mix' | 'drift' | 'state'

/** What the mix and the drift show while the survey behind them is unfunded —
 * the rack's own manners, so the player is told what to build rather than
 * shown an empty grid. */
const UNSURVEYED = (
  <EmptyState title="THE OFFICE CANNOT YET COMPILE THE EXPENDITURE SIDE" requirement="EXPENDITURE ACCOUNTS">
    Counting output is one job; establishing who bought it is another. Until the
    statistical office can survey capital formation and collate customs volumes, the
    ministry knows how much the country produced and not what kind of country produced it.
  </EmptyState>
)

export function AccountsOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const readings = readAccounts(pub)
  const footprint = stateFootprint(pub)
  // open on whichever lens has something in it
  const [lens, setLens] = useState<Lens>(readings || !footprint ? 'mix' : 'state')

  if (!readings && !footprint) {
    return (
      <Modal title="THE EXPENDITURE ACCOUNTS — WHO THE OUTPUT IS FOR" onClose={onClose} size="full">
        {UNSURVEYED}
      </Modal>
    )
  }

  const shares = readings ? toShares(readings) : []
  const rows = accountRows(pub)
  const sum = readings ? publishedSum(readings) : 0
  const measured = readings ? readings[0].forQtr : pub.tick
  const series = (key: AccountId) => {
    const s = pub.indicators[key]
    return s ? shapeSeries(s, Number.MAX_SAFE_INTEGER, pub.tick).map((p) => ({ tick: p.forQtr, value: p.value })) : []
  }
  /** the outlay bands, in points of GDP, wearing the ledger's own inks — the
   * same programme must not change colour between the two books. */
  const programmeShares: Share[] = footprint
    ? OUTLAY_CHART_IDS.map((id) => ({
        key: id,
        value: footprint.latest.byProgramme[id],
        ...OUTLAY_CHART_FACE[id],
      }))
    : []

  return (
    <Modal title="THE EXPENDITURE ACCOUNTS — WHO THE OUTPUT IS FOR" onClose={onClose} size="full">
      <OverlayLayout
        summary={(
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            {readings?.map((r) => (
              <Metric
                key={r.key}
                label={r.label.toUpperCase()}
                value={pct(r.value)}
                title={`${r.note} This report covers ${yearOf(r.forQtr)} Q${qOf(r.forQtr)}. The office says it may be off by ${band(r.errorBand)}.`}
              />
            ))}
            {readings && (
              <Metric
                label="SINCE THE FIRST SURVEY"
                value={readings
                  .map((r) => `${r.sinceFirst >= 0 ? '+' : ''}${r.sinceFirst.toFixed(1)}`)
                  .join(' / ')}
                title="How many percentage points each of the three expenditure shares has moved since its first report, in the order they are listed."
              />
            )}
            {footprint && (
              <Metric
                label="THE STATE · % OF GDP"
                value={pct(footprint.latest.outlays)}
                title={`Your own spending as a share of the economy: ${pct(footprint.latest.outlays)} spent against ${pct(footprint.latest.revenue)} collected in ${yearOf(footprint.latest.tick)} Q${qOf(footprint.latest.tick)}. The books are exact; the economy you are dividing by is the office’s estimate, so this figure moves when GDP is revised. It is not one of the accounts beside it — transfers, subsidies and debt service pay for spending those already count.`}
              />
            )}
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
              ...(footprint
                ? [{ value: 'state' as const, label: 'THE STATE', title: 'How much of the economy the treasury itself takes and spends, and what it spends it on.' }]
                : []),
            ]}
          />
        )}
        note={lens === 'state' && footprint ? (
          <>
            Half of this reading is exact and half of it is not. The books are yours and arrive
            unrevised; the economy you are dividing them by is the office’s estimate, so the
            figure moves when the office changes its mind about a quarter in which the treasury
            did nothing at all. It is also not a fourth account: outlays include transfers,
            subsidies and debt service, which pay for spending the survey next door has already
            counted where the money landed. Read it as weight, not as demand.
            {!readings && <> That survey is unfunded, which is why the other lenses are blank and this one is not.</>}
          </>
        ) : readings ? (
          <>
            The three prints sum to {sum.toFixed(1)}, not 100. Each is a separate survey with its
            own error, and the remainder also holds the state’s own purchases, which are never
            published as a share: this state buys goods and pays transfers rather than employing
            anyone, so its purchases are under 1% of expenditure and a wedge that size would
            badly misinform you about your own weight in the economy.
            {footprint && <> What the treasury actually moves is under THE STATE — its exact books over the office’s estimate of output.</>}
          </>
        ) : undefined}
        footer={lens === 'state' && footprint
          ? `EXACT BOOKS OVER A SURVEYED DENOMINATOR · ${yearOf(footprint.latest.tick)} Q${qOf(footprint.latest.tick)}`
          : readings
            ? `SURVEYED · MEASURED FOR ${yearOf(measured)} Q${qOf(measured)} · REVISABLE`
            : undefined}
      >
        {lens !== 'state' && !readings && UNSURVEYED}

        {lens === 'mix' && readings && (
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
              <div className="mt-0.5 text-right font-mono text-[8px] tracking-[0.1em] text-dossier-ink/45">
                <TooltipLabel
                  label="The office’s uncertainty"
                  content="How far the office thinks each figure may be from the truth. Better statistics make this range smaller."
                  className="tracking-[0.1em] text-dossier-ink/45"
                >
                  LAST COLUMN: THE OFFICE’S OWN BAND ⓘ
                </TooltipLabel>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1">
              <div className="font-mono text-[9px] tracking-[0.2em] text-dossier-ink/60">THE MIX, QUARTER BY QUARTER</div>
              <StackedAreaChart rows={rows} keys={shares} mode="share" markTick={measured} format={pct} height={158} width={760} />
            </div>
          </div>
        )}

        {lens === 'drift' && readings && (
          <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3">
            {readings.map((r) => (
              <LineChart
                key={r.key}
                label={<span style={{ color: r.ink }}>{r.label.toUpperCase()} · % OF SPENDING</span>}
                data={series(r.key)}
                height={132}
                summary={`${r.label} as a share of final expenditure, ${pct(r.value)} at the latest survey.`}
              />
            ))}
          </div>
        )}

        {/* The state's own weight, in the same anatomy as the mix: this
            quarter's composition on the left, the century of it on the right,
            and the two totals underneath. Every figure here is a treasury book
            over the office's estimate of output — a different denominator from
            the three accounts, which is why it is a lens rather than a wedge. */}
        {lens === 'state' && footprint && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[352px_minmax(0,1fr)]">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between font-mono text-[9px] tracking-[0.2em] text-dossier-ink/60">
                  <span>WHAT THE SPENDING BOUGHT</span>
                  <span className="tabular-nums">{yearOf(footprint.latest.tick)}</span>
                </div>
                <DonutChart shares={programmeShares} format={pct} emptyNote="NOTHING SPENT" />
                <div className="mt-0.5 text-right font-mono text-[8px] tracking-[0.1em] text-dossier-ink/45">
                  EACH LINE AGAINST THE WHOLE ECONOMY
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <div className="font-mono text-[9px] tracking-[0.2em] text-dossier-ink/60">THE STATE’S FOOTPRINT, QUARTER BY QUARTER</div>
                <StackedAreaChart
                  rows={programmeRows(footprint.points)}
                  keys={programmeShares}
                  mode="money"
                  markTick={footprint.latest.tick}
                  format={pct}
                  height={158}
                  width={760}
                  summary={`Every programme in points of GDP, stacked, from ${yearOf(footprint.points[0].tick)} to ${yearOf(footprint.latest.tick)}. The height of the stack is the whole state’s footprint.`}
                />
              </div>
            </div>

            {/* Straight to `TimeSeriesChart` rather than the `LineChart`
                preset: that preset carries a 260-wide viewBox, and an SVG
                keeping its own ratio in an 1160px slot is a 480px-tall trace
                that shoves the reading note off the bottom of the modal. A
                wide figure needs a wide viewBox — the same argument
                `StackedAreaChart`'s `width` prop makes about legible type. */}
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[9px] tracking-[0.2em]">
                  <span className="text-dossier-ink/70">OUTLAYS</span>
                  <span className="text-dossier-ink/45"> / </span>
                  <span className="text-dossier-warn">REVENUE</span>
                  <span className="text-dossier-ink/45"> · % OF GDP · THE GAP IS THE BALANCE</span>
                </span>
                <span className="font-mono text-[10px] tabular-nums text-dossier-ink">
                  {footprint.latest.outlays.toFixed(1)} / {footprint.latest.revenue.toFixed(1)}
                </span>
              </div>
              <TimeSeriesChart
                width={1000}
                height={122}
                traces={[
                  { key: 'revenue', points: footprintSeries(footprint.points, (p) => p.revenue), color: 'var(--color-dossier-warn)', width: 1.1 },
                  { key: 'outlays', points: footprintSeries(footprint.points, (p) => p.outlays), color: 'var(--color-dossier-ink)', width: 1.2, lead: true },
                ]}
                /* zero is what both of these are measured against, and a state
                   that has spent itself away to nothing has to draw as one */
                include={[0]}
                pad={0.06}
                formatTick={qtrLabel}
                formatReading={(v) => `${v.toFixed(1)}%`}
                summary={`The treasury spent ${pct(footprint.latest.outlays)} of output and collected ${pct(footprint.latest.revenue)} in ${yearOf(footprint.latest.tick)} Q${qOf(footprint.latest.tick)}, on the office’s own estimate of the economy.`}
                hover
              />
            </div>
          </div>
        )}
      </OverlayLayout>
    </Modal>
  )
}
