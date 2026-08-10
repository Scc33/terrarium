# 0003 — Public debt does not crowd out private investment during play

**Status:** Open
**Raised by:** a playtest in which sustained deficits produced little visible penalty.
**Measured at:** engine `1e91d44`, 200 paired seeds × 80 quarters on Meridia. The
reproducible harness is `tools/measure-deficit-effects.ts`.

## The short answer

Interest payments occur. Conventional crowding out does not.

Each quarter, `pipeline/fiscal.ts` charges

```ts
debt * (policyRate + sovereignRiskPremium) / 4
```

The premium begins above 50 % debt/GDP and also rises when a powerful financier bloc is angry.
Coupons then become household income: 60 % goes to business owners, 25 % to professionals, and
15 % to retirees. A surplus returns principal to the same fixed holder shares as savings. The
money does not vanish.

But two mechanisms normally meant by “crowding out” are absent during a game:

1. **No budget-envelope crowding out.** Programme dials are standing appropriations. Interest is
   added to outlays; it never forces transfers, procurement, public works, research, subsidies,
   or ministry construction down. The extra interest usually becomes another deficit.
2. **No private-rate crowding out.** Private investment reads the policy rate minus expected
   inflation, utilization, confidence, unemployment, the asset price, a banking-crisis flag, and
   industrialist favour. It never reads public debt, government bond issuance, or the sovereign
   risk premium. The bond market also does not absorb a household asset stock or subtract funds
   from bank credit.

There is one opening-position effect: `init.ts` self-calibrates the starting programme budget
from estimated revenue **after** interest. A country that begins with heavy debt therefore begins
with less discretionary spending. That constraint does not continue once the player starts
moving the dials.

## What deficits do instead

The engine has several real consequences, but they do not make private investment scarce.

- The bond market absorbs at most 5 % of quarterly nominal GDP in new borrowing each quarter.
  The rest of that quarter's deficit is printed. Above 120 % debt/GDP it buys no new bonds.
- Printing raises inflation expectations and adds a smaller drift to prices.
- Debt raises financier power, making later policies it opposes more politically expensive.
  Debt, inflation, and printing also lower financier favour; anger combined with power raises
  the sovereign premium and shrinks bond-market depth.
- Financier power participates in the extractive ceiling. If it becomes the strongest unchecked
  incumbent interest, technology absorbs the world frontier more slowly. This is a genuine
  long-run debt cost, but it is an elite-capture channel rather than investment crowding out.
- Coupons redistribute income toward the three bondholding cohorts. Issuance itself has no
  offsetting withdrawal from their savings or consumption.

The sign of the financial feedback is therefore often the opposite of crowding out. Printing
raises expected inflation; with an unchanged policy rate, the private real rate falls. Finance
then targets more credit and dearer assets, and production responds with more private investment.

## The paired sweep

The harness runs the same 200 seeds under six scenarios. Figures below are means over the final
eight quarters at each horizon. Balance, debt, interest, printing, and inflation are percentages;
GDP, private investment, and technology attainment are paired differences from the passive run
with the same seed.

The player-facing policies are:

- `transfer-4`: set fixed transfers to 4 at q4 (from about 1.8 initially)
- `transfer-8%`: set transfers to 8 % of the latest published nominal GDP at q4
- `spend-6+6`: set fixed transfers to 6 at q4 and procurement to 6 at q8 — the same stress case
  used by `tests/properties/budget-composition.test.ts`
- `tax-cut`: cut the income-tax rate to 5 % at q4 and the corporate rate to 5 % at q8, isolating
  a persistent deficit that does not begin with new government demand

As in the batch runner, the engine trajectory continues after deposition so the economics remain
paired for the full horizon. The separate deposition rate says how often the playable tenure had
already ended.

### Five years (q13–20)

| policy | balance / qGDP | debt / annual GDP | interest / GDP | interest / outlays | printed / qGDP | inflation / yr | real GDP vs passive | private investment vs passive | technology vs passive |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| passive | -0.8 | 33.9 | 1.3 | 15.7 | 0.0 | 1.4 | — | — | — |
| transfer-4 | -3.3 | 39.6 | 1.5 | 14.1 | 0.0 | 3.6 | +1.9 | +3.0 | 0.0 |
| transfer-8% | -5.6 | 39.0 | 1.8 | 13.5 | 1.0 | 5.7 | +4.5 | +28.0 | 0.0 |
| spend-6+6 | -8.0 | 34.2 | 1.9 | 12.0 | 3.8 | 8.7 | +8.1 | +76.2 | 0.0 |

The short-run debt-service share actually **falls** in the two largest deficit cases because
new programme spending expands its denominator faster than interest grows. The existing test
only checks that the share is higher at q60 than at q4 within one deficit run; it neither
compares with passive nor asserts that anything else was displaced.

### Twenty years (q73–80)

| policy | balance / qGDP | debt / annual GDP | interest / GDP | interest / outlays | printed / qGDP | inflation / yr | real GDP vs passive | private investment vs passive | technology vs passive |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| passive | +2.7 | 3.2 | 0.1 | 3.4 | 0.0 | 0.4 | — | — | — |
| transfer-4 | -0.3 | 39.1 | 1.6 | 22.1 | 0.0 | 0.2 | -0.1 | -1.6 | +0.1 |
| transfer-8% | -7.6 | 62.8 | 4.7 | 32.4 | 4.0 | 0.9 | +6.6 | +40.1 | -2.6 |
| spend-6+6 | -5.2 | 63.0 | 4.3 | 35.1 | 1.3 | 0.2 | +8.4 | +43.7 | -2.5 |

Debt service eventually becomes visually large. It still does not consume a programme or raise
the private real rate. The fixed `transfer-4` deficit mostly fades as nominal GDP outgrows a
fixed-money appropriation; the GDP-share rule remains a sustained fiscal expansion.

The paths are not costless. Every `transfer-8%` and `spend-6+6` run used the printing press; 12.0
% and 10.5 % of those governments, respectively, were deposed by q80, versus none under passive
play. The main penalties are early inflation, money-interest power, slower technology absorption,
future political costs, and some deposition risk — not private investment displaced by government
borrowing.

## The debt-stock isolation

The harness also performs one diagnostic that is deliberately not a player action. At q4 it
gives the passive economy debt equal to 100 % of annual GDP while holding every tax, spending,
and policy-rate dial fixed.

On the shock quarter, across all 200 paired seeds:

```text
max |real GDP debt-shock - passive|          = 0
max |private investment debt-shock - passive| = 0
```

That exact equality follows from the pipeline: `finance` and `production` both run before
`fiscal`, and neither reads public debt or the sovereign premium. By q80 the debt-shock runs had
95.0 % debt/GDP and paid 7.6 % of GDP in interest, yet private investment averaged **13.5 %
above** passive and the capital stock was 8.1 % higher. The political channel did bite:
technology attainment was 4.7 % lower, leaving real GDP 0.3 % below passive despite the extra
capital. Coupon income and occasional printing create expansionary financial effects; there is
no scarcity channel pushing private investment the other way.

## Why the current promise is misleading

`state/schema.ts` says that capacity spending and interest “crowd out” the programme dials. The
ledger UI calls debt service “the one line no dial reduces this quarter.” The UI accurately shows
the line, but the engine does not make that line consume fiscal space. The regression named
“interest crowd[s] the budget” proves only a composition statement: interest eventually becomes
a larger fraction of a larger total.

So the player's perception is accurate: the books show a consequence, but the production and
budget systems do not make it bite in the familiar way.

## If someone picks this up

First decide which constraint the game is supposed to teach. These are alternatives, not a list
to implement together.

1. **A sovereign-to-private spread.** Feed some measured funding pressure into the private real
   rate or credit target. This is the smallest conventional crowding-out channel, but risks
   double-counting a closed domestic banking system and needs calibration against development
   and openness.
2. **A stock-flow bond market.** Make new government paper absorb household savings or bank
   balance-sheet capacity, with coupons and principal returning to actual holders later. This is
   more systemic and explains who is crowded out, but requires bond holdings and likely a schema
   change.
3. **A fiscal envelope.** Make interest consume an appropriation ceiling or force an explicit
   cabinet choice over cuts, taxes, and printing. This makes “fiscal space” legible but conflicts
   with the current rule that ambitious programmes are never forbidden and fail through the
   economy instead.
4. **Keep the current macro model.** Then rename the comments and regression: debt service
   compounds deficits and monetization; it does not crowd out programmes or private investment.

Any behavioral choice needs an `economics-review`: measure passive, random, persistent-deficit,
and deliberately high-debt countries; inspect distributional incidence; and verify that the
M1 fuel-tax and subsidy claims still hold. A private-rate channel should be tested on flows, not
only final debt/GDP, so a one-quarter deficit and a decade of forced borrowing do not receive the
same penalty.
