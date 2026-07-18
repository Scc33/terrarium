/**
 * Step 9 — politics. Political capital accrues from enfranchisement-weighted
 * approval; elections every 16 quarters are the forcing function. Salience
 * (§3.4): the growth term reads the statistics office's CURRENT headline —
 * credit is banked when the number prints, and a later revision never claws
 * it back. A weak office makes elite opinion a coin flip; funding it makes
 * your mandate track reality. Approval, meanwhile, always drifts toward what
 * households actually experienced — the bread line is the bread line.
 */

import {
  ELECTION_WIN_THRESHOLD,
  PC_HEADLINE_CAP,
  PC_HEADLINE_SALIENCE,
  PC_INCOME_FLOOR,
  PC_INCOME_SCALE,
  PC_MAX,
} from '../constants'
import { clamp } from '../math'
import { ELECTION_PERIOD, type NewsItem, type StatPrint } from '../state/schema'
import type { PipelineStep } from './pipeline'
import { approvalIndex } from './derive'

/** The number in the morning paper: the office's newest estimate for the
 * most recent quarter it has dared to publish. */
function headlineGdp(prints: StatPrint[] | undefined): StatPrint | null {
  if (!prints) return null
  let best: StatPrint | null = null
  for (const p of prints) {
    if (
      !best ||
      p.forQtr > best.forQtr ||
      (p.forQtr === best.forQtr && p.revision > best.revision)
    ) {
      best = p
    }
  }
  return best
}

export const politics: PipelineStep = {
  name: 'politics',
  run(state, rng) {
    const { politics: pol, stats } = state
    const approval = approvalIndex(state)

    if (!pol.inPower) return state // deposed: the clock stops, the economy keeps breathing

    const headline = headlineGdp(stats.series.gdp_growth)
    const salience = headline
      ? clamp(PC_HEADLINE_SALIENCE * headline.value, -PC_HEADLINE_CAP, PC_HEADLINE_CAP)
      : 0
    // accrual is centered (approval 0.5 ≈ break-even) but floored: even a
    // despised government can eventually scrape together one act of policy —
    // without the floor a slump locks every dial exactly when action is needed
    const pcIncome = Math.max(PC_INCOME_SCALE * (approval - 0.35) + salience, PC_INCOME_FLOOR)

    let { quartersToElection, electionsWon } = pol
    let inPower: boolean = pol.inPower
    let electionNews: NewsItem | null = null
    quartersToElection -= 1
    if (quartersToElection <= 0) {
      const swing = rng.normal(0, 0.03)
      const won = approval + swing >= ELECTION_WIN_THRESHOLD
      if (won) {
        electionsWon += 1
        quartersToElection = ELECTION_PERIOD
      } else {
        inPower = false
        quartersToElection = 0
      }
      electionNews = {
        tick: state.meta.tick,
        text: won
          ? 'The government is returned at the polls.'
          : 'The government has fallen at the polls.',
        tone: won ? 'good' : 'bad',
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
      stats: electionNews ? { ...stats, news: [...stats.news, electionNews] } : stats,
    }
  },
}
