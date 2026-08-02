# Terrarium — working notes for Claude

Economic policy game per docs/ (read `docs/tech-architecture.md` before touching structure).
pnpm monorepo; M0–M6 are built (schema 11).

## The two halves

The **economy** (M1–M5) and the **politics** (M6) are separate machines that meet in two
places: `institutions` reads the economy to decide who has power, and the veto players price
every action in `actions/apply.ts`. Keep that seam narrow. In particular the passive century
baseline is an economy fact and M6 must not move it — the political layer is designed to bite
only when the player does something political, and `pnpm batch --policy passive` is the check.

## UI design authority

The **`terrarium-design` skill is the spec for all `packages/ui` work** — invoke it before
touching any component. Core ideas it enforces: the screen is diegetic (per-instrument
maturity: `unmeasured` blank brass plate → `dossier` analog gauge → `terminal` phosphor
ticker, derived once in `ui/src/maturity.ts`); Tailwind tokens named `dossier-*` /
`terminal-*` (in `ui/src/index.css` via `@theme`); one shared mono numeral face; corridor
map + news wire live in their own quieter third register (`map-*` / `wire-*`); revision
marks must be loud. Layout is a single-screen war room (header / instrument wall +
control rail / wire) — no page scroll at desktop sizes.

### The wall (M5.5) — three modules own it, and they are pure on purpose

The instrument wall is **board + rack + docked**: up to `BOARD_SLOTS` player-pinned
instruments at full size, then every instrument as a fixed-height strip in a stable order
(the whole measurement apparatus at a glance, unfitted ones included), then the ledger and
the corridor. Pins are a view preference in `localStorage`, not part of the save.

The decisions live in pure modules so they can be tested at all — components just render
them. Keep it that way; anything you push into a component becomes untestable here:

- **`ui/src/wallPlan.ts`** — how much room the war room has. The rack is fixed-height and
  complete, so the wall's minimum height is a NUMBER, and `tests/ui/wall-plan.test.ts`
  asserts it against a 1280×720 reference viewport. `rackHeadroom()` says how many more
  indicators fit (20, today — M6's `unrest` took one). When that hits zero the wall is
  full and the next indicator
  needs a real layout decision.
- **`ui/src/domains.ts`** — the printed face of each dial: a FIXED per-indicator domain,
  measured with `pnpm ranges`, never derived from the trailing window. A face redrawn under
  its own needle makes needle position meaningless across time. Off-scale readings peg at
  the rail with a chevron — going off the dial is information. Only `capital_stock` ratchets
  (175→900 over a century has no honest fixed face), and its bounds are monotone by
  construction.
- **`ui/src/components/WallTile.tsx`** — the tile frame. **Every wall tile goes through it.**
  It owns `overflow-hidden`, definite `minmax(0,1fr)` rows and `min-h-0` on the body, because
  a tile that sizes to its content instead of its slot is how M3–M5 shipped a wall that
  painted its own figures underneath the tile below and showed needles with no numbers.

## Hard rules (lint-enforced, but know why)

- `packages/engine` is pure: no DOM, no React, no other workspace packages, no `Math.random`
  or `Date.now`. All randomness via `rngFor(seed, stepName, tick)` substreams.
- `packages/ui` may import types from `@terrarium/observation`, and constants / action & save
  *types* from `@terrarium/engine`, but never `engine/src/state/*`, and never the engine's
  state-running functions (`init`/`step`/`replay`/`applyActions`/`runTick`) outside
  `ui/src/worker/**` — only the worker runs the engine; components see `PublishedState`. Both
  the import boundary (lint) and the *data* boundary (`tests/contract/published-state.test.ts`:
  no true-state field ever crosses, output is structured-cloneable) are enforced.
- Pipeline step order in `engine/src/pipeline/pipeline.ts` is versioned; reordering is a
  schema-version event.
- The fog is MADE in the engine (`pipeline/statistics.ts`: prints, revisions, rumor news,
  via `obs:*` substreams orthogonal to the economic RNG) because politics reads the
  published headline, not the truth (§3.4 salience). `packages/observation` is
  presentation-only — never grow measurement logic back into it.
- Every behavioral constant lives in `engine/src/constants.ts` — tune there, nowhere else.
- A wall tile fills its slot and clips; it never sizes itself to its content. Use `WallTile`.
  The three ways this goes wrong are all invisible in review AND in jsdom — a `flex-col`
  child missing `min-h-0`, an `h-full` SVG in an auto-height parent falling back to its
  viewBox aspect ratio, a grid band with implicit `auto` rows — so the browser check below
  is not optional.

## Workflows

- Engine change → `pnpm test` breaks golden replays → run `pnpm diff-state` and review what
  moved (that review IS the economics review) → `pnpm bless` if intentional.
- On a `SCHEMA_VERSION` bump, add an entry to `CHANGELOG.md` (human-readable) and
  `docs/metrics-changelog.md` (the engine's inputs/outputs contract — new indicators + their
  `fundedAt`, new levers/params, pipeline-order changes).
- Balance work → `pnpm batch -- --runs 1000 --ticks 120 --policy random` (and
  `--policy passive --ticks 400`). Healthy M5/M6 passive baseline: growth ≈ 2.5%/yr,
  inflation ≈ 0, u ≈ 12.4% century mean — the elevated u is the DESIGNED §8 youth-bulge
  bomb an unschooled do-nothing government earns (funding education absorbs it to ~7%
  and lifts growth past 3%). ~7% deposed by 400q, clustering at the aging endgame
  (median ~q336) — a functioning financial system is a mild stabilizer. Random policy
  120q: ~30% deposed (M6's coups on top of the pre-M6 ~24%; self-inflicted banking crises
  claimed a few more than pre-M5's ~22%), no NaN, no price explosions. M6 deliberately left
  the PASSIVE baseline untouched — if a politics change moves it, the seam has leaked.
- The M1 exit-criteria tests (`tests/properties/fuel-tax.test.ts`, `subsidy.test.ts`) are the
  design's load-bearing claims. If a change breaks them, the change is wrong, not the test.
- `pnpm coverage` runs the suite with v8 coverage over the pure core (engine + observation);
  an 80% floor is enforced (currently ~99% stmts / ~94% branch). It's a floor to prevent
  regression — raise it as coverage grows, never lower it to green a build.
- CI (`.github/workflows/ci.yml`) gates every push/PR on typecheck → lint → coverage → a
  200×120 random-policy batch (which exits non-zero on any NaN or price explosion).

### Adding an indicator

Steps 3–4 are compile-enforced: both tables are total `Record<IndicatorId, …>`, so the UI
will not build until the new indicator has been named and given a dial face. Do them in
order and the tests tell you the rest.

1. `engine`: add to `INDICATOR_IDS` + a spec in `pipeline/statistics.ts` (with its
   `fundedAt` capacity gate). Schema-version event → `CHANGELOG.md` + `metrics-changelog.md`.
2. `observation`: a `PRESENTATION` entry (label + unit).
3. `ui/src/components/labels.ts`: a `NAMES` entry — four names, one per place it appears.
   Keep `short` to 10 characters or the rack truncates it.
4. `ui/src/domains.ts`: an `INDICATOR_FACE` entry. Run **`pnpm ranges`** and take a face
   covering roughly p01–p99, rounded outward; let the extremes peg.
5. `pnpm test`. Three UI tests are now doing real work for you:
   - `wall-plan` fails if the wall has run out of room (and prints the remaining headroom);
   - `gauge-domains` fails if your new face is wrong — it re-measures a surveyed century and
     rejects any instrument that spends >2 % of its life pegged against a rail;
   - `revision-stamp` fails if the fog stopped biting, or started biting everywhere.
6. Verify in the browser at **1280×720** (below), because none of the above sees layout.

### Adding an institution or a bloc

Both id lists are total `Record`s across engine, observation and UI, so the build walks you
through it. The parts that are NOT compile-enforced, and that M6 got wrong first time:

1. `INSTITUTION_IDS` / `BLOC_IDS` in `state/schema.ts`; a stance row in **both** stance tables
   in `actions/apply.ts` (`DIAL_STANCE` for levers, `REFORM_STANCE` for reforms).
2. A bloc needs its POWER derived from the economy in `pipeline/institutions.ts` — never a
   constant — and a `BLOC_FAVOR_BASE` entry **measured** so the 1946 settlement reads neutral.
3. A bloc needs exactly one economic channel for its hostility, through machinery that already
   exists (a risk premium, an investment factor, a wage move). A bloc that only taxes PC is
   set dressing.
4. `ui/src/components/labels.ts`: `BLOC_NAMES` + `BLOC_NOTES`, or `INSTITUTION_NAMES`.
5. Re-measure. `tests/properties/institutions.test.ts` pins the claims; check the passive
   baseline did not move.

### Verifying the wall

`tests/ui/` deliberately tests pure modules, not rendered components — jsdom has no layout
engine, so a render test would have passed happily throughout the entire period the wall was
clipping every figure it published. Real layout gets checked in a real browser. After any
wall change, run the dev server, size to 1280×720, and confirm:

```js
(()=>{const w=document.querySelector('main > div'),b=w.getBoundingClientRect();let n=0;
w.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(r.bottom>b.bottom+1&&r.height>0)n++});
return {scrolls:w.scrollHeight>b.height+1, belowFold:n}})()
```

Both must be `false` / `0`. That one-liner is the whole regression test for the M5.5 bug.

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

## Hard-won politics lessons (M6)

- **Reference-dependence is the house style, and it is load-bearing.** Cohort approval judges
  income against an EMA of itself; bloc favour judges policy against the 1946 settlement
  (`BLOC_FAVOR_BASE`); revolutionary pressure judges hardship against experienced conditions.
  Every one of these was a *bug fix*, not a flourish — absolute thresholds made a do-nothing
  government inherit a capital strike, and pinned unrest so flat that reform windows and revolts
  were both unreachable. If you add a new political response, centre it the same way and
  **measure the resting value** before you pick the constant.
- **A mechanic you cannot reach is not a mechanic.** Before shipping any threshold, measure the
  distribution of the thing it gates under passive, random AND deliberately bad play. Two M6
  mechanics were dead on arrival at plausible-looking numbers.
- **Suppression must cost something the boot cannot pay.** Repression damps grievance
  *multiplicatively* (it can never zero it) and corridor strain is added *outside* that damping.
  Subtract repression linearly and the extractive path becomes strictly dominant.
- **Bloc power is DERIVED, never authored.** It is read off the economy each quarter — that is
  what makes "a crisis is a political opening" fall out for free instead of being scripted.
  What is authored is only what each bloc *wants*: a preference, the same primitive as a
  consumption weight. Pillar 2 forbids scripting what a policy *does*, not knowing that a
  landowner dislikes a land tax.
- **The game never says no.** Blocs make levers expensive, never impossible — matching the
  control rail's existing promise. A veto that hard-blocks would also silently break the M1
  exit-criteria scripts.
- **`pnpm diff-state --moved-only` on any schema-adding change.** New fields sort as infinite
  relative change and bury the economics review the bless workflow depends on.

## Hard-won UI lessons (M5.5)

- **A warning that never turns off is not a warning.** The REVISED stamp fired on any
  revision within six quarters, i.e. ~67 % of instrument-quarters — every gauge, every
  quarter — so the load-bearing §3.4 signal became wallpaper. It now needs TWO gates and
  sits at ~10 %: wrong by more than twice the band the office confessed ON THE FIRST PRINT,
  *and* far enough to visibly move the needle (6 % of the dial). Judging against the
  *current* band cannot work — a final print admits no error at all, so every later
  correction divides by zero and stamps everything. The band-relative gate alone saturates;
  the face-relative gate is what actually discriminates.
- **Anything you want a test to hold has to leave the component.** Every M5.5 bug was a
  layout fact, and layout facts are untestable in the repo's node/jsdom-free setup. The way
  out was not to add a browser to CI, it was to move the *decisions* — the height budget,
  the dial faces, the stamp gate — into pure modules and pin those. Prefer that trade every
  time: a component thin enough to be obviously correct, over a test that fakes a browser.
- **Constants that face the player get calibrated, not guessed, and then pinned as a rate.**
  Both `INDICATOR_FACE` and the stamp thresholds were chosen by sweeping against a measured
  century (`pnpm ranges`, and the sweep in `tests/ui/revision-stamp.test.ts`). Because the
  tests re-measure rather than snapshot, a future engine retune that pushes an instrument
  off its dial fails loudly and names the instrument.
- **Grid/flex children size to their content unless you stop them.** `minmax(0,1fr)` not
  `1fr`; `min-h-0` on every flexing child; `preserveAspectRatio` on every `h-full` SVG.
- Tailwind generates utilities by scanning source *text* — a template-literal class like
  `grid-rows-[${rows}]` produces a class that exists in the DOM and in no stylesheet. It
  fails silently and looks exactly like a layout bug. Spell variants out as literals.
