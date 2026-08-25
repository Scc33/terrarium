import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  countryFuzzArtifactFilename,
  writeCountryFuzzArtifact,
} from '../../packages/runner/src/country-fuzz-artifacts'
import { runCountryFuzzCase, sampleCountry } from '../../packages/runner/src/country-fuzz'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, {
    recursive: true,
    force: true,
  })))
})

function failureArtifact() {
  const outcome = runCountryFuzzCase(sampleCountry('recipe', 3, 'artifact-writer'), {
    ticks: 20,
    policy: 'passive',
    checkState: (state) => {
      if (state.meta.tick === 10) throw new Error('writer fixture')
    },
  })
  if (!outcome.failure) throw new Error('expected the writer fixture to fail')
  return outcome.failure
}

describe('country-fuzz artifacts', () => {
  it('ignores the CLI default artifact directory', async () => {
    const [gitignore, cli] = await Promise.all([
      readFile(resolve(process.cwd(), '.gitignore'), 'utf8'),
      readFile(resolve(process.cwd(), 'packages/runner/src/country-fuzz-cli.ts'), 'utf8'),
    ])
    const defaultOutput = cli.match(/arg\('output', '([^']+)'\)/)?.[1]

    expect(defaultOutput).toBeTruthy()
    expect(gitignore.split(/\r?\n/)).toContain(defaultOutput)
  })

  it('uses all artifact content to distinguish separate sweeps of one case', () => {
    const first = failureArtifact()
    const second = {
      ...first,
      requestedTicks: first.requestedTicks + 1,
    }

    expect(countryFuzzArtifactFilename(second)).not.toBe(countryFuzzArtifactFilename(first))
    expect(countryFuzzArtifactFilename(first)).toBe(countryFuzzArtifactFilename(failureArtifact()))
  })

  it('retains an identical artifact and refuses an occupied content address', async () => {
    const output = await mkdtemp(resolve(tmpdir(), 'terrarium-country-fuzz-'))
    temporaryDirectories.push(output)
    const artifact = failureArtifact()

    const first = await writeCountryFuzzArtifact(output, artifact)
    const second = await writeCountryFuzzArtifact(output, artifact)
    expect(first).toEqual({ path: second.path, created: true })
    expect(second.created).toBe(false)
    expect(JSON.parse(await readFile(first.path, 'utf8'))).toEqual(artifact)

    await writeFile(first.path, '{}\n', 'utf8')
    await expect(writeCountryFuzzArtifact(output, artifact)).rejects.toThrow(
      'refusing to overwrite a different country-fuzz artifact',
    )
  })
})
