import type { PopulationBasis } from '../perPerson'
import { FIRST_YEAR } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { ChartFrame, EmptyState, Metric, TimeSeriesChart } from '../components/ui'
import { publicAssetLines } from '../publicAssets'
import { readDebtSchedule } from '../yieldCurve'

/** Shared asset-book painter for the central bank and the treasury. */
export function PublicAssetBook({ pub, book, basis = 'total' }: { pub: PublishedState; book: 'bank' | 'treasury'; basis?: PopulationBasis }) {
  const schedule = readDebtSchedule(pub)
  const flows = book === 'bank' ? [
    { label: 'ASSETS BOUGHT', value: pub.centralBank.purchases, note: 'Paid with new central-bank money, outside the treasury budget. Sized from the latest official GDP; purchases wait for its first release.' },
    { label: 'ASSETS MATURED', value: pub.centralBank.runoff, note: 'Acquisition-cost principal leaving the purchased-asset book after five years. Separate from treasury debt retirement.' },
    { label: 'FX BOUGHT / SOLD', value: pub.centralBank.fxIntervention, note: 'Positive buys foreign exchange; negative sells it for domestic money. Includes the bank’s reserve-cover top-up and only counts transactions it could fill.' },
  ] : [
    { label: 'DEBT REPAID', value: pub.treasury.debtRepaid, note: 'Cash returned to bondholders, excluding matched refinancing. Early buybacks use current market prices.' },
    { label: 'FUND SAVED', value: Math.max(0, pub.treasury.fundFlow), note: 'Surplus remaining after debt repayment and household rebates.' },
    { label: 'FUND DRAWN', value: Math.max(0, -pub.treasury.fundFlow), note: 'Savings used to cover this quarter’s deficit.' },
    { label: 'REBATE PAID', value: pub.treasury.fiscalRebate, note: 'Residual surplus returned to households under the surplus-payout order.' },
    { label: 'NEW BORROWING', value: pub.treasury.bondsIssued, note: 'New money borrowed after using available savings. Excludes matched refinancing.' },
    { label: 'REFINANCED', value: pub.treasury.bondsRefinanced, note: 'Maturing principal replaced with new bonds at today’s yields and chosen maturity.' },
    { label: 'FINANCING PRINTED', value: pub.treasury.deficitPrinting, note: 'Operating deficits and failed refinancing that the bond market could not fund. Separate from central-bank asset purchases.' },
  ]
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {publicAssetLines(pub, book).map((line) => (
          <div key={line.key} className="min-w-0">
            <ChartFrame title={line.label} detail={`${basis === 'perPerson' ? 'MONEY / PERSON' : 'DOMESTIC MONEY'} · EXACT BOOK`} value={line.value.toFixed(1)} summary={line.note}>
              {line.points.length > 0 ? (
                <TimeSeriesChart width={500} height={140}
                  traces={[{ key: line.key, points: line.points, color: 'var(--color-dossier-felt)', lead: true }]}
                  include={[0]} pad={0.08}
                  formatTick={(q) => String(FIRST_YEAR + Math.floor(q / 4))}
                  formatReading={(v) => v.toFixed(1)} summary={line.note} hover />
              ) : (
                <EmptyState title="OPENING BOOK" compact>Opening balance shown above. Quarterly history begins after the first advance.</EmptyState>
              )}
            </ChartFrame>
            <p className="mt-2 font-dossier text-[11px] leading-snug text-dossier-ink/70">{line.note}</p>
          </div>
        ))}
      </div>
      {book === 'treasury' && (
        <div className="border-t border-dossier-ink/20 pt-2">
          <p className="mb-2 font-mono text-[9px] tracking-[0.15em] text-dossier-ink/60">LOCKED COUPONS · PRINCIPAL RETURNING FOR REFINANCING</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Metric label="AVERAGE COUPON" value={schedule.coupon === null ? 'DEBT FREE' : `${(100 * schedule.coupon).toFixed(2)}%`}
              title="Principal-weighted annual coupon on outstanding contracts. A new yield quote does not change this bill." />
            {schedule.buckets.map(bucket => <Metric key={bucket.label} label={bucket.label} value={bucket.principal.toFixed(1)}
              title="Outstanding face principal due in this window. Surpluses can buy it back earlier at market prices." />)}
          </div>
        </div>
      )}
      <div className="border-t border-dossier-ink/20 pt-2">
        <p className="mb-2 font-mono text-[9px] tracking-[0.15em] text-dossier-ink/60">LAST COMPLETED QUARTER · DOMESTIC MONEY</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {flows.map((flow) => <Metric key={flow.label} label={flow.label} value={flow.value.toFixed(1)} title={flow.note} />)}
        </div>
      </div>
    </div>
  )
}
