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
      className="border-2 border-dossier-brass bg-gradient-to-b from-[#c2a06b] to-dossier-brass"
      bodyClassName="flex items-center justify-center px-2"
    >
      <div className="max-w-full border border-dossier-ink/40 px-3 py-3 text-center">
        <div className="font-mono text-xs font-medium tracking-[0.25em] text-dossier-ink">{t.plate}</div>
        <div className="mt-2 font-mono text-[10px] tracking-[0.15em] text-dossier-ink/70">
          INSTRUMENT NOT FITTED
        </div>
        <div className="mt-1 [overflow-wrap:anywhere] font-mono text-[10px] tracking-[0.15em] text-dossier-ink/70">
          REQUIRES: {t.needs}
        </div>
      </div>
    </WallTile>
  )
}
