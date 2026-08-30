/**
 * Does the Terrarium Human Development Index carry three signals, or has it
 * collapsed into a renamed income series?
 *
 *   pnpm hdi-analysis
 *
 * Measures first releases from a fully surveyed, capacity-building century
 * across every authored country. The contribution column decomposes variance
 * in log HDI: because log(HDI) is one third of each log component, the three
 * covariance shares sum to one even when the dimensions move together.
 */

import { COUNTRY_CATALOG, type HumanDevelopmentDimensions } from '@terrarium/engine'
import { developmentalPolicy } from '../packages/runner/src/policies'
import { runOne } from '../packages/runner/src/run'

const SEEDS = Number(process.env.HDI_SEEDS ?? 12)
const TICKS = Number(process.env.HDI_TICKS ?? 400)

interface Reading extends HumanDevelopmentDimensions {
  hdi: number
}

const readings: Reading[] = []
for (const country of COUNTRY_CATALOG) {
  for (let index = 0; index < SEEDS; index++) {
    const run = runOne({
      country: country.id,
      seed: `hdi-${country.id}-${index}`,
      ticks: TICKS,
      policy: developmentalPolicy,
      includeStateHash: false,
    })
    for (const print of run.finalState.stats.series.human_development ?? []) {
      if (print.revision !== 0 || !print.components) continue
      readings.push({ hdi: print.value, ...print.components })
    }
  }
}

const keys = ['hdi', 'health', 'skills', 'income'] as const
type ReadingKey = (typeof keys)[number]
const values = (key: ReadingKey) => readings.map((reading) => reading[key])
const quantile = (sample: readonly number[], fraction: number) => {
  const sorted = [...sample].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(fraction * sorted.length)))]
}
const mean = (sample: readonly number[]) =>
  sample.reduce((sum, value) => sum + value, 0) / sample.length
const covariance = (left: readonly number[], right: readonly number[]) => {
  const leftMean = mean(left)
  const rightMean = mean(right)
  return mean(left.map((value, index) => (value - leftMean) * (right[index] - rightMean)))
}
const correlation = (left: readonly number[], right: readonly number[]) =>
  covariance(left, right) /
  Math.sqrt(covariance(left, left) * covariance(right, right))

console.log(
  `${SEEDS} seeds × ${COUNTRY_CATALOG.length} authored countries × ${TICKS} quarters; ${readings.length} aligned first releases\n`,
)
console.log('series'.padEnd(10) + ['min', 'p01', 'p50', 'p99', 'max'].map((label) => label.padStart(9)).join(''))
for (const key of keys) {
  const sample = values(key)
  const cells = [
    Math.min(...sample),
    quantile(sample, 0.01),
    quantile(sample, 0.5),
    quantile(sample, 0.99),
    Math.max(...sample),
  ]
  console.log(key.padEnd(10) + cells.map((value) => value.toFixed(3).padStart(9)).join(''))
}

const hdi = values('hdi')
const logHdi = hdi.map(Math.log)
const variance = covariance(logHdi, logHdi)
console.log('\ncomponent'.padEnd(12) + 'corr(HDI)'.padStart(12) + 'log variance share'.padStart(20))
for (const key of ['health', 'skills', 'income'] as const) {
  const sample = values(key)
  const contribution = covariance(sample.map((value) => Math.log(value) / 3), logHdi) / variance
  console.log(
    key.padEnd(12) + correlation(sample, hdi).toFixed(3).padStart(12) + contribution.toFixed(3).padStart(20),
  )
}

const rail = (key: ReadingKey, at: 0 | 1) =>
  readings.filter((reading) => Math.abs(reading[key] - at) < 1e-12).length
console.log('\nclamped releases')
for (const key of keys) {
  console.log(`${key.padEnd(10)} low ${String(rail(key, 0)).padStart(5)} · high ${String(rail(key, 1)).padStart(5)}`)
}
