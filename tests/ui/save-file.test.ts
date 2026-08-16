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
import { SCHEMA_VERSION, createCountryParams, createSave, init } from '@terrarium/engine'
import { looksLikeSave, saveSchema, unreadableSaveMessage } from '../../packages/ui/src/saveFile'

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
