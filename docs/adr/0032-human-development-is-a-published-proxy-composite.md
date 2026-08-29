# ADR-0032 — Human development is a proxy composite of aligned published returns

**Status:** Accepted · **Date:** 2026-08-28

## Context

Terrarium models the three ideas the Human Development Index was built to hold together: a long
life, education, and material means. Schema 38 supplied the missing life-expectancy release. The
other two nearby values are deliberately not the inputs in UNDP's literal HDI: `human_capital`
is a generational workforce-skills stock rather than mean and expected years of schooling, and
`gdp_per_capita` is real domestic output in engine units rather than PPP gross national income.

Calling a mechanical substitution “UNDP HDI” would create false precision. Omitting the composite
would leave GDP as the only single development headline even though the engine can already show
why output alone is incomplete.

There is a second boundary. The three inputs are fogged releases with their own funding gates,
lags, errors and revisions. Computing the index from `TrueState` and adding a fresh error would
make a fourth survey of the same facts, and could make the composite more truthful than the
components from which a player is supposed to understand it.

## Decision

Terrarium publishes a clearly named **Terrarium Human Development Index**, preserving HDI's three
dimensions and geometric mean while naming the proxies it actually has:

```
health = clamp((published life expectancy − 20) / (85 − 20), 0, 1)
skills = clamp(published workforce skills / 100, 0, 1)
income = clamp((ln(published real GDP/head) − ln(2.5)) / (ln(200) − ln(2.5)), 0, 1)

human development = cbrt(health × skills × income)
```

The 20–85 health goalposts retain UNDP's current life-expectancy normalization. Income cannot use
UNDP's dollar goalposts because engine units have no PPP mapping. Its fixed 2.5–200 goalposts were
calibrated before implementation at schema 38: a funded 12-seed, six-country century measured
p01–p99 6.3–113.8, and 400 documents sampled across the drafting room's legal box measured
p01–p99 2.60–183.23. Rounding outward keeps ordinary legal countries inside the scale while
allowing exceptional documents to clamp. The goalposts are global and fixed; rebasing them to a
country's opening value or trailing record would destroy cross-country and across-time meaning.

The statistics step constructs each release from the three **published** component prints sharing
the same `forQtr` and `revision`. It publishes nothing until the join is complete. A component
revision therefore revises the composite, and there is no `obs:human_development` random stream.
The composite's error band is propagated through the formula from the three stated component
bands. Its print carries `{ health, skills, income }`, so the wall and exported record can explain
the headline without recomputing measurement in the observation or UI layer.

The index is informational only. Approval, political-capital accrual and the report card continue
to read their existing causes and published signals. Feeding HDI back into them would count
health, skills and income twice. Gini and poverty stay beside it as separate readings because a
national average can hide distribution by construction.

## Alternatives considered

- **Implement literal UNDP HDI.** This requires new stocks and publications for mean and expected
  years of schooling, a GNI concept distinct from GDP, and a defensible PPP mapping. Rejected for
  this slice: those are new causal/data models, not prerequisites that can be silently inferred.
- **Compute from hidden truth and add independent HDI noise.** Rejected because the result could
  reveal a cleaner combination than the component releases and would survey the same facts twice.
- **Compute in observation or the UI.** Rejected because measurement belongs in the engine and
  politics may only ever read the published record (ADR-0003). It would also make exports and
  non-UI consumers disagree about the index's history.
- **Use an arithmetic mean.** Rejected because strength in one dimension would linearly erase
  weakness in another. The geometric mean preserves the familiar limited-substitutability shape.
- **Fold inequality into the first composite.** Rejected because Terrarium already publishes Gini
  and poverty directly, and an inequality adjustment would introduce another methodology before
  the base index had been measured.

## Consequences

- Schema 40 adds one indicator and an optional component record on `StatPrint`; existing replay
  inputs remain loadable and deterministically produce the new public record.
- Funding is set at 0.35, the workforce-skills component's gate. Full instrumentation lifts the
  component gates as usual but does not lift their lags, noise or revisions.
- `pnpm hdi-analysis` is the standing long-run check. At schema 40, 12 seeds × 6 authored
  countries × 400 quarters measured HDI p01–p99 0.304–0.783, no clamped components, and log-index
  variance contributions of 10.3% health, 51.5% skills and 38.2% income. The index is neither
  saturated nor a renamed income series; it is most sensitive to the model's education stock.
- The 37th instrument would consume a seventh six-column rack row. Rather than leave zero headroom,
  the reference desktop uses a seven-column dense register and moves delta magnitude and release
  age into the strip tooltip. The watch board remains four full-size instruments.
- The name costs precision honestly: comparisons with real-world HDI values are not valid because
  two dimensions use Terrarium-specific proxies. The handbook says this where the player reads
  the formula.
