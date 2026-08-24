/**
 * Can the labour force follow demand? — the baseline table for issue #169, and
 * the acceptance check for anything that changes the class transition.
 *
 *   pnpm class-structure -- --seeds 12 --ticks 400 --country meridia
 *
 * Investigation 0015 found that `professionals` is a FIXED share of the
 * non-retired population for the whole century, because the class transition in
 * `pipeline/demography.ts` moves people rural → urban and into no other class:
 *
 *     rural_workers: d.classShares.rural_workers - move,
 *     urban_workers: d.classShares.urban_workers + move,
 *
 * Services are staffed 60% from professionals, so investigation 0015 concluded
 * that when demand moves toward services the RETURN to being a professional
 * rises while the NUMBER cannot — and that this is why
 * `ENGEL_ELASTICITY.services` ships at 0.32 rather than the 0.45 that would
 * make the service share genuinely rise.
 *
 * **THE FIRST HALF OF THAT IS RIGHT AND THE SECOND HALF IS NOT.** This tool
 * was written to check it and immediately contradicted it. `professionals` is
 * indeed pinned at 12.2% for four hundred quarters while rural falls 48%→21%.
 * But the service wage does NOT pull away: against agriculture it goes
 * 2.42 → 1.91 over the century, and professionals' real income per head tracks
 * rural workers' almost exactly (13.0x against 12.9x, indexed to q4).
 *
 * Table 4 says where the Gini actually comes from, and it is neither of the
 * cohorts 0015 named:
 *
 *   - **retirees end at 0.38x their own 1947 income per head** — they get
 *     absolutely poorer across a century in which everyone else multiplies.
 *     Transfers are a fixed cash dial that erodes against growth while the
 *     retired share of the population rises (see issue #111 on pensions).
 *   - **urban workers lag badly**, 5.5x against rural's 12.9x, as the class
 *     transition pours people into the cities faster than urban wages rise.
 *
 * So the professionals gap is real as a SUPPLY fact and unproven as a
 * DISTRIBUTIONAL one, and the cost curve in 0015 needs its channel identified
 * before anyone tunes against it. That is the open question this tool exists to
 * carry.
 *
 * Three tables, and the middle one is the finding:
 *
 * 1. **THE CLASS STRUCTURE** — where people are, quarter by quarter. A fix
 *    shows up here first, as `professionals` ceasing to be a flat line.
 * 2. **THE PREMIUM** — what service work earns against farm work, beside the
 *    service share pulling on it. Read the vs-AGRI column: the vs-mean one is
 *    compressed mechanically as services grow into the mean, and it is printed
 *    only so that confound is visible rather than lurking.
 * 3. **WHAT IT COSTS** — Gini, living standard and deposition, which is the
 *    column investigation 0015's cost curve is denominated in.
 * 4. **WHO PULLS AWAY** — real income per head by cohort, indexed. This is the
 *    table that falsified the story above, and the one to read first.
 *
 * The elasticity sweep in that investigation cannot be reproduced by a tool:
 * `ENGEL_ELASTICITY` is a compile-time constant, so varying it means editing
 * `engine/src/constants.ts` between runs. What this reproduces is one ROW of
 * that curve. Change the demography, re-run, and compare the row.
 */

import {
  CAPACITY_IDS,
  CURATED_COUNTRY_IDS,
  applyActions,
  createCountryParams,
  giniIndex,
  init,
  livingStandard,
  sectorValueAdded,
  step,
  SECTOR_IDS,
  type CountryScenarioId,
  type TrueState,
} from '../packages/engine/src/index'
import { COHORT_IDS, WORKING_CLASS_IDS, type WorkingClassId } from '../packages/engine/src/state/schema'
import { cohortCpi } from '../packages/engine/src/pipeline/derive'
import { summarize } from '../packages/runner/src/metrics'

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const SEEDS = Number(arg('seeds', '12'))
const TICKS = Number(arg('ticks', '400'))
const COUNTRY = arg('country', 'meridia') as CountryScenarioId

if (!Number.isInteger(SEEDS) || SEEDS <= 0) throw new Error('--seeds must be a positive integer')
if (!Number.isInteger(TICKS) || TICKS <= 0) throw new Error('--ticks must be a positive integer')
if (!(CURATED_COUNTRY_IDS as readonly string[]).includes(COUNTRY)) {
  throw new Error(`--country must be one of ${CURATED_COUNTRY_IDS.join(', ')}`)
}

interface Reading {
  classShares: Record<WorkingClassId, number>
  /** the service wage against the mean — CONFOUNDED, and reported anyway so
   * the confound is visible: as services grow, the mean is pulled toward the
   * service wage and the ratio compresses mechanically */
  premiumVsMean: number
  /** the service wage against agriculture's — the dual-economy premium, and
   * the one that is not compressed by services' own growth */
  premiumVsAgri: number
  serviceShare: number
  gini: number
  livingStandard: number
  /** real income per head, per cohort — who actually pulls away */
  incomePerHead: Record<string, number>
}

function read(s: TrueState): Reading {
  const classShares = {} as Record<WorkingClassId, number>
  for (const id of WORKING_CLASS_IDS) classShares[id] = s.demography.classShares[id]

  // The premium is read off WAGES rather than cohort income, deliberately:
  // cohort income mixes in profits and bond coupons, which move for reasons
  // that have nothing to do with who the labour market is short of.
  let bill = 0
  let heads = 0
  for (const sector of s.sectors) {
    bill += s.market.wages[sector.id] * sector.employment
    heads += sector.employment
  }
  const meanWage = bill / Math.max(heads, 1e-9)
  const serviceWage = s.market.wages.services

  const va = sectorValueAdded(s)
  let total = 0
  for (const sid of SECTOR_IDS) total += va[sid]

  const incomePerHead: Record<string, number> = {}
  for (const c of s.cohorts) {
    incomePerHead[c.id] =
      (c.wageIncome + c.profitIncome + c.transferIncome) /
      Math.max(cohortCpi(s, c.id), 1e-9) /
      Math.max(c.size, 1e-9)
  }

  return {
    classShares,
    incomePerHead,
    premiumVsMean: serviceWage / Math.max(meanWage, 1e-9),
    premiumVsAgri: serviceWage / Math.max(s.market.wages.agri, 1e-9),
    serviceShare: va.services / Math.max(total, 1e-9),
    gini: giniIndex(s),
    livingStandard: livingStandard(s),
  }
}

/** A capacity-building century with tenure protected, so what is measured is
 * the labour market and not whether a cabinet survived to see it. Deposition
 * is counted separately, on unprotected runs. */
function govern(seed: string): Reading[] {
  let s: TrueState = init(createCountryParams(COUNTRY, seed), seed, {
    protectedTenure: true,
    unlimitedCapital: true,
  })
  const out: Reading[] = []
  for (let t = 0; t < TICKS; t++) {
    let staged: TrueState = { ...s, politics: { ...s.politics, politicalCapital: 500 } }
    if (t % 4 === 0) {
      for (const target of CAPACITY_IDS) {
        try {
          staged = applyActions(staged, [{ kind: 'investCapacity', target, amount: 2 }])
        } catch {
          continue // a ministry at full strength refuses more money
        }
      }
    }
    s = step(staged)
    out.push(read(s))
  }
  return out
}

/** The same policy WITHOUT protection, purely to count depositions — the
 * column the cost curve in investigation 0015 is denominated in. */
function deposedShare(seeds: readonly string[]): number {
  let deposed = 0
  for (const seed of seeds) {
    let s: TrueState = init(createCountryParams(COUNTRY, seed), seed)
    let fell = false
    for (let t = 0; t < TICKS && !fell; t++) {
      let staged = s
      if (t % 8 === 0) {
        for (const target of CAPACITY_IDS) {
          try {
            staged = applyActions(staged, [{ kind: 'investCapacity', target, amount: 2 }])
          } catch {
            continue
          }
        }
      }
      s = step(staged)
      if (!s.politics.inPower) fell = true
    }
    if (fell) deposed++
  }
  return deposed / Math.max(seeds.length, 1)
}

const median = (values: number[]): number => (values.length ? summarize(values).p50 : NaN)
const pct = (v: number): string => `${(100 * v).toFixed(1)}%`

const seeds = Array.from({ length: SEEDS }, (_, i) => `class-${COUNTRY}-${i}`)
const started = performance.now()
const runs = seeds.map(govern)
const MARKS = [4, 40, 120, 240, 400].filter((t) => t <= TICKS)
const at = (rs: Reading[], mark: number) => rs[mark - 1]

console.log(`class structure: ${SEEDS} seeds x ${TICKS} ticks on ${COUNTRY}`)

console.log('\n1. THE CLASS STRUCTURE — where people are')
console.log(['quarter'.padEnd(10), ...WORKING_CLASS_IDS.map((id) => id.padStart(16))].join(' '))
for (const mark of MARKS) {
  console.log(
    [
      `q${mark}`.padEnd(10),
      ...WORKING_CLASS_IDS.map((id) =>
        pct(median(runs.map((rs) => at(rs, mark).classShares[id]))).padStart(16),
      ),
    ].join(' '),
  )
}
const first = median(runs.map((rs) => at(rs, MARKS[0]).classShares.professionals))
const last = median(runs.map((rs) => at(rs, MARKS[MARKS.length - 1]).classShares.professionals))
console.log(
  `\n   professionals moved ${(100 * (last - first)).toFixed(2)} points across the run. ` +
    (Math.abs(last - first) < 0.005
      ? 'FLAT — the labour force cannot follow demand (#169).'
      : 'It moves: the transition has a second destination.'),
)

console.log('\n2. THE PREMIUM — what the shortage is worth, against the demand pulling on it')
console.log(
  [
    'quarter'.padEnd(10),
    'svc wage / agri'.padStart(16),
    'svc wage / mean'.padStart(16),
    'service VA share'.padStart(18),
  ].join(' '),
)
for (const mark of MARKS) {
  console.log(
    [
      `q${mark}`.padEnd(10),
      median(runs.map((rs) => at(rs, mark).premiumVsAgri)).toFixed(3).padStart(16),
      median(runs.map((rs) => at(rs, mark).premiumVsMean)).toFixed(3).padStart(16),
      pct(median(runs.map((rs) => at(rs, mark).serviceShare))).padStart(18),
    ].join(' '),
  )
}

console.log('\n3. WHAT IT COSTS — the columns the 0015 cost curve is denominated in')
console.log(['quarter'.padEnd(10), 'gini'.padStart(10), 'living standard'.padStart(18)].join(' '))
for (const mark of MARKS) {
  console.log(
    [
      `q${mark}`.padEnd(10),
      median(runs.map((rs) => at(rs, mark).gini)).toFixed(4).padStart(10),
      median(runs.map((rs) => at(rs, mark).livingStandard)).toFixed(3).padStart(18),
    ].join(' '),
  )
}
console.log(`\n   deposed (unprotected, same policy): ${pct(deposedShare(seeds))} of ${SEEDS} runs`)

console.log('\n4. WHO PULLS AWAY — real income per head, indexed to q4')
console.log(['quarter'.padEnd(10), ...COHORT_IDS.map((id) => id.slice(0, 14).padStart(16))].join(' '))
const base = Object.fromEntries(
  COHORT_IDS.map((id) => [id, median(runs.map((rs) => at(rs, MARKS[0]).incomePerHead[id]))]),
)
for (const mark of MARKS) {
  console.log(
    [
      `q${mark}`.padEnd(10),
      ...COHORT_IDS.map((id) =>
        (median(runs.map((rs) => at(rs, mark).incomePerHead[id])) / base[id]).toFixed(2).padStart(16),
      ),
    ].join(' '),
  )
}
console.log(`\nwall time: ${((performance.now() - started) / 1000).toFixed(1)}s`)
