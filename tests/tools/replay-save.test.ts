/**
 * The premise `pnpm replay` rests on: the runner's loop and the engine's own
 * `replay()` produce the SAME century from the same save.
 *
 * The tool reads a real game back through `runOne`, because that is what hands
 * it a per-quarter observer, a lenient skip count and counterfactual policies
 * on the same seed. `replay()` is what the game itself loads a save with. If
 * the two ever diverge — a missing `appointedAt`, a different action order, a
 * step run in the wrong place — every number the tool prints is about a
 * country the player never governed, and it would print them just as
 * confidently. A state hash is the only check that sees all of it.
 */

import { describe, expect, it } from 'vitest'
import {
  createCountryParams,
  createSave,
  hashState,
  replay,
  type Action,
  type ActionLog,
} from '../../packages/engine/src/index'
import { runOne } from '../../packages/runner/src/run'

const script: ActionLog = [
  {
    tick: 4,
    actions: [
      { kind: 'investCapacity', target: 'statistical', amount: 3 },
      { kind: 'investCapacity', target: 'education', amount: 3 },
    ] as Action[],
  },
  {
    tick: 12,
    actions: [
      { kind: 'setDial', path: 'taxRates.income', value: 0.22 },
      { kind: 'enact', statute: 'compulsory_schooling', level: 1 },
    ] as Action[],
  },
  { tick: 40, actions: [{ kind: 'investCapacity', target: 'administrative', amount: 8 }] as Action[] },
]

describe('replaying a save on the runner', () => {
  it.each([0, 108])('matches the engine replay from an appointment at %i', (appointedAt) => {
    const seed = 'replay-parity'
    const params = createCountryParams('meridia', seed)
    const ticks = 160
    const save = createSave(params, seed, script, ticks, 'standard', appointedAt)

    const fromEngine = replay(save)
    const fromRunner = runOne({
      seed,
      ticks,
      params,
      script,
      rules: save.rules,
      appointedAt,
      lenient: false,
      includeStateHash: false,
    })

    expect(hashState(fromRunner.finalState)).toBe(hashState(fromEngine))
  })

  it('scores a different country when the appointment is dropped', () => {
    // The guard on the test above: an interregnum is not cosmetic, so a tool
    // that forgot to pass it would fail the parity check rather than quietly
    // report on a 1946 posting.
    const seed = 'replay-parity'
    const params = createCountryParams('meridia', seed)
    const save = createSave(params, seed, script, 160, 'standard', 108)
    const ignoringAppointment = runOne({
      seed,
      ticks: 160,
      params,
      script,
      rules: save.rules,
      lenient: false,
      includeStateHash: false,
    })
    expect(hashState(ignoringAppointment.finalState)).not.toBe(hashState(replay(save)))
  })
})
