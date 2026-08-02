/**
 * The right rail: every lever, always available, always visible — plus the
 * advance control. Compact ministry hardware on felt; the game never says
 * no, it lets you find out.
 */

import { useState } from 'react'
import { CAPACITY_IDS, SECTOR_IDS, type CapacityId, type DialPath } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { useGame } from '../store/gameStore'
import { Button, DisclosureSection, Metric, ProgressBar, SliderField } from '../components/ui'

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

const DIAL_TIPS: Partial<Record<DialPath, string>> = {
  'taxRates.income': 'Taxes wages. Collection is gated by tax administration — the rate you set is not the rate you get.',
  'taxRates.corporate': 'Taxes positive sector profits, at the same gated collection.',
  'taxRates.tariff': 'Taxes imports at the border. Customs posts are easy to man, so collection is better.',
  'taxRates.fuel': 'An excise on every energy purchase. Watch what it does to trucking, and then to bread.',
  'spending.transfers': 'Cash to households (pensions, relief). Delivery leaks through weak administration.',
  'spending.procurement': 'The state buys goods and services from the economy.',
  'spending.investment': 'Public works: buys construction and adds to the capital stock.',
  policyRate: 'The central bank rate. Investment responds to the REAL rate — the number here minus expected inflation.',
}

function DialRow({ def, pub }: { def: DialDef; pub: PublishedState }) {
  const { staged, stagedCosts, stage } = useGame()
  const key = `dial:${def.path}`
  const stagedAction = staged.get(key)
  const current = def.get(pub)
  const value = stagedAction?.kind === 'setDial' ? stagedAction.value : current
  const dirty = stagedAction !== undefined
  const max = def.max(pub)

  const setValue = (raw: number) => {
    const stepped = def.min + Math.round((raw - def.min) / def.step) * def.step
    const value = Math.min(max, Math.max(def.min, Number(stepped.toFixed(8))))
    stage(key, Math.abs(value - current) < 1e-9 ? null : { kind: 'setDial', path: def.path, value })
  }

  const delta = value - current
  const deltaDigits = def.path === 'policyRate' ? 1 : 0
  const deltaLabel = def.path.startsWith('taxRates.') || def.path === 'policyRate'
    ? `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(deltaDigits)} PT`
    : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`

  return (
    <SliderField
      label={def.label}
      displayValue={def.fmt(value)}
      currentDisplayValue={def.fmt(current)}
      changeDisplayValue={deltaLabel}
      politicalCost={stagedCosts[key]}
      dirty={dirty}
      hint={DIAL_TIPS[def.path] ?? `A quarterly subsidy paid to the ${def.label} sector. Most of it leaks through weak administration; all of it hits the budget.`}
      min={def.min}
      max={max}
      step={def.step}
      value={value}
      disabled={!pub.inPower}
      onStep={(direction) => setValue(value + direction * def.step)}
      onReset={() => stage(key, null)}
      onChange={(event) => setValue(Number(event.target.value))}
    />
  )
}

const CAP_LABELS: Record<CapacityId, string> = {
  tax: 'Tax admin',
  statistical: 'Stat office',
  administrative: 'Civil service',
  education: 'Schools',
}

const CAP_TIPS: Record<CapacityId, string> = {
  tax: 'Gates what the treasury can actually collect from the tax base.',
  statistical: 'Lifts the fog: funds surveys, shortens lags, shrinks error bands, unlocks instruments.',
  administrative: 'How much of every programme survives delivery instead of leaking.',
  education:
    'Human capital: sets how fast the country can absorb the world technology frontier, and schooling pulls fertility down. Slow to build, slower to matter — and the only way out of the middle.',
}

function CapacityRow({ id, pub }: { id: CapacityId; pub: PublishedState }) {
  const { staged, stagedCosts, stage } = useGame()
  const key = `cap:${id}`
  const stagedAction = staged.get(key)
  const building = pub.capacityBuilding.find((b) => b.target === id)
  const amount = Math.max(2, pub.treasury.revenue * 0.8)
  const maxed = pub.capacity[id] >= 0.95
  return (
    <div className={`border-l-2 px-2 py-1.5 ${stagedAction ? 'border-dossier-brass bg-dossier-paper/[0.06]' : 'border-transparent'}`}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="truncate font-mono text-[10px] tracking-wide text-dossier-paper/75" title={CAP_TIPS[id]}>{CAP_LABELS[id]}</span>
        <span className="font-mono text-[9px] tabular-nums text-dossier-paper/55">{(pub.capacity[id] * 100).toFixed(0)} / 100</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_70px] items-center gap-2">
        <ProgressBar value={pub.capacity[id]} label={`${CAP_LABELS[id]} capacity`} />
        <Button
          disabled={!pub.inPower || maxed}
          title={maxed ? 'This ministry is already at full strength.' : `Fund ${amount.toFixed(1)} over eight quarters.${building ? ` A programme has ${building.remaining} quarters remaining.` : ''}`}
          onClick={() => stage(key, stagedAction ? null : { kind: 'investCapacity', target: id, amount })}
          variant={stagedAction ? 'primary' : 'secondary'}
          size="compact"
          className="min-h-6 px-1 py-0 tracking-[0.08em]"
        >
          {maxed ? 'FULL' : stagedAction ? 'RESET' : 'FUND'}
        </Button>
      </div>
      <div className={`mt-1 font-mono text-[8px] tracking-[0.08em] ${stagedAction ? 'text-dossier-brass' : 'text-dossier-paper/40'}`}>
        {stagedAction
          ? `DRAFTED · ${(stagedCosts[key] ?? 2).toFixed(1)} PC · ${amount.toFixed(1)} TOTAL · ${(amount / 8).toFixed(1)} / QTR · 8Q DELIVERY`
          : building
            ? `BUILDING · ${building.remaining}Q REMAINING · NEW PROGRAMMES MAY STACK`
            : `${amount.toFixed(1)} TOTAL · ${(amount / 8).toFixed(1)} / QTR · 8Q DELIVERY`}
      </div>
    </div>
  )
}

export function ControlRail({ pub }: { pub: PublishedState }) {
  const { advance, advancing, staged, clearStaged, stagedCost, stagedAffordable, previewError, rejection } = useGame()
  const [openGroup, setOpenGroup] = useState<string | null>('TAXATION')
  const finiteCost = stagedCost !== null && Number.isFinite(stagedCost) ? stagedCost : null
  const capitalAfter = finiteCost === null ? null : pub.politicalCapital - finiteCost
  const toggle = (group: string) => setOpenGroup((current) => current === group ? null : group)

  return (
    <aside className="flex flex-col border-t border-dossier-brass/70 bg-[#294235] lg:h-full lg:overflow-y-auto lg:border-l lg:border-t-0" aria-label="Cabinet controls">
      <div className="flex items-center justify-between gap-4 border-b border-dossier-paper/12 px-4 py-2.5">
        <div>
          <div className="font-dossier text-base font-semibold text-dossier-paper">Cabinet desk</div>
          <div className="mt-0.5 font-mono text-[8px] tracking-[0.16em] text-dossier-paper/45">POLICY FOR NEXT QUARTER</div>
        </div>
        <Metric compact inverted label="AVAILABLE" value={`${pub.politicalCapital.toFixed(1)} PC`} tone="accent" />
      </div>
      <div className="flex flex-col gap-2 px-3 py-2">
      {DIALS.map((g) => (
        <DisclosureSection
          key={g.group}
          title={g.group}
          open={openGroup === g.group}
          onToggle={() => toggle(g.group)}
          aside={(() => {
            const count = g.dials.filter((dial) => staged.has(`dial:${dial.path}`)).length
            return count > 0 ? `${count} DRAFTED` : `${g.dials.length} CONTROL${g.dials.length === 1 ? '' : 'S'}`
          })()}
        >
          <div className="flex flex-col gap-1">
            {g.dials.map((d) => (
              <DialRow key={d.path} def={d} pub={pub} />
            ))}
          </div>
        </DisclosureSection>
      ))}

      <DisclosureSection
        title="STATE CAPACITY"
        open={openGroup === 'STATE CAPACITY'}
        onToggle={() => toggle('STATE CAPACITY')}
        aside={CAPACITY_IDS.some((id) => staged.has(`cap:${id}`)) ? `${CAPACITY_IDS.filter((id) => staged.has(`cap:${id}`)).length} DRAFTED` : 'LONG-TERM'}
      >
        <div className="flex flex-col gap-1">
          {CAPACITY_IDS.map((id) => (
            <CapacityRow key={id} id={id} pub={pub} />
          ))}
        </div>
      </DisclosureSection>

      </div>
      <div className="sticky bottom-0 mt-auto flex flex-col gap-2 border-t border-dossier-brass/35 bg-[#22382d] px-4 py-2.5 shadow-[0_-8px_20px_rgba(0,0,0,0.16)]">
        {(rejection || previewError) && <div className="border-l-2 border-terminal-alert pl-2 font-mono text-[9px] leading-snug text-terminal-alert">{rejection ?? previewError}</div>}
        {staged.size === 0 ? (
          <div className="font-mono text-[9px] tracking-[0.08em] text-dossier-paper/55">NO ORDERS DRAFTED · MOVE A CONTROL TO BEGIN</div>
        ) : (
          <div>
            <div className="mb-1.5 flex items-center justify-between font-mono text-[9px] tracking-[0.08em]">
              <span className="text-dossier-paper/65">{staged.size} ORDER{staged.size === 1 ? '' : 'S'} DRAFTED</span>
              <span className={stagedAffordable ? 'text-dossier-brass' : 'text-terminal-alert'}>{finiteCost === null ? 'CALCULATING…' : `${finiteCost.toFixed(1)} PC`}</span>
            </div>
            <ProgressBar value={capitalAfter === null ? 1 : Math.max(0, capitalAfter) / Math.max(pub.politicalCapital, 1)} label="Political capital remaining after drafted orders" tone={stagedAffordable ? 'brass' : 'danger'} />
            <div className="mt-1 flex justify-between font-mono text-[8px] tabular-nums text-dossier-paper/45">
              <span>NOW {pub.politicalCapital.toFixed(1)}</span>
              <span>AFTER {capitalAfter === null ? '…' : Math.max(0, capitalAfter).toFixed(1)} PC</span>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            onClick={advance}
            disabled={advancing || (staged.size > 0 && !stagedAffordable)}
            variant="primary"
            className="flex-1"
          >
            {advancing ? 'TURNING…' : staged.size > 0 ? 'ENACT & ADVANCE' : 'ADVANCE QUARTER'}
          </Button>
          {staged.size > 0 && (
            <Button onClick={clearStaged} variant="secondary" size="compact">
              CLEAR DRAFT
            </Button>
          )}
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
