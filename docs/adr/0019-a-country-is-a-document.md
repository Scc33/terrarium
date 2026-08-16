# ADR-0019 — A country is a document, and a study is what makes it a claim

**Status:** Accepted · **Date:** 2026-08-15

## Context

Issue #37 asks for configuration: tweaking engine constants from the UI, "maybe" authoring new
countries, and sharing countries as files. Those read as one feature and are three, with very
different costs.

Measurement first, because it reframes the issue. A save has always been
`{version, params, seed, actionLog, tick, mode}` with the **fully materialized** parameter
vector embedded (ADR-0011), and the worker's `load` hands `save.params` straight to `init`
without consulting the catalogue. Hand-editing an exported save's `params` block into a country
in no catalogue already produces a legal, replayable game. Authoring was not a capability the
engine lacked; it was one the UI never exposed.

The safety question resolved the same way. Four hundred parameter vectors sampled uniformly
inside `validateCountryParams`' own legal box — far wilder than any slider produces — ran four
hundred quarters each with **zero NaN** and nine slow relative-price drifts past the batch
runner's 50× tripwire, clustered around quarter 95 and later. The engine is markedly more robust
to arbitrary country vectors than expected.

Constants are a different animal, and the measurement says so. Moving one constant at a time
over sixteen Meridia seeds for four hundred passive quarters: halving `ASSET_REVERT` moved no
headline number at all, while doubling `WAGE_DEMAND_GAIN` took deposition from 0/16 to 16/16.
Neither produced a NaN or a price explosion. The engine absorbs a constants change; what breaks
is the *meaning* of the run. And the sensitivities are wildly non-uniform, so a panel of
identical sliders would misrepresent a cliff and a no-op as equivalent choices.

## Decision

**Countries are authorable; constants are not — yet.**

A **country document** (`packages/engine/src/countryDocument.ts`) is a sibling of `SaveFile`, not
a new engine input:

- It stores the vector **without `pyramid`**, plus an `ageShape` id that rebuilds an identical
  pyramid through the same `pyramidFor` the recipe catalogue uses. Seventeen float bands are most
  of the bytes and none of the meaning, and this is what makes a country fit in a URL fragment.
- Numbers are rounded to six significant digits **on write**, so the author plays exactly what
  their readers will.
- `parseCountryDocument` rebuilds the object field by field rather than casting parsed JSON, and
  the prose fields are length-capped and stripped of control characters. A document arrives from
  a stranger.
- The dossier carries **no difficulty field**. The catalogue's stamps are prose backed by a
  thousand-run matrix; a self-declared one would be a claim nobody measured.

`CountryParams.authored` is provenance carried in the save, read by no pipeline step. This is
ADR-0015's argument applied to a *fact about* a run rather than a *rule of* one: in React state
it would evaporate on export, and a grade earned somewhere nobody has balanced would be filed
silently beside grades earned on the curated matrix.

The **feasibility study** (`packages/ui/src/worker/trial.ts`) runs `TRIAL_SEEDS` passive
centuries of the candidate *and of Meridia on identical seeds*, in about a second on the worker
thread. A full 416-quarter century costs ~70 ms, and nine browser seeds reproduce the published
country matrix to within a few tenths. It reports the catalogue's own columns plus the batch
runner's two failure definitions verbatim. It issues **no verdict and no grade**.

## Alternatives considered

- **Ship the constants panel as asked.** Rejected for now, on the measurement above: two of four
  sampled constants do nothing visible to a century and one is a cliff edge. Rendered as four
  identical sliders they read as four equivalent choices. The mechanism is cheap when wanted —
  the interesting constants touch one or two files and two or three call sites each, all inside
  functions that already have `state` in scope — so the follow-up is doctrines (named,
  pre-measured override bundles, each with a published baseline row), not raw knobs. That will
  supersede ADR-0007's third rejected alternative, and it is a schema event.
- **A pass/fail gate on authored countries.** Rejected: it would reject roughly 2% of
  validator-legal countries, and those failures are slow late drifts rather than broken
  economies. A gate would imply an authority the study does not have.
- **A derived difficulty stamp.** Rejected: passive deposition does not track the curated
  difficulty labels at all (Veltravia is `standard` and falls in 44% of passive centuries;
  Costona is `hard` and falls in none). Comparing against a live reference country says more and
  claims less.
- **Random-policy as well as passive in the study.** Rejected: it would require a second copy of
  `randomPolicy` in the browser, and a drifting second definition of how a thoughtless government
  behaves is worse than the information is worth.
- **Storing the pyramid in the document.** Simpler, and removes a reconstruction step. Rejected:
  it roughly doubles the document and puts seventeen long floats in front of a human reader. The
  round-trip is pinned by a state-hash assertion after a century, not a field comparison.
- **A draft library inside the save.** Rejected: a save already embeds the vector it needs. The
  shelf is a property of a browser, like pinned instruments.
- **Sharing via a hosted service.** Rejected as unnecessary: a country is ~1 KB, which fits in a
  URL fragment — never sent to a server, no accounts, no hosting.

## Consequences

**Good:**

- Authoring, sharing and studying countries with no new engine input and no pipeline change;
  `pnpm diff-state --moved-only` reports `meta.schemaVersion` and nothing else.
- The batch runner's discipline becomes a game mechanic. Terrarium's thesis is governing under
  measurement uncertainty; the drafting room is that thesis one level up.
- A study is reproducible from its draft, so iterating on a country means something.
- `materializeStructure` makes the opening conditions a structure-less recipe receives implicitly
  visible and editable, and is an exact economic no-op.

**Bad — and these are real:**

- `CountryParams` widens and the schema stamp moves, so every golden hash moves with it. The
  bless diff is hashes only; `realGdp` is bit-identical in both cases.
- The engine package gains a little more player-facing prose, extending the cost ADR-0011 already
  accepted.
- The study's metric definitions are **copied** from `packages/runner`, because `packages/ui` must
  not depend on a node CLI package. `tests/ui/trial.test.ts` pins the two implementations against
  each other on identical inputs; if that test goes, the study quietly stops being comparable with
  the published matrix.
- Four aggregate medians cannot see everything. `ASSET_REVERT` governs bubble dynamics that this
  metric set is blind to — a limitation of the report worth remembering before the doctrines
  follow-up makes it load-bearing.
- Authored countries are outside every balance guarantee in the repo, by construction. The
  `authored` stamp exists so that stays visible rather than becoming folklore.
