/** Shared derived quantities used by several steps. Pure reads, no mutation. */

import {
  CAPITAL_ELASTICITY,
  CORRIDOR_HALF_WIDTH,
  ELITE_CAPTURE_NEUTRAL,
  ELITE_VETO_ABSORB,
  ELITE_ABSORB_CLAMP,
  EXPORT_BASE_SHARE,
  IMPORT_BASE_SHARE,
  LABOR_ELASTICITY,
  LIVING_STANDARD_1946,
  PARTICIPATION,
  SOCIETY_CHECK,
  STATE_CAPACITY_WEIGHT,
  STATE_REPRESSION_WEIGHT,
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

export function potentialOutput(s: Sector): number {
  return s.tfp * Math.pow(Math.max(s.capital, 1e-9), CAPITAL_ELASTICITY) * Math.pow(Math.max(s.employment, 1e-9), LABOR_ELASTICITY)
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
