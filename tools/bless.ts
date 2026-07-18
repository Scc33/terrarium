/**
 * Re-bless golden snapshots after intentional engine changes:
 *   pnpm bless
 * Review `pnpm diff-state` output first — the diff review IS the economics
 * review.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSave, hashState, replay, stableStringify } from '@terrarium/engine'
import { GOLDEN_CASES } from './golden-cases'

const hashes: Record<string, { stateHash: string; realGdp: number; tick: number }> = {}
const fullStates: Record<string, unknown> = {}
for (const c of GOLDEN_CASES) {
  const s = replay(createSave(c.params, c.seed, c.script, c.ticks))
  hashes[c.name] = { stateHash: hashState(s), realGdp: s.flows.realGdp, tick: s.meta.tick }
  fullStates[c.name] = JSON.parse(stableStringify(s))
  console.log(`${c.name}: hash=${hashes[c.name].stateHash} realGdp=${s.flows.realGdp.toFixed(3)}`)
}

const goldenDir = join(dirname(fileURLToPath(import.meta.url)), '../packages/fixtures/golden')
mkdirSync(goldenDir, { recursive: true })
writeFileSync(join(goldenDir, 'blessed.json'), JSON.stringify(hashes, null, 2) + '\n')
writeFileSync(join(goldenDir, 'blessed-states.json'), JSON.stringify(fullStates) + '\n')
console.log(`blessed → ${goldenDir}`)
