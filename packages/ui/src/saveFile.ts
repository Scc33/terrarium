/**
 * Whether a save this browser is still holding can be opened, and what to say
 * when it can't.
 *
 * A save is a (params, seed, log) triple the engine replays from 1946, so an
 * old one opens exactly when today's engine still accepts its params vector.
 * Often it does — most schema bumps add to TrueState, which a save never
 * carries — so refusing everything below `SCHEMA_VERSION` would throw away runs
 * that would have loaded fine. The gate is therefore the engine's own verdict:
 * attempt the load, and turn a refusal into a sentence.
 *
 * This is deliberately NOT a rescue. Filling a capacity the vector lacks with
 * today's default opens *a* country, not *the* one that was saved — same name,
 * same seed, and a different century from the first quarter on. An honest
 * refusal costs the player the run; a silent repair costs them the run and
 * doesn't mention it.
 *
 * The failure that made this necessary: an autosave written before the
 * `education` capacity existed reached `init`, which validates params, threw
 * `capacities.education is undefined`, and left the boot screen reading DRAWING
 * THE FIRST SURVEY forever with the reason in the console. A save this build
 * can't read has to end at the posting room, not at devtools.
 */

import {
  appointmentTick,
  END_OF_HISTORY_TICK,
  SCHEMA_VERSION,
  type SaveFile,
} from '@terrarium/engine'

/**
 * A structural check, not a validation: is this thing shaped enough like a save
 * to be worth handing to the engine? Whether the country inside it is legal is
 * the engine's call and nobody else's — this only filters what a key collision,
 * a half-written record, or a hand-edited file can leave in the store.
 */
export function looksLikeSave(value: unknown): value is SaveFile {
  if (typeof value !== 'object' || value === null) return false
  const save = value as Partial<SaveFile>
  return (
    typeof save.params === 'object' &&
    save.params !== null &&
    typeof save.seed === 'string' &&
    Array.isArray(save.actionLog) &&
    typeof save.tick === 'number' &&
    Number.isInteger(save.tick) &&
    save.tick >= 0
  )
}

/**
 * The window a save is to be replayed over, and whether its own two replay
 * inputs can both be true.
 *
 * Both numbers are clamped where the engine clamps them: history ends at 416
 * whatever `tick` says (an unbounded `while` on a hand-edited quarter is a hung
 * tab), and an appointment is clamped by `appointmentTick`. Derived here, once,
 * so the worker cannot drift from the check.
 *
 * The conflict this catches is `appointedAt > until`: a run that stopped BEFORE
 * its own government took office. Replaying one hands back an interregnum as a
 * playable game — the political clock frozen, no election, no deposition, and
 * every order quoted at its real price and then charged nothing, which is
 * `unlimitedCapital` by hand edit for as many quarters as the gap. It is
 * refused rather than repaired for this file's usual reason: moving either
 * number opens *a* run, not *the* one that was saved.
 */
export function replayWindow(save: { tick: number; appointedAt?: number }): {
  until: number
  appointedAt: number
  conflict: string | null
} {
  const until = Math.min(save.tick, END_OF_HISTORY_TICK)
  const appointedAt = appointmentTick(save.appointedAt ?? 0)
  return {
    until,
    appointedAt,
    conflict:
      appointedAt > until
        ? `the run was saved at quarter ${until} but its government does not take office until ${appointedAt}`
        : null,
  }
}

/** The schema a save was filed under, or null if it doesn't say. */
export function saveSchema(value: unknown): number | null {
  if (typeof value !== 'object' || value === null) return null
  const version = (value as { version?: unknown }).version
  if (typeof version !== 'object' || version === null) return null
  const schema = (version as { schema?: unknown }).schema
  return typeof schema === 'number' && Number.isFinite(schema) ? schema : null
}

/** Where the file came from, said in a clause — the part a player can act on
 * ("this is old, not broken") without reading the engine's complaint. */
function provenance(schema: number | null): string {
  if (schema === null) return 'It carries no schema stamp'
  if (schema < SCHEMA_VERSION) return `It was filed under schema ${schema}; this build reads ${SCHEMA_VERSION}`
  if (schema > SCHEMA_VERSION) return `It was filed under schema ${schema}, which is newer than this build's ${SCHEMA_VERSION}`
  return `It was filed under schema ${schema}, the schema this build reads`
}

/**
 * One sentence for the posting room, and the same one for the control rail when
 * an imported file is refused mid-run. The engine's own words are kept at the
 * end rather than dropped: they are the only thing that identifies WHICH field
 * a bug report should be about.
 */
export function unreadableSaveMessage(save: unknown, reason: string): string {
  return `That saved run could not be reopened. ${provenance(saveSchema(save))} — the engine refused it: ${reason}`
}
