/**
 * §3.3 — the historians' verdict. A run ends (deposition or 2050) with a
 * report card whose axes are graded separately and never summed: one number
 * would secretly author a "correct" ideology.
 *
 * From M6 all three axes the design named are here. Position is the one that
 * makes the corridor mean something after the fact: it grades the share of the
 * tenure spent inside the band, so the extractive path can score well on
 * Legitimacy (you kept winning) and still be shown, in its own column, as a
 * century spent outside the corridor. And Legitimacy now distinguishes
 * mandates won from mandates taken, exactly as §3.3 asks — the two counts sit
 * side by side and are never netted.
 */

import type { Grade, PublishedState, ReportCard } from '@terrarium/observation'
import { Modal, Panel } from '../components/ui'

const yearOf = (q: number) => 1946 + Math.floor(q / 4)

/** The letter, rubber-stamped: the one thing on the card a minister's eye
 * finds first. Failing marks in oxblood; honors in the ministry's green. */
function GradeStamp({ grade }: { grade: Grade }) {
  const tone =
    grade === 'F' || grade === 'D'
      ? 'border-dossier-warn text-dossier-warn'
      : grade === 'C'
        ? 'border-dossier-ink/70 text-dossier-ink/80'
        : 'border-dossier-felt text-dossier-felt'
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 rotate-6 items-center justify-center border-2 font-dossier text-3xl font-bold ${tone}`}
    >
      {grade}
    </span>
  )
}

function Axis({ name, grade, children }: { name: string; grade: Grade; children: React.ReactNode }) {
  return (
    <Panel bodyClassName="p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 font-mono text-[9px] font-medium tracking-[0.3em] text-dossier-ink/60">
            {name}
          </div>
          {children}
        </div>
        <GradeStamp grade={grade} />
      </div>
    </Panel>
  )
}

export function ReportCardOverlay({
  pub,
  card,
  onClose,
}: {
  pub: PublishedState
  card: ReportCard
  onClose: () => void
}) {
  const endYear = yearOf(card.quartersGoverned)
  const years = Math.max(1, Math.round(card.quartersGoverned / 4))
  return (
    <Modal title="THE HISTORIANS' VERDICT" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <div className="font-dossier text-2xl font-semibold text-dossier-ink">{pub.country}</div>
          <div className="mt-1 font-mono text-[11px] tabular-nums tracking-[0.2em] text-dossier-ink/70">
            1946 — {endYear}
          </div>
          <div
            className={`mx-auto mt-3 inline-block -rotate-3 border-2 px-3 py-1 font-mono text-xs font-bold tracking-[0.3em] ${
              card.endedBy === 'deposition'
                ? 'border-dossier-warn text-dossier-warn'
                : 'border-dossier-felt text-dossier-felt'
            }`}
          >
            {card.endedBy === 'deposition' ? 'DEPOSED' : 'THE BOOK CLOSES'}
          </div>
        </div>

        <Axis name="PROSPERITY" grade={card.prosperityGrade}>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-3xl font-semibold tabular-nums text-dossier-ink">
              ×{card.vsBaseline.toFixed(2)}
            </span>
            <span className="font-dossier text-sm italic text-dossier-ink/70">
              the 1946 standard of living
            </span>
          </div>
          <div className="mt-1 font-mono text-[11px] tabular-nums text-dossier-ink/80">
            {card.prosperityRate >= 0 ? '+' : ''}
            {card.prosperityRate.toFixed(1)}% /yr in lived standards, over your tenure
          </div>
          <p className="mt-2 font-dossier text-[12px] leading-snug text-dossier-ink/70">
            What it was like to live here, averaged over the whole run and every cohort —
            log-weighted, so bread reaching the poor counts for more than services stacked on
            the rich, and no terminal sprint buys back a hungry decade.
          </p>
        </Axis>

        <Axis name="LEGITIMACY" grade={card.legitimacyGrade}>
          <div className="font-mono text-sm tabular-nums text-dossier-ink">
            {years} years governed · {card.electionsWon} election
            {card.electionsWon === 1 ? '' : 's'} won
            {card.electionsSuppressed > 0 && (
              <span className="text-dossier-warn">
                {' '}
                · {card.electionsSuppressed} taken
              </span>
            )}
          </div>
          <p className="mt-2 font-dossier text-[12px] leading-snug text-dossier-ink/70">
            {card.electionsSuppressed > 0
              ? 'Mandates taken are recorded beside mandates won, and never subtracted from them — the ledger simply shows which is which, and consent is what this axis grades.'
              : card.deposedBy === 'revolt'
                ? 'The street ended it. Consent had been withdrawn long before anyone was asked.'
                : card.deposedBy === 'coup'
                  ? 'The men who owned the country decided they no longer owned the government.'
                  : card.endedBy === 'deposition'
                    ? 'The electorate withdrew its consent. The country, of course, carries on.'
                    : 'The government stood when the historians closed the book.'}
          </p>
        </Axis>

        <Axis name="POSITION" grade={card.positionGrade}>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-3xl font-semibold tabular-nums text-dossier-ink">
              {(card.corridorShare * 100).toFixed(0)}%
            </span>
            <span className="font-dossier text-sm italic text-dossier-ink/70">
              of your tenure inside the corridor
            </span>
          </div>
          <div className="mt-1 font-mono text-[11px] tabular-nums text-dossier-ink/80">
            finished at state {card.finalStatePower.toFixed(2)} · society{' '}
            {card.finalSocietalPower.toFixed(2)}
          </div>
          <p className="mt-2 font-dossier text-[12px] leading-snug text-dossier-ink/70">
            Where the dot sat, and the path it traced (§6.3). A state that outruns its society
            ends in despotism and a society that outruns its state ends in anarchy; the narrow
            band between them is the only place both stay honest. This axis grades the path, not
            the destination — a century that ended well after eighty years outside the corridor
            was not a century inside it.
          </p>
        </Axis>

        <p className="text-center font-mono text-[9px] tracking-[0.2em] text-dossier-ink/50">
          AXES ARE GRADED SEPARATELY. THEY ARE NEVER SUMMED.
        </p>
      </div>
    </Modal>
  )
}
