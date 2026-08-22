# ADR-0021 — The year you take office is a replay input, and the years before it are governed

**Status:** Accepted · **Date:** 2026-08-21 · Extends [ADR-0015](0015-game-modes-are-replay-inputs.md), [ADR-0020](0020-the-rules-of-a-run-are-a-set.md)

## Context

Issue #102: every posting begins in 1946. The whole catalogue is a set of 1946 settlements, so
the only country anyone can be handed is a poor one with no instruments, and the parts of the
game that need a developed economy — the finance cycle, an ageing population, a slow frontier —
are eighty clicks away from the opening screen. The dev console has run a country forward to a
year since ADR-0010, which is the same request answered for developers only.

Three things stood in the way of just starting the clock later.

**A save is `(params, seed, actionLog, tick)` and everything else is replay (ADR-0001).** There
is no such thing as *setting* the country the player inherits. Whatever they take over has to be
something the engine actually produced from those four inputs, or it stops being reproducible
and stops being a save.

**Nobody governing for a quarter-century is not a neutral opening, it is a broken one.** A
passive interregnum arrives in 1973 with the 1946 statistical office, so the wall the player is
handed has three instruments on it — the fog mechanic (§6.1) inverted into a worse game rather
than a later one. The fixed-cash appropriations of 1946 have also been repealed by growth by
then, and the state has retired its entire debt (investigation 0008).

**The report card grades a tenure.** `score` accumulates from quarter zero and
`quartersGoverned` counts from it, so a player appointed in 1973 would be graded on a
predecessor's twenty-seven years — discounted, at `WELFARE_DISCOUNT_Q`, so heavily that their
own century would barely register in the average.

## Decision

State carries **`meta.appointedAt: Qtr`**, the quarter the player takes office. It is a replay
input with a save field and a published identity, exactly as `meta.rules` is: the same country,
seed and action log produce a different century without it. Zero is the ordinary 1946 posting,
which is every save written before schema 28.

The quarters before it are the **interregnum**, and a caretaker administration governs them —
in the ordinary `applyActions → step` loop, with the ordinary RNG, producing an ordinary state.
`runInterregnum` returns that state and the orders that produced it, and **those orders go into
the save's action log**, so reopening a 1973 posting replays the caretaker's quarters like any
others and needs no policy code at load time.

The caretaker does exactly two things: it votes the 1946 appropriations into `gdpShare` rules at
the share they opened on, and it invests in the four state capacities every eight quarters. It
sets no rate, moves no tax, reforms nothing and fights no campaign. Those two things are the
`dev-GDP-share` arm of `pnpm debt-baselines`, so the interregnum is a baseline this repo has
already measured over centuries rather than a second, drifting model of how a government
behaves. What it hands over at each offered year is itself measured, by `pnpm inheritance`, and
tabulated in `docs/country-scenarios.md`.

Three consequences follow, and each is one condition in one place:

- **The political clock does not run for the caretaker.** No ballot (nobody elected it), no
  deposition (the record says the country reached the appointment), no accrual — and its orders
  are not charged political capital, because charging a stock that cannot refill would make the
  inheritance a function of how the opening twenty points happened to fall rather than of the
  country. Every order is still *quoted* and the blocs still spend favour on every one, so the
  politics the player takes over is the one the caretaker's programme earned.
- **The record opens when the player does.** Welfare, corridor quarters and governed quarters
  all accumulate from `appointedAt`, which is also what makes `baselineWelfare` the standard of
  living they actually inherited, and `quartersGoverned` their own tenure.
- **A later appointment is a shorter game.** History still ends in 2050. Prosperity is already
  graded as a *rate* over a discounted tenure (§3.3), so a 2005 posting is comparable with a
  1946 one without any further arithmetic. It must still be a game: `appointmentTick` clamps to
  `LAST_APPOINTMENT_TICK`, one quarter short of the close, because an appointment ON the closing
  quarter arrives to a ledger that has already shut — nothing accumulates, no baseline is banked,
  no verdict can ever be returned, and the government advances past 2050 in a run with no end.
- **A save's two replay inputs have to agree.** A run cannot have stopped before its own
  government took office; `replayWindow` in `ui/src/saveFile.ts` refuses one that says it did,
  because replaying it hands back an *interregnum* as a playable game — orders quoted at their
  real price and charged nothing, the political clock frozen, for as many quarters as the gap.
  Refused rather than repaired, for that file's usual reason: moving either number opens *a*
  run, not *the* one that was saved.

ADR-0020's two constraints carry over unchanged and are the proof obligation:

- **Inert when it is zero.** Every condition above reads `tick < appointedAt` or
  `tick >= appointedAt`, which at zero is the expression that was already there.
  `pnpm diff-state --moved-only` moved `meta.schemaVersion` and nothing else in either golden
  replay, and `tests/properties/interregnum.test.ts` pins `init(p, s, r, 0)` bit-identical to
  `init(p, s, r)`.
- **It lifts one constraint.** The appointment moves when the player's tenure starts. It does
  not change the pipeline, the fog, the constants, or what any lever does.

## Alternatives considered

- **Offer a richer 1946 country instead** — a "developed" archetype in the catalogue, reachable
  at quarter zero. Much the smaller change, and it needs no schema bump. Rejected because the
  request is for a later *year*, and the two are not the same thing: the frontier's growth
  schedule, the age pyramid's own transition and eighty years of accumulated shocks are what
  make 1995 different from a rich 1946, and none of them can be written into a parameter vector.
- **Regenerate the caretaker's orders on load rather than storing them.** The policy is pure and
  deterministic, so the log is redundant — a save would be a few hundred bytes smaller. Rejected
  for ADR-0011's reason with more force: a retune of `CARETAKER_CAPACITY_SPEND` would silently
  rewrite the country every existing late posting had inherited, and the player would reopen a
  different game than the one they saved.
- **Reset the tenure at the handover with a `takeOffice(state)` function**, leaving the
  interregnum to run as an ordinary game and wiping the political slate afterwards. Rejected
  because the pipeline has to know it is in an interregnum *while it runs* — a caretaker that
  could be deposed at quarter 40 would hand over 156 ungoverned quarters and the 1946
  statistical office, one run in twelve, with nothing in the UI able to say why the wall was
  empty. Knowing the appointment from `init` makes that a condition instead of a rescue.
- **A "skip to year" that fast-forwards passively**, as the dev console does. Free; it already
  exists. Rejected because it produces the empty wall above. The console keeps it precisely
  because a developer wants an unpoliticked passive run to a year, which is a different thing
  from an inheritance.
