/**
 * Filing: turning an `EventId` into the `NewsItem` that goes into the save.
 *
 * A pipeline step says WHAT happened and stops there:
 *
 *     news.push(fileDispatch(state, 'drought_onset'))
 *
 * Everything else — which era's wording, which of that era's variants, which
 * masthead carried it, what desk it belongs on — is resolved here off the
 * catalogue. That is the whole of the extension story: a new event is an id,
 * a catalogue entry, and one call.
 *
 * ## The RNG rule, which is not optional
 *
 * Variant and masthead are drawn from `obs:news:*` substreams, orthogonal to
 * every economic stream (ADR-0002) — the same discipline the statistical
 * office's fog uses, and for the same reason: choosing different words must
 * never move the economy. A step that draws from its OWN rng to pick prose
 * has made the century a function of the copy, and rewording a headline then
 * rewrites the country. `pipeline/technology.ts` had exactly that shape, and
 * the phantom draw it now keeps is the seam where it was removed.
 *
 * The substream is keyed by event id AND tick, so two events filed in the
 * same quarter pick independently, and re-filing the same event in the same
 * quarter is idempotent.
 */

import { PRESS_CAPTURED_AT } from '../constants'
import { rngFor, type Seed } from '../rng/rng'
import type { NewsItem, TrueState } from '../state/schema'
import { EVENT_CATALOGUE, type Dispatch, type EventDef } from './catalogue'
import { eraAtTick, eraOrdinal, OUTLETS, PRESS_ERAS, type PressEraId } from './eras'
import type { DeskId, EventId } from './ids'

/**
 * The copy in force for an event in a given era.
 *
 * Walks BACKWARDS from the era on the streets to the first one, taking the
 * most recent override and falling through to `dispatches` if there is none.
 * That is what lets an event be given a nineteen-seventies voice without
 * anyone having to write it five more times for the eras after — and what
 * makes it impossible to leave an era with no copy at all.
 */
export function dispatchesFor(def: EventDef, era: PressEraId): Dispatch[] {
  if (def.byEra) {
    for (let i = eraOrdinal(era); i >= 0; i--) {
      const inherited = def.byEra[PRESS_ERAS[i].id]
      if (inherited && inherited.length > 0) return inherited
    }
  }
  return def.dispatches
}

/**
 * Which masthead carried it. Sealed into the item, never recomputed: the
 * paper that printed a story in 1958 is not the paper on the desk now, and an
 * archive that restated every back number in the current press's voice would
 * quietly erase the years the government owned the presses.
 */
export function outletFor(
  era: PressEraId,
  desk: DeskId,
  press: number,
  roll: number,
): string {
  const roster = OUTLETS[era]
  const titles =
    press < PRESS_CAPTURED_AT ? roster.official : (roster.byDesk?.[desk] ?? roster.independent)
  return titles[Math.min(Math.floor(roll * titles.length), titles.length - 1)]
}

/** The substream a dispatch's wording is drawn from. Exported so a test can
 * reproduce a filing without running a century to reach it. */
export const dispatchRng = (seed: Seed, event: EventId, tick: number) =>
  rngFor(seed, `obs:news:${event}`, tick)

/**
 * File one event as this quarter's dispatch.
 *
 * Reads only `meta.tick`, `meta.seed` and the press-freedom stock, so it is
 * safe to call from any step at any point in the tick — including from
 * `applyActions`, before the pipeline has run at all.
 */
export function fileDispatch(state: TrueState, event: EventId): NewsItem {
  const def = EVENT_CATALOGUE[event]
  const tick = state.meta.tick
  const era = eraAtTick(tick)
  const rng = dispatchRng(state.meta.seed, event, tick)
  const options = dispatchesFor(def, era)
  const copy = options[Math.min(Math.floor(rng.next() * options.length), options.length - 1)]
  return {
    tick,
    event,
    kind: def.kind,
    desk: def.desk,
    tone: def.tone,
    prominence: def.prominence,
    outlet: outletFor(era, def.desk, state.institutions.stocks.press, rng.next()),
    text: copy.headline,
    body: copy.body,
  }
}

/** File several at once, in catalogue order rather than call order — a page
 * is laid out, not appended to. */
export function fileDispatches(state: TrueState, events: readonly EventId[]): NewsItem[] {
  return events.map((event) => fileDispatch(state, event))
}

/** Quarters since this event was last on the wire; `Infinity` if never. */
export function quartersSinceFiled(state: TrueState, event: EventId): number {
  for (let i = state.stats.news.length - 1; i >= 0; i--) {
    if (state.stats.news[i].event === event) return state.meta.tick - state.stats.news[i].tick
  }
  return Infinity
}

/**
 * File, unless the wire carried this same event within the last `within`
 * quarters.
 *
 * For events whose TRIGGER is a threshold crossing on a noisy series, where
 * repeated crossings are the noise rather than the news — a partner's AR(1)
 * activity wobbling across its slump line filed the identical dispatch three
 * times in four quarters.
 *
 * Use it only where the repetition is genuinely spurious. It is the one place
 * in this module where a dispatch can be dropped, and dropping the wrong one
 * is invisible: the finance overlay finds crises by scanning the wire, and a
 * chart with no markers looks exactly like a century with no crises. Nothing
 * a downstream reader depends on may be filed through here.
 */
export function fileIfNotRecent(
  state: TrueState,
  event: EventId,
  within: number,
): NewsItem | null {
  return quartersSinceFiled(state, event) < within ? null : fileDispatch(state, event)
}
