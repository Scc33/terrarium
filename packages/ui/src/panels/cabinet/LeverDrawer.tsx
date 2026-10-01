/**
 * A drawer of levers: its question and brief, whatever the desk has to say
 * before the sliders, then one row per dial. The spending drawer's rows carry
 * a rule switch; the central bank's opens with the desk's own reading of its
 * stance, above the rate it advises on (ADR-0043). Nothing here decides
 * anything — `dials.ts` and `levers.ts` own the rows and the words.
 */

import type { PublishedState } from '@terrarium/observation'
import type { DialGroup } from './dials'
import { DialRow } from './DialRow'
import { SpendingRuleRow } from './SpendingRuleRow'
import { StanceBriefing } from './StanceBriefing'

export function LeverDrawer({ group, pub }: { group: DialGroup; pub: PublishedState }) {
  return (
    <section>
      <div className="mb-2 border-b border-dossier-paper/15 pb-2">
        <div className="font-mono text-[9px] font-semibold tracking-[0.2em] text-dossier-brass">{group.question.toUpperCase()}</div>
        <p className="mt-1 font-dossier text-[12px] leading-snug text-dossier-paper/72">{group.brief}</p>
      </div>
      {group.group === 'MONEY' && <StanceBriefing pub={pub} />}
      <div className="flex flex-col gap-1">
        {group.dials.map((dial) =>
          group.group === 'SPENDING' ? (
            <SpendingRuleRow key={dial.path} def={dial} pub={pub} />
          ) : (
            <DialRow key={dial.path} def={dial} pub={pub} />
          ),
        )}
      </div>
    </section>
  )
}
