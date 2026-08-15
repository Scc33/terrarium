# ADR-0017 — Foreign direct investment is owned capital, not an openness bonus

**Status:** Accepted · **Date:** 2026-08-15

## Context

Country openness already scaled exports and imports, accelerated technology absorption, reduced
the domestic share of sovereign bond auctions, and exposed banks to foreign crises. None of
those channels was foreign direct investment. The engine had no foreign-owned productive
capital, no inward investment flow, no earnings remittance, and no capital-account settlement.
Calling the existing openness effects “FDI” would therefore have hidden the missing accounting:
foreign capital would raise growth without anybody abroad owning a claim on the result.

Issue #40 also names a scale claim rather than a country flag. A plant can be a large share of a
small export economy and a rounding error in a continental market. FDI therefore has to emerge
from country size, openness and development alongside conditions the player can change; it must
not be a scripted bonus attached only to the curated small-country scenario.

## Decision

The engine keeps `external.foreignOwnedCapital` as a real stock in the same units as domestic
sector capital. Its opening share is derived from population, development and openness. Each
quarter a dedicated `foreignInvestment` step runs after `finance` and before `production`:

1. A structural draw makes FDI/GDP fall with population and rise with trade access and the
   development gap, while absolute inflows can still be larger in a larger economy.
2. Current technology catch-up room, export intensity, administrative delivery, after-tax
   profits, business confidence, tariffs, macro price stability, the foreign cycle and a
   domestic banking crisis move the marginal project around that structural draw.
3. Foreign-ownership saturation slows acquisitions before foreign capital can become the whole
   productive stock. A crisis shelves new projects but does not liquidate a factory overnight.

`production` adds the real inflow to the ordinary investment order book. Imported machinery is
capital formation and joins the stock, but is booked as an import rather than domestic demand;
construction and services remain local. Production also assigns the foreign-owned share of
positive after-tax profits to remittances. `trade` settles the nominal inflow, imported plant and
remittances through reserves; `labor` depreciates and accumulates the owned stock; `cohorts`
distributes only the remaining profits to domestic households. GDP still counts production
inside the country, while household income and the balance of payments carry the cost of foreign
ownership.

There is no dedicated FDI dial. Existing levers—corporate tax, tariffs, administrative capacity,
the policy conditions behind business confidence and price stability, and policies that sustain
export demand—are the way a government changes the flow. The player sees a fogged `fdi_inflows`
instrument in percent of GDP once balance-of-payments statistics are funded.

## Alternatives considered

- **Treat openness as an FDI multiplier on total investment.** Rejected: it has no owner, no
  stock, no remittance and no balance-of-payments entry, making openness a free growth bonus.
- **Use one generic foreign-capital flow for bonds, bank credit and FDI.** Rejected: liquid
  portfolio funding can stop or reverse quickly; a directly owned factory is sticky and earns
  operating profits. Combining them would make the existing sudden-stop mechanism liquidate
  productive capital or make portfolio finance implausibly inert.
- **Author an FDI/GDP parameter for every country recipe.** Rejected as the primary mechanism:
  the issue's small/open/developing result should survive procedural generation and policy
  changes. Curated flags would make the behavior descriptive rather than causal.
- **Track foreign ownership by sector and multinational parent.** Deferred: it would support
  sector-specific remittances and political blocs, but requires an ownership matrix and
  allocation rules disproportionate to the first-order macro channel. The aggregate stock keeps
  that extension possible without pretending it already exists.
- **Publish the exact foreign-owned stock.** Rejected: company ownership and capital-account
  returns are measured facts, not a government dial or treasury book. They obey the same fog
  boundary as other national accounts.

## Consequences

**Good:** Small, open and catch-up economies can now depend materially more on FDI than large
domestic markets; foreign capital raises capacity through the same production system as every
other investment; taxation, administration, confidence, price stability, trade performance and
crises have coherent indirect effects; reserves and household income expose the cost of foreign ownership.

**Bad:** Aggregate ownership assumes foreign capital earns the economy-wide positive profit
rate rather than a sector-specific one. The flow is always inward—crises stop projects and
depreciation runs the stock down, but outright divestment is not yet modeled. Because FDI is real
investment demand, it changes the passive macro and political baselines and requires a schema
bump, golden replays, range calibration and full stability review.
