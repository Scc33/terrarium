/**
 * One capacity programme: eight quarters of funding for a ministry. The
 * statistical office gets the extra line, because it is the one capacity whose
 * return is an instrument appearing on the wall rather than a number moving.
 */

import { CAPACITY_BUILD_QTRS, CAPACITY_COST_PER_POINT, PC_COST_CAPACITY, type CapacityId } from '@terrarium/engine'
import { INDICATOR_IDS, type PublishedState } from '@terrarium/observation'
import { Button, ProgressBar, TooltipLabel } from '../../components/ui'
import { NAMES } from '../../components/labels'
import { useGame } from '../../store/gameStore'
import { CAPACITY_COPY } from '../../levers'
import { deriveInstrumentAccess, nextInstrumentUnlock } from '../../maturity'
import { capacityFunding } from '../../capacityFunding'

export function CapacityRow({ id, pub }: { id: CapacityId; pub: PublishedState }) {
  const { staged, stagedCosts, stage } = useGame()
  const key = `cap:${id}`
  const stagedAction = staged.get(key)
  const funding = capacityFunding(pub, id)
  const amount = stagedAction?.kind === 'investCapacity' ? stagedAction.amount : funding.amount
  const moneyPerQtr = amount / CAPACITY_BUILD_QTRS
  const maxed = funding.full
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
      <div className="grid grid-cols-[minmax(0,1fr)_32px_70px] items-center gap-2">
        <ProgressBar value={pub.capacity[id]} label={`${CAPACITY_COPY[id].label} capacity`} />
        <Button
          disabled={!pub.inPower || maxed}
          aria-label={`Halve ${CAPACITY_COPY[id].label} funding`}
          title="Draft half this cash amount. Halve again to lower the bill or resize a programme the administration cannot absorb. Authorization still costs the same PC."
          onClick={() => stage(key, { kind: 'investCapacity', target: id, amount: amount / 2 })}
          variant="secondary"
          size="compact"
          className="min-h-6 px-1 py-0"
        >
          ½
        </Button>
        <Button
          disabled={!pub.inPower || (maxed && !stagedAction)}
          title={maxed
            ? 'This ministry is already at or building toward full strength.'
            : `Authorize for ${PC_COST_CAPACITY} PC; fund ${amount.toFixed(1)} total, ${moneyPerQtr.toFixed(1)} per quarter for ${CAPACITY_BUILD_QTRS} quarters. Adds up to ${(amount / CAPACITY_COST_PER_POINT * 100).toFixed(1)} capacity points before decay. Existing programmes keep their own bills.`}
          onClick={() => stage(key, stagedAction ? null : { kind: 'investCapacity', target: id, amount })}
          variant={stagedAction ? 'primary' : 'secondary'}
          size="compact"
          className="min-h-6 px-1 py-0 tracking-[0.08em]"
        >
          {stagedAction ? 'RESET' : maxed ? funding.programmes > 0 ? 'FUNDED' : 'FULL' : 'FUND'}
        </Button>
      </div>
      <p className="mt-1.5 font-dossier text-[11px] leading-snug text-dossier-paper/70">{CAPACITY_COPY[id].effect}</p>
      {statisticalNote && (
        <div className="mt-1.5 border-l border-dossier-brass/60 pl-2 font-mono text-[8px] leading-relaxed tracking-[0.08em] text-dossier-brass">
          {statisticalNote}
        </div>
      )}
      <div className={`mt-1 font-mono text-[8px] tracking-[0.08em] ${stagedAction ? 'text-dossier-brass' : 'text-dossier-paper/40'}`}>
        {!maxed && `${stagedAction ? 'DRAFTED · ' : ''}${(stagedCosts[key] ?? PC_COST_CAPACITY).toFixed(1)} PC · ${amount.toFixed(1)} TOTAL · ${moneyPerQtr.toFixed(1)} / QTR · ${CAPACITY_BUILD_QTRS}Q`}
      </div>
      {funding.programmes > 0 && (
        <div className="mt-1 font-mono text-[8px] tracking-[0.08em] text-dossier-brass">
          BUILDING · {funding.remaining}Q LEFT · {funding.activeMoneyPerQtr.toFixed(1)} / QTR · {funding.moneyRemaining.toFixed(1)} DUE
        </div>
      )}
    </div>
  )
}
