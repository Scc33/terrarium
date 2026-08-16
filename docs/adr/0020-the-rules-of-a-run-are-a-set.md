# ADR-0020 — The rules of a run are a set of independent safeties, not a ladder of modes

**Status:** Accepted · **Date:** 2026-08-16 · Supersedes [ADR-0015](0015-game-modes-are-replay-inputs.md)

## Context

Two issues asked for sandbox switches that ADR-0015 has no room for. Issue #59 wants every
instrument to report regardless of statistical capacity; issue #91 wants a cabinet that is never
short of political capital. Neither is about tenure, and neither implies the other — a player
studying the fog wants all the surveys and still wants deposition to mean something.

`GameMode` was a scalar, `'standard' | 'god'`. Three independent safeties spell eight names, and
whoever adds the fourth will be spelling sixteen. The names would also be lies about what they
do: `god-stats-unlimited` describes a combination, not a rule, and nothing in the type would
stop `stats-unlimited` and `unlimited-stats` both existing.

The rest of ADR-0015 held up under the new requirements rather than being challenged by them.
Both new rules change what the same country, seed, and action log produce, so both have to be
engine inputs recorded in the save for exactly the reason the tenure rule did.

## Decision

State carries `meta.rules: GameRules` — a **total record of independent booleans** over
`GAME_RULE_IDS`, replacing `meta.mode`. `init(params, seed, rules)` takes either the record or a
partial of it, every save writes the full record, and `observe()` publishes it exactly, so the
desk can say which safeties are on.

ADR-0015's constraint is carried forward unchanged and now applies to each rule separately: a
rule that changes simulation behavior is an explicit engine input with a save field, a replay
default, and a published identity. It must not be hidden in UI storage, smuggled into
`CountryParams`, or activated by an unlogged runtime toggle. Adding one remains a
`SCHEMA_VERSION` event.

Two further constraints follow from the set being a set:

- **A rule must be inert when it is off.** Every rule reads as `false` for an ordinary run, and
  the golden diff is the proof: introducing all three moved no economic quantity in either
  golden replay, and the passive century was unchanged at 2.70 %/yr growth, 11.90 %
  unemployment, 7 % deposed. A safety whose *absence* moves the economy has smuggled a
  balance change in behind a switch nobody thinks they enabled.
- **A rule lifts one constraint and no others.** `fullInstrumentation` lifts the funding gate on
  a survey and leaves the lag, the noise, and the revisions exactly where capacity puts them —
  it hands over the instrument, not the truth. `unlimitedCapital` stops the bill being
  presented; `politicalCostOfAction` still quotes every order at its real veto-loaded price and
  the blocs still spend favour, because the quote is the whip count made legible and a game of
  free orders has deleted its own subject.

Legacy `mode: 'god'` on a pre-v27 save maps to `{ protectedTenure: true }` on load. Saves are
never written with it again.

## Alternatives considered

- **Extend the `GameMode` union with the new modes.** No new plumbing; the smallest diff by far.
  Rejected on combinatorics: the union cannot express "all surveys, ordinary deposition" without
  a name per combination, and eight names could not be kept honest about what each one does.
- **Keep `mode` for tenure and add a separate `sandbox` record for the other two.** Preserves
  the golden hashes, since a standard run's serialization would not change. Rejected because it
  makes tenure a different *kind* of thing from the other two safeties when it is not one, and
  the reader would have to know which register a new rule belongs in. The hash saving is worth
  nothing — the diff review showed only `meta`, which is the cheapest bless there is.
- **A UI-only "show everything" view flag for #59.** Genuinely tempting, because the wall could
  render an unfunded instrument from a series the office never published — except it could not:
  the fog is made in the engine (ADR-0003) precisely because politics reads the prints, so there
  is no published series for the UI to reveal. Rendering one would mean measuring in the UI.
- **Refill political capital to `PC_MAX` every tick for #91.** No engine branch in `spendPc` at
  all. Rejected because it is a different mechanic: it caps a single order at `PC_MAX` while
  reading as unlimited, so the sandbox would still refuse the expensive reform that motivated
  the request.

## Consequences

**Good:**

- Safeties compose. The fourth rule is one id, one branch, and one row in the posting room.
- Each rule is separately testable, and `tests/properties/game-rules.test.ts` pins both halves
  of each — what it changes and what it must leave alone.
- `RULE_COPY` in `ui/src/gameRules.ts` is a total record over the id list, so a rule cannot ship
  without words explaining it to the player.

**Bad:**

- `meta.mode` → `meta.rules` is a schema event with a golden re-bless, for a change that moved
  no economics. That cost is paid once.
- `fullInstrumentation` is not perfectly inert in one corner: an **indexed** appropriation
  follows published CPI, so in a country too poor to publish CPI the rule gives indexation
  something to read. That is the rule working as specified — indexation is defined against what
  the office publishes — but it means a sandbox run's fiscal path is not comparable with a
  standard one's.
- A run taken under any safety is not evidence about balance, and the report card cannot say so
  in the numbers. The letterhead stamps the active rules; nothing enforces that a screenshot of
  one is read as a sandbox.
