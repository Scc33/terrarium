# ADR-0023 — Human capital is a stock, not school capacity

**Status:** Accepted · **Date:** 2026-08-21

## Context

The engine already made schools consequential. `gov.capacity.education` accelerated technology
catch-up, supplied skilled staff to research, lowered fertility and raised societal power. It
was simultaneously the school system and the people that system had taught.

That proxy made a two-year building programme educate a workforce on the building schedule. A
paired 24-seed Meridia measurement at `2b8785e` put the problem in scale: one education project
raised the education number from 0.19 to 0.58 by quarter 40 and immediately raised manufacturing
technique 10.8%, real GDP per head 12.9%, and effective research delivery 88.0%. The century
effect was plausible; the first-decade timing was not. Finishing classrooms is not the same event
as a taught generation entering work.

There was also no instrument that named the intermediate result. A player could fund schools and
later see technology, fertility, or productivity move, but could not tell whether the workforce
between the policy and those outcomes had changed.

## Decision

School capacity and human capital are separate stocks.

`gov.capacity.education` remains the Layer-2 institution the cabinet builds. The `demography` step
owns `demography.humanCapital`, a bounded economy-wide index of knowledge and skills carried by
the workforce. Each quarter it closes one percent of the remaining gap to current school
capacity, a roughly seventeen-year half-life. Opening human capital equals the country recipe's
opening education capacity; old recipes and saves therefore acquire a deterministic inherited
workforce without a new replay input.

Technology absorption, research staffing, fertility, and societal power read human capital, not
the school institution. They all depend on the same people and therefore inherit the same lag.
The pipeline order does not change: demography updates the stock immediately before technology,
while new school capacity still arrives later in `fiscal` and can only begin teaching next
quarter.

The player sees a fogged `human_capital` instrument called **Workforce skills**, expressed as a
0–100 index. It unlocks at 0.35 statistical capacity with the labour-force and education census;
the exact stock remains true state and does not cross the observation boundary.

## Alternatives considered

**Keep education capacity as the proxy.** This preserved every calibrated endpoint and required
no schema change. It was rejected because it made an institution and its output identical,
erasing the main policy fact worth playing: schools pay off after the government that built them.

**Track education separately in every five-year age band.** This would represent pupils entering
work and educated cohorts retiring directly. It was rejected for now because the engine does not
yet model school enrolment, credentials, or skill-selective migration; an age ledger would add
seventeen precise-looking fields without evidence to distinguish them. The scalar stock preserves
the generational lag the downstream mechanisms actually need.

**Make human capital a country parameter or cabinet dial.** A separate opening input would let a
country inherit strong schools and a weak workforce, or the reverse. A dial would let the player
set the result directly. Both were rejected: current country recipes do not carry evidence for an
independent opening value, and human capital is an outcome of schooling rather than an order a
cabinet can issue. The state field leaves room for a later evidence-backed country input without
inventing one now.

## Consequences

School investment now has a small first-decade return and a large generational return. At the
chosen adjustment rate, the same paired experiment reaches workforce skills of 0.31 rather than
school capacity of 0.58 at quarter 40; its real-GDP-per-head effect is 2.5% then, 17.2% by quarter
120, and 29.9% by quarter 400. The effect has not been tuned away—it has been moved to the people
who carry it.

Neglected schools and an educated workforce can now diverge. That is deliberate, but it means a
passive country's human capital decays more slowly than the institution and the passive century
moves slightly even though the opening state is unchanged. Golden replays and all economic
baselines therefore require review.

The 1,000-seed comparison against current schema 29 measured that review. Passive play moved
from 2.79% to 2.81% median annual growth and 12.24% to 12.23% unemployment. Developmental play
moved from 2.90% to 3.04% aggregate growth and from 10.84% to 11.58% unemployment: delayed
fertility decline leaves a larger labour force before skills catch up. Random 120-quarter play
moved from 4.06% to 3.94% growth, with no NaN or price explosion in either 1,000-run sample. The
full 120-run, all-country stability matrix added no non-finite run or explosion; the random-policy
explosion seeds were identical to schema 29. This is a real timing tradeoff, not an inert schema
addition, and it is why the lag remains visible rather than tuned back into the old proxy.

The scalar cannot yet describe unequal access, credential mismatch, brain drain, or the age at
which schooling occurred. Those are future mechanisms, not facts smuggled into this index. A
future age- or cohort-specific model must preserve the distinction established here: school
capacity is an institution; human capital belongs to people.
