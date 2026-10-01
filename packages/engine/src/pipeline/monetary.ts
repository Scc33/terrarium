/**
 * Step 4 — monetary. Inflation expectations adapt toward realized inflation,
 * and the printing press feeds them directly: money-financed deficits raise
 * expected inflation before they even hit prices. Rate transmission happens
 * in production (investment reads the real rate).
 */

import {
  EXPECTATION_ADAPT,
  INFLATION_EXPECTATIONS_MAX,
  INFLATION_EXPECTATIONS_MIN,
  PRINT_PRICE_PRESSURE,
} from '../constants'
import { clamp } from '../math'
import type { PipelineStep } from './pipeline'

/**
 * One quarter of the public's adaptive rule, on scalars: expectations chase
 * last quarter's realized annual inflation at `EXPECTATION_ADAPT`, and money
 * printed against this quarter's output pushes them directly. The step below
 * runs it on the truth; the central-bank desk runs the same function on the
 * office's prints and the treasury's books (ADR-0043), so the recurrence the
 * desk assumes is the recurrence the public follows, by construction.
 */
export function adaptExpectations(
  previous: number,
  realizedAnnual: number,
  printed: number,
  nominalGdp: number,
): number {
  const printPressure = PRINT_PRICE_PRESSURE * (printed / Math.max(nominalGdp, 1e-9))
  return clampExpectations(previous + EXPECTATION_ADAPT * (realizedAnnual - previous) + printPressure)
}

/** The range the rule can produce at all. Exported so the desk's interval
 * around its estimate is cut to the same rails the truth is (ADR-0043). */
export function clampExpectations(annual: number): number {
  return clamp(annual, INFLATION_EXPECTATIONS_MIN, INFLATION_EXPECTATIONS_MAX)
}

export const monetary: PipelineStep = {
  name: 'monetary',
  run(state) {
    const { ledger, flows } = state
    // flows.inflationQ is last tick's realized print at this point in the
    // tick (prices runs later); that's the number expectations chase.
    const inflationExpectations = adaptExpectations(
      ledger.inflationExpectations,
      4 * flows.inflationQ,
      flows.printedThisQtr,
      flows.nominalGdp,
    )
    return { ...state, ledger: { ...ledger, inflationExpectations } }
  },
}
