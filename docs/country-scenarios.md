# Country scenarios

Countries are parameter recipes, not engine modes. Every opening materializes a `CountryParams`
vector, and the ordinary `init → applyActions → step` loop owns everything after that. Saves embed
the materialized vector, so a later recipe retune cannot rewrite an old game's history.

## Catalogue

| id | opening | principal terrain |
|---|---|---|
| `meridia` | balanced mid-poor republic | the historical golden baseline |
| `costona` | agrarian, young, low-capacity | landowner power and a large labor reserve |
| `veltravia` | mature industrial reconstruction | organized workers, industrial/financial vetoes, high debt |
| `oranga` | small open maritime republic | capable administration and world-cycle exposure |
| `kestrel` | energy-heavy concession state | rents, repression, and an opening reform window |
| `procedural` | one of five bounded archetypes | seed-reproducible jitter over the same structural terrain |

The scenario catalogue is in `packages/engine/src/countries.ts`. `generateParams(seed)` remains
the schema-12 baseline sampling frame for the load-bearing M1 properties and historical dial
comparisons. `createCountryParams('procedural', seed)` is the wider player-facing generator.

## Stress and calibration

The batch runner accepts a single scenario or the whole matrix:

```sh
pnpm batch -- --country costona --runs 1000 --ticks 120 --policy random
pnpm batch -- --country all --runs 1000 --ticks 120 --policy random
pnpm batch -- --country all --runs 600 --ticks 400 --policy passive
```

Omit `--country` to retain the historical generated-baseline check. `--country all` assigns runs
round-robin and includes both every curated opening and the procedural generator.

Calibration snapshot, 2026-08-08. Both matrices had **zero NaN runs and zero price explosions**.
Values are per-country medians except deposition, which is a share of runs.

| scenario | random 120q deposed | growth | inflation | unemployment | passive 400q deposed | growth | unemployment |
|---|---:|---:|---:|---:|---:|---:|---:|
| Meridia | 30% | 3.69% | 0.31% | 12.53% | 9% | 2.57% | 12.91% |
| Costona | 42% | 3.53% | 0.94% | 12.71% | 1% | 3.01% | 16.15% |
| Veltravia | 44% | 3.74% | 1.09% | 9.90% | 44% | 1.83% | 8.32% |
| Oranga | 28% | 3.95% | 0.52% | 11.33% | 47% | 2.05% | 9.04% |
| Kestrel | 23% | 3.85% | 0.78% | 12.97% | 20% | 2.76% | 13.35% |
| Procedural | 36% | 3.86% | 0.88% | 11.90% | 21% | 2.64% | 13.10% |

The random matrix is 1,000 total runs (166–167 per row); the passive matrix is 600 total runs
(100 per row). Survival is not the difficulty score by itself: Kestrel's inherited repression
lowers its electoral bar while beginning outside the corridor with revolutionary pressure already
above the reform-window line. The position and legitimacy grades price that apparent durability.

`pnpm ranges` now surveys every catalogue scenario by default. The food-price, payroll, asset,
inequality, and unrest faces were widened to the measured cross-country envelope; the browser
still pegs genuine extremes at the rails.

## Adding another country

1. Add a `CuratedCountryId`, presentation profile, and immutable recipe in `countries.ts`.
2. Keep sector multipliers moderate and complete over all five sectors. `init` normalizes each
   mix, so composition changes without stealing population/development's ownership of scale.
3. Give the pyramid and cohort vector the same total; `validateCountryParams` rejects a mismatch
   before the first tick.
4. Run the random and passive `--country all` matrices, the load-bearing M1 properties, and
   `pnpm ranges`.
5. Verify the selector and the resulting wall at 1280×720. A country that permanently pegs an
   instrument has found either a bad recipe or an obsolete face; review which before changing it.
