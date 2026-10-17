# 0027 — Food exports follow prices once they stop following capacity

**Status:** Open — the spike for [#290](https://github.com/Scc33/terrarium/issues/290), parked on
[#319](https://github.com/Scc33/terrarium/issues/319). The trade change #290 asks for is built on
branch `claude/terrarium-290-trade-demand` (`16b0cf0`) and not merged. It removes the channel #290
names, and developmental exports come back through another one: traded-goods prices that fall
about 90% in a century against a flat world. That is #319, and #290 lands after it.

**Raised by:** #290 and [0023](0023-farm-employment-is-the-rural-class-on-a-slow-clock.md) §3,
"food trade scales with the farm's own capacity".

**Measured at:** `08f8767` (schema 51) for the base, `16b0cf0` for the change. Composition tables
are `pnpm agriculture` (8 seeds × 400 quarters, protected tenure, unlimited capital). Macro tables
are `pnpm batch -- --runs 1000 --ticks 400 --country all --policy <p>`, and the random arm is
`--runs 1000 --ticks 120`, with ordinary tenure. The price probes replay one seed (`probe`) of
`meridia` and `costona` under the agriculture tool's developmental arm and print the sector boards.
Experiments in §4 are edits on top of `16b0cf0`, listed with each table and reverted. Re-measure
before acting on any number here.

## What was built

Exactly the shape #290 proposed:

- **Exports** sell from `external.exportMarket`, a per-sector foothold in partner markets. It is
  seeded at the 1946 export order (`EXPORT_BASE_SHARE × potential × openness`, so the opening is
  unchanged), then grown by `world` each quarter. The growth is world workforce growth (a new
  `WORLD_WORKFORCE_ERAS`, roughly the UN's working-age series) plus the frontier schedule's growth
  per head times the sector's world income elasticity: `1 + ENGEL_ELASTICITY`, and for the farm
  `+ FARM_GATE_ELASTICITY` as well. The relative-price term and partner activity apply as before.
  Own capacity only caps exports.
- **Imports** scale with domestic absorption, the Leontief requirement of household, state and
  investment demand, divided by `UTILIZATION_AT_INIT` so the existing `IMPORT_BASE_SHARE` keeps its
  basis.
- **`init`** seals `balanceNorm` and the reserve book from the order `production` places on the
  opening state. Absorption cannot be restated in `init` without restating demand. At opening,
  demand per sector is nowhere near potential (absorption / potential runs from 0.30 for Kestrel's
  energy to 1.42 for its manufacturing), so a hand-computed seed would have opened every country on the
  wrong basis.

## 1 — It removes the capacity channel, and passive holds

| 1000 × 400q, `--country all` | passive base → change | developmental base → change |
|---|---|---|
| real growth %/yr | 2.86 → **2.86** | 3.07 → **3.08** |
| mean inflation %/yr | 0.11 → **−0.06** | −0.37 → **−0.85** |
| unemployment % | 12.99 → **13.23** | 12.73 → **13.47** |
| deposed | 1% → **1%** | 6% → **9%** |

Regulated moves with developmental (8% → 11% deposed, inflation −0.37 → −0.86). Random 120q
barely moves: growth 4.13 → 4.10, deposed 21% → 23%, and no NaN or price explosion on any arm.

Developmental deposition by country (base → change): Meridia 0 → 0%, Costona **4 → 11%**,
Veltravia 1 → 0%, Oranga 0 → 0%, Kestrel **25 → 33%**, procedural 7 → 10%.

Farm net exports as a share of farm demand, 2046 (`pnpm agriculture` table 3, base → change):

| | passive | developmental |
|---|---|---|
| meridia | 0.19 → 0.17 | 0.38 → **0.37** |
| costona | 0.14 → 0.16 | 0.42 → **0.48** |
| veltravia | 0.18 → 0.12 | 0.32 → 0.21 |
| oranga | 0.30 → 0.21 | 0.44 → 0.32 |
| kestrel | 0.19 → 0.13 | 0.37 → 0.32 |

Veltravia and Oranga lose about a third of the developmental surge and Kestrel a seventh. Meridia
keeps it, and Costona's gets larger. Developmental farm employment in 2046 moves by about a point either way
(Costona 12.8 → 14.6, Oranga 11.3 → 8.9).

`pnpm export-share -- --runs 40 --ticks 160`, at Q160: investment at 10% of GDP goes from **+10.6%
real exports to −26.2%**, education from +24.0% to +16.1%, and all capacities from +57.6% to +40.1%.
The tax-office lever is nearly unmoved (+26.9% → +23.8%). So 0010's levers do move, as #290
predicted: the ones that worked by building capacity lost most.

## 2 — The exports come back through price

Developmental `costona`, one seed. `X / mkt` is exports over the foothold, i.e. how much the price
and partner terms multiply it:

| year | sector | X / mkt | world ÷ home price | fx | home price |
|---|---|---|---|---|---|
| 1947 | agri | 1.08 | 1.08 | 1.01 | 0.91 |
| 1976 | agri | 2.13 | 1.74 | 0.93 | 0.53 |
| 2006 | agri | 5.73 | 3.23 | 0.65 | 0.20 |
| 2045 | agri | **7.63** | **4.02** | 0.49 | **0.12** |
| 2045 | manuf | 7.16 | 3.74 | 0.49 | 0.13 |

Meridia is the same shape, smaller: farm X / mkt 3.08 and home price 0.28 in 2045.

The foothold grows as intended. The home price falls far faster than the currency follows it,
and the 1.5 elasticity turns a fourfold price advantage into sevenfold sales. `pnpm currency` §4
shows the whole catalogue doing this. Developmental real rates end the century at 1.5–2.1 on base
and 1.5–3.7 on the change, and trade surpluses at 9–12% of GDP **on both**. The surplus did not go
away; it changed channel.

## 3 — The prices fall because wages do not follow productivity

Sector boards in 2045 (1946 = 1) and the manufacturing wage, same probe:

| | agri | manuf | energy | services | transport | wage (manuf) | fx |
|---|---|---|---|---|---|---|---|
| meridia passive | 0.69 | 0.64 | 0.48 | 1.39 | 0.46 | 2.87 → 7.15 | 0.85 |
| meridia developmental | 0.28 | 0.25 | 0.20 | 0.65 | 0.18 | 2.87 → 4.76 | 0.62 |
| costona developmental | 0.12 | 0.13 | 0.10 | 0.32 | 0.10 | **1.95 → 1.48** | 0.49 |

In developmental Costona the nominal manufacturing wage ends *below* where it started. Over the
same century, manufacturing attainment goes from 0.57 to 0.88 of a frontier that grows 3.9×. With
the cost anchor in `prices`, the whole productivity gain becomes a lower price, not a higher wage.

`world` mean-reverts every world price to 1, so nothing abroad falls with it. `FX_PARITY_PASSTHROUGH`
is 0.35 *because* of that, as ADR-0034's alternatives and the tuning lesson both record. The
currency is held weak on purpose, and competitiveness keeps two-thirds of every price fall.

## 4 — Three levers tried

Each is an edit on top of the change, measured and reverted.

**A world price trend** (world price of sector *s* reverting to `frontierLevel ^ (0.7 −
TECH_EXPOSURE[s])` instead of 1): Costona 2045 farm X / mkt 7.63 → 7.47, Meridia 3.08 → 3.03.
Too small. The trend moves food about 17% over a century, against a 90% domestic fall.

**Pass-through, with that trend:** at 0.6, Costona's 2045 boards fall to 0.05 (the price floor)
and the rate to 0.20. At 1.0, both countries hit the floor and the 0.06 rate rail by 2045. That is
ADR-0034's rejected alternative, reproduced.

**Globalisation** (world trade growing faster than world income: +2.5 %/yr to 1973, +1 to 1995,
+3 to 2008, then 0):

| 1000 × 400q, `--country all` | base | change | change + globalisation |
|---|---|---|---|
| passive inflation %/yr | 0.11 | −0.06 | **0.65** |
| developmental inflation %/yr | −0.37 | −0.85 | **0.21** |
| developmental deposed | 6% | 9% | **7%** |
| Costona / Kestrel developmental deposed | 4% / 25% | 11% / 33% | 8% / 28% |

It removes the deflation, and it undoes what #290 is for. In 2046, Costona's developmental farm
net exports reach **0.50**. Passive farm employment rises: Meridia 12.6 → 14.3%, Costona 15.6 →
19.3%. Whatever lets a developer sell more abroad without deflating also sells more food abroad.

## What this implies

#290's diagnosis was right, but its fix is not sufficient alone. With exports tied to capacity
removed, the export surge is carried by a price channel that was always there and was half-hidden
behind the capacity term. Any demand-based trade model hits it, because a developmental century
makes every traded good about ten times cheaper at home than abroad.

The order is therefore forced again, as 0023 found for #288 and #289. The anchor (#319) comes
first, and the parked branch is then re-measured on top of it. Shipping the change now would buy
three points of developmental deposition and half a point a year of extra deflation, to move food
exports in three of five countries.

## What would settle it

On the parked branch rebased onto #319:

- `pnpm agriculture` table 3 `net exp.`: developmental no longer above passive by more than a few
  points in any country;
- `pnpm currency` §4: developmental real rates within reach of passive;
- `pnpm batch --country all` on every policy: passive holds, and developmental deposition is back
  to base.
