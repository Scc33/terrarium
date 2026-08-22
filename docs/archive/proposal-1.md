# Terrarium — Working Design Doc v0.1

> **Archived 2026-08-22.** This was the working design and milestone plan through the first
> implementation. It is retained for provenance, not as current documentation. Read
> [the game description](../game-description.md), [the technical architecture](../tech-architecture.md),
> and [the accepted decisions](../adr/README.md) for the maintained design. Unimplemented ideas
> worth retaining were moved to [issue #119](https://github.com/Scc33/terrarium/issues/119).
 
*Successor to the brainstorm notes. Decisions are stated as decisions; proposals for previously-open questions are marked **[PROPOSAL]**. Working title: "Terrarium" (from the core principle) until something better arrives.*
 
---
 
## 1. Vision
 
An open-ended, browser-based, single-player policy game: run a nation's economy from 1946 to 2050+ in quarterly turns. Democracy's legibility, Victoria's emergent guts, Capitalism's supply chains — at ~1% of Victoria's scale.
 
**The design bet: accuracy and fun are the same thing.** Naive interventions backfire *for the real reasons they backfire in the world*. When the obvious move fails because of a genuine second-order effect, the player gets the "whoa, this is real" chill and the "I must get smarter" hook simultaneously. Cobra effects are the gameplay.
 
**Player fantasy:** technocrat-statesman. You are not clicking +2% happiness buttons; you are reading noisy instruments, forming a model of your own economy, and betting political capital on it.
 
## 2. Design Pillars
 
Every feature decision gets tested against these five. If it fails one, it's cut or redesigned.
 
1. **Sparse, meaty decisions → complex emergent consequences.** Low input complexity, high output complexity. Never forty sliders.
2. **No hand-authored effect arrows.** Effects propagate through an actual economy. If a causal chain is scripted, it's a bug.
3. **Terrarium, not rainforest.** Emergent enough to surprise; small enough that every organism is inspectable and every bug is findable.
4. **Compounding growth vs. compounding fragility.** Every growth intervention quietly accumulates debt, inflation pressure, inequality, or bubble risk. A crisis clock always ticks.
5. **Gate on mechanism, not on tier label.** Policies never unlock; they start *working*. (§7)
 
## 3. The Player Experience
 
### 3.1 The turn loop
Quarterly. Read instruments → adjust dials / commit to investments / (rarely) push institutional reform → advance → absorb consequences and news. Elections every 16 turns are the forcing function that converts "optimize the economy" into "optimize the economy *while holding a coalition together*."
 
### 3.2 Main screen — [PROPOSAL]
**The instrument panel is the game.** Primary screen is a dashboard of the charts you've earned (§6.2), with the Narrow Corridor plot permanently docked as the "minimap." Policy web, I/O table, and demographic pyramid are drill-down tabs, not the home view.
 
Rationale: the fog-of-data mechanic only lands if the player *lives* in the data. If the policy web were home, the game would read as Democracy-with-extra-steps. The panel also gives the game its visual identity: a mid-century central bank war room that slowly modernizes as you fund it.
 
### 3.3 Win condition — [PROPOSAL]
No single win state. A run ends (2050, deposition, or state collapse) with a **three-axis report card**, graded separately and never summed:
 
- **Prosperity:** cumulative discounted welfare across cohorts (not terminal GDP — a scorched-earth sprint to 2049 shouldn't score).
- **Position:** where your dot sits in the Narrow Corridor at end, and the path it traced.
- **Legitimacy:** did you survive in power, and *how* — elections won vs. elections suppressed is visible on the card.
 
Rationale: summing these into one number would secretly author a "correct" ideology, violating Pillar 2 in spirit. Three separate grades let the extractive path score high on Legitimacy and Position-adjacent metrics while Prosperity plateaus — the report card *shows* the Soviet curve rather than penalizing it by fiat. For v0.1, only Prosperity + survival exist.
 
### 3.4 Political capital — [PROPOSAL]
The formula that answers "how is PC actually earned," designed to interact nastily-but-correctly with the fog:
 
- Each cohort holds an **approval** value driven by its *experienced* conditions (real income, employment, prices it actually faces).
- Each election cycle, PC income = Σ (cohort approval × cohort enfranchisement weight × salience).
- **Salience is mediated by measurement:** cohorts respond to headline numbers *as currently published*. Credit is banked when the number prints. If GDP prints +2.1% and is revised to −0.4% two years later, you keep the PC — but the cohort's *experienced* conditions were real all along, so approval drifts toward truth over ~4–8 quarters regardless of what the statistics said.
- Consequence, unscripted: low statistical capacity lets you *borrow* legitimacy against future revisions. Governments juicing the numbers before elections falls out of the model for free.
 
PC is spent on Layer 1 actions (cheap), Layer 2 commitments (moderate, plus money), and Layer 3 reforms (enormous, unless a reform window is open — §4.3).
 
## 4. The Three Layers
 
Separated by **time constant**. This separation is the spine of the design.
 
### 4.1 Layer 1 — Dials (quarterly, reversible, cheap)
Tax rates, spending levels, policy rate, subsidies, regulations. Democracy-style policy web lives here as a *view*, not as the causal model. Costs political capital.
 
### 4.2 Layer 2 — Capacity (multi-year, sticky, investment-like)
Tax administration, statistical office, ports, schools, courts, civil service. Costs money and **lags**. Nobody thanks you for it. Without it, ambitious programs leak or backfire. Capacity stocks depreciate slowly — neglect is a policy.
 
### 4.3 Layer 3 — Institutions (generational, ratcheting, contested)
Suffrage, press freedom, property rights, union rights, judicial independence.
 
Two mechanics fall out of this layer:
 
- **Institutions edit your own objective function.** Expanding the franchise changes who you're accountable to (the enfranchisement weights in §3.4 are literally the scoring rubric). Land reform destroys the landowner bloc outright. You can rewrite your own scoring — at the cost of surrendering control. (Acemoglu & Robinson: franchise extension as commitment device under credible revolutionary threat.)
- **Reform windows.** Crises spike revolutionary pressure; that pressure is the only thing that pries open reforms elites would otherwise veto. *Never let a good crisis go to waste*, as a mechanic.
 
**The extractive ceiling is emergent, not scripted.** Forced industrialization works: fast early growth, total control, no coalition management. But high elite power means elites veto creative destruction — new sectors can't displace incumbents' rents, so the services/tech transition never happens. The player discovers the Soviet growth curve themselves.
 
## 5. Economic Engine
 
- **5–15 population cohorts** (urban professionals, rural workers, retirees…) with income, consumption preferences, savings, and approval functions.
- **6–12 sectors** with a mini input-output table — a playable Leontief.
- **Price/wage clearing via tâtonnement:** each tick, excess demand nudges prices up, excess supply down. A fuel tax ripples through transport into food prices without scripting, while staying debuggable.
- **Government as an actor in the same economy:** it hires from cohorts, buys from sectors, taxes flows it can *see* (tax capacity gates collection, not a flat rate on true GDP).
- **Fragility ledger (v0.1 minimal):** public debt and inflation expectations only. Credit cycles and asset bubbles are deferred (§12) but the schema reserves slots — every sector gets a `credit` field from day one, even if unused.
 
## 6. Signature Mechanics
 
### 6.1 State capacity determines the fidelity of your own UI
Low statistical capacity → GDP is noisy, lagged two quarters, and gets **revised**. You act on numbers that later turn out to have been wrong. Invest in the statistical agency and the fog lifts: tighter error bars, faster reporting, disaggregation. The least glamorous upgrade and the most powerful thing in the game — and it's not a gimmick, it's an actual reason poor states stay poor.
 
Implementation note: the sim always computes true values; the **observation layer** is a pure function `(trueState, statCapacity, seed) → publishedState`. The React app only ever sees `publishedState`. Making the fog architecturally mandatory prevents accidental truth leaks through some forgotten UI element.
 
### 6.2 You build your own instrument panel
**You can only plot what you can measure.** CPI requires funded price collection; Gini requires a household survey; unemployment requires a labor force survey. You start with customs receipts and rumors. This marries "I want real charts and hard numbers" to the state-capacity mechanic instead of fighting it.
 
### 6.3 The Narrow Corridor plot (signature visual; there is no map)
Axes: **state capacity** vs. **societal power**. Too much state → despotism; too much society → anarchy; the corridor between is where prosperity lives, and it narrows and shifts as you move. It's a chart, a strategy map, and the Position grade all at once. You watch your dot drift.
 
## 7. Development Stages — Gate on Mechanism
 
Never `if (stage >= DEVELOPED) unlock(UBI)`. UBI is always listed, always clickable, and **fails for real reasons** if you're not ready: in a poor agrarian economy with tax capacity at 8% of GDP you can't finance it, so you print, inflation eats it, and it's a transfer to nobody. The player learns *why* poor countries can't do UBI rather than being told they can't.
 
Stages are **regions of parameter space where different policies actually work**. Structural transformation emerges from productivity and demand shifts. The "level up" feeling arrives when a lever that used to backfire suddenly bites — better than a popup reading *Congratulations, you are now Middle Income.*
 
**Hard date-gating is honest only for things that didn't exist yet:** container shipping (1956), inflation targeting (1990), mobile money (2007). That's not a rule, that's history.
 
## 8. Demographics
 
First-class, because the 1946–2050 window *is* the demographic transition window.
 
- Age pyramid by cohort; fertility, mortality, migration.
- **Fertility is endogenous** — falls with income, female education, urbanization, child mortality. You don't set it; you cause it.
- **The dividend is a window, not a gift.** A working-age bulge is a windfall only if employed and educated; otherwise it's a youth-unemployment bomb.
- **Aging is the endgame trap.** Pension promises made in the 1970s come due in the 2030s against a shrinking tax base. The player who front-loaded transfers and never built capacity gets crushed by debts an administration long gone incurred.
- **Migration** as pressure valve and flashpoint: brain drain, nativist backlash, remittances as a real balance-of-payments line.
 
## 9. Technology: Two Trees and the Gap
 
- **The frontier:** global knowledge, advancing on a roughly historical schedule, mostly independent of you.
- **Absorptive capacity:** whether you can *use* what exists — human capital, institutions, openness, industrial base.
 
The gap between them is the entire drama of development economics. R&D spend splits by position: rich countries push the frontier (slow, expensive, small gains); poor countries close the gap (fast, cheap, huge gains — catch-up growth is real). Same button, wildly different payoff. Ceiling: you cannot absorb faster than your human capital allows — why "just buy the machines" fails, repeatedly and expensively.
 
## 10. Countries & World
 
**One schema, two sources.** A country is a parameter vector: sector shares, capital stock, human capital, institutional quality, endowments, debt profile, pyramid, trade exposure. Real countries are points in that space (World Bank, PWT, IMF); procedural countries are samples from it. ~10% extra work over building either alone.
 
**Calibrate on real, ship procedural, offer real as a mode.** Real data during development is the test suite — if the engine says 1990s Argentina is fine, the engine is wrong. Procedural is the main mode because real countries leak the answers; hidden parameters (you don't learn your true institutional quality until you stress it) preserve discovery.
 
**Rest of world: 5–8 abstract trading partners** — commodity exporter, manufacturing giant, financial center, regional peer — each with a coarse model: its own business cycle, demand for your exports, supply of your imports, occasional crises that splash on you. World prices become semi-endogenous.
 
**Scenario starts**, each teaching one mechanism: 1946 reconstruction · 1960 decolonization (Ghana vs. Korea) · 1973 oil shock · 1979 Volcker · 1989 transition · 1997 Asian crisis · 2008 ZLB · 2020 pandemic · 2026 present. Nominal end 2050, optional continue; after 2026 everything is procedural — 2035 is genuinely unknown.
 
## 11. Architecture
 
- Sim is a **pure, deterministic, seeded function** `(state, actions) → state`, running in a **Web Worker**. TypeScript throughout; sim package has zero DOM dependencies.
- React renders only a view of `publishedState` (§6.1). The true state never crosses the worker boundary except through the observation layer.
- **Save file = seed + action log.** Kilobytes, perfectly replayable, and doubles as the bug-report format.
- **Headless batch runner from day one** — 10,000 games overnight for balance testing. Non-negotiable with an emergent model.
- **Verification tests are executable claims about economics:** e.g. `expect(fuelTax).toRaise(breadPrice)` via headless runs, not unit tests on formulas. The test suite is the promise that Pillar 2 holds.
 
## 12. Roadmap
 
Get the terrarium breathing before adding species.
 
**M0 — Skeleton (engine before game).** Sim loop in worker, seed+log saves, headless runner, replay determinism test. No UI beyond a debug table.
 
**M1 — v0.1 Terrarium.** 5 cohorts, 5 sectors, 1 procedural country. Quarterly turns, one lever per category. Tâtonnement clearing, working I/O table. Fog on 3 indicators (GDP, inflation, unemployment) with revisions. One trading partner, exogenous world prices. Elections every 16 turns; PC formula from §3.4 in minimal form. **Exit criteria:** (a) a fuel tax raises bread prices without anyone scripting it; (b) a subsidy in a low-capacity state does more harm than good; (c) 1,000 headless random-policy runs complete without NaN or price explosion. If (a) and (b) happen, the design works and everything else is content.
 
**M2 — Measurement.** Statistical capacity as a Layer 2 stock, buildable instrument panel, revisions driving the PC/salience loop. This is where the game stops being a toy.
 
**M3 — Institutions.** Layer 3, enfranchisement-weighted scoring, reform windows, elite veto on creative destruction, Narrow Corridor plot. Verify the extractive ceiling emerges in batch runs.
 
**M4 — The Century.** Demographics, two-tree technology, 5–8 trading partners, scenario starts, real-country calibration mode.
 
**M5 — Fragility.** Financial sector: credit stocks, bank behavior, asset bubbles, sudden stops. Deferred this long deliberately (§13) — but the crisis clock is much less interesting without it, so it is on the critical path to 1.0, not filed-for-later.
 
## 13. Risks
 
- **Tâtonnement instability.** Naive price adjustment oscillates or explodes. Mitigations: damping factors, per-tick price-move caps, and the M1 exit criterion (c). If it can't be stabilized at 5×5 scale, the whole approach needs rethinking — find out in M1, not M4.
- **Emergent ≠ fun.** The engine may be accurate and boring. Mitigation: the exit criteria are *drama* tests (backfires, ripples), not accuracy tests; playtest at every milestone; the fog mechanic manufactures tension even in calm economies.
- **Balance hell.** Emergent systems can't be balanced by hand-tuning individual outcomes. Mitigation: headless batch runs are first-class from M0; balance targets are expressed as distributions over 10k runs ("<5% of runs hyperinflate by 1970 under passive policy").
- **Victoria gravity.** Every review of the notes will suggest one more cohort, one more sector. Pillar 3 is the defense; the schema question is never "would this be realistic" but "can I still inspect every organism."
- **Solo-dev scope.** M1 is genuinely small; M4 is genuinely not. The roadmap is ordered so that every milestone is a shippable, interesting toy on its own. If the project stops at M2, what exists is still a novel game about measurement.
 
## 14. Question Status
 
**Resolved in this doc (as proposals — revisit after M1):** main screen (§3.2), win condition (§3.3), political capital formula (§3.4), financial sector sequencing (§12 M5).
 
**Still open:**
1. Cohort approval functions — loss-averse? (Prospect theory says yes: cohorts should punish losses ~2× rewards for gains. Cheap to add, big behavioral payoff.)
2. How much does the player see of *other* cohorts' approval, given the fog? Is polling itself a fundable instrument?
3. Procedural country generation — uniform samples of the parameter vector will mostly produce implausible nations. Need correlations (sampling from a fitted distribution over real-country data?).
4. Name. "Terrarium" is a placeholder.
 
## 15. Filed for Later
 
- **Doctrine Inc.** — same engine, different hand on the wheel: you are an economic ideology spreading across a world map, ideological backlash as the antagonist clock. The most faithful Plague Inc translation, and nobody has built it.
- **World map view** — cool, not playable enough to be primary.
- **Sandbox / crisis scenarios** ("Tame this inflation") — a mode, not the core.
