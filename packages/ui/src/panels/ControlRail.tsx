/**
 * The right rail: every lever, always available, always visible — plus the
 * advance control. Compact ministry hardware on felt; the game never says
 * no, it lets you find out.
 */

import { useRef } from 'react'
import { CAPACITY_IDS, SECTOR_IDS, type CapacityId, type DialPath, type SaveFile } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { useGame } from '../store/gameStore'

const pct = (v: number) => `${(v * 100).toFixed(0)}%`
const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`
const money = (v: number) => v.toFixed(1)

interface DialDef {
  path: DialPath
  label: string
  get(pub: PublishedState): number
  min: number
  max(pub: PublishedState): number
  step: number
  fmt(v: number): string
}

const spendMax = (pub: PublishedState) => Math.max(pub.treasury.revenue * 3, 10)

const DIALS: Array<{ group: string; dials: DialDef[] }> = [
  {
    group: 'TAXATION',
    dials: [
      { path: 'taxRates.income', label: 'Income', get: (p) => p.dials.taxRates.income, min: 0, max: () => 0.8, step: 0.01, fmt: pct },
      { path: 'taxRates.corporate', label: 'Corporate', get: (p) => p.dials.taxRates.corporate, min: 0, max: () => 0.8, step: 0.01, fmt: pct },
      { path: 'taxRates.tariff', label: 'Tariff', get: (p) => p.dials.taxRates.tariff, min: 0, max: () => 1, step: 0.01, fmt: pct },
      { path: 'taxRates.fuel', label: 'Fuel excise', get: (p) => p.dials.taxRates.fuel, min: 0, max: () => 2, step: 0.05, fmt: pct },
    ],
  },
  {
    group: 'SPENDING',
    dials: [
      { path: 'spending.transfers', label: 'Transfers', get: (p) => p.dials.spending.transfers, min: 0, max: spendMax, step: 0.1, fmt: money },
      { path: 'spending.procurement', label: 'Procurement', get: (p) => p.dials.spending.procurement, min: 0, max: spendMax, step: 0.1, fmt: money },
      { path: 'spending.investment', label: 'Public works', get: (p) => p.dials.spending.investment, min: 0, max: spendMax, step: 0.1, fmt: money },
    ],
  },
  {
    group: 'MONEY',
    dials: [
      { path: 'policyRate', label: 'Policy rate', get: (p) => p.dials.policyRate, min: 0, max: () => 0.3, step: 0.0025, fmt: pct1 },
    ],
  },
  {
    group: 'SUBSIDIES',
    dials: SECTOR_IDS.map((sid) => ({
      path: `subsidies.${sid}` as DialPath,
      label: sid,
      get: (p: PublishedState) => p.dials.subsidies[sid] ?? 0,
      min: 0,
      max: (p: PublishedState) => Math.max(p.treasury.revenue, 5),
      step: 0.1,
      fmt: money,
    })),
  },
]

function DialRow({ def, pub }: { def: DialDef; pub: PublishedState }) {
  const { staged, stage } = useGame()
  const key = `dial:${def.path}`
  const stagedAction = staged.get(key)
  const current = def.get(pub)
  const value = stagedAction?.kind === 'setDial' ? stagedAction.value : current
  const dirty = stagedAction !== undefined

  return (
    <div className="grid grid-cols-[86px_1fr_52px] items-center gap-2">
      <span className="truncate font-mono text-[10px] tracking-wide text-dossier-paper/75 capitalize">{def.label}</span>
      <input
        type="range"
        min={def.min}
        max={def.max(pub)}
        step={def.step}
        value={value}
        disabled={!pub.inPower}
        onChange={(e) => {
          const v = Number(e.target.value)
          stage(key, Math.abs(v - current) < 1e-9 ? null : { kind: 'setDial', path: def.path, value: v })
        }}
      />
      <span className={`text-right font-mono text-[11px] tabular-nums ${dirty ? 'text-dossier-brass' : 'text-dossier-paper'}`}>
        {def.fmt(value)}
      </span>
    </div>
  )
}

const CAP_LABELS: Record<CapacityId, string> = {
  tax: 'Tax admin',
  statistical: 'Stat office',
  administrative: 'Civil service',
}

function CapacityRow({ id, pub }: { id: CapacityId; pub: PublishedState }) {
  const { staged, stage } = useGame()
  const key = `cap:${id}`
  const stagedAction = staged.get(key)
  const building = pub.capacityBuilding.some((b) => b.target === id)
  const amount = Math.max(2, pub.treasury.revenue * 0.8)
  return (
    <div className="grid grid-cols-[86px_1fr_52px] items-center gap-2">
      <span className="truncate font-mono text-[10px] tracking-wide text-dossier-paper/75">{CAP_LABELS[id]}</span>
      <div className="h-1.5 bg-dossier-paper/15">
        <div className="h-full bg-dossier-brass" style={{ width: `${(pub.capacity[id] * 100).toFixed(0)}%` }} />
      </div>
      <button
        disabled={!pub.inPower}
        title={`Fund a programme (${amount.toFixed(1)} over 2 years)${building ? ' — one already building' : ''}`}
        onClick={() => stage(key, stagedAction ? null : { kind: 'investCapacity', target: id, amount })}
        className={`border px-1 py-0.5 font-mono text-[10px] tabular-nums ${
          stagedAction
            ? 'border-dossier-brass bg-dossier-brass text-dossier-ink'
            : 'border-dossier-paper/30 text-dossier-paper/80 hover:border-dossier-brass hover:text-dossier-brass'
        } disabled:opacity-40`}
      >
        {stagedAction ? 'STAGED' : building ? 'BLDG+' : 'FUND'}
      </button>
    </div>
  )
}

export function ControlRail({ pub }: { pub: PublishedState }) {
  const { advance, advancing, staged, clearStaged, stagedCost, stagedAffordable, rejection, save, loadSave, newGame } = useGame()
  const fileInput = useRef<HTMLInputElement>(null)

  const exportSave = () => {
    if (!save) return
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `terrarium-${pub.country.toLowerCase()}-q${pub.tick}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <aside className="flex flex-col gap-3 border-t-2 border-dossier-brass bg-dossier-felt px-3 py-2.5 lg:h-full lg:overflow-y-auto lg:border-l-2 lg:border-t-0">
      {DIALS.map((g) => (
        <section key={g.group}>
          <div className="mb-1.5 font-mono text-[9px] font-medium tracking-[0.25em] text-dossier-brass">{g.group}</div>
          <div className="flex flex-col gap-1.5">
            {g.dials.map((d) => (
              <DialRow key={d.path} def={d} pub={pub} />
            ))}
          </div>
        </section>
      ))}

      <section>
        <div className="mb-1.5 font-mono text-[9px] font-medium tracking-[0.25em] text-dossier-brass">STATE CAPACITY</div>
        <div className="flex flex-col gap-1.5">
          {CAPACITY_IDS.map((id) => (
            <CapacityRow key={id} id={id} pub={pub} />
          ))}
        </div>
      </section>

      <div className="mt-auto flex flex-col gap-2 border-t border-dossier-paper/20 pt-2.5">
        {rejection && <div className="font-mono text-[10px] leading-snug text-terminal-alert">{rejection}</div>}
        <div className="font-mono text-[10px] tabular-nums text-dossier-paper/70">
          {staged.size === 0
            ? 'No changes staged.'
            : stagedAffordable
              ? `Staged: ${staged.size} · cost ${stagedCost?.toFixed(1) ?? '…'} PC`
              : 'The cabinet will not wear this — not enough political capital.'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={advance}
            disabled={advancing}
            className="flex-1 border-2 border-dossier-brass bg-dossier-brass px-2 py-2 font-mono text-xs font-medium tracking-[0.2em] text-dossier-ink hover:bg-transparent hover:text-dossier-brass disabled:opacity-50"
          >
            {advancing ? 'TURNING…' : 'ADVANCE QUARTER'}
          </button>
          {staged.size > 0 && (
            <button onClick={clearStaged} className="border border-dossier-paper/30 px-2 font-mono text-[10px] text-dossier-paper/70 hover:border-dossier-paper">
              DISCARD
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={exportSave} className="flex-1 border border-dossier-paper/25 py-1 font-mono text-[9px] tracking-[0.2em] text-dossier-paper/60 hover:border-dossier-brass hover:text-dossier-brass">
            EXPORT
          </button>
          <button onClick={() => fileInput.current?.click()} className="flex-1 border border-dossier-paper/25 py-1 font-mono text-[9px] tracking-[0.2em] text-dossier-paper/60 hover:border-dossier-brass hover:text-dossier-brass">
            IMPORT
          </button>
          <button onClick={() => newGame()} className="flex-1 border border-dossier-paper/25 py-1 font-mono text-[9px] tracking-[0.2em] text-dossier-paper/60 hover:border-dossier-brass hover:text-dossier-brass">
            NEW
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void f.text().then((text) => loadSave(JSON.parse(text) as SaveFile))
              e.target.value = ''
            }}
          />
        </div>
        {!pub.inPower && (
          <div className="font-dossier text-[11px] italic leading-snug text-dossier-paper/60">
            The government has fallen. Advance to watch the country carry on without you, or start anew.
          </div>
        )}
      </div>
    </aside>
  )
}
