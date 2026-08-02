/**
 * The treasury ledger, docked in the instrument wall. Exact — these are the
 * government's own books, the one part of the world it can see clearly.
 * Two lines and three totals is all the bay affords; the composition of each
 * side lives one click away in `LedgerOverlay`.
 */

import type { PublishedState } from '@terrarium/observation'
import { LineChart } from '../components/ui'
import { WallTile } from '../components/WallTile/WallTile'

export function LedgerPanel({ pub, onOpen }: { pub: PublishedState; onOpen: () => void }) {
  const books = pub.books.slice(-40)
  return (
    <WallTile
      onClick={onOpen}
      title="The treasury's own books — exact, no fog. Click for the full ledger: where the revenue came from, what the outlays went to, and both across the whole century."
      className="border-2 border-dossier-brass bg-dossier-paper hover:border-dossier-ink"
      bodyClassName="px-3 py-1.5"
      header={
        <div className="flex w-full items-baseline justify-between border-b border-dossier-ink/20 px-3 py-1.5">
          <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-dossier-ink">
            TREASURY LEDGER
          </span>
          <span className="font-mono text-[9px] tracking-[0.15em] text-dossier-ink/50">OPEN →</span>
        </div>
      }
      footer={
        <div className="flex w-full gap-4 border-t border-dossier-ink/20 px-3 py-1 font-mono text-[10px] tabular-nums text-dossier-ink/80">
          <span title="Quarterly balance: revenue minus outlays">
            BAL {(pub.treasury.balance >= 0 ? '+' : '') + pub.treasury.balance.toFixed(1)}
          </span>
          <span title="Outstanding government debt">DEBT {pub.treasury.debt.toFixed(0)}</span>
          <span title="Foreign-exchange reserves at the central bank">FX {pub.reserves.toFixed(1)}</span>
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
      />
    </WallTile>
  )
}
