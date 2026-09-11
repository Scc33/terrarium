/**
 * Golden replays: exact state hashes for fixed (country, seed, script)
 * triples. If a change moves these hashes, that is an economics review, not
 * a test failure to silence — run `pnpm diff-state` to see what moved, then
 * `pnpm bless` if the change is intentional.
 */

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createSave, hashState, replay, rngFor, TICK_ORDER } from '@terrarium/engine'
import { GOLDEN_CASES } from '../../tools/golden-cases'
import { resolveSpendingRules } from '../../packages/engine/src/state/spending'

const blessed = JSON.parse(
  readFileSync(new URL('../../packages/fixtures/golden/blessed.json', import.meta.url), 'utf-8'),
) as Record<string, { stateHash: string; realGdp: number; tick: number }>

describe('golden replays', () => {
  for (const c of GOLDEN_CASES) {
    it(`${c.name} matches its blessed hash`, () => {
      const s = replay(createSave(c.params, c.seed, c.script, c.ticks))
      const expected = blessed[c.name]
      if (process.env.CI && c.name === 'fuel-tax-40q') {
        const save = createSave(c.params, c.seed, c.script, c.ticks)
        console.info(
          `fuel-tax trace: ${Array.from({ length: c.ticks }, (_, tick) => hashState(replay(save, tick + 1))).join(',')}`,
        )
        let traced = replay(save, 36)
        console.info(`fuel-tax q36 start: ${hashState(traced)}`)
        for (const step of TICK_ORDER) {
          traced = step.run(traced, rngFor(traced.meta.seed, step.name, traced.meta.tick))
          console.info(`fuel-tax q36 ${step.name}: ${hashState(traced)}`)
        }
        traced = resolveSpendingRules(traced)
        console.info(`fuel-tax q36 resolved: ${hashState(traced)}`)
        const incremented = { ...traced, meta: { ...traced.meta, tick: traced.meta.tick + 1 } }
        console.info(`fuel-tax q36 incremented: ${hashState(incremented)}`)
        console.info(`fuel-tax q36 spending: ${JSON.stringify(traced.gov.dials.spending)}`)
        for (const [key, value] of Object.entries(traced)) {
          console.info(`fuel-tax q36 resolved ${key}: ${hashState(value)}`)
        }
      }
      expect(expected, `no blessed snapshot for ${c.name} — run pnpm bless`).toBeDefined()
      expect(s.meta.tick).toBe(expected.tick)
      expect(s.flows.realGdp).toBeCloseTo(expected.realGdp, 6)
      expect(hashState(s)).toBe(expected.stateHash)
    })
  }
})
