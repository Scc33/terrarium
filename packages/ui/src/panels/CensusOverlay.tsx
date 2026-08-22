/**
 * The national census — drill-down paperwork, not a home view (design doc
 * §3.2). Two registers of knowledge sit side by side, and the difference is
 * the whole fog mechanic:
 *   • the head count and the age pyramid are EXACT — census-grade, always
 *     yours, scrubbable across the whole century;
 *   • birth, death and net-migration RATES are fogged — the demographic
 *     transition diagram only draws once you've funded civil registration,
 *     and even then it lags and wobbles like any published series.
 * You can always count how many people there are. Knowing why the number
 * moves is a thing you buy.
 */

import { useState } from 'react'
import { AGE_BANDS, RETIREMENT_BAND, WORKING_BANDS } from '@terrarium/engine'
import type { IndicatorPoint, PublishedState } from '@terrarium/observation'
import { ChartFrame, Modal, OverlayLayout, TimeSeriesChart, Tooltip, TooltipLabel } from '../components/ui'

const yearOf = (q: number) => 1946 + Math.floor(q / 4)
const bandLabel = (i: number) => (i === AGE_BANDS - 1 ? '80+' : `${i * 5}–${i * 5 + 4}`)

/** latest revision per measured quarter, oldest first — the office's best
 * current word on each period */
function settled(points: IndicatorPoint[]): Array<{ tick: number; value: number }> {
  const best = new Map<number, { value: number; revision: number }>()
  for (const p of points) {
    const cur = best.get(p.forQtr)
    if (!cur || p.revision > cur.revision) best.set(p.forQtr, { value: p.value, revision: p.revision })
  }
  return [...best.entries()]
    .map(([tick, v]) => ({ tick, value: v.value }))
    .sort((a, b) => a.tick - b.tick)
}

// ---- the transition diagram: population-change rates over time (fogged) ----
const RW = 470
const RH = 150

function TransitionChart({
  birth,
  death,
  migration,
  xMin,
  xMax,
  markTick,
}: {
  birth: Array<{ tick: number; value: number }>
  death: Array<{ tick: number; value: number }>
  migration: Array<{ tick: number; value: number }>
  xMin: number
  xMax: number
  markTick: number
}) {
  const funded = birth.length >= 2 || death.length >= 2 || migration.length >= 2
  const latestBirth = birth[birth.length - 1]?.value
  const latestDeath = death[death.length - 1]?.value
  const latestMigration = migration[migration.length - 1]?.value
  const summary = funded
    ? `Population-change rates from ${yearOf(xMin)} to ${yearOf(xMax)}. Latest published birth rate ${latestBirth?.toFixed(1) ?? 'unavailable'}, death rate ${latestDeath?.toFixed(1) ?? 'unavailable'}, and net migration ${latestMigration?.toFixed(1) ?? 'unavailable'} per thousand per year.`
    : 'Birth, death and net-migration rates are unavailable because civil registration is not funded.'

  return (
    <ChartFrame
      title="THE POPULATION FLOWS"
      detail="PER 1,000 / YEAR · PUBLISHED ESTIMATES"
      summary={summary}
      legend={funded ? [
        { label: 'BIRTHS', color: 'var(--color-dossier-felt)' },
        { label: 'DEATHS', color: 'var(--color-dossier-warn)' },
        { label: 'NET MIGRATION', color: 'var(--color-dossier-ink)', dashed: true },
      ] : []}
    >
      {funded ? (
        <TimeSeriesChart
          width={RW}
          height={RH}
          traces={[
            { key: 'death', points: death, color: 'var(--color-dossier-warn)' },
            { key: 'birth', points: birth, color: 'var(--color-dossier-felt)' },
            { key: 'migration', points: migration, color: 'var(--color-dossier-ink)', dashed: true, lead: true },
          ]}
          // the natural-increase wedge: how far births ran ahead of deaths,
          // which is the whole transition in one shaded region
          wedge={{ over: 'birth', under: 'death', color: 'var(--color-dossier-felt)' }}
          // a rate per thousand is read against zero, and the face keeps a
          // decade of quiet rates from filling the box
          include={[0, 45]}
          rules={[
            // the year the pyramid beside this is scrubbed to
            { axis: 'x', at: markTick, color: 'var(--color-dossier-brass)', opacity: 0.8 },
          ]}
          // the two share a timeline with the head count below, so the axis is
          // pinned rather than taken from whichever register published longer
          xDomain={{ x0: xMin, x1: xMax }}
          formatTick={(t) => String(yearOf(t))}
          formatReading={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} NET MIGRATION/1,000`}
          summary={summary}
          hover
        />
      ) : (
        <div className="flex h-[150px] flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#c2a06b] to-dossier-brass">
          <div className="font-mono text-[10px] font-medium tracking-[0.2em] text-dossier-ink">
            NO REGISTER KEPT
          </div>
          <div className="font-mono text-[9px] tracking-[0.15em] text-dossier-ink/70">
            REQUIRES: CIVIL REGISTRATION
          </div>
          <div className="mt-1 max-w-[300px] text-center font-dossier text-[11px] italic leading-snug text-dossier-ink/70">
            You can count the living. To know how births, deaths and migration
            changed the count, fund the registrar.
          </div>
        </div>
      )}
    </ChartFrame>
  )
}

// ---- the exact population strip, sharing the X axis ----
const PW = 470
const PH = 54

function PopulationStrip({
  census,
  xMin,
  xMax,
  markTick,
}: {
  census: PublishedState['census']
  xMin: number
  xMax: number
  markTick: number
}) {
  const latest = census[census.length - 1]
  const summary = `Exact population count from ${yearOf(xMin)} to ${yearOf(xMax)}. Latest count ${latest.population.toFixed(1)} million.`
  return (
    <ChartFrame
      title="HEAD COUNT"
      detail="MILLIONS · EXACT"
      value={`${latest.population.toFixed(1)}M`}
      summary={summary}
    >
      <TimeSeriesChart
        width={PW}
        height={PH}
        traces={[
          {
            key: 'population',
            points: census.map((c) => ({ tick: c.tick, value: c.population })),
            fillTo: 0,
            lead: true,
          },
        ]}
        // a head count is read against zero, and shares the vital rates' axis
        // above it so the two figures line up quarter for quarter
        include={[0]}
        xDomain={{ x0: xMin, x1: xMax }}
        rules={[{ axis: 'x', at: markTick, color: 'var(--color-dossier-brass)', opacity: 0.8 }]}
        formatTick={(t) => String(yearOf(t))}
        formatReading={(v) => `${v.toFixed(1)}M`}
        summary={summary}
        hover
      />
    </ChartFrame>
  )
}

// ---- the pyramid at a scrubbed year, with a faint 1946 ghost ----
function Pyramid({ pyramid, ghost }: { pyramid: number[]; ghost: number[] }) {
  const selMax = Math.max(...pyramid, 1e-9)
  const baseMax = Math.max(...ghost, 1e-9)
  return (
    <Tooltip content="People in each five-year age group, in millions. The faint outline shows the country’s 1946 shape for comparison.">
      <div tabIndex={0} className="flex flex-col-reverse gap-[2px] focus-visible:outline-2 focus-visible:outline-dossier-brass">
        {pyramid.map((n, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-10 shrink-0 text-right font-mono text-[8px] tabular-nums text-dossier-ink/60">
              {bandLabel(i)}
            </span>
            <div className="relative h-[11px] flex-1 border-l border-dossier-ink/30">
              {/* 1946 ghost, normalized to its own peak — a shape to compare against */}
              <div
                className="absolute inset-y-0 left-0 border-r border-dossier-ink/40 bg-dossier-ink/5"
                style={{ width: `${(100 * ghost[i]) / baseMax}%` }}
              />
              <div
                className={
                  i >= RETIREMENT_BAND
                    ? 'relative h-full bg-dossier-warn/70'
                    : i >= WORKING_BANDS[0]
                      ? 'relative h-full bg-dossier-brass'
                      : 'relative h-full bg-dossier-felt/60'
                }
                style={{ width: `${(100 * n) / selMax}%` }}
              />
            </div>
            <span className="w-8 shrink-0 font-mono text-[8px] tabular-nums text-dossier-ink/70">
              {n.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </Tooltip>
  )
}

export function CensusOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const census = pub.census
  const [sel, setSel] = useState(census.length - 1)
  const idx = Math.min(sel, census.length - 1)
  const shown = census[idx] ?? { tick: pub.tick, population: pub.population.total, pyramid: pub.population.pyramid }

  const birth = settled(pub.indicators.birth_rate?.points ?? [])
  const death = settled(pub.indicators.death_rate?.points ?? [])
  const migration = settled(pub.indicators.net_migration?.points ?? [])
  const xMin = census[0]?.tick ?? 0
  const xMax = census[census.length - 1]?.tick ?? pub.tick

  const p = shown.pyramid
  const sum = (from: number, to: number) => p.slice(from, to + 1).reduce((a, b) => a + b, 0)
  const children = sum(0, WORKING_BANDS[0] - 1)
  const working = sum(WORKING_BANDS[0], WORKING_BANDS[1])
  const retired = sum(RETIREMENT_BAND, AGE_BANDS - 1)
  const support = retired > 1e-9 ? working / retired : Infinity
  const hasHistory = census.length >= 2

  return (
    <Modal title="THE NATIONAL CENSUS" onClose={onClose} size="wide">
      <OverlayLayout
        summary={(
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-dossier-ink">{pub.population.total.toFixed(1)}M</span>
            <span className="font-mono text-[10px] tracking-[0.15em] text-dossier-ink/60">LABOUR FORCE {pub.population.laborForce.toFixed(1)}M · {yearOf(pub.tick)}</span>
          </div>
        )}
        note="The census counts heads exactly. Births, deaths and net migration are published estimates, so they can lag and revise. Net migration is arrivals minus departures: positive means more people arrived; negative means more left. Scrub the age pyramid to see the population structure that today’s headline total conceals."
        footer="HEADS ARE COUNTABLE · THE RATES BEHIND THEM ARE NOT"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* left: the story over time */}
        <div className="flex flex-col gap-3">
          {hasHistory ? (
            <>
              <TransitionChart birth={birth} death={death} migration={migration} xMin={xMin} xMax={xMax} markTick={shown.tick} />
              <PopulationStrip census={census} xMin={xMin} xMax={xMax} markTick={shown.tick} />
            </>
          ) : (
            <div className="border border-dossier-ink/25 p-6 text-center font-mono text-[10px] tracking-[0.2em] text-dossier-ink/50">
              THE RECORD IS ONE QUARTER OLD. COME BACK IN A FEW YEARS.
            </div>
          )}
        </div>

        {/* right: the shape, scrubbable */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[9px] font-medium tracking-[0.25em] text-dossier-ink/60">
              AGE PYRAMID
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-dossier-ink">
              {yearOf(shown.tick)}
            </span>
          </div>
          <Pyramid pyramid={p} ghost={census[0]?.pyramid ?? p} />
          {hasHistory && (
            <Tooltip content="Move through time to see how the country’s age shape changed.">
              <input
                type="range"
                min={0}
                max={census.length - 1}
                value={idx}
                onChange={(e) => setSel(Number(e.target.value))}
                className="mt-1 w-full accent-dossier-brass"
                aria-label="Choose a census year"
              />
            </Tooltip>
          )}
          <div className="flex justify-between border-t border-dossier-ink/20 pt-2 font-mono text-[9px] tabular-nums text-dossier-ink/80">
            <TooltipLabel label="Young population" content="People under 15 as a share of the population.">Y {((100 * children) / shown.population).toFixed(0)}%</TooltipLabel>
            <TooltipLabel label="Working-age population" content="People aged 15 to 59 as a share of the population.">W {((100 * working) / shown.population).toFixed(0)}%</TooltipLabel>
            <TooltipLabel label="Older population" content="People aged 60 and over as a share of the population.">A {((100 * retired) / shown.population).toFixed(0)}%</TooltipLabel>
            <TooltipLabel label="Workers per pensioner" content="Working-age people for every older person. Lower numbers make pensions harder to support.">
              {Number.isFinite(support) ? support.toFixed(1) : '—'}:1
            </TooltipLabel>
          </div>
        </div>
        </div>
      </OverlayLayout>
    </Modal>
  )
}
