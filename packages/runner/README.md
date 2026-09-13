# @terrarium/runner

Headless evidence. Runs the ordinary engine over many seeds and countries under named policies
(`passive`, `developmental`, `random`, `regulated`) and reports the distribution: `pnpm batch`
for a balance sweep, `pnpm stability` for macro tails through 2050, `pnpm country-fuzz` for
replayable country-space exploration, `pnpm export-feedback` for paired counterfactuals.

Its policies are sampling strategies, not players; `pnpm replay <save.json>` (in `tools/`) is
the way to ask a balance question about a game somebody actually played. The measured baselines
and how to read them are in the `economics-review` skill.
