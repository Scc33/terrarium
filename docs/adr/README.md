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
| [0015](0015-game-modes-are-replay-inputs.md) | Game modes are replay inputs, not UI preferences | Accepted |
| [0016](0016-a-chart-frames-a-dial-face.md) | A chart frames the dial face; only the dial obeys it | Accepted |
| [0017](0017-finance-levers-reuse-existing-balance-sheets.md) | Finance levers reuse the existing rate and bank-capital channels | Accepted |
| [0018](0018-fdi-is-owned-capital.md) | Foreign direct investment is owned capital, not an openness bonus | Accepted |
