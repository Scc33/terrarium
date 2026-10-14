# What institutions cost, and why revenue moves

**Status:** Resolved — the revenue channels are intentional; the cabinet's oversized and
already-funded ministry bids are fixed by the accompanying change.
**Questions:** [#50](https://github.com/Scc33/terrarium/issues/50),
[#48](https://github.com/Scc33/terrarium/issues/48). Related:
[#168](https://github.com/Scc33/terrarium/issues/168) clarified the ledger's ministry line.
**Measured:** 2026-10-11, engine at `ab9d9e0` (schema 48). This change's schema 49 adds exact
commitment fields to observation and changes cabinet bids; engine arithmetic is unchanged.

Reproduce with `pnpm institution-costs -- --runs 20 --ticks 416`.
The tool uses seeds `institution-cost-<country>-<index>` across all six catalogue entries,
including procedural countries. The three policy samples each contain 120 runs, with ordinary
tenure, fog and turbulence. Quotes stop when the government is deposed. They are counterfactual
offers inspected on those paths, **not extra orders enacted into the baseline**.

## Two drawers, two budgets

**State capacity** builds tax administration, statistics, civil service and schools. Signing
one programme costs **2 PC**, regardless of its cash amount or the blocs' hostility. Cash is a
separate bill: the amount is paid in eight equal quarterly instalments, and capacity is delivered
over the same eight quarters. The conversion is **60 cash units per full capacity unit**, so
ten points on the 0–100 face cost 6 total, or 0.75 per quarter, before decay.

The bill is the sum of all live programmes, across every ministry. It ends when those programmes
finish. These books contain no standing public-service payroll; that missing extension is
already recorded in [#119](https://github.com/Scc33/terrarium/issues/119). Stocks deteriorate
without renewal: tax, statistics and administration lose 0.4% of the stock per quarter, schools
0.1%. Holding a ministry's strength therefore requires later programmes, not a permanent bill
attached to its existing level.

**Institutions** reforms suffrage, press, labour rights, courts and repression. A reform moves
the stock by up to 12 points and spends **PC only**. There is no cash charge to the treasury.
Its base price is 26 PC, multiplied by the objections of blocs according to their effective
power. A government has 20 PC at appointment; contested reforms require saving political
capital, weakening the veto players or using an unrest window. Past unrest 0.35 the base is
multiplied by 0.35 and veto weight by 0.6. That is a discount, not a prerequisite for reform.

At quarter 16 on the six `*-0` seeds, calm upward reforms quoted **27.39–89.77 PC**. With only
unrest changed to 0.5, those same reforms quoted **9.39–22.49 PC**. These are illustrative
prices on the sampled settlements, not universal price bounds. The study does not show that a
particular PC price is optimally balanced; reducing it without measuring the political game
would be a retune, not an accounting repair.

## Why revenue changes

Tax administration directly changes **collection at the rates already posted**. Fiscal uses:

```text
income and corporate collection = taxCapacity^0.6 × (1 − 0.5 × landedAnger)
landedAnger = max(0, −landedFavor) × effectiveLandedPower
tariff collection = 0.5 + 0.5 × taxCapacity
fuel-duty collection = 0.7 + 0.3 × taxCapacity
```

The office is consequential because higher capacity collects more of the same wage and profit
bases. Holding every base, price, rate and bloc reaction fixed, moving capacity **0.20 → 0.30**
raises income and corporate receipts **27.54%**, tariff receipts **8.33%**, and positive fuel
receipts **3.95%** by the formula. Total receipts rise **25.44–26.32%** in the six quarter-16
states. None had fuel duty posted or a funded sovereign fund, so those two measured source
ratios are absent rather than zero. A fund's return is not gated by tax collection.

Civil service changes **delivery**, not this collection formula: at administration 0.20,
52.94% of an appropriation survives delivery; at 0.30, 59.81% does. The treasury pays the full
appropriation either way. Schools reach tax bases through the taught workforce, productivity,
fertility and class structure over decades (ADR-0023); statistics reaches decisions and PC
through what is published. All four also contribute to state power in the corridor.

Reform can change receipts **without charging cash**. The order spends the goodwill of blocs
that object, and fiscal reads the landed interest's anger. This is a modeled collection loss
on income and corporate taxes; tariffs, fuel duty and fund income do not use that multiplier.
Unhappy financiers affect auction depth and risk premiums instead. Labour rights reach wage
bargaining, courts reach enforcement and investment, and the corridor reaches competition and
the economy's tax bases. Over time these channels interact, so an isolated receipt change is
not a forecast of the reform's long-run welfare return.

Meridia, `institution-cost-meridia-0`, quarter 16, with the same tax bases passed directly to
fiscal before and after one upward reform:

| reform | calm PC | unrest-window PC | isolated change in total revenue | cash taken by the action |
|---|---:|---:|---:|---:|
| suffrage | 65.59 | 17.41 | −8.90% | 0 |
| press | 47.01 | 13.51 | −3.88% | 0 |
| labour rights | 76.96 | 19.80 | −6.89% | 0 |
| courts | 31.61 | 10.28 | −1.88% | 0 |
| repression | 33.42 | 10.66 | 0.00% | 0 |

The price comparison changes unrest alone. The receipt probe enacts under sufficient PC to
isolate the order's effect, and does not run the other economic steps. Reform-window discounts
do not erase the goodwill cost of defying a bloc.

## Why the cash bill jumps, and the bug found here

The old FUND button offered `max(2, 0.8 × last quarterly revenue)`, independently for each
ministry. Above the minimum, **one click adds 10% of that quarter's receipts to each of eight
quarterly bills**. Funding all four adds 40%; authorizing another programme before the first
finishes adds another bill. The quarter-16 examples quoted exactly 10% per ministry across all
six recipes. In the capacity-isolation baseline, ministry bills averaged **16.24% of total
outlays** over reachable quarters; passive had none, random averaged 1.69%.

There were two defects in the bid. It ignored capacity already being delivered and only
disabled FUND at current capacity 0.95. Thus it offered orders the engine's **current plus
in-flight** gate would refuse. It also sized solely from revenue, which includes sovereign-fund
returns: a rich treasury could offer a build much larger than the room left before capacity
clamps at 1. The engine charged that cash even when the added capacity was discarded.

| baseline path | legacy offers inspected | offers projecting discarded capacity after decay | offered while pending builds already met the gate |
|---|---:|---:|---:|
| passive | 198,092 | 32,968 | 0 |
| developmental | 174,584 | 108,724 | 2,564 |
| random | 115,232 | 45,933 | 652 |

Discarded-capacity counts include only otherwise legal quotes and project existing deliveries
plus the candidate through the actual decay and clamp for eight quarters. They are neither
percentages of enacted orders nor an estimate of player losses. Baseline policies retain their
own unchanged bids.

A concrete random-path quote: Meridia seed `institution-cost-meridia-0`, tick 124, tax capacity
0.3751 with another 0.5361 in flight. The old button offered **33.1816 cash**; projecting it
discarded **0.4346 capacity units** through the full-strength clamp. The corrected quote is
**5.3291 cash**, reflecting the 0.0888 units still available before decay. The old quote passed
the engine's legality gate: the discarded deliveries were a real overpayment possibility.

## Delivered correction and limits

- Observation publishes each cabinet-authorized delivery and cash instalment, alongside its
  remaining quarters. These exact government commitments contain no hidden GDP or survey truth.
- The default bid is capped at room left after **all** queued deliveries. FUND becomes FUNDED
  when the same in-flight absorption gate the engine uses is reached. Capacity loss to ordinary
  decay remains part of the model; the cap deliberately uses the engine's conservative gate.
- The row distinguishes the new bid's PC and cash bill from the total active bill and cash still
  due. A half button can repeatedly resize a draft without changing the flat PC price.
- Cabinet and handbook copy explain collection, delivery, reform resistance and overlapping
  bills. This complements #168's ledger clarification rather than inventing another ledger line.

The administration ceiling is still 40% of **true current quarterly GDP**, which the cabinet
cannot know exactly. On the random sample, the old default exceeded it 781 times; the bounded
default exceeded it 48 times. Automatic bids therefore still require the worker's validation,
and the half button lets the player reduce an oversized bid instead of being trapped with one
unusable fixed amount. These refusal counts are quotes, not failures in the underlying baseline.
This change does not publish a maximum derived from hidden GDP, or silently substitute an
official estimate into the engine's existing action rule.

No behavioral constant was retuned and no economic step changed. Reviewing all three golden
state diffs before blessing showed only **`meta.schemaVersion: 48 → 49`**. Existing saves still
reconstruct the same policy path; future player bids now avoid paying for capacity beyond full
strength and make their cash commitment reviewable before enactment.

Validation on this change: all 1,156 unit, property, contract and UI tests passed under coverage
(97.02% statements, 87.69% branches); all 37 Playwright browser checks passed. The funding flow
also probes the 1280×720 wall directly: no page scroll and no content below its bounds.
