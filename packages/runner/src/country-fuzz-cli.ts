import { resolve } from 'node:path'
import { writeCountryFuzzArtifact } from './country-fuzz-artifacts'
import { COUNTRY_FUZZ_PROFILES, runCountryFuzzSweep, type CountryFuzzProfile } from './country-fuzz'
import { summarize } from './metrics'
import { POLICY_IDS, type PolicyId } from './policies'

function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

function positiveInteger(name: string, fallback: string): number {
  const value = Number(arg(name, fallback))
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`--${name} must be a positive integer, got '${value}'`)
  }
  return value
}

function median(values: number[]): string {
  return values.length > 0 ? summarize(values).p50.toFixed(2) : '—'
}

async function main(): Promise<void> {
  const cases = positiveInteger('cases', '100')
  const ticks = positiveInteger('ticks', '400')
  const profile = arg('profile', 'draft') as CountryFuzzProfile
  const policy = arg('policy', 'random') as PolicyId
  const seedPrefix = arg('seed', 'country-fuzz')
  const invocationDirectory = process.env.INIT_CWD ?? process.cwd()
  const output = resolve(invocationDirectory, arg('output', 'country-fuzz-artifacts'))

  if (!COUNTRY_FUZZ_PROFILES.includes(profile)) {
    throw new Error(`unknown profile '${profile}'; use ${COUNTRY_FUZZ_PROFILES.join(', ')}`)
  }
  if (!POLICY_IDS.includes(policy)) {
    throw new Error(`unknown policy '${policy}'; use ${POLICY_IDS.join(', ')}`)
  }

  const result = runCountryFuzzSweep({ cases, ticks, profile, policy, seedPrefix })
  const failures = result.outcomes.filter((outcome) => outcome.failure !== null)
  const completed = result.outcomes.flatMap((outcome) => outcome.summary ? [outcome.summary] : [])
  const findings = result.outcomes.flatMap((outcome) => outcome.findings)
  const priceFindings = findings.filter((artifact) => artifact.finding.kind === 'price')
  const depositions = findings.filter((artifact) => artifact.finding.kind === 'deposition')

  console.log(
    `terrarium country fuzz: ${cases} cases × ${ticks} ticks, profile=${profile}, policy=${policy}`,
  )
  console.log(
    `  wall time: ${(result.wallMs / 1000).toFixed(1)}s  (${(result.wallMs / cases).toFixed(1)} ms/case)`,
  )
  console.log(`  hard failures: ${failures.length}`)
  console.log(`  price findings: ${priceFindings.length}`)
  console.log(`  depositions: ${depositions.length}`)
  console.log(`  median growth: ${median(completed.map((run) => run.realGrowth))}%/yr`)
  console.log(`  median inflation: ${median(completed.map((run) => run.meanAnnualInflation))}%/yr`)
  console.log(`  median unemployment: ${median(completed.map((run) => run.meanUnemployment))}%`)

  const artifacts = [
    ...findings,
    ...failures.flatMap((outcome) => outcome.failure ? [outcome.failure] : []),
  ]
  for (const artifact of artifacts) {
    const written = await writeCountryFuzzArtifact(output, artifact)
    console.log(`  ${written.created ? 'wrote' : 'retained'} ${written.path}`)
  }
  if (failures.length > 0) {
    for (const outcome of failures) {
      const failure = outcome.failure!.failure
      console.log(
        `  failure ${outcome.sample.caseId}: ${failure.kind} at q${failure.tick} (${failure.phase})`,
      )
    }
    process.exitCode = 1
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
