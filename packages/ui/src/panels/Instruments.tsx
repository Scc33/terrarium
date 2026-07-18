/**
 * The instrument panel is the game (§3.2). Only funded indicators render a
 * chart; the empty slots advertise exactly what the statistical office
 * cannot yet see — the fog made visible.
 */

import type { PublishedState } from '@terrarium/observation'
import { LineChart } from '../components/LineChart'

const SLOTS = [
  {
    id: 'gdp_growth' as const,
    color: 'var(--series-blue)',
    missing: 'Customs receipts and guesswork only.',
  },
  {
    id: 'inflation' as const,
    color: 'var(--series-sienna)',
    missing: 'No one is walking the markets writing down prices. Fund the statistical office.',
  },
  {
    id: 'unemployment' as const,
    color: 'var(--series-green)',
    missing: 'No labour force survey exists. Fund the statistical office to raise one.',
  },
]

export function Instruments({ pub }: { pub: PublishedState }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <span className="label-caps">Instruments</span>
        <span className="fine">
          hollow marks may still be revised · bands are the office’s own confessed error
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '18px 28px',
        }}
      >
        {SLOTS.map((slot) => {
          const series = pub.indicators[slot.id]
          return (
            <div key={slot.id}>
              <div className="label-caps" style={{ marginBottom: 8 }}>
                {series?.label ??
                  { gdp_growth: 'GDP growth', inflation: 'Inflation', unemployment: 'Unemployment' }[
                    slot.id
                  ]}
                {series && <span style={{ opacity: 0.5 }}> · {series.unit}</span>}
              </div>
              {series ? (
                <LineChart series={series} color={slot.color} now={pub.tick} />
              ) : (
                <div
                  className="fine"
                  style={{
                    border: '1px dashed rgba(2,24,43,0.2)',
                    padding: '38px 22px',
                    textAlign: 'center',
                  }}
                >
                  {slot.missing}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
