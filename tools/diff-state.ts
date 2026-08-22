/**
 * Show which variables moved between the blessed golden states and the
 * current engine's replay of the same cases — and by how much:
 *   pnpm diff-state [caseName] [--moved-only] [--top N]
 *
 * This review IS the economics review (see CLAUDE.md), so it has to keep
 * working on the milestones that matter most. A schema-ADDING milestone breaks
 * it by default: every new field diffs as "didn't exist → has a value", which
 * sorts as an infinite relative change and crowds the genuinely moved economy
 * out of the top of the list. The first politics schema added ~2 300 such fields and the entire
 * visible diff was new-field noise.
 *
 * So `--moved-only` hides fields that are new, showing just the variables that
 * existed before and changed — which is the question you are actually asking
 * before you bless.
 */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSave, replay, stableStringify } from '@terrarium/engine'
import { GOLDEN_CASES } from './golden-cases'

function flatten(obj: unknown, prefix = '', out: Map<string, number> = new Map()): Map<string, number> {
  if (typeof obj === 'number') {
    out.set(prefix, obj)
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out))
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out)
  }
  return out
}

const goldenDir = join(dirname(fileURLToPath(import.meta.url)), '../packages/fixtures/golden')
const blessedStates = JSON.parse(
  readFileSync(join(goldenDir, 'blessed-states.json'), 'utf-8'),
) as Record<string, unknown>

const args = process.argv.slice(2)
const movedOnly = args.includes('--moved-only')
const topIdx = args.indexOf('--top')
const top = topIdx >= 0 ? Number(args[topIdx + 1]) : 40
const filter = args.find((a) => !a.startsWith('--') && a !== args[topIdx + 1])

for (const c of GOLDEN_CASES) {
  if (filter && c.name !== filter) continue
  const old = blessedStates[c.name]
  if (!old) {
    console.log(`${c.name}: no blessed state — run pnpm bless first`)
    continue
  }
  const now = replay(createSave(c.params, c.seed, c.script, c.ticks))
  const a = flatten(old)
  const b = flatten(JSON.parse(stableStringify(now)))
  const diffs: Array<{ path: string; from: number; to: number; rel: number }> = []
  let added = 0
  for (const [k, vNew] of b) {
    const vOld = a.get(k)
    if (vOld === undefined) {
      added++
      if (!movedOnly) diffs.push({ path: k, from: NaN, to: vNew, rel: Infinity })
    } else if (vOld !== vNew) {
      const rel = Math.abs(vNew - vOld) / Math.max(Math.abs(vOld), 1e-9)
      diffs.push({ path: k, from: vOld, to: vNew, rel })
    }
  }
  diffs.sort((x, y) => y.rel - x.rel)
  const note = movedOnly && added > 0 ? ` (+${added} new fields hidden)` : ''
  console.log(`\n=== ${c.name}: ${diffs.length} values moved${note} ===`)
  for (const d of diffs.slice(0, top)) {
    const fmt = (x: number) => (Number.isFinite(x) ? x.toPrecision(6) : String(x))
    console.log(`  ${d.path.padEnd(52)} ${fmt(d.from)} → ${fmt(d.to)}  (${(d.rel * 100).toFixed(2)}%)`)
  }
  if (diffs.length > top) console.log(`  … and ${diffs.length - top} more (--top N to see them)`)
  if (diffs.length === 0) console.log('  identical — hash should match blessed.json')
}
