import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))
const ROOT_MAX_BYTES = 8 * 1024
const CHAIN_MAX_BYTES = 16 * 1024
const SKIP_DIRECTORIES = new Set(['.git', 'coverage', 'dist', 'node_modules'])

const SCOPES = [
  '.',
  'packages/engine',
  'packages/observation',
  'packages/ui',
  'packages/runner',
  'tests',
  'docs',
] as const

function guidance(scope: (typeof SCOPES)[number]): string {
  return readFileSync(join(REPO_ROOT, scope, 'AGENTS.md'), 'utf8')
}

function discoverScopes(filename: string, directory = REPO_ROOT): string[] {
  const scopes: string[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !SKIP_DIRECTORIES.has(entry.name)) {
      scopes.push(...discoverScopes(filename, join(directory, entry.name)))
    } else if (entry.isFile() && entry.name === filename) {
      scopes.push(relative(REPO_ROOT, directory).replaceAll('\\', '/') || '.')
    }
  }
  return scopes.sort()
}

describe('the scoped agent-guidance contract (ADR-0012)', () => {
  it('enumerates every canonical scope and no committed overrides', () => {
    expect(discoverScopes('AGENTS.md')).toEqual([...SCOPES].sort())
    expect(discoverScopes('AGENTS.override.md')).toEqual([])
  })

  for (const scope of SCOPES) {
    it(`${scope} has one canonical guide and a minimal Claude wrapper`, () => {
      const agents = guidance(scope)
      const claude = readFileSync(join(REPO_ROOT, scope, 'CLAUDE.md'), 'utf8')

      expect(agents.trim().length).toBeGreaterThan(0)
      expect(claude).toBe('@AGENTS.md\n')
      expect(existsSync(join(REPO_ROOT, scope, 'AGENTS.override.md'))).toBe(false)
    })
  }

  it('keeps the always-loaded root guide below its budget', () => {
    expect(Buffer.byteLength(guidance('.'))).toBeLessThanOrEqual(ROOT_MAX_BYTES)
  })

  for (const scope of SCOPES.slice(1)) {
    it(`keeps the root-to-${scope} instruction chain below its budget`, () => {
      const bytes = Buffer.byteLength(guidance('.')) + Buffer.byteLength(guidance(scope))
      expect(bytes).toBeLessThanOrEqual(CHAIN_MAX_BYTES)
    })
  }
})
