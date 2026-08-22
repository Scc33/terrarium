# Architecture Decision Records

Decisions that shaped the codebase, with the alternatives that were live at the time and the
consequences we're still living with. An ADR is written when a choice is **structural** (it
constrains what future code may do) and **had a real alternative** — not for every technique
that turned out to work.

Calibration lessons are not ADRs. Those live in `CLAUDE.md` under "Hard-won tuning lessons",
where they're read alongside the constants they govern.

ADRs are immutable once accepted. If a decision is revisited, write a new ADR that supersedes
the old one and update the Status line of both.

| # | decision | status |
|---|----------|--------|
| [0001](0001-saves-are-replay-logs.md) | Saves are replay logs, not state snapshots | Accepted |
| [0002](0002-rng-substreams.md) | Randomness comes from substreams keyed by step name | Accepted |
| [0003](0003-measurement-lives-in-the-engine.md) | Measurement lives in the engine, not the observation package | Accepted |
| [0004](0004-worker-is-the-only-engine-host.md) | The worker is the only engine host | Accepted |
| [0005](0005-pipeline-order-is-versioned.md) | Pipeline step order is versioned | Accepted |
| [0006](0006-fixed-dial-faces.md) | Instrument dial faces are fixed, never derived from data | Accepted |
| [0007](0007-constants-in-one-file.md) | Every behavioral constant lives in one file | Accepted |
| [0008](0008-golden-replays-are-the-economics-review.md) | Golden replays are the economics review | Accepted |
| [0009](0009-typescript-7-side-by-side.md) | TypeScript 7 runs side-by-side with the TS 6 API | Accepted |
| [0010](0010-dev-console.md) | The dev console shows truth without weakening the boundary | Accepted |
| [0011](0011-countries-are-replayable-recipes.md) | Countries are replayable recipes, not alternate engines | Accepted |
| [0012](0012-technology-is-a-gap-not-a-tree.md) | Technology is a moving gap, not an unlock tree | Accepted |
| [0013](0013-invention-is-a-hazard-research-is-a-stock.md) | Invention is a hazard, research is a stock | Accepted |
| [0014](0014-sovereign-funding-pressure.md) | Sovereign funding pressure enters one common private rate | Accepted |
| [0015](0015-game-modes-are-replay-inputs.md) | Game modes are replay inputs, not UI preferences | Superseded by 0020 |
| [0016](0016-a-chart-frames-a-dial-face.md) | A chart frames the dial face; only the dial obeys it | Superseded by 0025 |
| [0017](0017-finance-levers-reuse-existing-balance-sheets.md) | Finance levers reuse the existing rate and bank-capital channels | Accepted |
| [0018](0018-fdi-is-owned-capital.md) | Foreign direct investment is owned capital, not an openness bonus | Accepted |
| [0019](0019-a-country-is-a-document.md) | A country is a document, and a study is what makes it a claim | Accepted |
| [0020](0020-the-rules-of-a-run-are-a-set.md) | The rules of a run are a set of independent safeties, not a ladder of modes | Accepted |
| [0021](0021-the-year-you-take-office.md) | The year you take office is a replay input, and the years before it are governed | Accepted |
| [0022](0022-migration-is-a-relative-outside-option.md) | Migration is a relative outside-option flow, not a population target | Accepted |
| [0023](0023-human-capital-is-not-school-capacity.md) | Human capital is a slow stock carried by people, not the school system itself | Accepted |
| [0024](0024-the-manual-is-generated-from-the-game.md) | The manual is generated from the game, not written beside it | Accepted |
| [0025](0025-charts-own-their-analytical-scale.md) | Charts own their analytical scale and shared range inspection | Accepted |
| [0026](0026-a-product-of-two-excesses-needs-a-phase-plot.md) | A product of two excesses is drawn as a phase plot, not two time charts | Accepted |
