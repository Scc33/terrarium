---
name: add-an-event
description: Add a dispatch to Terrarium's news wire, give an existing one an era-specific voice, or change what the news desk reports. Use when touching engine/src/events/, EVENT_IDS, the catalogue, CONDITION_RULES, the press eras, or the newspaper in ui/src/newspaper.ts. Covers the two kinds of event, the no-figures rule the fog depends on, and why a threshold here has to be measured before it ships.
---

# Adding an event

The wire is a newspaper (ADR-0031). A pipeline step names an event; `events/catalogue.ts`
words it. Keep that seam and adding a dispatch is a table edit; break it and a copy-edit moves
the economy.

## The two kinds

**A hard event is a fact that happened.** A drought began, a bank failed, a law was signed.
Raised where the fact is produced, always files, never budgeted away.

```ts
// in the pipeline step that produced the fact
news.push(fileDispatch(state, 'drought_onset'))
```

**A condition report is a reading of the country.** Nothing "happens" when unemployment has
been high for two years — somebody has to look. Declared in `CONDITION_RULES`, budgeted and
cooled by the desk in `events/conditions.ts`.

```ts
{ event: 'factory_gates_idle', cls: 'report', salience: 7, when: (c) => c.now.unemployment > 0.13 }
```

A third class, `colour`, is era-gated filler that runs only when the page would otherwise be
thin. A fourth, `milestone`, is a line crossed once in a century; it always files.

**Never wire an event both ways.** `tests/properties/events.test.ts` fails on it — a condition
rule for an event a step also raises files it twice and reports a fact as a rumour.

## The steps

1. **Name it** in `EVENT_IDS` (`engine/src/events/ids.ts`). The build now fails.
2. **Word it** in `EVENT_CATALOGUE`: `kind`, `desk`, `tone`, `prominence`, and at least one
   `{ headline, body }`. The body is a standfirst — two sentences of what a reader of the day
   was told, not an explanation of the mechanism. The manual does mechanism, and it is
   generated.
3. **Raise it** — `fileDispatch` at the call site, or a rule in `CONDITION_RULES`.
4. **Measure it**: `pnpm events`. Your event must not be in the UNREACHED list.
5. `pnpm test`, then the economics review below.

Giving an existing event a period voice is smaller: one `byEra` block, inherited forward by
every later age.

```ts
byEra: { crisis: [{ headline: 'Oil crisis: the pumps run dry', body: '…' }] }
```

## Three rules that are load-bearing

**No dispatch may contain a figure.** Not a digit, anywhere, ever — and not a figure spelled out
in words either, which the digit-grep cannot catch. A milestone over EXACT state (heads, where
they sleep) may say what it is; a milestone over a fogged quantity reports the direction and never
the magnitude. The wire is written from
TRUE state — that is what lets it tell a player with three fitted gauges that there are bread
queues — so a dispatch quoting a number off that state would be a free, un-lagged, un-revised
survey beside the ones they had to fund, and ADR-0003's fog would be over.
`tests/unit/events.test.ts` greps the catalogue.

**Copy is chosen on `obs:news:*`, never a step's own rng.** Words must not move the economy.
`pipeline/technology.ts` keeps a bare `rng.next()` with a comment saying it is stranded on
purpose: deleting it would shift every later draw in that step whenever a breakthrough fires,
so rewording a headline would rewrite the century.

**Nothing downstream may match prose.** Readers filter on `event` or `kind`.
`packages/runner/src/run.ts` matched five exact sentences until #160 broke it, and the symptom
was the stability harness reporting a growth upside that was really an unexcluded oil shock.

## Thresholds get measured, not guessed

`pnpm events -- --runs 24 --ticks 400` sweeps every runner policy plus a constitutional arm
across every curated country, and prints per-desk mix, per-quarter volume, the most-filed
dispatches, and — the list to read — everything **UNREACHED**.

Three of the first thresholds shipped in #160 were unreachable at numbers that looked entirely
plausible on the page:

| dispatch | shipped at | measured | fixed to |
|---|---|---|---|
| `prices_runaway` | inflation > 40 %/yr | p99 is 12 %, worst quarter 30 % | > 22 % |
| `debt_alarming` | debt > 110 % of GDP | p99 is 80 %, worst 93 % | > 75 % |
| `terms_of_trade_adverse` | index < 85 | the century lives in 95.6–108 | < 96.5 |

and `services_overtake_industry` compared services with MANUFACTURING alone, which every
curated country already exceeds on its first morning — a milestone that could never be crossed.
Against the whole industrial sector it is real, rare, and means what the headline says.

**A milestone must also be false at the opening.** A fact that was true on the first morning is
a description of the country, not something that happened to it. The desk checks this
(`openingContext`); it exists because the standard opening led its 1946Q1 page with "more of
the country now lives in towns than out of them".

## Balance: why the desk is rate-limited

Six dispatches a quarter is not a richer game. It is a wire nobody reads — at which point the
hard events that are a player's only warning are invisible too. So:

- a fact always files; a report is capped at `NEWS_REPORTS_PER_QTR` and lands only at
  `NEWS_REPORT_P`;
- the budget counts what the quarter has **already** carried, so a drought crowds out the bond
  auction — and because `politics` runs *after* `statistics`, the desk reserves a slot whenever the
  political clock is about to ring, which covers polling day and anything that pre-empts it;
- **the cooldown escalates** (`NEWS_COOLDOWN_GROWTH`). A flat cooldown does not fix repetition,
  it changes its period: a permanently true condition re-files the instant it expires and
  prints the same sentence every fourteen quarters for eighty years. Doubling fades a standing
  condition to five or six mentions a century and leaves a genuinely recurrent event alone.

Healthy shape, measured at v39: **0.56 dispatches per quarter, 55 % quiet quarters, at most 3
in one quarter, ~131 of 136 events reachable**, no desk above about a quarter of the paper.

## The economics review

Adding an event is a `SCHEMA_VERSION` event only if you change `NewsItem` or `NEWS_KINDS`. Adding
an id and copy is neither.

Either way the check is the same and it is cheap:

```bash
pnpm diff-state --moved-only
```

**Nothing but `meta.schemaVersion` and `stats.news[*].tick` may move.** Those ticks are the news
array's own indices shifting as it grows, not a value changing. Anything else means copy has
reached the economy — go and find the rng draw.

Then confirm the century, because forty quarters cannot see it:

```bash
pnpm batch --runs 300 --ticks 400 --policy passive
```

It must be identical to the tree before your change, digit for digit.

## The paper

`ui/src/newspaper.ts` is pure and owns every layout decision — page order, the bands, which
edition is shown, the archive filter. `panels/WireOverlay.tsx` paints what it returns. A layout
choice pushed into the component is a layout choice nothing can test, and the failure is a front
page that leads on the wrong story for eighty years.

New desk? `DESK_NAMES` in `WireOverlay.tsx`, `DESK_TAGS` in `NewsWire.tsx` and
`DESK_MANUAL_NAMES` / `DESK_MANUAL_NOTES` in `ui/src/manual.ts` are all total `Record`s over
`DeskId`, so the build walks you through it. Then run **`verify-the-wall`** — nine sections and
a count apiece was already once a rail wider than the dialog, sheared off inside
`overflow-hidden` where no vertical overflow probe can see it.
