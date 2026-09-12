/**
 * Golden replays: exact state hashes for fixed (country, seed, script)
 * triples. If a change moves these hashes, that is an economics review, not
 * a test failure to silence — run `pnpm diff-state` to see what moved, then
 * `pnpm bless` if the change is intentional.
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createSave, hashState, replay } from '@terrarium/engine'
import { GOLDEN_CASES } from '../../tools/golden-cases'

const blessed = JSON.parse(
  readFileSync(new URL('../../packages/fixtures/golden/blessed.json', import.meta.url), 'utf-8'),
) as Record<string, { stateHash: string; realGdp: number; tick: number }>

describe('golden replays', () => {
  for (const c of GOLDEN_CASES) {
    it(`${c.name} matches its blessed hash`, () => {
      const s = replay(createSave(c.params, c.seed, c.script, c.ticks))
      const expected = blessed[c.name]
      expect(expected, `no blessed snapshot for ${c.name} — run pnpm bless`).toBeDefined()
      expect(s.meta.tick).toBe(expected.tick)
      expect(s.flows.realGdp).toBeCloseTo(expected.realGdp, 6)
      expect(hashState(s)).toBe(expected.stateHash)
    })
  }
})
