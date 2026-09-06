# ADR-0037 — Every quarter's balance has a destination, and the cabinet chooses between two

**Status:** Accepted · **Date:** 2026-08-30 · **Issue:** [#211](https://github.com/Scc33/terrarium/issues/211)

## Context

`fiscal` financed a deficit and applied a surplus to principal:

```ts
const repaid = Math.min(Math.max(0, balance), gov.debt)
const debt = Math.max(0, gov.debt + borrowed - repaid)
```

Once `gov.debt` was zero, `repaid` was `min(balance, 0) = 0` while `balance` stayed positive.
`GovernmentState` had no reserve, fund or savings field to catch the difference, and nothing
downstream read the balance to close the loop. The money was collected by `revenue`, charged to
nobody, paid to nobody, and then simply ceased to exist.

That is not an edge case. Investigation
[0008](../investigations/0008-developmental-baseline-retires-public-debt.md) had already
established that debt reaches zero in **1000 of 1000** developmental runs at a median quarter 62
and in every passive run at a median quarter 80, and that the government then runs a structural
surplus for the rest of the century. Most long games spend most of their length in the state
where the arithmetic dropped money.

Measured on the shipped engine, with the fund's own return subtracted from both sides so the
figure is the *old* arithmetic exactly (`pnpm surplus`, 30 × 400q, Meridia): the stranded flow
was **74.6 % of every tax the treasury collected in the century** under passive play and
**89.9 %** under developmental. The country was, in the model's own books, throwing away
something close to its entire tax take for eighty years.

Nothing detected it. `tests/properties/budget-composition.test.ts` asserts that the splits equal
the headline totals and that `revenue − outlays === balance`, and stops exactly at the point
where the money went missing.

## Decision

**Every quarter's balance leaves `fiscal` with a destination, and there are exactly four:**

```text
balance = repaid − borrowed − printed + Δfund + rebate
```

Two new pieces of state carry the two new destinations.

**`gov.fund` — the sovereign fund.** A stock, opening at zero for every country, credited with
whatever is left of a surplus after outstanding debt has been redeemed. It is held abroad, earns
`FUND_YIELD` (2 %/yr) as its own `RevenueSplit` line, and on a deficit it is **spent before the
treasury borrows** — savings before the auction, the mirror of redeeming debt before banking
anything.

**`gov.dials.surplusPayout` — the standing order over the residual.** A share, 0..1, of what is
left of a surplus after debt, handed back to households as a **rebate against the income tax they
paid**. The remainder accrues to the fund. It is a dial rather than a sealed rule of the run
(ADR-0020) because a government's answer to "what is a surplus for" changes over a century; the
two ends of it are two real fiscal doctrines, and the room prices the move between them.

Four properties are load-bearing.

- **The dial only ever touches the residual.** Debt is redeemed first at every setting, so
  nothing about bond financing changes when the dial moves. A country still carrying debt cannot
  bank or rebate a penny however the cabinet has voted.
- **The fund and the debt are never both positive.** A surplus redeems before it funds, a deficit
  draws before it borrows, so one of the two is always zero and the pair is a single net
  position. `validate` asserts it. That is also the entirety of the fund's credit story, and the
  reason `sovereignRiskPremium` still reads `gov.debt` alone with no new term: a country holding
  a fund has no debt, so it is charged no debt-risk premium, and its deficits do not reach
  `BOND_MARKET_DEPTH` until the savings are gone.
- **`FUND_YIELD` is below `POLICY_RATE_1946`, and the ordering is the mechanism.** Safe foreign
  assets yield less than the coupon the state is already paying, which is *why* retiring debt
  dominates funding. Reversed, the treasury would rationally hold a debt and a fund at once and
  earn the spread, which is a money machine rather than a fiscal policy.
- **The return is credited to revenue, not compounded inside the stock.** The two are
  arithmetically identical while the dial is at zero and they are not identical anywhere else: at
  the top of the dial the fund's return is what gets handed back, which is the Norwegian rule.

The rebate is split by each cohort's share of the wage bill, which under a uniform rate is its
share of the income tax paid. It does **not** leak through `adminEffectiveness`: the tax office
refunds against wages it has already assessed, and there is no programme to deliver. Retirees pay
no income tax and so receive none of it — this is a refund, and the transfer line is the lever
that reaches them.

## What was rejected

**An automatic spending increase** — the issue's third option, and the one that is not here. Two
reasons, and the second is the stronger.

The pipeline decides the first: `production` reads `gov.dials.spending` at step 7 and `fiscal`
computes the balance at step 10, so a spending bump financed out of this quarter's surplus cannot
reach this quarter's demand. It would need a new demand channel and a quarter's lag, where the
rebate lands as income in `cohorts` — which runs *after* `fiscal` — with no new plumbing at all.

But the real objection is the minute book. Spending in this engine is **voted**: `SpendingRules`
carries what the cabinet appropriated, `dials.spending` carries what the economy got, and
`ui/src/policyRecord.ts` files the difference as a decision with a `votedAt` stamp. A surplus
that automatically enlarged a programme would be money the economy received that nobody
appropriated and no record could file — an unvoted second appropriation channel running beside
the voted one. And the stance already exists: a government that wants to spend its surplus writes
a bigger appropriation, which is one order on the desk it already has. There is no equivalent
existing lever for banking it, which is precisely why the other two are here.

**A `'fund' | 'tax_cut' | 'spending'` enum**, as the issue drafted it. Rejected in favour of a
share, for two reasons: real treasuries split a surplus rather than picking one of three, and a
numeric dial arrives on the control rail, in the minute book, in the manual, in the veto pricing
and in the adversarial sampler with no new machinery — where an enum would have needed a new
action kind and a bespoke control. `PolicyRecord extends DialState`, so the record of it exists
from the day the dial does.

**Making the fund part of `external.reserves`.** They are different books: reserves move only by
what the central bank transacts in the currency market (ADR-0034), and folding a fiscal stock
into them would put the treasury's savings decision into the exchange rate. A fund genuinely
invested abroad would press on the currency, and that is a second channel this deliberately does
not open — noted here as future work rather than as an oversight.

**A term making the fund lower the sovereign premium.** It would be a second channel for
something the identity already handles: see the net-position property above.

## Consequences

**At the default setting the change is inert, and that is measured rather than argued.** Over
400 quarters on all five curated countries × 3 seeds, under passive, developmental and regulated
play, the pre-v44 trajectory fields — real and nominal GDP, quarterly inflation, unemployment,
debt/GDP, money printed, political capital, every cohort's approval and the quarter of deposition
— hash **bit-identically** before and after. The 1000 × 400q batch reports agree to every printed
digit on passive, developmental, and both `--country all` sweeps.

That is *not* what the issue expected, and the difference is worth stating plainly: it predicted
that any real destination would pump the money back into the economy. A fund held abroad does not.
What the default buys is that the books close, the money is a stock somebody owns, and it is
spent before the next auction. Turning it into demand is an order the player gives.

The 40-quarter goldens moved `meta.schemaVersion` and nothing else — for the same reason
ADR-0028's did: the regime this changes is not reachable in forty quarters. **The goldens are not
evidence here.** `pnpm surplus` is.

What the dial is worth, developmental play under `unlimitedCapital`, 30 × 400q against a banking
control:

| arm | real GDP 30y | 100y | consumption/head 30y | 100y | inflation | gini |
|---|---:|---:|---:|---:|---:|---:|
| bank it (control) | — | — | — | — | −0.34 %/yr | 0.456 |
| split it 50/50 | +2.36 % | −2.79 % | +6.05 % | +7.25 % | +0.46 pp | +0.011 |
| hand it all back | +5.35 % | **−7.47 %** | +12.31 % | +8.52 % | +0.69 pp | +0.015 |

The sign flip between the two horizons is the trade the lever exists to offer, and it is the
"a lever that moves a FLOW gets competed away while a lever that moves a STOCK compounds" lesson
in a new register. A rebate is consumption: it absorbs slack and lifts output for a generation,
then raises the price level against a currency that only passes 35 % of it through
(`FX_PARITY_PASSTHROUGH`, ADR-0034), and the real appreciation costs the century more output than
the demand ever bought. Consumption per head stays ahead at both horizons, which is the honest
reading — the rebate buys living standards and sells growth. The Gini moves against the rebate
because it follows the wage bill and the retired are not in it.

And what the fund is for, forty years of banking followed by a transfer programme at 30 % of
published output: it pays for **19–22 quarters** of the deficit before the first bond is issued,
and over the twenty years the banking arm borrows 19–24 % less and prints 23–29 % less than the
arm that handed every surplus back.

The one reading that is a finding rather than a design claim is the size of the thing under the
runner's `developmental` policy: **10.6 × annual GDP** by 2046, with its return at 57 % of
revenue. That is a fact about a policy investigation 0008 already calls austere rather than about
the fund — a government banking 60 % of annual output every year for eighty-five years should
end up a rentier — and it is recorded as a follow-up there.

## Testing

`tests/properties/treasury-conservation.test.ts` asserts the identity every quarter of 240, on
all four runner policies and at five settings of the dial, with zero unaccounted residual. It
also pins the net-position invariant, the draw-before-borrow ordering, and that the debt-free
surplus regime is actually reached before anything is asserted about it.

It is deliberately **not** a whole-economy money conservation test. A voted appropriation is
charged to the treasury in full and reaches households scaled by `adminEffectiveness`; the gap is
the point of having a civil service to build. A test that demanded closure across the whole
economy would be asserting that programme delivery is free.
