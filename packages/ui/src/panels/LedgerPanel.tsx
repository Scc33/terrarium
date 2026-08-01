/**
 * The treasury ledger, docked in the instrument wall. Exact — these are the
 * government's own books, the one part of the world it can see clearly.
 * Click for the full ledger.
 */

import type { PublishedState } from '@terrarium/observation'
import { InkLine } from '../components/InkLine'
import { Overlay } from '../components/Overlay'
import { WallTile } from '../components/WallTile'

export function LedgerPanel({ pub, onOpen }: { pub: PublishedState; onOpen: () => void }) {
  const books = pub.books.slice(-40)
  return (
    <WallTile
      onClick={onOpen}
      title="The treasury's own books — exact, no fog. Click for the full ledger with the whole history."
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
      <InkLine
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

export function LedgerOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const b = pub.books
  const series = (f: (x: (typeof b)[number]) => number) => b.map((x) => ({ tick: x.tick, value: f(x) }))
  return (
    <Overlay title="THE TREASURY LEDGER — FULL HISTORY, EXACT" onClose={onClose} wide>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <InkLine label="REVENUE / QTR" data={series((x) => x.revenue)} height={96} />
        <InkLine label="OUTLAYS / QTR" data={series((x) => x.outlays)} height={96} />
        <InkLine label="BALANCE / QTR" data={series((x) => x.balance)} height={96} />
        <InkLine label="DEBT OUTSTANDING" data={series((x) => x.debt)} height={96} />
        <InkLine label="FX RESERVES" data={series((x) => x.reserves)} height={96} />
        <div className="font-dossier text-[12px] italic leading-relaxed text-dossier-ink/70">
          Your own books are the only numbers in this building that arrive on time, un-revised,
          and true. Everything else on the wall is an estimate — remember that when they disagree.
          {pub.treasury.printed > 0.5 && (
            <div className="mt-2 text-dossier-warn">
              The mint has printed {pub.treasury.printed.toFixed(1)} to date. The bond market
              noticed before you did.
            </div>
          )}
        </div>
      </div>
    </Overlay>
  )
}
