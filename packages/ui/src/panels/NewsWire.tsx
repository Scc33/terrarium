/**
 * The ticker along the foot of the wall — teletype register (connecting
 * tissue, neither dossier nor terminal). Rumor is the poor state's only
 * instrument.
 *
 * This is a HEADLINE SERVICE, not the paper. It carries the three most recent
 * dispatches in page order, tagged with the desk that filed them, and its
 * whole job is to be worth opening: the standfirst, the byline, the back
 * numbers and the archive are all one click away in `WireOverlay`.
 *
 * Page order rather than arrival order is the one decision here. Within a
 * quarter, dispatches are appended in pipeline order, so a strict
 * most-recent-first ticker leads on whatever the LAST pipeline step happened
 * to file — which is the bond auction in the quarter of a coup. Sorting the
 * visible window by prominence puts the lead story first, exactly as the
 * front page does, so the ticker and the paper never disagree about what
 * mattered.
 */

import type { DeskId } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { Tooltip } from '../components/ui'
import { pageOrder } from '../newspaper'

const qtrLabel = (q: number) => `${1946 + Math.floor(q / 4)} Q${(q % 4) + 1}`

/** Short enough for a one-line ticker. The full names live on the paper's
 * section rail; these are the wire-service tags. */
const DESK_TAGS: Record<DeskId, string> = {
  home: 'HOME',
  labour: 'LAB',
  finance: 'FIN',
  industry: 'IND',
  land: 'LAND',
  politics: 'POL',
  abroad: 'FGN',
  science: 'SCI',
}

export function NewsWire({ pub, onOpen }: { pub: PublishedState; onOpen: () => void }) {
  const items = pageOrder([...pub.news].slice(-6).reverse()).slice(0, 3)
  return (
    <footer data-tour="wire" className="min-w-0 overflow-hidden border-t border-wire-ink/30 bg-wire-paper" aria-label="News wire">
      <Tooltip content="The paper's latest headlines. Select to read the edition and every back number.">
        <button
          type="button"
          className="flex w-full min-w-0 items-center gap-2 px-3 py-1.5 text-left hover:bg-wire-ink/5 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-warn"
          onClick={onOpen}
          aria-label="Read every dispatch on the news wire"
        >
          <span className="font-mono text-[9px] font-medium tracking-[0.25em] text-wire-ink/60">WIRE</span>
          <span className="flex min-w-0 flex-1 items-baseline gap-4 overflow-hidden whitespace-nowrap font-mono text-[11px] text-wire-ink">
            {items.length === 0 && <span className="opacity-60">+++ ALL QUIET +++</span>}
            {items.map((n, i) => (
              <span key={`${n.tick}-${n.event}-${i}`}>
                <span className="opacity-50">{qtrLabel(n.tick)}</span>{' '}
                <span className="opacity-45">{DESK_TAGS[n.desk]}</span>{' '}
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
      </Tooltip>
    </footer>
  )
}
