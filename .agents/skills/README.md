# Shared skills

One copy of each skill, read by both coding agents.

```
.agents/skills/          <-- source of truth; edit here
.claude/skills  -> ../.agents/skills
.codex/skills   -> ../.agents/skills
```

Both Claude Code and Codex read the same `SKILL.md` format — YAML frontmatter with `name` and
`description`, then markdown — and both load the `description` at startup to decide when a
skill applies. So a skill written once triggers in either agent. Codex can also be pointed at
one explicitly with `$skill-name`.

**Edit through `.agents/skills/`, never through a symlink path.** Editing
`.claude/skills/foo/SKILL.md` works, but it obscures where the file really lives and makes the
diff read as though the two agents have diverged.

## Writing one

The `description` is the whole trigger. It has to say *what the skill does* **and** *when to
reach for it*, in terms someone would actually type — a description that only names the topic
never fires. Compare:

- ✗ `Guidance for indicators.`
- ✓ `Add a new published indicator to Terrarium's instrument wall, or retune an existing one's dial face. Use when adding a metric the player can see…`

Beyond that, the same rule as the rest of this repo: say what goes wrong and why, not just what
to do. A step with no failure mode attached gets skipped the first time it is inconvenient.

Keep procedures here and keep `AGENTS.md` to the always-true rules — that file is loaded on
every task, and these are not.

## The skills

| Skill | For |
|---|---|
| `add-indicator` | a new published metric, or a dial face that has drifted |
| `economics-review` | any engine change: reading the state diff, the baselines, `pnpm bless` |
| `add-bloc-or-institution` | the politics layer — power, favour, veto pricing |
| `terrarium-ui` | anything in `packages/ui` — tokens, the wall, charts, layout contracts |
| `verify-the-wall` | proving a UI change fits, in a real browser at 1280×720 |
| `document-a-decision` | choosing between an ADR, an investigation, and a tuning lesson |
