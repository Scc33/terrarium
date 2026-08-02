/**
 * The national census — drill-down paperwork, not a home view (design doc
 * §3.2). Two registers of knowledge sit side by side, and the difference is
 * the whole fog mechanic:
 *   • the head count and the age pyramid are EXACT — census-grade, always
 *     yours, scrubbable across the whole century;
 *   • the birth and death RATES are fogged — the demographic transition
 *     diagram only draws once you've funded civil registration, and even
 *     then it lags and wobbles like any published series.
 * You can always count how many people there are. Knowing why the number
 * moves is a thing you buy.
 */

import { useState } from 'react'
import { AGE_BANDS, RETIREMENT_BAND, WORKING_BANDS } from '@terrarium/engine'
import type { IndicatorPoint, PublishedState } from '@terrarium/observation'
import { Modal } from '../components/ui'

const yearOf = (q: number) => 1946 + Math.floor(q / 4)
const bandLabel = (i: number) => (i === AGE_BANDS - 1 ? '80+' : `${i * 5}–${i * 5 + 4}`)

/** latest revision per measured quarter, oldest first — the office's best
 * current word on each period */
function settled(points: IndicatorPoint[]): Array<{ q: number; value: number }> {
  const best = new Map<number, { value: number; revision: number }>()
  for (const p of points) {
    const cur = best.get(p.forQtr)
    if (!cur || p.revision > cur.revision) best.set(p.forQtr, { value: p.value, revision: p.revision })
  }
  return [...best.entries()]
    .map(([q, v]) => ({ q, value: v.value }))
    .sort((a, b) => a.q - b.q)
}

// ---- the transition diagram: birth & death rates over time (fogged) ----
const RW = 470
const RH = 150
const PL = 26
const PR = 8
const PT = 10
const PB = 16

function TransitionChart({
  birth,
  death,
  xMin,
  xMax,
  markTick,
}: {
  birth: Array<{ q: number; value: number }>
  death: Array<{ q: number; value: number }>
  xMin: number
  xMax: number
  markTick: number
}) {
  const funded = birth.length >= 2 || death.length >= 2
  const yMax = Math.max(45, ...birth.map((p) => p.value), ...death.map((p) => p.value)) * 1.05
  const sx = (q: number) => PL + ((q - xMin) / Math.max(xMax - xMin, 1)) * (RW - PL - PR)
  const sy = (v: number) => PT + ((yMax - v) / yMax) * (RH - PT - PB)
  const path = (s: Array<{ q: number; value: number }>) =>
    s.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.q).toFixed(1)},${sy(p.value).toFixed(1)}`).join(' ')

  // natural-increase wedge: birth on top, back along death (shared quarters)
  const deathAt = new Map(death.map((p) => [p.q, p.value]))
  const overlap = birth.filter((p) => deathAt.has(p.q))
  const wedge =
    overlap.length >= 2
      ? path(overlap) +
        ' ' +
        [...overlap]
          .reverse()
          .map((p) => `L${sx(p.q).toFixed(1)},${sy(deathAt.get(p.q)!).toFixed(1)}`)
          .join(' ') +
        'Z'
      : null

  return (
    <div className="border border-dossier-ink/25 bg-dossier-paper">
      <div className="flex items-center justify-between border-b border-dossier-ink/20 px-2 py-1">
        <span className="font-mono text-[9px] font-medium tracking-[0.25em] text-dossier-ink/70">
          THE VITAL RATES · PER 1000 / YR
        </span>
        {funded && (
          <span className="flex items-center gap-2 font-mono text-[8px] tracking-[0.1em]">
            <span className="text-dossier-felt">● BIRTHS</span>
            <span className="text-dossier-warn">● DEATHS</span>
          </span>
        )}
      </div>
      {funded ? (
        <svg viewBox={`0 0 ${RW} ${RH}`} className="block w-full">
          {/* frame + gridlines every 10 */}
          {[0, 10, 20, 30, 40].map((v) =>
            v <= yMax ? (
              <g key={v}>
                <line x1={PL} x2={RW - PR} y1={sy(v)} y2={sy(v)} stroke="var(--color-dossier-ink)" strokeWidth="0.4" opacity="0.15" />
                <text x={PL - 3} y={sy(v) + 3} textAnchor="end" fontSize="7" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.6">
                  {v}
                </text>
              </g>
            ) : null,
          )}
          {/* the year the pyramid is scrubbed to */}
          <line x1={sx(markTick)} x2={sx(markTick)} y1={PT} y2={RH - PB} stroke="var(--color-dossier-brass)" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
          {wedge && <path d={wedge} fill="var(--color-dossier-felt)" opacity="0.12" />}
          {death.length >= 2 && <path d={path(death)} fill="none" stroke="var(--color-dossier-warn)" strokeWidth="1.4" />}
          {birth.length >= 2 && <path d={path(birth)} fill="none" stroke="var(--color-dossier-felt)" strokeWidth="1.4" />}
          {/* x labels */}
          <text x={PL} y={RH - 4} fontSize="7" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.6">
            {yearOf(xMin)}
          </text>
          <text x={RW - PR} y={RH - 4} textAnchor="end" fontSize="7" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.6">
            {yearOf(xMax)}
          </text>
        </svg>
      ) : (
        <div className="flex h-[150px] flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#c2a06b] to-dossier-brass">
          <div className="font-mono text-[10px] font-medium tracking-[0.2em] text-dossier-ink">
            NO REGISTER KEPT
          </div>
          <div className="font-mono text-[9px] tracking-[0.15em] text-dossier-ink/70">
            REQUIRES: CIVIL REGISTRATION
          </div>
          <div className="mt-1 max-w-[300px] text-center font-dossier text-[11px] italic leading-snug text-dossier-ink/70">
            You can count the living. To know how fast they are born and how
            soon they die, fund the registrar.
          </div>
        </div>
      )}
    </div>
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
  const popMax = Math.max(...census.map((c) => c.population)) * 1.05
  const sx = (q: number) => 2 + ((q - xMin) / Math.max(xMax - xMin, 1)) * (PW - 4)
  const sy = (v: number) => 4 + ((popMax - v) / popMax) * (PH - 8)
  const line = census.map((c, i) => `${i === 0 ? 'M' : 'L'}${sx(c.tick).toFixed(1)},${sy(c.population).toFixed(1)}`).join(' ')
  const area = `${line} L${sx(census[census.length - 1].tick).toFixed(1)},${PH} L${sx(census[0].tick).toFixed(1)},${PH} Z`
  return (
    <div className="border border-dossier-ink/25 bg-dossier-paper">
      <div className="border-b border-dossier-ink/20 px-2 py-1 font-mono text-[9px] font-medium tracking-[0.25em] text-dossier-ink/70">
        HEAD COUNT · MILLIONS · EXACT
      </div>
      <svg viewBox={`0 0 ${PW} ${PH}`} className="block w-full">
        <path d={area} fill="var(--color-dossier-ink)" opacity="0.08" />
        <path d={line} fill="none" stroke="var(--color-dossier-ink)" strokeWidth="1.4" />
        <line x1={sx(markTick)} x2={sx(markTick)} y1={2} y2={PH - 2} stroke="var(--color-dossier-brass)" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
      </svg>
    </div>
  )
}

// ---- the pyramid at a scrubbed year, with a faint 1946 ghost ----
function Pyramid({ pyramid, ghost }: { pyramid: number[]; ghost: number[] }) {
  const selMax = Math.max(...pyramid, 1e-9)
  const baseMax = Math.max(...ghost, 1e-9)
  return (
    <div className="flex flex-col-reverse gap-[2px]" title="Persons (millions) per five-year age band. The faint outline is the 1946 shape at its own scale — watch the base narrow into a column.">
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
  )
}

export function CensusOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const census = pub.census
  const [sel, setSel] = useState(census.length - 1)
  const idx = Math.min(sel, census.length - 1)
  const shown = census[idx] ?? { tick: pub.tick, population: pub.population.total, pyramid: pub.population.pyramid }

  const birth = settled(pub.indicators.birth_rate?.points ?? [])
  const death = settled(pub.indicators.death_rate?.points ?? [])
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* left: the story over time */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-semibold tabular-nums text-dossier-ink">
              {pub.population.total.toFixed(1)}M
            </span>
            <span className="font-mono text-[10px] tracking-[0.15em] text-dossier-ink/60">
              LABOUR FORCE {pub.population.laborForce.toFixed(1)}M · {yearOf(pub.tick)}
            </span>
          </div>
          {hasHistory ? (
            <>
              <TransitionChart birth={birth} death={death} xMin={xMin} xMax={xMax} markTick={shown.tick} />
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
            <input
              type="range"
              min={0}
              max={census.length - 1}
              value={idx}
              onChange={(e) => setSel(Number(e.target.value))}
              className="mt-1 w-full accent-dossier-brass"
              title="Scrub through the century — watch the pyramid become a column."
            />
          )}
          <div className="flex justify-between border-t border-dossier-ink/20 pt-2 font-mono text-[9px] tabular-nums text-dossier-ink/80">
            <span title="Under 15.">Y {((100 * children) / shown.population).toFixed(0)}%</span>
            <span title="Ages 15–59.">W {((100 * working) / shown.population).toFixed(0)}%</span>
            <span title="60 and over — the pension rolls.">A {((100 * retired) / shown.population).toFixed(0)}%</span>
            <span title="Workers per pensioner. It only falls once the transition ends.">
              {Number.isFinite(support) ? support.toFixed(1) : '—'}:1
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center font-mono text-[9px] tracking-[0.2em] text-dossier-ink/50">
        HEADS ARE COUNTABLE. THE RATES BEHIND THEM ARE NOT.
      </p>
    </Modal>
  )
}
