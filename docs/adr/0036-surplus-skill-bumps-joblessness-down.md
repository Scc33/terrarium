# ADR-0036 — Surplus skill bumps joblessness down; it does not change how many jobs exist

**Status:** Accepted · **Date:** 2026-08-30 · **Schema:** 43

## Context

[ADR-0035](0035-staffing-is-rationed-against-who-exists.md) made `LABOR_SOURCE` a demand for
skills and rationed every post against the people who exist. Its nearest-rung substitution can
fill a post whose requested class is absent, but it cannot represent a better-qualified applicant
beating a matched applicant to a post that was already going to be filled.

That absence was measurable. Across five countries, two policy arms and 400 quarters,
professionals never worked outside services. In the educated-surplus case they stayed openly
unemployed while the lower rungs were also in surplus. This is the half of issue #27 that
ADR-0035 deliberately left for #201: over-qualification requires a claim about hiring behaviour,
not an accounting identity.

The choice matters politically. A professional taking a lesser job does not remove joblessness;
the matched worker they displace must either take a still-lower post or become unemployed.
Bumping therefore moves hardship toward the urban and rural classes that already carry most
slack, and cohort income, approval, unrest and elections all hear that redistribution.

## Decision

After own-skill hiring settles, `allocateStaffing` lets a share of **otherwise-idle applicants**
displace matched workers from posts on the immediately lower `SKILL_RANK`. The share is
`OVERQUALIFIED_HIRING_PREFERENCE`, shipped at **0.5**.

Four constraints define the mechanism:

1. **Zero is exactly inert.** At zero the bumping phase is skipped, and
   `pnpm diff-state --moved-only` reports zero values moved in all three golden cases.
2. **Jobs are conserved.** Bumping only changes the cohort holding an existing post. Sector
   employment, the wage bill and aggregate open unemployment keep ADR-0035's identities.
3. **The walk is high to low and one rung at a time.** A professional can displace an urban
   worker, who can in turn displace a rural worker. Applicants and matched posts are allocated
   pro rata, so sector order cannot decide who loses work.
4. **Scarcity is not mistaken for displacement.** A lower class is bumped only after all posts
   that requested that class have settled. In an opening vector with more posts than hands the
   phase is skipped entirely, preserving ADR-0035's pro-rata statement of the impossible part.

The preference means: at 0.5, half of the higher rung's surplus contests a lesser post when
enough matched posts exist. It does not say half of all lesser posts belong to graduates, and it
does not let a worker skip a rung.

`flows.unemployment` remains **open unemployment**. Every existing reader was resolved on that
meaning rather than changed mechanically:

- union power and favour want workers with a job to organize and strike from;
- Lewis investment wants idle hands that additional posts could employ, not a relabeling of
  people already inside the fixed wage bill;
- migration already hears the lower sector wage through relative welfare;
- urbanization's `jobsPull` asks whether city jobs exist, and bumping creates none;
- consumer confidence already hears underemployment through wage income and its habitual-income
  trend.

Adding underemployment to those terms would either invent posts and investment demand or charge
the same lower wage twice. A later published underemployment figure is a decomposition beside
open unemployment, not a redefinition of it.

## Alternatives considered

**Keep ADR-0035 only.** Coherent and cheap, but it leaves a measured professional surplus wholly
idle and cannot represent the phenomenon #27 asked about. Rejected because the missing behaviour
is reachable, policy-sensitive and visible in cohort welfare.

**Always prefer the better-qualified applicant.** This is preference 1: every surplus applicant
bumps when a lesser post exists. It erases the full reachable surplus and makes over-qualification
an automatic cure for top-rung unemployment. Rejected in favour of a strength that leaves both
open unemployment and underemployment present.

**Put every skill mismatch into `flows.unemployment`.** Rejected because a person in a lesser job
is employed: the sector paid a wage, the household received it, and the worker can organize,
migrate or consume from that fact. A single headline cannot mean “no job” to one reader and “not
the ideal job” to another without silently rewiring five mechanisms.

**Allocate greedily by sector order.** Simpler, but the first sector in `SECTOR_IDS` would decide
which class and wage bears the displacement. Rejected for the same reason ADR-0035 rejected a
first-come shortage fill: source order is not an economic institution.

## Consequences

The intended redistribution is direct. At q400 under developmental policy, eight seeds per
country, professional idle and urban idle move as follows:

| country | professional idle | urban idle | visible professional underemployment |
|---|---:|---:|---:|
| Meridia | 5.9% → **3.0%** | 6.6% → **8.2%** | **0.5% of labour force** |
| Costona | 8.9% → **4.4%** | 16.4% → **18.2%** | **0.6%** |
| Veltravia | 6.9% → **3.5%** | 6.2% → **7.9%** | **0.6%** |
| Oranga | 7.2% → **3.6%** | 4.1% → **6.2%** | **0.6%** |
| Kestrel | 11.6% → **5.8%** | 6.0% → **8.8%** | **1.0%** |

“Visible” is deliberately a lower bound: professionals outside services are certainly filling a
lesser post. Services also contains urban posts, but the public sector-by-cohort allocation cannot
distinguish an urban services post filled by a professional from the professional post beside it.
That missing desired-post dimension belongs to the later underemployment publication, not to this
allocation change.

The macro calibration remains small, measured at 200 seeds × 400 quarters against the exact
zero-preference arm:

| policy | growth %/yr p50 | unemployment p50 | deposed |
|---|---:|---:|---:|
| passive | 2.84 → **2.85** | 12.49% → **12.51%** | 1% → **1%** |
| developmental | 3.05 → **3.05** | 12.23% → **12.26%** | 2% → **1%** |
| regulated | 3.04 → **3.04** | 11.98% → **12.01%** | 2% → **2%** |
| random | 3.40 → **3.40** | 12.37% → **12.41%** | 77% → **77%** |

All eight batch arms reported zero NaNs and zero price explosions. Passive is the calibration
test and moves by one basis point of growth, two basis points of unemployment and no deposition:
the preference is not a tax on a country that never expands its professional class.

The distribution can still move a particular election. In the 40-quarter goldens,
professionals gain about 7% wage income while the bottom two quintiles lose roughly 6–8% of real
income and unrest rises about 11%; the fuel-tax fixture's government loses its knife-edge election
at q16. That is not treated as noise. Pushing joblessness down the ladder is the mechanism's cost,
and the all-policy batches rather than one seed decide whether that cost is calibrated.

The labour-market tool now prints professional underemployment beside surplus and idle. Its
identity still closes to floating precision (`max |M - S - U| = 4.72e-16`), proving that bumping
reclassified who works rather than manufacturing or deleting a job.
