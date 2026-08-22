---
name: verify-the-wall
description: Prove a Terrarium UI change actually fits on screen. Run after any change to the instrument wall, a gauge, a rack strip, an overlay, or wallPlan — and after adding an indicator. jsdom has no layout engine, so unit tests pass while the wall clips every figure it publishes; this checks the real browser at 1280x720 for overflow and below-fold content.
---

# Verifying the wall

`tests/ui/` tests **pure modules, not rendered components** — deliberately. jsdom has no layout
engine, so a render test passes happily while the wall clips every figure it publishes. That is
how earlier wall layouts hid their own output.

The browser check is the only thing that sees layout. It is not optional after a wall change.

## 1. Run the dev server

Start it through the preview tooling (never a bare shell command), then size the viewport to
**1280×720** — the reference viewport `wallPlan.ts` is pinned against.

## 2. Run the overflow probe

In the page console:

```js
(()=>{const w=document.querySelector('main > div'),b=w.getBoundingClientRect();let n=0;
w.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(r.bottom>b.bottom+1&&r.height>0)n++});
return {scrolls:w.scrollHeight>b.height+1, belowFold:n}})()
```

**Both values must be `false` and `0`.** Anything else is a real bug — the war room is a
single screen with no page scroll at desktop sizes.

## 3. Read what you changed

A clean probe means nothing overflowed *vertically*. It does not mean the tile is correct.
Also confirm by eye (or by screenshot):

- Every figure a tile publishes is actually visible — including the **right-hand edge**. The
  fourth WallTile failure mode shears content horizontally, and the probe above will not catch
  it because the sheared element is inside `overflow-hidden`.
- Gauge upper-bound labels survive a three-digit value, not just two.
- Rack strip labels are not truncated (`short` names are capped at 10 characters for exactly
  this reason).

## 4. Check the other states

The wall's hard cases are the empty ones. `/?gallery=1` opens the deterministic component
gallery — populated charts, empty and locked states, controls, every visual register, and the
shared overlay anatomy — in one screen.

Use the dev console (backtick) → SCENARIO to reach a well-surveyed country in one submission
instead of 116 clicks. Raise `statistical` to fit every instrument on the wall at once; that
is the densest layout the wall ever has to survive, and the one most likely to break.

## 5. Screenshot the result

Share proof with the change rather than asking anyone to check manually.

## Visual regression

```bash
pnpm test:visual
```

Compares the gallery and game states against committed screenshots in
`tests/visual/__screenshots__`.

```bash
pnpm test:visual:update
```

**Only after reviewing an intentional visual change** — this overwrites the baseline, and an
unreviewed update silently blesses a broken wall exactly the way `pnpm bless` can.

## If the wall is full

`rackHeadroom()` returning zero, or `tests/ui/wall-plan.test.ts` failing, means the wall is out
of vertical room. That calls for a real layout decision — a new section, a different density
model, something demoted from the board. It does not call for a smaller font, and it does not
call for raising the budget constant until the test passes.
