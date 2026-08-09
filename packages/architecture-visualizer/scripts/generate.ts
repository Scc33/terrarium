import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { analyzeRepo, findRepoRoot } from './analyze'

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const repoRoot = findRepoRoot(packageRoot)
const output = join(packageRoot, 'src/generated/architecture.ts')
const snapshot = analyzeRepo(repoRoot)
const source = `import type { ArchitectureSnapshot } from '../model'\n\n// Generated from the repository by scripts/generate.ts. Do not edit by hand.\nexport const architecture = ${JSON.stringify(snapshot, null, 2)} satisfies ArchitectureSnapshot\n`

mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, source)
process.stdout.write(
  `Scanned ${snapshot.modules.length} modules, ${snapshot.moduleEdges.length} imports, and ${snapshot.pipeline.length} pipeline steps.\n`,
)
