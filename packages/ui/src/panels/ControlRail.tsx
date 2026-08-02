/**
 * The cabinet workspace: one decision domain at a time, with the draft and
 * enact flow pinned below it. It is a right rail on full desktops and the
 * same focused drawer at smaller laptop and tablet widths.
 */

import { CAPACITY_IDS, SECTOR_IDS, type CapacityId, type DialPath } from '@terrarium/engine'
import { INDICATOR_IDS, type PublishedState } from '@terrarium/observation'
import { useGame } from '../store/gameStore'
import { Button, Metric, ProgressBar, SliderField } from '../components/ui'
import { NAMES } from '../components/labels'
import { deriveInstrumentAccess, nextInstrumentUnlock } from '../maturity'

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

export type CabinetGroup = 'TAXATION' | 'SPENDING' | 'MONEY' | 'SUBSIDIES' | 'STATE CAPACITY'

interface DialGroup {
  group: Exclude<CabinetGroup, 'STATE CAPACITY'>
  tab: string
  brief: string
  question: string
  dials: DialDef[]
}

const DIALS: DialGroup[] = [
  {
    group: 'TAXATION',
    tab: 'REVENUE',
    brief: 'Choose who finances the state. Collection strength decides how much of each posted rate reaches the treasury.',
    question: 'Who carries the tax burden?',
    dials: [
      { path: 'taxRates.income', label: 'Income', get: (p) => p.dials.taxRates.income, min: 0, max: () => 0.8, step: 0.01, fmt: pct },
      { path: 'taxRates.corporate', label: 'Corporate', get: (p) => p.dials.taxRates.corporate, min: 0, max: () => 0.8, step: 0.01, fmt: pct },
      { path: 'taxRates.tariff', label: 'Tariff', get: (p) => p.dials.taxRates.tariff, min: 0, max: () => 1, step: 0.01, fmt: pct },
      { path: 'taxRates.fuel', label: 'Fuel excise', get: (p) => p.dials.taxRates.fuel, min: 0, max: () => 2, step: 0.05, fmt: pct },
    ],
  },
  {
    group: 'SPENDING',
    tab: 'SPENDING',
    brief: 'Set the quarterly programme mix. The civil service determines how much reaches the country, but the books pay the full amount.',
    question: 'Where should the next quarter go?',
    dials: [
      { path: 'spending.transfers', label: 'Transfers', get: (p) => p.dials.spending.transfers, min: 0, max: spendMax, step: 0.1, fmt: money },
      { path: 'spending.procurement', label: 'Procurement', get: (p) => p.dials.spending.procurement, min: 0, max: spendMax, step: 0.1, fmt: money },
      { path: 'spending.investment', label: 'Public works', get: (p) => p.dials.spending.investment, min: 0, max: spendMax, step: 0.1, fmt: money },
    ],
  },
  {
    group: 'MONEY',
    tab: 'CENTRAL BANK',
    brief: 'Set the price of money. Investment, the bond market, exchange reserves, and financial risk all listen.',
    question: 'How tight should money be?',
    dials: [
      { path: 'policyRate', label: 'Policy rate', get: (p) => p.dials.policyRate, min: 0, max: () => 0.3, step: 0.0025, fmt: pct1 },
    ],
  },
  {
    group: 'SUBSIDIES',
    tab: 'INDUSTRY',
    brief: 'Direct quarterly support to particular sectors. Subsidies can relieve a bottleneck, but they are recurring claims on the budget.',
    question: 'Which industries get support?',
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

const CAP_EFFECTS: Record<CapacityId, string> = {
  tax: 'More of every posted tax rate is actually collected.',
  statistical: 'Fits new wall instruments, then shortens lags and narrows error bands.',
  administrative: 'More programme spending survives delivery instead of leaking away.',
  education: 'Raises technology absorption and steadily changes the demographic future.',
}

function CapacityRow({ id, pub }: { id: CapacityId; pub: PublishedState }) {
  const { staged, stagedCosts, stage } = useGame()
  const key = `cap:${id}`
  const stagedAction = staged.get(key)
  const building = pub.capacityBuilding.find((b) => b.target === id)
  const amount = Math.max(2, pub.treasury.revenue * 0.8)
  const maxed = pub.capacity[id] >= 0.95
  const instrumentAccess = deriveInstrumentAccess(pub)
  const awaitingCount = id === 'statistical'
    ? INDICATOR_IDS.filter((indicator) => instrumentAccess[indicator].availability === 'awaiting').length
    : 0
  const nextUnlock = id === 'statistical' ? nextInstrumentUnlock(pub.capacity.statistical) : null
  return (
    <div className={`border px-2.5 py-2 ${stagedAction ? 'border-dossier-brass bg-dossier-paper/[0.08]' : 'border-dossier-paper/15 bg-[#22382d]/35'}`}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="truncate font-mono text-[11px] font-medium tracking-wide text-dossier-paper" title={CAP_TIPS[id]}>{CAP_LABELS[id]}</span>
        <span className="font-mono text-[10px] font-semibold tabular-nums text-dossier-brass">{(pub.capacity[id] * 100).toFixed(0)} / 100</span>
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
      <p className="mt-1.5 font-dossier text-[11px] leading-snug text-dossier-paper/70">{CAP_EFFECTS[id]}</p>
      {id === 'statistical' && (nextUnlock || awaitingCount > 0) && (
        <div className="mt-1.5 border-l border-dossier-brass/60 pl-2 font-mono text-[8px] leading-relaxed tracking-[0.08em] text-dossier-brass">
          {awaitingCount > 0 && `${awaitingCount} COMMISSIONED · RETURNS PENDING`}
          {awaitingCount > 0 && nextUnlock && <span aria-hidden="true"> · </span>}
          {nextUnlock && `NEXT @ ${Math.round(nextUnlock.fundedAt * 100)} · ${nextUnlock.indicators.map((indicator) => NAMES[indicator].short).join(' + ')}`}
        </div>
      )}
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

export function ControlRail({
  pub,
  openGroup,
  onOpenGroupChange,
}: {
  pub: PublishedState
  openGroup: CabinetGroup
  onOpenGroupChange: (group: CabinetGroup) => void
}) {
  const { advance, advancing, staged, clearStaged, stagedCost, stagedAffordable, previewError, rejection } = useGame()
  const finiteCost = stagedCost !== null && Number.isFinite(stagedCost) ? stagedCost : null
  const capitalAfter = finiteCost === null ? null : pub.politicalCapital - finiteCost
  const activeDials = DIALS.find((group) => group.group === openGroup)
  const draftedIn = (group: CabinetGroup) => group === 'STATE CAPACITY'
    ? CAPACITY_IDS.filter((id) => staged.has(`cap:${id}`)).length
    : DIALS.find((candidate) => candidate.group === group)?.dials.filter((dial) => staged.has(`dial:${dial.path}`)).length ?? 0
  const fiscalTone = pub.treasury.balance < 0 ? 'text-terminal-alert' : 'text-dossier-paper'

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-dossier-brass/70 bg-[#294235]" aria-label="Cabinet controls">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-dossier-paper/15 px-4 py-2.5">
        <div>
          <div className="font-dossier text-lg font-semibold leading-none text-dossier-paper">Cabinet desk</div>
          <div className="mt-1 font-mono text-[9px] tracking-[0.16em] text-dossier-brass">ORDERS FOR THE NEXT QUARTER</div>
        </div>
        <Metric inverted label="POLITICAL CAPITAL" value={pub.politicalCapital.toFixed(1)} detail="AVAILABLE" tone="accent" className="items-end text-right" />
      </div>
      <div className="grid shrink-0 grid-cols-3 border-b border-dossier-paper/15" role="tablist" aria-label="Cabinet decision areas">
        {DIALS.map((group) => {
          const selected = openGroup === group.group
          const count = draftedIn(group.group)
          return (
            <button
              key={group.group}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onOpenGroupChange(group.group)}
              className={`relative min-h-11 border-b border-r border-dossier-paper/10 px-2 py-1.5 text-left font-mono transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-brass ${
                selected ? 'bg-dossier-paper text-dossier-ink' : 'text-dossier-paper/68 hover:bg-dossier-paper/5 hover:text-dossier-paper'
              }`}
            >
              <span className="block text-[9px] font-semibold tracking-[0.1em]">{group.tab}</span>
              <span className={`mt-0.5 block text-[8px] tracking-[0.08em] ${selected ? 'text-dossier-ink/55' : count ? 'text-dossier-brass' : 'text-dossier-paper/38'}`}>
                {count ? `${count} DRAFTED` : `${group.dials.length} CONTROL${group.dials.length === 1 ? '' : 'S'}`}
              </span>
            </button>
          )
        })}
        <button
          type="button"
          role="tab"
          aria-selected={openGroup === 'STATE CAPACITY'}
          onClick={() => onOpenGroupChange('STATE CAPACITY')}
          className={`relative min-h-11 border-b border-r border-dossier-paper/10 px-2 py-1.5 text-left font-mono transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-brass ${
            openGroup === 'STATE CAPACITY' ? 'bg-dossier-paper text-dossier-ink' : 'text-dossier-paper/68 hover:bg-dossier-paper/5 hover:text-dossier-paper'
          }`}
        >
          <span className="block text-[9px] font-semibold tracking-[0.1em]">INSTITUTIONS</span>
          <span className={`mt-0.5 block text-[8px] tracking-[0.08em] ${openGroup === 'STATE CAPACITY' ? 'text-dossier-ink/55' : draftedIn('STATE CAPACITY') ? 'text-dossier-brass' : 'text-dossier-paper/38'}`}>
            {draftedIn('STATE CAPACITY') ? `${draftedIn('STATE CAPACITY')} DRAFTED` : 'LONG-TERM'}
          </span>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3" role="tabpanel">
        {activeDials ? (
          <section>
            <div className="mb-2 border-b border-dossier-paper/15 pb-2">
              <div className="font-mono text-[9px] font-semibold tracking-[0.2em] text-dossier-brass">{activeDials.question.toUpperCase()}</div>
              <p className="mt-1 font-dossier text-[12px] leading-snug text-dossier-paper/72">{activeDials.brief}</p>
            </div>
            <div className="flex flex-col gap-1">
              {activeDials.dials.map((dial) => <DialRow key={dial.path} def={dial} pub={pub} />)}
            </div>
          </section>
        ) : (
          <section>
            <div className="mb-2 border-b border-dossier-paper/15 pb-2">
              <div className="font-mono text-[9px] font-semibold tracking-[0.2em] text-dossier-brass">BUILD THE STATE THAT DELIVERS THE POLICY</div>
              <p className="mt-1 font-dossier text-[12px] leading-snug text-dossier-paper/72">Capacity programmes take eight quarters. They make taxes collectible, programmes deliverable, instruments legible, and growth sustainable.</p>
            </div>
            <div className="flex flex-col gap-2">
              {CAPACITY_IDS.map((id) => <CapacityRow key={id} id={id} pub={pub} />)}
            </div>
          </section>
        )}
      </div>
      <div className="mt-auto flex shrink-0 flex-col gap-2 border-t border-dossier-brass/45 bg-[#1d3027] px-4 py-2.5 shadow-[0_-8px_20px_rgba(0,0,0,0.2)]">
        {(rejection || previewError) && <div className="border-l-2 border-terminal-alert pl-2 font-mono text-[9px] leading-snug text-terminal-alert">{rejection ?? previewError}</div>}
        {staged.size === 0 ? (
          <div className="grid grid-cols-3 gap-2 font-mono text-[8px] tracking-[0.08em]">
            <span className="text-dossier-brass">1 · SHAPE ORDERS</span>
            <span className="text-dossier-paper/40">2 · REVIEW COST</span>
            <span className="text-dossier-paper/40">3 · ENACT</span>
          </div>
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
        <div className="flex items-center justify-between font-mono text-[8px] tracking-[0.08em] text-dossier-paper/45">
          <span className={fiscalTone}>CURRENT BALANCE {(pub.treasury.balance >= 0 ? '+' : '') + pub.treasury.balance.toFixed(1)}</span>
          <span>{pub.quartersToElection}Q TO ELECTION</span>
          <span>SPACE TO ADVANCE</span>
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
