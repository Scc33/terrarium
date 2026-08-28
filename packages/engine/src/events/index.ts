/**
 * The event system (#160): what the wire can carry, how it is worded, and who
 * decides that it runs.
 *
 * Four modules, each with one job:
 *
 * - `ids.ts` — every event's NAME. A leaf with no imports, so `state/schema.ts`
 *   can type a `NewsItem` against it without a cycle.
 * - `catalogue.ts` — every event's COPY, per era. The only authored prose.
 * - `file.ts` — turning an id into the dispatch that goes in the save.
 * - `conditions.ts` — the desk: which of the country's conditions get reported
 *   this quarter, budgeted so the page stays readable.
 *
 * Adding an event is: an id, a catalogue entry, and either a `fileDispatch`
 * call at the moment the fact happens or a rule in `CONDITION_RULES`. The
 * compiler enforces the first two and `tests/properties/events.test.ts`
 * enforces the third.
 */

export { DESK_IDS, EVENT_IDS, PROMINENCE_IDS, isEventId } from './ids'
export type { DeskId, EventId, Prominence } from './ids'
export { EVENT_CATALOGUE } from './catalogue'
export type { Dispatch, EventDef } from './catalogue'
export { OUTLETS, PRESS_ERAS, PRESS_ERA_IDS, eraAtTick, eraAtYear, eraOrdinal } from './eras'
export type { PressEra, PressEraId } from './eras'
export {
  dispatchesFor,
  dispatchRng,
  fileDispatch,
  fileDispatches,
  fileIfNotRecent,
  outletFor,
  quartersSinceFiled,
} from './file'
export {
  CONDITION_RULES,
  back,
  buildContext,
  conditionDispatches,
  cooldownFor,
  medianAge,
} from './conditions'
export type { ConditionRule, EventContext, RuleClass } from './conditions'
