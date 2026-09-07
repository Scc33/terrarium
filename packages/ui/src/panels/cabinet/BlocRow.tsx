/**
 * The whip count. Bloc power is read off the economy each quarter, so
 * this is a live picture of who is actually in the room — and the bar shows
 * EFFECTIVE power, i.e. after an organised society's check, because that is
 * the number that actually prices your levers. Alerts here use terminal-alert,
 * not dossier-warn: oxblood on deep green is a 1.08:1 contrast ratio.
 */

import type { PublishedState } from '@terrarium/observation'
import { ProgressBar, TooltipLabel } from '../../components/ui'
import { BLOC_NAMES, BLOC_NOTES } from '../../components/labels'

export function BlocRow({ bloc, pledged }: { bloc: PublishedState['blocs'][number]; pledged: boolean }) {
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
