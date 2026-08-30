/**
 * The treasury ledger, docked in the instrument wall. Exact — these are the
 * government's own books, the one part of the world it can see clearly.
 * Two lines and three totals is all the bay affords; the composition of each
 * side lives one click away in `LedgerOverlay`.
 */

import type { PublishedState } from '@terrarium/observation'
import { LineChart, Tooltip } from '../components/ui'
import { WallTile } from '../components/WallTile/WallTile'

export function LedgerPanel({ pub, onOpen }: { pub: PublishedState; onOpen: () => void }) {
  const books = pub.books.slice(-40)
  const openHelp = 'The government’s exact accounts. BAL is revenue minus spending, DEBT is money still owed, and FX is foreign money held in reserve. Open for the full history.'
  return (
    <WallTile
      className="border-2 border-dossier-brass bg-dossier-paper hover:border-dossier-ink"
      bodyClassName="px-3 py-1.5"
      header={
        <Tooltip content={openHelp}>
          <button
            type="button"
            onClick={onOpen}
            aria-label="Open the full treasury ledger"
            className="flex w-full items-baseline justify-between border-b border-dossier-ink/20 px-3 py-1.5 text-left hover:bg-dossier-brass/10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-brass"
          >
            <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-dossier-ink">
              TREASURY LEDGER
            </span>
            <span className="font-mono text-[9px] tracking-[0.15em] text-dossier-ink/50">OPEN →</span>
          </button>
        </Tooltip>
      }
      footer={
        <div className="flex w-full gap-4 border-t border-dossier-ink/20 px-3 py-1 font-mono text-[10px] tabular-nums text-dossier-ink/80">
          <span aria-label="Quarterly balance: revenue minus spending">
            BAL {(pub.treasury.balance >= 0 ? '+' : '') + pub.treasury.balance.toFixed(1)}
          </span>
          <span aria-label="Government debt">DEBT {pub.treasury.debt.toFixed(0)}</span>
          <span aria-label="Foreign money held in reserve">FX {pub.reserves.toFixed(1)}</span>
          <span aria-label="Exchange rate: units of domestic money per unit of foreign. Higher is a weaker currency.">
            RATE {pub.exchangeRate.toFixed(2)}
          </span>
        </div>
      }
    >
      <LineChart
        label={
          <>
            <span className="text-dossier-ink">REVENUE</span>
            <span className="opacity-50"> ✕ </span>
            <span className="text-dossier-warn">OUTLAYS</span>
          </>
        }
        data={books.map((b) => ({ tick: b.tick, value: b.revenue }))}
        compare={books.map((b) => ({ tick: b.tick, value: b.outlays }))}
        height={70}
        fill
      />
    </WallTile>
  )
}
