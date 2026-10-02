/**
 * The historians' verdict. A run ends (deposition or 2050) with a
 * report card whose axes are graded separately and never summed: one number
 * would secretly author a "correct" ideology.
 *
 * All three axes are here. Position is the one that
 * makes the corridor mean something after the fact: it grades the share of the
 * tenure spent inside the band, so the extractive path can score well on
 * Legitimacy (you kept winning) and still be shown, in its own column, as a
 * century spent outside the corridor. And Legitimacy now distinguishes
 * mandates won from mandates taken — the two counts sit
 * side by side and are never netted.
 */

import {
  FIRST_YEAR,
  LEGITIMACY_GRADE_ELECTIONS,
  POSITION_GRADE_CUTS,
  PROSPERITY_GRADE_CUTS,
} from '@terrarium/engine'
import {
  LONG_RUN_FORM,
  LONG_RUN_RECORD,
  type Grade,
  type LongRunForm,
  type LongRunReading,
  type LongRunRecordId,
  type PublishedState,
  type ReportCard,
} from '@terrarium/observation'
import { Modal, Panel, Tooltip, TooltipLabel } from '../components/ui'
import { TURBULENCE_COPY } from '../turbulence'

const yearOf = (q: number) => FIRST_YEAR + Math.floor(q / 4)

/**
 * The scale each letter was read off, built FROM the engine's own cutoffs.
 *
 * A stamped B explains nothing on its own — B against what? — and the numbers
 * that answer it are calibrated constants that move when the economy is
 * retuned. Spelling them into the copy by hand would produce a tooltip that is
 * confidently wrong the first time somebody adjusts a cut, and nothing would
 * fail. So the bands are rendered from the arrays the grader itself reads, and
 * the trailing F is stated by the tables' own convention: below every cut.
 */
const band = <T extends { atLeast: number; grade: string }>(
  cuts: readonly T[],
  fmt: (v: number) => string,
) => `${cuts.map((c) => `${c.grade} at ${fmt(c.atLeast)}`).join(', ')}, F below that.`

const GRADE_SCALES: Record<string, string> = {
  PROSPERITY: `Graded on the yearly rate of improvement in lived standards over the whole tenure: ${band(
    PROSPERITY_GRADE_CUTS,
    (v) => `${v.toFixed(2)}%/yr`,
  )} C is the passive band — roughly what the country would have managed with nobody at the desk.`,
  LEGITIMACY: `Reach 2050 still governing and the verdict is A. Fall, and it is how many mandates the electorate actually gave you: ${band(
    LEGITIMACY_GRADE_ELECTIONS,
    (v) => `${v} won`,
  )} Elections taken rather than won cannot buy this grade — they cap it instead.`,
  POSITION: `Graded on the share of the tenure spent inside the corridor: ${band(
    POSITION_GRADE_CUTS,
    (v) => `${Math.round(v * 100)}%`,
  )} It grades the path, not where the dot finished.`,
}

/** The letter, rubber-stamped: the one thing on the card a minister's eye
 * finds first. Failing marks in oxblood; honors in the ministry's green. */
function GradeStamp({ grade, scale }: { grade: Grade; scale?: string }) {
  const tone =
    grade === 'F' || grade === 'D'
      ? 'border-dossier-warn text-dossier-warn'
      : grade === 'C'
        ? 'border-dossier-ink/70 text-dossier-ink/80'
        : 'border-dossier-felt text-dossier-felt'
  const stamp = (
    <span
      className={`inline-flex h-11 w-11 shrink-0 rotate-6 items-center justify-center border-2 font-dossier text-3xl font-bold ${tone}`}
    >
      {grade}
    </span>
  )
  if (!scale) return stamp
  return (
    <Tooltip content={scale} openOnClick>
      <button type="button" aria-label={`Explain the ${grade} grade`} className="shrink-0 cursor-help">
        {stamp}
      </button>
    </Tooltip>
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
        <GradeStamp grade={grade} scale={GRADE_SCALES[name]} />
      </div>
    </Panel>
  )
}

const LONG_RUN_ROWS: Record<LongRunRecordId, { label: string; unit: string }> = {
  gdp_growth: { label: 'Real GDP growth', unit: '%/yr' },
  inflation: { label: 'Inflation', unit: '%/yr' },
  capital_stock: { label: 'Capital stock growth', unit: '%/yr' },
  unemployment: { label: 'Unemployment', unit: '%' },
}

const FORM_HINT: Record<LongRunForm, string> = {
  mean: 'The average of every quarter of the term.',
  compound:
    'Every quarter of the term chained into one annual rate: the steady pace that would have carried the level the same distance.',
  growth: 'Annualized growth from the first quarter measured to the last.',
}

function LongRunFigure({ reading, unit }: { reading: LongRunReading; unit: string }) {
  return (
    <>
      {reading.value.toFixed(2)}
      <span className="ml-0.5 text-[10px] font-normal text-dossier-ink/60">{unit}</span>
    </>
  )
}

/** The term's long run, as the office printed it and as it was. No stamp: the
 * axes above are the verdict, and this is the record they were reached through. */
function LongRunRecord({ card }: { card: ReportCard }) {
  const blind = LONG_RUN_RECORD.some((id) => card.longRun[id].reported === null)
  return (
    <Panel bodyClassName="p-3">
      <div className="mb-2 flex items-baseline justify-between gap-3 font-mono text-[9px] font-medium tracking-[0.3em] text-dossier-ink/60">
        <span>THE LONG RUN</span>
        <span className="tracking-[0.2em] text-dossier-ink/45">UNGRADED</span>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-dossier-ink/20">
            <th scope="col" className="pb-1" />
            <th scope="col" className="pb-1 text-right font-mono text-[8px] font-normal tracking-[0.14em] text-dossier-ink/50">
              THE OFFICE PRINTED
            </th>
            <th scope="col" className="pb-1 pl-3 text-right font-mono text-[8px] font-normal tracking-[0.14em] text-dossier-felt">
              WHAT HAPPENED
            </th>
          </tr>
        </thead>
        <tbody>
          {LONG_RUN_RECORD.map((id) => {
            const { reported, actual } = card.longRun[id]
            const row = LONG_RUN_ROWS[id]
            return (
              <tr key={id} className="border-b border-dossier-ink/10 align-top last:border-0">
                <th scope="row" className="py-1.5 pr-2 text-left font-dossier text-[12px] font-normal text-dossier-ink/75">
                  <TooltipLabel label={row.label} content={FORM_HINT[LONG_RUN_FORM[id]]} />
                </th>
                <td className="py-1.5 text-right font-mono text-[12px] tabular-nums text-dossier-ink/70">
                  {reported === null ? (
                    <span className="font-dossier text-[11px] italic text-dossier-ink/50">never measured</span>
                  ) : (
                    <>
                      <LongRunFigure reading={reported} unit={row.unit} />
                      <div className="text-[9px] text-dossier-ink/45">
                        {yearOf(reported.from)}–{yearOf(reported.to)}
                      </div>
                    </>
                  )}
                </td>
                <td className="py-1.5 pl-3 text-right font-mono text-[12px] font-semibold tabular-nums text-dossier-ink">
                  {actual === null ? '—' : <LongRunFigure reading={actual} unit={row.unit} />}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-2 font-dossier text-[12px] leading-snug text-dossier-ink/70">
        The first column is what your statistical office released over the term, put through the
        same arithmetic as the second: what actually happened, which nobody in the ministry could see
        until now. The gap between them is the fog you governed through.
        {blind && ' A figure the office never printed was one you governed blind.'}
      </p>
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
  // the card grades the tenure, and on a later posting the tenure did not
  // start in 1946 — both ends of this line come off the appointment (ADR-0021)
  const startYear = yearOf(pub.appointedAt)
  const endYear = yearOf(pub.appointedAt + card.quartersGoverned)
  const years = Math.max(1, Math.round(card.quartersGoverned / 4))
  return (
    <Modal title="THE HISTORIANS' VERDICT" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <div className="font-dossier text-2xl font-semibold text-dossier-ink">{pub.country}</div>
          <div className="mt-1 font-mono text-[11px] tabular-nums tracking-[0.2em] text-dossier-ink/70">
            {startYear} — {endYear}
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
          {TURBULENCE_COPY[pub.turbulence].mark && (
            <p className="mx-auto mt-3 max-w-md border-l-2 border-dossier-brass bg-dossier-brass/8 px-3 py-1.5 text-left font-dossier text-[11px] italic leading-snug text-dossier-ink/70">
              Served in a {pub.turbulence} world. The grades are scaled against centuries lived in the ordinary
              one, so they say how you governed this world, not how you would have fared in that one.
            </p>
          )}
          {pub.countryAuthored && (
            <p className="mx-auto mt-3 max-w-md border-l-2 border-dossier-brass bg-dossier-brass/8 px-3 py-1.5 text-left font-dossier text-[11px] italic leading-snug text-dossier-ink/70">
              Served on a drafted posting. The country was written rather than drawn from the catalogue, so
              nobody has run the matrix these grades are scaled against — read them against your own runs, not
              anyone else's.
            </p>
          )}
        </div>

        <Axis name="PROSPERITY" grade={card.prosperityGrade}>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-3xl font-semibold tabular-nums text-dossier-ink">
              ×{card.vsBaseline.toFixed(2)}
            </span>
            <span className="font-dossier text-sm italic text-dossier-ink/70">
              the {startYear} standard of living you inherited
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
            Where the dot sat, and the path it traced. A state that outruns its society
            ends in despotism and a society that outruns its state ends in anarchy; the narrow
            band between them is the only place both stay honest. This axis grades the path, not
            the destination — a century that ended well after eighty years outside the corridor
            was not a century inside it.
          </p>
        </Axis>

        <p className="text-center font-mono text-[9px] tracking-[0.2em] text-dossier-ink/50">
          AXES ARE GRADED SEPARATELY. THEY ARE NEVER SUMMED.
        </p>

        <LongRunRecord card={card} />
      </div>
    </Modal>
  )
}
