import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { CountryFuzzArtifact } from './country-fuzz'

export interface WrittenCountryFuzzArtifact {
  path: string
  created: boolean
}

function artifactIdentity(artifact: CountryFuzzArtifact): { kind: string; tick: number } {
  return artifact.format === 'terrarium-country-fuzz-failure'
    ? artifact.failure
    : artifact.finding
}

/** Content addressing keeps different sweeps of the same sample from
 * overwriting one another. The exclusive write below still refuses the
 * (extremely unlikely) truncated-hash collision. */
export function countryFuzzArtifactFilename(artifact: CountryFuzzArtifact): string {
  const identity = artifactIdentity(artifact)
  const digest = createHash('sha256').update(JSON.stringify(artifact)).digest('hex').slice(0, 16)
  return `${artifact.sample.caseId}-${identity.kind}-q${identity.tick}-${digest}.json`
}

export async function writeCountryFuzzArtifact(
  output: string,
  artifact: CountryFuzzArtifact,
): Promise<WrittenCountryFuzzArtifact> {
  await mkdir(output, { recursive: true })
  const path = resolve(output, countryFuzzArtifactFilename(artifact))
  const contents = `${JSON.stringify(artifact, null, 2)}\n`
  try {
    await writeFile(path, contents, { encoding: 'utf8', flag: 'wx' })
    return { path, created: true }
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error
    const existing = await readFile(path, 'utf8')
    if (existing !== contents) {
      throw new Error(`refusing to overwrite a different country-fuzz artifact at ${path}`, {
        cause: error,
      })
    }
    return { path, created: false }
  }
}
