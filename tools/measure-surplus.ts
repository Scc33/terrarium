/**
 * Where a surplus goes, and what the choice is worth (issue #211, ADR-0037):
 *
 *   pnpm surplus -- --runs 20 --ticks 400
 *
 * Before v44 the answer to the first half was "nowhere". Once `gov.debt` hit
 * zero — a median quarter 62 under the developmental baseline and 81 under
 * passive, in every seed of a thousand — a positive balance redeemed nothing,
 * banked nothing, and was assigned to no household. The money was collected by
 * `revenue` and then simply ceased to exist.
 *
 * Four sections, because they answer different questions and the first two
 * disagree with the last two on purpose:
 *
 * 1. THE SIZE OF THE HOLE. How much revenue the old arithmetic stranded, as a
 *    share of everything the treasury collected in a century. This is the
 *    defect, measured, and it is computed from the SAME quantities `fiscal`
 *    uses rather than from a re-derivation.
 * 2. WHAT THE DEFAULT SETTLEMENT DOES. The fund at payout zero, as a multiple
 *    of annual GDP, and what its return grows to as a share of revenue. The
 *    point of the section is the pair of numbers beside it: growth and
 *    deposition, which do not move, because a fund held abroad reaches the
 *    domestic economy only when it is drawn down.
 * 3. WHAT THE DIAL IS WORTH. Paired arms at three settings under
 *    `unlimitedCapital`, because the order is quoted near 94 PC against the 20
 *    a new cabinet holds and a lenient runner would silently skip it — the
 *    statute book's lesson, which this tool tripped over before it was written
 *    down here. Two horizons, because a rebate is a demand impulse and a fund
 *    is a stock, and those two do not rank the same way at ten years and at a
 *    century.
 * 4. WHAT THE FUND IS ACTUALLY FOR. A country made to run deficits, with and
 *    without savings in front of them: the fund's only channel to the economy
 *    is that it is spent before the auction, so this is the section that says
 *    whether the channel is reachable at all.
 */

import {
  CURATED_COUNTRY_IDS,
  realConsumptionPerCapita,
  type Action,
  type CountryScenarioId,
  type TrueState,
} from '../packages/engine/src/index'
import { FUND_YIELD } from '../packages/engine/src/constants'
import { summarize } from '../packages/runner/src/metrics'
import { developmentalPolicy } from '../packages/runner/src/policies'
import { runOne } from '../packages/runner/src/run'

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const RUNS = Number(arg('runs', '20'))
const TICKS = Number(arg('ticks', '400'))
if (!Number.isInteger(RUNS) || RUNS <= 0) throw new Error('--runs must be a positive integer')
if (!Number.isInteger(TICKS) || TICKS < 40) throw new Error('--ticks must be an integer ≥ 40')
/** Section 4's transfer programme, as a share of published quarterly output.
 * Sized so the fund meets part of the bill and not all of it: too small and
 * neither arm ever runs a deficit at all, too large and the only thing measured
 * is that a sovereign fund does not pay for a hyperinflation. */
const SHOCK_SHARE = Number(arg('shock', '0.30'))

const pct = (v: number) => `${(v * 100).toFixed(2)}%`
const num = (v: number, digits = 2) => v.toFixed(digits)

function table(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)))
  const line = (cells: string[]) =>
    cells.map((c, i) => (i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join('  ')
  console.log('  ' + line(headers))
  console.log('  ' + widths.map((w) => '-'.repeat(w)).join('  '))
  for (const row of rows) console.log('  ' + line(row))
}

/** One century's worth of treasury readings, taken from the true state each
 * quarter. Nothing here is published: the fund is exact, but so is every other
 * figure in the treasury's books, and this is a research tool either way. */
interface Century {
  /** what the OLD arithmetic would have stranded, cumulative */
  stranded: number
  /** and what v44's own residual is — larger, because the fund's return feeds
   * the surplus that feeds the fund */
  residual: number
  revenue: number
  fundEnd: number
  /** annualized GDP at the close */
  gdpAnnual: number
  fundReturnShareEnd: number
  rebatePaid: number
  drawnFromFund: number
  borrowed: number
  printed: number
  debtFreeAt: number | null
  realGdpAt: Map<number, number>
  consumptionAt: Map<number, number>
  giniEnd: number
  inflationMean: number
  unemploymentMean: number
  deposedAt: number | null
}

const HORIZONS = [...new Set([40, 120, TICKS])].filter((t) => t <= TICKS).sort((a, b) => a - b)

function century(opts: {
  seed: string
  country?: CountryScenarioId
  payout?: number
  spendShare?: number
  seedFund?: number
  developmental?: boolean
  ticks?: number
}): Century {
  const ticks = opts.ticks ?? TICKS
  const script: Action[] = []
  if (opts.payout !== undefined) {
    script.push({ kind: 'setDial', path: 'surplusPayout', value: opts.payout })
  }
  const out: Century = {
    stranded: 0,
    residual: 0,
    revenue: 0,
    fundEnd: 0,
    gdpAnnual: 0,
    fundReturnShareEnd: 0,
    rebatePaid: 0,
    drawnFromFund: 0,
    borrowed: 0,
    printed: 0,
    debtFreeAt: null,
    realGdpAt: new Map(),
    consumptionAt: new Map(),
    giniEnd: 0,
    inflationMean: 0,
    unemploymentMean: 0,
    deposedAt: null,
  }
  let before: TrueState | null = null
  const result = runOne({
    seed: opts.seed,
    // Named, always. `runOne` falls back to `generateParams(seed)` — a
    // RANDOMISED country per seed — when this is undefined, so a study that
    // omitted it would quietly measure a different country in every run while
    // reporting a single recipe's name. The first draft of this file did
    // exactly that.
    country: opts.country ?? 'meridia',
    ticks,
    // `unlimitedCapital` ONLY where an order is posted. The channel sections
    // post one the room prices near 94 PC, and a lenient runner would skip it
    // and report two identical arms — "the dial does nothing" rather than "the
    // dial never moved". But sections 1 and 2 post nothing and describe
    // themselves as ordinary passive and developmental play, and handing them
    // the rule would let every capacity order through that political capital
    // would have refused: a stronger tax office, a larger surplus, and a
    // "baseline" that is not the baseline it is labelled as.
    rules: script.length > 0 ? { unlimitedCapital: true } : 'standard',
    script: script.length > 0 ? [{ tick: 0, actions: script }] : undefined,
    policy: opts.developmental ? developmentalPolicy : undefined,
    includeStateHash: false,
    observer: {
      afterActions(state) {
        before = state
      },
      afterStep(state) {
        const opening = before!.gov
        const gov = state.gov
        const balance = gov.budget.balance
        const fundReturn = state.flows.revenueBySource.fund
        out.residual += Math.max(0, balance) - Math.min(Math.max(0, balance), opening.debt)
        // exactly what the pre-v44 step computed and then dropped: the part of
        // a positive balance that no debt stock was there to absorb, on a
        // balance with no fund income in it
        const old = Math.max(0, balance - fundReturn)
        out.stranded += old - Math.min(old, opening.debt)
        // taxes only — see the note on section 1
        out.revenue += gov.budget.revenue - fundReturn
        out.rebatePaid += state.flows.fiscalRebate
        if (state.flows.fundFlow < 0) out.drawnFromFund += -state.flows.fundFlow
        out.borrowed += Math.max(0, gov.debt - opening.debt)
        out.printed += state.flows.printedThisQtr
        if (out.debtFreeAt === null && gov.debt <= 1e-9) out.debtFreeAt = state.meta.tick
        if (HORIZONS.includes(state.meta.tick)) {
          out.realGdpAt.set(state.meta.tick, state.flows.realGdp)
          out.consumptionAt.set(state.meta.tick, realConsumptionPerCapita(state))
        }
        out.fundEnd = gov.fund
        out.gdpAnnual = 4 * state.flows.nominalGdp
        out.fundReturnShareEnd =
          state.flows.revenueBySource.fund / Math.max(gov.budget.revenue, 1e-9)
        const record = state.stats.record[state.stats.record.length - 1]
        if (record) out.giniEnd = record.gini
      },
    },
  })
  const t = result.trajectory
  out.inflationMean = (t.reduce((s, p) => s + p.inflationQ, 0) / Math.max(t.length, 1)) * 400
  out.unemploymentMean = (t.reduce((s, p) => s + p.unemployment, 0) / Math.max(t.length, 1)) * 100
  out.deposedAt = result.deposedAt
  return out
}

const seeds = Array.from({ length: RUNS }, (_, i) => `surplus-${i}`)

console.log(`\nWHERE A SURPLUS GOES — ${RUNS} seeds × ${TICKS} quarters, fund yield ${pct(FUND_YIELD)}/yr\n`)

// ---------- 1. the size of the hole ----------
console.log('1. THE MONEY THAT USED TO VANISH')
console.log('   A positive balance with no debt left in front of it, summed over the century,')
console.log('   against the taxes collected in the same century.')
console.log('   Measured as the PRE-v44 engine would have computed it: the fund\u2019s own return is')
console.log('   subtracted from both the balance and the revenue. That is exact rather than an')
console.log('   estimate, and the reason it is exact is worth stating — at the default setting')
console.log('   the two engines produce bit-identical trajectories over 400 quarters on every')
console.log('   curated country, so the ONLY quantity v44 adds to a passive or developmental')
console.log('   century is that revenue line. Take it away and this is the old arithmetic.\n')
{
  const rows: string[][] = []
  for (const [label, developmental] of [['passive', false], ['developmental', true]] as const) {
    const runs = seeds.map((seed) => century({ seed, developmental }))
    const share = summarize(runs.map((r) => r.stranded / Math.max(r.revenue, 1e-9)))
    const free = runs.map((r) => r.debtFreeAt).filter((q): q is number => q !== null)
    rows.push([
      label,
      `${free.length}/${runs.length}`,
      free.length > 0 ? num(summarize(free).p50, 0) : '—',
      pct(share.p05),
      pct(share.p50),
      pct(share.p95),
    ])
  }
  table(
    ['policy', 'debt-free', 'median q', 'stranded/tax p05', 'p50', 'p95'],
    rows,
  )
}

// ---------- 2. the default settlement ----------
console.log('\n2. WHAT BANKING IT BUILDS, AND WHAT IT COSTS')
console.log('   The fund at the default setting, as a multiple of ANNUAL GDP at the close, and')
console.log('   its return as a share of that quarter’s revenue. Growth, inflation and')
console.log('   deposition sit beside it because they are the reading that matters: a fund is')
console.log('   held abroad, so at payout zero nothing reaches the domestic economy.\n')
{
  const rows: string[][] = []
  for (const [label, developmental] of [['passive', false], ['developmental', true]] as const) {
    const runs = seeds.map((seed) => century({ seed, developmental }))
    const cover = summarize(runs.map((r) => r.fundEnd / Math.max(r.gdpAnnual, 1e-9)))
    const share = summarize(runs.map((r) => r.fundReturnShareEnd))
    rows.push([
      label,
      num(cover.p05),
      num(cover.p50),
      num(cover.p95),
      pct(share.p50),
      num(summarize(runs.map((r) => r.inflationMean)).p50),
      `${runs.filter((r) => r.deposedAt !== null).length}/${runs.length}`,
    ])
  }
  table(
    ['policy', 'fund/GDP p05', 'p50', 'p95', 'return/revenue', 'inflation %/yr', 'deposed'],
    rows,
  )
}

// ---------- 3. what the dial is worth ----------
console.log('\n3. BANK IT, SPLIT IT, OR HAND IT BACK')
console.log('   Paired PER SEED — the median of each seed\u2019s own arm-versus-control effect,')
console.log('   never the ratio of two marginal medians. Developmental play, `unlimitedCapital`')
console.log('   in both arms so the order is never priced out. Read the two horizons together: a rebate is a')
console.log('   demand impulse and a fund is a stock, and a lever that moves a FLOW gets')
console.log('   competed away while a lever that moves a STOCK compounds.\n')
{
  const control = seeds.map((seed) => century({ seed, developmental: true, payout: 0 }))
  const rows: string[][] = []
  // PAIRED, per seed, and then summarized — never the ratio of two marginal
  // medians. The median arm and the median control need not be the same seed,
  // and with different shock draws and deposition quarters behind them the
  // ratio of their medians is not any comparison that was actually run. Every
  // column below is the median of a per-seed effect.
  const pairedRel = (f: (c: Century) => number) =>
    `${(100 * summarize(seeds.map((_, i) => {
      const base = f(control[i])
      return Math.abs(base) > 1e-12 ? f(arm[i]) / base - 1 : 0
    })).p50).toFixed(2)}%`
  const pairedDiff = (f: (c: Century) => number, digits = 2) =>
    num(summarize(seeds.map((_, i) => f(arm[i]) - f(control[i]))).p50, digits)
  let arm: Century[] = []
  for (const payout of [0.5, 1]) {
    arm = seeds.map((seed) => century({ seed, developmental: true, payout }))
    rows.push([
      `payout ${pct(payout)}`,
      pairedRel((c) => c.realGdpAt.get(120) ?? 0),
      pairedRel((c) => c.realGdpAt.get(TICKS) ?? 0),
      pairedRel((c) => c.consumptionAt.get(120) ?? 0),
      pairedRel((c) => c.consumptionAt.get(TICKS) ?? 0),
      pairedDiff((c) => c.inflationMean),
      pairedDiff((c) => c.giniEnd, 4),
      `${arm.filter((r) => r.deposedAt !== null).length}/${arm.length}`,
    ])
  }
  rows.unshift([
    'payout 0.00% (control)',
    '—',
    '—',
    '—',
    '—',
    num(summarize(control.map((r) => r.inflationMean)).p50),
    num(summarize(control.map((r) => r.giniEnd)).p50, 4),
    `${control.filter((r) => r.deposedAt !== null).length}/${control.length}`,
  ])
  table(
    ['arm', 'GDP 30y', 'GDP 100y', 'consn 30y', 'consn 100y', 'infl pp/yr', 'gini pts', 'deposed'],
    rows,
  )
}

// ---------- 4. the fund as a buffer ----------
console.log('\n4. WHAT A FUND IS ACTUALLY FOR')
console.log('   At the default setting the fund reaches the domestic economy through exactly')
console.log('   one channel: a deficit spends it before going to the auction. This is the')
console.log('   section that decides whether that channel is REACHABLE — forty years of')
console.log('   banking, then a transfer programme written as a share of published output that')
console.log('   the tax base cannot carry, held for twenty years.')
console.log('   COVER is the quarters of that deficit the savings paid for before the first')
console.log('   bond was issued. The comparison arm handed every surplus back instead and')
console.log('   arrives at the same bill with nothing; the two are NOT identical economies —')
console.log('   one of them spent its surpluses for forty years — so read the cover column,')
console.log('   which is a fact about one arm, ahead of the differences between them.\n')
{
  const rows: string[][] = []
  const armSeeds = seeds.slice(0, Math.min(RUNS, 10))
  for (const country of CURATED_COUNTRY_IDS) {
    const banked = armSeeds.map((seed) => shockRun(seed, country, 0))
    const spent = armSeeds.map((seed) => shockRun(seed, country, 1))
    rows.push([
      country,
      num(summarize(banked.map((r) => r.fundAtShock / Math.max(r.gdpAnnualAtShock, 1e-9))).p50),
      num(summarize(banked.map((r) => r.coverQtrs)).p50, 0),
      num(summarize(banked.map((r) => r.drawnFromFund)).p50),
      num(summarize(spent.map((r) => r.borrowed)).p50),
      num(summarize(banked.map((r) => r.borrowed)).p50),
      num(summarize(spent.map((r) => r.printed)).p50),
      num(summarize(banked.map((r) => r.printed)).p50),
    ])
  }
  table(
    ['country', 'fund/GDP', 'cover q', 'drawn', 'borrowed: spent', 'banked', 'printed: spent', 'banked'],
    rows,
  )
}

interface Shock {
  fundAtShock: number
  gdpAnnualAtShock: number
  coverQtrs: number
  drawnFromFund: number
  borrowed: number
  printed: number
}

/**
 * Forty years of ordinary capacity-building, then a transfer programme at a
 * share of published output for twenty more.
 *
 * The programme is a GDP-SHARE rule rather than cash, because cash fixed at the
 * opening quarter's output is a rounding error by the time the shock lands —
 * which is exactly what the first draft measured, and it reported every column
 * at 0.00 for four of five countries. It is also sized so the fund can
 * plausibly meet part of it: the second draft ran a bill twenty times the
 * savings, which answers a question nobody asked (no, a sovereign fund does not
 * pay for a hyperinflation) while hiding the one that was asked.
 */
function shockRun(seed: string, country: CountryScenarioId, payout: number): Shock {
  const SHOCK_AT = 160
  const out: Shock = {
    fundAtShock: 0,
    gdpAnnualAtShock: 0,
    coverQtrs: 0,
    drawnFromFund: 0,
    borrowed: 0,
    printed: 0,
  }
  let before: TrueState | null = null
  let borrowedYet = false
  runOne({
    seed,
    country,
    ticks: 240,
    rules: { unlimitedCapital: true },
    script: [
      { tick: 0, actions: [{ kind: 'setDial', path: 'surplusPayout', value: payout }] },
      {
        tick: SHOCK_AT,
        actions: [{ kind: 'setSpendingRule', programme: 'transfers', mode: 'gdpShare', value: SHOCK_SHARE }],
      },
    ],
    policy: developmentalPolicy,
    includeStateHash: false,
    observer: {
      afterActions(state) {
        before = state
      },
      afterStep(state) {
        if (state.meta.tick === SHOCK_AT + 1) {
          out.fundAtShock = before!.gov.fund
          out.gdpAnnualAtShock = 4 * state.flows.nominalGdp
        }
        if (state.meta.tick <= SHOCK_AT) return
        if (state.flows.fundFlow < 0) out.drawnFromFund += -state.flows.fundFlow
        const borrowed = Math.max(0, state.gov.debt - before!.gov.debt)
        out.borrowed += borrowed
        out.printed += state.flows.printedThisQtr
        if (!borrowedYet) {
          if (borrowed > 1e-9 || state.flows.printedThisQtr > 1e-9) borrowedYet = true
          else if (state.flows.fundFlow < 0) out.coverQtrs += 1
        }
      },
    },
  })
  return out
}
