/**
 * The dev console must not exist in a production build.
 *
 * This is not tidiness. The true-state inspector serializes `TrueState` and
 * posts it to the UI — the one thing ADR-0004 exists to prevent. That is
 * acceptable in a dev build and unacceptable in a shipped one, and the entire
 * difference is a handful of `import.meta.env.DEV` guards that a well-meaning
 * refactor could rearrange without any other test noticing.
 *
 * So: build the app for production and read the bundle. This is the only test
 * in the suite that asserts on build output, because it is the only claim that
 * is about the bundler rather than the code.
 */

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

const repo = fileURLToPath(new URL('../..', import.meta.url))
const dist = join(repo, 'packages/ui/dist')

/** every emitted asset, concatenated — the bundle as a player receives it */
function bundleText(): string {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    )
  return walk(dist)
    .filter((f) => /\.(js|html|css)$/.test(f))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n')
}

describe('the production build strips the dev console', () => {
  let bundle = ''

  beforeAll(() => {
    rmSync(dist, { recursive: true, force: true })
    execFileSync('pnpm', ['--filter', '@terrarium/ui', 'build'], { cwd: repo, stdio: 'pipe' })
    bundle = bundleText()
  }, 120_000)

  it('builds something to inspect at all', () => {
    // guards against the test passing vacuously because the build silently
    // produced nothing — every assertion below is an absence check
    expect(bundle.length).toBeGreaterThan(10_000)
    expect(bundle).toContain('MINISTRY OF NATIONAL ECONOMY')
  })

  it.each([
    ['dev:scenario', 'the scenario request message'],
    ['dev:inspect', 'the truth request message'],
    ['dev:truth', 'the true-state reply message'],
    ['DEV CONSOLE', 'the panel chrome'],
    ['RUN SCENARIO', 'the panel controls'],
    ['applyScenario', 'the scenario builder'],
    ['populationScale', 'a scenario-only field name'],
  ])('drops %s (%s)', (needle) => {
    expect(bundle).not.toContain(needle)
  })

  it('ships no true-state serializer in the worker', () => {
    // `toTree` is the function that turns TrueState into something postable.
    // If this string is ever present, truth can cross the wire in production.
    expect(bundle).not.toContain('toTree')
  })
})
