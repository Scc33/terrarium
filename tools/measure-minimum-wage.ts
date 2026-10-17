/**
 * Where does the minimum wage bite, and what does it buy there? — the
 * repeatable form of investigation 0028 (issue #295).
 *
 *   pnpm minimum-wage -- --seeds 12 --ticks 400 --arm developmental
 *
 * The statute's one channel is a floor under every sector's wage
 * (`minimumWageFloor`, ADR-0027), so what it does depends entirely on which
 * wage it reaches. On the farm it is Harris–Todaro: a dearer farm keeps people
 * on the land and out of the city's job queue, and unemployment falls. On a
 * city wage it is the disemployment argument. `binds` is the share of quarters
 * in each era in which a sector's wage sits on the floor; the deltas are the
 * statute arm against the same seed without it, at the era's last quarter.
 *
 * Two arms, because they answer different questions:
 *
 * - `isolated` is `tests/properties/statutes.test.ts`'s arm: protected tenure,
 *   unlimited capital, all four capacities funded every year, the living wage
 *   enacted at quarter 40. It measures the channel.
 * - `developmental` is the runner's capacity builder that also legislates the
 *   living wage, one rung at a time, once the ministries exist and it can
 *   afford to. It measures what a government that wants the statute gets,
 *   enforcement and deposition included.
 */

import {
  applyActions,
  CAPACITY_IDS,
  createCountryParams,
  CURATED_COUNTRY_IDS,
  giniIndex,
  init,
  minimumWageFloor,
  statuteForce,
  step,
  type Action,
  type CountryScenarioId,
  type TrueState,
} from '../packages/engine/src/index'
import { FIRST_YEAR } from '../packages/engine/src/state/schema'
import { developmentalPolicy, type RunnerPolicy } from '../packages/runner/src/policies'
import { runOne } from '../packages/runner/src/run'

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const ARM_IDS = ['isolated', 'developmental'] as const
type ArmId = (typeof ARM_IDS)[number]
const COUNTRY_IDS = [...CURATED_COUNTRY_IDS, 'procedural'] as const

const SEEDS = Number(arg('seeds', '12'))
const TICKS = Number(arg('ticks', '400'))
const ONLY_COUNTRY = arg('country', '')
const ONLY_ARM = arg('arm', '')
const ENACT_AT = 40

if (!Number.isInteger(SEEDS) || SEEDS <= 0) throw new Error('--seeds must be a positive integer')
if (!Number.isInteger(TICKS) || TICKS <= ENACT_AT) throw new Error(`--ticks must exceed ${ENACT_AT}`)
if (ONLY_COUNTRY && !(COUNTRY_IDS as readonly string[]).includes(ONLY_COUNTRY)) {
  throw new Error(`--country must be one of ${COUNTRY_IDS.join(', ')}`)
}
if (ONLY_ARM && !(ARM_IDS as readonly string[]).includes(ONLY_ARM)) {
  throw new Error(`--arm must be one of ${ARM_IDS.join(', ')}`)
}
const COUNTRIES: readonly CountryScenarioId[] = ONLY_COUNTRY ? [ONLY_COUNTRY as CountryScenarioId] : COUNTRY_IDS
const ARMS: readonly ArmId[] = ONLY_ARM ? [ONLY_ARM as ArmId] : ARM_IDS

const ERAS = [ENACT_AT, 120, 200, 300, 400]
  .filter((t) => t < TICKS)
  .concat(TICKS)
  .map((from, i, edges) => [from, edges[i + 1]] as const)
  .slice(0, -1)
const BOUND_SECTORS = ['agri', 'manuf', 'transport', 'services'] as const
const LIVING_WAGE: Action = { kind: 'enact', statute: 'minimum_wage', level: 2 }

/** developmental, plus the living wage a rung at a time once there is a civil
 * service to enforce it and capital to spare after the capacity batch */
const legislating: RunnerPolicy = (state, rng, tick) => {
  if (tick % 8 === 0) return developmentalPolicy(state, rng, tick)
  if (tick < ENACT_AT || tick % 4 !== 1 || state.politics.politicalCapital < 30) return []
  const { level } = state.gov.statutes.minimum_wage
  return level < 2 ? [{ kind: 'enact', statute: 'minimum_wage', level: level + 1 }] : []
}

/** one century; `visit` sees the state after every step. Returns whether the
 * cabinet fell. */
function century(arm: ArmId, country: CountryScenarioId, seed: string, statute: boolean, visit: (s: TrueState) => void) {
  if (arm === 'developmental') {
    const run = runOne({
      seed,
      ticks: TICKS,
      country,
      policy: statute ? legislating : developmentalPolicy,
      includeStateHash: false,
      observer: { afterStep: visit },
    })
    return run.deposedAt !== null
  }
  let s = init(createCountryParams(country, seed), seed, { protectedTenure: true })
  for (let t = 0; t < TICKS; t++) {
    let staged: TrueState = { ...s, politics: { ...s.politics, politicalCapital: 500 } }
    if (t % 4 === 0) {
      for (const target of CAPACITY_IDS) {
        try {
          staged = applyActions(staged, [{ kind: 'investCapacity', target, amount: 2 }])
        } catch {
          continue
        }
      }
    }
    if (statute && t === ENACT_AT) staged = applyActions(staged, [LIVING_WAGE])
    s = step(staged)
    visit(s)
  }
  return false
}

interface Delta {
  gini: number
  unemployment: number
  farmWage: number
  rural: number
  foodPrice: number
  gdp: number
}

const pct = (x: number, digits = 0) => `${(100 * x).toFixed(digits)}%`
const signed = (x: number, digits: number) => `${x >= 0 ? '+' : ''}${x.toFixed(digits)}`
const year = (tick: number) => FIRST_YEAR + Math.floor(tick / 4)

for (const arm of ARMS) {
  console.log(`\n== ${arm} arm: ${SEEDS} seeds × ${TICKS} quarters, living wage from q${ENACT_AT} ==`)
  for (const country of COUNTRIES) {
    const binds = ERAS.map(() => ({ quarters: 0, force: 0, ...Object.fromEntries(BOUND_SECTORS.map((id) => [id, 0])) }))
    const deltas: Delta[] = ERAS.map(() => ({ gini: 0, unemployment: 0, farmWage: 0, rural: 0, foodPrice: 0, gdp: 0 }))
    const deposed = [0, 0]
    for (let k = 0; k < SEEDS; k++) {
      const seed = `minwage-${country}-${k}`
      const ends: TrueState[][] = [[], []]
      for (const statute of [false, true]) {
        const lost = century(arm, country, seed, statute, (s) => {
          const t = s.meta.tick - 1
          const e = ERAS.findIndex(([from, to]) => t >= from && t < to)
          if (e < 0) return
          if (t === ERAS[e][1] - 1) ends[+statute][e] = s
          if (!statute) return
          const era = binds[e] as Record<string, number>
          era.quarters++
          era.force += statuteForce(s, 'minimum_wage')
          const floor = minimumWageFloor(s)
          if (floor <= 0) return
          for (const id of BOUND_SECTORS) if (s.market.wages[id] <= floor * 1.001) era[id]++
        })
        if (lost) deposed[+statute]++
      }
      ERAS.forEach((_, e) => {
        const [off, on] = [ends[0][e], ends[1][e]]
        const rel = (s: TrueState) => s.market.prices.agri / s.market.prices.services
        const d = deltas[e]
        d.gini += (giniIndex(on) - giniIndex(off)) / SEEDS
        d.unemployment += (on.flows.unemployment - off.flows.unemployment) / SEEDS
        d.farmWage += (on.market.wages.agri / off.market.wages.agri - 1) / SEEDS
        d.rural += (on.demography.classShares.rural_workers - off.demography.classShares.rural_workers) / SEEDS
        d.foodPrice += (rel(on) / rel(off) - 1) / SEEDS
        d.gdp += (on.flows.realGdp / off.flows.realGdp - 1) / SEEDS
      })
    }
    const fell = arm === 'developmental' ? `  deposed ${pct(deposed[0] / SEEDS)} → ${pct(deposed[1] / SEEDS)}` : ''
    console.log(`\n${country}${fell}`)
    console.log('  era          force   binds: agri  manuf  transp  serv  |  at era end: Gini     u      farm w   rural    food    GDP')
    ERAS.forEach(([from, to], e) => {
      const era = binds[e] as Record<string, number>
      const share = (id: string) => pct(era[id] / era.quarters).padStart(6)
      const d = deltas[e]
      console.log(
        `  ${year(from)}–${year(to)}  ${(era.force / era.quarters).toFixed(2).padStart(6)}       ` +
          `${BOUND_SECTORS.map(share).join(' ')}  |  ` +
          `${signed(d.gini, 3).padStart(17)} ${signed(100 * d.unemployment, 2).padStart(6)}pt ` +
          `${signed(100 * d.farmWage, 1).padStart(6)}% ${signed(100 * d.rural, 2).padStart(6)}pt ` +
          `${signed(100 * d.foodPrice, 1).padStart(6)}% ${signed(100 * d.gdp, 1).padStart(6)}%`,
      )
    })
  }
}
