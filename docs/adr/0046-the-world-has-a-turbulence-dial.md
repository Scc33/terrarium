# ADR-0046 — How often the world breaks is a replay input chosen at the posting

**Status:** Accepted · **Date:** 2026-10-01 · Extends [ADR-0020](0020-the-rules-of-a-run-are-a-set.md), [ADR-0021](0021-the-year-you-take-office.md)

## Context

Issue [#122](https://github.com/Scc33/terrarium/issues/122): the wire feels like a stream of bad
news, and the player wants a dial at game creation for how often events happen. The screenshot
attached to the issue is mostly the foreign desk — a commodity bloc cutting output, a regional
recession, foreign credit tightening, a fuel crisis — beside condition reports on the country's
own unemployment.

`pnpm events` (sixty centuries, five policies, every curated country) says the same thing in
numbers: the foreign desk is the largest on the paper at 24% of all dispatches, and partner
boom/slump crossings, droughts and their relief are the most-filed items after elections. Of
roughly 94 bad-toned dispatches a century, the exogenous shocks are the part no policy can
touch.

The obvious fix is a filter on the wire, and ADR-0031 rules it out. A hard event is a fact and
always files: a drought or a foreign crash is the player's only warning before the gauges
catch up, and the desk is already rate-limited so that warning stays legible. Printing fewer of
them without fewer of them happening hides real shocks from the player and leaves the economy
exactly as rough as it was.

## Decision

State carries **`meta.turbulence`**, one of `calm | ordinary | turbulent`, chosen in the posting
room beside the year of appointment and sealed into the save. It is a replay input with a save
field, a replay default and a published identity, as ADR-0020 requires of anything that changes
what the same country, seed and log produce.

The setting scales the world, not the newspaper. `TURBULENCE` in `constants.ts` gives each level
two multipliers:

- **`hazard`** multiplies the odds of every exogenous rupture: `DROUGHT_P`, `ENERGY_SHOCK_P`,
  each partner's `crisisProb`, and the background `CRISIS_BASE_P` of a bank panic. It does not
  touch the fragility terms of the banking hazard, nor the drought odds pollution adds above
  the inheritance (`droughtOdds` scales only the inherited `DROUGHT_P` share): a crisis the
  country's own leverage earned, or a climate it fouled, is not the world's doing. Each is
  written so that `ordinary` adds an exact zero or multiplies by an exact one.
- **`cycle`** multiplies each partner's `vol`. A partner's boom or slump is a threshold crossing
  on an AR(1), so its amplitude, not a hazard, sets how often those dispatches file — and they
  are the most common items abroad.

Severities, durations and recovery are unchanged. A calm world breaks less often, not more
gently, and a drought in it is still a drought.

It is **not a rule**. A rule is a safety that lifts one constraint and is off in ordinary play;
this has no "off", only a calibrated middle. It lives beside `appointedAt` for the same reason the
year does: it is a choice about which century you live in, not a constraint removed.

`ordinary` multiplies by exactly one, so it is the calibrated economy bit for bit:
`pnpm diff-state --moved-only` moved only `meta.schemaVersion`, and forty-eight 400-quarter
runs (passive and random, every curated country) hash identically to the tree before the change
over everything outside `meta`.

## Measurements

Measured on schema 48 with ADR-0045's urbanization merged.
`pnpm events -- --runs 12 --ticks 400 --turbulence <level>` (sixty centuries each):

| | calm | ordinary | turbulent |
|---|---:|---:|---:|
| bad-toned dispatches a century | 69 | 94 | 126 |
| foreign desk, share of the paper | 10.6% | 23.5% | 30.3% |
| dispatches per quarter | 0.46 | 0.56 | 0.67 |
| quiet quarters | 61.6% | 54.5% | 47.7% |

`pnpm batch -- --runs 300 --ticks 400 --country all --turbulence <level>`:

| | calm | ordinary | turbulent |
|---|---:|---:|---:|
| passive growth p50, %/yr | 2.93 | 2.93 | 2.90 |
| passive unemployment p50, % | 12.83 | 12.84 | 12.86 |
| passive deposed | 1% | 1% | 1% |
| random-policy deposed | 80% | 79% | 77% |

The century averages barely move. The dial changes how often the player is hit and how much the
wire has to say about it, not what kind of economy the country becomes, which is what the issue
asked for. A calm world's bad news falls by a quarter rather than vanishing because most of what
remains is the desk reading the country's own condition — idle factory gates, thin pay packets —
which is the player's own record and correctly untouched.

## Alternatives considered

- **Filter the wire by tone or volume.** The smallest change and the literal reading of the
  issue. Rejected by ADR-0031: a hard event is a warning, and hiding it makes the game harder
  while appearing to make it calmer. Condition reports are already capped and cooled
  (`NEWS_REPORTS_PER_QTR`, `NEWS_COOLDOWN_GROWTH`); a second budget on top would mostly suppress
  the reports a struggling player most needs.
- **A continuous multiplier.** Rejected for the player and for the record: three named levels
  can be explained in a sentence each, stamped on the letterhead and the report card, and
  compared across saves. A slider at 0.83 cannot. Adding a level is one id and one row.
- **A fourth boolean rule, `calmWorld`.** Fits ADR-0020's plumbing for free. Rejected because it
  cannot express "rougher than history", and because a rule is off in ordinary play while the
  ordinary world is the middle of this setting, not its absence.
- **A `CountryParams` field.** Rejected for ADR-0015's reason: a country recipe describes what
  you inherit, and Meridia in a calm world is still Meridia. A drafted country would also have
  to carry it, and the difficulty matrix would have to be re-measured per value.
- **Scale only the hazards.** Measured and rejected: a calm world at `hazard: 0.5, cycle: 1`
  cut the foreign desk by 11% (3157 → 2812 dispatches over the sixty centuries) and bad news to
  83 a century, against 10.5% of the paper and 70 a century at the time with the cycle scaled too. Partner
  slumps, the most common bad dispatch abroad, are amplitude, not hazard. (Measured before
  ADR-0045 merged; the comparison, not the level, is the finding.)

## Consequences

**Good:**

- The default is the calibrated game, proved by the goldens and the 400-quarter hashes.
- One table in `constants.ts`; three read sites (`shocks` through `droughtOdds`, `world`,
  `finance`). A new level is one
  id and one row, and `TURBULENCE_COPY` in `ui/src/turbulence.ts` is a total `Record` that fails
  the build until it has words. The posting room's caption reads its frequencies off the engine
  table, so a retune cannot leave the copy promising a world the engine no longer runs.
- `pnpm batch` and `pnpm events` take `--turbulence`, so any balance question can be asked of
  the other worlds.

**Bad:**

- A run in a calm or turbulent world is not evidence about balance. The difficulty ratings and
  the report card's grade cuts were measured in the ordinary world; the header stamps a
  non-ordinary world and the report card says which world a grade was earned in, but nothing
  stops a screenshot being read as an ordinary run.
- `init`, `createSave`, `runInterregnum` and the store's start actions now carry five
  positional replay inputs. The next one should be the occasion to gather them into a record.
