# ADR-0012 — Technology is a moving gap, not an unlock tree

**Status:** Accepted · **Date:** 2026-08-08

## Context

The engine has modeled technology since schema 7 as two continuous quantities: a world frontier
that advances on a historical schedule, and the productive technique each domestic sector has
attained. Education, openness, and incumbent power decide how quickly a country can close the
gap. None of this reached the player. Technology silently changed TFP, education was the only
indirect lever, and there was no instrument by which a government could tell whether it was
catching up or falling behind.

A conventional technology tree was a live UI option. It would make progress visible and produce
familiar goals, but it would also replace the engine's continuous development mechanism with a
list of authored inventions and dates. The player would learn the tree rather than learn why the
same appropriation transforms a poor country and barely moves a rich one.

## Decision

Technology remains continuous and systemic. The player sees one fogged, lagged
`technology_attainment` instrument: output-weighted domestic technique as a percentage of each
sector's exposure-adjusted world frontier. A rising reading means the country is catching up; a
falling reading means domestic practice improved more slowly than the frontier. The underlying
frontier, sector attainment, and TFP remain true-state fields and never cross the observation
boundary.

`spending.research` is a recurring Layer-1 budget programme. Its standing appropriation can be
fixed cash, CPI-indexed cash, or a share of the latest official GDP release. The resolved amount
is normalized by GDP, leaks through weak administration, and is constrained by education's supply
of skilled staff.
Its use is derived from the country's position: behind the frontier it accelerates absorption of
known technique; near the frontier an increasing share funds slower original research. Original
research advances both the world frontier and the domestic technique that produced the increment.
There is no separate catch-up/frontier toggle and no invention chosen from a list.

Research is an exact treasury line and real government final demand, concentrated in services and
equipment, but it does not add physical capital. The seven exact outlay lines remain available in
`PublishedState`; the ledger chart combines research and active ministry construction into one
state-building band because its visual language supports at most six readable categories.

## Alternatives considered

- **A conventional technology tree with discrete inventions.** Rejected: it scripts the answer,
  creates a second progression system beside the economy, and turns country position into an
  eligibility rule instead of a payoff difference.
- **Publish a 1946-base technology index.** Rejected: domestic technique can rise while the world
  pulls away. A base-year index would congratulate the player for losing the development race.
- **Separate “technology transfer” and “frontier R&D” dials.** Rejected: governments do not get a
  clean switch between the two, and the proposal's central claim is that the same button has a
  different return by position.
- **Keep education as the only technology policy.** Rejected: education is an absorptive stock,
  not a current research effort. It makes R&D usable but cannot express a government choosing to
  fund it.
- **Expose exact frontier and attainment curves.** Rejected: productive technique is an estimated
  national-accounting fact, not a setting the government knows. Exact curves would breach the fog
  boundary and make the statistical office irrelevant to this decision.

## Consequences

**Good:** technology progress is visible without becoming scripted; the policy is replay-safe and
works through existing administration, education, openness, politics, demand, and TFP channels;
poor and rich countries face different returns from one legible action; the instrument can worsen
even while its numerator rises, preserving the meaning of the frontier gap.

**Bad:** one aggregate reading hides sector differences; the R&D payoff is slower and less
immediately gratifying than an unlock; the player must fund productivity accounts before seeing a
number; calibration now has to keep catch-up useful, frontier work expensive, and the 100-percent
face meaningful across all country recipes. The six-band ledger visualization also cannot show
research and ministry construction as separate colours, so the exact research amount must remain
visible in the summary and data contract.
