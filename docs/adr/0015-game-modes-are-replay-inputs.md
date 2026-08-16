# ADR-0015 — Game modes are replay inputs, not UI preferences

**Status:** Superseded by [ADR-0020](0020-the-rules-of-a-run-are-a-set.md) · **Date:** 2026-Q3

> ADR-0020 keeps this decision's constraint — a rule that changes simulation behavior is an
> explicit engine input with a save field, a replay default, and a published identity — and
> replaces only its representation: the single `mode` scalar became a set of independent rules,
> because three safeties would otherwise need eight names.

## Context

God mode lets a testing run continue after an election defeat and disables deposition by revolt
or coup. That changes what the same country, seed, and action log produce. If the setting lived
only in React state or browser storage, exporting and reloading the save would silently restore
ordinary deposition rules and violate ADR-0001's replay guarantee.

The mode is not a country characteristic either. Meridia in God mode must remain the same country
recipe as Meridia in standard play; only the rules governing the player's tenure differ.

## Decision

Game mode is an immutable engine input. `init(params, seed, mode)` stores it in state metadata,
and every save records it beside the country parameters, seed, action log, and tick. Replay and
the worker default a missing mode to `standard`, preserving saves written before schema 21.

Modes may change whether a terminal political event ends the run, but they do not rewrite the
underlying measurement. God mode therefore records an election loss as a loss, does not award an
election win, and starts the next electoral term without deposing the player. The published desk
exposes the selected mode exactly so the UI can explain that otherwise unusual state.

Future game modes that change simulation behavior must follow the same route: explicit engine
input, save field, replay default, and published identity. They must not be hidden in UI storage,
smuggled into `CountryParams`, or activated by an unlogged runtime toggle.

## Alternatives considered

- **A UI-only preference in React or `localStorage`.** Smallest implementation. Rejected because
  a save would replay differently on another browser or after the preference changed.
- **An optional field on `CountryParams`.** Replay-safe with less API plumbing. Rejected because
  country recipes describe inherited economic and institutional conditions, not the rules of
  player tenure; the same country would cease to be the same parameter vector across modes.
- **A first-turn action in the action log.** Replay-safe and auditable. Rejected because game mode
  is chosen before the opening state exists and must not be a lever the cabinet can later stage,
  price, or reverse.
- **Force every protected election to count as won.** Keeps the run alive without a new UI state.
  Rejected because it destroys the approval and election result God mode is intended to test.

## Consequences

**Good:**

- Protected runs survive export, autosave, import, and deterministic replay.
- Country recipes remain mode-independent.
- Tests can observe real election defeats while continuing the same century.
- Pre-schema-21 saves retain standard behavior without migration.

**Bad:**

- One rule adds plumbing across engine init, state metadata, saves, observation, worker protocol,
  store, and start UI.
- Adding a future behavior-changing mode is a schema-contract change, not a presentation feature.
- Scores from God-mode runs describe an intentionally protected tenure and should not be compared
  with standard runs as evidence of political balance.
