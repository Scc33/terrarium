/**
 * One capacity programme: eight quarters of funding for a ministry. The
 * statistical office gets the extra line, because it is the one capacity whose
 * return is an instrument appearing on the wall rather than a number moving.
 */

import { type CapacityId } from '@terrarium/engine'
import { INDICATOR_IDS, type PublishedState } from '@terrarium/observation'
import { Button, ProgressBar, TooltipLabel } from '../../components/ui'
import { NAMES } from '../../components/labels'
import { useGame } from '../../store/gameStore'
import { CAPACITY_COPY } from '../../levers'
import { deriveInstrumentAccess, nextInstrumentUnlock } from '../../maturity'

export function CapacityRow({ id, pub }: { id: CapacityId; pub: PublishedState }) {
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
