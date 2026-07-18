/**
 * Layer 2 — capacity. Slow, sticky, thankless. Programs take two years to
 * deliver and the stocks quietly rot if neglected.
 */

import { CAPACITY_IDS, type CapacityId } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { useGame } from '../store/gameStore'

const LABELS: Record<CapacityId, { name: string; blurb: string }> = {
  tax: { name: 'Tax administration', blurb: 'gates what the treasury can actually collect' },
  statistical: { name: 'Statistical office', blurb: 'lifts the fog on your own instruments' },
  administrative: { name: 'Civil service', blurb: 'how much of each programme survives delivery' },
}

function Stock({ id, pub }: { id: CapacityId; pub: PublishedState }) {
  const { staged, stage } = useGame()
  const key = `cap:${id}`
  const stagedAction = staged.get(key)
  const building = pub.capacityBuilding.filter((b) => b.target === id)
  const level = pub.capacity[id]
  // a meaningful programme: about a year of the treasury's take
  const amount = Math.max(2, pub.treasury.revenue * 0.8)

  return (
    <div>
      <div className="label-caps" style={{ marginBottom: 6 }}>{LABELS[id].name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, height: 3, background: 'rgba(2,24,43,0.1)' }}>
          <div style={{ width: `${(level * 100).toFixed(0)}%`, height: '100%', background: 'var(--steel)' }} />
        </div>
        <span className="num" style={{ fontSize: 12 }}>{(level * 100).toFixed(0)}</span>
      </div>
      <div className="fine" style={{ marginBottom: 8 }}>
        {LABELS[id].blurb}
        {building.length > 0 && (
          <> · building, {Math.max(...building.map((b) => b.remaining))} quarters left</>
        )}
      </div>
      <button
        disabled={!pub.inPower}
        style={stagedAction ? { background: 'var(--ink)', color: 'var(--paper)' } : undefined}
        onClick={() =>
          stage(
            key,
            stagedAction ? null : { kind: 'investCapacity', target: id, amount },
          )
        }
      >
        {stagedAction ? 'Programme staged' : `Fund programme · ${amount.toFixed(1)}`}
      </button>
    </div>
  )
}

export function Capacity({ pub }: { pub: PublishedState }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <span className="label-caps">State capacity</span>
        <span className="fine">nobody will thank you for any of this</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '18px 40px',
        }}
      >
        {CAPACITY_IDS.map((id) => (
          <Stock key={id} id={id} pub={pub} />
        ))}
      </div>
    </section>
  )
}
