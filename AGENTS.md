# Terrarium — working notes

Economic policy game. Read `docs/tech-architecture.md` before touching structure.
pnpm monorepo.

The **economy** and the **politics** are separate machines meeting in two places: `institutions`
reads the economy to decide who has power, and the veto players price every action in
`actions/apply.ts`. Keep that seam narrow. The passive century baseline is an economy fact —
if a politics change moves it, the seam has leaked (`pnpm batch --policy passive` is the check).

Docs: `tech-architecture.md` is **what** the code is; `docs/adr/` is **why** (each decision
with the alternatives it beat and the costs it carries); `docs/investigations/` is **what we
measured and don't yet believe** (open questions with evidence attached — read before
re-deriving one); `docs/game-description.md` is the short current design pitch; proposed work
lives in GitHub issues. `docs/archive/` is provenance, not current guidance.

## Skills

Procedures live in `.agents/skills/`, symlinked to `.claude/skills` and `.codex/skills` so
Claude Code and Codex share one copy. Both auto-load them by `description`; **read the skill
before starting one of these tasks** rather than working from this file's summary.

| Skill | For |
|---|---|
| `add-indicator` | a new published metric, or a dial face that has drifted |
| `economics-review` | any engine change: reading the state diff, the baselines, `pnpm bless` |
| `add-bloc-or-institution` | the politics layer — power, favour, veto pricing |
| `terrarium-ui` | anything in `packages/ui` — tokens, the wall, charts, layout contracts |
| `verify-the-wall` | proving a UI change fits, in a real browser at 1280×720 |
| `document-a-decision` | choosing between an ADR, an investigation, and a tuning lesson |

## Hard rules (mostly lint-enforced, but know why)

- `packages/engine` is pure: no DOM, no React, no other workspace packages, no `Math.random`
  or `Date.now`. All randomness via `rngFor(seed, stepName, tick)` substreams.
- `packages/ui` may import types from `@terrarium/observation`, and constants / action & save
  *types* from `@terrarium/engine`, but never `engine/src/state/*`, and never the engine's
  state-running functions (`init`/`step`/`replay`/`applyActions`/`runTick`) outside
  `ui/src/worker/**` — only the worker runs the engine; components see `PublishedState`.
  Enforced at the import boundary (lint) and the data boundary
  (`tests/contract/published-state.test.ts`).
- Pipeline step order in `engine/src/pipeline/pipeline.ts` is versioned; reordering is a
  schema-version event.
- The fog is MADE in the engine (`pipeline/statistics.ts`: prints, revisions, rumor news, via
  `obs:*` substreams orthogonal to the economic RNG) because politics reads the published
  headline, not the truth (ADR-0003). `packages/observation` is presentation-only — never grow
  measurement logic back into it.
- Every behavioral constant lives in `engine/src/constants.ts` — tune there, nowhere else.

## UI

All `packages/ui` work follows the local visual language: diegetic per-instrument maturity,
`dossier-*` / `terminal-*` tokens, the quieter `map-*` / `wire-*` register, and a
single-screen war room with no page scroll at desktop sizes.

The wall is **board + rack + docked**: up to `BOARD_SLOTS` pinned instruments at full size,
then every instrument as a fixed-height strip, then ledger and corridor. Pins are a
`localStorage` view preference, not part of the save. Pure modules own the decisions so they
can be tested — anything pushed into a component becomes untestable:

- **`ui/src/wallPlan.ts`** — the height budget; the wall's minimum height is a NUMBER, pinned
  against 1280×720 by `tests/ui/wall-plan.test.ts`. `rackHeadroom()` says how many more
  indicators fit; at zero the wall needs a real layout decision.
- **`ui/src/domains.ts`** — FIXED per-indicator dial faces, measured with `pnpm ranges`, never
  derived from the trailing window (a face redrawn under its own needle makes needle position
  meaningless). Off-scale pegs at the rail with a chevron — going off the dial is information.
  Only `capital_stock` ratchets, monotonically.
- **`ui/src/components/WallTile/WallTile.tsx`** — **every wall tile goes through it.** A tile
  fills its slot and clips; it never sizes to its content. It owns `overflow-hidden`,
  `minmax(0,1fr)` rows and `min-h-0` on the body. Its module comment lists the four ways this
  breaks, all of which shipped at least once.
- **`ui/src/plot.ts`** — time-series geometry (scales, gridline steps, line/area/ribbon/wedge
  paths), pinned by `tests/ui/plot.test.ts`. **`TimeSeriesChart` in `components/ui` is the one
  painter**: the wall's terminal ticker, the ledger, the accounts, finance and census all go
  through it, and a new figure over time reuses it rather than hand-rolling `sx`/`sy` again.
  A chart scales the record it displays and never accepts a gauge face; semantic anchors such
  as zero come through `include`. Point inspection and snapped drag/keyboard range comparison
  belong here too, so every chart gets them together (ADR-0025).
- **`ui/src/policyRecord.ts`** — the minute book's rule: a change log over `pub.policy` files
  DECISIONS, never consequences. Rates are diffed; appropriations are not, because an indexed
  or GDP-share rule moves its own money every quarter — so they are filed against the engine's
  `SpendingRule.votedAt` stamp instead. Diffing the resolved money would report a policy change
  every quarter for eighty years, and it would look entirely plausible in review.
- **`ui/src/countryDraft.ts`** — the drafting room's arithmetic: the field table is GENERATED
  from the engine's id lists (a hand-typed path silently addresses nothing), and every rail
  mirrors `validateCountryParams` exactly. A slider whose own maximum produces a document the
  engine refuses is invisible in review AND in jsdom — `tests/ui/country-draft.test.ts` drives
  every field to both ends and re-inits. A new sector or institution joins the editor for free.
- **`ui/src/saveFile.ts`** — whether a save this browser is holding can still be opened. The
  gate is the ENGINE'S verdict, not the schema stamp: a save carries no TrueState, so most
  bumps leave old saves loadable and refusing everything below `SCHEMA_VERSION` would bin runs
  that would have opened. So the worker attempts the load, commits nothing until the whole
  replay succeeds, and turns a refusal into a sentence (`loadFailed` → `loadError` → the
  posting room's notice). Never repair a vector to make it load: filling a field it predates
  opens *a* country, not *the* one that was saved. This exists because an autosave written
  before the `education` capacity held the splash screen forever with the reason in the console.
- **`ui/src/shares.ts`** — pie and stacked-band geometry, pinned by `tests/ui/shares.test.ts`.
  `DonutChart` / `StackedAreaChart` (in `components/ui`) paint what it returns and know nothing
  about budgets: reuse them rather than hand-rolling a chart. Pure for the usual reason — a
  wedge that emits `NaN` into its path draws nothing, which in review is indistinguishable from
  a category with no money in it. `SHARE_INKS` stops at six, the widest split the books have;
  bucket a tail into "other" rather than extend the ramp. The label/ink tables in
  `panels/LedgerOverlay.tsx` are total `Record`s over the engine's id lists, so a new tax or
  spending line fails the build until it has been named and given an ink.
- **`ui/src/industry.ts`** — the industrial census read for the page: GDP down the PRODUCTION
  side, the composition twin of `accounts.ts`. Its shares are taken against the CENSUS's own
  total, never the GDP headline — the two come from different releases with different survey
  error, and dividing one by the other imports a fog it never had. `SECTOR_FACE` is a total
  `Record` over `SECTOR_IDS`, so a sixth sector fails the build until named and inked.

- **`ui/src/census.ts`** — the DEMOGRAPHIC census read, and the counterweight to the fog: heads
  are countable without a statistical office, so the head count, its year-on-year growth rate,
  the age structure and the median age are all EXACT. Population growth is deliberately not an
  indicator — it is a ratio of two numbers the state can count, so giving it a lag, a band and a
  revision would invent fog for a figure that has none. Measured across the catalogue, growth
  spans −0.84 to +2.11 %/yr, so it goes NEGATIVE and every chart of it must carry zero on the
  axis or a shrinking country draws the same as a stagnant one. `populationGrowth` indexes the
  record BY TICK rather than by position: the census is written one entry per quarter today, so
  a positional `k − 4` agrees — right up until something filters the record on the way to the
  page, after which it measures a different span and prints a plausible wrong number.

- **`ui/src/finance.ts`** — why a banking crisis happens, made legible. The hazard is a
  PRODUCT of two excesses (`max(0, leverage − CRISIS_LEVERAGE_SAFE) × max(0, q −
  CRISIS_ASSET_SAFE)`), so EITHER ONE ALONE IS HARMLESS — measured, a century of maximum asset
  purchases under a prudent bank-capital floor sits at a median valuation of 1.43 and never
  becomes fragile, because the floor keeps leverage down. Two time charts side by side cannot
  say that, which is why `PhaseChart` plots the two against each other with the corner shaded
  (ADR-0026). Both rails are imported from the engine, never copied. The module returns `null`
  rather than `0` for an unfunded survey throughout: a fragility reading that quietly returns
  zero because nobody built a bank supervisor is indistinguishable, in review, from a country
  that is genuinely safe. Crisis episodes are read off `NewsItem.kind` — matching the wire's
  PROSE put every crisis marker one copy-edit from vanishing, and a chart with no markers looks
  exactly like a century with no crises.

- **`ui/src/manual.ts`** and **`ui/src/levers.ts`** — the ministry handbook (ADR-0024). Every
  chapter that LISTS something the game has is generated from the engine's id lists — levers
  from `LEVER_GROUPS`/`LEVER_COPY`, instruments from `INDICATOR_IDS` sorted by
  `INDICATOR_FUNDED_AT`, blocs/classes/rules/appointments from their own tables — so a new one
  is documented the quarter it ships, and cannot ship unnamed. Only prose about MECHANISM is
  authored. `levers.ts` is where a dial's WORDS live; `ControlRail` keeps only the slider's
  arithmetic — and a lever names its own cabinet drawer there, so the drawers are ASSEMBLED and
  a new `DialPath` cannot compile without a home. The one list the manual copies by hand is the
  tick order (`TICK_ORDER` is across the import boundary); `tests/ui/manual.test.ts` crosses it
  and fails by name when a pipeline step moves.
- **`ui/src/walkthrough.ts`** — the opening tour's six cards. A card must never sit on the side
  of the screen its own subject is on (pinned by `tests/ui/walkthrough.test.ts`, and again in
  the browser by the `walkthrough-wall` visual test) — a tour card covering the thing it points
  at is invisible in review AND in jsdom. The highlight is a stylesheet rule keyed off
  `data-tour-active` on `<body>`; that attribute is deliberately named differently from the
  regions' `data-tour`, because one name for both makes `[data-tour="wall"]` select the body too
  and every measurement of the region silently becomes a measurement of the document.

Import shared primitives from `components/ui`, never by reaching into a folder.

Layout bugs here are invisible in review AND in jsdom, and Tailwind scans source *text* — so a
template-literal class (`grid-rows-[${rows}]`) exists in the DOM and in no stylesheet, failing
silently. Spell variants out as literals. **`terrarium-ui` skill** has the full contract;
**`verify-the-wall` skill** is how you prove it, and it is not optional.

## Workflows

- Engine change or balance work → **`economics-review` skill**. `pnpm bless` overwrites the
  goldens with whatever the engine now produces and cannot tell an improvement from a broken
  economy, so the diff review IS the economics review (ADR-0008). The skill carries the passive
  and random-policy baselines; keep them there rather than copying them back here.
- On a `SCHEMA_VERSION` bump, add an entry to `docs/metrics-changelog.md` (the engine's
  inputs/outputs contract — new indicators + their `fundedAt`, new levers/params,
  pipeline-order changes).
- The load-bearing mechanism tests (`tests/properties/fuel-tax.test.ts`, `subsidy.test.ts`) are the
  design's load-bearing claims. If a change breaks them, the change is wrong, not the test.
- `pnpm coverage` enforces an 80% floor over the pure core (currently ~99% stmts / ~90%
  branch). It's a floor to prevent regression — raise it, never lower it to green a build.
- CI gates every push/PR on typecheck → lint → coverage → a 200×120 random-policy batch.
- **Two TypeScripts on purpose** (ADR-0009): `tsc` is TS 7 (native, ~7× faster) via the
  `@typescript/native` alias, while the dependency literally named `typescript` is the TS 6
  API that `typescript-eslint` needs — it throws on TS 7 rather than degrading. Don't
  "fix" the alias; collapse it when typescript-eslint ships TS 7 support.

### Authored countries and the drafting room (ADR-0019)

The posting room's lower band opens `DraftingRoom`. A player-written country is an ordinary
`CountryParams` vector — a save has always embedded the materialized vector, so hand-editing an
exported save already worked; this only gave it a format. Three things not to undo:

- **The document stores `ageShape`, never the pyramid.** `countryFromDocument` rebuilds it with
  the catalogue's own `pyramidFor`, so the round-trip must be exact — pinned by a state hash
  after a century, not a field comparison.
- **`materializeStructure` is an exact economic no-op**, and `reweight` short-circuits a uniform
  mix for that reason: `base * before / after` with `before === after` is x ± 1 ulp, and one ulp
  of employment compounds into a visibly different century. Opening Meridia as a draft must give
  back Meridia.
- **The study issues no verdict.** 400 vectors sampled across the validator's whole legal box
  gave zero NaN and nine slow price drifts past the tripwire (median q95), and passive deposition
  does not track the curated difficulty labels — so it reports against a live reference country
  instead of grading. Its metrics are COPIED from `packages/runner`;
  `tests/ui/trial.test.ts` pins the two against each other, and without it the study stops being
  comparable with the published matrix.

### The rules of a run (ADR-0020)

`meta.rules` is a total record of independent booleans (`GAME_RULE_IDS`), chosen in the posting
room's STANDING ORDERS and sealed into the save — never a UI preference, because each changes
what the same country, seed, and action log produce. Today: `protectedTenure` (the old god
mode), `fullInstrumentation` (#59), `unlimitedCapital` (#91). A fourth is one id, one branch,
one row — but three things are load-bearing:

- **A rule must be inert when it is off**, and `pnpm diff-state --moved-only` is the proof.
  All three together moved nothing but `meta.schemaVersion`. A safety whose absence moves the
  economy is a balance change hiding behind a switch.
- **A rule lifts exactly one constraint.** `fullInstrumentation` lifts the funding gate in
  `printsDue` and leaves lag, noise, and revisions to capacity — hand over the instrument, not
  the truth, or the sandbox becomes the truth inspector and politics starts reading it.
  `unlimitedCapital` returns early from `spendPc` only; `politicalCostOfAction` still quotes
  every order and the blocs still spend favour.
- **The UI has to read the rule wherever it derives access, not just where data arrives.**
  `maturity.ts` was the miss: for the first two quarters of a fitted run nothing has returned
  yet, so the wall called 29 instruments UNFITTED and told the player to fund surveys they
  already had. `RULE_COPY` in `ui/src/gameRules.ts` is a total `Record`, so a new rule fails the
  build until the posting room can explain it.

### The year you take office (ADR-0021)

`meta.appointedAt` is the quarter the PLAYER takes office — a replay input sealed into the save
beside `meta.rules`, zero on every ordinary 1946 posting and on every save written before v28.
The posting room offers 1946 / 1973 / 1995 / 2005 (`APPOINTMENTS`), each a `FRONTIER_ERAS`
boundary; any quarter is legal to the engine.

The quarters before it are an **interregnum** governed by a caretaker in the ordinary
`applyActions → step` loop, and **its orders go into the save's action log** — so a later
posting replays with no policy code at load time, and a retune of `CARETAKER_*` cannot rewrite
the country an existing save inherited (ADR-0011's argument). Four things are load-bearing:

- **A passive interregnum is not neutral, it is broken.** It arrives at the 1946 statistical
  office and puts 3 of 29 instruments on the wall. The caretaker exists to build the ministries;
  everything else it does (holding the opening appropriations at their GDP share) is there so
  the fiscal inheritance is not identically empty. It sets no rate and moves no tax.
- **Inert at zero, and the golden diff is the proof** — `pnpm diff-state --moved-only` reported
  `meta.schemaVersion` and nothing else, and the passive century re-measured at 2.68 %/yr,
  11.85 % unemployment. Every condition reads `tick < appointedAt` or `tick >= appointedAt`,
  which at zero is the expression that was already there.
- **The record opens when the player does.** Welfare, corridor and governed quarters accumulate
  from `appointedAt`, so `baselineWelfare` is the standard of living they inherited and
  `quartersGoverned` is their own tenure. A card that graded the caretaker's twenty-seven years
  would be discounted so heavily the player's own century barely registered.
- **The political clock is stopped during the interregnum**, and the caretaker is not charged
  political capital — charging a stock that cannot refill would make the inheritance a function
  of how the opening twenty points fell rather than of the country. Orders are still quoted and
  the blocs still spend favour, so the politics handed over is the one its programme earned.
  Which is why the two bounds on an appointment are load-bearing rather than defensive:
  `appointmentTick` clamps to `LAST_APPOINTMENT_TICK` (one short of the close, or the run banks
  no baseline and can never end), and `replayWindow` refuses a save that stopped *before* its own
  appointment (or the interregnum is handed over as a playable game with free orders).

What each appointment actually hands over is MEASURED — `pnpm inheritance`, tabulated in
`docs/country-scenarios.md`. Re-measure before changing `CARETAKER_CAPACITY_SPEND` or `_EVERY`.

**The invariant that keeps all of it honest: the appointment decides who is SCORED for a
quarter, never what the country did in it.** `tests/properties/interregnum.test.ts` replays the
caretaker's own orders from a 1946 appointment and demands the same demography, the same GDP and
the same capacities. It exists because the first version of this gated `livingStandard` on
`score.baselineWelfare` — which is the report card's anchor, not the vital rates' — so a 1973
interregnum ran its entire 27 years at a constant income level: no demographic transition, births
at 35.3 per 1000 against 26.0, populations up to 7% too large, and a measured table that looked
entirely plausible. That is the "don't conflate the two anchors" rule in the tuning lessons
below, and a scoring gate is a new way to break it.

### The statute book (ADR-0027)

`gov.statutes` is a total record over `STATUTE_IDS` — a fourth register of policy, between the
dials and the constitution. Each entry holds a LEVEL on a short named ladder (`STATUTE_LEVELS`)
and the quarter it was written, and nothing else. Everything else is derived.

Three rules govern it and all three are load-bearing:

- **Read `statuteForce`, never `gov.statutes`.** What the economy is subject to is the posted
  strength × `statuteCompliance` × phase-in. Reading the record directly is reading the
  announcement instead of the effect, which is the mistake the register exists to prevent.
  Compliance is the third instance of a gap the engine already models twice — after
  `taxEfficiency` (a posted rate is not collected revenue) and `adminEffectiveness` (a voted
  appropriation is not delivered money) — and the party evading it has a name, because it is
  one of the four blocs, read off the same `STATUTE_STANCE` table that priced the enactment.
- **One statute, one channel, named in its own comment.** `competition` → `eliteCapture`;
  `compulsory_schooling` → one fact (who is in a classroom) with two readers, `laborForce` and
  the human-capital target; `minimum_wage` → a floor under `market.wages`. No effect arrows, and
  no disemployment term — the minimum wage costs jobs only through cost → price → demand, which
  it measurably does (up to 1.4 points).
- **A statute is inert until enacted, and `pnpm diff-state --moved-only` is the proof.** All
  three wired, no golden moves; passive 400q is unchanged at 2.81 %/yr, 12.23 % unemployment.

Compliance is published EXACTLY, because every input to it already is — admin capacity, courts,
bloc power and favour are all unfogged. That equivalence is the boundary: a compliance term that
read unpublished state would have to become an inspectorate survey with a lag and a band.
Compliance must also never enter `ui/src/policyRecord.ts`: the minute book files DECISIONS, and
a figure that drifts every quarter would report a policy change every quarter for eighty years.

`pnpm batch --policy regulated` is the statute book's baseline, and it is read against
`developmental` — the two differ by nothing else. Do not read it as growth: two of the three
statutes cost output on purpose. The result worth knowing is that Costona's deposition rate falls
from 62% to 41%, because the minimum wage compresses its income distribution and lower inequality
reaches unrest and approval through channels that were already there.

Adding a statute is a `SCHEMA_VERSION` event (a `meta`-only diff, cheap to bless), so add them in
batches — and never pre-declare an id for a statute wired to nothing, which puts a lever on the
desk that does not work.

### The environment (ADR-0028)

`environment.pollution` is a per-head burden index, standard 1946 country = 1, produced by the
`environment` step after `production` and seeded by `init` at its opening equilibrium. Four rules:

- **Nothing reads the burden where it is made.** Damage arrives through the mortality schedule in
  `demography` and the drought hazard in `shocks` — the latter reusing the ENTIRE drought response
  rather than modelling harm twice. There is no term anywhere subtracting pollution from output,
  and adding one is the effect arrow the engine exists to refuse.
- **Both damage terms read the excess over `environment.baseline`** — the burden this country
  INHERITED, sealed at init — not over the standard country's 1.0. The catalogue opens between
  0.62 (agrarian Costona) and 1.57 (industrial Veltravia), so a global threshold charged Veltravia
  excess mortality and a 12 % higher drought hazard in 1946Q1 for the authored structure of its
  recipe. That shipped, and it was invisible in the passive baseline **because that baseline is
  measured on Meridia, which IS the reference country and opens at exactly 1.0** — the one country
  where the bug could not show. Measured cost of the bug: Oranga deposed 36 % against 24 % once
  fixed. **The passive/developmental split is the calibration test** — if a retune moves passive,
  the burden has become a tax on existence rather than a cost of development.
- **Per head, not absolute.** Land is not modelled, so a tonnage would make a big country dirtier
  by being big, and mortality responds to what people breathe. Per head it follows income and
  industrial structure, which is the Kuznets shape arrived at rather than authored.
- **The goldens cannot see this.** They moved 3540 values and every one by 0.00 %, because 40
  quarters cannot see a stock with a seventeen-year half-life. Use `pnpm batch`, not `pnpm bless`,
  as the evidence for anything you change here.

The damage channels run EARLIER in the tick than the step that produces emissions, which is
correct rather than a bug: they read the burden accumulated up to the start of the quarter.

### Adding an indicator

→ **`add-indicator` skill.** Six tables must agree; five are total `Record`s the compiler
checks, but `INDICATOR_SPECS` is an **array**, so a missing spec compiles clean and the
instrument simply never publishes.

Not every fogged output is an indicator. The **industrial census** (schema 31,
`PublishedState.industry`) is value added and employment by sector, published on the office's
ordinary clock but as a VECTOR: five sectors × two tables is ten dials against six rack strips
of headroom, and a sector share has no honest fixed dial face (ADR-0006) when the catalogue
opens countries anywhere between 5% and 60% agricultural. It reuses `lagFor` / `noiseScale` /
`REVISION_DELAYS` in `statistics.ts` rather than owning a second measurement model — same
office, same fog — and each sector is drawn INDEPENDENTLY, so the published parts do not sum
to the published GDP. It carries ONE BAND PER TABLE (`errorBand` is a `Record` over
`INDUSTRY_TABLE_IDS`), read from the same constant that draws the noise: heads are counted
better than output is estimated, and a single band would have the office confessing an error
the jobs survey never made. The overlay indexes the table and its band with the same lens key,
so it cannot show one table's figures beside the other's uncertainty. The worksheet behind them does: `sectorValueAdded` is
`output × (1 − Σᵢ coeff[i][j])`, the same arithmetic `production` sums for the headline, at
BASE prices so a commodity boom cannot make an industry look larger. Reach for this shape when
the thing you want to publish is a composition rather than a number.

### The dev console (ADR-0010)

Backtick opens it in `pnpm dev`. Two tabs:

- **SCENARIO** — seed, year, development, population scale, openness, starting capacities →
  runs a real game to that year. Reaching 1975 with a well-surveyed country is one submission
  instead of 116 clicks. Raise `statistical` to fit every instrument at once. There is no
  "set GDP": state is derived from (params, seed, log), so you specify a country and let it
  live. The logic is pure in `ui/src/devScenario.ts` — tested, not in the component.
- **TRUTH** — what the fog is hiding, beside what the wall published. Arrives as an anonymous
  tree (`DevNode`), so the UI still cannot *name* a true-state field.

Gate anything that must never ship on **`__DEV_TOOLS__`**, never `import.meta.env.DEV` — the
latter derives from ambient `NODE_ENV`, so `NODE_ENV=test pnpm build` ships the true-state
serializer, and `--mode production` does not save you. `tests/ui/dev-build-strip.test.ts`
builds the bundle and greps it; if that test goes, the guarantee goes with it.

### Verifying the wall

→ **`verify-the-wall` skill.** `tests/ui/` tests pure modules, not rendered components: jsdom
has no layout engine, so a render test passes happily while the wall clips every figure it
publishes. The dev server at 1280×720 is the only thing that sees layout.

### Adding an institution or a bloc

→ **`add-bloc-or-institution` skill.** The id lists are total `Record`s and the build walks you
through most of it — but `Stance` is a **`Partial`** over `BlocId`, so a new bloc compiles
perfectly with no opinion about anything in the game. The first politics implementation missed it.

## Hard-won tuning lessons (violate at your peril)

- Unit costs in the price step are computed at NORMAL_UTILIZATION, not realized output —
  otherwise demand dips mechanically raise unit cost and spiral (stagflation death loop).
- Wages need all three legs: Phillips slack anchor (else drift to 50% unemployment),
  productivity passthrough near full employment (else permanent deflation), downward
  stickiness (else 1870s-depth busts).
- Households spend against EMA "habitual" income (the same EMA approval judges against) —
  permanent-income smoothing is the main cycle damper. The wage/employment gains were lowered
  until the business cycle stopped resonating with the 16-quarter election period.
- Bond coupons are household income; redemptions go to household savings. Money paid to
  bondholders must not vanish, or every tax rise becomes an austerity bomb.
- **A sentinel is not a semantics.** `livingStandard` bootstrapped on
  `score.baselineWelfare === null`, which meant "no quarter has booked yet" only because scoring
  began at tick zero. ADR-0021 moved scoring to the appointment and the proxy silently became
  "the player has not arrived", switching the income channel off for a whole interregnum. When a
  field is read as a proxy for something else, say which, and gate on the real thing (here, the
  tick). Vital rates and the report card read the same consumption for different reasons.
- Growth needs both valves: Lewis investment (`INVESTMENT_SLACK_GAIN`) and the subsistence
  valve (`SUBSISTENCE_ABSORPTION_Q`, capped by the rural labor force — uncapped it recreates
  the Malthusian trap). Vital rates read the income LEVEL (`LIVING_STANDARD_1946`), the report
  card reads income vs your own 1946 — don't conflate the two anchors.
- Init self-calibrates spending to the tax base (`init.ts`) — an unbalanced opening budget
  compounds into a scripted depression.
- Finance is a loop that WANTS to ratchet (assets↑ → collateral↑ → credit↑ → assets↑). Two
  rules keep it a cycle: `ASSET_REVERT` must out-muscle the collateral/spirits feedback at the
  margin (else a passive economy spontaneously bubbles), and the passive-calm vs active-boom
  separation is carried by the real-rate channel (`ASSET_FUND_RATE_GAIN` / `CREDIT_RATE_GAIN`)
  — only a policy rate cut or a genuine profit surge inflates a bubble. The crisis a player
  gets is the one their own cheap money earned. The bank-capital cap is deliberately SLACK in
  booms at the inherited 6% floor and bites after a crisis writes capital down — that IS the
  forced deleveraging. The player can now raise the floor until it binds before the crash; do
  not retune bank capital so every requirement is slack, or the macroprudential lever is dead.
- **Crowding out is a funding price, not a forced outcome sign.** The private rate reads last
  quarter's bond issuance (deficit minus printing), softened by openness, plus part of the
  sovereign premium. Charging the gross deficit double-counts printed money; charging only the
  debt stock misses moderate auctions. A spending boom can still lift investment through demand
  and inflation, so calibrate this channel with a demand-neutral tax deficit and an isolated debt
  shock as well as the headline spending cases.
- **A stability policy is not automatically a fiscal baseline.** The runner's `developmental`
  policy isolates capacity building while leaving 1946 programmes and ministry bids fixed in
  cash. Tax collection rises and programme shares erode, so it retires the opening debt around
  quarter 62 and then sticks at zero. Use `pnpm debt-baselines` and its no-tax/GDP-share
  counterfactuals before treating final debt/GDP as a calibration target.
- **Political responses are reference-dependent, and it is load-bearing.** Cohort approval
  judges income against an EMA of itself; bloc favour judges policy against the 1946 settlement
  (`BLOC_FAVOR_BASE`); unrest judges hardship against experienced conditions. Each was a *bug
  fix*: absolute thresholds made a do-nothing government inherit a capital strike, and pinned
  unrest so flat that reform windows and revolts were both unreachable. Centre any new
  political response the same way and **measure the resting value** before picking the constant.
- **Migration is an outside-option flow, not a population target.** Compare domestic welfare
  progress from the inherited 1946 anchor with a frontier-linked alternative; an absolute income
  threshold makes rich recipes win before the first turn and poor ones lose forever. That anchor
  is not `score.baselineWelfare`: ADR-0021 moves the score baseline with the appointment, while
  migration must keep the 1946 comparison or the same caretaker orders produce a different
  population. The border ceiling clips arrivals only — scaling negative flows by it lets a closed
  border imprison a failing country. Calibrate the sign and the cap under passive, developmental,
  random, and all-country runs; pin per-capita as well as aggregate growth once labor supply moves.
- **A mechanic you cannot reach is not a mechanic.** Before shipping a threshold, measure the
  distribution of the thing it gates under passive, random AND deliberately bad play. Two early
  mechanics were dead on arrival at plausible-looking numbers. Unrest also has to read the
  hardship households *experienced* (cohort approval already aggregates it) — rebuilt from
  unemployment it was wrong-signed, because the subsistence valve keeps the impoverished
  nominally employed.
- **Suppression must cost something the boot cannot pay.** Repression damps grievance
  *multiplicatively* (never to zero) and corridor strain is added *outside* that damping.
  Subtract it linearly and the extractive path becomes strictly dominant.
- **Bloc power is DERIVED, never authored** — that is what makes "a crisis is a political
  opening" fall out for free. What is authored is only what each bloc *wants*: a preference,
  the same primitive as a consumption weight. And blocs make levers expensive, never
  impossible — a hard veto would silently break the load-bearing mechanism scripts.
- **`politicalCostOfAction` is the single source of truth for what an order costs.** Quote and
  charge must never be computed twice; `observe.ts` publishes reform prices straight from it.
- **`pnpm diff-state --moved-only` on any schema-adding change.** New fields sort as infinite
  relative change and bury the economics review the bless workflow depends on.
- **A warning that never turns off is not a warning.** The REVISED stamp once fired on ~67% of
  instrument-quarters. It now needs two gates (~10%): wrong by more than twice the band
  confessed ON THE FIRST PRINT, *and* far enough to visibly move the needle (6% of the dial).
  Judging against the *current* band cannot work — a final print admits no error, so every
  later correction divides by zero.
- Player-facing constants get calibrated, not guessed, and pinned as a rate against a measured
  century (`pnpm ranges`, the sweep in `tests/ui/revision-stamp.test.ts`). The tests re-measure
  rather than snapshot, so a retune that pushes an instrument off its dial fails by name.
- **Shock smoothing is not automatically stabilization.** A four-quarter geometric drought
  recovery (`815a0aa`) lowered some inflation peaks but deepened passive deflation and rebound
  growth, widened quiet tails, and reduced developmental 2050 survival. Any shock retune must
  pass all three views: event response, onset-plus-eight-quarter-excluded tails, and century
  trend/survival. The rejected A/B remains executable in
  `tests/unit/drought-recovery-experiment.test.ts`; see investigation 0005.
- **`gauge-domains` catches a face that is too NARROW, never one that is too wide.** It fails on
  pegging, and a needle parked against the left rail without crossing it is not pegged — which is
  how `government_demand_share` shipped a 0–20 face for a series that lived at 1–3 %. Read the
  `pnpm ranges` percentiles when you add a face; a passing test is not evidence the dial is
  legible.
- **A dial-fit survey must cover the whole funded century.** `gdp_per_capita` and
  `consumption_per_capita` stayed inside their faces through 2006, then spent roughly 4% of a
  capacity-building century pegged while the old 240-quarter test stayed green. The coverage
  test now runs 400 quarters with a policy that funds every survey; shortening it or using
  passive play makes late, high-capacity instruments disappear from the evidence.
- **A ratio to a moving target saturates, and a saturated dial is a silent one.**
  `technology_attainment` is attainment ÷ frontier, and research pushes the frontier — so the
  better the programme, the harder its own dial is to move. Measured: a maximum research
  programme moves it ten points in its first decade and four in the eighty years after, while
  output per worker triples. That is why `productivity` exists beside it. When an indicator
  divides by something the player can change, check it still moves at the top of the range.
- **An aggregate index can fall while every component of it rises.** `technologyAttainment` is
  output-weighted, and growth shifts output toward services — the sector Baumol keeps furthest
  from its frontier. So funding research can lower the index it is supposed to raise. Assert
  policy claims per sector; the composition effect belongs to the measure, not the policy.
- **Preserve the expectation when you make a mechanic stochastic.** Breakthroughs are a hazard
  process whose `hazard × size` equals the deterministic term they replaced, so the calibrated
  century survives and only any single century became a gamble. The corollary is a test
  discipline: a claim about a lumpy mechanic has to be asserted over seeds, never one run.
- **Research is a stock, and that is what makes a research programme political.** Money enters
  `tech.researchStock` and decays; gains read the stock, not the cheque. A steady programme is
  arithmetically identical to the old flow model — only the transients moved — which is how a
  behavioural change ships without a recalibration.
- **A dial pegs; a chart owns an analytical scale.** Pegging costs a needle one number for one
  quarter and says so with a chevron. The same rule applied to a TRACE erases a whole episode
  silently — the terminal chart clamped into the dial face, so a hyperinflation and a calm
  plateau drew as the same flat line along the rail. Framing the trace against that face fixed
  the clamp but added a DIAL LIMIT that looked like a chart constraint and flattened quiet
  windows. A chart has printed axis numbers, so scale the displayed record, include only real
  semantic anchors such as zero, and never import `INDICATOR_FACE` (ADR-0025). Range comparison
  snaps to published points and reports gaps as elapsed time rather than inventing observations.
- **Precision belongs to the scale, not the value.** `v => v.toFixed(v < 10 ? 1 : 0)` prints an
  axis reading `0.0, 20, 40`, which looks like three different quantities. Decide decimals once
  per axis from the gridline step (`axisDecimals`). The same trap in reverse: rounding a range
  to a readable step can leave ONE label on the axis, and a chart with a single number up its
  side gives no scale at all — `niceTicks` refines the step until at least two fit.
- **The basket is calibrated to the country it opens in, and that is what makes it inert**
  (ADR-0030). `cohort.consumptionWeights` is the authored recipe; `effectiveConsumptionWeights` is
  what the economy spends, and every reader goes through it — the `statuteForce` rule again. The
  income term reads each cohort's own sealed 1946 standard, so every country opens on its recipe
  and answers only to growth from there; the price term is neutral because prices open at 1. Both
  exponents are zero at their neutral constants, which is how the mechanism shipped moving
  `meta.schemaVersion` and nothing else, and then got calibrated under its own review.
- **A seeded EMA must be seeded on the basis the step recomputes it on.** `init` seeded
  `lastRealIncome` GROSS while `cohorts.run` computes it after income tax, so the habit walked down
  a 3–9% basis change for its first years — and only for the cohorts that earn wages, so the
  poorest inherited a standard of living they had never had and the richest inherited a correct
  one. Invisible for as long as it was only a smoothing term; load-bearing the moment ADR-0030
  sealed `engelReference` from it. The `0.99` beside it was already an attempt to absorb this and
  was an order of magnitude too small.
- **Only a country that develops pays for the income response, and passive is the check.** Fixing
  the falling service share cost 15% developmental deposition against 9%, and left passive at 7%
  and 2.84 %/yr — a do-nothing country never gets rich enough for the term to bite. Same shape as
  the pollution baseline. If a retune moves passive, the basket has become a tax on existence.
- **What it costs is inequality, and the cause is a supply-side gap.** Services are staffed 60% by
  professionals, agriculture entirely by rural workers, and the class transition moves people
  rural → urban and nowhere else — so demand shifting toward services raises the RETURN to being a
  professional and never the NUMBER of them (Gini +5.8 points by 2046). The cost scales with
  `ENGEL_ELASTICITY.services` and is insensitive to agriculture's, which is why it stops at 0.32
  and the service share stops flat rather than rising. `docs/investigations/0015` has the cost
  curve any fix has to reproduce.
- **A price elasticity in the basket does not reach the industrial census — measured, not assumed.**
  CES was implemented and swept over σ ∈ {1, 1.5, 2, 3}: the basket's response to a 25% price fall
  rises monotonically (+6.1% → +10.3%) and the value-added share does not follow (+3.02 → +2.82
  points), because household consumption is one part of final demand and a cheap sector is an input
  to every other sector. `HOUSEHOLD_SUBSTITUTION` ships at 1 for that reason. **What actually binds
  is that a deficit-financed subsidy RAISES the price it was meant to lower** — +3.4% on
  agriculture, +12.9% on services — because the money lands in profits and the demand outweighs
  the unit-cost relief; tax-funded, the same subsidy takes 21–33% off the price. Point the next
  steerability attempt at the financing or at capital allocation, not at an elasticity.
  `docs/investigations/0016`.
- **A mechanism test and a baseline sweep measure different things, and a statute is where
  they diverge most.** `tests/properties/statutes.test.ts` protects tenure and funds the
  cabinet, deliberately, so that what it measures is the CHANNEL — and it reports the
  competition act as +16% of Costona's real GDP over 160 quarters. `pnpm batch --policy
  regulated` reports nearer 0.05 pp/yr against `developmental`. Both are right. The sweep
  truncates at deposition (Costona deposes 62% of governments), climbs the ladder only as
  capital allows, and annualizes over a century in which everyone converges on the frontier
  anyway. Quote the sweep when asked what a lever is worth in play; quote the mechanism test
  when asked whether the channel works.
- **A lenient experiment must never be lenient about the thing under test.** Skipping a
  capacity order that a full ministry refuses is fine — the runner does it. Skipping the
  ENACTMENT is how an experiment lies: a deposed cabinet cannot give orders, so on a hard
  country the statute silently never happens, `statuteForce` reads 0.000, and the two arms come
  out identical to the last decimal. In a results table that reads as "the statute does
  nothing" rather than "the statute never happened". Two of the first six seeds did exactly
  this. The same trap caught the first `regulatedPolicy`: a top-rung enactment is priced near
  23 PC against the ~11 a capacity-building government holds, so two of three orders were
  refused as unaffordable and the "regulated" century was developmental to two decimals.
- **A lever that moves a PRICE gets undone; a lever that moves a STOCK compounds.** Cutting the
  corporate tax to zero is worth +12.9 to +19.1 % of the foreign-investment inflow in the quarter
  it lands and **+0.2 % over a century**, because `returnFactor` reads the after-tax profit SHARE
  and a profit share is competed straight back down — while the forgone revenue leaves the country
  5.5 % short of capital, so the cut buys more foreign ownership of a smaller economy. Building
  the administrative ministry is worth +15.6 % on the margin and +29.8 % over the same century,
  because a capacity is a stock nothing arbitrages away. The two rankings are in OPPOSITE ORDER,
  so measure a new lever at both horizons before quoting either. The same study's sharpest
  reading is that building all four ministries raises FDI a third as much as building only
  administration, because a capable tax office collects the corporate rate that was
  posted-but-uncollected and hands the difference to the same term — state-building is not
  monotone in every channel. `docs/investigations/0017`, `pnpm fdi`.
- **Give components of one identity RELATIVE noise, not one absolute band.** The expenditure
  shares span two orders of magnitude (consumption ~78 %, government <1 %), so a band honest
  about the big one prints the small ones negative — and a share below zero cannot be drawn as a
  wedge at all (`donutSlices` drops it). See `docs/investigations/0002`.
