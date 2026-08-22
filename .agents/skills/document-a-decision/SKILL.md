---
name: document-a-decision
description: Decide where a piece of Terrarium knowledge belongs and write it there — an ADR in docs/adr/, an investigation in docs/investigations/, or a tuning lesson in AGENTS.md. Use after making a structural choice, after a measurement contradicts what the model was believed to do, after abandoning a feature, or when asked to "document this decision" and the register isn't obvious.
---

# Which register does this go in?

Terrarium keeps three kinds of written knowledge, and they are easy to confuse. Putting
something in the wrong one is how a calibration note becomes an immutable decision nobody can
revisit, or how a real constraint gets buried in a prose file nobody rereads.

**The default failure is writing an ADR for everything. Most things are not ADRs.**

| Register | Holds | Lifecycle |
|---|---|---|
| `docs/adr/` | decisions that constrain future code, with the alternatives they beat | **immutable once accepted** |
| `docs/investigations/` | open questions with measurements attached | resolved or withdrawn |
| `AGENTS.md` → "Hard-won tuning lessons" | calibration knowledge, read beside the constants it governs | living |

## Route it

Ask in this order:

**1. Did measurement contradict something we believed?** → **investigation**.
Especially if it surfaced while building something that then didn't ship. An investigation is
explicitly *not* a decision: nobody has ruled on what should change.

**2. Is it a structural choice that had a real alternative?** → **ADR**.
Structural means it constrains what future code may do. "Had a real alternative" means another
option was genuinely live at the time. A technique that simply worked is neither.

**3. Is it a number, or how to pick one?** → **tuning lesson in AGENTS.md**.
Calibration knowledge belongs beside the constants it governs, not in `docs/adr/`. The README
in `docs/adr/` says this explicitly.

If none fit, it probably belongs in a code comment next to the thing it explains. Keep that
comment self-contained; when durable context is needed, link a maintained ADR, investigation,
or architecture section rather than an archived planning document.

## Writing an ADR

`docs/adr/NNNN-kebab-title.md`, next number in sequence. It must carry:

- the decision, stated as a constraint on future code
- **the alternatives that were live at the time** — an ADR without these is just a description
- the consequences you are still living with, including the costs

Add a row to the table in `docs/adr/README.md`.

ADRs are **immutable once accepted**. To revisit one, write a new ADR that supersedes it and
update the Status line of *both*. Never edit the reasoning of an accepted ADR.

## Writing an investigation

`docs/investigations/NNNN-kebab-title.md`, next number in sequence. Record **what was measured,
how, and what it implies** — so the next person to reach the same place starts from the evidence
instead of re-deriving it.

**Stamp every number with the commit it was taken at.** These drift, and the README tells
readers to re-measure before acting on one. An investigation whose numbers have no provenance
is worse than none.

Add a row to the table in `docs/investigations/README.md` with a status.

When it resolves, say so in the Status line and link to whatever resolved it — an ADR, a PR, a
tuning lesson. **An investigation that turns out to be a non-issue gets closed with the reason,
not deleted.** The measurement is still worth having.

## Writing a tuning lesson

A bullet in the "Hard-won tuning lessons" section of `AGENTS.md`. Match the existing voice:
state the rule, then the failure mode it prevents, concretely enough that someone can recognise
the symptom. "Unit costs are computed at NORMAL_UTILIZATION, not realized output — otherwise
demand dips mechanically raise unit cost and spiral" is the model. A lesson that only says what
to do, without what goes wrong, gets ignored the first time it is inconvenient.

## Abandoning a feature

Deleting the code is only half. Write the investigation first, *then* delete — the code is the
evidence for what was measured, and once it is gone the measurement is unreproducible.

`fb07b27 docs: record why the underemployment indicator was abandoned` is the worked example: a
built indicator, measured, found degenerate, removed, and the reason kept. That is a successful
outcome, not a failure — and it stops the next person from building it again.

## Also remember

- `docs/metrics-changelog.md` is not one of these three registers — it is the engine's
  **data contract**, and every `SCHEMA_VERSION` bump owes it an entry. See the
  **`add-indicator`** and **`economics-review`** skills.
- Proposed product work belongs in GitHub issues, not in an ADR or a living roadmap document.
- `docs/archive/` preserves superseded documents. Add to it only when deliberately retiring a
  maintained document, and never cite archived material as current guidance.
