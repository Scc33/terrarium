# 0002 — Capital formation's share of expenditure only ever falls

**Status:** Open
**Raised by:** shipping the expenditure accounts (schema 16). Three of the four components were
published; the fourth was measured, found degenerate, and deliberately left unpublished.
**Measured at:** `a4c13cd`, 3 countries × 3 seeds × 400 quarters, decade means of the shares of
total final expenditure.

## What was being built

An expenditure-side decomposition — household consumption, capital formation, government final
consumption, gross exports — so the player can see *what kind of economy* they are building
rather than only how fast output grew. The pitch was that a country turning itself into an
exporter, or eating its own capital formation, should be visible as composition.

Two of those three readings work. The third does not, and the government component turned out
not to be publishable at all.

## What the shares actually do

```
passive
  decade        1946  1956  1966  1976  1986  1996  2006  2016  2026  2036
  households     79.1  81.8  82.8  83.1  83.4  83.8  84.2  84.5  84.7  84.9
  capital form    6.0   4.8   4.2   3.6   3.3   2.9   2.5   2.3   2.1   2.0
  government      2.3   1.4   1.0   0.7   0.5   0.4   0.3   0.3   0.2   0.2
  exports        12.7  12.0  12.0  12.6  12.8  12.9  12.9  12.9  13.0  12.9
  K / annual Y    0.7   0.6   0.6   0.5   0.5   0.5   0.4   0.4   0.4   0.4

developmental
  decade        1946  1956  1966  1976  1986  1996  2006  2016  2026  2036
  households     78.5  80.3  79.8  79.0  78.5  77.9  77.6  77.2  76.8  76.4
  capital form    6.3   4.9   4.2   3.6   3.3   3.0   2.8   2.8   2.8   2.8
  government      2.4   1.7   1.3   1.0   0.9   0.8   0.7   0.6   0.6   0.6
  exports        12.9  13.1  14.7  16.4  17.4  18.3  18.9  19.4  19.8  20.2
  K / annual Y    0.7   0.6   0.6   0.5   0.5   0.5   0.4   0.5   0.5   0.5
```

("developmental" = all four capacities funded every 8 quarters, the `tools/indicator-ranges.ts`
policy. Total final expenditure = C + I + G + X, real at base prices.)

**Exports respond to policy and capital formation does not.** The export share is flat under
passive play (12.7 → 12.9) and climbs by more than half under a developmental century
(12.9 → 20.2). That is a real, legible signal, and it is what the published `export_share`
instrument reads.

The capital-formation share falls monotonically under *both* policies — 6.0 % → 2.0 % passive,
6.3 % → 2.8 % developmental. Funding every capacity for a century arrests the decline in the
last few decades but never reverses it. There is no play that makes this number go up over the
long run, so the instrument cannot answer the question it was built for: *am I becoming an
investment economy?* The honest reading of the published series is "how fast is capital
formation losing ground", which is not what a player will take from a rising or falling needle.

## Why it falls

Private investment is `replacement × invFactor`, where
`replacement = Σ DEPRECIATION_Q × capital` (`pipeline/production.ts`). It is anchored to the
*capital stock*, not to output. So the investment share of expenditure is approximately
`DEPRECIATION_Q × K / (C+I+G+X)` — it tracks the capital/output ratio, and that ratio falls.

The last row is the finding under the finding: **K / annual Y sits at 0.4–0.7 and declines**.
Real postwar economies run a capital/output ratio around 3, roughly constant. Output here grows
about tenfold over the century while the capital stock grows about fourfold, so the economy
gets steadily less capital-intensive as it industrialises — the opposite of the pattern the
growth story is meant to tell. `invFactor` cannot fix this: it is a bounded multiplier
(`0.5 … INVESTMENT_FACTOR_MAX = 1.7`) around a replacement anchor that is itself shrinking
relative to output.

## The government component

Government final consumption is 2.3 % of final expenditure in 1946 and **0.2 % by 2036**. This
is not a measurement error, and it is arguably not even a bug: the modelled state buys goods
(`procurement`) and pays transfers, but it has no payroll — there is no public-sector employment
in the production side at all. Its purchases really are small.

It is, however, unpublishable. A dial reading "government: 0.7 % of the economy" is true and
would badly misinform a player whose treasury is running 20 % of GDP through transfers,
subsidies and public works. So `StatRecord.governmentShare` is measured — it keeps the identity
exhaustive, and `tests/properties/national-accounts.test.ts` pins the four shares summing to 1 —
and is deliberately not an indicator. The overlay states the resulting shortfall rather than
renormalizing it away.

This also retired `government_demand_share` (v15), which measured the same quantity against a
domestic-demand denominator and had drifted to living at 1–3 % on a 0–20 dial face. The
`gauge-domains` test does not catch that failure: it fails on *pegging*, and a needle parked
against the left rail without crossing it is not pegged.

## What this does not claim

Nothing here says the growth model is wrong. Growth, inflation and unemployment all hit their
documented passive baselines, and the M1 exit criteria hold. The claim is narrower: **the
engine's capital deepening is weak enough that capital formation cannot be used as a
player-facing signal of economic strategy**, and the state's purchases are too small to be one
at all.

## If someone picks this up

The two findings are separable.

**The capital/output ratio** is the substantive one. The question to answer first is whether
K/Y ≈ 0.5 is intended — the capital stock is an index calibrated for the production function,
not necessarily a national-accounts stock, in which case its ratio to output is a unit artifact
and only the *trend* matters. If the trend is also unintended, the anchor is the thing to look
at: an investment rule anchored on replacement of a shrinking-relative stock cannot produce
capital deepening, whatever the multiplier does. Note that this is an economics change with real
blast radius — `INVESTMENT_SLACK_GAIN` is one of the two growth valves `AGENTS.md` flags as
load-bearing, and the passive century baseline (growth ≈ 2.5 %/yr) is a pinned claim, so this
needs `pnpm batch --policy passive --ticks 400` before and after.

**The missing public sector** is a design question, not a tuning one: should procurement imply
public employment, and should the state appear in the labour market at all? It reaches cohort
approval and bloc power if it does, so it is not additive.

Until either moves, `investment_share` is published as an honest measurement of a declining
quantity, and the instrument that actually answers "what kind of economy am I building" is
`export_share`.
