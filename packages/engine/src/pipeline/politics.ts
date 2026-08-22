/**
 * Step 10 — politics. Political capital accrues from enfranchisement-weighted
 * approval; elections every 16 quarters are the forcing function. Salience
 * (ADR-0003): the growth term reads the statistics office's CURRENT headline —
 * credit is banked when the number prints, and a later revision never claws
 * it back. A weak office makes elite opinion a coin flip; funding it makes
 * your mandate track reality. Approval, meanwhile, always drifts toward what
 * households actually experienced — the bread line is the bread line.
 *
 * The election is a scene rather than a line on the wire. Two quarters
 * out the campaign opens and the government commits to a platform: hold
 * a coalition together, not merely optimize). Each platform is a real fork
 * with a real bill — largesse mortgages the budget, coalition mortgages the
 * levers, suppression mortgages the corridor, franchise mortgages the scoring
 * rubric itself — and all four are priced in `actions/apply.ts`, where the
 * promise is made.
 *
 * And the ballot box is no longer the only way out. A government can also be
 * ended from below (revolutionary pressure past the line) or from above
 * (elites it has defied, in a country whose society is too weak to check
 * them). That is what makes leaving the corridor cost something.
 */

import {
  COUP_AT,
  COUP_P,
  ELECTION_WIN_THRESHOLD,
  PC_HEADLINE_CAP,
  PC_HEADLINE_SALIENCE,
  PC_INCOME_FLOOR,
  PC_INCOME_SCALE,
  PC_MAX,
  PC_REPRESSION_GAIN,
  PC_UNREST_DRAG,
  REPRESSION_VOTE_EDGE,
  REVOLT_AT,
  REVOLT_P,
} from '../constants'
import { clamp } from '../math'
import {
  ELECTION_PERIOD,
  type ElectionResult,
  type NewsItem,
  type PoliticalState,
  type StatPrint,
} from '../state/schema'
import type { PipelineStep } from './pipeline'
import { approvalIndex, eliteHostility } from './derive'

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

/** The bar at the ballot box. Repression does not win you votes — it removes
 * the opposition from the count, which is the same thing on the night and a
 * different thing entirely on the report card. */
export function electionThreshold(repression: number): number {
  return Math.max(0.05, ELECTION_WIN_THRESHOLD - REPRESSION_VOTE_EDGE * repression)
}

export const politics: PipelineStep = {
  name: 'politics',
  run(state, rng) {
    const { politics: pol, stats, institutions: inst } = state
    const approval = approvalIndex(state)
    const protectedTenure = state.meta.rules.protectedTenure

    if (!pol.inPower) return state // deposed: the clock stops, the economy keeps breathing

    // ADR-0021 the interregnum: on a later appointment the quarters before the
    // player arrives are governed by a caretaker, and the political clock does
    // not run for it. No ballot (nobody elected it), no deposition (the record
    // says the country reached your appointment), and no accrual — so the
    // capital the player inherits is the opening stock a 1946 government gets,
    // not a quarter-century saturated at PC_MAX. The caretaker's orders are
    // still quoted and the blocs still spend favour on every one, so the
    // politics you take over is the one its programme earned. Inert at
    // `appointedAt: 0`, where this is never true.
    if (state.meta.tick < state.meta.appointedAt) return state

    const news: NewsItem[] = []
    const headline = headlineGdp(stats.series.gdp_growth)
    const salience = headline
      ? clamp(PC_HEADLINE_SALIENCE * headline.value, -PC_HEADLINE_CAP, PC_HEADLINE_CAP)
      : 0
    // accrual is centered (approval 0.5 ≈ break-even) but floored: even a
    // despised government can eventually scrape together one act of policy —
    // without the floor a slump locks every dial exactly when action is needed
    const pcBase = Math.max(PC_INCOME_SCALE * (approval - 0.35) + salience, PC_INCOME_FLOOR)
    // a state that does not have to ask can act; a country in ferment eats
    // the government's whole week
    const pcIncome =
      pcBase * (1 + PC_REPRESSION_GAIN * inst.stocks.repression) * (1 - PC_UNREST_DRAG * inst.unrest)

    let next: PoliticalState = {
      ...pol,
      politicalCapital: clamp(pol.politicalCapital + pcIncome, 0, PC_MAX),
      quartersToElection: pol.quartersToElection - 1,
    }

    // --- the two ways out that do not wait for polling day ---
    const revoltP = REVOLT_P * Math.max(0, inst.unrest - REVOLT_AT)
    const hostility = eliteHostility(state)
    const coupP = COUP_P * Math.max(0, hostility - COUP_AT) * (1 - inst.societalPower)
    const roll = rng.next()
    if (!protectedTenure && roll < revoltP) {
      news.push({
        tick: state.meta.tick,
        text: 'Revolution: the crowds take the ministries and the government flees.',
        tone: 'bad',
      })
      next = { ...next, inPower: false, quartersToElection: 0, deposedAt: state.meta.tick, deposedBy: 'revolt' }
    } else if (!protectedTenure && roll < revoltP + coupP) {
      news.push({
        tick: state.meta.tick,
        text: 'The men who own the country have decided they no longer own the government.',
        tone: 'bad',
      })
      next = { ...next, inPower: false, quartersToElection: 0, deposedAt: state.meta.tick, deposedBy: 'coup' }
    } else if (next.quartersToElection <= 0) {
      // --- polling day ---
      const platform = pol.campaign?.platform ?? 'record'
      const swing = pol.campaign?.swing ?? 0
      const threshold = electionThreshold(inst.stocks.repression)
      const won = approval + swing + rng.normal(0, 0.03) >= threshold
      const suppressed = won && platform === 'suppression'
      const retainsOffice = won || protectedTenure
      const result: ElectionResult = {
        tick: state.meta.tick,
        platform,
        bloc: pol.campaign?.bloc ?? null,
        support: approval,
        swing,
        threshold,
        won,
        suppressed,
      }
      next = {
        ...next,
        campaign: null,
        lastElection: result,
        electionsWon: won ? next.electionsWon + 1 : next.electionsWon,
        electionsSuppressed: suppressed ? next.electionsSuppressed + 1 : next.electionsSuppressed,
        quartersToElection: retainsOffice ? ELECTION_PERIOD : 0,
        inPower: retainsOffice,
        deposedAt: retainsOffice ? next.deposedAt : state.meta.tick,
        deposedBy: retainsOffice ? next.deposedBy : 'poll',
      }
      news.push({
        tick: state.meta.tick,
        text: suppressed
          ? 'The government is returned. The opposition was not on the ballot.'
          : won
            ? 'The government is returned at the polls.'
            : protectedTenure
              ? 'The government is defeated at the polls. GOD MODE keeps the simulation running.'
              : 'The government has fallen at the polls.',
        tone: won ? 'good' : 'bad',
      })
    }

    return {
      ...state,
      politics: next,
      stats: news.length > 0 ? { ...stats, news: [...stats.news, ...news] } : stats,
    }
  },
}
