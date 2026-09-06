/**
 * Redraw the map, or prove the drawn one is still the territory.
 *
 * `scan` writes the snapshot; `--check` writes nothing and fails if a fresh
 * scan disagrees with the checked-in one. CI runs the second, because the
 * snapshot is now a build input of the game (ADR-0037) — a stale map does not
 * announce itself, it just quietly describes a repository that no longer
 * exists, and that is the failure mode the issue behind this was reporting.
 *
 * The comparison normalizes `revision` away, and it has to. The field records
 * the commit the map was drawn at, so it is one commit behind by construction:
 * the commit that lands a rescan cannot contain its own hash. Compared
 * literally, the check would fail on every commit and mean nothing.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { analyzeRepo, findRepoRoot } from './analyze'

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const repoRoot = findRepoRoot(packageRoot)
const output = join(packageRoot, 'src/generated/architecture.ts')
const snapshot = analyzeRepo(repoRoot)
const source = `import type { ArchitectureSnapshot } from '../model'\n\n// Generated from the repository by scripts/generate.ts. Do not edit by hand.\nexport const architecture = ${JSON.stringify(snapshot, null, 2)} satisfies ArchitectureSnapshot\n`

const scanned = `Scanned ${snapshot.modules.length} modules, ${snapshot.moduleEdges.length} imports, and ${snapshot.pipeline.length} pipeline steps.`
const withoutRevision = (text: string) => text.replace(/"revision": "[^"]*"/, '"revision": "-"')

if (process.argv.includes('--check')) {
  const current = existsSync(output) ? readFileSync(output, 'utf8') : ''
  if (withoutRevision(current) === withoutRevision(source)) {
    process.stdout.write(`${scanned} The checked-in architecture map is current.\n`)
  } else {
    process.stderr.write(
      `${scanned}\nThe architecture map is out of date: ${relative(repoRoot, output)} no longer describes this repository.\nRun \`pnpm architecture:scan\` and commit the result.\n`,
    )
    process.exit(1)
  }
} else {
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, source)
  process.stdout.write(`${scanned}\n`)
}
