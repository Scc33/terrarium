/**
 * An unmeasured indicator is a blank brass plate — a feature, not an empty
 * state to apologize for. It names the instrument and what would make it
 * exist; no "coming soon" softness.
 *
 * Like every other wall tile it fills exactly the slot it is given and clips
 * rather than growing — see wallPlan.ts for why that rule exists.
 */

import type { IndicatorId } from '@terrarium/observation'
import { NAMES } from '../labels'
import { WallTile } from '../WallTile/WallTile'

export function BlankPlate({ indicator }: { indicator: IndicatorId }) {
  const t = NAMES[indicator]
  return (
    <WallTile
      className="instrument-bay border border-dossier-brass/55 bg-[#172920]"
      bodyClassName="flex items-center justify-center px-3 py-4"
    >
      <div className="w-full max-w-[210px] border border-dossier-brass bg-gradient-to-b from-[#c8a977] to-dossier-brass px-3 py-3 text-center shadow-[0_5px_12px_rgba(0,0,0,0.24)]">
        <div className="mb-2 flex items-center justify-center gap-2 font-mono text-[8px] tracking-[0.16em] text-dossier-ink/60">
          <span className="h-1.5 w-1.5 border border-dossier-ink/50 bg-dossier-ink/15" aria-hidden="true" />
          OFFLINE
          <span className="h-1.5 w-1.5 border border-dossier-ink/50 bg-dossier-ink/15" aria-hidden="true" />
        </div>
        <div className="font-mono text-xs font-semibold tracking-[0.22em] text-dossier-ink">{t.plate}</div>
        <div className="my-2 h-px bg-dossier-ink/25" aria-hidden="true" />
        <div className="font-mono text-[8px] tracking-[0.14em] text-dossier-ink/55">SURVEY REQUIRED</div>
        <div className="mt-1 [overflow-wrap:anywhere] font-mono text-[9px] font-medium tracking-[0.12em] text-dossier-ink/80">
          {t.needs}
        </div>
        <div className="mt-2 border-t border-dossier-ink/20 pt-1.5 font-mono text-[7px] font-medium tracking-[0.1em] text-dossier-ink/60">UNLOCK: STATE CAPACITY → STATISTICAL OFFICE</div>
      </div>
    </WallTile>
  )
}
