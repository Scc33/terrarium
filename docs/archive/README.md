# Archive

Superseded documents, kept for provenance. **Not maintained — do not treat as current.**

Where they describe the codebase, they describe a version of it that no longer exists. Where
they describe intent, that intent may have been revised. The current documents are
`../game-description.md`, `../tech-architecture.md`, `../country-scenarios.md`, and `../adr/`;
future work is tracked in GitHub issues.

| document | what it was | superseded by |
|----------|-------------|---------------|
| `proposal-0.md` | The original brainstorm write-up. First statement of the design bet ("accuracy and fun are the same thing"), the three player layers, and cobra effects as gameplay. | `proposal-1.md`, which restated these as decisions rather than options |
| `proposal-1.md` | The v0.1 working design, open questions, and M0–M5 milestone plan. Most of its core mechanics shipped; its remaining useful ideas were transferred to the issue backlog. | `../game-description.md`, `../tech-architecture.md`, `../adr/`, and [issue #119](https://github.com/Scc33/terrarium/issues/119) |
| `scoping-the-market.md` | The M1 market-clearing spec: the 5×5 I/O table, the tâtonnement loop with a paper stability argument, and a worked fuel-tax example. Also a filed note on an engine-as-MCP side quest. | Implemented in `engine/src/pipeline/prices.ts` and `production.ts`; the coefficients now live in `engine/src/constants.ts` and the claims are pinned by `tests/properties/fuel-tax.test.ts` |

`scoping-the-market.md` retains some standalone value: the stability argument and the worked
example explain *why* the tâtonnement damping and per-tick caps are shaped the way they are,
which the code states but does not justify.
