/**
 * The checkable half of the documentation. Guidance is layered (#232): a short
 * root `AGENTS.md` loaded on every task, nested guides loaded when their
 * subtree is touched, and a `CLAUDE.md` beside each that is exactly
 * `@AGENTS.md`. The root went from 13 KB to 75 KB between the proposal and
 * this test — past the 32 KiB Codex composes at all — so the budget is a test.
 * The architecture doc hand-copies `TICK_ORDER` and was one step short for
 * twelve schema versions (#233); the manual's copy is pinned the same way in
 * `tests/ui/manual.test.ts`.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { TICK_ORDER } from '../../packages/engine/src/pipeline/pipeline'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const SKIP = new Set(['node_modules', 'dist', 'coverage', 'test-results'])

function guides(dir = ROOT): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    // dot-directories hold worktrees and skill symlinks, not guidance
    const skip = SKIP.has(entry.name) || entry.name.startsWith('.')
    if (entry.isDirectory() && !skip) found.push(...guides(join(dir, entry.name)))
    else if (entry.name === 'AGENTS.md') found.push(relative(ROOT, dir) || '.')
  }
  return found.sort()
}

const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')

describe('agent guidance', () => {
  const scopes = guides()

  it('is the root plus the guides the root routes to', () => {
    expect(scopes).toEqual(['.', 'packages/engine', 'packages/ui'])
    for (const scope of scopes.slice(1)) expect(read('AGENTS.md')).toContain(`${scope}/AGENTS.md`)
  })

  it.each(scopes)('%s/CLAUDE.md is exactly the import', (scope) => {
    expect(read(join(scope, 'CLAUDE.md'))).toBe('@AGENTS.md\n')
  })

  it('stays inside the budget every task pays for', () => {
    const root = Buffer.byteLength(read('AGENTS.md'))
    expect(root).toBeLessThanOrEqual(8 * 1024)
    for (const scope of scopes.slice(1)) {
      expect(root + Buffer.byteLength(read(join(scope, 'AGENTS.md')))).toBeLessThanOrEqual(16 * 1024)
    }
  })
})

describe('tech-architecture.md', () => {
  it('lists the pipeline in the engine’s own order', () => {
    const rows = [...read('docs/tech-architecture.md').matchAll(/^\| (\d+) \| `(\w+)` \|/gm)]
    expect(rows.map(([, n, name]) => `${n} ${name}`)).toEqual(
      TICK_ORDER.map((step, i) => `${i + 1} ${step.name}`),
    )
  })
})
