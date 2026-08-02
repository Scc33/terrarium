/** The full dispatch spike — every rumor the wire ever carried. */

import type { PublishedState } from '@terrarium/observation'
import { Modal } from '../components/ui'

const qtrLabel = (q: number) => `${1946 + Math.floor(q / 4)} Q${(q % 4) + 1}`

export function WireOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const items = [...pub.news].reverse()
  return (
    <Modal title="THE WIRE — ALL DISPATCHES" onClose={onClose}>
      <div className="bg-wire-paper p-3">
        {items.length === 0 && (
          <div className="font-mono text-[11px] text-wire-ink/60">+++ ALL QUIET, ALWAYS +++</div>
        )}
        <div className="flex flex-col gap-1.5">
          {items.map((n, i) => (
            <div key={`${n.tick}-${i}`} className="flex gap-3 font-mono text-[11px] leading-snug">
              <span className="whitespace-nowrap tabular-nums text-wire-ink/50">{qtrLabel(n.tick)}</span>
              <span
                className={
                  n.tone === 'bad'
                    ? 'text-dossier-warn'
                    : n.tone === 'good'
                      ? 'text-dossier-felt'
                      : 'text-wire-ink'
                }
              >
                {n.text.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
