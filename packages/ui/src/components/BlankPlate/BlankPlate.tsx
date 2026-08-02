/**
 * An unmeasured indicator is a blank brass plate — a feature, not an empty
 * state to apologize for. It names the instrument and what would make it
 * exist; no "coming soon" softness.
 *
 * Like every other wall tile it fills exactly the slot it is given and clips
 * rather than growing — see wallPlan.ts for why that rule exists.
 */

import type { IndicatorId } from '@terrarium/observation'
import type { InstrumentAvailability } from '../../maturity'
import { NAMES } from '../labels'
import { WallTile } from '../WallTile/WallTile'

const points = (value: number) => Math.round(value * 100)

export function BlankPlate({
  indicator,
  availability = 'unfunded',
  currentCapacity = 0,
  fundedAt = 0,
  onOpenCapacity,
}: {
  indicator: IndicatorId
  availability?: Exclude<InstrumentAvailability, 'reporting'>
  currentCapacity?: number
  fundedAt?: number
  onOpenCapacity?: () => void
}) {
  const t = NAMES[indicator]
  const awaiting = availability === 'awaiting'
  return (
    <WallTile
      className="instrument-bay border border-dossier-brass/55 bg-[#172920]"
      bodyClassName="flex items-center justify-center px-3 py-4"
    >
      <div className="w-full max-w-[210px] border border-dossier-brass bg-gradient-to-b from-[#c8a977] to-dossier-brass px-3 py-3 text-center shadow-[0_5px_12px_rgba(0,0,0,0.24)]">
        <div className="mb-2 flex items-center justify-center gap-2 font-mono text-[8px] tracking-[0.16em] text-dossier-ink/60">
          <span className="h-1.5 w-1.5 border border-dossier-ink/50 bg-dossier-ink/15" aria-hidden="true" />
          {awaiting ? 'COMMISSIONED' : 'UNFITTED'}
          <span className="h-1.5 w-1.5 border border-dossier-ink/50 bg-dossier-ink/15" aria-hidden="true" />
        </div>
        <div className="font-mono text-xs font-semibold tracking-[0.22em] text-dossier-ink">{t.plate}</div>
        <div className="my-2 h-px bg-dossier-ink/25" aria-hidden="true" />
        <div className="font-mono text-[8px] tracking-[0.14em] text-dossier-ink/55">
          {awaiting ? 'FIRST RETURN PENDING' : 'SURVEY REQUIRED'}
        </div>
        <div className="mt-1 [overflow-wrap:anywhere] font-mono text-[9px] font-medium tracking-[0.12em] text-dossier-ink/80">
          {t.needs}
        </div>
        {awaiting ? (
          <div className="mt-2 border-t border-dossier-ink/20 pt-1.5 font-mono text-[7px] font-medium tracking-[0.1em] text-dossier-ink/60">
            THRESHOLD MET · AWAIT PUBLICATION
          </div>
        ) : (
          <div className="mt-2 border-t border-dossier-ink/20 pt-1.5">
            <div className="font-mono text-[8px] font-semibold tabular-nums tracking-[0.08em] text-dossier-ink/70">
              STAT. OFFICE {points(currentCapacity)} → {points(fundedAt)}
            </div>
            <div className="mt-1 h-1 overflow-hidden border border-dossier-ink/25 bg-dossier-paper/35" aria-hidden="true">
              <div
                className="h-full bg-dossier-ink/55"
                style={{ width: `${Math.min(100, currentCapacity / Math.max(fundedAt, 0.01) * 100)}%` }}
              />
            </div>
            {onOpenCapacity && (
              <button
                type="button"
                onClick={onOpenCapacity}
                className="mt-2 w-full border border-dossier-ink/45 bg-dossier-paper/30 px-2 py-1 font-mono text-[7px] font-semibold tracking-[0.12em] text-dossier-ink hover:bg-dossier-paper/55 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-dossier-ink"
                aria-label={`Open Institutions to fund ${t.needs}`}
              >
                OPEN INSTITUTIONS →
              </button>
            )}
          </div>
        )}
      </div>
    </WallTile>
  )
}
