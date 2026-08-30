# 0010 — How do you grow exports as a share of the economy?

**Status:** Resolved as ratio behavior, not an engine bug; direct export-development is already
tracked by [issue #53](https://github.com/Scc33/terrarium/issues/53) and the broader
[steerability issue #97](https://github.com/Scc33/terrarium/issues/97)

**Superseded in part (2026-08-29, schema 41):** the paragraph under "What the engine actually
prices" that treats the exchange rate as reachable only indirectly no longer holds. ADR-0033 gives
the rate a fundamental and the cabinet a standing order in the currency market
(`gov.dials.fxIntervention`), so there is now a direct trade lever.

It does not change this study's conclusion, and measuring it is the reason to say so. On the same
kind of paired reading — a floating control, same seed, capacity-building Meridia, `pnpm currency`
— the largest standing order is worth **+0.28 pp of export share at ten years, +0.38 pp at thirty,
and +0.14 pp at a century**, against the zero-tariff channel's +0.6 pp and tax capacity's +3.9 pp
over forty years. It buys real exports (+5.7% at ten years) and then gives most of them back
(−1.8% at a century) as domestic prices absorb the depreciation. So the currency joins the tariff
at the bottom of this table rather than displacing the tax office at the top: **the fastest lever
here is still the smallest one, and the slow institutional channel is still where the export
economy is actually built.**

**Raised by:** [issue #131](https://github.com/Scc33/terrarium/issues/131), after demand and
investment stimulus visibly moved their own accounts but appeared unable to move exports.

**Measured at:** engine `887aff6`, 40 paired seeds × five authored countries × 14 scenarios ×
160 quarters. The harness added with this investigation is
`pnpm export-share -- --runs 40 --ticks 160`.

## The short answer

The instrument is moving, but it is not measuring whether exports grew. It is measuring whether
exports grew faster than all final expenditure:

```text
export share = X / (C + I + G + X)
```

That denominator is deliberate. These are the four non-negative final-expenditure claims in the
statistical office's accounts; imports are excluded rather than netted against exports, so the
four shares remain exhaustive and drawable. This is therefore `% final expenditure`, as the
instrument says, not exports divided by GDP.

Policies that “juice investment and consumption” attack the question from both sides. They can
raise exports in levels while raising the denominator much faster. In the paired sweep, a
sustained public-investment programme lifted real exports 80% after forty years, but lifted total
final expenditure 154%; its export share fell 3.70 percentage points.

There is no direct export-promotion dial. The player can change exports only through productive
capacity, domestic competitiveness, and the balance of payments. Of the existing controls:

- removing the inherited 10% tariff produces a small, fairly quick rise of about 0.5–0.6 point;
- building tax capacity produces the largest standalone long-run rise, but by collecting more of
  the taxes already posted, compressing domestic absorption, and making output more competitive;
- education raises export volume materially over decades, but most of the new capacity is also
  absorbed at home, so the share moves much less;
- building every ministry combines the tax-led expenditure switch with productive capacity and
  eventually produces the largest export-share rise.

That is coherent with the current equations, but “strengthen the tax office and wait decades” is
not an obvious export-development strategy. Adding one is the feature work already proposed by
issues [#53](https://github.com/Scc33/terrarium/issues/53) and
[#97](https://github.com/Scc33/terrarium/issues/97), not a repair to this instrument.

## What the engine actually prices

Production builds each sector's real export order as:

```text
min(
  base export share × potential output × inherited openness × foreign demand
    × (world price × exchange rate / domestic price)^1.5,
  50% of potential output
)
```

Three of those terms are outside the cabinet. `openness` is sealed into the country recipe;
foreign demand and world prices come from the four simulated partner economies. The cabinet can
affect potential output and domestic prices over time, while imports, reserves and FDI can move
the exchange-rate and capital channels indirectly.

This is why apparently trade-adjacent controls are quiet:

- The tariff is an **import** tax. It raises import prices and reduces FDI; it does not appear in
  the export order. Setting it to zero helps exports only through imported inputs, foreign
  investment, reserves and the exchange rate.
- A sector subsidy lowers that sector's cost anchor, but it also raises profits and household
  demand and is a fiscal outlay. The tested fixed manufacturing subsidy—5% of opening GDP—did not
  behave like an export rebate; after forty years exports were 6.75% below the passive pair and
  the export share was 1.21 points lower.
- A lower policy rate raises capital formation, but it also stimulates domestic expenditure. By
  forty years exports were 7.95% higher and final expenditure 14.00% higher, leaving the export
  share 0.72 point lower.

## Paired measurement

Each scenario used the same engine seed and authored country as its passive control. Spending
programmes were standing rules against **published** nominal GDP: transfers and public investment
at 10%, research at 5%. The tariff and policy rate were set to zero once; the manufacturing
subsidy was fixed at 5% of opening GDP. Capacity paths attempted a $2 build every eight quarters,
using the ordinary action validator and political-capital bill. Median skipped actions were zero
in every scenario.

Readings are means over the last eight quarters at five, twenty, and forty years. Deltas are
same-seed differences from passive. To keep post-deposition engine paths out of gameplay claims,
each cell includes only pairs whose governments remained in power through that horizon.

| scenario | Q20 pairs / Δ share | Q80 pairs / Δ share | Q160 pairs / Δ share |
|---|---:|---:|---:|
| transfers at 10% GDP | 198 / **−2.97 pp** | 157 / **−2.46 pp** | 149 / **−2.66 pp** |
| public investment at 10% GDP | 199 / **−3.02 pp** | 178 / **−2.84 pp** | 162 / **−3.70 pp** |
| research at 5% GDP | 199 / **−2.19 pp** | 194 / **−2.08 pp** | 184 / **−2.24 pp** |
| zero tariff | 199 / **+0.61 pp** | 197 / **+0.62 pp** | 196 / **+0.46 pp** |
| zero policy rate | 199 / **+0.37 pp** | 197 / **−0.22 pp** | 197 / **−0.72 pp** |
| tax capacity | 198 / **+0.38 pp** | 196 / **+1.86 pp** | 195 / **+3.90 pp** |
| education capacity | 199 / **−0.01 pp** | 197 / **+0.14 pp** | 197 / **+0.74 pp** |
| administration + education | 199 / **−0.22 pp** | 196 / **−0.20 pp** | 196 / **+0.43 pp** |
| all four capacities | 199 / **+0.01 pp** | 193 / **+1.12 pp** | 193 / **+4.43 pp** |

The forty-year level decomposition makes the distinction between exporting more and becoming
more export-heavy explicit:

| scenario at Q160 | real exports vs passive | final expenditure vs passive | export-share change |
|---|---:|---:|---:|
| transfers at 10% GDP | +1.66% | +25.74% | −2.66 pp |
| public investment at 10% GDP | **+80.08%** | **+153.94%** | −3.70 pp |
| zero tariff | +5.07% | +1.85% | +0.46 pp |
| tax capacity | +28.70% | **−3.69%** | +3.90 pp |
| education capacity | +20.92% | +13.89% | +0.74 pp |
| administration + education | +24.03% | +19.09% | +0.43 pp |
| all four capacities | **+57.24%** | +12.13% | **+4.43 pp** |

The tax-capacity result is not a free productivity gain. The effective inherited tax rates rise
as the tax office improves, leaving less disposable income for household demand. Softer domestic
demand lowers the denominator directly and, through prices, improves the relative-price term in
the export order. Adding education and administration grows more export capacity, which is why
all four ministries raise both exports and final expenditure while tax capacity alone lowers the
latter.

The passive level is country-dependent even before policy: the median share at forty years was
10.4% in Costona, 12.0% in Meridia, 12.1% in Veltravia, 14.2% in Kestrel, and 16.1% in Oranga.
That is inherited openness and industrial structure doing what the country recipes say they do.

## Why a real change can be hard to see

`export_share` is not published until statistical capacity reaches 0.35. It then arrives one or
two quarters late, with revisions and first-print noise equal to 10% of the true reading scaled
by office quality. At a true 15% share, the office's stated 95% half-width is about ±1.8 points
at 0.45 capacity and ±0.44 point at full capacity. Below 0.45 it still adds noise but cannot yet
state a band.

The roughly +0.6-point zero-tariff effect is therefore smaller than the uncertainty of an early
expenditure account and comparable even to a fully built office's band. It is visible as a trend
over several releases, not reliably as one needle movement after an order. The multi-point
tax-capacity and all-capacity effects eventually clear that fog, but only after decades.

## Bug audit and implication

No stuck-series or accounting bug was found:

- `recordOf` recomputes the true share every quarter from current export and expenditure flows;
- `INDICATOR_SPECS` publishes that record with the intended funding gate, lag, noise and
  revisions;
- observation labels it `% final expenditure`, and the accounts overlay reads the same series;
- the national-accounts property test pins all four worksheet shares as non-negative and summing
  to one.

The gap is player legibility and strategy. Existing levers can produce an export-heavy economy,
but the strongest path is a long, indirect tax-capacity channel, while the obvious demand and
capital levers often grow exports without growing their share. Issues
[#53](https://github.com/Scc33/terrarium/issues/53) and
[#97](https://github.com/Scc33/terrarium/issues/97) should decide whether to add a diegetic
export-development institution or market-access policy. They should not retune this ratio merely
to make the needle rise: doing so would make the expenditure accounts stop describing the
economy they claim to measure.
