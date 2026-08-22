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
the schema-12 baseline sampling frame for the load-bearing mechanism properties and historical dial
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

## The year you take office

A posting names a country **and a quarter** (ADR-0021). Every year on offer is a `FRONTIER_ERAS`
boundary, because the frontier's growth schedule is the only calendar the engine keeps:

| appointment | quarter | the world that quarter | left on the clock |
|---|---:|---|---:|
| 1946 · the settlement | 0 | frontier 2.0 %/yr | 104 years |
| 1973 · the slowdown | 108 | frontier drops to 1.1 %/yr | 77 years |
| 1995 · the new economy | 196 | frontier rises to 1.6 %/yr | 55 years |
| 2005 · the long stagnation | 236 | frontier settles at 1.1 %/yr | 45 years |

The years before the appointment are governed by a **caretaker administration** in the ordinary
loop, and its orders are written into the save's action log, so a later posting is an ordinary
replayable save. The caretaker holds the opening appropriations at their share of the economy
and builds the four state capacities; it touches no other lever.

What that produces is measured, not authored. Median over 48 seeds per cell, schema 29,
2026-08-21 — re-measure with `pnpm inheritance` rather than trusting this, exactly as with the
matrices above.

| appointment | country | GDP × | GDP/head × | pop × | statistical | reporting | unemployment | debt/GDP |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 1973 | Meridia | 3.26 | 2.13 | 1.53 | 0.48 | 28/30 | 15.4 % | 0 % |
| 1973 | Costona | 2.18 | 1.38 | 1.58 | 0.42 | 22/30 | 16.2 % | 0 % |
| 1973 | Veltravia | 3.14 | 2.81 | 1.12 | 0.65 | 30/30 | 10.4 % | 32 % |
| 1973 | Oranga | 3.88 | 3.08 | 1.26 | 0.70 | 30/30 | 10.6 % | 33 % |
| 1973 | Kestrel | 3.40 | 2.15 | 1.58 | 0.47 | 28/30 | 14.8 % | 23 % |
| 1995 | Meridia | 9.79 | 4.86 | 2.01 | 0.65 | 30/30 | 12.8 % | 0 % |
| 1995 | Costona | 6.75 | 2.97 | 2.27 | 0.61 | 30/30 | 17.1 % | 0 % |
| 1995 | Veltravia | 7.35 | 5.16 | 1.42 | 0.77 | 30/30 | 8.5 % | 0 % |
| 1995 | Oranga | 9.66 | 5.77 | 1.67 | 0.80 | 30/30 | 8.4 % | 0 % |
| 1995 | Kestrel | 11.88 | 5.32 | 2.23 | 0.64 | 30/30 | 12.8 % | 0 % |
| 2005 | Meridia | 14.62 | 6.37 | 2.29 | 0.70 | 30/30 | 10.9 % | 0 % |
| 2005 | Costona | 11.64 | 4.43 | 2.63 | 0.67 | 30/30 | 16.2 % | 0 % |
| 2005 | Veltravia | 9.95 | 6.31 | 1.58 | 0.81 | 30/30 | 7.3 % | 0 % |
| 2005 | Oranga | 13.16 | 7.05 | 1.87 | 0.84 | 30/30 | 6.8 % | 0 % |
| 2005 | Kestrel | 18.66 | 7.22 | 2.57 | 0.70 | 30/30 | 10.4 % | 0 % |

Four things to read out of it, none of them tuned for:

- **1973 is the appointment with a fiscal inheritance.** Veltravia, Oranga, and Kestrel still
  carry real debt; everyone is debt-free by 1995, because the caretaker's tax collection outgrows even
  GDP-share appropriations (investigation 0008 explains the mechanism at greater length). If a
  later posting should hand over a balance sheet, that is a debt-model question, not an
  appointment one.
- **The countries split on the demographic transition, while migration keeps the split from
  becoming a population target.** Costona stays poor and young enough to reach 2.63× its 1946
  population with 16.2 % unemployed. Richer Veltravia and Oranga complete more of the fertility
  transition, but their relative performance attracts young adults, so neither now shrinks.
  Both channels are systemic; neither country has an authored population path.
- **Aggregate growth is partly demography and migration.** Costona's output is 11.64× by 2005
  on 2.63× the people, which is 4.43× per head; Meridia reaches 14.62× aggregate output but
  6.37× per head. Read the per-head column beside every aggregate
  (investigation 0007).
- **These numbers are load-bearing evidence, not decoration.** An earlier revision of ADR-0021
  gated `livingStandard` on the scoring baseline, which left the whole interregnum at a constant
  income level: the transition never fired, births ran at 35.3 per 1000 against 26.0, and every
  population above was up to 7 % too large. The schema-29 merge found the same class of coupling
  in reverse: migration had borrowed the appointment-based scoring baseline, so the same caretaker
  orders produced a different pyramid. Migration now keeps its own 1946 anchor (ADR-0022).
  `pnpm inheritance` beside a same-orders 1946 replay is what caught both errors, and
  `tests/properties/interregnum.test.ts` now pins the two against each other.

## Countries players write

A country the player authored is the same thing as a curated one — an immutable `CountryParams`
vector materialized before `init` — so it needs no engine mode, no pipeline fork, and no schema
migration beyond the provenance flag (ADR-0019). A save has always embedded the whole vector, so
hand-editing an exported save's `params` block was already a legal game; the drafting room only
gives that a format, a validator, and a door.

The shareable form is a **country document** (`packages/engine/src/countryDocument.ts`):

```jsonc
{
  "format": "terrarium-country",
  "version": 1,
  "ageShape": "industrial",     // the pyramid is rebuilt from this, never stored
  "params": { /* the vector, minus `pyramid`, rounded to 6 significant digits */ },
  "dossier": { "byline": "...", "summary": "...", "opportunities": [], "pressures": [] }
}
```

About a kilobyte, so it travels as a file *or* in a URL fragment (`#country=<base64url>`), which
is never sent to a server. `parseCountryDocument` rebuilds the object field by field rather than
casting parsed JSON — a document arrives from a stranger — and the dossier carries **no
difficulty field**: the stamps in the table above are backed by the matrices on this page, and a
self-declared one would be a claim nobody measured.

`CountryParams.authored` rides in the save so a report card earned on an unbalanced country says
so after export and reload. No pipeline step reads it.

## The feasibility study

The drafting room runs the balance matrix in the browser. `packages/ui/src/worker/trial.ts` runs
nine passive centuries of the candidate **and of Meridia on identical seeds**, in about a second
on the worker thread — a full 416-quarter century costs roughly 70 ms, and nine browser seeds
reproduce the 100-run passive column above to within a few tenths.

It reports this page's own columns plus the batch runner's two failure definitions verbatim
(NaN; any price past 50× or under 1/50×). It issues **no verdict and no difficulty grade**, for
two measured reasons:

- Sampling 400 vectors uniformly inside `validateCountryParams`' legal box and running each 400
  quarters gave **zero NaN** and nine slow relative-price drifts past the tripwire, clustered
  around quarter 95 and later. A gate would reject ~2% of legal countries, and those are late
  drifts rather than broken economies.
- Passive deposition does not track the curated difficulty labels at all — Veltravia is
  `standard` and falls in 44% of passive centuries, Costona is `hard` and falls in none. A live
  reference country says more and claims less than a derived stamp.

The study's metric definitions are copied from `packages/runner` because `packages/ui` must not
depend on a node CLI package. `tests/ui/trial.test.ts` pins the two implementations against each
other on identical inputs; if it goes, the study stops being comparable with the tables above.

## Adding another country

1. Add a `CuratedCountryId`, presentation profile, and immutable recipe in `countries.ts`.
2. Keep sector multipliers moderate and complete over all five sectors. `init` normalizes each
   mix, so composition changes without stealing population/development's ownership of scale.
3. Give the pyramid and cohort vector the same total; `validateCountryParams` rejects a mismatch
   before the first tick.
4. Run the random and passive `--country all` matrices, the load-bearing mechanism properties, and
   `pnpm ranges`.
5. Verify the selector and the resulting wall at 1280×720. A country that permanently pegs an
   instrument has found either a bad recipe or an obsolete face; review which before changing it.
