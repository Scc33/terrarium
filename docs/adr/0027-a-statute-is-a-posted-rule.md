# ADR-0027 — A statute is a posted rule; compliance is what the state can enforce

**Status:** Accepted · **Date:** 2026-08-23

## Context

Issue #110 asks for "a clear place for extending policies beyond just numbers", and observes that
the border ceiling is one law among many. Issue #96 asks for regulations. Both are asking for
something the cabinet cannot currently express.

Every action the game has reduces to a quantity. That is not an accident and it is not a
complaint — it is why the economy holds together, because each quantity enters production,
prices or the budget through a channel that already existed. But it means there is no way to say
*a rule now applies*:

| register | action | shape | takes effect | reversal |
|---|---|---|---|---|
| dials (Layer 1) | `setDial` | a continuous number | this quarter | free, symmetric |
| appropriations (Layer 1) | `setSpendingRule` | fixed / indexed / GDP share | this quarter | free, symmetric |
| ministries (Layer 2) | `investCapacity` | money bought as capacity points | eight quarters | decays on its own |
| institutions (Layer 3) | `reform` | a 0..1 stock, one `REFORM_STEP` at a time | generational | ratchets both ways |

A minimum wage is none of those. It is signed on a Tuesday and binding by Friday, which rules out
the constitutional register; it has no meaningful value at 0.37, which rules out a dial; and —
decisively — it costs more to repeal than to pass, which nothing above can express.

The thing that makes the missing register worth building is not the discreteness. It is that
Terrarium already teaches, twice, that a policy and its effect are separated by the state's
capacity to carry it out. `taxEfficiency(capacity.tax)` is the gap between a posted rate and
collected revenue. `adminEffectiveness(capacity.administrative)` is the gap between a voted
appropriation and delivered money. A statute is the third instance of the same gap — the distance
between a rule that is written and a rule that is obeyed — and unlike a tax, the party doing the
evading has a name, a power, and an opinion, because it is one of the four blocs already in the
room.

That also makes non-compliance the regulatory form of a rule the design already holds: **blocs
make levers expensive, never impossible**. A powerful, hostile bloc does not veto a factory act.
It ignores one.

## Decision

State carries `gov.statutes: StatuteBook` — a **total record over `STATUTE_IDS`**, each entry
holding only the level in force and the quarter it was written:

```ts
export interface Statute {
  level: number    // index into STATUTE_LEVELS[id]; 0 is always "no statute"
  enactedAt: Qtr   // phase-in and the repeal premium both read this
}
```

A statute is an **ordinal with named levels**, not a scalar. Each statute declares its own short
ladder in `STATUTE_LEVELS`, and every rung carries the words a player reads beside the number the
engine reads. Naming is the point: a rule that a level is *called* something is what separates
this register from a second rack of sliders, and a statute needing more than about three rungs was
a number all along.

**Compliance is derived, never stored.** `statuteCompliance(state, id)` reads the civil service,
the courts, and the resistance of every bloc that minds this statute; `statuteForce(state, id)`
multiplies the posted strength by that compliance and by how far the change has phased in. Every
pipeline step that reads a statute reads `statuteForce` and nothing else. Nothing about a statute
is stored that can be computed, for the same reason bloc power and the corridor coordinates are
derived: a second copy of a derivable number is a second thing that can be wrong.

**Resistance and price come from one table.** `STATUTE_STANCE` is the same `Stance` primitive the
dials and reforms already use, and it does two jobs: `vetoMultiplier` prices the enactment from it,
and `statuteCompliance` reads evasion off it. `politicalCostOfAction` remains the single source of
truth for what an order costs.

Three mechanics fall out of the pricing rather than being added to it:

- **A law defends itself.** The repeal premium is derived from `tick − enactedAt`, so a statute
  that has stood a decade is expensive to undo. No new state, and it is the correct politics: the
  constituency a programme creates outlives the government that created it.
- **A crisis passes legislation.** `reformWindowOpen` already discounts institutional reform when
  unrest is high; statutes take the same discount and the same veto relief. The factory acts, the
  New Deal and post-2008 bank regulation all went through a window somebody's crisis opened.
- **Enacting a law you cannot enforce is a real and legible mistake.** The full veto-loaded price
  is charged, the blocs spend their favour on it, and the economy barely notices — the same
  arithmetic as posting an income tax with no tax office.

**Compliance is published exactly**, and this is a deliberate boundary rather than a convenience.
Every input to it — `capacity.administrative`, `institutions.stocks.courts`, and each bloc's power
and favour — is *already* published unfogged, so a player with a pencil could compute the figure
from what the desk already shows. Publishing it leaks nothing and hiding it would be theatre. The
government knows the law and knows its own inspectorate; what it does not know is the economy the
law lands on, and that is fogged already. **This holds only while compliance reads published
quantities.** The moment a statute's compliance wants to read something the player cannot see, it
becomes an inspectorate survey with a lag and a band — the shape `IndustryPrint` already
established — and this paragraph is the thing to come back to.

Four constraints follow, and they are the review checklist:

- **A statute is inert at the setting it was inherited at.** The register ships with every statute
  at level 0 wired to nothing, and `pnpm diff-state --moved-only` is the proof. A rule whose mere
  existence moves the economy is a balance change hiding behind a law (ADR-0020's argument).
- **A statute enters the economy through exactly one channel that already exists, and its comment
  names the line it multiplies.** No `if (statute) gdp *= 0.98`. This is the most likely way the
  register ships broken, because in review a hand-authored coefficient looks exactly like a
  calibrated one. A statute needing a channel that does not exist yet does not ship until the
  channel does — which is why externalities (#95) is downstream work and not a fourth statute.
- **Compliance is never 1 by fiat and never 0 by fiat.** A statute fully obeyed in a state with no
  civil service is the same lie as a tax rate that collects itself. The floor and the ceiling are
  constants and they get measured.
- **Compliance is a consequence and never enters the minute book.** `ui/src/policyRecord.ts` files
  DECISIONS. Compliance moves every quarter on its own, so diffing it would report a policy change
  every quarter for eighty years — and it would look entirely plausible in review. Indexed
  appropriations sprang that exact trap once already.

Adding a statute id is a `SCHEMA_VERSION` event, as adding a game rule is. Those bumps are
`meta`-only and cheap to bless, which is a reason to add statutes in batches rather than singly —
and a reason never to pre-declare an id for a statute that is wired to nothing, which would put a
lever on the desk that does not work.

## Alternatives considered

- **Make each regulation another `DialPath`.** By far the smallest change: the cabinet, the minute
  book, the manual and the veto pricing would all absorb it for free, and `LEVER_COPY` would force
  it to be documented. Rejected because a dial is a number and a rule is not. A 0.37 factory act
  means nothing; the cabinet would gain a drawer of sliders no one can interpret; and a dial takes
  effect the quarter you move it and costs the same to move back. The three things that make a law
  a law — a named threshold, a phase-in, an asymmetric repeal — are exactly the three things the
  dial register cannot express.
- **Make each regulation another institution.** `INSTITUTION_IDS` already ratchets, already has a
  reform window, already carries a veto price, and `reform` would need no new action. Rejected
  because that register is the *constitution* — suffrage, press, labour rights, courts, repression
  — and its stocks are generational by construction, moving one `REFORM_STEP` per action. Ordinary
  legislation is not generational. Diluting the register would also corrupt the corridor, which
  reads those same stocks to place society on its y-axis: a minimum wage would start moving
  `societalPower`.
- **Model compliance as a cost rather than an efficacy** — a statute is fully obeyed but carries an
  enforcement outlay. Rejected because it makes weak states *pay* for regulation rather than *fail*
  at it, which is precisely backwards and deletes the only interesting thing here. It would also
  need a new `OutlayId`, a new appropriation and a budget schema change to arrive at a worse answer.
- **Ship the statutes without the register** — three bespoke booleans on `DialState`. Fastest route
  to a playable minimum wage, and it would have shipped this month. Rejected because #110 asks for
  *a clear place for extending policies*, and three bespoke flags are the opposite of a place: the
  fourth would be written by somebody who had forgotten the first three, none of them would reach
  the manual, and the compliance idea — the only reason regulation is worth modelling at all —
  would have to be re-invented per flag or dropped.
- **Store compliance on the statute and update it each tick.** Would let a statute's effect lag its
  enforcement and would make compliance visible in a state diff. Rejected as a second source of
  truth for a derivable number, and because the phase-in already supplies the lag that made it
  tempting.

## Consequences

- The engine gains one action, one derived pair, and one total record. Pipeline order is untouched,
  so this is not an ADR-0005 event.
- `PolicyRecord` gains a `statutes` field, so the minute book records enactments from the quarter
  the register exists, and a statute added later joins it without a second list.
- `packages/runner`'s random policy must learn to `enact`, or no sweep ever stress-tests a statute.
  That will move the random-policy baseline. It is a deliberate re-baseline, recorded in the
  `economics-review` skill with its reason — never blessed quietly.
- Golden replays need at least one case that actually enacts something, or the bless workflow
  reviews a register that never fires.
- The cabinet gains a sixth drawer. Because `LeverGroupId` is defined by subtraction from
  `CABINET_GROUPS`, adding the group makes it a lever drawer and fails the build until it is
  excluded and given a home — the mechanism `ui/src/levers.ts` already describes.
- No new indicator and no new overlay: nothing here is fogged, so nothing here is an instrument,
  and `rackHeadroom()` is untouched.
