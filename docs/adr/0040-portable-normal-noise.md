# ADR-0040 — Normal noise is a portable sum of uniforms

**Status:** Accepted · **Date:** 2026-09-09 · **Issue:** [#246](https://github.com/Scc33/terrarium/issues/246) · **Extends:** [ADR-0001](0001-saves-are-replay-logs.md), [ADR-0002](0002-rng-substreams.md)

## Context

A Terrarium save carries replay inputs, not a snapshot. That makes the seeded RNG part of
the save format: the same country, seed and orders must produce the same country wherever the
save is opened.

`Sfc32Rng.next()` already meets that requirement with 32-bit integer arithmetic. Its
`normal()` helper did not. Box–Muller transformed two uniform draws through `Math.log` and
`Math.cos`; those functions differed by one unit in the last place on arm64 and x64 Node builds.
The difference then compounded through the feedback loops in a replay, and could reach an
election threshold before it merely looked like numerical noise.

Hash rounding cannot repair a divergent replay: no fixed decimal precision bounds how far a
perturbation can travel through a longer feedback loop. It would make the golden test quieter
without making a save portable.

## Decision

**`rng.normal()` is the centred, scaled sum of six packed uniform components from two
SFC32 output words.**

Each SFC32 word contributes three ten-bit components from its high thirty bits.
Those six components have mean 3 and variance almost 1/2; centering then multiplying by the
fixed binary64 representation of √2 gives a standard-normal approximation. The sampler uses
only the PRNG's integer-derived uniforms plus ordinary binary arithmetic; it does not call a
platform math library. The fixed draw count, component width and scale are named in
`constants.ts` and pinned by a fixture test.

The replacement keeps the zero mean and unit variance every existing noise consumer expects,
but it is deliberately not a perfect Gaussian: its support is bounded at ±4.24σ. This is a
simulation behaviour change. It is reviewed through goldens, the passive/developmental/random
baselines, all-country stability, and the load-bearing fuel-tax and subsidy properties before
the new golden states are blessed.

No state shape or pipeline order changes, so this needs no schema migration. Existing saves now
replay to the same corrected result on every supported architecture rather than to one of two
platform-defined histories.

## Alternatives

**Round `hashState` more aggressively.** Rejected. It masks a particular comparison at a
particular horizon, but cannot prevent an amplified difference from escaping the new rounding
floor, and leaves real save replays divergent.

**Keep Box–Muller and write portable `log` and `cos` approximations.** Rejected. A hand-rolled
transcendental library would be a much larger numerical surface to maintain merely to preserve
an exact tail shape the game had not calibrated as load-bearing.

**Use another fixed number of uniform draws.** Rejected. Six components retain a near-Gaussian
centre and the fixed √2 scale restores unit variance. Packing them into two PRNG words keeps the
cost of the prior Box–Muller sampler; fewer components have visibly flatter shoulders, while
more do not improve portability.

## Consequences

- Replays, golden hashes and election outcomes are portable across CPU architectures again.
- Every normal-noise consumer receives a new, deterministic sequence. Substreams still prevent
  that sequence change from shifting an unrelated pipeline step.
- The sampler cannot emit a shock beyond ±4.24 standard deviations. If a future mechanic relies on
  a fatter tail, it must model that tail explicitly and re-run this calibration rather than
  silently replacing the portable primitive.
- The sampler consumes the same two SFC32 words as the prior Box–Muller implementation. Its six
  components are quantized to ten bits and it discards two low bits from each word; the complete
  calibration and time-budget checks own that approximation cost.
