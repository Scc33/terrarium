/**
 * The news wire — teletype register (connecting tissue, neither dossier nor
 * terminal). Rumor is the poor state's only instrument.
 */

import type { PublishedState } from '@terrarium/observation'

const qtrLabel = (q: number) => `${1946 + Math.floor(q / 4)} Q${(q % 4) + 1}`

export function NewsWire({ pub, onOpen }: { pub: PublishedState; onOpen: () => void }) {
  const items = [...pub.news].reverse().slice(0, 3)
  return (
    <footer className="min-w-0 overflow-hidden border-t border-wire-ink/30 bg-wire-paper" aria-label="News wire">
      <button
        type="button"
        className="flex w-full min-w-0 items-center gap-2 px-3 py-1.5 text-left hover:bg-wire-ink/5 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-warn"
        onClick={onOpen}
        title="Read every dispatch the wire has carried."
        aria-label="Read every dispatch on the news wire"
      >
        <span className="font-mono text-[9px] font-medium tracking-[0.25em] text-wire-ink/60">WIRE</span>
        <span className="flex min-w-0 flex-1 items-baseline gap-4 overflow-hidden whitespace-nowrap font-mono text-[11px] text-wire-ink">
          {items.length === 0 && <span className="opacity-60">+++ ALL QUIET +++</span>}
          {items.map((n, i) => (
            <span key={`${n.tick}-${i}`}>
              <span className="opacity-50">{qtrLabel(n.tick)}</span>{' '}
              <span className={n.tone === 'bad' ? 'text-dossier-warn' : n.tone === 'good' ? 'text-dossier-felt' : ''}>
                {n.text.toUpperCase()}
              </span>{' '}
              <span className="opacity-40">+++</span>
            </span>
          ))}
        </span>
        <span className="hidden shrink-0 border-l border-wire-ink/20 pl-2 font-mono text-[8px] font-medium tracking-[0.12em] text-wire-ink/55 sm:inline">
          READ ALL →
        </span>
      </button>
    </footer>
  )
}
