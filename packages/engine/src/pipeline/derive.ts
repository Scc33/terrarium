/** Shared derived quantities used by several steps. Pure reads, no mutation. */

import {
  BOND_CROWDING_RATE_GAIN,
  CAPITAL_ELASTICITY,
  CORRIDOR_HALF_WIDTH,
  DEBT_RISK_PREMIUM_AT,
  ELITE_CAPTURE_NEUTRAL,
  ELITE_VETO_ABSORB,
  ELITE_ABSORB_CLAMP,
  EXPORT_BASE_SHARE,
  FIN_FAVOR_PREMIUM,
  IMPORT_BASE_SHARE,
  LABOR_ELASTICITY,
  LIVING_STANDARD_1946,
  PARTICIPATION,
  RISK_PREMIUM_SLOPE,
  SOCIETY_CHECK,
  SOVEREIGN_PRIVATE_PREMIUM_SHARE,
  STATE_CAPACITY_WEIGHT,
  STATE_REPRESSION_WEIGHT,
  TECH_EXPOSURE,
  domesticBondFundingShare,
  taxEfficiency,
} from '../constants'
import { clamp } from '../math'
import {
  BLOC_IDS,
  CAPACITY_IDS,
  COHORT_IDS,
  SECTOR_IDS,
  type BlocId,
  type CohortId,
  type Sector,
  type SectorId,
  type TrueState,
} from '../state/schema'

/** The money interest's effective hostility: anger only has force when the
 * bloc holding the paper also has the power to stay away from the auction. */
export function financierAnger(state: TrueState): number {
  return (
    Math.max(0, -state.institutions.blocs.financiers.favor) *
    effectiveBlocPower(state, 'financiers')
  )
}

/** Yield above the policy rate on government paper. Fiscal charges it and
 * private finance passes a calibrated share through, so quote and consequence
 * cannot drift into two different sovereign-risk models. */
export function sovereignRiskPremium(state: TrueState): number {
  const debtToGdp = state.gov.debt / Math.max(4 * state.flows.nominalGdp, 1e-9)
  return (
    Math.max(0, debtToGdp - DEBT_RISK_PREMIUM_AT) * RISK_PREMIUM_SLOPE +
    FIN_FAVOR_PREMIUM * financierAnger(state)
  )
}

/** Bonds sold in the most recently booked quarter, as a share of that
 * quarter's GDP. The fiscal identity is deficit = bonds + printing. */
export function bondIssuanceShare(state: TrueState): number {
  const deficit = Math.max(0, -state.gov.budget.balance)
  const bonds = Math.max(0, deficit - state.flows.printedThisQtr)
  return bonds / Math.max(state.flows.nominalGdp, 1e-9)
}

/** Extra annual private funding cost created by the state's claim on finance:
 * a flow term for this quarter's domestic bond auction, plus a stock term for
 * sovereign risk. Printing is deliberately excluded from the flow term — it
 * fails through inflation instead of competing for loanable funds. */
export function privateFundingSpread(state: TrueState): number {
  const domesticAuction =
    bondIssuanceShare(state) * domesticBondFundingShare(state.params.openness)
  return (
    BOND_CROWDING_RATE_GAIN * domesticAuction +
    SOVEREIGN_PRIVATE_PREMIUM_SHARE * sovereignRiskPremium(state)
  )
}

/** The common rate read by credit, asset valuation, and private investment. */
export function privateRealRate(state: TrueState): number {
  return (
    state.gov.dials.policyRate -
    state.ledger.inflationExpectations +
    privateFundingSpread(state)
  )
}

export function potentialOutput(s: Sector): number {
  return s.tfp * Math.pow(Math.max(s.capital, 1e-9), CAPITAL_ELASTICITY) * Math.pow(Math.max(s.employment, 1e-9), LABOR_ELASTICITY)
}

/** How much of the currently reachable world technique is operating at home.
 * Each sector is compared with its own exposure-adjusted frontier, then
 * weighted by current output. Unlike a 1946-base productivity index this can
 * fall while domestic technique still rises: that means the world frontier
 * is pulling away, which is precisely the development fact the player needs
 * the technology instrument to reveal. */
export function technologyAttainment(state: TrueState): number {
  let weighted = 0
  let weightSum = 0
  for (const sector of state.sectors) {
    const target = Math.pow(state.tech.frontier, TECH_EXPOSURE[sector.id])
    const weight = Math.max(0, sector.output)
    weighted += weight * (state.tech.attained[sector.id] / Math.max(target, 1e-9))
    weightSum += weight
  }
  if (weightSum > 1e-9) return weighted / weightSum
  return (
    SECTOR_IDS.reduce((sum, id) => {
      const target = Math.pow(state.tech.frontier, TECH_EXPOSURE[id])
      return sum + state.tech.attained[id] / Math.max(target, 1e-9)
    }, 0) / SECTOR_IDS.length
  )
}

/** Labor needed to produce q given current tfp and capital. */
export function laborForOutput(s: Sector, q: number): number {
  const base = s.tfp * Math.pow(Math.max(s.capital, 1e-9), CAPITAL_ELASTICITY)
  return Math.pow(Math.max(q, 0) / base, 1 / LABOR_ELASTICITY)
}

/** Price a buyer actually faces: fuel excise lands on energy purchases. */
export function effectivePrice(state: TrueState, id: SectorId): number {
  const p = state.market.prices[id]
  return id === 'energy' ? p * (1 + state.gov.dials.taxRates.fuel) : p
}

export function laborForce(state: TrueState): Record<CohortId, number> {
  // participation was calibrated on the 1946 pyramid; workerShareMult is the
  // pyramid's current working-age share against that baseline — the
  // demographic dividend (and later the aging squeeze) enters here, once
  const mult = state.demography.workerShareMult
  const out = {} as Record<CohortId, number>
  for (const c of state.cohorts) out[c.id] = c.size * PARTICIPATION[c.id] * mult
  return out
}

export function totalLaborForce(state: TrueState): number {
  return COHORT_IDS.reduce((s, id) => s + (laborForce(state)[id] ?? 0), 0)
}

/** Enfranchisement-weighted approval — the electorate as the ballot box
 * (and an honest pollster) would count it. */
export function approvalIndex(state: TrueState): number {
  let weightSum = 0
  let weightedApproval = 0
  for (const c of state.cohorts) {
    const w = c.enfranchisement * c.size
    weightSum += w
    weightedApproval += w * c.approval
  }
  return weightSum > 0 ? weightedApproval / weightSum : 0.5
}

/** Population-weighted mean log real consumption per capita this quarter —
 * the §3.3 welfare integrand, shared with demography (fertility and
 * mortality respond to the same lived standard the historians grade). */
export function meanLogConsumption(state: TrueState): number {
  let logSum = 0
  let popSum = 0
  for (const c of state.cohorts) {
    const cpc = state.flows.cohortSpend[c.id] / cohortCpi(state, c.id) / Math.max(c.size, 1e-9)
    logSum += c.size * Math.log(Math.max(cpc, 0.01))
    popSum += c.size
  }
  return popSum > 1e-9 ? logSum / popSum : 0
}

/** Annualized real household consumption per person. Each cohort's nominal
 * spend is deflated by its own basket before aggregation, so a fuel shock
 * reaches the people who actually buy fuel rather than an invented average
 * consumer. Population and cohort sizes are both in millions, so the scale
 * cancels to the model's real output units per person. */
export function realConsumptionPerCapita(state: TrueState): number {
  let realConsumption = 0
  let population = 0
  for (const c of state.cohorts) {
    realConsumption += state.flows.cohortSpend[c.id] / cohortCpi(state, c.id)
    population += c.size
  }
  return population > 1e-9 ? (4 * realConsumption) / population : 0
}

/** Household saving as a share of current disposable income. Principal
 * redemptions are excluded: exchanging a bond for a deposit changes the
 * portfolio but is not income. A negative rate is genuine dissaving. */
export function householdSavingRate(state: TrueState): number {
  const incomeTaxEff = state.gov.dials.taxRates.income * taxEfficiency(state.gov.capacity.tax)
  const disposableIncome = state.cohorts.reduce(
    (sum, c) =>
      sum + c.wageIncome * (1 - incomeTaxEff) + c.profitIncome + c.transferIncome,
    0,
  )
  const consumption = state.cohorts.reduce(
    (sum, c) => sum + state.flows.cohortSpend[c.id],
    0,
  )
  return disposableIncome > 1e-9 ? (disposableIncome - consumption) / disposableIncome : 0
}

/** The living standard as a LEVEL, against the standard 1946 country —
 * demographic behavior responds to how rich people are, not how rich they
 * are compared to their own grandparents. 1 until the first quarter books. */
export function livingStandard(state: TrueState): number {
  if (state.score.baselineWelfare === null) return 1
  return Math.exp(meanLogConsumption(state)) / LIVING_STANDARD_1946
}

/** Income Gini across cohorts (grouped lower bound: within-cohort equality).
 * Income = wages + transfers + profits, per capita — what a household income
 * survey would tabulate, transfers included, so redistribution moves it. */
export function giniIndex(state: TrueState): number {
  const groups = state.cohorts
    .filter((c) => c.size > 1e-9)
    .map((c) => ({ pop: c.size, income: c.wageIncome + c.transferIncome + c.profitIncome }))
    .sort((a, b) => a.income / a.pop - b.income / b.pop)
  const popTotal = groups.reduce((s, g) => s + g.pop, 0)
  const incTotal = groups.reduce((s, g) => s + Math.max(g.income, 0), 0)
  if (popTotal <= 1e-9 || incTotal <= 1e-9) return 0
  let cumShare = 0
  let areaTwice = 0 // Σ fᵢ·(Sᵢ₋₁ + Sᵢ) — twice the area under the Lorenz curve
  for (const g of groups) {
    const f = g.pop / popTotal
    const prev = cumShare
    cumShare += Math.max(g.income, 0) / incTotal
    areaTwice += f * (prev + cumShare)
  }
  return Math.max(0, 1 - areaTwice)
}

/**
 * Real household income per head, two ways: the average, and the household in
 * the middle. Same income definition the Gini tabulates (wages + transfers +
 * profits), deflated by each cohort's OWN basket — the same real-income notion
 * `pipeline/cohorts.ts` judges approval against, so the instrument and the
 * political response are measuring one quantity rather than two.
 *
 * Only the MEAN is published (`income_real`). It carries the level a Gini
 * cannot: a shape statistic reports the same 42 points for a country three
 * times richer than it was.
 *
 * The median is computed here — it is the same traversal — but is deliberately
 * NOT an indicator, and the reason is worth keeping next to the code. Median
 * over mean looks like the obvious companion gauge and measures the wrong
 * thing: raising transfers to the poorest cohorts lowers it (80.4 → 77.4 on a
 * measured 60-quarter run) while the Gini correctly falls, because the
 * multiplier lifts the top in absolute terms faster than it lifts the middle
 * household. A dial that worsens when the player redistributes is worse than
 * no dial. Distribution belongs in the household budget survey, as cohort
 * levels, where nothing has to be compressed into one directional number.
 *
 * The median is a GROUPED one — the cohort the 50th population percentile
 * falls in — for the same reason `giniIndex` is a grouped lower bound: the
 * model holds no within-cohort dispersion, so interpolating inside the
 * containing cohort would invent a spread that does not exist.
 */
export function realIncomePerHead(state: TrueState): { mean: number; median: number } {
  const groups = state.cohorts
    .filter((c) => c.size > 1e-9)
    .map((c) => ({
      pop: c.size,
      perHead:
        (c.wageIncome + c.transferIncome + c.profitIncome) /
        Math.max(cohortCpi(state, c.id), 1e-9) /
        c.size,
    }))
    .sort((a, b) => a.perHead - b.perHead)
  const popTotal = groups.reduce((s, g) => s + g.pop, 0)
  if (popTotal <= 1e-9) return { mean: 0, median: 0 }
  const mean = groups.reduce((s, g) => s + g.perHead * g.pop, 0) / popTotal
  let cum = 0
  let median = groups[groups.length - 1].perHead
  for (const g of groups) {
    cum += g.pop
    if (cum >= 0.5 * popTotal) {
      median = g.perHead
      break
    }
  }
  return { mean, median }
}

/** Terms of trade: the world price of your export basket relative to your
 * import basket, indexed to 1946 (=100). Falls when the things you buy
 * abroad (energy, machinery) outrun the things you sell. */
export function termsOfTrade(state: TrueState): number {
  const wp = state.external.worldPrices
  let exp = 0
  let imp = 0
  let exp0 = 0
  let imp0 = 0
  for (const sid of SECTOR_IDS) {
    exp += EXPORT_BASE_SHARE[sid] * wp[sid]
    imp += IMPORT_BASE_SHARE[sid] * wp[sid]
    exp0 += EXPORT_BASE_SHARE[sid]
    imp0 += IMPORT_BASE_SHARE[sid]
  }
  if (imp <= 1e-9 || imp0 <= 1e-9 || exp0 <= 1e-9) return 100
  return (100 * (exp / imp)) / (exp0 / imp0)
}

// ---------- §6.3 the Narrow Corridor, §4.3 the veto players ----------

/** Population-weighted share of the country that holds a ballot. Suffrage
 * reform moves the cohort weights, so this is also the number that decides
 * WHOSE approval the §3.4 formula is scoring — the objective function the
 * player can edit. */
export function enfranchisementIndex(state: TrueState): number {
  let people = 0
  let voters = 0
  for (const c of state.cohorts) {
    people += c.size
    voters += c.size * c.enfranchisement
  }
  return people > 1e-9 ? voters / people : 0
}

/**
 * How unhappy the country is, and how much of that unhappiness has nowhere to
 * go. Two population-weighted sums — note *population*, not enfranchisement:
 * the electorate is who votes, but the street is everybody.
 *
 * `discontent` is the whole country's dissatisfaction. `voiceless` is the part
 * of it held by people with no ballot, and it is the one that matters most for
 * revolutionary pressure: a citizen who can vote you out does that instead.
 * That asymmetry is what makes extending the franchise genuinely double-edged
 * (§4.3) — it converts revolutionary pressure into electoral pressure, which
 * is precisely the historical bargain suffrage extension was.
 */
export function discontentIndex(state: TrueState): { discontent: number; voiceless: number } {
  let people = 0
  let unhappy = 0
  let unheard = 0
  for (const c of state.cohorts) {
    const d = 1 - c.approval
    people += c.size
    unhappy += c.size * d
    unheard += c.size * d * (1 - c.enfranchisement)
  }
  if (people <= 1e-9) return { discontent: 0, voiceless: 0 }
  return { discontent: unhappy / people, voiceless: unheard / people }
}

/** the share of the non-retired population living an urban life — cities are
 * where a society organizes, which is why the transition moves the y-axis */
export function urbanShare(state: TrueState): number {
  const s = state.demography.classShares
  return clamp(s.urban_workers + s.professionals + s.business_owners, 0, 1)
}

/** The corridor's x-axis: the Leviathan. What the ministries can do, plus the
 * coercive arm — a police state is a CAPABLE state, which is exactly why
 * despotism is a corner of this map rather than a synonym for failure. */
export function statePower(state: TrueState): number {
  const caps = CAPACITY_IDS.reduce((s, id) => s + state.gov.capacity[id], 0) / CAPACITY_IDS.length
  return clamp(
    STATE_CAPACITY_WEIGHT * caps + STATE_REPRESSION_WEIGHT * state.institutions.stocks.repression,
    0,
    1,
  )
}

/** Signed distance from the corridor's centre line. Positive = the state has
 * outrun its society (toward despotism); negative = society has outrun its
 * state (toward anarchy). Zero is the middle of the road. */
export function corridorOffset(state: TrueState): number {
  return statePower(state) - state.institutions.societalPower
}

/** How far outside the corridor you are, on each side. Both zero while you
 * are in it — this is the number every consequence of leaving reads. */
export function corridorStrain(state: TrueState): { despotic: number; anarchic: number } {
  const off = corridorOffset(state)
  return {
    despotic: Math.max(0, off - CORRIDOR_HALF_WIDTH),
    anarchic: Math.max(0, -off - CORRIDOR_HALF_WIDTH),
  }
}

export function inCorridor(state: TrueState): boolean {
  return Math.abs(corridorOffset(state)) <= CORRIDOR_HALF_WIDTH
}

/** A bloc's power as it actually bears on the government: its clout, less
 * whatever an organized society is able to check. This is the corridor's
 * central claim in one expression — the same elites are far less able to veto
 * you when the people can print, meet, sue and vote. */
export function effectiveBlocPower(state: TrueState, id: BlocId): number {
  const raw = state.institutions.blocs[id].power
  return clamp(raw * (1 - SOCIETY_CHECK * state.institutions.societalPower), 0, 1)
}

/** How hostile the room is, weighted by who is actually in it. Only the
 * incumbents count here: organized labor can strike, but it does not stage
 * palace coups. */
export function eliteHostility(state: TrueState): number {
  let weight = 0
  let hostile = 0
  for (const id of BLOC_IDS) {
    if (id === 'unions') continue
    const p = effectiveBlocPower(state, id)
    weight += p
    hostile += p * Math.max(0, -state.institutions.blocs[id].favor)
  }
  return weight > 1e-9 ? hostile / weight : 0
}

/** §4.3 the extractive ceiling. The strongest incumbent, unchecked, is the one
 * who vetoes creative destruction — so this reads the MAX, not the mean: it
 * only takes one entrenched interest to keep the newcomers out. */
export function eliteCapture(state: TrueState): number {
  let max = 0
  for (const id of BLOC_IDS) {
    if (id === 'unions') continue
    max = Math.max(max, effectiveBlocPower(state, id))
  }
  return max
}

/** The multiplier the extractive ceiling puts on absorptive capacity. Above 1
 * for a country whose incumbents are checked, below 1 for one whose are not —
 * calibrated so the 1946 opening is neutral, because this is a divergence
 * mechanism and not a tax levied on everybody at the start. */
export function creativeDestruction(state: TrueState): number {
  return clamp(
    1 + ELITE_VETO_ABSORB * (ELITE_CAPTURE_NEUTRAL - eliteCapture(state)),
    ELITE_ABSORB_CLAMP[0],
    ELITE_ABSORB_CLAMP[1],
  )
}

/** Household own-basket price level for a cohort (base = 1). */
export function cohortCpi(state: TrueState, cohortId: CohortId): number {
  const c = state.cohorts.find((x) => x.id === cohortId)!
  let cpi = 0
  for (const sid of SECTOR_IDS) cpi += c.consumptionWeights[sid] * effectivePrice(state, sid)
  return cpi
}
