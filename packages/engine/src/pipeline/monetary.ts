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

export const monetary: PipelineStep = {
  name: 'monetary',
  run(state) {
    const { ledger, flows } = state
    // flows.inflationQ is last tick's experienced CPI at this point in the
    // tick (prices runs later), not the office's noisy, lagged print. People
    // experience their purchases even when the statistical office is unfunded.
    const realizedAnnual = 4 * flows.inflationQ
    const printPressure = PRINT_PRICE_PRESSURE * (flows.printedThisQtr / Math.max(flows.nominalGdp, 1e-9))
    const inflationExpectations = clamp(
      ledger.inflationExpectations +
        EXPECTATION_ADAPT * (realizedAnnual - ledger.inflationExpectations) +
        printPressure,
      INFLATION_EXPECTATIONS_MIN,
      INFLATION_EXPECTATIONS_MAX,
    )
    // Household bargains learn from prices paid, not a second direct impulse
    // from the financing book. Printing still reaches them as prices rise;
    // adding that forecast premium here priced the same deficit into wages
    // prematurely and lifted random-policy unemployment (ADR-0043).
    const consumerInflationExpectations = clamp(
      ledger.consumerInflationExpectations +
        EXPECTATION_ADAPT * (realizedAnnual - ledger.consumerInflationExpectations),
      INFLATION_EXPECTATIONS_MIN,
      INFLATION_EXPECTATIONS_MAX,
    )
    return { ...state, ledger: { ...ledger, inflationExpectations, consumerInflationExpectations } }
  },
}
