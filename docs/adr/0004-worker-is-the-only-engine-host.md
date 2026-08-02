# ADR-0004 — The worker is the only engine host

**Status:** Accepted · **Date:** M0

## Context

The game's core mechanic is that the player cannot see the true state of their economy. That
is a *fiction* if the true state is sitting in the browser tab's memory next to the React
tree — one careless `useStore(s => s.trueState.sectors)` and a component renders a number no
government of 1953 could possibly know. The failure is silent: the UI looks fine, and the
game is simply no longer the game.

## Decision

`packages/ui/src/worker/sim.worker.ts` is the only place the engine runs. It holds `TrueState`
privately in the worker's own heap and posts **only** `PublishedState` (plus save files and
action-cost previews) across the wire. `protocol.ts` is the single shared contract, and its
payload types name only `PublishedState`, action types, and `SaveFile`.

Three independent mechanisms enforce this:

1. **The runtime boundary.** True state lives in a different heap. A component cannot reach it
   even by mistake, because there is no reference to reach.
2. **The import boundary** (lint). `ui` may not import `engine/src/state/*`, nor the engine's
   state-running functions (`init`/`step`/`replay`/`applyActions`/`runTick`) outside
   `ui/src/worker/**`.
3. **The data boundary** (`tests/contract/published-state.test.ts`). Lint stops you importing
   a true-state *type*; it does not stop you posting a true-state *value* through a
   structurally-compatible channel. The contract test asserts what actually crosses.

## Alternatives considered

- **Run the engine on the main thread, keep true state in a closure.** Cheaper, no
  serialization. Rejected: the discipline is then purely conventional, and a single accidental
  export defeats it with no test able to notice.
- **Lint rules alone, no worker.** Same objection — the two boundaries catch import mistakes
  and value leaks, but nothing prevents a determined refactor from restructuring around them.
  The heap separation is what makes the leak *impossible* rather than *discouraged*.

## Consequences

**Good:**

- The fog is architecturally guaranteed, not maintained by vigilance. This is the property the
  whole design rests on.
- The sim doesn't block rendering — a long replay on load keeps the UI responsive for free.
- Everything crossing the wire is structured-clone-able, which is already required for saves.

**Bad:**

- All UI↔engine communication is **asynchronous and message-shaped**. Anything the UI wants to
  know that isn't in `PublishedState` needs a new message type on both sides — `previewCost`
  exists precisely because "what would this action cost?" couldn't just be a function call.
- Debugging is harder: worker state isn't visible in React devtools, and a dev tool that wants
  to inspect true state has to be an explicit, deliberately-gated channel through `protocol.ts`
  rather than a console poke.
- `TrueState` must stay plain data — no classes, no methods — to survive structured clone.
