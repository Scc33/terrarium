/**
 * Monetary. Both annualized forecasts adapt to experienced CPI. The nominal
 * forecast also prices money-financed deficits directly; households learn
 * their effects through purchase prices. Finance and production read the
 * nominal forecast through the common private real rate; labor reads the
 * household forecast for wage bargains.
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
    // flows.inflationQ is last tick's experienced CPI at this point in the
    // tick (prices runs later), not the office's noisy, lagged print. People
    // experience their purchases even when the statistical office is unfunded.
    const realizedAnnual = 4 * flows.inflationQ
    const inflationExpectations = adaptExpectations(
      ledger.inflationExpectations,
      realizedAnnual,
      flows.printedThisQtr,
      flows.nominalGdp,
    )
    // Household bargains learn from prices paid, not a second direct impulse
    // from the financing book. Printing still reaches them as prices rise;
    // adding that forecast premium here priced the same deficit into wages
    // prematurely and lifted random-policy unemployment (ADR-0044).
    const consumerInflationExpectations = clampExpectations(
      ledger.consumerInflationExpectations +
        EXPECTATION_ADAPT * (realizedAnnual - ledger.consumerInflationExpectations),
    )
    return { ...state, ledger: { ...ledger, inflationExpectations, consumerInflationExpectations } }
  },
}
