/**
 * Paired comparison of expected-inflation wage bargains with the former spot-CPI
 * bargain. pnpm inflation-expectations -- --runs 40 --ticks 416
 *
 * The research-only counterfactual substitutes the wage input and restores the
 * household forecast immediately afterward. All other readers, steps and RNG
 * substreams use the live engine. Reports stop at deposition; finalExpectedP95
 * deliberately includes the raw post-game tail as a diagnostic.
 */
import { COUNTRY_CATALOG, type TrueState } from '../packages/engine/src/index'
import { labor } from '../packages/engine/src/pipeline/labor'
import { policyFor, type RunnerPolicy } from '../packages/runner/src/policies'
import { runOne, type RunResultWithoutHash } from '../packages/runner/src/run'
import { analyzeStability, summarizeTails } from '../packages/runner/src/stability'

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}
const runs = Number(arg('runs', '40'))
const ticks = Number(arg('ticks', '416'))
if (!Number.isInteger(runs) || runs <= 0) throw new Error('--runs must be positive')
if (!Number.isInteger(ticks) || ticks < 80) throw new Error('--ticks must be at least 80')

const printing: RunnerPolicy = (state, _rng, tick) => tick === 0 ? [
  { kind: 'setDial', path: 'taxRates.income', value: 0 },
  { kind: 'setDial', path: 'taxRates.corporate', value: 0 },
  { kind: 'setDial', path: 'spending.transfers', value: state.flows.nominalGdp * 0.3 },
] : []
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(1, values.length)
const round = (n: number) => Number(n.toFixed(3))
const original = labor.run.bind(labor)
try {
  for (const bargain of ['realized', 'expected'] as const) {
    // Only the legacy arm overrides the expectation read by the wage bargain.
    // Neither the inflation flow nor either forecast is changed downstream.
    labor.run = (state, rng) => {
      if (bargain === 'expected') return original(state, rng)
      const next = original({
        ...state, ledger: { ...state.ledger, consumerInflationExpectations: 4 * state.flows.inflationQ },
      }, rng)
      return { ...next, ledger: state.ledger }
    }
    for (const policy of ['passive', 'developmental', 'random', 'printing'] as const) {
      const results: RunResultWithoutHash[] = []
      const expectations: number[] = []
      const revisions: number[] = []
      const spotMoves: number[] = []
      const lastExpectations: number[] = []
      for (const { id: country } of COUNTRY_CATALOG) {
        for (let i = 0; i < runs; i++) {
          let previous: TrueState | undefined
          results.push(runOne({
            seed: `expectations-${country}-${i}`, country, ticks,
            policy: policy === 'printing' ? printing : policyFor(policy),
            // This economic stress arm must actually enact its oversized
            // transfer order, rather than silently skip an unaffordable bid.
            // Tenure and statistical fog remain ordinary in both paired arms.
            rules: policy === 'printing' ? { unlimitedCapital: true } : undefined,
            lenient: policy !== 'printing',
            includeStateHash: false,
            observer: { afterStep(state) {
              if (state.politics.inPower && state.meta.tick > 40) {
                expectations.push(state.ledger.consumerInflationExpectations * 100)
                if (previous) {
                  revisions.push(100 * Math.abs(state.ledger.consumerInflationExpectations - previous.ledger.consumerInflationExpectations))
                  spotMoves.push(400 * Math.abs(state.flows.inflationQ - previous.flows.inflationQ))
                }
              }
              previous = state
            } },
          }))
          lastExpectations.push(previous!.ledger.consumerInflationExpectations * 100)
        }
      }
      const report = analyzeStability(results)
      console.log(JSON.stringify({
        bargain, policy, runs: results.length,
        survivors: report.survivorTrend.survivors,
        growth: round(report.survivorTrend.aggregateCagr.p50),
        perHead: round(report.survivorTrend.realGdpPerCapitaCagr.p50),
        expectationMean: round(mean(expectations)),
        expectationRevisions: round(mean(revisions)), spotMoves: round(mean(spotMoves)),
        finalExpectedP95: round(summarizeTails(lastExpectations).p95),
        failures: [report.reachableNonFiniteRuns.length, report.reachablePriceExplosionRuns.length],
        eras: report.eras.map((era) => ({
          era: era.era.id,
          inflation: [era.inflation.p01, era.inflation.p99].map(round),
          quietInflation: [era.quietInflation.p01, era.quietInflation.p99].map(round),
          quietGrowth: [era.quietRealGrowth.p01, era.quietRealGrowth.p99].map(round),
          publishedInflation: [era.publishedInflation.p01, era.publishedInflation.p99].map(round),
        })),
        droughts: report.shocks.filter((shock) => shock.event === 'drought').map((shock) => ({
          era: shock.era.id, n: shock.completeWindows,
          peak: round(shock.peakInflation.p95), trough: round(shock.laterInflationTrough.p05),
        })),
        countries: COUNTRY_CATALOG.map(({ id }) => {
          const countryReport = analyzeStability(results.filter((run) => run.countryId === id))
          const future = countryReport.eras.find((era) => era.era.id === 'future')!
          return {
            country: id, survivors: countryReport.survivorTrend.survivors,
            growth: round(countryReport.survivorTrend.aggregateCagr.p50),
            quietInflation: [future.quietInflation.p01, future.quietInflation.p99].map(round),
          }
        }),
      }))
    }
  }
} finally {
  labor.run = original
}
