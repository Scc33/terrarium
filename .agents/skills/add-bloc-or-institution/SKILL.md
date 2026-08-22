---
name: add-bloc-or-institution
description: Add a power bloc or a reformable institution to Terrarium's politics layer, or change an existing one's power, favour, or veto pricing. Use when touching pipeline/institutions.ts, BLOC_FAVOR_BASE, the stance tables in actions/apply.ts, or the BLOC_IDS / INSTITUTION_IDS lists. Covers the parts the compiler does not enforce, especially partial stance tables.
---

# Adding a bloc or an institution

Both id lists are total `Record`s across engine, observation and UI, so the build walks you
through most of the mechanical work. This skill is about the parts it does not.

## The trap: stances are `Partial`

```ts
type Stance = Partial<Record<BlocId, number>>
```

`DIAL_STANCE` and `REFORM_STANCE` are total over *levers* and *institutions* — but each row is
a **`Partial`** over `BlocId`. **A new bloc therefore compiles perfectly with no opinion about
anything in the game.** No error, no failing test, and a faction that never objects to a single
policy. Set dressing by default.

There are three tables to fill, not two:

| Table | In | Keyed by |
|---|---|---|
| `SUBSIDY_STANCE` | `engine/src/actions/apply.ts` | `SectorId` (spread into `DIAL_STANCE`) |
| `DIAL_STANCE` | `engine/src/actions/apply.ts` | `DialPath` |
| `REFORM_STANCE` | `engine/src/actions/apply.ts` | `InstitutionId` |

Scale is −1..1, and it reads **"how much do they mind an INCREASE"** — negative means they want
it *higher*. Moving a lever a bloc's way earns goodwill on the same scale. Get the sign
backwards and the faction quietly rewards the opposite of what it believes in.

## 1. The id lists

`BLOC_IDS` / `INSTITUTION_IDS` in `engine/src/state/schema.ts`. Follow the compile errors
outward — observation and UI both hold total `Record`s.

## 2. Power is DERIVED, never authored

A bloc's power comes from the economy, in `pipeline/institutions.ts` — never a constant. That
is the whole reason "a crisis is a political opening" falls out for free instead of being
scripted: when the economy moves under a bloc, its grip moves with it.

**What is authored is only what a bloc *wants*** — a preference, the same primitive as a
consumption weight. If you find yourself writing a constant for how strong a bloc is, stop.

## 3. `BLOC_FAVOR_BASE` must be measured

A total `Record<BlocId, number>` in `constants.ts`, so the compiler demands an entry — but the
*value* is a measurement, not a guess. Every favour sum is recentred by it so that **the 1946
settlement reads neutral** and every later reading is a verdict on the player's own policy.

The existing values were measured across countries at development 0.30–0.44 and negated. Do
the same: run the opening settlement, read the raw favour your new bloc resolves to, and negate
it. Skip this and the bloc starts the game already furious or already bought, and the player
never learns why.

This is the general rule, and it is load-bearing: **political responses are
reference-dependent**. Cohort approval judges income against an EMA of itself; bloc favour
judges policy against 1946; unrest judges hardship against experienced conditions. Each was a
*bug fix* — absolute thresholds made a do-nothing government inherit a capital strike, and
pinned unrest so flat that reform windows and revolts were both unreachable. Centre any new
political response the same way, and **measure the resting value before picking the constant.**

## 4. Exactly one economic channel

A bloc needs **one** channel for its hostility, through machinery that already exists — a risk
premium, an investment factor, a wage move. **A bloc that only taxes political capital is set
dressing.** One channel, not three: it has to be legible to a player reading instruments.

And blocs make levers *expensive*, never impossible. A hard veto would silently break the
load-bearing mechanism scripts (`tests/properties/fuel-tax.test.ts`, `subsidy.test.ts`), which drive
levers directly and are the design's load-bearing claims.

## 5. `politicalCostOfAction` is the single source of truth

Quote and charge must never be computed twice. `observe.ts` publishes reform prices straight
from `politicalCostOfAction` in `actions/apply.ts`. If you add a cost, add it there — a second
pricing path is a bug that shows up as a quote the player didn't get charged.

## 6. Name it in the UI

`ui/src/components/labels.ts` — `BLOC_NAMES` + `BLOC_NOTES`, or `INSTITUTION_NAMES`. A new
cabinet group also needs an entry in `CABINET_GROUPS` in `cabinetNavigation.ts`.

## 7. Re-measure

`tests/properties/institutions.test.ts` pins the claims. Beyond that:

- **Check the passive baseline did not move.** Passive means no actions, so no veto pricing
  ever ran — a politics change that moves it has leaked across the seam. See the
  **`economics-review` skill**.
- **A mechanic you cannot reach is not a mechanic.** Before shipping a threshold, measure the
  distribution of whatever it gates under passive, random, *and* deliberately bad play. Two early
  mechanics were dead on arrival at entirely plausible-looking numbers.
- **Suppression must cost something the boot cannot pay.** Repression damps grievance
  *multiplicatively* (never to zero) and corridor strain is added *outside* that damping.
  Subtract it linearly and the extractive path becomes strictly dominant.
- Unrest must read the hardship households *experienced* — cohort approval already aggregates
  it. Rebuilt from unemployment it comes out wrong-signed, because the subsistence valve keeps
  the impoverished nominally employed.
