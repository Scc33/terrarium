# ADR-0022 — The manual is generated from the game, not written beside it

**Status:** Accepted · **Date:** M6.6

## Context

Three issues asked for the same missing thing from three directions.
[#33](https://github.com/Scc33/terrarium/issues/33) wanted an explanation at the start —
"even I as a creator don't know what all the levers do right now".
[#32](https://github.com/Scc33/terrarium/issues/32) wanted the methodology visible in the UI.
[#80](https://github.com/Scc33/terrarium/issues/80) wanted the manual a boxed strategy game used
to ship with.

The game already contained most of the words. `NAMES` explains every instrument in one plain
sentence, `COHORT_NOTES` and `BLOC_NOTES` say who each group is, `RULE_COPY` explains every
standing order, `INDICATOR_FUNDED_AT` knows which survey each instrument waits for. What was
missing was a place to READ them without hovering the exact control they are attached to — and,
for the methodology, a place at all: how a print is lagged, noised and revised existed only in
`pipeline/statistics.ts`'s comments.

The obvious build is a documentation page: prose in a component, or a markdown file rendered
into an overlay. It is also the build that decays. The wall has 29 instruments and the cabinet
16 levers, each of which arrived at some point after the first draft of any such page. A manual
that lists them by hand is wrong the first time somebody adds an indicator, and — this is the
part that matters — wrong SILENTLY: the missing entry reads to a player as "the game has no
answer for this", which is worse than no manual, because they stop asking.

## Decision

**One portal, and every chapter that lists something the game HAS is generated from the same id
lists and copy tables the screens read.**

`ui/src/manual.ts` is pure data. Its cabinet chapter walks `LEVER_GROUPS` / `LEVER_COPY` /
`CAPACITY_COPY`; its wall chapter walks `INDICATOR_IDS` sorted by `INDICATOR_FUNDED_AT`, taking
every word from `NAMES`; the room chapter walks `BLOC_IDS`, `COHORT_IDS` and the platform table;
the run chapter walks `GAME_RULE_IDS` and `APPOINTMENTS`. All of those are compile-enforced
total `Record`s, so a new lever, indicator, sector, bloc, institution or rule cannot reach the
game without words, and the words reach the manual the same quarter.

What is authored is only prose about MECHANISM, which no id list can generate: how an order is
priced, how a print is made, what happens in a quarter, why the financial loop is a cycle rather
than a spiral. Numbers inside that prose are read from the engine's exported constants wherever
one exists, so a retune moves the manual too.

Two consequences follow, and both were the point:

- **The lever copy moved out of the cabinet.** `DIAL_TIPS` and the three `CAP_*` tables lived
  inside `ControlRail.tsx`. They now live in `ui/src/levers.ts`, total over `DialPath` and
  `CapacityId`, and the rail reads them like everybody else. The rail keeps only the slider's
  arithmetic — range, step, format — which belongs to the control rather than to the policy.
- **The methodology is written once.** The records office's METHODOLOGY entry opens the
  handbook on its own chapter rather than restating it. Two accounts of how a print is made
  would eventually disagree about the one thing a player is relying on.

The opening walkthrough (#33) is deliberately NOT a second manual. It is six cards that say what
each region of the screen is and then hand the player the handbook. It is a card in a corner
rather than a modal, because every card is about a region of the war room and a dialog in the
middle hides its own subject; and being briefed is a `localStorage` preference of the browser,
never part of the save, for the same reason board pins are.

## Alternatives

**Markdown files rendered in an overlay.** Reuses `docs/`, and `docs/` is written for
contributors, not players — `tech-architecture.md` is what the code IS. Rendering it would ship
the wrong register and still list instruments by hand.

**Tooltips only, and more of them.** This is what the game already had, and #33 is the report
that it is not enough: a tooltip answers a question you are already holding the control for. It
cannot answer "what should I be doing", and it cannot be read before the first quarter.

**A static help page outside the game.** Free to write and impossible to keep honest. Nothing
would fail when a lever changed.

## Consequences

- A new indicator or lever appears in the handbook for free, and the `add-indicator` /
  `add-bloc-or-institution` skills gain nothing to remember.
- `tests/ui/manual.test.ts` asserts the generation is still wired to the id lists — every
  instrument by its plate, every bloc and class by its name, every rule by its label. A
  hand-typed copy that once matched them fails there.
- `LEVER_GROUPS` is an ARRAY, so the compiler cannot check it covers every `DialPath`;
  `tests/ui/levers.test.ts` does. This is the same shape of hole `INDICATOR_SPECS` has, and it
  is worth knowing it is there.
- The prose about mechanism CAN go stale — a retune of a channel the manual describes in words
  will not fail anything. That is accepted: the alternative is not describing mechanism, and
  mechanism is the thing the issues were actually asking for.
