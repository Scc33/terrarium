/**
 * Where does each published indicator actually live over a century?
 *   pnpm ranges
 *   RANGE_ARMS=welfare,maximal RANGE_SEEDS=4 pnpm ranges
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
 * It sweeps POLICY as well as country, seed and time (#190): every arm in
 * `SURVEY_ARMS`, the same governments the coverage test plays. A face cut
 * against the capacity builder alone welded `investment_share` to its rail for
 * 98% of a real game. The `worst arm` columns say which government a face
 * fails, and how badly — a face that pools under 2% can still be useless to
 * the one government that pegs it half the time.
 *
 * The default is 12 seeds × 6 countries × 5 governments, 360 centuries; narrow
 * it with RANGE_ARMS and RANGE_SEEDS while iterating, never for the face you
 * commit.
 */

import {
  COUNTRY_CATALOG,
  INDICATOR_IDS,
  type CountryScenarioId,
  type IndicatorId,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { SURVEY_ARM_IDS, surveyQuarters, type SurveyArmId } from '../packages/runner/src/survey'
import { INDICATOR_FACE, readNeedle } from '../packages/ui/src/domains'

const SEEDS = Number(process.env.RANGE_SEEDS ?? 12)
const TICKS = Number(process.env.RANGE_TICKS ?? 400)
const requested = process.env.RANGE_COUNTRY ?? 'all'
const countries: Array<CountryScenarioId | 'baseline'> = requested === 'all'
  ? COUNTRY_CATALOG.map((country) => country.id)
  : requested === 'baseline'
    ? ['baseline']
    : [requested as CountryScenarioId]
const arms = (process.env.RANGE_ARMS ?? SURVEY_ARM_IDS.join(',')).split(',').map((a) => a.trim())
const unknown = arms.filter((a) => !(SURVEY_ARM_IDS as readonly string[]).includes(a))
if (unknown.length > 0) throw new Error(`unknown arm ${unknown.join(', ')} — pick from ${SURVEY_ARM_IDS.join(', ')}`)

const values = new Map<IndicatorId, number[]>()
/** prints and pegged prints under today's face, per indicator per arm */
const prints = new Map<IndicatorId, Map<string, { n: number; pegged: number }>>()
for (const id of INDICATOR_IDS) {
  values.set(id, [])
  prints.set(id, new Map())
}

for (const arm of arms as SurveyArmId[]) {
  for (const country of countries) {
    for (let i = 0; i < SEEDS; i++) {
      const seed = `range-${country}-${i}`
      surveyQuarters(seed, TICKS, arm, country === 'baseline' ? undefined : country, (state, t) => {
        const pub = observe(state)
        for (const id of INDICATOR_IDS) {
          const series = pub.indicators[id]
          if (!series) continue
          const face = INDICATOR_FACE[id]
          for (const p of series.points) {
            if (p.publishedAt !== t || !Number.isFinite(p.value)) continue
            values.get(id)!.push(p.value)
            if (face === 'ratchet') continue
            const tally = prints.get(id)!.get(arm) ?? { n: 0, pegged: 0 }
            tally.n++
            if (readNeedle(face, p.value).pegged) tally.pegged++
            prints.get(id)!.set(arm, tally)
          }
        }
      })
    }
  }
}

const q = (xs: number[], f: number) => xs[Math.min(xs.length - 1, Math.max(0, Math.floor(f * xs.length)))]
const pct = (x: number) => `${(100 * x).toFixed(1)}%`

console.log(
  `${SEEDS} seeds × ${countries.length} scenario(s) × ${arms.length} arm(s) × ${TICKS} quarters ` +
  `(${countries.join(', ')}; ${arms.join(', ')})\n`,
)
console.log(
  'indicator'.padEnd(24) +
    ['min', 'p01', 'p25', 'p50', 'p75', 'p99', 'max'].map((h) => h.padStart(9)).join('') +
    '   face'.padEnd(16) + 'pegged'.padStart(8) + '  worst arm',
)
for (const id of INDICATOR_IDS) {
  const xs = values.get(id)!.sort((a, b) => a - b)
  if (xs.length === 0) {
    console.log(id.padEnd(24) + '  (never published — is its capacity gate reachable?)')
    continue
  }
  const cells = [xs[0], q(xs, 0.01), q(xs, 0.25), q(xs, 0.5), q(xs, 0.75), q(xs, 0.99), xs[xs.length - 1]]
  const face = INDICATOR_FACE[id]
  let tail = '   ratchet'
  if (face !== 'ratchet') {
    const tallies = [...prints.get(id)!]
    const n = tallies.reduce((sum, [, t]) => sum + t.n, 0)
    const pegged = tallies.reduce((sum, [, t]) => sum + t.pegged, 0)
    const [worstArm, worst] = tallies.sort(([, a], [, b]) => b.pegged / b.n - a.pegged / a.n)[0] ?? ['—', { n: 1, pegged: 0 }]
    tail = `   ${`${face.lo}–${face.hi}`.padEnd(13)}${pct(pegged / Math.max(n, 1)).padStart(8)}  ` +
      `${worstArm} ${pct(worst.pegged / worst.n)}`
  }
  console.log(id.padEnd(24) + cells.map((v) => v.toFixed(1).padStart(9)).join('') + tail)
}
