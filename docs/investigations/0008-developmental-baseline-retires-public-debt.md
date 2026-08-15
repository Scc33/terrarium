# 0008 — The developmental baseline retires all public debt

**Status:** Resolved as a baseline-methodology problem, not an engine-accounting bug

**Raised by:** [issue #88](https://github.com/Scc33/terrarium/issues/88), after a 1,000-run
developmental century reported final debt/GDP of zero in every percentile.

**Measured at:** engine `689ac2b`, 1,000 × 400-quarter reproduction plus 200 paired seeds × five
400-quarter mechanism scenarios. The memory-safe harness is
`pnpm debt-baselines -- --runs 200 --ticks 400`.

## The short answer

The zero is real: the treasury pays the debt stock down to exactly zero. It is not report
rounding, a stale cached ratio, or nominal GDP merely outgrowing positive debt.

The named `developmental` runner policy is a capacity-isolation experiment, not a fiscal or
historical baseline. It does two things whose fiscal interaction is unusually austere:

1. It repeatedly builds **tax capacity**, raising the efficiency with which unchanged tax rates
   collect from growing wage, profit, and import bases.
2. It leaves every inherited programme under its 1946 **fixed-cash** rule. Nominal transfers,
   procurement, and investment therefore remain flat while nominal GDP grows. The `$2` ministry
   builds are fixed cash too, and attempted builds are skipped while a ministry is full.

The fiscal step applies every surplus to principal:

```ts
const repaid = Math.min(Math.max(0, balance), gov.debt)
const debt = Math.max(0, gov.debt + borrowed - repaid)
```

Falling principal then removes interest outlays, reinforcing the surplus. Once the stock reaches
zero the engine does not create a negative-debt sovereign asset, so further surpluses leave the
ratio at zero.

This is valid engine arithmetic for the policy submitted. What was wrong was describing that
policy as a “plausible century” and treating its last ratio as a debt calibration target.

## Exact reproduction

The issue command was rerun on the same `batch-0` through `batch-999` seeds:

```text
pnpm batch -- --runs 1000 --ticks 400 --policy developmental

deposed: 122 (12%), median quarter 336
real growth %/yr       p05=2.32  p25=2.42  p50=2.53  p75=2.65  p95=2.77
mean inflation %/yr    p05=-0.28 p25=-0.21 p50=-0.16 p75=-0.10 p95=-0.01
mean unemployment %    p05=8.69  p25=9.01  p50=9.30  p75=9.57  p95=9.96
final debt/GDP %       p05=0.00  p25=0.00  p50=0.00  p75=0.00  p95=0.00
ever debt-free: 1000 (100%), median first quarter 62
```

Mean inflation is negative, so surprise inflation is not erasing the ratio. All 1,000 numerator
stocks actually hit zero, typically about 15.5 years after 1946. The engine continues raw
simulation after deposition, but 100% of the paired sample was still in power through quarter 80
and every one was already debt-free by then.

A separate 1,000 × 400 passive reproduction also had zero NaNs and price explosions, and all
1,000 runs eventually reached zero debt (median first quarter 79). Tax-capacity investment is
therefore an accelerator, not a necessary condition for the terminal result.

The engine does not force debt low under active fiscal variation. A 1,000 × 120 random-policy
sweep had zero NaNs and price explosions, with median final debt/GDP 33.57% and p95 68.43%.
Thirty-five percent of those paths touched zero at some point, so reporting the final stock and
the first-zero event separately is material outside the capacity baseline too.

## Isolating the two channels

The harness runs each seed under the current policy and three counterfactuals. `dev-no-tax`
builds administrative, statistical, and education capacity but not tax capacity.
`dev-GDP-share` converts the three nonzero inherited programmes to their current official-GDP
shares at quarter four. The final row does both. No true GDP enters the action: the shares use
the statistical office's latest published nominal level.

Medians below use the final eight quarters through quarter 80, when every government in every
scenario remained playable. Fiscal flows are shares of quarterly GDP; debt divides by annualized
GDP.

| scenario | debt-free by q80 | median first q | debt/GDP | revenue/GDP | programmes/GDP | capacity/GDP | interest/GDP | balance/GDP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| passive | 54.0% | 75 | 0.0% | 6.6% | 3.7% | 0.0% | 0.1% | +2.7% |
| developmental | **100.0%** | **62** | **0.0%** | 11.3% | 3.9% | 0.7% | 0.0% | **+6.6%** |
| dev-no-tax | 7.0% | 78.5 | 8.6% | 6.6% | 3.4% | 0.5% | 0.5% | +2.2% |
| dev-GDP-share | 57.5% | 76 | 0.0% | 11.3% | 7.0% | 0.7% | 0.1% | +3.5% |
| dev-no-tax+GDP | **0.0%** | — | **38.8%** | 6.6% | 7.0% | 0.4% | 1.5% | **-2.3%** |

Removing tax-capacity investment delays the current policy's debt payoff substantially. Removing
fixed-cash erosion also matters, but the much stronger tax office is enough to retire debt in
more than half those runs. Only removing both channels preserves the inherited debt stock across
the first 20 years.

The longer horizon makes the fixed-cash effect especially plain:

These are raw engine paths, matching the ordinary batch report. At quarter 400, 94.5% of the
passive, 82.5% of the developmental, and 92.0% of the GDP-share developmental governments were
still in power, so the medians are not being set by a majority of unreachable states.

| scenario at q400 | nominal GDP multiple | standing-programme multiple | revenue multiple | revenue/GDP | programmes/GDP | balance/GDP |
|---|---:|---:|---:|---:|---:|---:|
| passive | 15.19× | **1.00×** | 6.39× | 3.2% | 0.5% | +2.8% |
| developmental | 9.78× | **1.00×** | 20.70× | 16.4% | 0.7% | +15.5% |
| dev-GDP-share | 18.19× | 18.53× | 38.32× | 16.5% | 7.1% | +9.3% |

Even passive play eventually retires every debt stock because programmes never move in cash
terms; the median first reaches zero at quarter 80. The developmental tax capacity ends at a
median 0.87 versus 0.05 under passive play, making the terminal surplus far larger.

The `dev-no-tax+GDP` counterfactual is an isolation, not a proposed policy. With tax capacity
allowed to decay while programme shares remain fixed, it runs persistent deficits; all 200
governments are deposed between quarters 200 and 400 and their raw post-deposition paths become
economically irrelevant. A credible sustained fiscal policy must adjust taxes and spending
together rather than blindly index one side.

## Changes made to the method

- The batch runner now discards each full final state after extracting its compact trajectory.
  Before this change, the exact 1,000 × 400 command exhausted V8's 4 GB heap because every final
  state retained another full statistical-office century.
- The batch report computes final debt/GDP from post-fiscal treasury debt rather than the
  ledger's opening-of-quarter cached ratio, prints it in explicit percent units, and reports the
  share of runs that ever reach zero plus the median first quarter.
- `pnpm debt-baselines` retains only reduced fiscal readings and reruns the paired channel
  decomposition above. It reports the raw survival rate at each horizon so post-deposition
  states cannot be mistaken for gameplay.
- The `developmentalPolicy` comment and technical architecture now call it what it is: a
  capacity-isolation baseline with unchanged inherited programme rules.

No engine behavior or calibrated constant changed. A later proposal may add a genuinely
sustained developmental fiscal policy, but choosing its tax/spending stance is game design—not a
repair to debt accounting—and must be calibrated as a separate policy.
