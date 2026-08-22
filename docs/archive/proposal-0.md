# Untitled Economics Game — Design Notes

> **ARCHIVED — historical, not current.** The original brainstorm. Superseded by
> [`proposal-1.md`](proposal-1.md), which restates these as decisions. Kept for
> provenance; see [`README.md`](README.md).

*Brainstorm write-up. Not a spec — a snapshot of decisions made and open questions.*
 
---
 
## 1. Pitch
 
An open-ended policy game where you run a nation's economy from 1946 to 2050 and beyond. Democracy's legibility, Victoria's emergent guts, Capitalism's supply chains — at ~1% of Victoria's scale. Browser-based, single player, quarterly turns.
 
The design bet: **accuracy and fun are the same thing.** Naive interventions must backfire *for the real reasons they backfire in the world*. When a player's obvious move fails because of a genuine second-order effect, they get the "whoa, this is real" chill and the "I must get smarter" hook simultaneously. Cobra effects *are* the gameplay.
 
---
 
## 2. Core Principles
 
- **Sparse, meaty decisions → complex emergent consequences.** Low input complexity, high output complexity. Not forty sliders.
- **No hand-authored effect arrows.** Democracy's causal web is legible but shallow — effects propagate through an actual economy instead.
- **Terrarium, not rainforest.** Emergent enough to surprise; small enough that every organism is inspectable and every bug is findable.
- **Central tension: compounding growth vs. compounding fragility.** Every growth intervention quietly accumulates debt, inflation pressure, inequality, or asset bubbles. A crisis clock is always ticking.
- **Gate on mechanism, not on tier label.** See §6.
 
---
 
## 3. The Three Player Layers
 
Separated by **time constant**. This separation is the spine of the design.
 
### Layer 1 — Dials (quarterly, reversible, cheap)
Tax rates, spending levels, policy rate, subsidies, regulations. Democracy-style policy web lives here. Costs **political capital**.
 
### Layer 2 — Capacity (multi-year, sticky, investment-like)
Tax administration, statistical office, ports, schools, courts, civil service quality. Costs money and **lags**. Nobody thanks you for it. Without it, ambitious programs leak or backfire.
 
### Layer 3 — Institutions (generational, ratcheting, contested)
Suffrage, press freedom, property rights, union rights, judicial independence. The Victoria 2 layer, and the *Why Nations Fail* layer.
 
**Two mechanics fall out of Layer 3:**
 
- **Institutions edit your own objective function.** Expanding the franchise changes *who* you're accountable to. Land reform destroys the landowner bloc outright. You can rewrite your own scoring rubric — at the cost of surrendering control. (This is literally Acemoglu & Robinson: elites extended the franchise as a commitment device when revolution was credible.)
- **Reform windows.** Crises spike revolutionary pressure, and that pressure is the only thing that pries open reforms elites would otherwise veto. *Never let a good crisis go to waste*, as a mechanic.
 
**The extractive path must be genuinely tempting, and ceilinged mechanistically.** Forced industrialization *works*: fast early growth, total control, no coalition management. But high elite power means elites veto creative destruction — new sectors can't displace incumbents' rents. So you max agriculture and heavy industry and never make the services/tech transition. Not a hard cap you bump into; an emergent consequence of who holds the veto. The player discovers the Soviet growth curve themselves.
 
---
 
## 4. Economic Engine
 
- **5–15 population cohorts** (urban professionals, rural workers, retirees, etc.) with income, consumption preferences, savings, and approval functions. Not thousands of Victoria pops.
- **6–12 sectors** with a mini input-output table — a playable Leontief.
- **Price/wage clearing via tâtonnement:** each tick, excess demand nudges prices up, excess supply nudges them down. Genuine emergence (a fuel tax ripples through transport into food prices without scripting) while staying debuggable.
- **Demographics as a first-class system** — see §7.
 
---
 
## 5. Signature Mechanics
 
### State capacity determines the fidelity of your own UI
Low statistical capacity → your GDP figure is noisy, lagged two quarters, and gets **revised**. You make decisions on numbers that later turn out to have been wrong. (Q3 prints +2.1%, gets revised to −0.4% two years later, long after you acted on it.) Invest in the statistical agency and the fog lifts: tighter error bars, faster reporting, disaggregated data.
 
The least glamorous possible upgrade, and the most powerful thing in the game. It's not a gimmick — it's an actual reason poor states stay poor.
 
### You build your own instrument panel
**You can only plot what you can measure.** Want a CPI? Fund price collection. Gini? A household survey program. Unemployment? A labor force survey. You start with customs receipts and rumors. This marries the "I want real charts and hard numbers" requirement to the state-capacity mechanic instead of fighting it.
 
### The Narrow Corridor plot (the signature visual, in place of a map)
Two axes: **state capacity** vs. **societal power**.
- Too much state, no society → despotism.
- Too much society, no state → anarchy.
- The corridor between them is where prosperity lives — and it **narrows and shifts** as you move.
 
It's a chart, a strategy map, and a win condition all at once. You watch your dot drift.
 
---
 
## 6. Development Stages — Gate on Mechanism, Not Tier
 
**Do not** write `if (stage >= DEVELOPED) unlock(UBI)`. That's a hand-authored arrow — the exact thing we rejected.
 
**Instead:** UBI is always in the list, always clickable, and it **fails for real reasons** if you're not ready. Enact it in a poor agrarian economy and it doesn't error out — you just can't finance it (tax capacity is 8% of GDP), so you print, inflation eats it, and it's a transfer to nobody. The player learns *why* poor countries can't do UBI rather than being told they can't.
 
Stages aren't game states you level into; they're **regions of parameter space where different policies actually work.** Structural transformation (agriculture → manufacturing → services) emerges from productivity and demand shifts. The "level up" feeling arrives when the player notices a lever that used to backfire suddenly bites — a far better feeling than a popup reading *Congratulations, you are now Middle Income.*
 
**Where hard date-gating IS honest:** things that literally didn't exist yet. Container shipping (1956), inflation targeting (1990), mobile money (2007). That's not a game rule, that's history.
 
---
 
## 7. Demographics
 
First-class, because it drives everything else and because the 1946–2050 window is *the* demographic transition window.
 
- Age pyramid by cohort; fertility, mortality, migration.
- **Fertility is endogenous** — falls with income, female education, urbanization, child mortality. You don't set it; you cause it.
- **The demographic dividend is a window, not a gift.** A bulge of working-age adults is a growth windfall *only if* they're employed and educated. Otherwise it's a youth unemployment bomb.
- **Aging is the endgame trap.** Dependency ratios rise, pension promises made in the 1970s come due in the 2030s, the tax base shrinks. The player who front-loaded transfers and never built capacity gets crushed here — and the debt was incurred by an administration long gone.
- **Migration as pressure valve and political flashpoint.** Brain drain out of poor countries; nativist backlash in rich ones; remittances as a real balance-of-payments line.
- Education/human capital is a slow-moving stock — see §8 on absorption.
 
---
 
## 8. Technology: Two Trees, and the Gap Between Them
 
- **The frontier** — global knowledge, advancing on a roughly historical schedule, mostly independent of you (unless you're big and rich).
- **Absorptive capacity** — whether you can actually *use* what exists. Depends on human capital, institutions, openness, industrial base.
 
**The gap between them is the entire drama of development economics.** Every technology in the world was available to Ghana and South Korea in 1960. The frontier was never the constraint; absorption was.
 
So R&D policy splits meaningfully by position:
- **Rich country:** spend to *push* the frontier. Slow, expensive, small gains — you're already at it.
- **Poor country:** spend to *close the gap*. Fast, cheap, huge gains — catch-up growth is real, and this is why convergence happens when it happens.
 
Same button, wildly different payoff. The ceiling: you cannot absorb faster than your human capital allows — which is why "just buy the machines" fails, and has failed, repeatedly and expensively.
 
---
 
## 9. Countries: One Schema, Two Sources
 
Define a country as a **parameter vector**: sector shares, capital stock, human capital, institutional quality, resource endowments, debt profile, demographic pyramid, trade exposure.
 
- **Real countries** = specific points in that space (World Bank, Penn World Tables, IMF).
- **Procedural countries** = samples from it.
 
Same engine, same schema. ~10% extra work over building either alone.
 
**Calibrate on real, ship procedural, offer real as a mode.**
- Real data during development is your **test suite**. If the engine says 1990s Argentina is fine, the engine is wrong.
- Procedural as the main mode, because **real countries leak the answers** — if I'm playing Japan I already know about the lost decades. Hidden parameters (you don't learn your true institutional quality until you stress it) preserve discovery.
 
---
 
## 10. Rest of World
 
Not 190 countries. **5–8 abstract trading partners** — a commodity exporter, a manufacturing giant, a financial center, a regional peer. Each gets a coarse model: enough to run its own business cycle, demand your exports, supply your imports, and occasionally have a crisis that splashes on you. World prices become semi-endogenous rather than a scripted feed.
 
---
 
## 11. Timeline
 
- **Earliest start: 1946.** Additional starts at key economic dates.
- **Historical scenario starts, each teaching a different mechanism:**
  - 1946 — postwar reconstruction
  - 1960 — decolonization (Ghana vs. Korea: same numbers, different endings)
  - 1973 — oil shock, stagflation
  - 1979 — Volcker
  - 1989 — transition: shock therapy vs. gradualism
  - 1997 — Asian crisis, capital flight
  - 2008 — GFC, the zero lower bound
  - 2020 — pandemic, supply chains
  - 2026 — present day
- **Nominal end: 2050**, with the option to keep playing.
- **After 2026, everything is procedurally generated** — the frontier keeps advancing, crises keep arriving, the world keeps having its own problems. 2035 is genuinely unknown.
 
---
 
## 12. Architecture
 
- Sim is a **pure, deterministic, seeded function** of `(state, actions) → state`, running in a **Web Worker**.
- React renders only a **view** of state — passed through the fog/noise filter (§5).
- **Save file = seed + action log.** Kilobytes. Perfectly replayable.
- **Headless batch runs** — 10,000 games overnight for balance testing. Non-negotiable with an emergent model.
 
---
 
## 13. Filed for Later
 
- **Doctrine Inc.** — same engine, different hand on the wheel. You are an economic ideology (state capitalism, georgism, laissez-faire) spreading across a world map, with ideological backlash as the antagonist clock. Structurally the most faithful Plague Inc translation, and nobody has built it.
- **World map view** — cool, but doesn't feel playable enough to be the primary screen.
- **Sandbox / crisis scenarios** — a mode, not the core. ("Tame this inflation.")
 
---
 
## 14. Open Questions
 
1. **What does the player stare at for 80% of the game?** The policy web is *part* of it, but not all of it. Candidate main screen: the instrument panel (charts you've unlocked) + the Narrow Corridor plot, with the policy web and I/O table as drill-downs.
2. **What is the actual win condition?** Elections are the forcing function that turns "optimize the economy" into "optimize the economy *subject to* holding a coalition together" — which is where the interesting tradeoffs live. But over a 100-year run, what does *winning* mean? Position in the corridor at 2050? Cumulative welfare? Survival?
3. **How much financial sector?** Banks, credit cycles, and asset bubbles are where most modern crises actually come from. Not modeled yet, and the "compounding fragility" clock is much less interesting without them.
4. **How is political capital actually earned?** "Delivering visible results" needs a real formula, and it interacts nastily-but-correctly with the fog: you get credit for numbers that later get revised away.
 
---
 
## 15. v0.1 Scope Proposal
 
Get the terrarium breathing before adding species:
 
- 5 cohorts, 5 sectors, 1 procedural country
- Quarterly turns, one policy lever per category
- Tâtonnement price clearing, working I/O table
- Fog-of-data on 3 indicators (GDP, inflation, unemployment) with revisions
- One trading partner, exogenous world prices
- Elections every 16 turns
- No tech tree, no institutions yet — but the schema leaves room
 
Ship it ugly, verify that a fuel tax raises bread prices without anyone scripting it, and that a subsidy in a low-capacity state does more harm than good. If those two things happen, the design works and everything else is content.
