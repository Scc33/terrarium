/** The Labour Office — the occupational split behind the underuse headline. */

import { LABOUR_SURVEY_FUNDED_AT } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import {
  ChartFrame,
  EmptyState,
  Metric,
  Modal,
  OverlayLayout,
  ProgressBar,
  SectionHeading,
  TimeSeriesChart,
  TooltipLabel,
} from '../components/ui'
import {
  labourAvailability,
  labourTraces,
  latestLabourIndicator,
  readLabour,
} from '../labour'

const yearOf = (q: number) => 1946 + Math.floor(q / 4)
const qtrLabel = (q: number) => `${yearOf(q)} Q${(q % 4) + 1}`
const pct = (value: number) => `${value.toFixed(1)}%`
const band = (value: number) => (value > 0 ? `±${(100 * value).toFixed(1)} pts` : '±?')

export function LabourOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const release = readLabour(pub)

  if (!release) {
    const commissioned = labourAvailability(pub) === 'awaiting'
    return (
      <Modal title="THE LABOUR OFFICE — WORK AND OCCUPATION" onClose={onClose} size="wide">
        {commissioned ? (
          <EmptyState title="THE OCCUPATIONAL RETURNS ARE BEING COMPILED">
            The survey has been commissioned and the first returns are still coming in. The
            office reports behind the country it measures; nothing more needs funding.
          </EmptyState>
        ) : (
          <EmptyState title="THE MINISTRY COUNTS JOBS, NOT WHO FILLS THEM" requirement="OCCUPATIONAL SURVEY">
            Raise the statistics office from {(100 * pub.capacity.statistical).toFixed(0)} to{' '}
            {(100 * LABOUR_SURVEY_FUNDED_AT).toFixed(0)} and the labour office can separate
            people without work from people working below their training. Until then neither
            a blank return nor a zero means the country has no mismatch.
          </EmptyState>
        )}
      </Modal>
    )
  }

  const underuse = latestLabourIndicator(pub, 'labour_underuse')
  const unemployment = latestLabourIndicator(pub, 'unemployment')
  const joblessTraces = labourTraces(pub, 'jobless')
  const underemployedTraces = labourTraces(pub, 'underemployed')

  return (
    <Modal title="THE LABOUR OFFICE — WORK AND OCCUPATION" onClose={onClose} size="wide">
      <OverlayLayout
        summary={(
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <Metric
              label="LABOUR UNDERUSE"
              value={underuse === null ? '—' : pct(underuse)}
              detail="WITHOUT WORK + BELOW TRAINING"
              title="The broad headline: people without a job plus employed people holding a post below their occupational rung, as a share of the labour force."
            />
            <Metric
              label="OPEN JOBLESSNESS"
              value={unemployment === null ? '—' : pct(unemployment)}
              detail="WITHOUT A JOB"
              title="People seeking work who do not hold a job. This is the narrower unemployment instrument already on the wall."
            />
            <Metric
              label="SURVEY DATE"
              value={qtrLabel(release.forQtr)}
              detail={`REVISION ${release.revision}`}
            />
          </div>
        )}
        note={(
          <>
            Each class and each headline is sampled separately. The rows will not add back to
            either wall instrument, and two rows may disagree within their stated ranges. That
            is how the office measured them, not a hidden fourth class. “Below training” means
            employed in a post from a lower occupational rung; it is not counted as joblessness.
          </>
        )}
        footer={`OCCUPATIONAL SURVEY · MEASURED FOR ${qtrLabel(release.forQtr)} · ${release.lag} QUARTER${release.lag === 1 ? '' : 'S'} AGO · REVISABLE`}
      >
        <div className="flex flex-col gap-4">
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartFrame
              title="WITHOUT WORK, BY CLASS"
              detail={`SHARE OF EACH CLASS'S LABOUR FORCE · ${band(release.errorBand.jobless)}`}
              legend={joblessTraces.map((trace) => ({ label: trace.label, color: trace.ink }))}
              summary="Joblessness for rural, urban and professional workers over successive occupational surveys."
              bodyClassName="p-2"
            >
              <TimeSeriesChart
                traces={joblessTraces.map((trace) => ({ ...trace, color: trace.ink, width: 1.6 }))}
                include={[0]}
                height={150}
                format={pct}
                formatReading={pct}
                formatTick={(tick) => String(yearOf(tick))}
                summary="Three lines compare the share of each occupational class seeking work without a job."
                hover
              />
            </ChartFrame>
            <ChartFrame
              title="WORKING BELOW TRAINING, BY CLASS"
              detail={`SHARE OF EACH CLASS'S LABOUR FORCE · ${band(release.errorBand.underemployed)}`}
              legend={underemployedTraces.map((trace) => ({ label: trace.label, color: trace.ink }))}
              summary="Underemployment for rural, urban and professional workers over successive occupational surveys."
              bodyClassName="p-2"
            >
              <TimeSeriesChart
                traces={underemployedTraces.map((trace) => ({ ...trace, color: trace.ink, width: 1.6 }))}
                include={[0]}
                height={150}
                format={pct}
                formatReading={pct}
                formatTick={(tick) => String(yearOf(tick))}
                summary="Three lines compare the share of each occupational class employed below its training."
                hover
              />
            </ChartFrame>
          </div>

          <div>
            <SectionHeading aside="SHARE OF EACH CLASS'S OWN LABOUR FORCE">LATEST RETURN</SectionHeading>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse font-mono text-[10px] text-dossier-ink">
                <thead>
                  <tr className="border-b border-dossier-ink/20 text-left text-[8px] tracking-[0.16em] text-dossier-ink/55">
                    <th className="px-2 py-2 font-medium">OCCUPATIONAL CLASS</th>
                    <th className="px-2 py-2 font-medium">WITHOUT WORK</th>
                    <th className="px-2 py-2 font-medium">BELOW TRAINING</th>
                  </tr>
                </thead>
                <tbody>
                  {release.rows.map((row) => (
                    <tr key={row.key} className="border-b border-dossier-ink/10 last:border-0">
                      <th scope="row" className="w-44 px-2 py-2 text-left font-medium">
                        <TooltipLabel label={row.label} content={row.note}>{row.label}</TooltipLabel>
                      </th>
                      <td className="px-2 py-2">
                        <div className="mb-1 tabular-nums">{pct(row.jobless)}</div>
                        <ProgressBar value={row.jobless / 100} label={`${row.label} without work`} />
                      </td>
                      <td className="px-2 py-2">
                        <div className="mb-1 tabular-nums">{pct(row.underemployed)}</div>
                        <ProgressBar value={row.underemployed / 100} label={`${row.label} working below training`} tone="danger" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </OverlayLayout>
    </Modal>
  )
}
