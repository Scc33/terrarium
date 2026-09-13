# @terrarium/ui

The game. A React war room on one screen at 1280×720: the instrument wall (board, rack and
docked panels), the cabinet where orders are staged and priced, the wire, the ledger and the
overlays behind them.

`src/worker/` is the only place the engine runs (ADR-0004); components receive `PublishedState`.
`src/*.ts` are the pure modules that make the decisions — dial faces, the height budget, chart
geometry, the minute book, the newspaper, the handbook — each with a test in `tests/ui/`, and
`src/components`, `src/panels` and `src/shell` paint what they return.

```sh
pnpm dev            # http://localhost:5173 — backtick opens the dev console
pnpm test:visual    # the only thing that sees layout
```

Rules for working here: `AGENTS.md` beside this file, and the `terrarium-ui` skill.
