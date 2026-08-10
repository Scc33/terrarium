# Investigations

Open questions about the model, with the evidence that raised them.

An investigation is written when measurement contradicts something we believed — usually while
building a feature that then didn't ship. It records **what was measured, how, and what it
implies**, so the next person to reach the same place starts from the evidence instead of
re-deriving it. It is explicitly *not* a decision: nobody has ruled on what should change.

This is the third register of documentation here, and the distinction matters:

| | holds | status |
|---|---|---|
| `docs/adr/` | decisions that constrain future code, with the alternatives they beat | immutable once accepted |
| `CLAUDE.md` "Hard-won tuning lessons" | calibration knowledge, read beside the constants it governs | living |
| `docs/investigations/` | open questions with measurements attached | resolved or withdrawn |

When an investigation is resolved, say so in its Status line and link to whatever resolved it —
an ADR, a PR, a tuning lesson. An investigation that turns out to be a non-issue gets closed
with the reason, not deleted; the measurement is still worth having.

Numbers in these documents are stamped with the commit they were taken at, because they will
drift. Re-measure before acting on one.

| # | question | status |
|---|----------|--------|
| [0001](0001-subsistence-valve-saturation.md) | The subsistence valve is saturated for most of the century | Open |
| [0002](0002-capital-formation-share-only-falls.md) | Capital formation's share of expenditure only ever falls | Open |
| [0003](0003-public-debt-does-not-crowd-out-private-investment.md) | Public debt does not crowd out private investment during play | Open |
| [0004](0004-attainment-index-falls-while-every-sector-rises.md) | `technology_attainment` falls while every sector's technique rises | Open |
