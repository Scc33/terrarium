/**
 * The right rail: every lever, always available, always visible — plus the
 * advance control. Compact ministry hardware on felt; the game never says
 * no, it lets you find out.
 */

import { CAPACITY_IDS, SECTOR_IDS, type CapacityId, type DialPath } from '@terrarium/engine'
import { INSTITUTION_IDS, type PublishedState } from '@terrarium/observation'
import { useGame } from '../store/gameStore'
import { BLOC_NAMES, BLOC_NOTES, INSTITUTION_NAMES } from '../components/labels'

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
    <div className="grid grid-cols-[86px_1fr_52px] items-center gap-2">
      <span
        className="truncate font-mono text-[10px] tracking-wide text-dossier-paper/75 capitalize"
        title={DIAL_TIPS[def.path] ?? `A quarterly subsidy paid to the ${def.label} sector. Most of it leaks through weak administration; all of it hits the budget.`}
      >
        {def.label}
      </span>
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
    <div className="grid grid-cols-[86px_1fr_52px] items-center gap-2">
      <span className="truncate font-mono text-[10px] tracking-wide text-dossier-paper/75" title={CAP_TIPS[id]}>
        {CAP_LABELS[id]}
      </span>
      <div className="h-1.5 bg-dossier-paper/15" title={`${CAP_TIPS[id]} Currently at ${(pub.capacity[id] * 100).toFixed(0)} of 100.`}>
        <div className="h-full bg-dossier-brass" style={{ width: `${(pub.capacity[id] * 100).toFixed(0)}%` }} />
      </div>
      <button
        disabled={!pub.inPower || maxed}
        title={
          maxed
            ? 'This ministry is already at full strength.'
            : `Fund a programme: ${amount.toFixed(1)} spread over 2 years, delivering capacity with a lag.${building ? ' One is already building.' : ''}`
        }
        onClick={() => stage(key, stagedAction ? null : { kind: 'investCapacity', target: id, amount })}
        className={`border px-1 py-0.5 font-mono text-[10px] tabular-nums ${
          stagedAction
            ? 'border-dossier-brass bg-dossier-brass text-dossier-ink'
            : 'border-dossier-paper/30 text-dossier-paper/80 hover:border-dossier-brass hover:text-dossier-brass'
        } disabled:opacity-40`}
      >
        {maxed ? 'FULL' : stagedAction ? 'STAGED' : building ? 'BLDG+' : 'FUND'}
      </button>
    </div>
  )
}

/**
 * The whip count (§4.3). Bloc power is read off the economy each quarter, so
 * this is a live picture of who is actually in the room — and the bar shows
 * EFFECTIVE power, i.e. after an organised society's check, because that is
 * the number that actually prices your levers.
 */
function BlocRow({ bloc, pledged }: { bloc: PublishedState['blocs'][number]; pledged: boolean }) {
  // −1 implacable … +1 in your pocket
  const hostile = bloc.favor < -0.15
  const friendly = bloc.favor > 0.15
  return (
    <div
      className="grid grid-cols-[86px_1fr_52px] items-center gap-2"
      title={`${BLOC_NOTES[bloc.id]}\n\nPower ${(bloc.power * 100).toFixed(0)} of 100 (${(bloc.effectivePower * 100).toFixed(0)} after society's check). Goodwill ${bloc.favor.toFixed(2)}.${pledged ? '\n\nYou owe them: everything they dislike costs double until the pledge expires.' : ''}`}
    >
      <span className="truncate font-mono text-[10px] tracking-wide text-dossier-paper/75">
        {BLOC_NAMES[bloc.id]}
        {pledged && <span className="text-dossier-brass"> ✦</span>}
      </span>
      {/* alerts on the felt rail use terminal-alert, not dossier-warn: oxblood
          on deep green is a 1.08:1 contrast ratio, i.e. invisible. The rail's
          rejection line already sets this precedent. */}
      <div className="h-1.5 bg-dossier-paper/15">
        <div
          className={`h-full ${hostile ? 'bg-terminal-alert' : friendly ? 'bg-dossier-paper' : 'bg-dossier-brass'}`}
          style={{ width: `${(bloc.effectivePower * 100).toFixed(0)}%` }}
        />
      </div>
      <span
        className={`text-right font-mono text-[11px] tabular-nums ${
          hostile ? 'text-terminal-alert' : friendly ? 'text-dossier-paper' : 'text-dossier-paper/70'
        }`}
      >
        {bloc.favor >= 0 ? '+' : ''}
        {bloc.favor.toFixed(2)}
      </span>
    </div>
  )
}

/** Layer 3 (§4.3): generational, ratcheting, contested. The price shown is
 * what the engine will actually charge — veto premium and reform-window
 * discount already in it — so the room's objection is legible before you pay. */
function ReformRow({ id, pub }: { id: (typeof INSTITUTION_IDS)[number]; pub: PublishedState }) {
  const { staged, stage } = useGame()
  const key = `reform:${id}`
  const stagedAction = staged.get(key)
  const level = pub.institutions[id]
  const cost = pub.reformCost[id]
  const { name, note } = INSTITUTION_NAMES[id]

  const button = (dir: 1 | -1) => {
    const price = dir > 0 ? cost.up : cost.down
    const isStaged = stagedAction?.kind === 'reform' && stagedAction.direction === dir
    return (
      <button
        disabled={!pub.inPower || price === null}
        title={
          price === null
            ? `${name} is already as ${dir > 0 ? 'broad' : 'narrow'} as it goes.`
            : `${dir > 0 ? 'Broaden' : 'Roll back'} ${name} — ${price.toFixed(0)} PC.${pub.reformWindowOpen ? ' The country is in ferment: the window is open and the price is cut.' : ''}`
        }
        onClick={() => stage(key, isStaged ? null : { kind: 'reform', institution: id, direction: dir })}
        className={`border px-1 py-0.5 font-mono text-[10px] tabular-nums ${
          isStaged
            ? 'border-dossier-brass bg-dossier-brass text-dossier-ink'
            : 'border-dossier-paper/30 text-dossier-paper/80 hover:border-dossier-brass hover:text-dossier-brass'
        } disabled:opacity-30`}
      >
        {dir > 0 ? '+' : '−'}
        {price === null ? '' : price.toFixed(0)}
      </button>
    )
  }

  return (
    <div className="grid grid-cols-[76px_1fr_auto_auto] items-center gap-1.5">
      <span className="truncate font-mono text-[10px] tracking-wide text-dossier-paper/75" title={note}>
        {name}
      </span>
      <div className="h-1.5 bg-dossier-paper/15" title={`${note}\n\nCurrently at ${(level * 100).toFixed(0)} of 100.`}>
        <div
          className={`h-full ${id === 'repression' ? 'bg-terminal-alert' : 'bg-dossier-brass'}`}
          style={{ width: `${(level * 100).toFixed(0)}%` }}
        />
      </div>
      {button(-1)}
      {button(1)}
    </div>
  )
}

export function ControlRail({ pub }: { pub: PublishedState }) {
  const { advance, advancing, staged, clearStaged, stagedCost, stagedAffordable, rejection } = useGame()

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

      <section>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="font-mono text-[9px] font-medium tracking-[0.25em] text-dossier-brass">
            INSTITUTIONS
          </span>
          {pub.reformWindowOpen && (
            <span
              className="font-mono text-[9px] tracking-[0.1em] text-terminal-alert"
              title="Revolutionary pressure has prised the window open: reforms the elites would otherwise veto are cheap right now, and the window closes as the country calms."
            >
              WINDOW OPEN
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {INSTITUTION_IDS.map((id) => (
            <ReformRow key={id} id={id} pub={pub} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="font-mono text-[9px] font-medium tracking-[0.25em] text-dossier-brass">
            THE ROOM
          </span>
          {pub.pledge && (
            <span
              className="font-mono text-[9px] tracking-[0.1em] text-dossier-brass"
              title={`You courted ${BLOC_NAMES[pub.pledge.bloc]} at the last election. Everything they dislike costs double for ${pub.pledge.quartersLeft} more quarters.`}
            >
              ✦ {BLOC_NAMES[pub.pledge.bloc].toUpperCase()} {pub.pledge.quartersLeft}Q
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {pub.blocs.map((b) => (
            <BlocRow key={b.id} bloc={b} pledged={pub.pledge?.bloc === b.id} />
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
        {!pub.inPower && (
          <div className="font-dossier text-[11px] italic leading-snug text-dossier-paper/60">
            The government has fallen. Advance to watch the country carry on without you, or start anew.
          </div>
        )}
      </div>
    </aside>
  )
}
