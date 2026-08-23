/**
 * The cabinet workspace: one decision domain at a time, with the draft and
 * enact flow pinned below it. It is a right rail on full desktops and the
 * same focused drawer at smaller laptop and tablet widths.
 */

import { useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import {
  ASSET_PURCHASE_RATE_MAX,
  CAPACITY_IDS,
  CAPITAL_REQUIREMENT_MAX,
  CAPITAL_REQUIREMENT_MIN,
  IMMIGRATION_LIMIT_MAX,
  SECTOR_IDS,
  type CapacityId,
  type DialPath,
  type SpendingProgramId,
  type SectorId,
  type SpendingRuleMode,
} from '@terrarium/engine'
import {
  INDICATOR_IDS,
  INSTITUTION_IDS,
  STATUTE_IDS,
  type PublishedState,
  type PublishedStatute,
} from '@terrarium/observation'
import { useGame } from '../store/gameStore'
import { Button, Metric, ProgressBar, SegmentedControl, SliderField, Tooltip, TooltipLabel } from '../components/ui'
import { NAMES, BLOC_NAMES, BLOC_NOTES, COHORT_NAMES, COHORT_NOTES, INSTITUTION_NAMES } from '../components/labels'
import { CAPACITY_COPY, LEVER_COPY, LEVER_GROUPS } from '../levers'
import { complianceNote, STATUTE_COPY, STATUTE_DRAWER } from '../statutes'
import { dialIncidence, type Incidence } from '../incidence'
import { deriveInstrumentAccess, nextInstrumentUnlock } from '../maturity'
import { capitalReading } from '../gameRules'
import {
  currentRuleValue,
  equivalentRuleValue,
  latestOfficialNominalGdp,
  proposedSpending,
} from '../spendingRules'
import {
  CABINET_NAVIGATION_KEYS,
  CABINET_PANEL_ID,
  cabinetGroupForKey,
  cabinetTabId,
  type CabinetGroup,
  type CabinetNavigationKey,
} from '../cabinetNavigation'

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

interface DialGroup {
  group: Exclude<CabinetGroup, 'STATE CAPACITY'>
  tab: string
  brief: string
  question: string
  dials: DialDef[]
}

/** The slider's arithmetic — range, step, and how a reading is printed. This
 * is the half of a dial that belongs to the control rather than to the policy,
 * so it stays here; what the lever IS lives in `../levers` beside the words
 * the handbook prints about it. Total over `DialPath`, so a new dial cannot
 * reach the rail without a range. */
type DialMechanics = Omit<DialDef, 'path' | 'label'>

const DIAL_MECHANICS: Record<DialPath, DialMechanics> = {
  'taxRates.income': { get: (p) => p.dials.taxRates.income, min: 0, max: () => 0.8, step: 0.01, fmt: pct },
  'taxRates.corporate': { get: (p) => p.dials.taxRates.corporate, min: 0, max: () => 0.8, step: 0.01, fmt: pct },
  'taxRates.tariff': { get: (p) => p.dials.taxRates.tariff, min: 0, max: () => 1, step: 0.01, fmt: pct },
  'taxRates.fuel': { get: (p) => p.dials.taxRates.fuel, min: 0, max: () => 2, step: 0.05, fmt: pct },
  'spending.transfers': { get: (p) => p.dials.spending.transfers, min: 0, max: spendMax, step: 0.1, fmt: money },
  'spending.procurement': { get: (p) => p.dials.spending.procurement, min: 0, max: spendMax, step: 0.1, fmt: money },
  'spending.investment': { get: (p) => p.dials.spending.investment, min: 0, max: spendMax, step: 0.1, fmt: money },
  'spending.research': { get: (p) => p.dials.spending.research, min: 0, max: spendMax, step: 0.1, fmt: money },
  immigrationLimit: {
    get: (p) => p.dials.immigrationLimit,
    min: 0,
    max: () => IMMIGRATION_LIMIT_MAX,
    step: 0.001,
    fmt: pct1,
  },
  policyRate: { get: (p) => p.dials.policyRate, min: 0, max: () => 0.3, step: 0.0025, fmt: pct1 },
  assetPurchaseRate: {
    get: (p) => p.dials.assetPurchaseRate,
    min: 0,
    max: () => ASSET_PURCHASE_RATE_MAX,
    step: 0.005,
    fmt: pct1,
  },
  capitalRequirement: {
    get: (p) => p.dials.capitalRequirement,
    min: CAPITAL_REQUIREMENT_MIN,
    max: () => CAPITAL_REQUIREMENT_MAX,
    step: 0.005,
    fmt: pct1,
  },
  ...(Object.fromEntries(
    SECTOR_IDS.map((sid) => [
      `subsidies.${sid}`,
      {
        get: (p: PublishedState) => p.dials.subsidies[sid] ?? 0,
        min: 0,
        max: (p: PublishedState) => Math.max(p.treasury.revenue, 5),
        step: 0.1,
        fmt: money,
      },
    ]),
  ) as Record<`subsidies.${SectorId}`, DialMechanics>),
}

const DIALS: DialGroup[] = LEVER_GROUPS.map((group) => ({
  group: group.group,
  tab: group.tab,
  brief: group.brief,
  question: group.question,
  dials: group.paths.map((path) => ({ ...DIAL_MECHANICS[path], path, label: LEVER_COPY[path].label })),
}))

/**
 * Who a drafted programme change reaches, read off the ministry's own rules.
 * Unfogged on purpose (see `../incidence`): the schedule of claims is a thing
 * the government wrote, so it owes no survey to know it. The money only — a
 * preview of how households would FEEL about it would be a preview of the
 * player's own scoring function.
 */
function IncidenceNote({ incidence }: { incidence: Incidence }) {
  const { booked, delivered, deliveryRate, rows } = incidence
  const cutting = booked < 0
  const signed = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`
  return (
    <div className="mt-1.5 border-t border-dossier-paper/10 pt-1.5">
      <div className="flex items-baseline justify-between font-mono text-[8px] tracking-[0.12em] text-dossier-paper/45">
        <span>{cutting ? 'WHO LOSES IT' : 'WHO IT REACHES'}</span>
        <TooltipLabel
          label="Delivered spending"
          content="The share that reaches households after losses in the civil service. The treasury pays the full amount either way."
          className="text-dossier-paper/45"
        >
          {(deliveryRate * 100).toFixed(0)}% DELIVERED
        </TooltipLabel>
      </div>
      <ul className="mt-1 flex flex-col gap-0.5">
        {rows.map((row) => (
          <li key={row.cohort} className="flex items-baseline justify-between gap-2 font-mono text-[9px] text-dossier-paper/70">
            <TooltipLabel
              label={COHORT_NAMES[row.cohort]}
              content={COHORT_NOTES[row.cohort]}
              className="truncate text-dossier-paper/70"
            />
            <span className="shrink-0 tabular-nums text-dossier-paper/85">{signed(row.delivered)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-1 font-mono text-[8px] leading-snug text-dossier-paper/40">
        BOOKS {signed(booked)} · HOUSEHOLDS {signed(delivered)}
      </div>
    </div>
  )
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
  const percentagePoints =
    def.path.startsWith('taxRates.') ||
    def.path === 'policyRate' ||
    def.path === 'assetPurchaseRate' ||
    def.path === 'capitalRequirement' ||
    def.path === 'immigrationLimit'
  const deltaDigits = def.step < 0.01 ? 1 : 0
  const deltaLabel = percentagePoints
    ? `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(deltaDigits)} PT`
    : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`
  const incidence = dialIncidence(def.path, delta, pub)

  return (
    <SliderField
      label={def.label}
      displayValue={def.fmt(value)}
      currentDisplayValue={def.fmt(current)}
      changeDisplayValue={deltaLabel}
      politicalCost={stagedCosts[key]}
      detail={incidence && <IncidenceNote incidence={incidence} />}
      dirty={dirty}
      hint={LEVER_COPY[def.path].hint}
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

const SPENDING_MODES: ReadonlyArray<{
  value: SpendingRuleMode
  label: string
  title: string
}> = [
  { value: 'fixed', label: 'FIXED', title: 'Hold the nominal cash amount until the cabinet changes it.' },
  { value: 'indexed', label: 'CPI', title: 'Move with each new first-release official inflation print.' },
  { value: 'gdpShare', label: '% GDP', title: 'Claim a share of the latest officially published nominal GDP.' },
]

function ruleValueLabel(mode: SpendingRuleMode, value: number): string {
  return mode === 'gdpShare' ? `${(value * 100).toFixed(1)}%` : money(value)
}

function SpendingRuleRow({ def, pub }: { def: DialDef; pub: PublishedState }) {
  const { staged, stagedCosts, stage } = useGame()
  const programme = def.path.slice('spending.'.length) as SpendingProgramId
  const key = `dial:${def.path}`
  const stagedAction = staged.get(key)
  const draft = stagedAction?.kind === 'setSpendingRule' ? stagedAction : null
  const currentRule = pub.spendingRules[programme]
  const currentAmount = pub.dials.spending[programme]
  const mode = draft?.mode ?? currentRule.kind
  const value = draft?.value ?? currentRuleValue(pub, programme)
  const basis = latestOfficialNominalGdp(pub)
  const proposedAmount = proposedSpending(pub, mode, value) ?? currentAmount
  const dirty = draft !== null

  const stageRule = (nextMode: SpendingRuleMode, rawValue: number) => {
    const nextValue = Math.max(0, Number(rawValue.toFixed(8)))
    const isCurrent =
      nextMode === currentRule.kind &&
      Math.abs(nextValue - currentRuleValue(pub, programme)) < 1e-9
    stage(
      key,
      isCurrent
        ? null
        : { kind: 'setSpendingRule', programme, mode: nextMode, value: nextValue },
    )
  }

  const onMode = (nextMode: SpendingRuleMode) => {
    if (nextMode === mode) return
    const equivalent = equivalentRuleValue(pub, programme, nextMode)
    if (equivalent !== null) stageRule(nextMode, equivalent)
  }

  const isShare = mode === 'gdpShare'
  const min = 0
  const max = isShare ? 0.5 : def.max(pub)
  const step = isShare ? 0.005 : def.step
  const setValue = (raw: number) => {
    const stepped = min + Math.round((raw - min) / step) * step
    stageRule(mode, Math.min(max, Math.max(min, stepped)))
  }
  const delta = proposedAmount - currentAmount
  // A mode conversion preserves the current amount, but rounding a GDP share
  // can leave sub-cent noise. Do not describe an invisible bookkeeping fleck
  // as a household consequence.
  const incidence = Math.abs(delta) >= 0.005 ? dialIncidence(def.path, delta, pub) : null
  const currentValue = currentRuleValue(pub, programme)
  const ruleStatus =
    currentRule.kind === 'fixed'
      ? `FIXED CASH · ${currentAmount.toFixed(1)} / QTR`
      : currentRule.kind === 'indexed'
        ? `CPI INDEXED · ${currentAmount.toFixed(1)} / QTR · ${currentRule.lastIndexedForQtr === null ? 'AWAITING FIRST PRINT' : `LAST PRINT Q${currentRule.lastIndexedForQtr}`}`
        : `${(currentRule.share * 100).toFixed(1)}% OF OFFICIAL GDP · ${currentAmount.toFixed(1)} / QTR${basis ? ` · GDP Q${basis.forQtr}` : ' · AWAITING ACCOUNTS'}`

  return (
    <div className={`border ${dirty ? 'border-dossier-brass bg-dossier-paper/[0.05]' : 'border-dossier-paper/10 bg-[#22382d]/20'}`}>
      <div className="flex items-center justify-between gap-2 px-2 pt-2">
        <span className="font-mono text-[8px] tracking-[0.14em] text-dossier-paper/45">APPROPRIATION</span>
        <SegmentedControl
          label={`${def.label} spending rule`}
          value={mode}
          tone="inverted"
          options={SPENDING_MODES.map((option) => ({
            ...option,
            disabled: option.value === 'gdpShare' && basis === null,
            title:
              option.value === 'gdpShare' && basis === null
                ? 'Fund national accounts before writing a GDP-share rule.'
                : option.title,
          }))}
          onChange={onMode}
        />
      </div>
      <SliderField
        label={def.label}
        displayValue={ruleValueLabel(mode, value)}
        currentDisplayValue={ruleValueLabel(currentRule.kind, currentValue)}
        changeDisplayValue={`${delta >= 0 ? '+' : ''}${delta.toFixed(1)} / QTR`}
        politicalCost={stagedCosts[key]}
        detail={incidence && <IncidenceNote incidence={incidence} />}
        dirty={dirty}
        hint={`${LEVER_COPY[def.path].hint} ${SPENDING_MODES.find((option) => option.value === mode)?.title}`}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={!pub.inPower}
        onStep={(direction) => setValue(value + direction * step)}
        onReset={() => stage(key, null)}
        onChange={(event) => setValue(Number(event.target.value))}
        className="border-l-0 bg-transparent"
      />
      <div className="px-2 pb-2 font-mono text-[8px] leading-snug tracking-[0.06em] text-dossier-paper/42">
        CURRENT RULE · {ruleStatus}
      </div>
    </div>
  )
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
  // With every survey already fitted there is no rung left to advertise, and a
  // "NEXT @ 55" for an instrument that has been printing since 1946 is a lie.
  // Capacity is still worth buying — it is what shortens the lag and narrows
  // the band — so the rail says that instead of falling silent.
  const statisticalNote =
    id !== 'statistical'
      ? null
      : pub.rules.fullInstrumentation
        ? 'ALL INSTRUMENTS FITTED · CAPACITY NOW BUYS ACCURACY'
        : [
            awaitingCount > 0 ? `${awaitingCount} COMMISSIONED · RETURNS PENDING` : null,
            nextUnlock
              ? `NEXT @ ${Math.round(nextUnlock.fundedAt * 100)} · ${nextUnlock.indicators.map((indicator) => NAMES[indicator].short).join(' + ')}`
              : null,
          ]
            .filter((part) => part !== null)
            .join(' · ') || null
  return (
    <div className={`border px-2.5 py-2 ${stagedAction ? 'border-dossier-brass bg-dossier-paper/[0.08]' : 'border-dossier-paper/15 bg-[#22382d]/35'}`}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <TooltipLabel label={CAPACITY_COPY[id].label} content={CAPACITY_COPY[id].hint} className="truncate font-mono text-[11px] font-medium tracking-wide text-dossier-paper">
          {CAPACITY_COPY[id].label}
        </TooltipLabel>
        <span className="font-mono text-[10px] font-semibold tabular-nums text-dossier-brass">{(pub.capacity[id] * 100).toFixed(0)} / 100</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_70px] items-center gap-2">
        <ProgressBar value={pub.capacity[id]} label={`${CAPACITY_COPY[id].label} capacity`} />
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
      <p className="mt-1.5 font-dossier text-[11px] leading-snug text-dossier-paper/70">{CAPACITY_COPY[id].effect}</p>
      {statisticalNote && (
        <div className="mt-1.5 border-l border-dossier-brass/60 pl-2 font-mono text-[8px] leading-relaxed tracking-[0.08em] text-dossier-brass">
          {statisticalNote}
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

/**
 * One statute on the books (ADR-0027).
 *
 * The row exists to show the two numbers that make a statute different from a
 * dial, side by side: the rung the cabinet has WRITTEN, and how much of it the
 * country is actually obeying. A government with no inspectorate can post the
 * strictest law in the book and change almost nothing, and the only way to
 * learn that without losing a decade to it is to be shown both figures at
 * once.
 *
 * Prices on the rungs come straight from `politicalCostOfAction` via
 * `PublishedStatute.cost` — the entrenchment premium on a repeal and the
 * room's veto premium are already in them, so what is quoted is what is
 * charged.
 */
function StatuteRow({ statute, pub }: { statute: PublishedStatute; pub: PublishedState }) {
  const { staged, stage } = useGame()
  const key = `statute:${statute.id}`
  const stagedAction = staged.get(key)
  const copy = STATUTE_COPY[statute.id]
  const inForceShare = statute.levels[statute.level].strength
  const stagedLevel = stagedAction?.kind === 'enact' ? stagedAction.level : statute.level
  const resisting = statute.resistance
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .map((entry) => BLOC_NAMES[entry.bloc])
  // still arriving: the posted rung is in the book but the phase-in has not
  // finished carrying it into the economy
  const arriving = statute.level > 0 && statute.inForce < inForceShare * statute.compliance * 0.98

  return (
    <div
      className={`border px-2.5 py-2 ${stagedAction ? 'border-dossier-brass bg-dossier-paper/[0.08]' : 'border-dossier-paper/15 bg-[#22382d]/35'}`}
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <TooltipLabel
          label={copy.label}
          content={`${copy.hint} ${copy.effect}`}
          className="truncate font-mono text-[11px] font-medium tracking-wide text-dossier-paper"
        >
          {copy.label}
        </TooltipLabel>
        <span className="shrink-0 font-mono text-[9px] tracking-[0.08em] text-dossier-paper/50">
          {statute.enactedAt === null
            ? 'NOT IN FORCE'
            : `SINCE ${1946 + Math.floor(statute.enactedAt / 4)}`}
        </span>
      </div>

      {/* The ladder, one rung per row. A segmented control cannot wrap, and
          these rungs are sentences rather than words — three of them side by
          side would shear off the right edge of the rail. */}
      <div className="flex flex-col gap-px" role="group" aria-label={`${copy.label} level`}>
        {statute.levels.map((rung, index) => {
          const inForce = index === statute.level
          const selected = index === stagedLevel
          const price = statute.cost[index]
          return (
            <button
              key={rung.name}
              type="button"
              aria-pressed={selected}
              disabled={!pub.inPower || (price === null && !inForce)}
              title={
                inForce
                  ? `${rung.name} — in force now.`
                  : `${rung.name} — ${price?.toFixed(0) ?? '—'} PC.${index < statute.level ? ' Repeal costs more the longer a law has stood.' : ''}`
              }
              onClick={() =>
                stage(key, inForce ? null : { kind: 'enact', statute: statute.id, level: index })
              }
              className={`flex min-h-6 items-baseline justify-between gap-2 border px-1.5 py-0.5 text-left font-mono text-[10px] tracking-[0.04em] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-dossier-brass disabled:cursor-not-allowed disabled:opacity-30 ${
                selected && !inForce
                  ? 'border-dossier-brass bg-dossier-brass/25 text-dossier-paper'
                  : inForce
                    ? 'border-dossier-paper/45 bg-dossier-paper/10 text-dossier-paper'
                    : 'border-transparent text-dossier-paper/55 hover:border-dossier-paper/30 hover:text-dossier-paper'
              }`}
            >
              <span className="truncate">{rung.name}</span>
              <span className="shrink-0 tabular-nums text-dossier-brass">
                {inForce ? '\u2713' : price === null ? '' : `${price.toFixed(0)} PC`}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <ProgressBar
          value={statute.compliance}
          label={`${copy.label} compliance`}
          tone={statute.compliance < 0.35 ? 'danger' : 'brass'}
        />
        <Tooltip
          content={
            statute.level === 0
              ? 'What your civil service and courts could enforce if you wrote this law today.'
              : `The country obeys ${(statute.compliance * 100).toFixed(0)}% of what you posted.${
                  resisting.length > 0 ? ` Evaded by: ${resisting.join(', ')}.` : ''
                }`
          }
        >
          <span className="shrink-0 font-mono text-[9px] tracking-[0.08em] text-dossier-paper/60">
            {arriving ? 'STILL ARRIVING' : complianceNote(statute.compliance)}
          </span>
        </Tooltip>
      </div>
    </div>
  )
}

/**
 * Institutional reforms are generational, ratcheting, and contested. The price on each button
 * is what the engine will actually charge — veto premium and reform-window
 * discount already in it — so the room's objection is legible before you pay.
 */
function ReformRow({ id, pub }: { id: (typeof INSTITUTION_IDS)[number]; pub: PublishedState }) {
  const { staged, stage } = useGame()
  const key = `reform:${id}`
  const stagedAction = staged.get(key)
  const level = pub.institutions[id]
  const cost = pub.reformCost[id]
  const { name, note } = INSTITUTION_NAMES[id]
  const isStaged = (dir: 1 | -1) => stagedAction?.kind === 'reform' && stagedAction.direction === dir

  const button = (dir: 1 | -1) => {
    const price = dir > 0 ? cost.up : cost.down
    return (
      <Button
        disabled={!pub.inPower || price === null}
        title={
          price === null
            ? `${name} is already as ${dir > 0 ? 'broad' : 'narrow'} as it goes.`
            : `${dir > 0 ? 'Broaden' : 'Roll back'} ${name} — ${price.toFixed(0)} PC.${pub.reformWindowOpen ? ' The country is in ferment: the window is open and the price is cut.' : ''}`
        }
        onClick={() => stage(key, isStaged(dir) ? null : { kind: 'reform', institution: id, direction: dir })}
        variant={isStaged(dir) ? 'primary' : 'secondary'}
        size="compact"
        className="min-h-6 px-1 py-0 tracking-[0.08em]"
      >
        {dir > 0 ? '+' : '−'}
        {price === null ? '' : price.toFixed(0)}
      </Button>
    )
  }

  return (
    <div className={`border px-2.5 py-2 ${stagedAction ? 'border-dossier-brass bg-dossier-paper/[0.08]' : 'border-dossier-paper/15 bg-[#22382d]/35'}`}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <TooltipLabel label={name} content={note} className="truncate font-mono text-[11px] font-medium tracking-wide text-dossier-paper">
          {name}
        </TooltipLabel>
        <span className={`font-mono text-[10px] font-semibold tabular-nums ${id === 'repression' ? 'text-terminal-alert' : 'text-dossier-brass'}`}>{(level * 100).toFixed(0)} / 100</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_44px_44px] items-center gap-2">
        <ProgressBar value={level} label={`${name} level`} tone={id === 'repression' ? 'danger' : 'brass'} />
        {button(-1)}
        {button(1)}
      </div>
      <p className="mt-1.5 font-dossier text-[11px] leading-snug text-dossier-paper/70">{note}</p>
    </div>
  )
}

/**
 * The whip count. Bloc power is read off the economy each quarter, so
 * this is a live picture of who is actually in the room — and the bar shows
 * EFFECTIVE power, i.e. after an organised society's check, because that is
 * the number that actually prices your levers. Alerts here use terminal-alert,
 * not dossier-warn: oxblood on deep green is a 1.08:1 contrast ratio.
 */
function BlocRow({ bloc, pledged }: { bloc: PublishedState['blocs'][number]; pledged: boolean }) {
  const hostile = bloc.favor < -0.15
  const friendly = bloc.favor > 0.15
  return (
    <div className="border border-dossier-paper/15 bg-[#22382d]/35 px-2.5 py-2">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="truncate font-mono text-[11px] font-medium tracking-wide text-dossier-paper">
          {BLOC_NAMES[bloc.id]}
          {pledged && (
            <TooltipLabel label={`${BLOC_NAMES[bloc.id]} pledge`} content="You promised them support. Policies they dislike cost twice as much until the promise expires." className="ml-1 text-dossier-brass">
              ✦
            </TooltipLabel>
          )}
        </span>
        <span className={`font-mono text-[10px] font-semibold tabular-nums ${hostile ? 'text-terminal-alert' : friendly ? 'text-dossier-paper' : 'text-dossier-paper/70'}`}>
          {bloc.favor >= 0 ? '+' : ''}
          {bloc.favor.toFixed(2)}
        </span>
      </div>
      <ProgressBar
        value={bloc.effectivePower}
        label={`${BLOC_NAMES[bloc.id]} effective power`}
        tone={hostile ? 'danger' : 'brass'}
      />
      <p className="mt-1.5 font-dossier text-[11px] leading-snug text-dossier-paper/70">{BLOC_NOTES[bloc.id]}</p>
      <div className="mt-1 font-mono text-[8px] tracking-[0.08em] text-dossier-paper/40">
        POWER {(bloc.power * 100).toFixed(0)} · {(bloc.effectivePower * 100).toFixed(0)} AFTER SOCIETY&rsquo;S CHECK
      </div>
    </div>
  )
}

export function ControlRail({
  pub,
  openGroup,
  onOpenGroupChange,
  focusRequest,
  onOpenRecord,
  onClose,
}: {
  pub: PublishedState
  openGroup: CabinetGroup
  onOpenGroupChange: (group: CabinetGroup) => void
  focusRequest: number
  /** open the minute book — what this desk has already decided. It lives here
   * rather than with the ministry offices in the letterhead because it is the
   * same subject as the dials below it, and because the letterhead's metrics
   * strip is already wider than 1280 can show. */
  onOpenRecord: () => void
  onClose?: () => void
}) {
  const { advance, advancing, staged, clearStaged, stagedCost, stagedAffordable, previewError, rejection } = useGame()
  const finiteCost = stagedCost !== null && Number.isFinite(stagedCost) ? stagedCost : null
  const capital = capitalReading(pub, finiteCost)
  const activeDials = DIALS.find((group) => group.group === openGroup)
  const draftedIn = (group: CabinetGroup) =>
    group === 'STATE CAPACITY'
      ? CAPACITY_IDS.filter((id) => staged.has(`cap:${id}`)).length
      : group === 'STATUTES'
        ? STATUTE_IDS.filter((id) => staged.has(`statute:${id}`)).length
        : DIALS.find((candidate) => candidate.group === group)?.dials.filter((dial) => staged.has(`dial:${dial.path}`)).length ?? 0
  const fiscalTone = pub.treasury.balance < 0 ? 'text-terminal-alert' : 'text-dossier-paper'

  useEffect(() => {
    if (focusRequest > 0) document.getElementById(cabinetTabId(openGroup))?.focus()
  }, [focusRequest, openGroup])

  const onTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, group: CabinetGroup) => {
    if (!CABINET_NAVIGATION_KEYS.includes(event.key as CabinetNavigationKey)) return
    event.preventDefault()
    onOpenGroupChange(cabinetGroupForKey(group, event.key as CabinetNavigationKey))
  }

  return (
    <aside data-tour="cabinet" id="cabinet-controls" className="flex h-full min-h-0 flex-col border-l border-dossier-brass/70 bg-[#294235]" aria-label="Cabinet controls">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-dossier-paper/15 px-4 py-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-dossier text-lg font-semibold leading-none text-dossier-paper">Cabinet desk</span>
            <Tooltip content="Every policy this cabinet has set, quarter by quarter.">
              <button
                type="button"
                onClick={onOpenRecord}
                className="shrink-0 border border-dossier-paper/30 px-1.5 py-px font-mono text-[8px] font-medium tracking-[0.14em] text-dossier-paper/75 hover:border-dossier-brass hover:text-dossier-brass focus-visible:outline-2 focus-visible:outline-dossier-brass"
              >
                MINUTES
              </button>
            </Tooltip>
          </div>
          <div className="mt-1 font-mono text-[9px] tracking-[0.16em] text-dossier-brass">ORDERS FOR THE NEXT QUARTER</div>
        </div>
        <div className="flex items-center gap-2">
          <Metric
            inverted
            label="POLITICAL CAPITAL"
            value={capital.available}
            detail={capital.detail}
            tone="accent"
            className="items-end text-right"
            title={
              pub.rules.unlimitedCapital
                ? 'Points you can spend on the drafted changes below. Under this rule they are still priced, but never charged.'
                : 'Points you can spend on the drafted changes below.'
            }
          />
          {onClose && (
            <Button onClick={onClose} variant="secondary" size="compact" className="xl:hidden" aria-label="Close cabinet drawer" title="Close cabinet (Esc)">
              CLOSE <span aria-hidden="true">×</span>
            </Button>
          )}
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-3 border-b border-dossier-paper/15" role="tablist" aria-label="Cabinet decision areas" aria-orientation="horizontal">
        {DIALS.map((group) => {
          const selected = openGroup === group.group
          const count = draftedIn(group.group)
          return (
            <Tooltip key={group.group} content={group.brief}>
              <button
                type="button"
                role="tab"
                id={cabinetTabId(group.group)}
                aria-controls={CABINET_PANEL_ID}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => onOpenGroupChange(group.group)}
                onKeyDown={(event) => onTabKeyDown(event, group.group)}
                className={`relative min-h-11 border-b border-r border-dossier-paper/10 px-2 py-1.5 text-left font-mono transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-brass ${
                  selected ? 'bg-dossier-paper text-dossier-ink' : 'text-dossier-paper/68 hover:bg-dossier-paper/5 hover:text-dossier-paper'
                }`}
              >
                <span className="block text-[9px] font-semibold tracking-[0.1em]">{group.tab}</span>
                <span className={`mt-0.5 block text-[8px] tracking-[0.08em] ${selected ? 'text-dossier-ink/55' : count ? 'text-dossier-brass' : 'text-dossier-paper/38'}`}>
                  {count ? `${count} DRAFTED` : `${group.dials.length} CONTROL${group.dials.length === 1 ? '' : 'S'}`}
                </span>
              </button>
            </Tooltip>
          )
        })}
        <Tooltip content="Write laws: a minimum wage, a school-leaving age, competition law. Slower than a dial and harder to undo.">
          <button
            type="button"
            role="tab"
            id={cabinetTabId('STATUTES')}
            aria-controls={CABINET_PANEL_ID}
            aria-selected={openGroup === 'STATUTES'}
            tabIndex={openGroup === 'STATUTES' ? 0 : -1}
            onClick={() => onOpenGroupChange('STATUTES')}
            onKeyDown={(event) => onTabKeyDown(event, 'STATUTES')}
            className={`relative min-h-11 border-b border-r border-dossier-paper/10 px-2 py-1.5 text-left font-mono transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-brass ${
              openGroup === 'STATUTES' ? 'bg-dossier-paper text-dossier-ink' : 'text-dossier-paper/68 hover:bg-dossier-paper/5 hover:text-dossier-paper'
            }`}
          >
            <span className="block text-[9px] font-semibold tracking-[0.1em]">STATUTES</span>
            <span className={`mt-0.5 block text-[8px] tracking-[0.08em] ${openGroup === 'STATUTES' ? 'text-dossier-ink/55' : draftedIn('STATUTES') ? 'text-dossier-brass' : 'text-dossier-paper/38'}`}>
              {draftedIn('STATUTES')
                ? `${draftedIn('STATUTES')} DRAFTED`
                : `${pub.statutes.filter((statute) => statute.level > 0).length} IN FORCE`}
            </span>
          </button>
        </Tooltip>
        <Tooltip content="Build the tax office, statistics, civil service and schools that make policy work.">
          <button
            type="button"
            role="tab"
            id={cabinetTabId('STATE CAPACITY')}
            aria-controls={CABINET_PANEL_ID}
            aria-selected={openGroup === 'STATE CAPACITY'}
            tabIndex={openGroup === 'STATE CAPACITY' ? 0 : -1}
            onClick={() => onOpenGroupChange('STATE CAPACITY')}
            onKeyDown={(event) => onTabKeyDown(event, 'STATE CAPACITY')}
            className={`relative min-h-11 border-b border-r border-dossier-paper/10 px-2 py-1.5 text-left font-mono transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-brass ${
              openGroup === 'STATE CAPACITY' ? 'bg-dossier-paper text-dossier-ink' : 'text-dossier-paper/68 hover:bg-dossier-paper/5 hover:text-dossier-paper'
            }`}
          >
            <span className="block text-[9px] font-semibold tracking-[0.1em]">CAPACITY</span>
            <span className={`mt-0.5 block text-[8px] tracking-[0.08em] ${openGroup === 'STATE CAPACITY' ? 'text-dossier-ink/55' : draftedIn('STATE CAPACITY') ? 'text-dossier-brass' : 'text-dossier-paper/38'}`}>
              {draftedIn('STATE CAPACITY') ? `${draftedIn('STATE CAPACITY')} DRAFTED` : 'LAYER 2'}
            </span>
          </button>
        </Tooltip>
        {/* Institutional reforms and the veto players who price them */}
        {(['INSTITUTIONS', 'THE ROOM'] as const).map((group) => {
          const selected = openGroup === group
          const drafted = group === 'INSTITUTIONS' ? draftedIn('INSTITUTIONS') : 0
          return (
            <Tooltip
              key={group}
              content={group === 'INSTITUTIONS'
                ? 'Change voting rights, press freedom, labour rights, courts or repression.'
                : 'See which economic groups have power and whether they support you.'}
            >
              <button
                type="button"
                role="tab"
                id={cabinetTabId(group)}
                aria-controls={CABINET_PANEL_ID}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => onOpenGroupChange(group)}
                onKeyDown={(event) => onTabKeyDown(event, group)}
                className={`relative min-h-11 border-b border-r border-dossier-paper/10 px-2 py-1.5 text-left font-mono transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-brass ${
                  selected ? 'bg-dossier-paper text-dossier-ink' : 'text-dossier-paper/68 hover:bg-dossier-paper/5 hover:text-dossier-paper'
                }`}
              >
                <span className="block text-[9px] font-semibold tracking-[0.1em]">{group}</span>
                <span className={`mt-0.5 block text-[8px] tracking-[0.08em] ${selected ? 'text-dossier-ink/55' : drafted ? 'text-dossier-brass' : pub.reformWindowOpen && group === 'INSTITUTIONS' ? 'text-terminal-alert' : 'text-dossier-paper/38'}`}>
                  {drafted
                    ? `${drafted} DRAFTED`
                    : group === 'INSTITUTIONS'
                      ? pub.reformWindowOpen
                        ? 'WINDOW OPEN'
                        : 'LAYER 3'
                      : `${pub.blocs.filter((b) => b.favor < -0.15).length} HOSTILE`}
                </span>
              </button>
            </Tooltip>
          )
        })}
      </div>
      <div
        id={CABINET_PANEL_ID}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
        role="tabpanel"
        aria-labelledby={cabinetTabId(openGroup)}
      >
        {openGroup === 'STATUTES' ? (
          <section>
            <div className="mb-2 border-b border-dossier-paper/15 pb-2">
              <div className="font-mono text-[9px] font-semibold tracking-[0.2em] text-dossier-brass">
                {STATUTE_DRAWER.question.toUpperCase()}
              </div>
              <p className="mt-1 font-dossier text-[12px] leading-snug text-dossier-paper/72">
                {STATUTE_DRAWER.brief}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {pub.statutes.map((statute) => (
                <StatuteRow key={statute.id} statute={statute} pub={pub} />
              ))}
            </div>
          </section>
        ) : openGroup === 'INSTITUTIONS' ? (
          <section>
            <div className="mb-2 border-b border-dossier-paper/15 pb-2">
              <div className="font-mono text-[9px] font-semibold tracking-[0.2em] text-dossier-brass">REWRITE THE RULES YOU GOVERN UNDER</div>
              <p className="mt-1 font-dossier text-[12px] leading-snug text-dossier-paper/72">
                Layer 3 is generational and contested — the people who would lose by a reform are, by
                construction, the people currently holding the veto. Prices below already carry their
                objection.{' '}
                {pub.reformWindowOpen
                  ? 'The country is in ferment: the window is open and everything is cheap. It will close as the country calms.'
                  : 'A crisis prises the window open and cuts these prices sharply.'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {INSTITUTION_IDS.map((id) => <ReformRow key={id} id={id} pub={pub} />)}
            </div>
          </section>
        ) : openGroup === 'THE ROOM' ? (
          <section>
            <div className="mb-2 border-b border-dossier-paper/15 pb-2">
              <div className="font-mono text-[9px] font-semibold tracking-[0.2em] text-dossier-brass">WHO YOU HAVE TO CARRY</div>
              <p className="mt-1 font-dossier text-[12px] leading-snug text-dossier-paper/72">
                Nobody appoints these blocs — each one is exactly as strong as the slice of the economy
                it owns, so a crisis that guts a bloc&rsquo;s base is a political opening. Defy them and
                the bill arrives through the economy: a capital strike, an investment strike, a wage
                push, a harvest that stops being reported.
                {pub.pledge && ` You courted ${BLOC_NAMES[pub.pledge.bloc]}: everything they dislike costs double for ${pub.pledge.quartersLeft} more quarters.`}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {pub.blocs.map((b) => <BlocRow key={b.id} bloc={b} pledged={pub.pledge?.bloc === b.id} />)}
            </div>
          </section>
        ) : activeDials ? (
          <section>
            <div className="mb-2 border-b border-dossier-paper/15 pb-2">
              <div className="font-mono text-[9px] font-semibold tracking-[0.2em] text-dossier-brass">{activeDials.question.toUpperCase()}</div>
              <p className="mt-1 font-dossier text-[12px] leading-snug text-dossier-paper/72">{activeDials.brief}</p>
            </div>
            <div className="flex flex-col gap-1">
              {activeDials.dials.map((dial) =>
                activeDials.group === 'SPENDING' ? (
                  <SpendingRuleRow key={dial.path} def={dial} pub={pub} />
                ) : (
                  <DialRow key={dial.path} def={dial} pub={pub} />
                ),
              )}
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
      <div data-tour="enact" className="mt-auto flex shrink-0 flex-col gap-2 border-t border-dossier-brass/45 bg-[#1d3027] px-4 py-2.5 shadow-[0_-8px_20px_rgba(0,0,0,0.2)]">
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
            <ProgressBar value={capital.remaining} label="Political capital remaining after drafted orders" tone={stagedAffordable ? 'brass' : 'danger'} />
            <div className="mt-1 flex justify-between font-mono text-[8px] tabular-nums text-dossier-paper/45">
              <span>NOW {capital.available}</span>
              <span>AFTER {capital.after ?? '…'} PC</span>
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
