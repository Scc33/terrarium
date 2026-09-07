/**
 * One statute on the books (ADR-0027).
 *
 * The row exists to show the two numbers that make a statute different from a
 * dial, side by side: the rung the cabinet has WRITTEN, and how much of it the
 * country is actually obeying. A government with no inspectorate can post the
 * strictest law in the book and change almost nothing, and the only way to
 * learn that without losing a decade to it is to be shown both figures at
 * once.
 *
 * Prices on the rungs come straight from `politicalCostOfAction` via
 * `PublishedStatute.cost` — the entrenchment premium on a repeal and the
 * room's veto premium are already in them, so what is quoted is what is
 * charged.
 */

import type { PublishedState, PublishedStatute } from '@terrarium/observation'
import { ProgressBar, Tooltip, TooltipLabel } from '../../components/ui'
import { BLOC_NAMES } from '../../components/labels'
import { useGame } from '../../store/gameStore'
import { complianceNote, STATUTE_COPY } from '../../statutes'

export function StatuteRow({ statute, pub }: { statute: PublishedStatute; pub: PublishedState }) {
  const { staged, stage } = useGame()
  const key = `statute:${statute.id}`
  const stagedAction = staged.get(key)
  const copy = STATUTE_COPY[statute.id]
  const inForceShare = statute.levels[statute.level].strength
  const stagedLevel = stagedAction?.kind === 'enact' ? stagedAction.level : statute.level
  const resisting = statute.resistance
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .map((entry) => BLOC_NAMES[entry.bloc])
  // still arriving: the posted rung is in the book but the phase-in has not
  // finished carrying it into the economy
  const arriving = statute.level > 0 && statute.inForce < inForceShare * statute.compliance * 0.98

  return (
    <div
      className={`border px-2.5 py-2 ${stagedAction ? 'border-dossier-brass bg-dossier-paper/[0.08]' : 'border-dossier-paper/15 bg-[#22382d]/35'}`}
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <TooltipLabel
          label={copy.label}
          content={`${copy.hint} ${copy.effect}`}
          className="truncate font-mono text-[11px] font-medium tracking-wide text-dossier-paper"
        >
          {copy.label}
        </TooltipLabel>
        <span className="shrink-0 font-mono text-[9px] tracking-[0.08em] text-dossier-paper/50">
          {statute.enactedAt === null
            ? 'NOT IN FORCE'
            : `SINCE ${1946 + Math.floor(statute.enactedAt / 4)}`}
        </span>
      </div>

      {/* The ladder, one rung per row. A segmented control cannot wrap, and
          these rungs are sentences rather than words — three of them side by
          side would shear off the right edge of the rail. */}
      <div className="flex flex-col gap-px" role="group" aria-label={`${copy.label} level`}>
        {statute.levels.map((rung, index) => {
          const inForce = index === statute.level
          const selected = index === stagedLevel
          const price = statute.cost[index]
          return (
            <button
              key={rung.name}
              type="button"
              aria-pressed={selected}
              disabled={!pub.inPower || (price === null && !inForce)}
              title={
                inForce
                  ? `${rung.name} — in force now.`
                  : `${rung.name} — ${price?.toFixed(0) ?? '—'} PC.${index < statute.level ? ' Repeal costs more the longer a law has stood.' : ''}`
              }
              onClick={() =>
                stage(key, inForce ? null : { kind: 'enact', statute: statute.id, level: index })
              }
              className={`flex min-h-6 items-baseline justify-between gap-2 border px-1.5 py-0.5 text-left font-mono text-[10px] tracking-[0.04em] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-dossier-brass disabled:cursor-not-allowed disabled:opacity-30 ${
                selected && !inForce
                  ? 'border-dossier-brass bg-dossier-brass/25 text-dossier-paper'
                  : inForce
                    ? 'border-dossier-paper/45 bg-dossier-paper/10 text-dossier-paper'
                    : 'border-transparent text-dossier-paper/55 hover:border-dossier-paper/30 hover:text-dossier-paper'
              }`}
            >
              <span className="truncate">{rung.name}</span>
              <span className="shrink-0 tabular-nums text-dossier-brass">
                {inForce ? '\u2713' : price === null ? '' : `${price.toFixed(0)} PC`}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <ProgressBar
          value={statute.compliance}
          label={`${copy.label} compliance`}
          tone={statute.compliance < 0.35 ? 'danger' : 'brass'}
        />
        <Tooltip
          content={
            statute.level === 0
              ? 'What your civil service and courts could enforce if you wrote this law today.'
              : `The country obeys ${(statute.compliance * 100).toFixed(0)}% of what you posted.${
                  resisting.length > 0 ? ` Evaded by: ${resisting.join(', ')}.` : ''
                }`
          }
        >
          <span className="shrink-0 font-mono text-[9px] tracking-[0.08em] text-dossier-paper/60">
            {arriving ? 'STILL ARRIVING' : complianceNote(statute.compliance)}
          </span>
        </Tooltip>
      </div>
    </div>
  )
}
