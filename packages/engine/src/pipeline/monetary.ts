/**
 * Step 4 — monetary. Inflation expectations adapt toward realized inflation,
 * and the printing press feeds them directly: money-financed deficits raise
 * expected inflation before they even hit prices. Rate transmission happens
 * in production (investment reads the real rate).
 */

import { EXPECTATION_ADAPT, PRINT_PRICE_PRESSURE } from '../constants'
import { clamp } from '../math'
import type { PipelineStep } from './pipeline'

export const monetary: PipelineStep = {
  name: 'monetary',
  run(state) {
    const { ledger, flows } = state
    // flows.inflationQ is last tick's realized print at this point in the
    // tick (prices runs later); that's the number expectations chase.
    const realizedAnnual = 4 * flows.inflationQ
    const printPressure = PRINT_PRICE_PRESSURE * (flows.printedThisQtr / Math.max(flows.nominalGdp, 1e-9))
    const inflationExpectations = clamp(
      ledger.inflationExpectations +
        EXPECTATION_ADAPT * (realizedAnnual - ledger.inflationExpectations) +
        printPressure,
      -0.05,
      3,
    )
    return { ...state, ledger: { ...ledger, inflationExpectations } }
  },
}
