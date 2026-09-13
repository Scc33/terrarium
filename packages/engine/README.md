# @terrarium/engine

The simulation. Pure, deterministic TypeScript with no dependencies: `init(params, seed)` makes
a country, `applyActions` posts the cabinet's orders, `step` runs one quarter through
`TICK_ORDER`. State is derived from those inputs and never stored (ADR-0001), so a save is a
replay log and every run is reproducible.

Also here: the country recipes and document format (`countries.ts`, `countryDocument.ts`), the
action union and its political pricing (`actions/`), the news wire (`events/`), the caretaker
interregnum, and every behavioural constant (`constants.ts`).

The fog is made here too — `pipeline/statistics.ts` publishes lagged, noisy, revised prints —
because politics reads the published figure, not the truth (ADR-0003).

Rules for working here: `AGENTS.md` beside this file. Architecture: `docs/tech-architecture.md`.
