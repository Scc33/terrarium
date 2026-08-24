/**
 * The Household Office — the distribution behind the poverty headline.
 *
 * The wall answers the quick question with one poverty-rate instrument. This
 * page answers the next one: who has the country's household income, and did
 * each fifth actually get richer? The arithmetic lives in `../households`;
 * this component only paints the published survey.
 */

import { useState } from 'react'
import { HOUSEHOLD_SURVEY_FUNDED_AT } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import {
  ChartFrame,
  DonutChart,
  EmptyState,
  Metric,
  Modal,
  OverlayLayout,
  SectionHeading,
  SegmentedControl,
  StackedAreaChart,
  TimeSeriesChart,
  TooltipLabel,
} from '../components/ui'
import {
  householdAvailability,
  householdIncomeTraces,
  householdShareRows,
  householdShares,
  latestIndicator,
  readHouseholds,
} from '../households'

type HouseholdLens = 'income' | 'share'

const yearOf = (q: number) => 1946 + Math.floor(q / 4)
const qtrLabel = (q: number) => `${yearOf(q)} Q${(q % 4) + 1}`
const pct = (value: number) => `${value.toFixed(1)}%`
const index = (value: number) => value.toFixed(value >= 100 ? 0 : 1)

export function HouseholdOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const [lens, setLens] = useState<HouseholdLens>('income')
  const release = readHouseholds(pub)

  if (!release) {
    const commissioned = householdAvailability(pub) === 'awaiting'
    return (
      <Modal title="THE HOUSEHOLD OFFICE — INCOME AND POVERTY" onClose={onClose} size="wide">
        {commissioned ? (
          <EmptyState title="THE HOUSEHOLD BOOKS ARE BEING COLLECTED">
            The household survey has been commissioned and the first returns are still coming
            in. The office reports behind the country it measures; nothing more needs funding.
          </EmptyState>
        ) : (
          <EmptyState title="THE MINISTRY KNOWS THE TOTAL, NOT WHO RECEIVES IT" requirement="HOUSEHOLD SURVEY">
            Raise the statistics office from {(100 * pub.capacity.statistical).toFixed(0)} to{' '}
            {(100 * HOUSEHOLD_SURVEY_FUNDED_AT).toFixed(0)} and enumerators can sort household
            incomes into fifths. Until then the poverty rate, the gap and the distribution are
            not measured.
          </EmptyState>
        )}
      </Modal>
    )
  }

  const povertyRate = latestIndicator(pub, 'poverty_rate')
  const gini = latestIndicator(pub, 'gini')
  const meanIncome = latestIndicator(pub, 'income_real')
  const shares = householdShares(release.quintiles)
  const rows = householdShareRows(pub)
  const incomeTraces = householdIncomeTraces(pub)
  const bottom = release.quintiles[0]

  return (
    <Modal title="THE HOUSEHOLD OFFICE — INCOME AND POVERTY" onClose={onClose} size="wide">
      <OverlayLayout
        summary={(
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <Metric
              label="POVERTY RATE"
              value={povertyRate === null ? '—' : pct(povertyRate)}
              detail="PEOPLE BELOW THE FIXED LINE"
              title="The share of people whose real disposable income cannot buy one standard 1946 basket each quarter."
            />
            <Metric
              label="POVERTY GAP"
              value={pct(100 * release.povertyGap)}
              detail={`OF THE LINE · ±${(100 * release.povertyGapErrorBand).toFixed(1)} PTS`}
              title="The average shortfall from the poverty line across the whole population; people above the line count as zero. It can improve before a whole model group crosses the line."
            />
            <Metric
              label="BOTTOM FIFTH"
              value={pct(100 * bottom.incomeShare)}
              detail="OF ALL HOUSEHOLD INCOME"
              title="The share of all real disposable household income received by the lowest-income twenty percent of people."
            />
            <Metric
              label="INEQUALITY / MEAN"
              value={`${gini === null ? '—' : gini.toFixed(1)} / ${meanIncome === null ? '—' : index(meanIncome)}`}
              detail="GINI PTS / 1946=100"
              title="The grouped Gini and national mean real household income. The first says how uneven the distribution is; the second says how high it is."
            />
          </div>
        )}
        toolbar={(
          <SegmentedControl
            label="Household table"
            value={lens}
            onChange={setLens}
            options={[
              { value: 'income', label: 'REAL INCOME', title: 'Follow real disposable income for every fifth of the population.' },
              { value: 'share', label: 'INCOME SHARE', title: 'See how the whole household-income pool is divided between the five fifths.' },
            ]}
          />
        )}
        note={(
          <>
            These are five equal groups of people, not the game’s five named social classes. The
            office ranks the classes by real disposable income and splits their population at
            each twenty-percent boundary. It assumes no hidden rich or poor households inside a
            class, so the poverty rate can move in steps; the poverty gap records progress between
            those crossings.
          </>
        )}
        footer={`HOUSEHOLD SURVEY · MEASURED FOR ${qtrLabel(release.forQtr)} · ${release.lag} QUARTER${release.lag === 1 ? '' : 'S'} AGO · REVISABLE`}
      >
        <div className="flex flex-col gap-4">
          {lens === 'income' ? (
            <ChartFrame
              title="REAL DISPOSABLE INCOME BY FIFTH"
              detail={`NATIONAL 1946 MEAN = 100 · EACH ESTIMATE ±${(100 * release.incomeErrorBand).toFixed(1)}%`}
              legend={incomeTraces.map((trace) => ({ label: trace.label, color: trace.ink }))}
              summary="Real disposable household income for each equal fifth of the population, with the fixed poverty line marked."
              bodyClassName="p-2"
            >
              <TimeSeriesChart
                traces={incomeTraces.map((trace, i) => ({
                  key: trace.key,
                  points: trace.points,
                  color: trace.ink,
                  width: i === 0 || i === incomeTraces.length - 1 ? 1.8 : 1.2,
                  lead: i === 0,
                }))}
                include={[release.povertyLine, 100]}
                rules={[
                  { axis: 'y', at: release.povertyLine, label: 'POVERTY LINE', color: 'var(--color-dossier-warn)' },
                  { axis: 'y', at: 100, label: '1946 MEAN', dashed: true, opacity: 0.55 },
                  { axis: 'x', at: release.forQtr, label: 'THIS SURVEY', dashed: true, opacity: 0.55 },
                ]}
                height={174}
                format={index}
                formatReading={index}
                formatTick={(tick) => String(yearOf(tick))}
                summary="Five lines show real income for the lowest through highest population fifths. A horizontal rule marks the fixed poverty line."
                hover
              />
            </ChartFrame>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[350px_minmax(0,1fr)]">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between font-mono text-[9px] tracking-[0.2em] text-dossier-ink/60">
                  <span>THIS SURVEY · SHARE OF INCOME</span>
                  <span className="tabular-nums">{yearOf(release.forQtr)}</span>
                </div>
                <DonutChart shares={shares} format={(value) => pct(100 * value)} emptyNote="NO HOUSEHOLD INCOME" />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <div className="font-mono text-[9px] tracking-[0.2em] text-dossier-ink/60">
                  THE DISTRIBUTION, SURVEY BY SURVEY
                </div>
                <StackedAreaChart
                  rows={rows}
                  keys={shares}
                  mode="share"
                  markTick={release.forQtr}
                  height={150}
                  format={(value) => pct(100 * value)}
                />
              </div>
            </div>
          )}

          <div>
            <SectionHeading aside="EACH ROW IS 20% OF THE POPULATION">THE FIVE FIFTHS</SectionHeading>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] font-mono text-[10px] tabular-nums">
                <thead>
                  <tr className="border-b border-dossier-ink/20 text-left text-[8.5px] tracking-[0.16em] text-dossier-ink/55">
                    <th scope="col" className="py-1 pr-2 font-medium">POPULATION RANK</th>
                    <th scope="col" className="py-1 pr-2 text-right font-medium">
                      <TooltipLabel label="Real income index" content="Mean disposable income per person after effective personal income tax and price rises. The whole country's 1946 mean is 100." className="tracking-[0.16em]">
                        REAL INCOME
                      </TooltipLabel>
                    </th>
                    <th scope="col" className="py-1 pr-2 text-right font-medium">VS POVERTY LINE</th>
                    <th scope="col" className="py-1 pr-2 text-right font-medium">INCOME SHARE</th>
                    <th scope="col" className="py-1 text-right font-medium">SINCE FIRST</th>
                  </tr>
                </thead>
                <tbody>
                  {release.quintiles.map((reading) => {
                    const againstLine = reading.incomeReal - release.povertyLine
                    return (
                      <tr key={reading.key} className="border-b border-dossier-ink/10 last:border-b-0">
                        <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 shrink-0" style={{ background: reading.ink }} aria-hidden="true" />
                            <span className="text-dossier-ink/85">{reading.label}</span>
                          </span>
                        </th>
                        <td className="py-1.5 pr-2 text-right text-dossier-ink">{index(reading.incomeReal)}</td>
                        <td className={`py-1.5 pr-2 text-right ${againstLine < 0 ? 'text-dossier-warn' : 'text-dossier-ink/75'}`}>
                          {againstLine >= 0 ? '+' : ''}{index(againstLine)}
                        </td>
                        <td className="py-1.5 pr-2 text-right text-dossier-ink/75">{pct(100 * reading.incomeShare)}</td>
                        <td className={`py-1.5 text-right ${reading.sinceFirst < 0 ? 'text-dossier-warn' : 'text-dossier-ink/75'}`}>
                          {reading.sinceFirst >= 0 ? '+' : ''}{reading.sinceFirst.toFixed(1)} pts
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
