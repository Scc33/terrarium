/**
 * The night itself. A campaign that got its own scene deserves a result that
 * gets one too — the wire line ("The government is returned at the polls")
 * tells you the outcome but never the arithmetic, and the arithmetic is what
 * teaches you whether the platform you mortgaged something for was worth it.
 *
 * Shows once, when the votes are counted.
 */

import type { PublishedState } from '@terrarium/observation'
import { Modal } from '../components/ui'
import { BLOC_NAMES, PLATFORM_NAMES } from '../components/labels'

const pct = (v: number) => `${(v * 100).toFixed(1)}%`
const yearOf = (q: number) => `${1946 + Math.floor(q / 4)}Q${(q % 4) + 1}`

export function ElectionResultOverlay({
  pub,
  onClose,
}: {
  pub: PublishedState
  onClose: () => void
}) {
  const r = pub.lastElection
  if (!r) return null
  const total = r.support + r.swing

  return (
    <Modal title="THE COUNT" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <div
            className={`mx-auto inline-block -rotate-2 border-2 px-4 py-1.5 font-mono text-sm font-bold tracking-[0.3em] ${
              r.suppressed
                ? 'border-dossier-warn text-dossier-warn'
                : r.won
                  ? 'border-dossier-felt text-dossier-felt'
                  : 'border-dossier-warn text-dossier-warn'
            }`}
          >
            {r.suppressed ? 'RETURNED — UNOPPOSED' : r.won ? 'RETURNED' : 'DEFEATED'}
          </div>
          <div className="mt-2 font-mono text-[11px] tabular-nums tracking-[0.2em] text-dossier-ink/70">
            {yearOf(r.tick)} · {pub.country}
          </div>
        </div>

        <section className="border border-dossier-ink/25 p-3">
          <div className="mb-2 font-mono text-[9px] font-medium tracking-[0.3em] text-dossier-ink/60">
            THE COUNT
          </div>
          <div className="flex flex-col gap-1 font-mono text-[12px] tabular-nums text-dossier-ink">
            <div className="flex justify-between">
              <span className="font-dossier text-dossier-ink/75">Support among voters</span>
              <span>{pct(r.support)}</span>
            </div>
            {r.swing !== 0 && (
              <div className="flex justify-between text-dossier-brass">
                <span className="font-dossier">
                  The campaign — you {PLATFORM_NAMES[r.platform]}
                  {r.bloc ? ` (${BLOC_NAMES[r.bloc]})` : ''}
                </span>
                <span>
                  {r.swing >= 0 ? '+' : ''}
                  {pct(r.swing)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-dossier text-dossier-ink/75">The bar to clear</span>
              <span>{pct(r.threshold)}</span>
            </div>
            <div
              className={`mt-1 flex justify-between border-t border-dossier-ink/20 pt-1 font-medium ${
                r.won ? 'text-dossier-felt' : 'text-dossier-warn'
              }`}
            >
              <span className="font-dossier">Margin</span>
              <span>
                {total - r.threshold >= 0 ? '+' : ''}
                {pct(total - r.threshold)}
              </span>
            </div>
          </div>
        </section>

        <p className="font-dossier text-[12px] leading-snug text-dossier-ink/75">
          {r.suppressed
            ? 'The result was never in doubt; that is precisely what the historians will record. A mandate taken is not a mandate given, and the Legitimacy grade counts them separately.'
            : r.won
              ? 'A mandate, for sixteen more quarters. What you spent to get it comes due over the same period.'
              : 'The electorate has withdrawn its consent. The country, of course, carries on without you.'}
        </p>
      </div>
    </Modal>
  )
}
