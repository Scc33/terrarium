# ADR-0044 — Wage bargains use household inflation expectations

**Status:** Accepted · **Date:** 2026-10-01

## Context

Issue [#221](https://github.com/Scc33/terrarium/issues/221) asks whether household inflation
expectations can anchor the sharp inflation swings. A nominal forecast already exists:
`ledger.inflationExpectations` closes 12% of the gap to experienced annualized CPI each quarter,
and money-financed deficits lift it directly. Price drift, investment and credit read it, but
wages indexed themselves to the price step's current quarterly spike. A short shortage could
therefore enter the next quarter's production costs before household expectations changed.

The [Fed's discussion of inflation expectations](https://www.federalreserve.gov/newsevents/speech/Bernanke20070710a.htm)
describes expected inflation as an input to wage and price setting, with one-off energy changes
becoming persistent when they alter expectations. The issue's
[Brookings explanation](https://www.brookings.edu/articles/what-are-inflation-expectations-why-do-they-matter/)
and [Cleveland Fed measurement overview](https://www.clevelandfed.org/center-for-inflation-research/measures-expected-inflation)
also distinguish expectations from realized inflation. These motivate the channel, not the
model's coefficients.

## Decision

The inflation component of a wage bargain reads `ledger.consumerInflationExpectations / 4`,
multiplied by the existing `WAGE_INFLATION_PASSTHROUGH`. The household forecast is a separate
annualized stock, initialized to the same opening prior as the nominal forecast, adapting at the
same rate and bounded by the same rails. Keep the Phillips slack anchor, productivity
passthrough, downward wage stickiness and statutory wage floor intact.

Monetary updates the household forecast from last quarter's experienced household CPI before
this quarter's price step. It does not read a noisy, lagged official print: households encounter
purchase prices whether or not the statistics office is funded. A single spike has a limited
impact on bargains; persistent inflation moves the expectation and feeds subsequent costs.

The existing nominal forecast and its direct fiscal-printing impulse retain their price-drift
and private-rate readers. Household bargains learn printing's effects as prices rise, without
also indexing wages directly to the financing book. Finance and production retain their
existing prior-quarter forecast because their pipeline positions precede monetary.

This is an adaptive nominal anchor, not a promised central-bank target. Both forecasts remain
hidden engine state. The new stock is a schema event, but requires no new indicator, replay
input, noise draw or pipeline reordering; saves reconstruct it through replay.

## Alternatives considered

- **Continue immediate spot-CPI wage indexation.** Rejected: it bypasses household expectations
  precisely where a temporary shortage becomes a persistent cost shock.
- **Use the existing nominal forecast for wages as well.** Measured and rejected: its direct
  printing premium prematurely passed the financing mix into wages, materially increasing
  random-policy unemployment and reducing growth even while ordinary inflation tails narrowed.
  The household forecast removes that extra channel and retains the tail improvement. The
  comparison is recorded in `docs/tuning-lessons.md`.
- **Blend spot CPI and expectations in wages.** Measured at an even split before separating the
  forecasts. It narrowed tails less while retaining part of the immediate indexation and
  requiring another coefficient. The established partial passthrough already limits wage
  compensation.
- **Add a fixed 2% target or a separate credibility stock.** Deferred: the game has no target
  announcement or credibility mandate. An unconditional target would supply every government
  an anchor it never earned and could hide the cost of money financing.
- **Add independent expectations for every cohort.** Deferred: bargaining is sectoral and the
  price step measures aggregate household CPI. Cohort-specific forecasts, their aggregation
  and their surveys need a separate design.
- **Smooth the published inflation series.** Rejected for this issue: changing the display
  would leave the immediate wage-cost feedback unchanged. Statistical lag, noise and revisions
  remain the existing fog mechanism.

## Consequences and validation

Temporary scarcity still changes prices immediately. Wage compensation arrives gradually as
experience changes the forecast, so wage-price feedback becomes less sensitive to one quarter.
Persistent inflation remains costly. The delay can leave workers temporarily less compensated
during a shortage; it guarantees neither a smaller initial shock peak nor a smaller absolute
change between every pair of quarters.

`pnpm inflation-expectations -- --runs 40 --ticks 416` compares the live bargain with the former
spot-CPI input, using paired seeds on every authored and procedural recipe. The research-only
counterfactual substitutes the labor step's household forecast and restores the ledger before
the next step, leaving nominal financing pressure intact. Before introducing the new stock,
this substitution reproduced all three original 40-quarter golden hashes exactly.

The report uses the stability harness's deposition cutoff, shock windows and quiet quarters,
and includes deliberate printing alongside passive, developmental and random policies. The
printing arm uses `unlimitedCapital` in both bargains so every initial order is enacted, with
ordinary tenure and fog retained. Calibration figures belong in `docs/tuning-lessons.md`;
investigation 0005's broader supply-shock and reporting questions remain open.
