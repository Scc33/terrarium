# 0003 — `technology_attainment` falls while every sector's technique rises

**Status:** Open
**Raised by:** shipping the `productivity` indicator and reworking the research model
(schema 19). The old property test `research grants accelerate domestic attainment when the
country is behind` failed after the change, and failed for a reason that had nothing to do with
the change.
**Measured at:** the schema-19 branch, 12 seeds × 40–240 quarters, `standardCountry` with
`education = administrative = 0.7`, research funded at 2 % of nominal GDP.

## What was believed

That `technologyAttainment` — the truth behind the `technology_attainment` instrument — is a
monotone summary of domestic technique: if research raises attained technique in every sector,
the index rises. The test asserted exactly that, on one seed, and had passed since v18.

## What was measured

Attainment is **output-weighted** across sectors (`pipeline/derive.ts`). Research makes the
economy grow. Growth shifts output toward services, and `TECH_EXPOSURE.services = 0.45` keeps
services structurally furthest from its own frontier. So the weights move toward the sector that
drags the index down.

On seed `tech-rd-catchup`, 40 quarters, development 0.1:

| | passive | funded |
|---|---|---|
| `technologyAttainment` | 0.6517 | **0.6506** |
| `attained.manuf` | — | **+3.1 %** |
| every other sector | — | **all higher** |

The funded run has strictly more technique in all five sectors and a *lower* published index.

Across 12 seeds the mean effect is positive at every horizon, so the index is not wrong-signed
in general — it is noisy in a direction that correlates with the very policy it is meant to
score:

| ticks | mean attainment p→f | worst seed | manuf attained ratio |
|---:|---|---:|---:|
| 40 | 0.6316 → 0.6499 | +0.0178 | 1.030 |
| 80 | 0.7019 → 0.7250 | +0.0226 | 1.036 |
| 160 | 0.8066 → 0.8207 | +0.0137 | 1.020 |
| 240 | 0.8256 → 0.8323 | +0.0065 | 1.011 |

Note the trend: the gap *narrows* with horizon, because the composition drag accumulates as the
economy services-ifies while catch-up itself decelerates near the frontier.

## What it implies

Three readings, none of them ruled on:

1. **It is correct and it is the point.** A country whose output has moved into services really
   does operate further from the world frontier on an output-weighted basis. Baumol is a fact
   about development and the instrument reporting it is the instrument working. Under this
   reading nothing changes and the surprise belongs only in a test comment.
2. **It is correct but illegible.** The player cannot distinguish "the frontier pulled away"
   from "my economy grew into its slow sector", and the instrument's own note promises the
   first reading. A second series, or a fixed-weight variant, would separate them.
3. **The weights should be fixed at a base year.** A Laspeyres-style attainment index would be
   monotone in technique and would stop reporting structural change as technological failure —
   at the cost of drifting from what the economy currently is.

## What was done in the meantime

Nothing to the measure. The property test now asserts per-sector attainment, which is monotone
and unambiguous, and carries a comment explaining why it does not assert the aggregate. The
`productivity` instrument added in the same change is not affected: it is a level, not a ratio,
and structural change into higher-output-per-head sectors *raises* it.

Re-measure before acting on any of this.
