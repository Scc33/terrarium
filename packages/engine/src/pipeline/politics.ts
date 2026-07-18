/**
 * Step 8 — politics. Political capital accrues from enfranchisement-weighted
 * approval; elections every 16 quarters are the forcing function. M1 keeps
 * the §3.4 formula minimal — salience via published numbers arrives with M2.
 */

import {
  ELECTION_WIN_THRESHOLD,
  PC_INCOME_SCALE,
  PC_MAX,
  PC_PUBLISHED_GDP_BONUS,
} from '../constants'
import { clamp } from '../math'
import { ELECTION_PERIOD } from '../state/schema'
import type { PipelineStep } from './pipeline'

export const politics: PipelineStep = {
  name: 'politics',
  run(state, rng) {
    const { politics: pol, cohorts, flows, ledger } = state

    let weightSum = 0
    let weightedApproval = 0
    for (const c of cohorts) {
      const w = c.enfranchisement * c.size
      weightSum += w
      weightedApproval += w * c.approval
    }
    const approvalIndex = weightSum > 0 ? weightedApproval / weightSum : 0.5

    if (!pol.inPower) {
      // deposed: the clock stops, the economy keeps breathing
      return { ...state, ledger: { ...ledger, lastRealGdp: flows.realGdp } }
    }

    const growthQ = ledger.lastRealGdp > 1e-9 ? flows.realGdp / ledger.lastRealGdp - 1 : 0
    const growthBonus = growthQ > 0 ? PC_PUBLISHED_GDP_BONUS : -PC_PUBLISHED_GDP_BONUS
    // accrual is centered: approval 0.5 ≈ break-even
    const pcIncome = PC_INCOME_SCALE * (approvalIndex - 0.35) + growthBonus

    let { quartersToElection, electionsWon } = pol
    let inPower: boolean = pol.inPower
    quartersToElection -= 1
    if (quartersToElection <= 0) {
      const swing = rng.normal(0, 0.03)
      if (approvalIndex + swing >= ELECTION_WIN_THRESHOLD) {
        electionsWon += 1
        quartersToElection = ELECTION_PERIOD
      } else {
        inPower = false
        quartersToElection = 0
      }
    }

    return {
      ...state,
      politics: {
        politicalCapital: clamp(pol.politicalCapital + pcIncome, 0, PC_MAX),
        quartersToElection,
        inPower,
        electionsWon,
      },
      ledger: { ...ledger, lastRealGdp: flows.realGdp },
    }
  },
}
