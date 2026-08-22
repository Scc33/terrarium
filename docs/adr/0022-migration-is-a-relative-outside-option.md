# ADR-0022 — Migration is a relative outside-option flow, not a population target

**Status:** Accepted · **Date:** 2026-08-21

## Context

The demographic transition already lowers births as incomes, education, urbanization, and
survival improve. Population nevertheless changed through births and deaths alone, apart from
an old labor-slack term that usually produced emigration. A country could become the most
successful place in the simulated world without attracting people, and a failed country could
not lose more people because its performance fell behind a plausible alternative.

Issue #99 also requires the cabinet to control immigration and the political machine to react
when arrivals become large. Those are three different questions that must not collapse into one
number: whether people want to move, how many entrants the state admits, and how the resident
political economy prices the realized inflow.

An absolute living-standard threshold is not suitable. Country recipes deliberately begin at
different levels, so it would grant wealthy inheritances a permanent inflow and punish poor
inheritances before the first cabinet order. Nor is another fully simulated country a cheap
reference: it would couple every replay to a second engine and multiply the calibration surface.

## Decision

Migration remains in the `demography` step and is deterministic. Desired net migration combines
two signals:

1. domestic mean log consumption growth since the country's own 1946 baseline, compared with an
   outside option that advances with a calibrated share of the global technology frontier; and
2. the current gap between unemployment and its natural rate, so available work matters before
   a long-run welfare lead has accumulated.

The comparison is capped before it can become a permanent century-scale force. Positive desired
flows are clipped by `DialState.immigrationLimit`, expressed as a maximum annual share of the
resident population. Negative desired flows ignore that dial and are clipped only by a physical
emigration bound: a closed border may refuse entrants but cannot make a failing country keep its
residents. Realized migrants are allocated across young-adult age bands, so they join both the
labor force and the future birth base rather than changing a headline total alone.

The 1946 comparison is stored separately from the report-card welfare baseline. A later
appointment moves the start of the player's score, not the inherited outside-option anchor, so
the caretaker and an ordinary 1946 government produce the same population under the same orders.

The exact policy dial is part of the ordinary action log, policy history, save, and replay
contract. The outcome is separately published as the fogged `net_migration` indicator,
annualized per 1,000 residents and gated by civil-registration capacity.

Politics reads realized inward migration, not the ceiling. Employers and landowners gain favor
from a larger labor and customer base; organized labor loses favor from the added labor supply.
Only inflows above an ordinary churn rate add broad revolutionary pressure. Moving the ceiling
is quoted and charged through the existing veto-player machinery in `politicalCostOfAction`.

## Alternatives considered

- **Simulate a reference country alongside every run.** Rejected: it doubles the engine host,
  makes results depend on a hidden second recipe, and couples save compatibility to two runs.
- **Compare absolute income or population levels.** Rejected: it rewards the inherited recipe,
  not relative performance under the player, and makes poor countries unattractive forever.
- **Scale all migration by the border dial.** Rejected: it would let a zero setting eliminate
  emigration and turn immigration policy into an implausible population lock.
- **Apply a universal approval penalty.** Rejected: migration is distributive. Bloc preferences
  and high-inflow unrest expose that conflict without scripting every voter to hold one opinion.

## Consequences

- Population, labor supply, output, fertility, bloc favor, and unrest now respond systemically to
  relative performance; aggregate growth is no longer comparable to pre-v28 runs without also
  inspecting per-capita outcomes.
- The attraction signal reads the settled state available before the quarter's economy runs, so
  it reacts with one-quarter discipline rather than looking ahead.
- The migration baseline always opens in 1946; the report-card baseline opens when the player
  takes office. Neither scoring nor appointment timing can reach back into population history.
- A ceiling binds only when the country is attractive. Raising it cannot manufacture immigrants,
  and lowering it cannot prevent departures.
- `net_migration` joins the indicator contract and `immigrationLimit` joins the policy contract,
  requiring schema 29, new goldens, a measured fixed dial face, and a wider desktop rack.
- Migrants are not a separately tracked identity or cohort. The politics captures labor-market
  distribution and high-flow pressure, but not nationality, assimilation, or second-generation
  politics; adding those would be a separate model decision.
