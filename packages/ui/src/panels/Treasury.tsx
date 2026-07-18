/** The books the government keeps on itself — the only exact numbers you get. */

import type { PublishedState } from '@terrarium/observation'

function Item({ label, value, alarm }: { label: string; value: string; alarm?: boolean }) {
  return (
    <div>
      <div className="label-caps" style={{ marginBottom: 4 }}>{label}</div>
      <div className="num" style={{ fontSize: 22, color: alarm ? 'var(--alarm)' : undefined }}>
        {value}
      </div>
    </div>
  )
}

export function Treasury({ pub }: { pub: PublishedState }) {
  const t = pub.treasury
  return (
    <section className="panel">
      <div className="panel-title">
        <span className="label-caps">Treasury</span>
        <span className="fine">exact, for once — these are your own books</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '14px 26px',
        }}
      >
        <Item label="Revenue / qtr" value={t.revenue.toFixed(1)} />
        <Item label="Outlays / qtr" value={t.outlays.toFixed(1)} />
        <Item label="Balance" value={(t.balance >= 0 ? '+' : '') + t.balance.toFixed(1)} alarm={t.balance < 0} />
        <Item label="Debt" value={t.debt.toFixed(0)} />
        <Item label="Printed, ever" value={t.printed.toFixed(1)} alarm={t.printed > 0.5} />
        <Item label="FX reserves" value={pub.reserves.toFixed(1)} alarm={pub.reserves < 2} />
      </div>
    </section>
  )
}
