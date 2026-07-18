/**
 * The news wire — teletype register (connecting tissue, neither dossier nor
 * terminal). Rumor is the poor state's only instrument.
 */

import type { PublishedState } from '@terrarium/observation'

const qtrLabel = (q: number) => `${1946 + Math.floor(q / 4)} Q${(q % 4) + 1}`

export function NewsWire({ pub }: { pub: PublishedState }) {
  const items = [...pub.news].reverse().slice(0, 3)
  return (
    <footer className="flex min-w-0 items-center gap-2 overflow-hidden border-t border-wire-ink/30 bg-wire-paper px-3 py-1.5">
      <span className="font-mono text-[9px] font-medium tracking-[0.25em] text-wire-ink/60">WIRE</span>
      <div className="flex min-w-0 flex-1 items-baseline gap-4 overflow-x-auto whitespace-nowrap font-mono text-[11px] text-wire-ink">
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
      </div>
    </footer>
  )
}
