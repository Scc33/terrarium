/**
 * The industrial census, opened out — what the economy is MADE of.
 *
 * The expenditure accounts next door answer "who was the output for". This
 * answers the other half of the same question: who made it, and who did the
 * making employ. The wall can tell a player their economy grew 3%; nothing on
 * it can tell them whether they are running an agrarian country that is
 * getting richer or an industrial one that is getting started, and those are
 * two different futures with two different politics.
 *
 * Same anatomy as the ledger and the accounts — a pie for this release, the
 * same inks stacked across the century beside it — pointed at the production
 * side. Nothing here is exact except the subsidy column, which is the
 * government's own dial and is marked as such: it is on this page because the
 * question the page exists to serve is which industries you can push.
 *
 * The arithmetic lives in `../industry`; this file is a painter.
 */

import { useState } from 'react'
import { INDUSTRY_CENSUS_FUNDED_AT } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import {
  DonutChart,
  EmptyState,
  Metric,
  Modal,
  OverlayLayout,
  SectionHeading,
  SegmentedControl,
  StackedAreaChart,
  TooltipLabel,
} from '../components/ui'
import {
  industryGrowth,
  readIndustry,
  toShares,
  industryRows,
  type IndustryLens,
} from '../industry'

const pct = (v: number) => `${v.toFixed(1)}%`
const yearOf = (q: number) => 1946 + Math.floor(q / 4)
const qtrLabel = (q: number) => `${yearOf(q)} Q${(q % 4) + 1}`

/**
 * A confessed half-width, or a shrug — the `AccountsOverlay` rule, with the
 * census's own unit. The office states no band at all below 0.45 statistical
 * capacity and it arrives here as a literal zero; printing that as "±0.0%"
 * would show a ministry too poor to estimate its own error as the most
 * certain it has ever been.
 */
const band = (fraction: number): string => (fraction > 0 ? `±${(100 * fraction).toFixed(1)}%` : '±?')

const LENS_COPY: Record<IndustryLens, { label: string; unit: string; title: string; format: (v: number) => string }> = {
  valueAdded: {
    label: 'OUTPUT',
    unit: 'REAL OUTPUT AT 1946 PRICES',
    title: 'What each industry adds to national output, at 1946 prices — so the mix moves when production moves, not when a price does.',
    format: (v) => v.toFixed(1),
  },
  employment: {
    label: 'JOBS',
    unit: 'MILLIONS OF PEOPLE',
    title: 'How many people each industry employs, in millions.',
    format: (v) => `${v.toFixed(2)}M`,
  },
}

export function IndustryOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const [lens, setLens] = useState<IndustryLens>('valueAdded')
  const release = readIndustry(pub)

  if (!release) {
    return (
      <Modal title="THE INDUSTRIAL CENSUS — WHAT THE ECONOMY IS MADE OF" onClose={onClose} size="wide">
        <EmptyState title="THE MINISTRY CANNOT TELL ITS INDUSTRIES APART" requirement="CENSUS OF INDUSTRY">
          The country has farms, factories and workshops; nobody has been sent to count what
          each of them made. Raise the statistics office from{' '}
          {(100 * pub.capacity.statistical).toFixed(0)} to{' '}
          {(100 * INDUSTRY_CENSUS_FUNDED_AT).toFixed(0)} and the enumerators go out. Until
          then the ministry knows how much the country produced and not who produced it.
        </EmptyState>
      </Modal>
    )
  }

  const copy = LENS_COPY[lens]
  const readings = release[lens]
  const output = release.valueAdded
  const jobs = release.employment
  const growth = industryGrowth(pub, lens)
  const rows = industryRows(pub, lens)
  const measured = release.forQtr

  return (
    <Modal title="THE INDUSTRIAL CENSUS — WHAT THE ECONOMY IS MADE OF" onClose={onClose} size="wide">
      <OverlayLayout
        summary={(
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            {output.map((r) => (
              <Metric
                key={r.key}
                label={r.label.toUpperCase()}
                value={pct(100 * r.share)}
                detail={`${pct(100 * jobs.find((j) => j.key === r.key)!.share)} of jobs`}
                title={`${r.note} Share of output in the ${qtrLabel(measured)} census; the office says each industry's figure may be off by ${band(release.errorBand)}.`}
              />
            ))}
          </div>
        )}
        toolbar={(
          <SegmentedControl
            label="Census table"
            value={lens}
            onChange={setLens}
            options={[
              { value: 'valueAdded', label: 'BY OUTPUT', title: LENS_COPY.valueAdded.title },
              { value: 'employment', label: 'BY EMPLOYMENT', title: LENS_COPY.employment.title },
            ]}
          />
        )}
        note={(
          <>
            Each industry is surveyed separately, so the five figures do not add up to the
            published GDP; the shares here are of the census’s own total. Output is at 1946
            prices, so no price rise can make an industry look bigger. A big share of the jobs
            against a small share of the output is where a poor country keeps its people.
          </>
        )}
        footer={`SURVEYED · MEASURED FOR ${qtrLabel(measured)} · ${release.lag} QUARTER${release.lag === 1 ? '' : 'S'} AGO · REVISABLE`}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[352px_minmax(0,1fr)]">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between font-mono text-[9px] tracking-[0.2em] text-dossier-ink/60">
                <span>THIS CENSUS · {copy.label}</span>
                <span className="tabular-nums">{yearOf(measured)}</span>
              </div>
              <DonutChart
                shares={toShares(readings)}
                format={copy.format}
                emptyNote="NOTHING COUNTED"
              />
              <div className="mt-0.5 text-right font-mono text-[8px] tracking-[0.1em] text-dossier-ink/45">
                <TooltipLabel
                  label="The office’s uncertainty"
                  content="How far the office thinks each industry's figure may be from the truth. Better statistics make this range smaller."
                  className="tracking-[0.1em] text-dossier-ink/45"
                >
                  {copy.unit} · {band(release.errorBand)} EACH ⓘ
                </TooltipLabel>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1">
              <div className="font-mono text-[9px] tracking-[0.2em] text-dossier-ink/60">
                THE MIX, CENSUS BY CENSUS
              </div>
              <StackedAreaChart
                rows={rows}
                keys={toShares(readings)}
                mode="share"
                markTick={measured}
                format={copy.format}
                height={132}
              />
            </div>
          </div>

          {/* The table is the point of the page: the two shares side by side is
              the only place the dual economy is legible as one fact. */}
          <div>
            <SectionHeading aside={growth ? `GROWTH SINCE ${yearOf(rows[0].tick)}` : 'GROWTH: NOT ENOUGH CENSUSES YET'}>
              THE INDUSTRIES
            </SectionHeading>
            {/* the table is seven columns of mono; below `lg` that is wider
                than the sheet, so it scrolls inside its own box rather than
                shearing the subsidy column off the right edge */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] font-mono text-[10px] tabular-nums">
                <thead>
                  <tr className="border-b border-dossier-ink/20 text-left text-[8.5px] tracking-[0.16em] text-dossier-ink/55">
                    <th scope="col" className="py-1 pr-2 font-medium">INDUSTRY</th>
                    <th scope="col" className="py-1 pr-2 text-right font-medium">{copy.label}</th>
                    <th scope="col" className="py-1 pr-2 text-right font-medium">% OUTPUT</th>
                    <th scope="col" className="py-1 pr-2 text-right font-medium">% JOBS</th>
                    <th scope="col" className="py-1 pr-2 text-right font-medium">
                      <TooltipLabel
                        label="Change since the first census"
                        content={`How many percentage points this industry's share of ${copy.label.toLowerCase()} has moved since the first census the office compiled.`}
                        className="tracking-[0.16em]"
                      >
                        SINCE FIRST
                      </TooltipLabel>
                    </th>
                    <th scope="col" className="py-1 pr-2 text-right font-medium">
                      <TooltipLabel
                        label="Growth per year"
                        content="How fast this industry itself has grown each year since the first census. An industry can grow while its share of the economy falls, because the rest grew faster."
                        className="tracking-[0.16em]"
                      >
                        GROWTH /YR
                      </TooltipLabel>
                    </th>
                    <th scope="col" className="py-1 text-right font-medium">
                      <TooltipLabel
                        label="Subsidy"
                        content="What the cabinet pays this industry each quarter. Your own dial, so it is exact — unlike everything else on this page. Set it on the control rail."
                        className="tracking-[0.16em]"
                      >
                        SUBSIDY
                      </TooltipLabel>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r, i) => {
                    const drift = r.sinceFirst
                    return (
                      <tr key={r.key} className="border-b border-dossier-ink/10 last:border-b-0">
                        <th scope="row" className="py-1 pr-2 text-left font-normal">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 shrink-0" style={{ background: r.ink }} aria-hidden="true" />
                            <span className="text-dossier-ink/85">{r.label}</span>
                          </span>
                        </th>
                        <td className="whitespace-nowrap py-1 pr-2 text-right text-dossier-ink">{copy.format(r.value)}</td>
                        <td className="whitespace-nowrap py-1 pr-2 text-right text-dossier-ink/75">{pct(100 * output[i].share)}</td>
                        <td className="whitespace-nowrap py-1 pr-2 text-right text-dossier-ink/75">{pct(100 * jobs[i].share)}</td>
                        <td className={`whitespace-nowrap py-1 pr-2 text-right ${drift >= 0 ? 'text-dossier-ink/75' : 'text-dossier-warn'}`}>
                          {drift >= 0 ? '+' : ''}{drift.toFixed(1)} pts
                        </td>
                        <td className={`whitespace-nowrap py-1 pr-2 text-right ${growth && growth[r.key] < 0 ? 'text-dossier-warn' : 'text-dossier-ink/75'}`}>
                          {growth ? `${growth[r.key] >= 0 ? '+' : ''}${growth[r.key].toFixed(1)}%` : '—'}
                        </td>
                        <td className="whitespace-nowrap py-1 text-right text-dossier-ink/75">
                          {r.subsidy > 0 ? r.subsidy.toFixed(1) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </OverlayLayout>
    </Modal>
  )
}
