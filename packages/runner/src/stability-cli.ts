/**
 * Long-horizon balance harness:
 *   pnpm stability -- --runs 120 --policy all --country all
 */

import { COUNTRY_CATALOG, END_OF_HISTORY_TICK, type CountryScenarioId } from '@terrarium/engine'
import { runBatch } from './batch'
import { POLICY_IDS, type PolicyId } from './policies'
import { analyzeStability } from './stability'
import { printStabilityReport } from './stability-report'

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const runs = Number(arg('runs', '120'))
const ticks = Number(arg('ticks', String(END_OF_HISTORY_TICK)))
const requestedPolicy = arg('policy', 'all')
const country = arg('country', 'all') as CountryScenarioId | 'baseline' | 'all'

if (!Number.isInteger(runs) || runs <= 0) throw new Error('--runs must be a positive integer')
if (!Number.isInteger(ticks) || ticks <= 1) throw new Error('--ticks must be an integer greater than one')
if (ticks > END_OF_HISTORY_TICK) throw new Error(`--ticks cannot exceed ${END_OF_HISTORY_TICK}`)
if (requestedPolicy !== 'all' && !POLICY_IDS.includes(requestedPolicy as PolicyId)) {
  throw new Error(`unknown policy '${requestedPolicy}'; use ${POLICY_IDS.join(', ')}, or all`)
}
if (
  country !== 'all' &&
  country !== 'baseline' &&
  !COUNTRY_CATALOG.some((profile) => profile.id === country)
) {
  throw new Error(
    `unknown country '${country}'; use baseline, ${COUNTRY_CATALOG.map((profile) => profile.id).join(', ')}, or all`,
  )
}

const policies: readonly PolicyId[] = requestedPolicy === 'all'
  ? POLICY_IDS
  : [requestedPolicy as PolicyId]

for (const policy of policies) {
  const started = performance.now()
  const batch = runBatch({
    runs,
    ticks,
    policy,
    country,
    seedPrefix: `stability-${policy}`,
  })
  const report = analyzeStability(batch.runs)
  printStabilityReport(report, {
    ticks,
    policy,
    country,
    wallMs: performance.now() - started,
  })
  if (
    report.reachableNonFiniteRuns.length > 0 ||
    (policy !== 'random' && report.reachablePriceExplosionRuns.length > 0)
  ) {
    process.exitCode = 1
  }
}
