/**
 * Where does each published indicator actually live over a century?
 *   pnpm ranges
 *
 * This is the measuring stick for `packages/ui/src/domains.ts`. A gauge's
 * face is a fixed, per-indicator constant — a dial redrawn under its own
 * needle teaches the player nothing — which means the bounds have to be
 * chosen once, deliberately, against the economy the engine really produces
 * rather than guessed from the units.
 *
 * Run this when adding an indicator, or after a retune that moves an existing
 * one; take a face covering roughly p01–p99, rounded outward to a readable
 * number, and let the extremes peg. (`tests/ui/gauge-domains.test.ts` fails if
 * anything spends more than 2 % of its life pegged, so a face that has drifted
 * out of date will tell you.)
 *
 * "Fully surveyed" is the point: an unfunded government publishes almost
 * nothing, so the widest honest range comes from a country that built every
 * survey and kept it.
 */

import {
  applyActions,
  generateParams,
  init,
  INDICATOR_IDS,
  step,
  type CapacityId,
  type IndicatorId,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'

const CAPACITIES: readonly CapacityId[] = ['tax', 'statistical', 'administrative', 'education']
const SEEDS = Number(process.env.RANGE_SEEDS ?? 12)
const TICKS = Number(process.env.RANGE_TICKS ?? 400)

const values = new Map<IndicatorId, number[]>()
for (const id of INDICATOR_IDS) values.set(id, [])

for (let i = 0; i < SEEDS; i++) {
  const seed = `range-${i}`
  let s: TrueState = init(generateParams(seed), seed)
  for (let t = 0; t < TICKS; t++) {
    if (t % 8 === 0) {
      for (const target of CAPACITIES) {
        try {
          s = applyActions(s, [{ kind: 'investCapacity', target, amount: 2 }])
        } catch {
          // unaffordable this quarter; the survey simply waits
        }
      }
    }
    s = step(s)
    const pub = observe(s)
    for (const id of INDICATOR_IDS) {
      const series = pub.indicators[id]
      if (!series) continue
      for (const p of series.points) {
        if (p.publishedAt === t && Number.isFinite(p.value)) values.get(id)!.push(p.value)
      }
    }
  }
}

const q = (xs: number[], f: number) => xs[Math.min(xs.length - 1, Math.max(0, Math.floor(f * xs.length)))]

console.log(`${SEEDS} fully-surveyed countries × ${TICKS} quarters\n`)
console.log(
  'indicator'.padEnd(16) +
    ['min', 'p01', 'p25', 'p50', 'p75', 'p99', 'max'].map((h) => h.padStart(9)).join(''),
)
for (const id of INDICATOR_IDS) {
  const xs = values.get(id)!.sort((a, b) => a - b)
  if (xs.length === 0) {
    console.log(id.padEnd(16) + '  (never published — is its capacity gate reachable?)')
    continue
  }
  const cells = [xs[0], q(xs, 0.01), q(xs, 0.25), q(xs, 0.5), q(xs, 0.75), q(xs, 0.99), xs[xs.length - 1]]
  console.log(id.padEnd(16) + cells.map((v) => v.toFixed(1).padStart(9)).join(''))
}
