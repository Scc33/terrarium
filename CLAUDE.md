# Terrarium — working notes for Claude

Economic policy game per docs/ (read `docs/tech-architecture.md` before touching structure).
pnpm monorepo; M0+M1 are built.

## UI design authority

The **`terrarium-design` skill is the spec for all `packages/ui` work** — invoke it before
touching any component. Core ideas it enforces: the screen is diegetic (per-instrument
maturity: `unmeasured` blank brass plate → `dossier` analog gauge → `terminal` phosphor
ticker, derived once in `ui/src/maturity.ts`); Tailwind tokens named `dossier-*` /
`terminal-*` (in `ui/src/index.css` via `@theme`); one shared mono numeral face; corridor
map + news wire live in their own quieter third register (`map-*` / `wire-*`); revision
marks must be loud. Layout is a single-screen war room (header / instrument wall +
control rail / wire) — no page scroll at desktop sizes.

## Hard rules (lint-enforced, but know why)

- `packages/engine` is pure: no DOM, no React, no other workspace packages, no `Math.random`
  or `Date.now`. All randomness via `rngFor(seed, stepName, tick)` substreams.
- `packages/ui` may import types from `@terrarium/observation` and action types from
  `@terrarium/engine`, but never `engine/src/state/*` — the UI must be unable to name true state.
- Pipeline step order in `engine/src/pipeline/pipeline.ts` is versioned; reordering is a
  schema-version event.
- The fog is MADE in the engine (`pipeline/statistics.ts`: prints, revisions, rumor news,
  via `obs:*` substreams orthogonal to the economic RNG) because politics reads the
  published headline, not the truth (§3.4 salience). `packages/observation` is
  presentation-only — never grow measurement logic back into it.
- Every behavioral constant lives in `engine/src/constants.ts` — tune there, nowhere else.

## Workflows

- Engine change → `pnpm test` breaks golden replays → run `pnpm diff-state` and review what
  moved (that review IS the economics review) → `pnpm bless` if intentional.
- On a `SCHEMA_VERSION` bump, add an entry to `CHANGELOG.md` (human-readable) and
  `docs/metrics-changelog.md` (the engine's inputs/outputs contract — new indicators + their
  `fundedAt`, new levers/params, pipeline-order changes).
- Balance work → `pnpm batch -- --runs 1000 --ticks 120 --policy random` (and
  `--policy passive --ticks 400`). Healthy M5 passive baseline: growth ≈ 2.5%/yr,
  inflation ≈ 0, u ≈ 12.4% century mean — the elevated u is the DESIGNED §8 youth-bulge
  bomb an unschooled do-nothing government earns (funding education absorbs it to ~7%
  and lifts growth past 3%). ~7% deposed by 400q, clustering at the aging endgame
  (median ~q336) — a functioning financial system is a mild stabilizer. Random policy
  120q: ~24% deposed (self-inflicted banking crises claim a few more than pre-M5's ~22%),
  no NaN, no price explosions.
- The M1 exit-criteria tests (`tests/properties/fuel-tax.test.ts`, `subsidy.test.ts`) are the
  design's load-bearing claims. If a change breaks them, the change is wrong, not the test.

## Hard-won tuning lessons (violate at your peril)

- Unit costs in the price step are computed at NORMAL_UTILIZATION, not realized output —
  otherwise demand dips mechanically raise unit cost and spiral (stagflation death loop).
- Wages: Phillips slack anchor + productivity passthrough near full employment + downward
  stickiness. Removing any leg breaks the century: no anchor → drift to 50% unemployment;
  no productivity passthrough → permanent deflation; symmetric flexibility → 1870s-depth busts.
- Households spend against EMA "habitual" income (same EMA approval judges against) —
  permanent-income smoothing is the main cycle damper. The wage/employment gains in
  constants.ts were lowered until the business cycle stopped resonating with the 16-quarter
  election period.
- Bond coupons are household income; redemptions go to household savings. Money paid to
  bondholders must not vanish, or every tax rise becomes an austerity bomb.
- M4 growth needs both valves: Lewis investment (INVESTMENT_SLACK_GAIN — surplus labor
  pulls capital widening, or a growing labor force ratchets u to 15%) and the subsistence
  valve (SUBSISTENCE_ABSORPTION_Q, capped by the rural labor force — uncapped it recreates
  the Malthusian trap: agri swallows the labor force, income stagnates, fertility never
  falls). Education capacity decays at 1/4 the rate of the others (people stay taught);
  vital rates read the income LEVEL (LIVING_STANDARD_1946 anchor), the report card reads
  income vs your own 1946 — don't conflate the two anchors.
- Init self-calibrates spending to the tax base (see `init.ts`) — an unbalanced opening
  budget compounds into a scripted depression.
- M5 finance is a feedback loop that WANTS to ratchet (assets↑ → collateral↑ → credit↑ →
  assets↑ — the Minsky loop, the tâtonnement lesson again). Two rules keep it a cycle: (1)
  ASSET_REVERT to fundamental must out-muscle the collateral/spirits feedback at the margin,
  or a passive economy spontaneously bubbles and lifts growth off-baseline; (2) the
  passive-calm vs active-boom separation is carried by the REAL-RATE channel
  (ASSET_FUND_RATE_GAIN / CREDIT_RATE_GAIN) — under passive, real rates sit above natural so
  q<1 and leverage stays ~0.6; only a policy rate cut (or a genuine profit surge) inflates a
  bubble. That is by design: the crisis a player gets is the one their own cheap money earned.
  The bank-capital cap is deliberately SLACK in booms (borrower demand is the binding limit)
  and only bites AFTER a crisis writes capital down — that post-crash cap IS the forced
  deleveraging (credit runs off for years, q overshoots below 1 — a lasting credit hangover).
