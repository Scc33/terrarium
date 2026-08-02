/**
 * Step 8 — institutions (§4.3 Layer 3, §6.3 the corridor). The half of the
 * game that isn't the economy.
 *
 * Three things live here, and they are one mechanism:
 *
 *   SOCIETAL POWER is the corridor's y-axis, and from M6 it is alive. It is
 *   not a dial and nobody sets it: it is what a society's capacity to organize
 *   adds up to — who holds a ballot, whether they may print and meet and sue,
 *   whether they can read, whether they live close enough together to act
 *   together — net of inequality (elite capture hollows out formal rights) and
 *   net of the boot. It moves at a generation's pace, so a reform passed today
 *   is a dot that drifts for the next decade.
 *
 *   THE VETO PLAYERS are four blocs whose POWER is read off the economy they
 *   own — agriculture's share of output, the credit stock, the government's
 *   own debt, organized labor's legal standing. Nothing about that is
 *   authored, which is the point: a crisis that guts a bloc's base is a
 *   political opening, and the levers it was guarding get cheap. What IS
 *   authored is what each bloc WANTS — a preference, like a consumption
 *   weight, not a causal arrow. Their favor then propagates through the same
 *   economy everything else does: a capital strike is a risk premium, an
 *   investment strike is the investment factor, a wage push is the wage move.
 *
 *   REVOLUTIONARY PRESSURE is hardship, exclusion and inequality, minus
 *   whatever repression is currently suppressing. It prises open reform
 *   windows (§4.3: never let a good crisis go to waste) and, past a threshold,
 *   it ends governments — which is what makes leaving the corridor cost
 *   something rather than merely look bad on a chart.
 *
 * Runs after cohorts (it reads realized incomes and inequality) and before
 * statistics (unrest is a published indicator) and politics (the election
 * reads the franchise this step just rewrote).
 */

import {
  BLOC_FAVOR_ADAPT,
  BLOC_FAVOR_BASE,
  INSTITUTIONS_1946,
  FIN_POWER_CREDIT,
  FIN_POWER_DEBT,
  IND_POWER_GAIN,
  INSTITUTION_EROSION_Q,
  LAND_POWER_GAIN,
  NATURAL_REAL_RATE,
  NATURAL_UNEMPLOYMENT,
  REFORM_WINDOW_AT,
  REPRESSION_DECAY_Q,
  SOC_ADJUST,
  SOC_BASE,
  SOC_COURTS,
  SOC_EDU,
  SOC_FRANCHISE,
  SOC_GINI_NEUTRAL,
  SOC_INEQ,
  SOC_LABOR,
  SOC_PRESS,
  SOC_REPRESSION,
  SOC_URBAN,
  UNION_POWER_GAIN,
  UNREST_ADAPT_DOWN,
  UNREST_ADAPT_UP,
  UNREST_ANARCHY,
  UNREST_BASE,
  UNREST_CRISIS,
  UNREST_DESPOTISM,
  UNREST_GINI_NEUTRAL,
  UNREST_DISCONTENT,
  UNREST_VOICELESS,
  UNREST_INEQ,
  UNREST_REPRESSION,
} from '../constants'
import { clamp } from '../math'
import {
  BLOC_IDS,
  INSTITUTION_IDS,
  SECTOR_IDS,
  type Bloc,
  type BlocId,
  type InstitutionId,
  type InstitutionState,
  type NewsItem,
  type TrueState,
} from '../state/schema'
import type { PipelineStep } from './pipeline'
import {
  corridorStrain,
  discontentIndex,
  enfranchisementIndex,
  giniIndex,
  inCorridor,
  statePower,
  urbanShare,
} from './derive'

/** The franchise a cohort actually holds. `params.enfranchisement` is the 1946
 * settlement; suffrage reform closes the distance from there to one person one
 * vote. This function is the §4.3 headline in three lines: it rewrites the
 * weights the §3.4 scoring formula uses, so extending the vote literally edits
 * the objective function the player is being graded on. */
export function franchiseOf(base: number, suffrage: number): number {
  return clamp(base + suffrage * (1 - base), 0, 1)
}

/** What each bloc owns, this quarter, in the economy as it actually is. */
function blocPower(state: TrueState): Record<BlocId, number> {
  const grossTotal = state.sectors.reduce((s, x) => s + Math.max(x.output, 0), 0)
  const shareOf = (ids: readonly string[]) =>
    grossTotal > 1e-9
      ? state.sectors
          .filter((s) => ids.includes(s.id))
          .reduce((a, x) => a + Math.max(x.output, 0), 0) / grossTotal
      : 0

  const employed = state.sectors.reduce((s, x) => s + x.employment, 0)
  const urbanEmployed = state.sectors
    .filter((s) => s.id !== 'agri')
    .reduce((a, x) => a + x.employment, 0)
  const organized = employed > 1e-9 ? urbanEmployed / employed : 0

  return {
    landowners: clamp(LAND_POWER_GAIN * shareOf(['agri']), 0, 1),
    industrialists: clamp(IND_POWER_GAIN * shareOf(['manuf', 'energy', 'transport']), 0, 1),
    // the money interest is as strong as the claims it holds — on the economy
    // through credit, and on the state through its own paper
    financiers: clamp(
      FIN_POWER_CREDIT * state.finance.creditToGdp + FIN_POWER_DEBT * state.ledger.debtToGdp,
      0,
      1,
    ),
    // organized labor needs three things at once: the legal right to organize,
    // an industrial workforce to organize, and jobs to strike from
    unions: clamp(
      UNION_POWER_GAIN *
        state.institutions.stocks.labor_rights *
        organized *
        (1 - state.flows.unemployment),
      0,
      1,
    ),
  }
}

/**
 * What each bloc makes of the government's current programme, −1..1.
 *
 * These are PREFERENCES, not effect arrows: the same primitive as a cohort's
 * consumption weights. Pillar 2 forbids scripting what a policy DOES; it does
 * not forbid knowing that a landowner dislikes a land tax. Everything that
 * happens next — the capital strike, the wage push, the unreported harvest —
 * runs through the ordinary economy.
 */
function favorTargets(state: TrueState): Record<BlocId, number> {
  const { dials } = state.gov
  const inst = state.institutions.stocks
  const gdp = Math.max(state.flows.nominalGdp, 1e-9)
  const subsidyShare = (ids: readonly string[]) =>
    SECTOR_IDS.filter((s) => ids.includes(s)).reduce((a, s) => a + (dials.subsidies[s] ?? 0), 0) / gdp
  const realRate = dials.policyRate - state.ledger.inflationExpectations
  const annualInflation = state.flows.inflationQ * 4
  const printedShare = state.flows.printedThisQtr / gdp

  // every sum is recentred by BLOC_FAVOR_BASE so the 1946 settlement reads as
  // indifference — see the constant's note
  return {
    landowners: clamp(
      BLOC_FAVOR_BASE.landowners +
        8 * subsidyShare(['agri']) +
        0.5 * dials.taxRates.tariff -
        1.2 * dials.taxRates.income -
        0.8 * dials.taxRates.corporate -
        1.0 * inst.labor_rights -
        0.8 * inst.suffrage +
        0.5 * inst.repression,
      -1,
      1,
    ),
    industrialists: clamp(
      BLOC_FAVOR_BASE.industrialists +
        8 * subsidyShare(['manuf', 'energy', 'transport']) +
        0.6 * dials.taxRates.tariff -
        1.2 * dials.taxRates.corporate -
        2.0 * Math.max(0, realRate - NATURAL_REAL_RATE) -
        1.0 * inst.labor_rights -
        0.8 * dials.taxRates.fuel +
        0.3 * inst.courts,
      -1,
      1,
    ),
    financiers: clamp(
      BLOC_FAVOR_BASE.financiers +
        0.6 * inst.courts +
        3.0 * clamp(realRate - NATURAL_REAL_RATE, -0.05, 0.05) -
        2.0 * Math.max(0, annualInflation - 0.03) -
        40 * printedShare -
        1.0 * Math.max(0, state.ledger.debtToGdp - 0.6) -
        0.8 * dials.taxRates.corporate,
      -1,
      1,
    ),
    unions: clamp(
      BLOC_FAVOR_BASE.unions +
        1.5 * inst.labor_rights +
        0.8 * inst.suffrage +
        6 * (dials.spending.transfers / gdp) -
        2.0 * Math.max(0, state.flows.unemployment - NATURAL_UNEMPLOYMENT) -
        1.0 * dials.taxRates.fuel -
        1.5 * inst.repression -
        0.8 * Math.max(0, annualInflation - 0.05),
      -1,
      1,
    ),
  }
}

function societalTarget(state: TrueState, gini: number): number {
  const inst = state.institutions.stocks
  return clamp(
    SOC_BASE +
      SOC_FRANCHISE * enfranchisementIndex(state) +
      SOC_PRESS * inst.press +
      SOC_LABOR * inst.labor_rights +
      SOC_COURTS * inst.courts +
      SOC_EDU * state.gov.capacity.education +
      SOC_URBAN * urbanShare(state) -
      SOC_INEQ * Math.max(0, gini - SOC_GINI_NEUTRAL) -
      SOC_REPRESSION * inst.repression,
    0,
    1,
  )
}

function unrestTarget(state: TrueState, gini: number): number {
  const strain = corridorStrain(state)
  const crisis = state.finance.crisisQtrsLeft > 0 ? state.finance.crisisSeverity : 0
  const { discontent, voiceless } = discontentIndex(state)
  // what the country has to be angry about
  const grievance =
    UNREST_BASE +
    UNREST_DISCONTENT * discontent +
    UNREST_VOICELESS * voiceless +
    UNREST_INEQ * Math.max(0, gini - UNREST_GINI_NEUTRAL) +
    UNREST_CRISIS * crisis
  // The boot holds the lid down — it does not empty the pot. Repression damps
  // the EXPRESSION of grievance and can never remove all of it, so a despotism
  // with a genuinely miserable population still boils. Subtracting repression
  // linearly instead made the boot strictly dominant: any amount of misery
  // could be held at zero pressure indefinitely, and the extractive path had
  // no downside but a letter grade.
  const suppressed = grievance * (1 - UNREST_REPRESSION * state.institutions.stocks.repression)
  // …and the strain of being outside the corridor is not something the boot
  // reaches at all. This is the term that makes despotism dangerous rather
  // than merely stagnant.
  return clamp(
    suppressed + UNREST_DESPOTISM * strain.despotic + UNREST_ANARCHY * strain.anarchic,
    0,
    1,
  )
}

/**
 * Open the constitution at 1946. Stocks come from how developed the country
 * is — a richer 1946 inherited more courts and more newspapers, not more
 * suffrage — and both corridor coordinates start AT their equilibrium rather
 * than at zero, because a country does not spend its first decade drifting up
 * to the societal power it already had. `params.enfranchisement` is the 1946
 * settlement, so `suffrage` opens at 0: it measures reform from there.
 *
 * Takes a provisional state (everything except institutions) so bloc power is
 * read off the economy init actually built, not guessed.
 */
export function initialInstitutions(provisional: TrueState): InstitutionState {
  const dev = provisional.params.development
  const stocks = Object.fromEntries(
    INSTITUTION_IDS.map((id) => [
      id,
      clamp(INSTITUTIONS_1946[id].base + INSTITUTIONS_1946[id].devGain * dev, 0, 1),
    ]),
  ) as Record<InstitutionId, number>

  const seed: InstitutionState = {
    stocks,
    societalPower: 0,
    statePower: 0,
    unrest: 0,
    blocs: Object.fromEntries(BLOC_IDS.map((id) => [id, { power: 0, favor: 0 }])) as Record<
      BlocId,
      Bloc
    >,
    pledge: null,
  }
  const staged: TrueState = { ...provisional, institutions: seed }
  const powers = blocPower(staged)
  const settled: InstitutionState = {
    ...seed,
    blocs: Object.fromEntries(BLOC_IDS.map((id) => [id, { power: powers[id], favor: 0 }])) as Record<
      BlocId,
      Bloc
    >,
  }
  const withBlocs: TrueState = { ...provisional, institutions: settled }
  const gini = giniIndex(withBlocs)
  settled.societalPower = societalTarget(withBlocs, gini)
  settled.statePower = statePower({ ...withBlocs, institutions: settled })
  settled.unrest = unrestTarget({ ...withBlocs, institutions: settled }, gini)
  return settled
}

export const institutions: PipelineStep = {
  name: 'institutions',
  run(state) {
    const prev = state.institutions
    const news: NewsItem[] = []
    const wasInCorridor = inCorridor(state)

    // --- Layer-3 stocks: they ratchet, but a boot has to be kept on the neck,
    // and a state that keeps one wears away the press and the unions it stands on
    const stocks = { ...prev.stocks } as Record<InstitutionId, number>
    stocks.repression = clamp(stocks.repression * (1 - REPRESSION_DECAY_Q), 0, 1)
    const erosion = INSTITUTION_EROSION_Q * stocks.repression
    stocks.press = clamp(stocks.press * (1 - erosion), 0, 1)
    stocks.labor_rights = clamp(stocks.labor_rights * (1 - erosion), 0, 1)

    // --- the franchise the reforms have bought, cohort by cohort
    const cohorts = state.cohorts.map((c) => ({
      ...c,
      enfranchisement: franchiseOf(state.params.enfranchisement[c.id], stocks.suffrage),
    }))

    // --- the veto players
    const powers = blocPower(state)
    const targets = favorTargets(state)
    const blocs = {} as Record<BlocId, Bloc>
    for (const id of BLOC_IDS) {
      blocs[id] = {
        power: powers[id],
        favor: clamp(
          prev.blocs[id].favor + BLOC_FAVOR_ADAPT * (targets[id] - prev.blocs[id].favor),
          -1,
          1,
        ),
      }
    }

    const pledge =
      prev.pledge && prev.pledge.quartersLeft > 1
        ? { bloc: prev.pledge.bloc, quartersLeft: prev.pledge.quartersLeft - 1 }
        : null

    // --- the two coordinates. Society moves at a generation's pace; the
    // Leviathan is whatever you have built and whatever you are standing on.
    const gini = giniIndex(state)
    const next: InstitutionState = {
      stocks,
      societalPower: prev.societalPower,
      statePower: prev.statePower,
      unrest: prev.unrest,
      blocs,
      pledge,
    }
    const staged: TrueState = { ...state, cohorts, institutions: next }
    next.societalPower = clamp(
      prev.societalPower + SOC_ADJUST * (societalTarget(staged, gini) - prev.societalPower),
      0,
      1,
    )
    next.statePower = statePower({ ...staged, institutions: next })
    // anger arrives faster than it fades — the asymmetry is what makes a
    // crisis a window that opens and then closes on you
    const uTarget = unrestTarget({ ...staged, institutions: next }, gini)
    const adapt = uTarget > prev.unrest ? UNREST_ADAPT_UP : UNREST_ADAPT_DOWN
    next.unrest = clamp(prev.unrest + adapt * (uTarget - prev.unrest), 0, 1)

    // --- the wire. None of this is fogged: a government can always feel the
    // ground move under it, whatever its statistical office can measure.
    const settled: TrueState = { ...staged, institutions: next }
    const nowInCorridor = inCorridor(settled)
    if (wasInCorridor && !nowInCorridor) {
      const strain = corridorStrain(settled)
      news.push({
        tick: state.meta.tick,
        text:
          strain.despotic > 0
            ? 'The state has outgrown every check upon it; the ministries answer to no one.'
            : 'The writ of the government no longer runs in the provinces.',
        tone: 'bad',
      })
    } else if (!wasInCorridor && nowInCorridor) {
      news.push({
        tick: state.meta.tick,
        text: 'State and society find their balance again; the constitution holds.',
        tone: 'good',
      })
    }
    if (prev.unrest < REFORM_WINDOW_AT && next.unrest >= REFORM_WINDOW_AT) {
      news.push({
        tick: state.meta.tick,
        text: 'The country is in ferment. Things impossible last year are suddenly negotiable.',
        tone: 'neutral',
      })
    }

    // --- §3.3 Position: the path, banked as it happens, like welfare
    const governing = state.politics.inPower && state.politics.deposedAt === null
    const score = governing
      ? {
          ...state.score,
          corridorQuarters: state.score.corridorQuarters + (nowInCorridor ? 1 : 0),
          governedQuarters: state.score.governedQuarters + 1,
        }
      : state.score

    return {
      ...settled,
      score,
      stats: news.length > 0 ? { ...state.stats, news: [...state.stats.news, ...news] } : state.stats,
    }
  },
}
