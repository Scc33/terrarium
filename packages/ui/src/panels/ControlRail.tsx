/**
 * The right rail: every lever, always available, always visible — plus the
 * advance control. Compact ministry hardware on felt; the game never says
 * no, it lets you find out.
 */

import { CAPACITY_IDS, SECTOR_IDS, type CapacityId, type DialPath } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { useGame } from '../store/gameStore'
import { Button, ProgressBar, SectionHeading, SliderField } from '../components/ui'

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
  const { staged, stage } = useGame()
  const key = `dial:${def.path}`
  const stagedAction = staged.get(key)
  const current = def.get(pub)
  const value = stagedAction?.kind === 'setDial' ? stagedAction.value : current
  const dirty = stagedAction !== undefined

  return (
    <SliderField
        label={def.label}
        displayValue={def.fmt(value)}
        dirty={dirty}
        hint={DIAL_TIPS[def.path] ?? `A quarterly subsidy paid to the ${def.label} sector. Most of it leaks through weak administration; all of it hits the budget.`}
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
  const { staged, stage } = useGame()
  const key = `cap:${id}`
  const stagedAction = staged.get(key)
  const building = pub.capacityBuilding.some((b) => b.target === id)
  const amount = Math.max(2, pub.treasury.revenue * 0.8)
  const maxed = pub.capacity[id] >= 0.95
  return (
    <div className="grid grid-cols-[minmax(72px,0.75fr)_minmax(96px,1.4fr)_52px] items-center gap-2">
      <span className="truncate font-mono text-[10px] tracking-wide text-dossier-paper/75" title={CAP_TIPS[id]}>
        {CAP_LABELS[id]}
      </span>
      <ProgressBar value={pub.capacity[id]} label={`${CAP_LABELS[id]} capacity`} />
      <Button
        disabled={!pub.inPower || maxed}
        title={
          maxed
            ? 'This ministry is already at full strength.'
            : `Fund a programme: ${amount.toFixed(1)} spread over 2 years, delivering capacity with a lag.${building ? ' One is already building.' : ''}`
        }
        onClick={() => stage(key, stagedAction ? null : { kind: 'investCapacity', target: id, amount })}
        variant={stagedAction ? 'primary' : 'secondary'}
        size="compact"
        className="min-h-6 px-1 py-0 tracking-[0.08em]"
      >
        {maxed ? 'FULL' : stagedAction ? 'STAGED' : building ? 'BLDG+' : 'FUND'}
      </Button>
    </div>
  )
}

export function ControlRail({ pub }: { pub: PublishedState }) {
  const { advance, advancing, staged, clearStaged, stagedCost, stagedAffordable, rejection } = useGame()

  return (
    <aside className="flex flex-col border-t border-dossier-brass/70 bg-[#294235] lg:h-full lg:overflow-y-auto lg:border-l lg:border-t-0" aria-label="Cabinet controls">
      <div className="border-b border-dossier-paper/12 px-4 py-2.5">
        <div className="font-dossier text-base font-semibold text-dossier-paper">Cabinet desk</div>
        <div className="mt-0.5 font-mono text-[8px] tracking-[0.16em] text-dossier-paper/45">POLICY FOR NEXT QUARTER</div>
      </div>
      <div className="flex flex-col gap-3 px-4 py-2.5">
      {DIALS.map((g) => (
        <section key={g.group}>
          <SectionHeading inverted aside={`${g.dials.length}`}>{g.group}</SectionHeading>
          <div className="flex flex-col gap-1">
            {g.dials.map((d) => (
              <DialRow key={d.path} def={d} pub={pub} />
            ))}
          </div>
        </section>
      ))}

      <section>
        <SectionHeading inverted aside="LONG-TERM">STATE CAPACITY</SectionHeading>
        <div className="flex flex-col gap-1">
          {CAPACITY_IDS.map((id) => (
            <CapacityRow key={id} id={id} pub={pub} />
          ))}
        </div>
      </section>

      </div>
      <div className="sticky bottom-0 mt-auto flex flex-col gap-2 border-t border-dossier-brass/35 bg-[#22382d] px-4 py-2.5 shadow-[0_-8px_20px_rgba(0,0,0,0.16)]">
        {rejection && <div className="font-mono text-[10px] leading-snug text-terminal-alert">{rejection}</div>}
        <div className="font-mono text-[10px] tabular-nums text-dossier-paper/70">
          {staged.size === 0
            ? 'No changes staged.'
            : stagedAffordable
              ? `Staged: ${staged.size} · cost ${stagedCost?.toFixed(1) ?? '…'} PC`
              : 'The cabinet will not wear this — not enough political capital.'}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={advance}
            disabled={advancing}
            variant="primary"
            className="flex-1"
          >
            {advancing ? 'TURNING…' : 'ADVANCE QUARTER'}
          </Button>
          {staged.size > 0 && (
            <Button onClick={clearStaged} variant="secondary" size="compact">
              DISCARD
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
