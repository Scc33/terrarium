/**
 * The treasury ledger, opened out. Everything here is EXACT — these are the
 * government's books on itself, the one corner of the world that arrives on
 * time, unrevised and true — so it is drawn flat in ink, with no error band
 * and no revision stamp anywhere.
 *
 * The headline balance was hiding the only fiscal question that matters:
 * *which* tax is carrying the state, and *what* the money goes to. So the
 * overlay is one side of the books at a time — a pie for this quarter's mix,
 * the same colours stacked across the century beside it, and the levels
 * underneath. A tax cut now has somewhere to show up.
 */

import { useState } from 'react'
import { OUTLAY_IDS, REVENUE_SOURCE_IDS, type OutlayId, type RevenueSourceId } from '@terrarium/observation'
import type { PublishedState } from '@terrarium/observation'
import { InkLine } from '../components/InkLine'
import { InkPie } from '../components/InkPie'
import { InkStack } from '../components/InkStack'
import { Overlay } from '../components/Overlay'
import { SHARE_INKS, type Share, type StackRow } from '../shares'

/** The printed face of the budget. Both tables are total records, so the day
 * the engine adds a tax or a programme this file stops compiling until it has
 * been named and given an ink — the same compile-enforcement `domains.ts`
 * puts on dial faces. */
const REVENUE_FACE: Record<RevenueSourceId, { label: string; ink: string; note: string }> = {
  income: { label: 'Income tax', ink: SHARE_INKS[0], note: 'Levied on wages. What you collect is the rate times the wage bill times your tax administration — the rate you set is never the rate you get.' },
  corporate: { label: 'Corporate', ink: SHARE_INKS[1], note: 'Levied on positive sector profits. The base vanishes in a slump, which is when you need it.' },
  tariff: { label: 'Tariff', ink: SHARE_INKS[2], note: 'Levied at the border. Customs posts are the easiest revenue a weak state can raise — and the first thing that shrinks as you industrialise.' },
  fuel: { label: 'Fuel excise', ink: SHARE_INKS[3], note: 'Levied on every energy purchase, household and industrial. Cheap to collect, and it reaches the price of bread by way of the lorries.' },
}

const OUTLAY_FACE: Record<OutlayId, { label: string; ink: string; note: string }> = {
  transfers: { label: 'Transfers', ink: SHARE_INKS[0], note: 'Pensions and relief, paid to households. Delivery leaks through weak administration; the budget is charged in full regardless.' },
  procurement: { label: 'Procurement', ink: SHARE_INKS[1], note: 'The state buying goods and services from the economy.' },
  investment: { label: 'Public works', ink: SHARE_INKS[2], note: 'Construction that adds to the national capital stock.' },
  subsidies: { label: 'Subsidies', ink: SHARE_INKS[3], note: 'All sector subsidies together. The per-sector split is on the control rail.' },
  capacity: { label: 'Ministries', ink: SHARE_INKS[4], note: 'Capacity programmes still building — tax administration, the statistical office, the civil service, the schools. Voted for years at a time.' },
  interest: { label: 'Debt service', ink: SHARE_INKS[5], note: 'Coupons on outstanding debt, at the policy rate plus whatever premium the bond market charges you for the debt you already carry. The one line no dial reduces this quarter.' },
}

const money = (v: number) => v.toFixed(1)
const yearOf = (q: number) => 1946 + Math.floor(q / 4)

/** Both faces are total records over their id list, so this stays exhaustive
 * by construction — and the legend order is the engine's order, which is the
 * order the pie is wound in. */
function sharesOf<K extends string>(
  ids: readonly K[],
  faceOf: Record<K, { label: string; ink: string; note: string }>,
  values: Record<K, number>,
): Share[] {
  return ids.map((id) => ({ key: id, value: values[id] ?? 0, ...faceOf[id] }))
}

type Side = 'revenue' | 'outlays'
type Mode = 'money' | 'share'

function Toggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: ReadonlyArray<{ value: T; label: string; title: string }>
  onChange: (v: T) => void
}) {
  return (
    <div className="flex">
      {options.map((o) => (
        <button
          key={o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`border px-2 py-0.5 font-mono text-[9px] tracking-[0.15em] ${
            o.value === value
              ? 'border-dossier-ink bg-dossier-ink text-dossier-paper'
              : 'border-dossier-ink/30 text-dossier-ink/60 hover:border-dossier-ink hover:text-dossier-ink'
          } -ml-px first:ml-0`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Figure({ label, value, tone, title }: { label: string; value: string; tone?: 'warn'; title: string }) {
  return (
    <div className="flex flex-col gap-0.5" title={title}>
      <span className="font-mono text-[8.5px] tracking-[0.2em] text-dossier-ink/55">{label}</span>
      <span className={`font-mono text-base font-semibold tabular-nums ${tone === 'warn' ? 'text-dossier-warn' : 'text-dossier-ink'}`}>
        {value}
      </span>
    </div>
  )
}

export function LedgerOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const [side, setSide] = useState<Side>('revenue')
  const [mode, setMode] = useState<Mode>('money')
  const books = pub.books
  const t = pub.treasury

  const shares =
    side === 'revenue'
      ? sharesOf(REVENUE_SOURCE_IDS, REVENUE_FACE, t.revenueBySource)
      : sharesOf(OUTLAY_IDS, OUTLAY_FACE, t.outlaysByProgramme)

  const rows: StackRow[] = books.map((b) => ({
    tick: b.tick,
    values: side === 'revenue' ? b.revenueBySource : b.outlaysByProgramme,
  }))

  /** Receipts per point of rate — the closest thing the books offer to "what
   * happens if I cut this". It is a snapshot of the base, not a forecast: the
   * base itself moves when the rate does, which is the whole lesson of the
   * fuel excise. Only revenue has rates behind it. */
  const perPoint = (key: string): string => {
    const rate = pub.dials.taxRates[key as RevenueSourceId]
    const take = t.revenueBySource[key as RevenueSourceId]
    if (!rate || rate <= 0) return '—'
    return (take / (rate * 100)).toFixed(2)
  }

  const series = (f: (x: (typeof books)[number]) => number) => books.map((x) => ({ tick: x.tick, value: f(x) }))

  return (
    <Overlay title="THE TREASURY LEDGER — FULL HISTORY, EXACT" onClose={onClose} wide>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-dossier-ink/20 pb-2">
          <Figure label="REVENUE / QTR" value={money(t.revenue)} title="Everything the treasury actually collected this quarter." />
          <Figure label="OUTLAYS / QTR" value={money(t.outlays)} title="Everything it paid out this quarter, debt service included." />
          <Figure
            label="BALANCE"
            value={(t.balance >= 0 ? '+' : '') + money(t.balance)}
            tone={t.balance < 0 ? 'warn' : undefined}
            title="Revenue minus outlays. Deficits are sold to the bond market until it stops buying."
          />
          <Figure label="DEBT" value={t.debt.toFixed(0)} title="Outstanding government debt." />
          <Figure
            label="PRINTED"
            value={t.printed.toFixed(1)}
            tone={t.printed > 0.5 ? 'warn' : undefined}
            title="Cumulative money-financed deficit — what the bond market would not absorb."
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Toggle
            value={side}
            onChange={setSide}
            options={[
              { value: 'revenue', label: 'REVENUE BY SOURCE', title: 'Which taxes are carrying the state.' },
              { value: 'outlays', label: 'OUTLAYS BY PROGRAMME', title: 'What the money is voted to.' },
            ]}
          />
          <Toggle
            value={mode}
            onChange={setMode}
            options={[
              { value: 'money', label: 'LEVELS', title: 'Money per quarter, stacked — how much there was.' },
              { value: 'share', label: 'SHARES', title: 'Each quarter normalised to its own total — how the mix shifted, even as the totals grew tenfold.' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[352px_minmax(0,1fr)]">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between font-mono text-[9px] tracking-[0.2em] text-dossier-ink/60">
              <span>THIS QUARTER</span>
              <span className="tabular-nums">{yearOf(pub.tick)}</span>
            </div>
            <InkPie
              shares={shares}
              format={money}
              extra={side === 'revenue' ? (s) => perPoint(s.key) : undefined}
              emptyNote={side === 'revenue' ? 'NOTHING COLLECTED' : 'NOTHING VOTED'}
            />
            {side === 'revenue' && (
              <div
                className="mt-0.5 text-right font-mono text-[8px] tracking-[0.1em] text-dossier-ink/45"
                title="Receipts divided by the rate you set — this quarter's base, per point of tax. It is a measurement, not a forecast: move the rate and the base moves with it, sometimes further than the rate did."
              >
                LAST COLUMN: TAKE PER 1 PT OF RATE ⓘ
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <div className="font-mono text-[9px] tracking-[0.2em] text-dossier-ink/60">
              {mode === 'share' ? 'THE MIX, QUARTER BY QUARTER' : 'THE LEVELS, QUARTER BY QUARTER'}
            </div>
            <InkStack rows={rows} keys={shares} mode={mode} markTick={pub.tick} format={money} height={158} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-2 border-t border-dossier-ink/20 pt-3 sm:grid-cols-3">
          <InkLine label="BALANCE / QTR" data={series((x) => x.balance)} height={78} />
          <InkLine label="DEBT OUTSTANDING" data={series((x) => x.debt)} height={78} />
          <InkLine label="FX RESERVES" data={series((x) => x.reserves)} height={78} />
        </div>

        <div className="font-dossier text-[12px] italic leading-relaxed text-dossier-ink/70">
          Your own books are the only numbers in this building that arrive on time, un-revised,
          and true. Everything else on the wall is an estimate — remember that when they disagree.
          These are sums voted and paid, not sums that arrived: what survives delivery is a
          question for the civil service, and it is not audited here.
          {t.printed > 0.5 && (
            <div className="mt-2 not-italic text-dossier-warn">
              The mint has printed {t.printed.toFixed(1)} to date. The bond market noticed before
              you did.
            </div>
          )}
        </div>
      </div>
    </Overlay>
  )
}
