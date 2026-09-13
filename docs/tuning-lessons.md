# Hard-won tuning lessons

Calibration knowledge: for each constant that matters, the failure its value prevents. This is
the living register beside `docs/adr/` (decisions, immutable) and `docs/investigations/`
(measurements not yet believed) — see the `document-a-decision` skill for which is which.

Read the lesson beside the constant you are about to touch, and add one when a retune teaches
you something: state the rule, then the failure it prevents, concretely enough to recognise the
symptom. A lesson that only says what to do gets ignored the first time it is inconvenient.

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
- **Human-development income goalposts are global, fixed engine units.** Schema 38 measured
  funded authored countries at p01–p99 6.3–113.8 real GDP/head and 400 validator-legal drafts at
  2.60–183.23, which is why `HUMAN_DEVELOPMENT_INCOME_MIN/MAX` are 2.5–200. Do not rebase them to
  the country's 1946 value or a trailing window: either makes two countries with the same living
  standard print different income dimensions and redraws development under its own needle. The
  composite joins published component prints by quarter and revision; reading truth and adding a
  second noise draw would make it a back door around the fog (ADR-0033).
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
- **What it cost was inequality, and the cause was a supply-side gap that is now closed
  (ADR-0032).** Services are staffed 60% by professionals and the class transition used to move
  people rural → urban and nowhere else, so `professionals` was a fixed 12.2% of the non-retired
  population for four hundred quarters. It now has a second boundary: SCHOOLS set the ceiling —
  a ratio to the pair the country opened with, so passive play is bit-identical — and the
  SHORTAGE of professional work decides who crosses. That refunded the whole political cost of
  the basket: developmental deposition 15% → 7%, Meridia's Gini 0.512 → 0.451, and
  `ENGEL_ELASTICITY.services` went 0.32 → 0.45, so the service share now RISES with income
  (33.4 → 34.2) instead of stopping flat. **Deposition is now flat at 7% across η ∈ {0.32, 0.45,
  0.60}** where it used to run 9% → 15% → 21%; what the elasticity still trades is the service
  share against the Gini and the living standard, which is Baumol. `docs/investigations/0015`.
- **A gate has to be reachable in the units the model actually has.** The first version of that
  second boundary was gated on a service wage premium, mirroring the wage gap that already pulls
  people into the cities. It is unreachable, and not marginally: professionals and urban workers
  both earn `wages.services`, so there is no wage a professional earns that an urban worker does
  not — and services is the LOW-wage sector until roughly 2005 in every century the catalogue
  runs (0.64–0.83 against the industrial mean). The gate clamped to zero for the first sixty
  years of the playable century and the mechanism looked correct in code review. It is gated on
  `skillTightness` instead: the jobs `LABOR_SOURCE` hands a cohort against the people in it,
  which is where the shortage is actually visible.
- **Cohort income does not know how many people are in the cohort, so demography cannot reach
  composition.** `LABOR_SOURCE` splits each sector's payroll by a fixed recipe and `PROFIT_SHARE`
  / `TRANSFER_SHARE` are fixed too, so moving a head between cohorts transfers no money — it
  divides the same wage bill differently. Measured: six points of the population moved into the
  professional class moves the Gini 3.7 points and the service value-added share **−0.22
  points**. Cohort size reaches income per head (and therefore the Gini, approval, vital rates,
  migration and the Engel weights), the labour force, and politics. It does not reach the
  industrial census. This is the third measured wall in front of #97 and it rules out the labour
  force the way 0016 ruled out elasticities; what is left is capital allocation, which
  `pipeline/labor.ts` currently does by utilization pressure with no policy input at all.
  `docs/investigations/0018`. **Amended at schema 43 (ADR-0035):** the "transfers no money"
  half is now true only where the table is unconstrained. Rationing means a cohort's SIZE sets
  how many posts it can hold, so moving a head does move wage income once a class is short or
  spare. The conclusion is unchanged and the reason is unchanged — sector employment is still
  set by demanded output, so none of it reaches the industrial census.
- **A rationing fix has to say where the displaced thing GOES, and the circular flow usually
  decides for you.** `LABOR_SOURCE` handed out 120-126% of the rural labour force, and the obvious
  fix — cap each cohort at its own labour force — deletes money: `production` charges each sector
  `wages[sid] x employment[sid]`, so a post left unfilled is a wage the firm paid and no household
  received. Every displaced post must go to somebody, which is why the ration and the substitution
  could not ship as two changes and why there is no inert setting for either (ADR-0035). Before
  scoping a capacity constraint as "just clamp it", find the identity on the other side of the
  clamp. **And when the two sides are irreconcilable, say which one wins and spread the loss
  evenly** — at `init` a country really can have more posts than people (Costona opens at 1.021
  jobs per person, 39% of procedural seeds are overdrawn, investigation 0021), and the first
  version handed the whole impossible part to whichever cohort was largest in each sector. That
  read as ONE class at 1.113x with its neighbours at exactly 1.000: a plausible number, not a
  visible defect. Pro rata on the labour force instead, and the overdraft becomes one legible fact
  about the country. **The corollary is that it was nearly free:** `LABOR_SOURCE` never reached production, so
  the whole change moved passive growth 2.82 to 2.84 %/yr and left `realGdp` out of the top 400
  moved values entirely. What moved was distribution — urban workers' approval up 7%, because they
  had been scored against an accounting artifact, and deposition fell on all four policies for it.
- **The goldens run Meridia and the default batch runs the generated frame around it, so
  neither can see a bug that needs a different country.** `tools/golden-cases.ts` is `standardCountry` three times and `pnpm batch`
  defaults to `--country baseline`. Meridia opens at 0.929 jobs per person, which is the one
  curated country where the ADR-0035 opening overdraft cannot appear — so a blessed diff and a
  clean four-policy baseline were both entirely consistent with Costona reading 1.113x at q0.
  This is ADR-0028's pollution baseline again (the reference country is the one where the bug
  cannot show), and it is now twice. Reach for `--country all` whenever a change touches something
  the catalogue varies: the opening vector, the class structure, the industrial mix.
- **A price elasticity in the basket does not reach the industrial census — measured, not assumed.**
  CES was implemented and swept over σ ∈ {1, 1.5, 2, 3}: the basket's response to a 25% price fall
  rises monotonically (+6.1% → +10.3%) and the value-added share does not follow (+3.02 → +2.82
  points), because household consumption is one part of final demand and a cheap sector is an input
  to every other sector. `HOUSEHOLD_SUBSTITUTION` ships at 1 for that reason. **What actually binds
  is that a deficit-financed subsidy RAISES the price it was meant to lower** — +3.4% on
  agriculture, +12.9% on services — because the money lands in profits and the demand outweighs
  the unit-cost relief; tax-funded, the same subsidy takes 21–33% off the price. Point the next
  steerability attempt at capital allocation — 0018 has since ruled out the labour force too, so
  that is the only direction 0016 named still standing. `docs/investigations/0016`.
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
  the administrative ministry is worth +15.7 % on the margin and +29.8 % over the same century,
  because a capacity is a stock nothing arbitrages away. The two rankings are in OPPOSITE ORDER,
  so measure a new lever at both horizons before quoting either. The same study's sharpest
  reading is that building all four ministries raises FDI a third as much as building only
  administration, because a capable tax office collects the corporate rate that was
  posted-but-uncollected and hands the difference to the same term — state-building is not
  monotone in every channel. `docs/investigations/0017`, `pnpm fdi`.
- **A cooldown sets the PERIOD of repetition; it does not remove it.** The wire's first
  anti-repetition rule was a flat fourteen quarters, which meant a permanently true condition — an
  unschooled country, comfortable reserves — printed the identical sentence every fourteen quarters
  for eighty years. That is the original complaint with a longer wavelength. The cooldown now
  doubles per filing, so a STANDING condition fades to five or six mentions in a century while a
  genuinely recurrent event is untouched (its gaps were never near the cooldown). Any "don't repeat
  yourself" rule over a persistent state needs this shape.
- **A floating currency is a shock absorber, and it is worth several points of difficulty.**
  Giving the exchange rate a fundamental it reverts to (ADR-0034) took passive deposition from 9%
  to 2% and developmental from 7% to 2% over 1000 × 400q, while leaving century growth at 2.83 and
  3.06 %/yr. The per-country split is the reading to keep: Costona and Kestrel, whose
  governments fall for political rather than macroeconomic reasons, barely moved (23→24% and
  34→28%). An absorber rescues a country whose only problem was volatility and does nothing for
  one in real trouble — so if a future stabilizer moves the HARD countries, it is not an absorber,
  it is a balance change.
- **A nominal exchange-rate lever is a medium-run instrument, because prices catch up.** Measured
  passthrough of a 30% devaluation into domestic prices: 23% within eight quarters, effectively
  complete by four years. So the standing order is worth +7.7% of exports and +3.7% of real GDP at
  ten years, +5.3% and +0.9% at thirty, and −3.5% and −4.2% at a century against a floating
  control — the mercantilist bargain is fifteen good years bought with a century of shipping a
  tenth of GDP abroad. Export SHARE moves +0.57 pp at ten years and +0.73 pp at thirty, alongside
  the zero tariff (+0.6 pp) and far below tax capacity (+3.9 pp) in investigation 0010's table.
  What survives is the reserve stock, which is the "a lever that moves a PRICE gets undone; a
  lever that moves a STOCK compounds" lesson in its third register. Quote both horizons or
  neither, and mind the units: the paired study reports levels as relative % and the share in
  POINTS, because 0010 is in points.
- **A paired study has to be paired in EVERY treatment, including the ones it did not intend.**
  `pnpm currency`'s arms differed in the currency order and, silently, in state capacity: posting
  the order costs political capital, `runOne` leniently skips whatever capacity bid that leaves
  unaffordable, and the +10% arm skipped 34.5 orders a run against the float's 18.0 and ended a
  century with 1% less total capacity. It was suppressing the lever's medium-run gain AND its
  long-run cost — +6.0% of exports at ten years and −2.4% of GDP at a century, against +7.7% and
  −4.2% once the arms were funded to the same path. The sections that measure a CHANNEL now run
  under `unlimitedCapital` and say so; what an ordinary budget buys is the batch baselines'
  business. Same family as the statute book's lenient-experiment lesson, one level up: it is not
  enough for the experiment to be strict about the thing under test, it has to be strict about
  everything else too.
- **Full PPP passthrough removes the price level's only way out.** `FX_PARITY_PASSTHROUGH` is 0.35
  rather than 1 because `world` mean-reverts its prices to 1 and so has no productivity trend,
  while a developing country's traded-goods prices fall for a century. At 1.0 the currency chases
  that the whole way, a developmental century ends against the bottom rail, and — worse — domestic
  deflation stops buying any competitiveness back, so a currency that is too dear becomes a
  problem the price level is locked out of helping with. Even at 0.35 it costs 0.25 pp/yr of extra
  developmental deflation, which is what pushed `price_food` and `price_fuel` off their faces.
- **A stock-flow test has to say where the money GOES, and "nowhere" is a state the compiler
  likes.** For twenty-odd schema versions `fiscal` computed `repaid = min(max(0, balance), debt)`,
  which is correct arithmetic, type-safe, covered by a passing composition test, and deleted three
  quarters of every tax the treasury collected once debt reached zero (ADR-0037). What made it
  invisible is that `budget-composition.test.ts` asserts `revenue − outlays === balance` and stops
  there: the identity it checks is the one BEFORE the money is disposed of. When you add a
  financing branch, write the destination identity down as a comment and then as a test — and
  count the branches, because the bug was a missing `else`.
- **A destination is not the same as a stimulus, and the baseline will tell you which you built.**
  The issue that raised this predicted every baseline would move, since money that used to vanish
  now re-enters the economy. Measured, passive, developmental and regulated are BIT-IDENTICAL over
  400 quarters on all five countries, because the destination chosen by default is a fund held
  abroad. That is the right outcome and it is worth knowing before you go looking for the movement
  you were promised: the fix closes the books, and turning the money into demand is an order the
  player gives.
- **Give components of one identity RELATIVE noise, not one absolute band.** The expenditure
  shares span two orders of magnitude (consumption ~78 %, government <1 %), so a band honest
  about the big one prints the small ones negative — and a share below zero cannot be drawn as a
  wedge at all (`donutSlices` drops it). See `docs/investigations/0002`.
- **Bumping down conserves jobs; it redistributes who is idle (ADR-0036).**
  `OVERQUALIFIED_HIRING_PREFERENCE = 0.5` halves a reachable professional surplus without
  erasing it; zero skips the phase and moves no golden value. Walk high to low, one rung at a
  time, and allocate pro rata or source order becomes a hiring institution. Do not “account for”
  underemployment by adding it to `flows.unemployment`: the lower sector wage already reaches
  income, approval and migration, while the headline's readers need people with no job. Adding
  the same hardship again invents investment demand or charges a household twice.
