# ADR-0031 — An event is a name; the catalogue words it

**Status:** Accepted · **Date:** 2026-08-25

## Context

Issue #160: *"The event stream is a great idea but it can feel boring and repetitive at times."*
It asks for more events, more diversity, a newspaper rather than a feed, and — in the comments —
a short article under each headline, plus stories that change across a century.

The wire at the time carried about thirty distinct dispatches. Six pipeline steps each built a
`NewsItem` literal inline:

```ts
news.push({
  tick: state.meta.tick,
  text: 'Drought grips the growing provinces; the harvest is given up for lost.',
  tone: 'bad',
  kind: 'drought_begins',
})
```

and the rumour mill was a seven-rule table in `pipeline/statistics.ts` that filed the FIRST
matching rule at a flat sixty per cent. Four consequences followed, and only the first is the
one the issue names:

1. **It read the same in 1949 and 2043.** Nothing in a dispatch knew what decade it was, and
   the first matching rule is nearly always the same rule.
2. **Adding an event meant editing a pipeline step.** Prose lived inside the machinery that
   produced the fact, so a hundred more dispatches meant a hundred edits across six files that
   are otherwise about the economy.
3. **Copy was coupled to the economy.** `technology.ts` chose its breakthrough phrasing with a
   draw from its OWN rng substream. Adding a fifth sentence to that list would have shifted
   every later draw in the step whenever a breakthrough fired — a copy-edit that rewrites the
   century.
4. **Downstream readers matched prose.** `packages/runner/src/run.ts` detected fuel shocks and
   foreign crises by comparing `item.text` against five exact sentences. Rewording the wire
   silently stopped those windows being excluded from the stability harness's quiet tails. This
   was found by breaking it: the harness reported a growth upside that was an unexcluded oil
   shock, and it failed loudly only by the luck of a threshold.

`NewsItem.kind` already existed to solve (4) — it was added when the finance overlay's crisis
markers were found to be one copy-edit from vanishing. The lesson had been learned and not
finished.

## Decision

**A pipeline step names an event. It does not word one.**

```ts
news.push(fileDispatch(state, 'drought_onset'))
```

`packages/engine/src/events/` holds four modules with one job each:

| module | holds | why it is separate |
|---|---|---|
| `ids.ts` | `EVENT_IDS`, `DESK_IDS`, prominence | a leaf with no imports, so `state/schema.ts` can type `NewsItem.event` against it without a cycle |
| `catalogue.ts` | every event's copy, per era | the only authored prose in the system |
| `eras.ts` | the six presses of the century, and their mastheads | selects copy and nothing else |
| `conditions.ts` | the desk: which conditions get reported, and how many | reads the country; chooses only from authored prose |

`NewsItem` grows from four fields to nine: `event` (the stable name), `desk` (which section
filed it), `prominence` (`lead` / `column` / `brief`), `outlet` (the masthead), and `body` (the
standfirst the issue asked for) join `tick`, `kind`, `tone` and `text`.

Everything downstream is a total `Record` over `EVENT_IDS` or `DESK_IDS`, so an id added without
copy, a desk added without a name, or a statute added without a headline all fail the build.

### The rules that make it hold

**No dispatch ever prints a figure.** The wire is made from TRUE state — that is what lets it be
the poor state's instrument, telling a player with three fitted gauges that there are bread
queues. A dispatch that interpolated the number off that state would be a free, un-lagged,
un-revised survey sitting beside the ones the player had to fund, and ADR-0003's fog would be
over. Qualitative prose is not a stylistic preference here; it is the boundary, and
`tests/unit/events.test.ts` greps the whole catalogue for digits.

A figure spelled out in words is still a figure, which the grep cannot see. The line: a milestone
over state that needs no statistical office may say what it is, because heads and where they sleep
are countable and saying so costs the player nothing they would otherwise buy. A milestone over a
fogged quantity may report the direction and never the magnitude — the same split `kind` already
draws between `milestone` and `rumor`. Two dispatches shipped on the wrong side of it and were
reworded.

**Copy is drawn on `obs:news:*` substreams, never an economic one.** Choosing different words
must not move the economy. `technology.ts` keeps a bare `rng.next()` with a comment explaining
that it is stranded on purpose: removing it would reshuffle every later draw in that step
whenever a breakthrough fires.

**A fact always files; a report is budgeted.** Hard events raised by pipeline steps, and census
milestones, are never rate-limited. Condition reports are capped per quarter, filed only at
`NEWS_REPORT_P`, and cooled — and the budget counts what the quarter has ALREADY carried, so the
quarter of a drought does not also run three paragraphs about the bond auction.

The exception is worth stating because it is structural rather than an oversight: `politics` runs
*after* `statistics` in the versioned tick order, so an election, revolt or coup is not in that
tally when the desk sits down. The desk therefore reserves a slot whenever the political clock is
about to ring, which is deterministic and covers polling day — and covers a revolt or coup that
pre-empts it, since the reserved slot is simply filled by whatever the step files. An *unheralded*
coup in an ordinary quarter is drawn from `politics`' own substream and cannot be anticipated
without reaching into it, which would couple the wire to the economy's randomness. Those land on
top of a full page. Moving the desk after `politics` would fix it and is not worth a pipeline
reorder (ADR-0005 makes that a schema event) for a case this rare.

**A milestone comes out of the page budget once.** It shipped coming out twice — subtracted when
the budget was computed and again by a loop guard comparing the running total against it — so a
single milestone in an otherwise quiet quarter left a slot free and then refused to spend it. The
arithmetic is now a named function (`reportBudget`) with a unit test, because at century scale the
bug was unobservable: milestones fire about once per run, and a sweep over twelve centuries
produced one quarter in which the difference could even be seen.

**The cooldown escalates.** A flat cooldown does not fix repetition; it changes its period. A
permanently true condition — an unschooled country, comfortable reserves — re-files the instant
it expires, and the paper prints the same sentence every fourteen quarters for eighty years.
Doubling per filing makes a standing condition fade to five or six mentions in a century while
leaving a genuinely recurrent event untouched, since its gaps were never near the cooldown.

**The masthead is where press freedom becomes visible, and it may never suppress anything.**
Below `PRESS_CAPTURED_AT` the independent titles stop appearing and the same events arrive over
the state's own wire service. The dispatch is unchanged — no event is dropped, no tone softened,
no `kind` withheld. The moment press freedom could delete a dispatch, every downstream reader of
the wire would silently become a reader of the government's opinion of it.

## Consequences

**It is economically inert, and that is measured rather than argued.** `pnpm diff-state
--moved-only` on all three goldens reports `meta.schemaVersion` and nothing else. Passive,
developmental, random and regulated batches are bit-identical to the tree before the change —
growth, inflation, unemployment and deposition to every printed digit.

**Adding an event is three lines and a call site.** An id, a catalogue entry, and either
`fileDispatch` where the fact happens or a rule in `CONDITION_RULES`. Giving an existing event a
nineteen-seventies voice is one `byEra` block, inherited forward by every later age.

**Two thresholds were dead on arrival and one milestone was impossible.** Building the
measurement tool (`pnpm events`) immediately paid for itself: annual inflation above 40 % and a
debt above 110 % of GDP are both outside the measured distribution, and "services overtake
industry" compared services against MANUFACTURING alone — which every curated country already
exceeds on its first morning. All three looked entirely plausible on the page. This is
AGENTS.md's "a mechanic you cannot reach is not a mechanic", applied to prose.

**A milestone must be a crossing.** The first version checked only that the condition was true
now, so the standard opening led its 1946Q1 front page with "more of the country now lives in
towns than out of them" — true, and not news. Every milestone is now required to be false in the
opening quarter.

**The runner and two property tests moved off prose.** `run.ts` matches `kind`;
`tests/properties/shocks.test.ts` and `institutions.test.ts` match `event`. That is the debt
`kind` was introduced to pay and did not finish paying.

**The schema grew by five fields per wire item.** A century carries roughly 220 dispatches, so
the cost is small and the save is unaffected — saves are replay logs (ADR-0001) and carry no
news at all.

## Alternatives considered

**Leave the prose inline and just write more of it.** Rejected: it is (2) and (3) above made
worse. A hundred and thirty dispatches spread across six pipeline steps is a hundred and thirty
opportunities for a copy-edit to move the economy, and no place to put an era.

**Interpolate published figures into the copy.** A newspaper quoting the official release is
diegetically correct and was genuinely tempting. Rejected because it puts a templating engine in
the pipeline and, more importantly, because the tempting next step is quoting the TRUE figure —
at which point the wire is an instrument. A flat rule with a test behind it is worth more than
the flavour.

**Let events have mechanical effects.** Rejected as out of scope and probably wrong. Every
mechanic in this engine arrives through a channel that already exists (ADR-0028 is the clearest
statement of it); an event that directly subtracted output would be the effect arrow the design
refuses. The wire reports the economy. It does not act on it.

**Suppress dispatches under a captured press.** Rejected: see above. It would have made the
finance overlay's crisis markers a function of press freedom, and a chart with no markers looks
exactly like a century with no crises.
