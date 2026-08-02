# Terrarium — Market Clearing Spec (M1)

> **ARCHIVED — historical, not current.** This spec was implemented; the live versions are
> `engine/src/pipeline/prices.ts` and `production.ts`, with coefficients in
> `engine/src/constants.ts`. The stability argument and worked example below still explain
> *why* the damping and per-tick caps are shaped as they are. See [`README.md`](README.md).

*Third doc in the set. The concrete tâtonnement loop and I/O table for the 5×5 economy, with a paper stability argument and a worked fuel-tax example (numbers verified numerically). Plus a filed note on the engine-as-MCP side quest.*
 
---
 
## 1. The M1 Input-Output Table
 
Sectors: `AGR` (agriculture/food), `MFG` (manufacturing), `ENE` (energy), `SVC` (services), `TRN` (transport).
 
`A[i][j]` = units of input *i* consumed per unit of output *j*:
 
| input ↓ / output → | AGR  | MFG  | ENE  | SVC  | TRN  |
|--------------------|------|------|------|------|------|
| **AGR**            | 0.10 | 0.15 | 0.00 | 0.02 | 0.00 |
| **MFG**            | 0.10 | 0.20 | 0.10 | 0.05 | 0.10 |
| **ENE**            | 0.08 | 0.12 | 0.05 | 0.03 | **0.25** |
| **SVC**            | 0.05 | 0.10 | 0.08 | 0.10 | 0.10 |
| **TRN**            | 0.07 | 0.08 | 0.02 | 0.02 | 0.05 |
| *value added*      | 0.60 | 0.35 | 0.75 | 0.78 | 0.50 |
 
**Verified properties** (these become a unit test on any country's generated table):
- All column sums < 1 → Hawkins–Simon condition holds; the economy is productive and `(I − A)⁻¹` exists.
- Spectral radius **ρ(A) = 0.41** — cost shocks decay geometrically at ~0.41 per round, so supply-chain ripples converge in a handful of quarters. Country generation must assert ρ(A) < 0.7; anything higher makes ripples last unrealistically long and slows tâtonnement convergence.
- The bolded ENE→TRN coefficient (0.25) plus AGR's transport (0.07) and energy (0.08) inputs are the deliberately-placed fuel-tax → bread-price pathway. Not scripted — just structurally present, like reality.
 
## 2. Demand System (the stability keystone)
 
**Cohort consumption is Cobb-Douglas:** each cohort spends fixed budget shares `consumptionWeights` across sectors, so quantity demanded of good *i* = `share_i × budget / p_i`.
 
This is chosen for stability, not elegance: Cobb-Douglas demand satisfies **gross substitutability**, and gross substitutes is the classical sufficient condition (Arrow–Block–Hurwicz) for tâtonnement to converge globally. Expenditure per good is constant, so demand curves are rectangular hyperbolas — no perverse income effects, no Giffen weirdness, no SMD-theorem chaos. Engel-curve shifts (food share falling with income — needed for structural transformation) enter later as *slow* drift of the weights between ticks, never within the price loop.
 
Total demand per sector per tick:
 
```
D_i = Σ_j A[i][j] · plannedOutput_j     (intermediate, Leontief)
    + Σ_k share_k,i · budget_k / p_i    (households, Cobb-Douglas)
    + gov procurement_i + investment_i  (price-inelastic this tick)
    + exports_i(p_i vs worldPrice_i) − imports_i(p_i vs worldPrice_i)
```
 
## 3. The Tâtonnement Loop
 
Runs once per tick inside the `prices` step. Prices adjust to *last* tick's realized excess demand — one nudge per quarter, not an inner convergence loop. The economy is allowed to be out of equilibrium; that disequilibrium **is** the game (shortages, gluts, inflation).
 
```ts
// packages/engine/src/pipeline/prices.ts
for (const i of sectors) {
  const supply = Math.max(output[i] + inventoryRelease[i], SUPPLY_FLOOR);
  const ed     = demand[i] - supply;                    // excess demand
  const raw    = LAMBDA * (ed / supply);                // λ = 0.3
  const move   = clamp(raw, -MAX_MOVE, +MAX_MOVE);      // ±0.15/qtr
  nextPrice[i] = price[i] * (1 + move);
}
// wages: identical rule per sector on labor excess demand, μ = 0.2 (slower than prices)
```
 
**The three time constants, ordered fast → slow (this ordering is a design rule):**
1. **Prices/wages** — every tick, λ = 0.3.
2. **Quantities** — producers adjust planned output toward profitability with a 2–3 quarter partial-adjustment lag.
3. **Capital/capacity** — years.
 
Prices must be the fastest. If quantities react to prices as fast as prices react to demand, you get cobweb (hog-cycle) oscillations. Mild cobweb in AGR is realistic *drama*; economy-wide cobweb is instability.
 
**Nominal anchor:** tâtonnement only pins relative prices; the price *level* is free to drift — deliberately, because that drift is inflation, and inflation is gameplay. The `monetary` step (which runs before `prices`) scales aggregate nominal demand via money/rates, so loose policy shows up as economy-wide positive excess demand and a rising level. The MAX_MOVE cap bounds inflation at ~75%/yr — hyperinflation-shaped without numerical explosion. (If M5 wants true Weimar, raise the cap under a "regime collapse" flag.)
 
## 4. Stability Argument & Failure Modes
 
**Why this should converge on paper:**
- Household demand: gross substitutes (§2) → stabilizing.
- Intermediate Leontief demand is *not* price-responsive (fixed proportions) — the dangerous part — but it responds only to planned *output*, which moves on the slower time constant. On the price loop's timescale, intermediate demand is quasi-constant, so the fast subsystem is effectively gross-substitutes.
- ρ(A) = 0.41 bounds cost-ripple amplification; the geometric decay dominates the λ = 0.3 injection rate.
- The clamp is the last-resort Lyapunov guarantee: no single tick can move any price >15%, so nothing reaches NaN territory in finite time.
 
**Known failure modes, with stabilizers in escalation order** (add only when a property test actually fails — each stabilizer hides dynamics):
1. **Two-cycle flip-flop** (price overshoots up, then down, forever): halve λ; if persistent, damp using `0.5·(ED_t + ED_{t−1})` — the schema already carries last tick's excess demand for exactly this.
2. **Cobweb in a sector:** lengthen that sector's quantity-adjustment lag, or add inventories (below).
3. **Shortage spiral** (supply → floor, ED/S huge, price pegged at +15% forever): correct behavior for a real shortage! Verify via news items ("bread lines in the capital") rather than suppressing it. Only intervene if it happens under *passive* policy in >5% of seeds.
4. **Inventory buffer** (probably M1.5): `sales = min(D, S + inv)`, unsold output accumulates, inventory ratio feeds production planning. The single most effective oscillation damper and it adds realism for free — but adds state, so it waits until a test demands it.
 
**Property tests this section commits to** (into `tests/properties/`):
- `passive policy: all prices within [0.5, 2.0] of base through Q40, ≥95% of seeds`
- `price series has no 2-cycle: autocorrelation at lag 1 of Δp > −0.5, all sectors`
- `supply shock to ENE at Q8: TRN price rises within 4 qtrs, ≥95% of seeds`
 
## 5. Worked Example: The Fuel Tax (numbers, not vibes)
 
A fuel tax raises the price energy buyers face by 20%. Cost pass-through through the I/O table (`Δp = AᵀΔp + shock`, energy pinned at +20%), computed from the §1 matrix:
 
| round          | AGR    | MFG    | SVC    | TRN    |
|----------------|--------|--------|--------|--------|
| 1 (direct)     | +1.60% | +2.40% | +0.60% | +5.00% |
| 2 (indirect)   | +0.86% | +1.30% | +0.34% | +0.80% |
| **long-run**   | **+2.76%** | **+4.24%** | **+1.09%** | **+5.82%** |
 
Reading: transport gets hit hardest (energy is a quarter of its inputs), and **bread rises ~2.8%** — more than half of it arriving in *later* rounds through transport and manufacturing inputs, i.e., invisibly to a player who only thinks one step ahead. The M1 exit criterion "(a) fuel tax raises bread prices" now has a quantitative target: the emergent sim should land in the neighborhood of +2–3.5% on AGR within ~6 quarters (looser than the analytic number, since demand substitution away from expensive goods slightly mutes pure cost pass-through).
 
This table is also the calibration pattern for country generation (open question #3 in the design doc): generate A matrices, then *verify* their implied pass-through structure analytically before a single tick runs.
 
## 6. Filed for Later — Engine as API / MCP Server
 
Noting the side quest properly, because the architecture makes it nearly free and it's worth protecting:
 
**The engine's public API is already an MCP server's tool list.** `init(params, seed)`, `applyActions(actions)`, `step()`, plus `observe() → PublishedState` map one-to-one onto MCP tools; the action log is a transcript; a save file is a session. Because the engine is pure TS with zero DOM dependencies, wrapping it in a Node MCP server is a ~day of glue, no refactoring.
 
**The rule that keeps it interesting:** an agent playing via MCP gets `PublishedState` only — same fog as a human. A chatbot finance minister squinting at revised GDP numbers is the game working as designed; an agent reading `TrueState` is a debug tool (also useful — expose it, but as a separate, clearly-marked dev server).
 
Gameplay ideas this unlocks, in rough order of interest:
1. **Claude as advisor** — human plays UI, agent reads the same PublishedState and argues policy. (Two advisors with different priors arguing is basically a council of economists.)
2. **Claude as player** — batch-run agent games; compare agent policy trajectories against random/passive scripts in the balance dashboard. An agent that reliably beats passive policy is also a *playtest bot* that finds exploits overnight.
3. **Natural-language interface as the game** — "raise the fuel tax a bit and see the treasury through winter" as the entire UI. Doctrine Inc. energy.
 
Cost of keeping the option open now: zero, *if* the §1.1 boundary rules hold (no DOM in engine, PublishedState as the only outward type). Which is one more reason to lint-enforce them.
 
---
 
*Next candidates: the production step's partial-adjustment rule (the quantity time constant), or cohort budget/approval mechanics feeding the PC formula.*
