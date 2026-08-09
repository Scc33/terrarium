# Scoped agent guidance by application flow

**Status:** proposal for review

**Base:** `a4c13cd` (schema 15)

**Scope:** documentation structure only; no engine, observation, UI, or save behavior changes

## Recommendation

Adopt a hybrid hierarchy:

1. Keep `AGENTS.md` as the canonical shared instruction format and every `CLAUDE.md` as a
   one-line import of its colocated `AGENTS.md`.
2. Put always-true, directory-owned constraints in nested `AGENTS.md` files.
3. Keep cross-cutting feature procedures in `.agents/skills/`, where they can follow a change
   across engine, observation, UI, tests, fixtures, and docs.
4. Keep the root `AGENTS.md` small enough to act as the repository contract and router. It
   should tell a root-launched agent to read the closest nested guide for every subtree it
   touches.

This gives each application flow more room without making six copies of the same workflow.
It also matches how the tools actually find instructions:

- Codex composes `AGENTS.md` from the Git root down to the directory where the task was
  launched. It does not automatically add every descendant guide to a root-launched task, so
  the root guide must explicitly route work to nested guides. Its default combined project
  instruction budget is 32 KiB.
- Claude Code composes ancestor `CLAUDE.md` files and loads a descendant file when it begins
  reading that subtree. A colocated `CLAUDE.md` can import `@AGENTS.md`, preserving one shared
  source without copied text.

Sources: [Codex `AGENTS.md` discovery](https://developers.openai.com/codex/guides/agents-md),
[Claude Code memory and imports](https://code.claude.com/docs/en/memory).

## Why not one instruction file per conceptual feature flow?

The important Terrarium feature flows are cross-cutting. Recent work makes that concrete:

- A published indicator changed engine derivation and statistics, observation presentation,
  UI labels/domains/wall layout, goldens, contract/property/UI tests, visual baselines, and the
  metrics changelog.
- A country scenario changed engine recipes and initialization, fixtures, the batch runner,
  startup/settings/dev-console UI, worker messages, tests, docs, and goldens.

No directory owns either flow. Nesting `AGENTS.md` by directory cannot express that whole
change, while repeating the checklist in every affected directory guarantees drift. The
existing `add-indicator`, `economics-review`, `add-bloc-or-institution`, `terrarium-ui`,
`verify-the-wall`, and `document-a-decision` skills are the right mechanism for these
procedures.

The useful split is therefore:

- **Nested guides answer:** what is always true in this part of the repository?
- **Skills answer:** what sequence must be followed for this kind of task?

## Proposed first-wave hierarchy

Each row means an `AGENTS.md` containing shared instructions and a `CLAUDE.md` containing
exactly `@AGENTS.md`.

| Directory | Application flow it owns | Local guidance |
|---|---|---|
| `/` | repository-wide routing | dependency direction, economy/politics seam, shared commands, skill triggers, nested-guide rule |
| `packages/engine/` | true-state simulation | purity, state ownership, constants, RNG substreams, pipeline order, schema events, economic baselines, politics seam |
| `packages/observation/` | published read model | presentation-only boundary, `PublishedState`, total presentation tables, no measurement logic, quote delegation |
| `packages/ui/` | player interaction | worker-only engine host, fog boundary, staged-action lifecycle, UI language, wall/layout contracts, dev-tool stripping, browser verification |
| `packages/runner/` | replay and calibration | deterministic run construction, strict versus lenient actions, passive/random/country matrices, failure reporting |
| `tests/` | proof and regression | suite ownership, golden review before blessing, load-bearing properties, contract boundary, browser/visual requirements |
| `docs/` | durable project knowledge | architecture versus ADR versus investigation versus tuning lesson, schema changelog, immutable accepted ADRs, stable proposal numbering |

Defer guides under `packages/fixtures/`, `tools/`, `packages/ui/src/panels/`, and individual
engine pipeline folders. They are either too small, share a parent flow, or are better covered
by an existing skill. Add another guide only when a directory has a distinct invariant that
has caused repeated mistakes.

## Root guide after the split

The root file should retain only rules that apply regardless of where a task lands:

- the one-paragraph game and architecture orientation;
- `ui -> observation -> engine` dependency direction;
- the narrow economy/politics seam and passive-baseline leak check;
- the canonical-source rule for `AGENTS.md` and wrappers;
- a directory map that says which nested guides to read;
- the skill routing table;
- universal commands and CI order;
- repository-wide deterministic bans that are useful even though lint enforces them.

Move, rather than copy, the following material:

- engine tuning lessons, schema/pipeline rules, and the economics review trigger to
  `packages/engine/AGENTS.md`;
- wall layout, UI primitives, visual language, and dev-console stripping to
  `packages/ui/AGENTS.md`;
- rendered-layout and golden/property test distinctions to `tests/AGENTS.md`;
- ADR/investigation/changelog ownership to `docs/AGENTS.md`;
- batch calibration details to `packages/runner/AGENTS.md`.

Target a root file below 8 KiB and each normal root-to-leaf instruction chain below 16 KiB.
The current root file is 13,658 bytes, so the split should reduce always-loaded context even
after adding the routing table.

## Canonical pair contract

For every scoped directory:

```text
AGENTS.md     # all shared guidance for this directory
CLAUDE.md     # exactly: @AGENTS.md
```

Rules for maintaining the pair:

- Never put shared content directly in `CLAUDE.md`.
- Do not use `AGENTS.override.md` for committed project policy; it would hide the ordinary
  `AGENTS.md` at that directory in Codex.
- A more specific guide may clarify or strengthen a root rule, but should not restate it.
- A cross-directory checklist belongs in a skill, not in several nested guides.
- Root-launched agents must read every applicable nested `AGENTS.md` before editing files in
  that subtree. This closes the gap between Codex's launch-directory discovery and Claude's
  descendant-on-read discovery.

Add a small contract test or check script that enumerates the intended scoped directories and
asserts that both files exist and every `CLAUDE.md` is exactly the one-line import. This guards
the convention mechanically without treating prose quality as a testable property.

## Cross-cutting workflow coverage

| Feature flow | Home | Status |
|---|---|---|
| Add or retune a published indicator | `.agents/skills/add-indicator/` | covered |
| Change engine behavior or bless goldens | `.agents/skills/economics-review/` | covered |
| Add or change a bloc/institution | `.agents/skills/add-bloc-or-institution/` | covered |
| Change the game UI | `.agents/skills/terrarium-ui/` | covered |
| Prove layout in a browser | `.agents/skills/verify-the-wall/` | covered |
| Place durable knowledge | `.agents/skills/document-a-decision/` | covered |
| Add or retune a country scenario | new skill, after the hierarchy lands | gap |
| Add a new player action/lever | new skill if this becomes a repeated task | watch |

The country flow is the clearest next skill: it already has a dedicated design document and a
known cross-layer stress matrix. A player-action skill should wait until another action is
added; one observed implementation is not yet enough to extract a reliable procedure.

## Drift cleanup included with implementation

Current maintained text still contains pre-canonicalization names:

- `docs/tech-architecture.md` calls `CLAUDE.md` the operating manual and refers to the removed
  `terrarium-design` skill.
- `docs/adr/README.md`, `docs/investigations/README.md`, a tool comment, and test comments point
  to `CLAUDE.md` where they mean shared agent guidance.

Update maintained architecture/readme/code-comment references to `AGENTS.md` and
`terrarium-ui`. Do not rewrite accepted ADR reasoning merely to modernize a historical file
name; `CLAUDE.md` remains a valid import entry point, and accepted ADRs are immutable.

## Implementation slices

### Slice 1: hierarchy and migration

1. Add the six proposed nested `AGENTS.md`/`CLAUDE.md` pairs.
2. Refactor the existing root pair by moving domain-specific material into its owner.
3. Add the pair contract check.
4. Fix maintained stale references.
5. Verify that no rule was lost and that repeated checklists still live only in skills.

This is a documentation/tooling-only change. It should not bump the schema or move code.

### Slice 2: missing country workflow

After the hierarchy is stable, extract the existing country recipe, replay, UI selection, and
all-country calibration procedure into an `add-country-scenario` skill. Keep the stable runner
invariants in `packages/runner/AGENTS.md`; keep the task sequence in the skill.

### Slice 3: reassess after use

After several engine, UI, and cross-layer tasks, split further only if there is evidence that
a parent guide is noisy or a repeated failure belongs to a narrower directory. In particular,
do not pre-create guides per UI panel or pipeline step.

## Acceptance criteria

- Root `AGENTS.md` remains the canonical repository-wide source and every `CLAUDE.md` is a
  minimal colocated import wrapper.
- A root-launched task can discover the directory routing rule; a task launched from a scoped
  directory receives root plus local guidance.
- The root guide is below 8 KiB; a normal root-to-leaf chain is below 16 KiB.
- Each always-true rule has one owner. Cross-layer procedures remain in skills.
- Engine, observation, UI, runner, tests, and docs each have explicit local invariants and
  validation expectations.
- Maintained references use `AGENTS.md` and the current `terrarium-ui` skill name.
- The pair contract check passes, along with `git diff --check` and the normal documentation
  lint/typecheck gates affected by the implementation.
- No engine goldens, visual baselines, or schema versions change.

## Decision requested

Approve or adjust the first-wave directory list. The recommended starting set is the seven
rows above; the main tradeoff is adding a small amount of paired-file ceremony in exchange for
substantially less irrelevant root context and clearer ownership.
