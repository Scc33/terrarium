/**
 * The national census — drill-down paperwork, not a home view (design doc
 * §3.2). The pyramid is the one exact instrument the state has always
 * owned: heads are countable without a statistics office. Everything else
 * about the population (fertility, mortality, where it is all heading) is
 * left for the reader to infer from the shape — the fog rules hold.
 */

import { AGE_BANDS, RETIREMENT_BAND, WORKING_BANDS } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { Overlay } from '../components/Overlay'

const bandLabel = (i: number) => (i === AGE_BANDS - 1 ? '80+' : `${i * 5}–${i * 5 + 4}`)

export function CensusOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const p = pub.population.pyramid
  const total = pub.population.total
  const max = Math.max(...p, 1e-9)
  const sum = (from: number, to: number) => p.slice(from, to + 1).reduce((a, b) => a + b, 0)
  const children = sum(0, WORKING_BANDS[0] - 1)
  const working = sum(WORKING_BANDS[0], WORKING_BANDS[1])
  const retired = sum(RETIREMENT_BAND, AGE_BANDS - 1)
  const support = retired > 1e-9 ? working / retired : Infinity

  return (
    <Overlay title="THE NATIONAL CENSUS" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-2xl font-semibold tabular-nums text-dossier-ink">
            {total.toFixed(1)}M
          </span>
          <span className="font-mono text-[10px] tracking-[0.15em] text-dossier-ink/60">
            LABOUR FORCE {pub.population.laborForce.toFixed(1)}M
          </span>
        </div>

        {/* the pyramid: oldest on top, every band a countable fact */}
        <div className="flex flex-col-reverse gap-[3px]" title="Persons (millions) per five-year age band.">
          {p.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-11 shrink-0 text-right font-mono text-[9px] tabular-nums text-dossier-ink/60">
                {bandLabel(i)}
              </span>
              <div className="h-[11px] flex-1 border-l border-dossier-ink/30">
                <div
                  className={
                    i >= RETIREMENT_BAND
                      ? 'h-full bg-dossier-warn/70'
                      : i >= WORKING_BANDS[0]
                        ? 'h-full bg-dossier-brass'
                        : 'h-full bg-dossier-felt/60'
                  }
                  style={{ width: `${(100 * n) / max}%` }}
                />
              </div>
              <span className="w-9 shrink-0 font-mono text-[9px] tabular-nums text-dossier-ink/70">
                {n.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between border-t border-dossier-ink/20 pt-2 font-mono text-[10px] tabular-nums text-dossier-ink/80">
          <span title="Under 15 — tomorrow's workers, today's mouths.">
            YOUNG {((100 * children) / total).toFixed(0)}%
          </span>
          <span title="Ages 15–59: the shoulders everything rests on.">
            WORKING AGE {((100 * working) / total).toFixed(0)}%
          </span>
          <span title="60 and over — the pension rolls.">
            AGED {((100 * retired) / total).toFixed(0)}%
          </span>
          <span title="Workers per pensioner. Watch this number; it only moves one way once the transition ends.">
            SUPPORT {Number.isFinite(support) ? support.toFixed(1) : '—'}:1
          </span>
        </div>

        <p className="text-center font-mono text-[9px] tracking-[0.2em] text-dossier-ink/50">
          HEADS ARE COUNTABLE. LIVELIHOODS ARE NOT.
        </p>
      </div>
    </Overlay>
  )
}
