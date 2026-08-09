# ADR-0012 — Agent guidance layers directory invariants under a root router

**Status:** Accepted · **Date:** 2026-08-08

## Context

Terrarium's root `AGENTS.md` grew to 13,658 bytes by mixing repository-wide architecture,
engine calibration knowledge, UI layout contracts, testing strategy, and task procedures. Every
agent task received all of it, including UI details during engine work and economic tuning
lessons during documentation work. Adding more flow detail at the root would make that noise
worse and approach Codex's default combined project-instruction budget.

Directory-scoped files alone are not sufficient. Codex composes `AGENTS.md` from the Git root
to the directory where a task launches, so a root-launched task does not automatically receive
descendant guidance. Claude can discover descendant `CLAUDE.md` files while reading a subtree,
but reads `CLAUDE.md` rather than `AGENTS.md` directly. The two agents still need one shared
source of truth.

Terrarium's important feature procedures are also cross-cutting. Adding an indicator or country
recipe spans engine, observation, UI, runner, fixtures, tests, and docs. Copying those workflows
into directory guides would make several incomplete sources drift.

## Decision

The root `AGENTS.md` is a repository-wide contract and router. It identifies scoped directories,
instructs root-launched agents to read every applicable descendant guide, carries universal
architecture and workflow rules, and remains below 8 KiB.

Always-true local constraints live in canonical `AGENTS.md` files under:

- `packages/engine/`
- `packages/observation/`
- `packages/ui/`
- `packages/runner/`
- `tests/`
- `docs/`

Every directory with an `AGENTS.md` also has a `CLAUDE.md` containing exactly `@AGENTS.md`.
Shared guidance is never authored in the wrapper. Committed project policy does not use
`AGENTS.override.md`, because an override would hide the ordinary guide in that directory from
Codex.

Cross-directory task sequences remain in `.agents/skills/`. A guide may route a task to a skill
but does not reproduce its checklist. A narrower guide is added only after its directory has a
distinct invariant with evidence of repeated failure.

A contract test enumerates the intended scopes, verifies every canonical/wrapper pair, enforces
the exact one-line wrapper, keeps the root under 8 KiB, and keeps every root-to-leaf instruction
chain under 16 KiB.

## Alternatives considered

- **Keep one comprehensive root guide.** Simple discovery, but every task pays for every domain
  and further detail makes the global prompt larger and harder to maintain.
- **Create guides for conceptual feature flows.** Indicator, country, and action flows do not
  map to directories. The files would either live far from much of the code they govern or be
  copied across packages. Skills already provide intent-based, cross-directory discovery.
- **Use nested files without a root router.** Works for tasks launched inside a package and for
  Claude's descendant discovery, but silently misses local instructions in root-launched Codex
  tasks, the common desktop workflow.
- **Maintain independent `CLAUDE.md` content or Claude path rules.** More conditional control
  for Claude, but creates two instruction systems with different text and no shared review
  surface.
- **Use committed `AGENTS.override.md` files.** Useful for temporary personal overrides, but the
  override takes precedence over and hides the canonical guide at that level.

## Consequences

**Good:** tasks receive less irrelevant context; each invariant has one directory owner; both
agents share the same prose; cross-layer procedures stay complete in skills; instruction size
and wrapper drift fail in CI.

**Bad:** six directories carry a two-file canonical/wrapper pair; root-launched agents depend on
the router instruction rather than automatic descendant discovery; changes spanning packages
must read several local guides; maintainers must decide whether new knowledge is a local
invariant or a task procedure.
