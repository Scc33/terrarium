/**
 * The national census — drill-down paperwork, not a home view. Two registers
 * of knowledge sit side by side, and the difference is
 * the whole fog mechanic:
 *   • the head count and the age pyramid are EXACT — census-grade, always
 *     yours, scrubbable across the whole century;
 *   • birth, death and net-migration RATES are fogged — the demographic
 *     transition diagram only draws once you've funded civil registration,
 *     and even then it lags and wobbles like any published series.
 * You can always count how many people there are. Knowing why the number
 * moves is a thing you buy.
 *
 * The growth rate sits on the exact side, and which side it sits on is the
 * decision worth guarding: it is a ratio of two head counts, so giving it a
 * lag and a band would be inventing fog for a figure that has none. The
 * arithmetic is in `../census`; see that module for why it is not an
 * indicator.
 */

import { useState } from 'react'
import { AGE_BANDS, RETIREMENT_BAND, WORKING_BANDS } from '@terrarium/engine'
import type { IndicatorPoint, PublishedState } from '@terrarium/observation'
import {
  ageStructure,
  medianAge,
  populationGrowth,
  residenceRows,
  residenceShares,
  residenceSplit,
} from '../census'
import type { PlotPoint } from '../plot'
import {
  ChartFrame,
  Modal,
  OverlayLayout,
  StackedAreaChart,
  TimeSeriesChart,
  Tooltip,
  TooltipLabel,
} from '../components/ui'

const yearOf = (q: number) => 1946 + Math.floor(q / 4)
const bandLabel = (i: number) => (i === AGE_BANDS - 1 ? '80+' : `${i * 5}–${i * 5 + 4}`)
/** a growth rate reads as a direction first, so the sign is always printed */
const signed = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`

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

// ---- the exact register: the count, and how fast it is moving ----
//
// ONE figure, not two, and the reason is the page's own argument. The
// overlay sets what a state can COUNT beside what it must SURVEY; drawing the
// counted half as two separate frames while the surveyed half is one made the
// layout say something the census does not. A level and its own slope are a
// single subject, they are read together, and they share an x axis with the
// flows above — so they share a caption too. The saving is not incidental:
// a `ChartFrame` caption measures 53px against a strip's 54px of plot, so a
// second frame costs nearly as much in chrome as the figure it adds.
const PW = 470
const PH = 54

function CountAndGrowth({
  census,
  growth,
  xMin,
  xMax,
  markTick,
}: {
  census: PublishedState['census']
  growth: PlotPoint[]
  xMin: number
  xMax: number
  markTick: number
}) {
  const latest = census[census.length - 1]
  const latestGrowth = growth[growth.length - 1]
  const countSummary = `Exact population count from ${yearOf(xMin)} to ${yearOf(xMax)}. Latest count ${latest.population.toFixed(1)} million.`
  const growthSummary = latestGrowth
    ? `Exact year-on-year growth of that count from ${yearOf(growth[0].tick)} to ${yearOf(latestGrowth.tick)}. Latest ${signed(latestGrowth.value)} per cent per year.`
    : 'Year-on-year growth needs a year of census record before it can be measured.'
  // the scrub line and the shared timeline are the same on both plots, so the
  // two read as one figure rather than two that happen to be stacked
  const shared = {
    width: PW,
    xDomain: { x0: xMin, x1: xMax },
    rules: [{ axis: 'x' as const, at: markTick, color: 'var(--color-dossier-brass)', opacity: 0.8 }],
    formatTick: (t: number) => String(yearOf(t)),
    hover: true,
  }

  return (
    <ChartFrame
      title="HEAD COUNT"
      detail="MILLIONS, AND ITS YEAR-ON-YEAR GROWTH · EXACT"
      value={(
        <span className="flex items-baseline gap-2">
          <span>{latest.population.toFixed(1)}M</span>
          {latestGrowth && (
            <span className={latestGrowth.value < 0 ? 'text-dossier-warn' : 'opacity-70'}>
              {signed(latestGrowth.value)}%/YR
            </span>
          )}
        </span>
      )}
      summary={`${countSummary} ${growthSummary}`}
    >
      <TimeSeriesChart
        {...shared}
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
        // the two plots in this frame carry different units, so each axis
        // names its own — the one case the painter's default is meant to yield
        format={(v) => `${v.toFixed(0)}M`}
        formatReading={(v) => `${v.toFixed(1)}M`}
        summary={countSummary}
      />
      <div className="border-t border-dossier-ink/15" />
      <TimeSeriesChart
        {...shared}
        height={PH}
        traces={[{ key: 'growth', points: growth, fillTo: 0, lead: true }]}
        // Measured across the catalogue, growth runs −0.84 to +2.11 %/yr, so
        // zero is INSIDE the range rather than a floor under it: without it on
        // the axis a shrinking country and a stagnant one draw identically.
        include={[0]}
        format={(v) => `${v.toFixed(1)}%`}
        // two decimals in the readout because the whole series spans about
        // three PERCENTAGE points end to end; one would round a decade flat
        formatReading={(v) => `${signed(v)} %/YR`}
        summary={growthSummary}
        // two different reasons, and saying the first one when the second is
        // true contradicts the rate already printed in this frame's caption
        emptyLabel={growth.length === 0 ? 'GROWTH NEEDS A YEAR OF RECORD' : 'GROWTH: ONE READING SO FAR'}
      />
    </ChartFrame>
  )
}

// ---- the transition that moves people, not the one that ages them ----
//
// A stacked band rather than a line, because the question the issue asks is
// about a WHOLE being divided ("what portion lives rurally"), and the band's
// own thickness is the answer at every date. Two categories, not four: the
// register knows where a head sleeps, and only estimates what it does for a
// living.
//
// It sits in the RIGHT column, under the pyramid, and that is a layout
// decision as much as an editorial one. Editorially, the two are the census's
// two questions — how old, and where — and both are read at the year the
// scrubber is parked on, so they carry the same brass mark. Structurally, the
// right column had ~265px of dead space under the pyramid while the left one
// was already a hair taller than the modal: a third `ChartFrame` on the left
// pushed the overlay 188px past the fold at 1280×720, which is where this
// figure was born and where it did not stay. So it follows the column's own
// idiom — a heading row, the figure, a reading — rather than the left
// column's framed one, because a `ChartFrame` caption alone costs 53px.
//
// The width is passed EXPLICITLY. The chart is width-governed by a viewBox,
// so a 560-wide default in a 300-wide column scales the 7.5px axis type down
// to 4px, and an axis nobody can read is an axis that is not there. It must
// MATCH the grid's right track below, which Tailwind requires be spelled out
// as a literal (`lg:grid-cols-[minmax(0,1fr)_300px]`) and so cannot read this.
const RESIDENCE_W = 300
const RESIDENCE_H = 62

function ResidenceBand({
  census,
  markTick,
}: {
  census: PublishedState['census']
  markTick: number
}) {
  const shown = census.find((c) => c.tick === markTick) ?? census[census.length - 1]
  const split = residenceSplit(shown)
  const opening = residenceSplit(census[0])
  const keys = residenceShares(split)
  const pct = (v: number | null) => (v === null ? '—' : `${(100 * v).toFixed(0)}%`)
  const summary =
    split.urbanShare === null
      ? 'Nobody is yet counted into the residence register.'
      : `Where people lived from ${yearOf(census[0].tick)} to ${yearOf(census[census.length - 1].tick)}, as shares of the population under 60. In ${yearOf(shown.tick)}, ${split.urban.toFixed(1)} million lived in towns and cities and ${split.rural.toFixed(1)} million in the countryside — ${pct(split.urbanShare)} urban, against ${pct(opening.urbanShare)} in ${yearOf(census[0].tick)}.`

  return (
    <div className="flex flex-col gap-2 border-t border-dossier-ink/20 pt-2">
      {/* The type size lives on the ROW, not on the label. `index.css` sets
          `button, input { font: inherit }` UNLAYERED, and an unlayered rule
          beats every `@layer` — so a `text-[9px]` on a `TooltipLabel` (which
          renders a button) is in the DOM, in the stylesheet, and inert. This
          heading shipped at 14px next to the pyramid's 9px because of it. */}
      <div className="flex items-baseline justify-between font-mono text-[9px] font-medium tracking-[0.25em] text-dossier-ink/60">
        <TooltipLabel
          label="Where people live"
          content="The share of the people the register places — everyone under 60 — living in towns and cities rather than on the land. Counted, not surveyed, so it never lags or revises. What those people do for a living is a survey question, and it lives in the industrial census."
        >
          WHERE THEY LIVE
        </TooltipLabel>
        <span className="font-mono text-sm font-semibold tabular-nums text-dossier-ink">
          {pct(split.urbanShare)} URBAN
        </span>
      </div>
      <StackedAreaChart
        rows={residenceRows(census)}
        keys={keys}
        mode="share"
        width={RESIDENCE_W}
        height={RESIDENCE_H}
        // the same year the pyramid above it is scrubbed to: the two halves of
        // the census — how old people are and where they are — are read
        // against each other or not at all
        markTick={markTick}
        summary={summary}
      />
      <div className="flex justify-between font-mono text-[8px] tabular-nums text-dossier-ink/70">
        {keys.map((key) => (
          <span key={key.key} className="flex items-center gap-1">
            <span className="block h-1.5 w-1.5 shrink-0" style={{ backgroundColor: key.ink }} aria-hidden="true" />
            {key.label} {key.value.toFixed(1)}M
          </span>
        ))}
      </div>
    </div>
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
  // before the first quarter is filed the register is empty; the live desk
  // carries the same three facts, so the fallback is a reading rather than a
  // placeholder — including the split, which `pub.population` publishes on the
  // same base the record does
  const shown = census[idx] ?? {
    tick: pub.tick,
    population: pub.population.total,
    pyramid: pub.population.pyramid,
    residence: pub.population.residence,
  }

  const birth = settled(pub.indicators.birth_rate?.points ?? [])
  const death = settled(pub.indicators.death_rate?.points ?? [])
  const migration = settled(pub.indicators.net_migration?.points ?? [])
  const xMin = census[0]?.tick ?? 0
  const xMax = census[census.length - 1]?.tick ?? pub.tick

  const p = shown.pyramid
  const { children, working, retired, support } = ageStructure(p)
  const median = medianAge(p)
  const hasHistory = census.length >= 2
  // the exact half of the story, computed from the exact register
  const growth = populationGrowth(census)
  const latestGrowth = growth[growth.length - 1]?.value
  // the split as it stands now — the chart below tells the century, this
  // answers "how urban is my country" without reading a chart at all
  const urbanNow = residenceSplit(pub.population)

  return (
    <Modal title="THE NATIONAL CENSUS" onClose={onClose} size="wide">
      <OverlayLayout
        summary={(
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-2xl font-semibold tabular-nums text-dossier-ink">{pub.population.total.toFixed(1)}M</span>
              {latestGrowth !== undefined && (
                <TooltipLabel
                  label="Population growth"
                  content="How much the head count has changed over the last four quarters, as a percentage per year. Counted, not surveyed — so unlike the birth and death rates it never lags or revises."
                  className={`font-mono text-[11px] font-semibold tabular-nums tracking-[0.1em] ${latestGrowth < 0 ? 'text-dossier-warn' : 'text-dossier-ink/75'}`}
                >
                  {signed(latestGrowth)}%/YR
                </TooltipLabel>
              )}
              {urbanNow.urbanShare !== null && (
                <TooltipLabel
                  label="Urban share"
                  content="Of the people the register places — everyone under 60 — the share living in towns and cities rather than on the land. Counted, not surveyed. Older people are counted by age alone: the register gives them no address, and splitting them at the working-age rate would understate how rural the country was when they were young."
                  className="font-mono text-[11px] font-semibold tabular-nums tracking-[0.1em] text-dossier-ink/75"
                >
                  {(100 * urbanNow.urbanShare).toFixed(0)}% URBAN
                </TooltipLabel>
              )}
            </span>
            <span className="font-mono text-[10px] tracking-[0.15em] text-dossier-ink/60">LABOUR FORCE {pub.population.laborForce.toFixed(1)}M · {yearOf(pub.tick)}</span>
          </div>
        )}
        note="Heads are counted, so the count, its growth rate and the rural/urban split never lag or revise. The three flows behind that growth — births, minus deaths, plus net migration — are surveyed, so they do. Net migration is arrivals minus departures: positive means more people arrived. The split covers everyone under 60, the ages the register places."
        footer="HEADS ARE COUNTABLE · THE RATES BEHIND THEM ARE NOT"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* left: the story over time */}
        <div className="flex flex-col gap-3">
          {hasHistory ? (
            <>
              <TransitionChart birth={birth} death={death} migration={migration} xMin={xMin} xMax={xMax} markTick={shown.tick} />
              <CountAndGrowth census={census} growth={growth} xMin={xMin} xMax={xMax} markTick={shown.tick} />
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
            <TooltipLabel label="Median age" content="Half the country is younger than this and half is older. Counted from the pyramid, so it is exact — and it is the demographic transition in one number: it falls while a birth surge arrives, then climbs for the rest of the century.">
              MED {median === null ? '—' : median.toFixed(0)}
            </TooltipLabel>
          </div>
          {hasHistory && <ResidenceBand census={census} markTick={shown.tick} />}
        </div>
        </div>
      </OverlayLayout>
    </Modal>
  )
}
