/**
 * The boot sequence's one exit that isn't a country.
 *
 * A save is a (params, seed, log) triple replayed from 1946, so a save written
 * before a params field existed reaches `init`, fails validation, and — before
 * this guard — left the splash screen up forever with the reason in the
 * console. The load-bearing test here is the LIVE one: the engine's real
 * refusal of a real pre-`education` vector, turned into a sentence. A hand-typed
 * error string would keep passing after the engine stopped producing it.
 */

import { describe, expect, it } from 'vitest'
import {
  END_OF_HISTORY_TICK,
  SCHEMA_VERSION,
  createCountryParams,
  createSave,
  init,
} from '@terrarium/engine'
import {
  looksLikeSave,
  replayWindow,
  saveSchema,
  unreadableSaveMessage,
} from '../../packages/ui/src/saveFile'

/** the autosave a browser was holding from before the education capacity */
function legacySave() {
  const params = createCountryParams('meridia', 'legacy')
  // the vector as it was written: the field simply did not exist yet
  delete (params.capacities as Partial<typeof params.capacities>).education
  const save = createSave(params, 'legacy', [], 40)
  return { ...save, version: { ...save.version, schema: 7 } }
}

describe('looksLikeSave', () => {
  it('accepts a save the engine just wrote', () => {
    expect(looksLikeSave(createSave(createCountryParams('meridia', 's'), 's', [], 12))).toBe(true)
  })

  it('accepts a save written before `mode` existed', () => {
    const preV21 = createSave(createCountryParams('meridia', 's'), 's', [], 12)
    delete preV21.mode
    expect(looksLikeSave(preV21)).toBe(true)
  })

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a string', 'autosave'],
    ['an object that is not a save', { hello: 'world' }],
    ['a save with no country', { params: null, seed: 's', actionLog: [], tick: 4 }],
    ['a save with no log', { params: {}, seed: 's', tick: 4 }],
    ['a save with a fractional tick', { params: {}, seed: 's', actionLog: [], tick: 4.5 }],
    ['a save with a negative tick', { params: {}, seed: 's', actionLog: [], tick: -1 }],
    ['a save with a NaN tick', { params: {}, seed: 's', actionLog: [], tick: NaN }],
  ])('refuses %s', (_label, value) => {
    expect(looksLikeSave(value)).toBe(false)
  })

  it('passes a legacy vector through — legality is the engine\'s call, not a shape check', () => {
    expect(looksLikeSave(legacySave())).toBe(true)
  })
})

describe('saveSchema', () => {
  it('reads the stamp a save was filed under', () => {
    expect(saveSchema(createSave(createCountryParams('meridia', 's'), 's', [], 0))).toBe(SCHEMA_VERSION)
  })

  it.each([
    ['an unstamped file', { params: {}, seed: 's', actionLog: [], tick: 0 }],
    ['a non-numeric stamp', { version: { schema: 'seven' } }],
    ['not an object at all', 'autosave'],
  ])('returns null for %s', (_label, value) => {
    expect(saveSchema(value)).toBeNull()
  })
})

describe('the appointment a save carries', () => {
  const withAppointment = (appointedAt: unknown) => ({
    ...createSave(createCountryParams('meridia', 'a'), 'a', [], 200, 'standard', 108),
    appointedAt,
  })

  it('accepts a save that omits it, because that is what 1946 looks like', () => {
    const preV28 = createSave(createCountryParams('meridia', 'a'), 'a', [], 40)
    delete preV28.appointedAt
    expect(looksLikeSave(preV28)).toBe(true)
  })

  it.each([
    ['a stringified quarter', '108'],
    ['null', null],
    ['a fraction', 108.5],
    ['a negative quarter', -4],
    ['NaN', Number.NaN],
  ])('refuses %s rather than quietly opening a 1946 posting', (_label, value) => {
    // `appointmentTick` turns anything it cannot read into quarter zero, so
    // without this gate a file naming 1973 opens 1946 — a different century
    // from the same country, seed and log, with nothing said about it
    expect(looksLikeSave(withAppointment(value))).toBe(false)
  })
})

describe('the replay window a save asks for', () => {
  const at = (tick: number, appointedAt?: number) => replayWindow({ tick, appointedAt })

  it('is the whole run for an ordinary save, whenever its government arrived', () => {
    expect(at(40)).toMatchObject({ until: 40, appointedAt: 0, conflict: null })
    // a save from before v28 names no appointment at all, and means 1946
    expect(at(120, undefined).appointedAt).toBe(0)
    // and a later posting saved after it took office is perfectly ordinary
    expect(at(150, 108)).toMatchObject({ until: 150, appointedAt: 108, conflict: null })
    // including the quarter it took office on
    expect(at(108, 108).conflict).toBeNull()
  })

  it('stops at the end of history, so a hand-edited tick cannot hang the tab', () => {
    expect(at(9000).until).toBe(END_OF_HISTORY_TICK)
  })

  it('refuses a run that stopped before its own government took office', () => {
    // replaying it would hand back an INTERREGNUM as a playable game: orders
    // quoted at their real price and charged nothing, no election, no
    // deposition — `unlimitedCapital` by hand edit, for 136 quarters
    const { conflict } = at(100, 236)
    expect(conflict).not.toBeNull()
    expect(conflict).toContain('100')
    expect(conflict).toContain('236')
    // and it reaches the player as a refusal, not as a repair
    expect(unreadableSaveMessage(createSave(createCountryParams('meridia', 'x'), 'x', [], 100, 'standard', 236), conflict!))
      .toContain('does not take office until')
  })
})

describe('the refusal a player reads', () => {
  it('names the field the engine actually refused', () => {
    const save = legacySave()
    let reason: string | null = null
    try {
      init(save.params, save.seed, 'standard')
    } catch (e) {
      reason = e instanceof Error ? e.message : String(e)
    }
    expect(reason, 'the engine accepted a vector with no education capacity').not.toBeNull()

    const message = unreadableSaveMessage(save, reason ?? '')
    expect(message).toContain('capacities.education')
    // provenance, so the player can tell "this is old" from "this is broken"
    expect(message).toContain('schema 7')
    expect(message).toContain(String(SCHEMA_VERSION))
  })

  it('still says something useful when the file carries no stamp', () => {
    const message = unreadableSaveMessage({ params: {}, seed: 's', actionLog: [], tick: 0 }, 'openness is undefined')
    expect(message).toContain('no schema stamp')
    expect(message).toContain('openness is undefined')
  })

  it('distinguishes a file from a newer build', () => {
    const message = unreadableSaveMessage({ version: { schema: SCHEMA_VERSION + 5 } }, 'unknown lever')
    expect(message).toContain('newer than this build')
  })
})
