# @terrarium/observation

The projection from `TrueState` to `PublishedState` — the only state the UI is allowed to see.
`observe` selects, labels and assembles releases the engine already made; it measures nothing
and adds no noise (ADR-0003). `published.ts` is the UI's whole vocabulary for the game world;
`dataExport.ts` writes the same view to a versioned JSON file.

Adding a field here is a data-contract change: `tests/contract/published-state.test.ts` asserts
nothing true leaks across.
