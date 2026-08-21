/**
 * The feasibility study, as a page of the file.
 *
 * Every number is shown beside the same number for Meridia, run on identical
 * seeds for the same century — a median growth rate on its own says nothing,
 * and an author who cannot compare cannot iterate.
 *
 * There is deliberately no verdict and no difficulty grade. 400 parameter
 * vectors sampled across the validator's whole legal box produced no NaN at
 * all and only slow, late relative-price drift, so a pass/fail stamp would
 * reject almost nothing while claiming an authority this study does not have.
 * It reports; the author decides.
 */

import { Button, ProgressBar, TooltipLabel } from '../components/ui'
import type { TrialLeg, TrialProgress, TrialReport as Report } from '../worker/trial'
import { tickLabel } from '../devScenario'
import type { CountryDocument } from '../countryDraft'
import { draftKey } from '../countryDraft'

export interface StudyState {
  running: boolean
  progress: TrialProgress | null
  report: Report | null
  error: string | null
  forDraft: string | null
}

function Row({
  label,
  candidate,
  reference,
  format,
  /** which direction is merely *different*, not better — the study does not
   * grade, so nothing here is coloured good or bad */
  hint,
}: {
  label: string
  candidate: number
  reference: number
  format: (value: number) => string
  hint: string
}) {
  return (
    <tr className="border-b border-dossier-ink/10 last:border-0">
      <th scope="row" className="py-1.5 pr-2 text-left font-dossier text-[12px] font-normal text-dossier-ink/75">
        <TooltipLabel label={label} content={hint}>{label}</TooltipLabel>
      </th>
      <td className="py-1.5 text-right font-mono text-[12px] font-semibold tabular-nums text-dossier-ink">
        {format(candidate)}
      </td>
      <td className="py-1.5 pl-3 text-right font-mono text-[12px] tabular-nums text-dossier-ink/50">
        {format(reference)}
      </td>
    </tr>
  )
}

const pct = (value: number) => `${value.toFixed(2)}%`
const share = (value: number) => `${Math.round(value * 100)}%`

function Integrity({ leg }: { leg: TrialLeg }) {
  if (leg.brokenRuns === 0) {
    return (
      <p className="mt-2 border-l-2 border-[#2f5947] bg-[#2f5947]/8 px-2.5 py-1.5 font-dossier text-[11px] leading-snug text-dossier-ink/72">
        Every century ran clean — no impossible numbers, no runaway prices.
      </p>
    )
  }
  const failure = leg.firstFailure
  return (
    <p className="mt-2 border-l-2 border-dossier-warn bg-dossier-warn/8 px-2.5 py-1.5 font-dossier text-[11px] leading-snug text-dossier-ink/80">
      <strong className="font-semibold">{leg.brokenRuns} of {leg.seeds} centuries</strong> tripped the
      batch runner’s own alarm
      {failure && (
        <>
          {' '}— first at {tickLabel(failure.tick)}, where{' '}
          {failure.kind === 'nan'
            ? 'the economy stopped producing finite numbers'
            : 'a price passed fifty times its 1946 level'}
        </>
      )}
      . That is the same test that fails a build.
    </p>
  )
}

export function StudyReport({
  study,
  draft,
  onRun,
  onClear,
}: {
  study: StudyState
  draft: CountryDocument
  onRun: () => void
  onClear: () => void
}) {
  // a report describes the country as it was when the study ran; the moment the
  // draft moves it is describing something else, and a stale number beside a
  // changed slider is worse than no number
  const stale = study.report !== null && study.forDraft !== draftKey(draft)
  const report = stale ? null : study.report

  return (
    <div>
      <div className="border-b border-dossier-ink/20 pb-2">
        <div className="font-mono text-[8px] tracking-[0.2em] text-dossier-ink/48">FEASIBILITY STUDY</div>
        <div className="mt-1.5 font-dossier text-2xl font-semibold leading-none">
          {report ? report.candidate.country : 'Nothing measured yet'}
        </div>
        <p className="mt-1.5 font-dossier text-[11px] italic leading-snug text-dossier-ink/55">
          Nobody governs during a study. What you get back is what this country does when it is
          left alone — read against Meridia on the same seeds.
        </p>
      </div>

      {study.error && (
        <p className="mt-3 border-l-2 border-dossier-warn bg-dossier-warn/8 px-2.5 py-1.5 font-dossier text-[11px] leading-snug text-dossier-ink/80">
          {study.error}
        </p>
      )}

      {study.running && study.progress && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between font-mono text-[9px] tracking-[0.14em] text-dossier-ink/55">
            <span>RUNNING CENTURIES</span>
            <span className="tabular-nums">
              {study.progress.done} / {study.progress.total}
            </span>
          </div>
          <div className="mt-1.5">
            <ProgressBar
              label="Centuries run"
              tone="brass"
              value={study.progress.done / Math.max(study.progress.total, 1)}
            />
          </div>
        </div>
      )}

      {!study.running && !report && (
        <div className="mt-3">
          <Button variant="primary" fullWidth onClick={onRun}>
            COMMISSION A STUDY
          </Button>
          <p className="mt-1.5 font-dossier text-[11px] italic leading-snug text-dossier-ink/50">
            {stale
              ? 'The draft has moved since the last study. Run it again.'
              : 'Eighteen centuries, about a second. It changes nothing — it only tells you.'}
          </p>
        </div>
      )}

      {report && (
        <>
          <table className="mt-3 w-full border-collapse">
            <caption className="pb-1 text-left font-mono text-[8px] tracking-[0.16em] text-dossier-ink/45">
              MEDIAN OF {report.candidate.seeds} PASSIVE CENTURIES · {report.candidate.ticks} QUARTERS
            </caption>
            <thead>
              <tr className="border-b border-dossier-ink/20">
                <th scope="col" className="pb-1 text-left font-mono text-[8px] tracking-[0.14em] text-dossier-ink/45">
                  &nbsp;
                </th>
                <th scope="col" className="pb-1 text-right font-mono text-[8px] tracking-[0.14em] text-dossier-brass">
                  {report.candidate.country.toUpperCase()}
                </th>
                <th scope="col" className="pb-1 pl-3 text-right font-mono text-[8px] tracking-[0.14em] text-dossier-ink/40">
                  {report.reference.country.toUpperCase()}
                </th>
              </tr>
            </thead>
            <tbody>
              <Row
                label="Real growth"
                hint="Annualized real GDP growth over the century, with nobody governing."
                candidate={report.candidate.growth.p50}
                reference={report.reference.growth.p50}
                format={pct}
              />
              <Row
                label="Inflation"
                hint="Mean annualized inflation across the century."
                candidate={report.candidate.inflation.p50}
                reference={report.reference.inflation.p50}
                format={pct}
              />
              <Row
                label="Unemployment"
                hint="Mean unemployment. The subsistence valve keeps the impoverished nominally employed, so this reads low in agrarian countries."
                candidate={report.candidate.unemployment.p50}
                reference={report.reference.unemployment.p50}
                format={pct}
              />
              <Row
                label="Governments that fell"
                hint="Share of centuries whose government was deposed without anyone governing. A country that falls apart when left alone is a hard posting."
                candidate={report.candidate.deposedShare}
                reference={report.reference.deposedShare}
                format={share}
              />
            </tbody>
          </table>

          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-dossier-ink/15 pt-2">
            <div>
              <div className="font-mono text-[8px] tracking-[0.16em] text-dossier-ink/45">GROWTH, QUARTER TO THREE-QUARTER</div>
              <div className="mt-0.5 font-mono text-[11px] tabular-nums text-dossier-ink/75">
                {pct(report.candidate.growth.p25)} — {pct(report.candidate.growth.p75)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[8px] tracking-[0.16em] text-dossier-ink/45">
                {report.candidate.medianDeposedAt === null ? 'NO GOVERNMENT FELL' : 'TYPICALLY FELL'}
              </div>
              <div className="mt-0.5 font-mono text-[11px] tabular-nums text-dossier-ink/75">
                {report.candidate.medianDeposedAt === null
                  ? '—'
                  : tickLabel(Math.round(report.candidate.medianDeposedAt))}
              </div>
            </div>
          </div>

          <Integrity leg={report.candidate} />

          <p className="mt-2 font-dossier text-[10px] italic leading-snug text-dossier-ink/45">
            Seeds genuinely disagree about a century — the band is the finding, not noise. Studied
            in {(report.wallMs / 1000).toFixed(1)}s.
          </p>

          <Button variant="quiet" size="compact" fullWidth className="mt-2" onClick={onClear}>
            CLEAR AND RESTUDY
          </Button>
        </>
      )}
    </div>
  )
}
