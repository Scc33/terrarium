# ADR-0033 — The exchange rate is a price that clears a market, and the cabinet can stand in it

**Status:** Accepted · **Date:** 2026-08-29 · **Issue:** [#152](https://github.com/Scc33/terrarium/issues/152)

## Context

The exchange rate had no economic content. `trade` moved it by `1 + 0.01 × N(0, 0.2)` each
quarter and depreciated it 5% whenever reserves went negative, and that was the whole model. It
responded to nothing the player or the world did, and the player had no way to touch it.

Reserves were worse. They were the residual of every quarter's balance of payments, and the
engine's countries run a **structural surplus** — households save, the state retires its debt,
and the current account never once goes negative in any seed of any curated country under
either baseline policy. So reserves only ever grew. Measured before this change: 25 to 47
quarters of import cover under passive play, 50 to 235 under developmental — sixty years of
imports in the bank. `DEPRECIATION_WHEN_BROKE` was unreachable, `reservesQtrs` was a series that
only went up, and the `reserves_thin` dispatch could not fire.

That left the whole of the external side unusable as policy. Investigation
[0010](../investigations/0010-how-to-grow-export-share.md) had already found that the strongest
path to an export-led economy was "strengthen the tax office and wait decades", and named
[#53](https://github.com/Scc33/terrarium/issues/53) and [#97](https://github.com/Scc33/terrarium/issues/97)
as the place to decide whether to add a real one.

## Decision

**The exchange rate is a price with a fundamental, and it reverts to it** — the shape
`finance.ts` already gives the asset price, for the same reason: a price that only integrates a
flow has no anchor and wanders off.

The fundamental is **parity**: the nominal rate at which the country is exactly as competitive
as it was in 1946, tilted by two things.

```text
target = parity × (1 − FX_BALANCE_TILT × surprise − FX_CARRY_TILT × yield spread)
parity = fxParityAnchor × (traded basket at home / traded basket abroad) ^ FX_PARITY_PASSTHROUGH
surprise = (balance of payments − the bank's order) / GDP − balanceNorm
```

**Reserves change only by what the central bank transacts.** The rest of the balance is foreign
currency somebody in the market has to be persuaded to take, and the rate is the persuasion.
`gov.dials.fxIntervention` is the standing order, signed, in annualized share of GDP:

- **positive** buys foreign exchange out of the market, which holds the currency down and builds
  reserves — the export-led strategy;
- **zero** is a float, and it is the default;
- **negative** sells reserves to hold the currency up, and can only be filled while there are
  reserves left to sell.

The old behaviour is not gone; it is a setting — a bank that buys the whole inflow leaves nothing
for the market to clear.

It is **not a peg**, and the difference is the mechanic's main limitation. The dial is a standing
*rate*, so it moves the level the currency floats around; it does not stop it floating, and the
tilt still answers to every surprise in the balance of payments at either setting. Measured
(`pnpm currency`, section 3): the growth and inflation tails are the same at every setting from a
hard defence to the buy rail. A government that wanted to fix the rate outright would need an
order that varied quarter by quarter to offset the surprise, and nothing on this desk can express
that. The obvious story — that a peg buys a level by giving up the shock absorber a floating
currency is — is therefore **not** what this model does, and the table is kept in the tool so
nobody re-derives it.

Three things about the model are load-bearing and each of them was the other way round first.

### The balance is measured against what the market expected

`external.balanceNorm` is an EMA of the balance of payments, seeded by `init` from the country's
own 1946 settlement. The tilt reads the balance against it, never against zero.

Against zero, the structural +2.5%-of-GDP surplus is a permanent appreciation the currency has
no way to work off. Measured on the first draft: the real rate pinned 5% strong, and the domestic
price level deflating for a hundred years trying to get out from under it, ending against the
0.05 rail. This is the same reference-dependence that cohort approval, bloc favour, unrest and
the household basket are all built on, and it is a bug fix in exactly the same way each of those
was.

### The yield spread is nominal, and centred on the rate the country inherited

`carryYieldSpread` is `policyRate − POLICY_RATE_1946 − sovereignRiskPremium`. Three choices:

- The **posted** rate, not `privateRealRate` — that one carries this quarter's bond auction and
  the asset-purchase programme, which are the crowding-out channel's business. A currency that
  moved on them would be reporting the same order twice.
- **Nominal**, not real. The real version is a doom loop: an appreciation is contractionary, the
  contraction is deflationary, deflation raises the real rate, and round again. That loop is real
  economics — it is the debt-deflation trap — but it is not the default behaviour to hand a
  player, and the price-level half of the story is already told, in the right direction, by
  parity. Split this way the two terms each carry one thing and neither can feed the other.
- Against the **1946 settlement**, so a government that never touches the rate is never moving its
  currency for having failed to.

### Both rails on the intervention are physical

The bank cannot **buy** foreign exchange the country did not earn — the reserve stock only grows
out of a surplus that actually arrived. The bid still moves the price, because a bid is real even
when the currency is not there to fill it; that is how a government holds its currency below
parity, and the surplus it thereby creates is what eventually fills the order.

It cannot **sell** reserves it does not hold, and that is what makes a defence a bet a player can
lose. When the order is clipped, the currency breaks by `DEPRECIATION_WHEN_BROKE` — the same
constant the old zero-reserve rule used, now reachable only by ordering a defence rather than by
drifting into one. It fires on the quarter the reserves go and not afterwards: without that
second test a standing sell order against an empty book re-breaks the currency 5% every quarter
for the rest of the century, and the paired study reported a currency *defence* that raised
exports 25%.

### The bank keeps a reserve book whatever the dial says

`FX_COVER_ADJUST` closes the gap to `external.coverTarget` — the cover the country's own recipe
gave it — and it is **one-sided**. A bank tops up a book that has got thin; it does not dump one
that has got large.

It is one-sided because symmetric it fights the dial: a government ordering accumulation builds
reserves, the book goes over target, and the bank sells exactly enough to cancel the order. That
shipped, and it read as a lever that did nothing — the +10% arm of the paired study came out at a
real rate of 1.631 against the float's 1.634 while quietly holding ten times the reserves.

It exists at all because reserves are frozen money while imports grow with the economy. Without
it, cover halves every twenty-three years and a do-nothing country spends the back half of its
century being told its reserves are thin: the warning that never turns off.

## What it is worth, measured

`pnpm currency`, paired seeds against a floating control on a capacity-building Meridia. The
lever buys a large and permanent **nominal** depreciation and a **transitory real** one, because
domestic prices catch up within two to four years. That is the "a lever that moves a PRICE gets
undone" lesson in a new register, and it is the honest answer: nominal exchange-rate policy is
neutral in the medium run, which is why real countries stop.

Against a floating control, the maximum standing order is worth **+5.7% of exports and +3.7% of
real GDP at ten years**, fading to −1.8% and −2.3% by 2046 as the price level catches up and the
goods that left keep leaving. The export share is the one column that stays positive throughout,
and it is small: +0.28 pp at ten years, +0.38 pp at thirty, +0.14 pp at a century — against the
zero tariff's +0.6 pp and tax capacity's +3.9 pp in investigation 0010. A defence is the mirror:
−3.0% of exports at thirty years, and an empty reserve book.

What survives is the reserve book — a stock, and stocks compound — and what it can be spent on
later. Building reserves in the good years to spend them defending the currency in a crisis is
the strategy the mechanic actually supports.

## Alternatives considered

- **Let the rate clear the entire balance of payments.** Rejected on measurement. The surplus is
  a savings surplus (S − I), no exchange rate can close it, and asking one to produces a
  century-long nominal spiral. The rate settles the part the market did not expect; the rest is
  financed, as it always was.
- **A carry flow into the market rather than a tilt on the fundamental.** Rejected: a differential
  that persists then appreciates the currency without limit. A persistent differential is a
  currency that stays dear, not one that keeps getting dearer.
- **Full PPP passthrough (`FX_PARITY_PASSTHROUGH = 1`).** Rejected: the `world` step mean-reverts
  its prices to 1 and therefore has no productivity trend, while a developing country's
  traded-goods prices fall for a century. At 1.0 the currency chases that the whole way and a
  developmental century ends against the bottom rail. At 0.35 the currency does part of the
  adjusting and competitiveness keeps the rest, which is also the empirical reading of PPP.
- **Make `fxIntervention` a target reserve cover rather than a flow.** Rejected: the steady state
  of a target is zero flow, so the lever would stop working the moment it succeeded.
- **An order that varies to hold a named rate — a true peg.** Not built. It is the natural next
  step and it is what would make the fixed-versus-floating trade-off real, but it needs a second
  kind of order (a target with a defence rule) rather than a dial, and the reserve arithmetic that
  makes a defence fail is only interesting once there is something to defend.
- **A `real_exchange_rate` instrument on the wall.** Built, measured (`pnpm ranges`: p01 96.6,
  p50 136.4, p99 192.0, face 80–200), and then removed — `rackHeadroom()` went to zero, and the
  wall's own contract says the next indicator needs a layout decision rather than another row.
  The reading is delivered instead by the two new wire conditions, which read the true value and
  say it in words, and by the posted rate charted on the treasury page. It is the first candidate
  when the wall gets its layout decision.
- **An imported-input cost channel in the price step**, so that depreciation raises domestic costs
  directly. Deferred: `effectivePrice` is read by household demand, profits and the GDP deflator,
  so widening it is an engine-wide recalibration. The passthrough this model has runs through
  demand instead — a depreciation switches expenditure onto domestic goods and the tâtonnement
  raises prices — and it is measurably fast enough (two to four years to near-complete) that
  adding a second channel would double-count.

## Consequences

**Good:** the exchange rate now answers to the three things the issue named — relative prices,
the policy rate, and the balance of payments — and the cabinet can stand in the market. Reserves
become a live stock with a range instead of a runaway, so `reservesQtrs`, `reserves_thin` and
`exchange_rate_slides` all mean something. A currency crisis is now something a player can bring
on themselves and see coming. Growth is untouched: the passive and developmental medians move by
0.01 and 0.02 points respectively across 400 × 400 quarters.

**Bad:** a floating currency is a shock absorber, so the game got easier where volatility was the
only problem — passive deposition 9% → 2%, developmental 7% → 3% on the baseline country. The
per-country split is the mitigating reading: Costona and Kestrel, whose governments fall for
political reasons, are unmoved (23% → 24% and 34% → 28%). The parity term makes an industrialising
century mildly more deflationary (developmental mean inflation −0.10 → −0.36 %/yr, unemployment
11.92% → 12.33%), which pushed `price_food` and `price_fuel` off their dial faces and both were
re-measured. `balanceNorm`'s seed carries the trade balance but not the capital account, because
computing the latter in `init` would mean restating `foreignInvestment`'s eleven factors there;
the norm closes the roughly 1.6-point gap within a few years, and the opening decade carries a
small currency transition for it. And a government that runs the maximum standing order for a
century ends up with several hundred quarters of import cover, which is absurd and is nobody's
fault but theirs — the model does not stop them, and the consumption it costs is the argument.
