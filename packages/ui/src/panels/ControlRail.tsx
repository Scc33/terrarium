/**
 * The cabinet workspace: one decision domain at a time, with the draft and
 * enact flow pinned below it. It is a right rail on full desktops and the
 * same focused drawer at smaller laptop and tablet widths.
 *
 * This module is the composition root: the tab strip, the drawer bodies and
 * the enact footer. Every row a drawer is made of lives beside it in
 * `./cabinet`, imported directly rather than through a barrel.
 */

import { useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { CAPACITY_IDS } from '@terrarium/engine'
import { INSTITUTION_IDS, STATUTE_IDS, type PublishedState } from '@terrarium/observation'
import { useGame } from '../store/gameStore'
import { Button, Metric, ProgressBar, Tooltip } from '../components/ui'
import { BLOC_NAMES } from '../components/labels'
import { STATUTE_DRAWER } from '../statutes'
import { capitalReading } from '../gameRules'
import {
  CABINET_NAVIGATION_KEYS,
  CABINET_PANEL_ID,
  cabinetGroupForKey,
  cabinetTabId,
  type CabinetGroup,
  type CabinetNavigationKey,
} from '../cabinetNavigation'
import { BlocRow } from './cabinet/BlocRow'
import { CapacityRow } from './cabinet/CapacityRow'
import { DIALS } from './cabinet/dials'
import { DialRow } from './cabinet/DialRow'
import { ReformRow } from './cabinet/ReformRow'
import { SpendingRuleRow } from './cabinet/SpendingRuleRow'
import { StatuteRow } from './cabinet/StatuteRow'

export function ControlRail({
  pub,
  openGroup,
  onOpenGroupChange,
  focusRequest,
  onOpenRecord,
  onClose,
  onCollapse,
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
  /** Desktop gives the wall the cabinet's width; smaller screens keep using
   * the existing modal drawer and therefore hide this control. */
  onCollapse: () => void
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
          <Button
            onClick={onCollapse}
            variant="secondary"
            size="compact"
            className="hidden w-7 px-0 xl:inline-flex"
            aria-label="Collapse cabinet controls"
            aria-expanded="true"
            aria-controls="cabinet-controls"
            title="Hide the policy cabinet and give the instrument wall more room."
          >
            <span className="text-base leading-none" aria-hidden="true">›</span>
          </Button>
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
