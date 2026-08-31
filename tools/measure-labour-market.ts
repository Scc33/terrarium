/**
 * How many labour markets is this? — the repeatable form of investigations
 * 0001 and 0020, and the acceptance check for anything that changes how
 * `LABOR_SOURCE` is read.
 *
 *   pnpm labour-market -- --seeds 8 --ticks 400
 *
 * ## What this is for
 *
 * Investigation 0001 tried to ship an `underemployment` indicator off the
 * subsistence valve, measured three candidate definitions, and found all three
 * policy-invariant — a century of funding everything moved the Lewis surplus
 * by 0.2 points against a secular decline of 17. It abandoned the indicator
 * and left behind a question: the rural/urban joblessness split is enormous
 * and invisible, but "one side of it is an accounting artifact rather than an
 * economic fact", so it cannot be published as-is.
 *
 * This tool measures the artifact. That is the point, and it is why the tables
 * are ordered the way they are: table 1 is the defect, table 2 is the identity
 * that turns the defect into a number, and table 3 asks whether that number is
 * REACHABLE — the test every candidate in 0001 failed. Read table 3 first if
 * you are deciding whether to build something; read table 1 first if you are
 * deciding whether it is safe to publish it yet.
 *
 * ## The arithmetic, and why it is not a second computation
 *
 * Everything below comes from the engine's own `skillTightness` and
 * `laborForce`, never from a local re-derivation of either. `skillTightness[c]`
 * is the jobs `LABOR_SOURCE` hands cohort `c` divided by the people in it, so
 * with `lf[c]` the whole decomposition is two lines:
 *
 *   M = Σ lf[c] · max(0, 1 − tightness[c])   people whose skill nobody asks for
 *   S = Σ lf[c] · max(0, tightness[c] − 1)   posts asking for people who do not exist
 *
 * and `M − S = U_open` EXACTLY, because `LABOR_SOURCE`'s columns sum to 1 per
 * sector, so Σ_c posts[c] is total employment by construction. The tool asserts
 * that identity rather than trusting it: if it ever fails, the staffing table
 * has stopped summing to one somewhere and every number here is meaningless.
 *
 * The identity holds on ONE labour force, and the tool reads the state after
 * the whole tick rather than inside `labor`. Those are not always the same
 * number: `schoolingWithdrawal` reads `statuteForce`, whose compliance term
 * reads bloc favour and power — and `institutions` runs AFTER `labor`. So on an
 * arm that enacts compulsory schooling, the labour force this tool divides by
 * has moved since the labour market cleared. The drift is reported below and
 * runs to a few tenths of a point; every table uses the consistent basis, and
 * `flows.unemployment` — the number the player is actually shown — is reported
 * beside it so the gap is visible rather than quietly absorbed.
 *
 * `S` is the headline reading, and since schema 43 (ADR-0035) it is an economic
 * quantity rather than a property of the model. The allocation is now rationed
 * against who exists, so `skillTightness` is what it always claimed to be — the
 * DEMAND for a class against the SUPPLY of it — and the excess above 1 is a
 * genuine shortage rather than the size of an accounting error. Before that
 * change it was the latter, which is why investigation 0020 declined to publish
 * it and 0001 declined before that.
 *
 * ## The arms
 *
 * `passive`, `education` (the education ministry alone), `developmental` (all
 * four) and `random` all run with protected tenure and unlimited capital, on
 * `measure-class-structure.ts`'s four-quarter cadence, so what is measured is
 * the labour market and not whether a cabinet survived to see it. `random` is
 * adversarial exploration, not play: it is here because a threshold has to be
 * measured under bad play as well as good before it ships.
 */

import {
  CAPACITY_IDS,
  CURATED_COUNTRY_IDS,
  applyActions,
  createCountryParams,
  init,
  laborForce,
  rngFor,
  skillTightness,
  staffing,
  step,
  type CapacityId,
  type CountryScenarioId,
  type TrueState,
} from '../packages/engine/src/index'
import { WORKING_CLASS_IDS, type CohortId } from '../packages/engine/src/state/schema'
import { PARTICIPATION, SUBSISTENCE_CAP } from '../packages/engine/src/constants'
import { summarize } from '../packages/runner/src/metrics'
import { randomPolicy } from '../packages/runner/src/policies'

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const SEEDS = Number(arg('seeds', '8'))
const TICKS = Number(arg('ticks', '400'))
const ONLY = arg('country', '')

if (!Number.isInteger(SEEDS) || SEEDS <= 0) throw new Error('--seeds must be a positive integer')
if (!Number.isInteger(TICKS) || TICKS <= 0) throw new Error('--ticks must be a positive integer')
if (ONLY && !(CURATED_COUNTRY_IDS as readonly string[]).includes(ONLY)) {
  throw new Error(`--country must be one of ${CURATED_COUNTRY_IDS.join(', ')}`)
}
const COUNTRIES: readonly CountryScenarioId[] = ONLY
  ? [ONLY as CountryScenarioId]
  : CURATED_COUNTRY_IDS

/** The classes that actually supply labour. `WORKING_CLASS_IDS` includes
 * business owners, whose participation is zero because they are self-employed
 * and paid out of profits — a column of 0.00 in every table is noise, not a
 * finding. */
const LABOUR_CLASS_IDS = WORKING_CLASS_IDS.filter((id) => PARTICIPATION[id] > 0)

const ARM_IDS = ['passive', 'education', 'developmental', 'random'] as const
type ArmId = (typeof ARM_IDS)[number]
const FUNDS: Record<ArmId, readonly CapacityId[]> = {
  passive: [],
  education: ['education'],
  developmental: CAPACITY_IDS,
  random: [],
}

interface Reading {
  /** what the engine published this quarter — the number the player is shown */
  unemployment: number
  /** the same rate on the labour force this tool divides M and S by, so the
   * decomposition is internally consistent. See the note at the top. */
  unemploymentAtRead: number
  /** jobs ÷ own labour force, per working class — the engine's own ratio */
  tightness: Record<CohortId, number>
  /** share of the labour force whose skill nobody is asking for */
  surplus: number
  /**
   * The part of `surplus` that is ACTUALLY IDLE, read off `derive.staffing`.
   *
   * These stopped being the same number at schema 43 (ADR-0035). `surplus` is
   * built from the deliberately-unrationed `skillTightness`, so it counts a
   * class nobody is asking for — but substitution now puts some of those people
   * in somebody else's posts, and urban workers walking to the farms is the one
   * direction it fires in. Measured on Meridia at q120, `surplus` reads 3.798M
   * urban workers against 3.234M genuinely idle: a 17% overstatement, in
   * exactly the class the mechanism moves.
   *
   * Both are reported, because both are true about different things and #197
   * needs the second one. The identity below still closes on `surplus`, since
   * both its sides come from the same unrationed table — which is precisely why
   * it cannot catch this and the two columns have to be printed side by side.
   */
  idle: number
  /** …and per class, as a share of that class's OWN labour force. This is the
   * column #197 wants: the aggregate above is an identity (see table 2), but
   * the per-class split is not, and it is where substitution shows. */
  idleByClass: Record<CohortId, number>
  /** share of the labour force worth of posts asking for absent workers */
  shortage: number
  /** professionals with no professional post, as a share of the labour force */
  professionalSurplus: number
  /** …of whom, actually idle: the same correction, for the #27 column */
  professionalIdle: number
  /** how hard agriculture is pressed against `SUBSISTENCE_CAP × ruralLF` */
  valveSaturation: number
}

function read(s: TrueState): Reading {
  const lf = laborForce(s)
  const tightness = skillTightness(s)
  // who is in a job, as opposed to who is asked for: the allocation, not the
  // recipe. This is the only place the two can be compared (ADR-0035).
  const heads = staffing(s)
  const working = (id: CohortId) =>
    s.sectors.reduce((sum, sector) => sum + (heads[sector.id][id] ?? 0), 0)
  let total = 0
  let surplus = 0
  let idle = 0
  let shortage = 0
  const idleByClass = {} as Record<CohortId, number>
  for (const id of LABOUR_CLASS_IDS) {
    const supply = lf[id] ?? 0
    if (supply <= 1e-9) {
      idleByClass[id] = 0
      continue
    }
    total += supply
    surplus += supply * Math.max(0, 1 - tightness[id])
    const spare = Math.max(0, supply - working(id))
    idle += spare
    idleByClass[id] = spare / supply
    shortage += supply * Math.max(0, tightness[id] - 1)
  }
  const agri = s.sectors.find((sector) => sector.id === 'agri')
  const ruralCeiling = SUBSISTENCE_CAP * Math.max(lf.rural_workers ?? 0, 1e-9)
  const employed = s.sectors.reduce((sum, sector) => sum + sector.employment, 0)
  return {
    unemployment: s.flows.unemployment,
    unemploymentAtRead: 1 - employed / Math.max(total, 1e-9),
    tightness,
    surplus: surplus / Math.max(total, 1e-9),
    idle: idle / Math.max(total, 1e-9),
    idleByClass,
    shortage: shortage / Math.max(total, 1e-9),
    professionalSurplus:
      ((lf.professionals ?? 0) * Math.max(0, 1 - tightness.professionals)) / Math.max(total, 1e-9),
    professionalIdle:
      Math.max(0, (lf.professionals ?? 0) - working('professionals')) / Math.max(total, 1e-9),
    valveSaturation: (agri?.employment ?? 0) / ruralCeiling,
  }
}

/** A century under one government, with both safeties on, so what is measured
 * is the labour market and not whether a cabinet lived to see it. */
function govern(country: CountryScenarioId, arm: ArmId, seed: string): Reading[] {
  let s: TrueState = init(createCountryParams(country, seed), seed, {
    protectedTenure: true,
    unlimitedCapital: true,
  })
  const out: Reading[] = []
  for (let t = 0; t < TICKS; t++) {
    let staged: TrueState = { ...s, politics: { ...s.politics, politicalCapital: 500 } }
    if (arm === 'random') {
      // The runner policy over-offers and relies on the skip; an order this
      // build refuses is not evidence about the labour market.
      for (const action of randomPolicy(staged, rngFor(seed, 'labour-market', t), t)) {
        try {
          staged = applyActions(staged, [action])
        } catch {
          continue
        }
      }
    } else if (FUNDS[arm].length > 0 && t % 4 === 0) {
      for (const target of FUNDS[arm]) {
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

const median = (values: number[]): number => (values.length ? summarize(values).p50 : NaN)
const pct = (v: number): string => `${(100 * v).toFixed(1)}%`
const ratio = (v: number): string => v.toFixed(2)

const seeds = Array.from({ length: SEEDS }, (_, i) => `labour-${i}`)
const MARKS = [...new Set([...[4, 40, 120, 240, 400].filter((t) => t <= TICKS), TICKS])].sort(
  (a, b) => a - b,
)
const at = (rs: Reading[], mark: number) => rs[mark - 1]

const started = performance.now()
/** [country][arm] → one Reading[] per seed */
const runs = new Map<string, Reading[][]>()
for (const country of COUNTRIES) {
  for (const arm of ARM_IDS) {
    runs.set(
      `${country}/${arm}`,
      seeds.map((seed) => govern(country, arm, seed)),
    )
  }
}
const get = (country: CountryScenarioId, arm: ArmId) => runs.get(`${country}/${arm}`) ?? []

console.log(
  `labour market: ${SEEDS} seeds x ${TICKS} ticks x ${COUNTRIES.length} countries x ${ARM_IDS.length} arms`,
)

// ---------------------------------------------------------------------------
// The identity, asserted rather than assumed. `LABOR_SOURCE`'s columns sum to
// 1 per sector, so surplus − shortage is total unemployment by construction.
// Every table below is a reading of that identity; if it breaks, the staffing
// table has stopped summing to one and nothing here means anything.
// ---------------------------------------------------------------------------
let worstResidual = 0
let worstDrift = 0
for (const country of COUNTRIES) {
  for (const arm of ARM_IDS) {
    for (const rs of get(country, arm)) {
      for (const r of rs) {
        worstResidual = Math.max(
          worstResidual,
          Math.abs(r.surplus - r.shortage - r.unemploymentAtRead),
        )
        worstDrift = Math.max(worstDrift, Math.abs(r.unemploymentAtRead - r.unemployment))
      }
    }
  }
}
console.log(`\nidentity check  max |M − S − U| = ${worstResidual.toExponential(2)}`)
console.log(
  `                max drift from the published rate = ${(100 * worstDrift).toFixed(2)}pp` +
    ' (the post-`institutions` labour force; see the note at the top)',
)
if (worstResidual > 1e-9) {
  throw new Error(
    'M − S ≠ U: LABOR_SOURCE no longer sums to 1 per sector, or employment is not the sum of its posts',
  )
}

// ---------------------------------------------------------------------------
console.log('\n1. THE ALLOCATION — jobs ÷ own labour force, by class')
console.log(
  '   Above 1.00 employers want more of a class than the country has. Since schema 43 that is',
)
console.log(
  '   a shortage the allocation resolves by recruiting the next rung down, not an overdraft on',
)
console.log('   the cohort: `staffing` bounds everyone by their own labour force (ADR-0035).')
console.log('   Each cell is  demand  /  idle: what the table ASKS of the class, over the share of')
console.log('   that class left with no job at all. They are NOT complements — a class can be')
console.log('   under-asked and still fully employed, in somebody else’s posts. That gap is the')
console.log('   substitution, and it is the honest per-class read #197 needs.')
for (const country of COUNTRIES) {
  for (const arm of ['passive', 'developmental'] as const) {
    console.log(`\n   ${country} / ${arm}`)
    console.log(
      ['   quarter'.padEnd(12), ...LABOUR_CLASS_IDS.map((id) => id.padStart(20))].join(' '),
    )
    for (const mark of MARKS) {
      console.log(
        [
          `   q${mark}`.padEnd(12),
          ...LABOUR_CLASS_IDS.map((id) => {
            const rs = get(country, arm)
            const demand = ratio(median(rs.map((r) => at(r, mark).tightness[id])))
            const spare = pct(median(rs.map((r) => at(r, mark).idleByClass[id] ?? 0)))
            return `${demand} / ${spare}`.padStart(20)
          }),
        ].join(' '),
      )
    }
  }
}

// ---------------------------------------------------------------------------
console.log('\n\n2. THE DECOMPOSITION — U = M − S, as shares of the labour force')
console.log('   U  open unemployment, the headline')
console.log('   M  surplus: people in a class with more members than posts')
console.log('   I  …of whom actually IDLE, read off the allocation rather than inferred from M.')
console.log('      At THIS level I === U identically, and that is the point of printing it: it is')
console.log('      the proof `staffing` conserves heads, since every post is filled and nobody')
console.log('      exceeds their own class. The informative split is per class, in table 1 —')
console.log('      M counts a farm-hand from the towns as unemployed and I does not (ADR-0035).')
console.log('   S  shortage: posts asking for a class too small to fill them')
for (const country of COUNTRIES) {
  console.log(`\n   ${country}`)
  console.log(
    [
      '   quarter'.padEnd(12),
      ...ARM_IDS.flatMap((arm) => [
        `${arm} U`.padStart(18),
        'M'.padStart(8),
        'I'.padStart(8),
        'S'.padStart(8),
      ]),
    ].join(''),
  )
  for (const mark of MARKS) {
    console.log(
      [
        `   q${mark}`.padEnd(12),
        ...ARM_IDS.flatMap((arm) => {
          const rs = get(country, arm)
          return [
            pct(median(rs.map((r) => at(r, mark).unemploymentAtRead))).padStart(18),
            pct(median(rs.map((r) => at(r, mark).surplus))).padStart(8),
            pct(median(rs.map((r) => at(r, mark).idle))).padStart(8),
            pct(median(rs.map((r) => at(r, mark).shortage))).padStart(8),
          ]
        }),
      ].join(''),
    )
  }
}

// ---------------------------------------------------------------------------
console.log('\n\n3. IS IT REACHABLE? — the mismatch S at the end of the run, by arm')
console.log('   The test every candidate measure in investigation 0001 failed. A quantity that')
console.log('   reports the decade rather than the player is not worth an instrument.')
console.log(
  ['   country'.padEnd(14), ...ARM_IDS.map((arm) => arm.padStart(14)), 'spread'.padStart(10)].join(
    '',
  ),
)
for (const country of COUNTRIES) {
  const finals = ARM_IDS.map((arm) =>
    median(get(country, arm).map((rs) => at(rs, MARKS[MARKS.length - 1]).shortage)),
  )
  console.log(
    [
      `   ${country}`.padEnd(14),
      ...finals.map((v) => pct(v).padStart(14)),
      pct(Math.max(...finals) - Math.min(...finals)).padStart(10),
    ].join(''),
  )
}

// ---------------------------------------------------------------------------
console.log('\n\n4. THE EDUCATED SURPLUS — professionals with no professional post (#27)')
console.log('   The issue’s own scenario: a schooled workforce the economy is not hiring as')
console.log('   professionals. ADR-0032’s crossing gate reads RELATIVE tightness, so it keeps')
console.log('   professionalising a country already in absolute professional surplus — but it')
console.log('   also throttles the leg, which is why this column is small and not zero.')
console.log('   `surplus` and `idle` are EQUAL here, and that equality is the finding: a spare')
console.log('   professional has no lesser post to take, because when the top rung is in surplus')
console.log('   every rung below it is too. Substitution fills posts; it cannot create them.')
for (const country of COUNTRIES) {
  console.log(`\n   ${country}`)
  console.log(
    [
      '   quarter'.padEnd(12),
      ...ARM_IDS.flatMap((arm) => [
        `${arm} surplus`.padStart(22),
        'idle'.padStart(10),
        'tightness'.padStart(12),
      ]),
    ].join(''),
  )
  for (const mark of MARKS) {
    console.log(
      [
        `   q${mark}`.padEnd(12),
        ...ARM_IDS.flatMap((arm) => {
          const rs = get(country, arm)
          return [
            pct(median(rs.map((r) => at(r, mark).professionalSurplus))).padStart(22),
            pct(median(rs.map((r) => at(r, mark).professionalIdle))).padStart(10),
            ratio(median(rs.map((r) => at(r, mark).tightness.professionals))).padStart(12),
          ]
        }),
      ].join(''),
    )
  }
}

// ---------------------------------------------------------------------------
console.log('\n\n5. THE VALVE — agricultural employment ÷ SUBSISTENCE_CAP × rural labour force')
console.log('   Investigation 0001’s first finding. At 1.00 the family farm cannot take one')
console.log('   more person, so idle hands stay idle and land in the headline instead. A valve')
console.log('   that is jammed open is a demographic quantity, not a cyclical one.')
console.log(
  ['   country'.padEnd(14), ...ARM_IDS.map((arm) => arm.padStart(14))].join(''),
)
for (const country of COUNTRIES) {
  console.log(
    [
      `   ${country}`.padEnd(14),
      ...ARM_IDS.map((arm) => {
        const rs = get(country, arm)
        // the share of quarters after 1956 in which the cap is binding
        const bound = rs.map((r) => {
          let hits = 0
          let seen = 0
          for (let q = 40; q < r.length; q++) {
            seen++
            if (r[q].valveSaturation > 0.999) hits++
          }
          return seen > 0 ? hits / seen : 0
        })
        return pct(median(bound)).padStart(14)
      }),
    ].join(''),
  )
}
console.log('   (share of quarters from 1956 in which the cap binds)')

console.log(`\ndone in ${((performance.now() - started) / 1000).toFixed(1)}s`)
