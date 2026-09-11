# 0022 — Golden replays are not reproducible across CPU architecture

**Status:** Open — root cause confirmed and localized to the exact operations; no fix has
shipped. Per the tracking issue, this needs its own economics review before any change lands
(#246): "Likely needs researching first before implementation."

**Raised by:** while fixing #230 (labour-market survey), `fuel-tax-40q` and `competition-act-40q`
passed on every local run but failed in CI (`ubuntu-latest`, x86_64). `d57a867` re-blessed
`competition-act-40q` to CI's canonical hash as an unblocking measure and named the suspected
mechanism; this investigation confirms it with a direct, isolated measurement and quantifies it.

**Measured at:** `46a0a56` (current `origin/master`), 2026-09-08. `packages/engine/src/rng/rng.ts`
and `packages/engine/src/hash.ts` are byte-identical between the pre-#230 commit this bug was
first observed on (`3ad8b36`) and this stamp, so the measurement applies unchanged to both.

## Method

Downloaded the official `node-v24.3.0-darwin-x64` build alongside the machine's native
`darwin-arm64` build (same Node version, same V8, different architecture — the closest
same-machine proxy available to genuine `ubuntu-latest` x86_64 without provisioning a Linux box).
Re-implemented `xmur3Seeds` / `Sfc32Rng.next()` / `Sfc32Rng.normal()` verbatim from `rng.ts` in a
standalone script (no build step, no engine dependency) and ran it under both binaries:

- 200 independent substreams seeded exactly as `rngFor` does (`` `${seed}\0${label}\0${tick}` ``,
  6-draw warm-up), 500 `normal()` draws each — 100,000 draws total.
- For every draw, recorded the raw IEEE-754 bit pattern (not the decimal value, which can print
  identically while the underlying bits differ) of: both `next()` outputs feeding the draw
  (`u1`, `u2`), `Math.log(u1)`, `Math.sqrt(-2 * log)`, the `cos` argument `2π·u2`, `Math.cos(...)`,
  and the final `normal()` output.
- Compared arm64 vs. x64 bit-for-bit, per intermediate value, across all 100,000 draws.

## The finding

| stage | operation | diffs / 100,000 | rate | max ΔULP |
|---|---|---|---|---|
| `u1`, `u2` | `next()` (32-bit int math) | 0 | 0.00% | 0 |
| `logU1` | `Math.log` | 1,633 | **1.63%** | 1 |
| `sqrtTerm` | `Math.sqrt(-2·logU1)` | 0 *(given identical input)* | 0.00% | 0 |
| `cosArg` | `2·π·u2` (multiply) | 0 | 0.00% | 0 |
| `cosTerm` | `Math.cos` | 453 *(given identical `cosArg`)* | **0.45%** | 1 |
| `normal()` | combined | 1,157 | 1.16% | 2 |

Also swept `Math.pow(rate, r)` for `rate ∈ {0.5, 0.62, 0.7, 0.85, 0.9, 0.95, 0.99}`, `r ∈ [0, 40)`
— the shape `statistics.ts` uses for revision settling (`STAT_REVISION_SETTLING_RATE ** r`).
Bit-identical across architectures for every value tested; not implicated.

This **confirms and sharpens** the mechanism `d57a867` named:

- `next()` (pure `|0`/`>>>0` integer arithmetic) is exactly what ADR-0002 needs it to be:
  bit-identical across architectures, always, as IEEE 754 integer ops must be.
- `Math.sqrt` given identical input never diverges — it's a required-correctly-rounded IEEE
  operation implemented directly in hardware on both architectures. It is not the leak.
- **`Math.log` and `Math.cos` are the leak**, and independently so — `Math.cos` diverges in
  0.45% of calls even when handed a bit-identical argument, so the divergence is not solely
  inherited from `log`. Each divergence is exactly ±1 ULP (this is last-bit rounding
  disagreement between two software transcendental-function implementations, not a bulk
  precision loss), consistent with a library boundary rather than a domain-specific edge case.
- **It is not a boundary-value effect.** The original hypothesis (values near 0 or π/2) implied
  a narrow, identifiable danger zone. The measured rate — 1–2% of calls, spread across 100,000
  draws over 200 independent seeds — says the disagreement is diffuse across the whole domain.
  There is no input range to special-case around.

## Why the existing 10-significant-digit rounding in `hashState` doesn't catch this

`stableStringify` already rounds every number to 10 significant digits before hashing
(`hash.ts:10`), specifically to absorb serialization noise. A single ±1-2 ULP disagreement is
~15-16 orders of magnitude below that threshold — far too small to flip a rounded digit by
itself.

The reason it still flips golden hashes is that the disagreement doesn't stay that small.
`fuel-tax-40q` and `competition-act-40q` run 40 ticks through a pipeline with real feedback loops
(prices → demand → output → wages → prices; asset values → collateral → credit → asset values,
per the finance-loop tuning lesson in AGENTS.md). A ~1-ULP perturbation introduced at tick *k*
compounds through every later tick's arithmetic on the perturbed state, the same way any chaotic
or merely-compounding system amplifies a small initial difference over enough iterations. By
tick 40 the two architectures' state can differ well past the 10th significant digit — which is
exactly what was observed (`realGdp` matching to only ~6 decimals in one report, ~12 in another,
depending on which case and how far the perturbation had compounded by the print tick). `passive-40q` staying bit-identical is not evidence the mechanism spares it — it is evidence
that particular 40-tick action log happened not to draw a divergent `(u1, u2)` pair, or drew one
late enough that it hadn't compounded past the rounding floor yet.

**This means rounding `hashState` more aggressively is not a fix**, only a bigger version of the
same luck. A save with more ticks, more instruments (per #230, this PR added two heavy new
`rng.normal()` consumers — the industry census and labour surveys, drawing per sector/class/table
/revision/lag every tick), or a longer-running century has proportionally more draws and more
compounding time to escape whatever threshold is chosen. There is no rounding precision that is
provably safe for an arbitrarily long replay.

## Why this is more than a test-suite nuisance

ADR-0001 and ADR-0002 are explicit that saves are replay logs, not state snapshots, *because*
the engine is pure and deterministic — and that "a nondeterminism bug corrupts saves... it cannot
be quietly tolerated." A save exported on one architecture and opened on another (a player moving
between a Mac and a Linux machine; a save shared with someone on different hardware; a build
produced by CI infrastructure vs. run locally) is exactly the scenario this bug breaks. This is a
product correctness question, not only a CI-flakiness one.

It is also worse than "the numbers drift a little," because at least one `rng.normal()` call
site feeds a **discrete threshold**, not a continuous quantity: `politics.ts:138`,
`` const won = approval + swing + rng.normal(0, ELECTION_OUTCOME_NOISE_SD) >= threshold ``. A
single ULP of difference landing near that threshold doesn't produce a slightly-different
number — it can flip which government wins an election, which then diverges every downstream
institution, veto price, and policy from that tick forward on one architecture and not the
other. The chaotic-amplification story above doesn't need 40 ticks to matter if it lands on a
branch point like this one.

## Options considered (none implemented)

1. **Round `hashState` to fewer significant digits.** Rejected above: the divergence is not
   bounded in magnitude, so no fixed rounding threshold is safe for an arbitrarily long replay,
   and it does nothing for the real bug (save non-portability) — only for the golden test's hash
   comparison at whatever tick count happens to be tested.
2. **Replace `Sfc32Rng.normal()`'s Box–Muller transform with a sum-of-uniforms (Irwin–Hall / CLT)
   construction** using only `next()`, `+`, `-` (all exact, already-proven cross-platform
   operations) — e.g. summing 12 `next()` draws and subtracting 6 for a mean-0, variance-1
   approximate normal. This removes `Math.log`/`Math.cos` from the RNG entirely, which is the
   only approach that actually closes the save-portability hole rather than hiding its symptom.
   Costs identified so far, none yet resolved:
   - Every one of the six pipeline files that call `.normal()` (`prices`, `statistics`,
     `politics`, `finance`, `world`, `trade`) draws from the *same* class, so this re-blesses
     every golden case and every calibrated baseline in `AGENTS.md` / the `economics-review`
     skill — this is not a scoped, low-risk swap.
     Sum-of-uniforms has thinner tails than a true Gaussian (bounded to exactly ±6σ at 12 terms,
     lower kurtosis), which could matter anywhere a calibrated constant assumes real Gaussian
     tail mass — `ELECTION_OUTCOME_NOISE_SD` and the finance loop's `ASSET_VOL` are the two
     places a fatter/thinner tail is most likely to be load-bearing, since both interact with a
     discrete or ratchet-like threshold rather than a smooth continuous readout.
   - Must be checked against `tests/properties/fuel-tax.test.ts` and `subsidy.test.ts`
     specifically — these are named as the load-bearing design claims that are wrong to "fix"
     the test around if broken.
3. **Keep Box–Muller, replace `Math.log`/`Math.cos` with a hand-rolled, portable polynomial
   approximation.** Not seriously pursued: this is reimplementing fdlibm badly, for a normal
   generator whose exact shape nothing here actually depends on — option 2 gets the same
   determinism guarantee for far less code and far less risk of a subtler, harder-to-audit
   precision bug.

## What this does not yet answer

- Whether the tail-shape difference in option 2 is actually detectable in any calibrated
  baseline, or is swamped by the same noise scales the current tuning already treats as
  incidental. Nobody has run the sweep.
- Whether `pnpm bless` should move into CI/a pinned container rather than a contributor's own
  machine, given that the canonical hash is now — implicitly — "whatever `ubuntu-latest` says,"
  and a contributor blessing locally on arm64 produces a golden file that fails for every other
  arm64 contributor. This is a process question independent of which technical fix is chosen.

Re-measure the divergence rate if `rng.ts` changes for any reason before acting on the numbers
above — they are stamped to `46a0a56` and will drift the moment the RNG does.
