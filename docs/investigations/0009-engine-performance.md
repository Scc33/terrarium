# 0009 — Engine performance is dominated by runner bookkeeping

**Status:** Resolved as runner retention and allocation overhead, not expensive model behavior

**Raised by:** [issue #87](https://github.com/Scc33/terrarium/issues/87), which reported that
goldens, shock spikes, research tests, and long simulations appeared CPU- and memory-intensive.

**Measured at:** baseline engine `6a440cb`, Node 24.3.0 and pnpm 10.12.3. The first candidate
figures are from the `codex/engine-performance` working tree directly atop `6a440cb`. After
upstream advanced, the same diff was refreshed and rechecked atop `d42aeec`; replace the branch
name with its landed commit when the work is merged. Timings are local wall-clock measurements
and should be compared by ratio, not treated as machine-independent budgets.

## The short answer

The exact goldens are not the expensive workload: their two 40-quarter test bodies completed in
about 35 ms at `6a440cb`. The long-horizon property/stability samples really do execute tens of
thousands of engine ticks, but profiling found that avoidable bookkeeping amplified the cost:

1. `runOne` serialized each final statistical-office century into a state hash even when the
   batch, stability report, or property test never read that hash. In a profiled 200 × 400-quarter
   passive batch, `stableStringify` and hashing accounted for roughly 32% of CPU samples.
2. The ordinary batch report retained a full nested diagnostic point for every quarter of every
   run, although its output consumes only one aggregate row per run.
3. Every `rngFor` call manufactured several closures. Statistical prints create many short-lived
   named substreams per quarter, so runtime function construction and name bookkeeping became a
   leading engine-only cost despite the PRNG arithmetic itself being tiny.

This was therefore a data-retention and allocation problem around the simulation, not evidence
that shocks, research, or another economic channel needs simplification.

## Measurement

The representative batch was 100 passive runs × 400 quarters. Heap deltas were measured after
forced collection while retaining the returned result; peak RSS came from `process.resourceUsage`.
The engine-only case ran the same 100 centuries without trajectories or final hashes.

| workload | `6a440cb` | candidate atop `6a440cb` | change |
|---|---:|---:|---:|
| engine-only 100 × 400 | 3,244 ms | 2,225 ms | **31% faster** |
| ordinary batch 100 × 400 | 5,325 ms | 2,336 ms | **56% faster** |
| ordinary batch retained heap | 38.6 MiB | 1.9 MiB | **95% lower** |
| ordinary batch peak RSS | 353 MiB | 257 MiB | **27% lower** |
| future-stability property | 6,187 ms | 3,045 ms | **51% faster** |

The detailed programmatic `runBatch` remains available for callers that genuinely consume hashes
and trajectories. On the same 100 × 400 sample it fell from 5,325 ms at `6a440cb` to 4,278 ms in
the candidate (20% faster), while retaining the same 38.6 MiB of trajectory data by design.

The post-refresh `d42aeec` side-by-side check reproduced the result: engine-only time fell from
3,304 to 2,400 ms (**27%**), ordinary batch time from 5,514 to 2,584 ms (**53%**), and retained
heap from 38.6 to 1.9 MiB (**95%**). The exact engine-only checksum matched on both sides.

## Changes made

- `rngFor` now seeds one `Sfc32Rng` object whose methods live on a shared prototype. The xmur3 and
  sfc32 integer operations, six warm-up draws, and resulting streams are unchanged.
- `runOne` keeps its detailed, hashed default but exposes an explicit no-hash path for diagnostics.
- `pnpm batch` streams every detailed point into a `RunSummary` and retains only one row per run.
- `pnpm stability` still retains the full trajectories required by event windows and driver
  decompositions, but it no longer serializes unused final-state hashes.
- Runner lookups scan only the newest release-date suffix and new wire items, rather than copying
  or searching full histories.
- Policy records clone their two nested dial tables directly instead of invoking
  `structuredClone` every quarter.

## Behavior proof

No fixture was blessed and no calibrated constant changed.

- `pnpm diff-state --moved-only`: zero values moved in both exact golden cases.
- At `6a440cb`, the independent 400-quarter `hash-bench` state remained `03a00dad`; the
  100-century engine-only checksum remained `106343.68433627498` before and after. After the
  upstream refresh, current master and the candidate both produced hash `9cf061de` and the same
  checksum.
- The RNG unit test pins exact uniform and normal draws from a fixed `(seed, label, tick)` tuple.
- At `6a440cb`, all 445 tests, typecheck, lint, build, and coverage passed; coverage was 97.08%
  statements and 85.08% branches. After refreshing to `d42aeec`, all 503 tests and the same gates
  passed; coverage was 96.94% statements and 85.27% branches.
- The 1,000-run random, passive, and developmental medians exactly matched the schema-24 baselines,
  with zero NaNs or price explosions. The all-country stability sweep reported no reachable
  non-finite values and no reachable passive/developmental price explosions.

## What remains

The stability analyzer legitimately retains detailed trajectories, then builds derived reading
arrays for event-conditioned windows. A future pass could make that analysis incremental, but it
is a separate design problem: shock windows need look-ahead and several reports reuse the same
quarter. Parallel workers may also improve throughput, but they would add coordination and
determinism concerns before exhausting the now-smaller single-process allocation costs.

The remaining exact hash cost is intentional for callers that ask for a hash. Replacing
`stableStringify` with a streaming canonical serializer could remove its large temporary string,
but only if byte-for-byte hash compatibility is proved first; skipping hashes that nobody reads
was the safer optimization.
