/**
 * The premise `pnpm replay` rests on, and the decisions it makes before it
 * ever reaches the engine.
 *
 * The tool reads a real game back through `runOne`, because that is what hands
 * it a per-quarter observer, a skip count and counterfactual policies on the
 * same seed. `replay()` is what the game itself loads a save with. If the two
 * diverge — a missing `appointedAt`, a different action order, a step run in
 * the wrong place — every number the tool prints is about a country the player
 * never governed, and it would print them just as confidently. A state hash is
 * the only check that sees all of it.
 *
 * The rest of this file exists because the first version of the tool put its
 * argument parsing, arm selection and ceiling arithmetic in the CLI body where
 * no test could reach them, and review found four bugs in exactly that half.
 * Each `it` below is one of them.
 */

import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  END_OF_HISTORY_TICK,
  LAST_APPOINTMENT_TICK,
  createCountryParams,
  createSave,
  hashState,
  replay,
  type Action,
  type ActionLog,
  type SaveFile,
} from '../../packages/engine/src/index'
import { RESEARCH_STOCK_DECAY_Q } from '../../packages/engine/src/constants'
import { runOne } from '../../packages/runner/src/run'
import {
  ARM_IDS,
  loadSave,
  parseArgs,
  planReplay,
  technologyCeiling,
} from '../../tools/replay-save'

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

  it("lenient: 'turn' discards the whole turn, the way the game's loader does", () => {
    // The loader catches around one `applyActions` per turn, so an order this
    // build refuses takes its turn's siblings with it. Per-action leniency
    // keeps them, which would report a country the game would not open.
    const seed = 'turn-atomic'
    const params = createCountryParams('meridia', seed)
    const illegal: ActionLog = [
      {
        tick: 4,
        actions: [
          { kind: 'investCapacity', target: 'statistical', amount: 3 },
          // a share above 1 is refused by `setSpendingRule` at any balance
          { kind: 'setSpendingRule', programme: 'research', mode: 'gdpShare', value: 5 },
        ] as Action[],
      },
    ]
    const common = { seed, ticks: 24, params, script: illegal, includeStateHash: false } as const
    const perAction = runOne({ ...common, lenient: true })
    const perTurn = runOne({ ...common, lenient: 'turn' })

    expect(perAction.illegalActionsSkipped).toBe(1)
    expect(perTurn.illegalActionsSkipped).toBe(2)
    // the surviving sibling is what separates them
    expect(hashState(perTurn.finalState)).not.toBe(hashState(perAction.finalState))
    expect(perTurn.finalState.gov.capacity.statistical)
      .toBeLessThan(perAction.finalState.gov.capacity.statistical)
  })
})

describe('parsing the command line', () => {
  it('finds the file after a flag that takes a separate value', () => {
    // `--every 20 save.json` used to read `20` as the filename and then blame
    // the file for not existing.
    expect(parseArgs(['--every', '20', 'run.json']).file).toBe('run.json')
    expect(parseArgs(['--arms', 'log', 'run.json']).file).toBe('run.json')
    expect(parseArgs(['--csv', 'out.csv', 'run.json']).csvPath).toBe('out.csv')
    expect(parseArgs(['run.json', '--every', '20']).every).toBe(20)
    expect(parseArgs(['--every=20', 'run.json']).every).toBe(20)
  })

  it('always leads with the played arm, whatever order was asked for', () => {
    // The report reads its subject BY ID now, but the table order is still
    // the reading order, and `--arms passive,log` used to label the passive
    // century as the played one.
    expect(parseArgs(['--arms', 'passive,log', 'run.json']).arms).toEqual(['log', 'passive'])
    expect(parseArgs(['--arms', 'maximal', 'run.json']).arms).toEqual(['log', 'maximal'])
    expect(parseArgs(['run.json']).arms).toEqual([...ARM_IDS])
  })

  it('names an unknown arm instead of dropping it', () => {
    // A silently dropped typo finishes successfully with the comparison the
    // experiment was asking for simply absent.
    expect(() => parseArgs(['--arms', 'log,developmntal', 'run.json'])).toThrow(/developmntal/)
  })

  it('refuses a missing file and a nonsense --every', () => {
    expect(() => parseArgs([])).toThrow(/usage/)
    expect(() => parseArgs(['--every', '0', 'run.json'])).toThrow(/--every/)
  })
})

describe('what a save may legally be asked for', () => {
  const params = createCountryParams('meridia', 'plan')
  const save = (tick: number, appointedAt: number): SaveFile =>
    createSave(params, 'plan', [], tick, 'standard', appointedAt)

  it('refuses a save that stopped before its own government took office', () => {
    // `replay()` enforces this itself; the tool reaches `runOne` instead, so
    // without the check it reports an interregnum as a played game.
    expect(() => planReplay(save(40, 108), null)).toThrow(/does not take office/)
  })

  it('refuses a horizon past the save\'s own record', () => {
    expect(() => planReplay(save(160, 0), 400)).toThrow(/past the save's own record/)
    expect(planReplay(save(160, 0), 80).ticks).toBe(80)
    expect(planReplay(save(160, 0), null).ticks).toBe(160)
  })

  it('normalizes the appointment the way init does', () => {
    // An out-of-range appointment is clamped by `init`, so a raw value used to
    // filter the caretaker log would split it at a quarter that never existed.
    const beyond = { ...save(END_OF_HISTORY_TICK, 0), appointedAt: 10_000 }
    expect(planReplay(beyond, null).appointedAt).toBe(LAST_APPOINTMENT_TICK)
  })
})

describe('reading the file', () => {
  it('reads a save file or a data export that wraps one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'replay-save-'))
    const file = createSave(createCountryParams('meridia', 'io'), 'io', [], 8)
    const savePath = join(dir, 'save.json')
    const exportPath = join(dir, 'export.json')
    writeFileSync(savePath, JSON.stringify(file))
    writeFileSync(exportPath, JSON.stringify({ format: 'terrarium-published-history', run: file }))
    expect(loadSave(savePath).seed).toBe('io')
    expect(loadSave(exportPath).seed).toBe('io')

    const notASave = join(dir, 'nope.json')
    writeFileSync(notASave, JSON.stringify({ hello: 'world' }))
    expect(() => loadSave(notASave)).toThrow(/neither a save file nor/)
  })
})

describe('the technology ceiling', () => {
  it('rises when the country has a research programme running', () => {
    // The engine scales its research catch-up term by `catchupBySector`, which
    // only fades at the frontier itself — so a fixed point that drops the term
    // is a zero-research bound, and it is biased in the direction that makes a
    // run look like it still has headroom.
    const seed = 'tech-ceiling'
    const funded = runOne({
      seed,
      ticks: 240,
      params: createCountryParams('meridia', seed),
      policy: (_state, _rng, tick) =>
        tick % 8 === 0
          ? [
              { kind: 'investCapacity', target: 'education', amount: 2 },
              { kind: 'setSpendingRule', programme: 'research', mode: 'gdpShare', value: 0.04 },
            ]
          : [],
      includeStateHash: false,
    })
    const withResearch = technologyCeiling(funded.finalState)
    expect(funded.finalState.tech.researchStock * RESEARCH_STOCK_DECAY_Q).toBeGreaterThan(0)

    const noResearch = technologyCeiling({
      ...funded.finalState,
      tech: { ...funded.finalState.tech, researchStock: 0 },
    })
    expect(withResearch.resting).toBeGreaterThan(noResearch.resting)
    // and both are still ratios below one — a resting point, not a clamp
    expect(withResearch.resting).toBeLessThan(1)
    expect(noResearch.resting).toBeGreaterThan(0.5)
  })
})
