/**
 * Institutional reforms are generational, ratcheting, and contested. The price on each button
 * is what the engine will actually charge — veto premium and reform-window
 * discount already in it — so the room's objection is legible before you pay.
 */

import type { InstitutionId, PublishedState } from '@terrarium/observation'
import { Button, ProgressBar, TooltipLabel } from '../../components/ui'
import { INSTITUTION_NAMES } from '../../components/labels'
import { useGame } from '../../store/gameStore'

export function ReformRow({ id, pub }: { id: InstitutionId; pub: PublishedState }) {
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
