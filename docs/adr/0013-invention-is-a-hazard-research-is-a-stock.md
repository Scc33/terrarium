# ADR-0013 — Invention is a hazard, research is a stock

**Status:** Accepted · **Date:** 2026-08-10

## Context

ADR-0012 made technology a moving gap and gave the player one lever, `spending.research`, whose
character changes with position: adaptation when behind, original work when near the frontier.
Schema 18 implemented that as arithmetic. Three properties of the implementation turned out to
misrepresent the thing being modeled, and one was inconsistent with §4.3.

**Research was a flow.** The quarter's appropriation was divided by the quarter's GDP and became
technique in the same quarter. Cutting the budget stopped progress immediately. That makes a
research programme a switch, and it makes strangling one costless and instantly visible — the
opposite of the political fact worth modeling, which is that a research base outlives the
government that funded it.

**Invention was deterministic.** Original research added a smooth per-quarter increment to the
world frontier. Catch-up and invention therefore differed only by a coefficient, when the thing
that actually distinguishes them is *risk*: the technique you are adapting demonstrably exists
and somebody is selling it; the one you are inventing may not arrive at all.

**Research was blended across sectors.** One national attainment figure decided the
catch-up/invention split, so an economy at world practice in its machine shops and a generation
behind in its fields got one averaged programme and could express neither.

**Original research escaped the extractive ceiling.** `creativeDestruction` priced absorptive
capacity, so an unchecked incumbent slowed catch-up. It did not touch the frontier term. A
captured economy therefore could not absorb what others had invented but could still buy
invention with money — backwards on §4.3's own logic, under which incumbents block *the new*
hardest.

## Decision

Research accumulates into `tech.researchStock`, decaying at `RESEARCH_STOCK_DECAY_Q`. All
downstream gains read the stock's flow-equivalent, `stock × decay`, rather than the cheque.

The country's own contribution to the frontier becomes a hazard process: effort sets a
per-quarter probability and a breakthrough is a fixed `BREAKTHROUGH_SIZE` jump that writes an
unconditional news item. The frontier's *historical* schedule stays deterministic — that part is
history, not dice.

The catch-up/invention split is derived per sector from that sector's own position. A sector's
contribution to the world frontier is weighted by `TECH_EXPOSURE`, so frontier manufacturing
pushes world technique and frontier haircuts largely do not.

`creativeDestruction` now gates the frontier term as well as absorption.

**Both new mechanisms are expectation-preserving by construction.** The steady-state stock is
`effectiveShare / decay`, so a programme held steady behaves exactly as schema 18 did.
`hazard × size` equals the deterministic term it replaced, so the century-long average is
unchanged. Only transients and variance moved, which is why none of the schema-18 coefficients
needed recalibrating.

## Alternatives considered

**Leave research a flow, and tune the coefficients up.** Cheapest, and it would have made the
lever feel stronger. It does not produce the property that mattered — a programme that survives
one bad budget — and a stronger instantaneous lever makes the switch behaviour worse, not
better.

**A research *level* the player sets directly, with the ramp implied.** Rejected because it
hides the lag inside a control rather than in the world. The stock is inspectable state that the
truth panel can show and the news wire can imply; a smoothed control is a UI fiction.

**Make breakthroughs rare and enormous** (one or two per century, 5–10 % of frontier each).
More dramatic, and closer to how popular history tells the story. Rejected on the reachability
rule: at a plausible research budget most centuries would contain zero, and a mechanic the
player never sees is not a mechanic. At `BREAKTHROUGH_SIZE = 0.012` a maximum programme lands
about twenty per century and a normal one about one per decade — visible without being routine.

**Let the player direct research at a sector.** The natural extension of sector-directed splits,
and deliberately not taken: what each sector's research *is* stays derived from position, which
keeps the lever one number and keeps the model's claim that position dictates character. A
directed-research control is a separate design question, not a consequence of this one.

## Consequences

A research programme is now something a government inherits, coasts on, and can quietly
strangle over about six years — which makes it a political object rather than a budget line.

Any single century is a gamble. Property tests about the frontier must assert over seeds; one
run proves nothing, and `tests/properties/technology.test.ts` says so at the assertion.

The passive and fuel-tax replays are bit-identical apart from the schema stamp and added fields:
a zero-research government has an empty stock, a zero hazard, and a catch-up rate that reduces to
exactly the schema-18 expression. The economy/politics seam is intact.

The extractive ceiling now binds on both technology channels, which strengthens the divergence
mechanism ADR-0012 relies on: a captured economy neither absorbs nor invents.
