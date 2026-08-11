import { END_OF_HISTORY_TICK, MERIDIA_PARAMS } from '@terrarium/engine'
import {
  analyzeExportFeedback,
  runExportFeedbackExperiment,
} from './export-feedback'

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(name)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const runs = Number(arg('--runs', '20'))
const ticks = Number(arg('--ticks', String(END_OF_HISTORY_TICK)))
const opennessArg = arg('--openness', 'all')
if (!Number.isInteger(runs) || runs <= 0) throw new Error('--runs must be a positive integer')
if (!Number.isInteger(ticks) || ticks <= 0) throw new Error('--ticks must be a positive integer')
if (!['low', 'high', 'all'].includes(opennessArg)) {
  throw new Error('--openness must be low, high, or all')
}

const opennessCases = [
  { id: 'low', value: 0.68 },
  { id: 'high', value: 1.55 },
].filter(({ id }) => opennessArg === 'all' || opennessArg === id)

const pct = (value: number): string => Number.isFinite(value) ? value.toFixed(2) : 'n/a'

for (const openness of opennessCases) {
  const params = {
    ...MERIDIA_PARAMS,
    name: `Meridia export-feedback ${openness.id}`,
    openness: openness.value,
  }
  const experiments = Array.from({ length: runs }, (_, index) =>
    runExportFeedbackExperiment({
      seed: `export-feedback-${String(index).padStart(3, '0')}`,
      ticks,
      params,
    }),
  )
  const report = analyzeExportFeedback(experiments)
  process.stdout.write(`\n${openness.id} openness (${openness.value}), ${runs} paired runs\n`)
  process.stdout.write(
    'era         h  n   partner   normal  neutral  non-HH  other-HH  habit  HH-total\n',
  )
  for (const era of report.eras.filter(
    (entry) => entry.era.id === 'late_century' || entry.era.id === 'future',
  )) {
    for (const horizon of era.horizons) {
      process.stdout.write(
        `${era.era.id.padEnd(12)} ${String(horizon.horizon).padStart(1)} ` +
        `${String(horizon.observations).padStart(3)} ` +
        `${pct(horizon.partnerDemandGrowth.p50).padStart(8)} ` +
        `${pct(horizon.normalGrowth.p50).padStart(8)} ` +
        `${pct(horizon.neutralGrowth.p50).padStart(8)} ` +
        `${pct(horizon.nonHouseholdEffect.p50).padStart(7)} ` +
        `${pct(horizon.otherHouseholdEffect.p50).padStart(8)} ` +
        `${pct(horizon.habitualIncomeFeedbackEffect.p50).padStart(6)} ` +
        `${pct(horizon.householdFeedbackEffect.p50).padStart(8)}\n`,
      )
    }
  }
}
