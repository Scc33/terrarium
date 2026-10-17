/** Reproducible per-person and balance-sheet audit over country space.
 * pnpm wealth -- --cases 30 --ticks 400
 * Extreme levels are measurements, not failures of a guessed plausibility cap. */
import { resolve } from 'node:path'
import { SCHEMA_VERSION } from '../packages/engine/src/index'
import { COUNTRY_FUZZ_PROFILES, runCountryFuzzCase, sampleCountry } from '../packages/runner/src/country-fuzz'
import { writeCountryFuzzArtifact } from '../packages/runner/src/country-fuzz-artifacts'
import { perPersonDiagnostics } from '../packages/runner/src/perPerson'
import { summarize } from '../packages/runner/src/metrics'
import { studyProvenance } from './measure-capital-ownership'

function integer(name: string, fallback: number): number {
  const index = process.argv.indexOf(`--${name}`)
  const value = index < 0 ? fallback : Number(process.argv[index + 1])
  if (!Number.isInteger(value) || value <= 0) throw new Error(`invalid --${name}`)
  return value
}

async function main() {
  const provenance = studyProvenance()
  const cases = integer('cases', 30)
  const ticks = integer('ticks', 400)
  const report = []
  let failures = 0
  for (const profile of COUNTRY_FUZZ_PROFILES) {
    for (const policy of ['passive', 'developmental', 'random'] as const) {
      const final: ReturnType<typeof perPersonDiagnostics>[] = []
      let quarters = 0
      for (let index = 0; index < cases; index++) {
        const sample = sampleCountry(profile, index, 'wealth-52')
        let last: ReturnType<typeof perPersonDiagnostics> | undefined
        const outcome = runCountryFuzzCase(sample, { ticks, policy,
          checkState(state) { last = perPersonDiagnostics(state); quarters++ } })
        if (outcome.failure) {
          failures++
          const written = await writeCountryFuzzArtifact(resolve('wealth-fuzz-artifacts'), outcome.failure)
          console.error(`replayable failure: ${written.path}`)
        } else if (last) final.push(last)
      }
      report.push({ profile, policy, cases, checkedQuarters: quarters,
        negativeHouseholdNetWorth: final.filter(row => row.householdNetWorthPerPerson < 0).length,
        capitalPerPerson: summarize(final.map(row => row.capitalPerPerson)),
        householdNetWorthPerPerson: summarize(final.map(row => row.householdNetWorthPerPerson)),
        nationalNetWorthPerPerson: summarize(final.map(row => row.nationalNetWorthPerPerson)) })
    }
  }
  console.log(JSON.stringify({ ...provenance, schema: SCHEMA_VERSION, sample: 'accounting stress test; includes quarters after deposition', cases, ticks, failures, report }, null, 2))
  if (failures) process.exitCode = 1
}
void main().catch((error: unknown) => { console.error(error); process.exitCode = 1 })
