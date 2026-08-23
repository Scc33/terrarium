# ADR-0028 — Pollution is a stock the economy produces, and it damages through channels that already exist

**Status:** Accepted · **Date:** 2026-08-23

## Context

Issue #95 asks for externalities — pollution, emissions. It is the half of #96 that the statute
book was built to make cheap: an emissions standard is one row in `STATUTE_IDS` once there is
something for it to regulate. There is not. The engine has no representation of the harm
production does outside the market, so a statute regulating it would have nothing to bite on.

Externalities are also the one economic idea in the game's subject matter with no home in the
model at all. Every other mechanism — the fog, the veto players, the corridor, catch-up, the
crisis clock — has a channel. This one has none, so a government's output is currently free of
consequences it did not pay for, which is precisely the thing the concept names.

The design constraint is the usual one and it is sharper here than anywhere: **no hand-authored
effect arrows.** "Pollution reduces GDP by x%" is exactly the kind of scripted rule the engine
exists to refuse. Whatever damage exists has to arrive through machinery that is already running.

## Decision

State carries a new top-level `environment` block holding **one slow stock**, plus this quarter's
emissions for inspection:

```ts
export interface EnvironmentState {
  /** pollution burden, 1946 standard country = 1. Slow: cleaning up takes decades. */
  pollution: number
  /** this quarter's emissions per head, in the same index — what the stock chases */
  emissionsQ: number
}
```

**Emissions are a by-product of output, per head.** A new `environment` pipeline step, placed
directly after `production` because that is where output exists, computes

```
dirty      = Σ EMISSION_INTENSITY[sector] × output[sector]
perHead    = dirty / population
abated     = perHead / attainment^EMISSION_TECH_GAIN × (1 − abatement)
pollution' = pollution + POLLUTION_ADJUST × (abated / POLLUTION_REFERENCE − pollution)
```

Four things follow from that shape and each is deliberate:

- **Per head, not absolute.** Land and area are not modelled, so an absolute tonnage would make
  a big country dirtier than a small one purely by size, which is meaningless for anything the
  damage channels read. Per head is a concentration proxy, and it makes pollution follow income
  and industrial structure rather than population — the environmental Kuznets story, arrived at
  rather than authored.
- **Technology cleans it.** Emissions per unit of output fall as a sector's attainment rises,
  because a better technique is a cleaner one. The country that funds research gets a cleaner
  economy without being told it will.
- **A stock, not a flow.** The stock chases current emissions slowly, so a country that
  industrialises hard carries the burden for decades after it stops, and a clean-up is a
  generation's work. That inertia is what makes it an externality rather than a running cost.
- **Seeded at equilibrium.** `init` sets `pollution` to exactly the opening emissions ratio, so a
  run does not open with a spurious ramp while the stock finds its level. Countries differ at
  1946 because their industrial structures differ, which is the correct reason to differ.

**Damage arrives through two channels that already exist, and no others.**

- **Mortality** (`pipeline/demography.ts`). A pollution term joins `mortalityIndex`, beside the
  income and secular terms already there. This is the local, immediate, personal harm: dirty air
  kills people in your country now. It reaches welfare and the report card the way every other
  mortality change does.
- **Drought hazard** (`pipeline/shocks.ts`). `DROUGHT_P` is scaled by the stock. This is the
  climatic, delayed, stochastic harm — and it reuses the entire drought machinery: severity,
  duration, the agricultural TFP cut, the wire item, the recovery. Nothing new is modelled.

The drought channel is the more important of the two and the reason this design is worth
building. It makes the externality **a tail risk you bought decades ago**, which is the shape the
real thing has, and it costs one multiplier because the response already exists.

**The statute the register was waiting for.** `emissions_standard` joins `STATUTE_IDS` — none /
smokestack rules / clean air act — and follows the ADR-0027 rule of one fact with readers:
abatement. Emissions fall, and the abatement equipment raises unit cost in the sectors that must
fit it, through `prices.ts`'s existing cost anchor. Whether that trade is worth making is a
measurement, not a design intent.

**A fogged instrument, because an unmeasured externality is the whole problem.** `pollution`
joins `INDICATOR_IDS` behind an environmental-monitoring funding gate. A government that has not
built the monitoring service cannot see what it is doing, which is not a flourish — it is the
historical fact, and it is the same lesson every other instrument teaches.

### What this changes that the statute book did not

**The passive baseline moves, and it has to.** ADR-0020 and ADR-0027 could both ship inert,
because a rule nobody enacts is a rule that does nothing. Pollution is not a rule: it happens
whether the cabinet legislates or not, so introducing it changes what a passive century *is*. The
golden diff will be large and the passive numbers will move.

That makes the calibration bar higher rather than lower. The century has to remain healthy on the
`economics-review` criteria after the change, and the diff has to be read variable by variable
rather than blessed. A pollution model that quietly costs half a point of growth has not modelled
an externality, it has applied a tax.

## Alternatives considered

- **Damage GDP or TFP directly** — a pollution drag on output. By far the simplest to implement
  and the easiest to calibrate to a target. Rejected as the effect arrow the engine exists to
  refuse: it states the conclusion ("pollution is bad for the economy") instead of producing it,
  and it would be invisible to the player as anything but a number going down.
- **Model pollution per sector rather than one aggregate stock.** More faithful — a country can
  have dirty industry and clean air. Rejected for the wall's sake as much as the model's: five
  stocks is five instruments against a rack with six strips of headroom, and the damage channels
  read a single burden anyway. The sectoral detail lives where it belongs, in the intensity table
  that produces the aggregate.
- **A global stock shared across countries.** Physically right for climate and wrong for a game
  in which one country is played: the player's own emissions would be a rounding error against a
  world they cannot touch, so nothing they did would matter. The per-head local burden keeps the
  decision theirs. The cost is that this is climate-as-experienced-locally, not climate.
- **Make it a shock rather than a stock** — occasional pollution disasters. Cheap, and it would
  make the wire more eventful. Rejected because an externality that arrives as luck cannot be
  managed, and the point of the mechanic is that it accumulates from ordinary decisions.
- **Ship the statute without the physics** — an emissions standard that costs money and buys
  approval. Rejected for the reason #95 exists: that is a lever with no referent, and it would
  make the statute book look like it had answered a question it had not.

## Consequences

- A new pipeline step. Step order is versioned (ADR-0005), so this is a `SCHEMA_VERSION` event —
  as is the new state block and the new indicator. RNG substreams are keyed by step name
  (ADR-0002), so no existing step's draw sequence moves.
- `manual.ts` mirrors `TICK_ORDER` by hand across the import boundary; `tests/ui/manual.test.ts`
  will fail by name until the new step is listed there.
- The passive, developmental, random and regulated baselines all move and must be re-measured and
  recorded in the `economics-review` skill.
- `pollution` costs one rack strip. `rackHeadroom()` must still be positive afterwards.
- The intensity table is a total `Record` over `SECTOR_IDS`, so a sixth sector cannot ship without
  somebody deciding how dirty it is.
