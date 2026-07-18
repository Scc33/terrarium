/**
 * Layer 1 — the dials. Every lever is available from turn one; the game
 * never says no, it lets you find out. Staged changes cost political
 * capital on Advance.
 */

import { SECTOR_IDS, type Action, type DialPath } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { useGame } from '../store/gameStore'

interface DialDef {
  path: DialPath
  label: string
  get(pub: PublishedState): number
  min: number
  max(pub: PublishedState): number
  step: number
  fmt(v: number): string
}

const pct = (v: number) => `${(v * 100).toFixed(0)}%`
const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`
const money = (v: number) => v.toFixed(1)

/** spending ranges are keyed to what the treasury actually collects —
 * the books the government can see */
const spendMax = (pub: PublishedState) => Math.max(pub.treasury.revenue * 3, 10)

const TAX_DIALS: DialDef[] = [
  { path: 'taxRates.income', label: 'Income tax', get: (p) => p.dials.taxRates.income, min: 0, max: () => 0.8, step: 0.01, fmt: pct },
  { path: 'taxRates.corporate', label: 'Corporate tax', get: (p) => p.dials.taxRates.corporate, min: 0, max: () => 0.8, step: 0.01, fmt: pct },
  { path: 'taxRates.tariff', label: 'Tariff', get: (p) => p.dials.taxRates.tariff, min: 0, max: () => 1, step: 0.01, fmt: pct },
  { path: 'taxRates.fuel', label: 'Fuel excise', get: (p) => p.dials.taxRates.fuel, min: 0, max: () => 2, step: 0.05, fmt: pct },
]

const SPEND_DIALS: DialDef[] = [
  { path: 'spending.transfers', label: 'Transfers', get: (p) => p.dials.spending.transfers, min: 0, max: spendMax, step: 0.1, fmt: money },
  { path: 'spending.procurement', label: 'Procurement', get: (p) => p.dials.spending.procurement, min: 0, max: spendMax, step: 0.1, fmt: money },
  { path: 'spending.investment', label: 'Public works', get: (p) => p.dials.spending.investment, min: 0, max: spendMax, step: 0.1, fmt: money },
]

const RATE_DIAL: DialDef = {
  path: 'policyRate',
  label: 'Policy rate',
  get: (p) => p.dials.policyRate,
  min: 0,
  max: () => 0.3,
  step: 0.0025,
  fmt: pct1,
}

function Dial({ def, pub }: { def: DialDef; pub: PublishedState }) {
  const { staged, stage } = useGame()
  const key = `dial:${def.path}`
  const stagedAction = staged.get(key)
  const current = def.get(pub)
  const value = stagedAction?.kind === 'setDial' ? stagedAction.value : current
  const dirty = stagedAction !== undefined

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span className="label-caps">{def.label}</span>
        <span className="num" style={{ fontSize: 12, color: dirty ? 'var(--series-sienna)' : undefined }}>
          {def.fmt(value)}
          {dirty && <span style={{ opacity: 0.55 }}> ← {def.fmt(current)}</span>}
        </span>
      </div>
      <input
        type="range"
        min={def.min}
        max={def.max(pub)}
        step={def.step}
        value={value}
        disabled={!pub.inPower}
        onChange={(e) => {
          const v = Number(e.target.value)
          const action: Action = { kind: 'setDial', path: def.path, value: v }
          stage(key, Math.abs(v - current) < 1e-9 ? null : action)
        }}
      />
    </div>
  )
}

function SubsidyDial({ sector, pub }: { sector: (typeof SECTOR_IDS)[number]; pub: PublishedState }) {
  const def: DialDef = {
    path: `subsidies.${sector}`,
    label: sector,
    get: (p) => p.dials.subsidies[sector] ?? 0,
    min: 0,
    max: (p) => Math.max(p.treasury.revenue, 5),
    step: 0.1,
    fmt: money,
  }
  return <Dial def={def} pub={pub} />
}

export function PolicyDrawer({ pub }: { pub: PublishedState }) {
  const { stagedCost, stagedAffordable, staged } = useGame()
  return (
    <section className="panel">
      <div className="panel-title">
        <span className="label-caps">The dials</span>
        <span className="fine">
          {staged.size === 0
            ? 'stage changes, then advance the quarter'
            : stagedAffordable
              ? `staged changes will cost ${stagedCost?.toFixed(1) ?? '…'} political capital`
              : 'the cabinet will not wear this — not enough political capital'}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '4px 40px',
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Taxation</div>
          {TAX_DIALS.map((d) => (
            <Dial key={d.path} def={d} pub={pub} />
          ))}
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Spending</div>
          {SPEND_DIALS.map((d) => (
            <Dial key={d.path} def={d} pub={pub} />
          ))}
          <Dial def={RATE_DIAL} pub={pub} />
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Subsidies</div>
          {SECTOR_IDS.map((s) => (
            <SubsidyDial key={s} sector={s} pub={pub} />
          ))}
        </div>
      </div>
    </section>
  )
}
