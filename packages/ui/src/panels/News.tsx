/** Rumor is a signal too — how the fog stays playable before you can afford
 * real statistics. */

import type { PublishedState } from '@terrarium/observation'

const qtrLabel = (q: number) => `${1946 + Math.floor(q / 4)} Q${(q % 4) + 1}`

export function News({ pub }: { pub: PublishedState }) {
  const items = [...pub.news].reverse().slice(0, 10)
  return (
    <section className="panel">
      <div className="panel-title">
        <span className="label-caps">Dispatches</span>
        <span className="fine">what people are saying, for whatever that is worth</span>
      </div>
      {items.length === 0 && <div className="fine">A quiet country, so far.</div>}
      <div style={{ display: 'grid', gap: 7 }}>
        {items.map((n, i) => (
          <div key={`${n.tick}-${i}`} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
            <span className="num" style={{ fontSize: 11, opacity: 0.45, whiteSpace: 'nowrap' }}>
              {qtrLabel(n.tick)}
            </span>
            <span
              style={{ fontSize: 15, fontStyle: 'italic', fontWeight: 300 }}
              className={n.tone === 'bad' ? 'tone-bad' : n.tone === 'good' ? 'tone-good' : undefined}
            >
              {n.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
