/** Shared derived quantities used by several steps. Pure reads, no mutation. */

import {
  ASSET_PURCHASE_PRIVATE_RATE_GAIN,
  BOND_CROWDING_RATE_GAIN,
  CAPITAL_ELASTICITY,
  COMPETITION_CAPTURE_RELIEF,
  CONSUMPTION_WEIGHT_FLOOR,
  CORRIDOR_HALF_WIDTH,
  DEBT_RISK_PREMIUM_AT,
  ELITE_CAPTURE_NEUTRAL,
  ELITE_VETO_ABSORB,
  ELITE_ABSORB_CLAMP,
  ENGEL_ELASTICITY,
  ENGEL_INCOME_RATIO_MAX,
  ENGEL_INCOME_RATIO_MIN,
  EXPORT_BASE_SHARE,
  FIN_FAVOR_PREMIUM,
  HOUSEHOLD_SUBSTITUTION,
  IMPORT_BASE_SHARE,
  LABOR_ELASTICITY,
  LIVING_STANDARD_1946,
  MINIMUM_WAGE_ANCHOR,
  PARTICIPATION,
  RISK_PREMIUM_SLOPE,
  SOCIETY_CHECK,
  SCHOOLING_LABOR_WITHDRAWAL,
  SOVEREIGN_PRIVATE_PREMIUM_SHARE,
  STATE_CAPACITY_WEIGHT,
  STATE_REPRESSION_WEIGHT,
  STATUTE_COMPLIANCE_ADMIN,
  STATUTE_COMPLIANCE_CEILING,
  STATUTE_COMPLIANCE_COURTS,
  STATUTE_COMPLIANCE_FLOOR,
  STATUTE_CONGESTION,
  STATUTE_EVASION_GAIN,
  STATUTE_LEVELS,
  STATUTE_STANCE,
  STATUTE_PHASE_IN_QTRS,
  TECH_EXPOSURE,
  adminEffectiveness,
  domesticBondFundingShare,
  taxEfficiency,
} from '../constants'
import { clamp } from '../math'
import {
  BLOC_IDS,
  CAPACITY_IDS,
  COHORT_IDS,
  SECTOR_IDS,
  STATUTE_IDS,
  WORKING_BANDS,
  type BlocId,
  type CohortId,
  type Sector,
  type SectorId,
  type StatuteId,
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
    privateFundingSpread(state) -
    ASSET_PURCHASE_PRIVATE_RATE_GAIN * state.gov.dials.assetPurchaseRate
  )
}

export function potentialOutput(s: Sector): number {
  return s.tfp * Math.pow(Math.max(s.capital, 1e-9), CAPITAL_ELASTICITY) * Math.pow(Math.max(s.employment, 1e-9), LABOR_ELASTICITY)
}

/**
 * Real value added by industry, at base prices — GDP read down the production
 * side. A column of the I/O table sums to the intermediate input each unit of
 * that industry's gross output consumes, so `1 − Σᵢ coeff[i][j]` is the
 * industry's technical value-added ratio and this vector sums to
 * `flows.realGdp` EXACTLY, by the same arithmetic `production` uses for the
 * headline.
 *
 * Base prices, not current, and that is the whole reason it is worth
 * publishing: a commodity boom raises energy's share of nominal output without
 * anybody producing more energy, and the question a player asks of this figure
 * ("am I industrializing?") is about volumes. The coefficients are technical
 * constants, so nothing here depends on which step last moved a price —
 * `statistics` recomputes the same number `production` did.
 */
export function sectorValueAdded(state: TrueState): Record<SectorId, number> {
  const out = {} as Record<SectorId, number>
  for (let j = 0; j < SECTOR_IDS.length; j++) {
    const sid = SECTOR_IDS[j]
    let intermediate = 0
    for (let i = 0; i < SECTOR_IDS.length; i++) intermediate += state.io.coeff[i][j]
    out[sid] = state.sectors[j].output * (1 - intermediate)
  }
  return out
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

/**
 * The share of the labour force a school-leaving age takes out of it — the
 * FAST half of the compulsory-schooling statute (ADR-0027), and the reason
 * that statute is a genuine choice rather than a growth button.
 *
 * Children who stay in school stop supplying labour, and they do it the
 * quarter the law bites, while what they learn arrives over the seventeen-year
 * half-life of the human-capital stock. A country that legislates in 1950 is
 * poorer in 1955 and unrecognisable in 1990.
 *
 * The size of the bite is read off the PYRAMID, not authored: it is the
 * youngest working band's share of working-age people, so the same law costs a
 * young agrarian country far more labour than an ageing industrial one — which
 * is exactly right, and falls out for free rather than being written down.
 */
export function schoolingWithdrawal(state: TrueState): number {
  const force = statuteForce(state, 'compulsory_schooling')
  if (force <= 0) return 0
  const pyramid = state.demography.pyramid
  let workingAge = 0
  for (let band = WORKING_BANDS[0]; band <= WORKING_BANDS[1]; band++) {
    workingAge += pyramid[band] ?? 0
  }
  if (workingAge <= 1e-9) return 0
  const youngest = pyramid[WORKING_BANDS[0]] ?? 0
  return SCHOOLING_LABOR_WITHDRAWAL * force * (youngest / workingAge)
}

export function laborForce(state: TrueState): Record<CohortId, number> {
  // participation was calibrated on the 1946 pyramid; workerShareMult is the
  // pyramid's current working-age share against that baseline — the
  // demographic dividend (and later the aging squeeze) enters here, once
  const mult = state.demography.workerShareMult
  // …and a school-leaving age takes the youngest of them back out again
  const schooled = 1 - schoolingWithdrawal(state)
  const out = {} as Record<CohortId, number>
  for (const c of state.cohorts) out[c.id] = c.size * PARTICIPATION[c.id] * mult * schooled
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
 * the welfare integrand, shared with demography (fertility and
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
 * are compared to their own grandparents. 1 until the first quarter books,
 * because `demography` runs ahead of `cohorts` and quarter zero's flows are
 * still init's.
 *
 * That bootstrap reads the TICK and must never read `score.baselineWelfare`,
 * even though the two agreed exactly while every run began in 1946. They are
 * the two anchors AGENTS.md warns not to conflate: this one is an income
 * LEVEL the vital rates respond to, that one is the yardstick a player is
 * graded against, and ADR-0021 moved the second to the appointment quarter.
 * Sharing the sentinel meant a 1973 posting spent its whole interregnum at
 * `living = 1` — measured: births 35.3 per 1000 against 26.0, and a
 * population 7.4% too large by the handover, with the demographic transition
 * simply not happening. */
export function livingStandard(state: TrueState): number {
  if (state.meta.tick === 0) return 1
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

// ---------- the Narrow Corridor and the veto players ----------

/** Population-weighted share of the country that holds a ballot. Suffrage
 * reform moves the cohort weights, so this is also the number that decides
 * WHOSE approval the political-capital formula is scoring — the objective function the
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
 * — it converts revolutionary pressure into electoral pressure, which
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

/**
 * The extractive ceiling. The strongest incumbent, unchecked, is the one
 * who vetoes creative destruction — so this reads the MAX, not the mean: it
 * only takes one entrenched interest to keep the newcomers out.
 *
 * **The competition statute's one channel** (ADR-0027). A merger review or a
 * trust-busting programme is the only order in the game aimed at incumbency
 * itself, and this is the number incumbency is: it relieves the ceiling, and
 * everything that follows — faster absorption of the frontier, more yield on
 * the same research money — follows through `creativeDestruction` exactly as
 * it would if the incumbents had been weakened by a slump instead.
 *
 * Note what it deliberately does NOT touch: `effectiveBlocPower` itself, which
 * prices every order on the desk and also carries the capital strike, the wage
 * push and the sovereign risk premium. A competition law arguably weakens the
 * veto too, but a statute that moved that number would move six channels at
 * once and its economics review would be unreadable. Start where the claim is
 * precise; extend on evidence.
 */
export function eliteCapture(state: TrueState): number {
  let max = 0
  for (const id of BLOC_IDS) {
    if (id === 'unions') continue
    max = Math.max(max, effectiveBlocPower(state, id))
  }
  return max * (1 - COMPETITION_CAPTURE_RELIEF * statuteForce(state, 'competition'))
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

// ---------- the statute book (ADR-0027) ----------

/** How many statutes are on the books at all. One civil service enforces a
 * long book worse than a short one, so this is the congestion term's input. */
export function statutesInForce(state: TrueState): number {
  let n = 0
  for (const id of STATUTE_IDS) if (state.gov.statutes[id].level > 0) n++
  return n
}

/**
 * How much of a posted statute the country actually obeys, 0..1.
 *
 * The third instance of the gap this game is about. `taxEfficiency` is the
 * distance between a posted rate and collected revenue; `adminEffectiveness`
 * is the distance between a voted appropriation and delivered money; this is
 * the distance between a rule that is written and a rule that is obeyed. What
 * makes it the interesting one is that the party doing the evading has a name:
 * a powerful, hostile bloc does not veto a factory act, it ignores one.
 *
 * Nothing here is stored, and nothing here is fogged, for the same reason:
 * every input is already published exactly — the civil service, the courts,
 * and each bloc's power and favour are all on the desk unfogged — so a player
 * with a pencil could compute this figure from what the game already shows.
 * That equivalence is the boundary: the moment a term here reads something the
 * player cannot see, this becomes an inspectorate survey with a lag and a band
 * rather than an exact figure. See ADR-0027.
 */
export function statuteCompliance(state: TrueState, id: StatuteId): number {
  const capability =
    STATUTE_COMPLIANCE_ADMIN * adminEffectiveness(state.gov.capacity.administrative) +
    STATUTE_COMPLIANCE_COURTS * state.institutions.stocks.courts
  // The same table that priced the enactment says who declines to comply.
  // Anger only has force when the bloc holding it also has the power to act
  // on it, which is the reading `financierAnger` above already uses.
  let resistance = 0
  for (const bloc of BLOC_IDS) {
    const minds = Math.max(0, STATUTE_STANCE[id][bloc] ?? 0)
    if (minds <= 0) continue
    resistance +=
      minds *
      effectiveBlocPower(state, bloc) *
      Math.max(0, -state.institutions.blocs[bloc].favor)
  }
  // One civil service, many laws. A statute that is NOT yet in force is
  // counted as if it were, so the figure answers the question the desk
  // actually asks of a dormant law — "what could I enforce if I wrote this
  // today?" — rather than quoting an enforcement level that enacting it would
  // immediately undercut. This cannot reach the economy: `statuteForce`
  // returns zero on a dormant statute before it ever asks for compliance.
  const book = statutesInForce(state) + (state.gov.statutes[id].level > 0 ? 0 : 1)
  const congestion = 1 + STATUTE_CONGESTION * Math.max(0, book - 1)
  return clamp(
    (capability / congestion) * (1 - STATUTE_EVASION_GAIN * clamp(resistance, 0, 1)),
    STATUTE_COMPLIANCE_FLOOR,
    STATUTE_COMPLIANCE_CEILING,
  )
}

/**
 * What the economy is actually subject to: the posted strength, times what is
 * enforced, times how far the change has phased in. **Every pipeline step that
 * reads a statute reads this and nothing else** — reading `gov.statutes`
 * directly is reading the announcement instead of the effect, which is exactly
 * the mistake the register exists to make impossible.
 *
 * Zero on rung 0 whatever the compliance, so an un-enacted statute is inert by
 * construction rather than by a constant that could be retuned.
 */
export function statuteForce(state: TrueState, id: StatuteId): number {
  const { level, enactedAt } = state.gov.statutes[id]
  const strength = STATUTE_LEVELS[id][level]?.strength ?? 0
  if (strength <= 0) return 0
  const phase = clamp((state.meta.tick - enactedAt) / STATUTE_PHASE_IN_QTRS, 0, 1)
  return strength * statuteCompliance(state, id) * phase
}

/**
 * The wage floor a minimum-wage statute puts under every sector — the
 * statute's ONE channel, read by `pipeline/labor` and nothing else
 * (ADR-0027). Zero when no statute is written.
 *
 * Anchored to the prevailing WAGE, not to the price level, and the choice is
 * load-bearing rather than stylistic. Measured over a capacity-building
 * century, real wages roughly triple: agriculture's wage runs from 1.8× the
 * consumer price level in 1946 to 4.8× by 2006 on Costona and 9.0× on Meridia.
 * A floor pinned to prices would therefore bind hard for a decade and then be
 * left behind by real wage growth, quietly ceasing to be a policy at all —
 * the same silent-irrelevance failure a nominal floor has, arriving by the
 * opposite route. A floor expressed against what people actually earn stays a
 * policy for as long as it is on the books.
 *
 * The mean is EMPLOYMENT-weighted because the sectors differ by an order of
 * magnitude in wage and by more than that in headcount: energy pays roughly
 * seven times agriculture and employs almost nobody, so an unweighted mean
 * would set the floor by the wage of a sector the floor cannot reach. Weighted
 * by heads, this is the wage of the average worker, which is what a minimum
 * wage has always been argued about as a fraction of.
 *
 * It reads the wages standing at the start of the quarter, so the floor and
 * the raise it forces are not solved simultaneously; the feedback from a
 * higher floor to a higher mean arrives next quarter, damped by the ordinary
 * wage-move caps.
 */
export function minimumWageFloor(state: TrueState): number {
  const force = statuteForce(state, 'minimum_wage')
  if (force <= 0) return 0
  let bill = 0
  let heads = 0
  for (const sector of state.sectors) {
    bill += state.market.wages[sector.id] * sector.employment
    heads += sector.employment
  }
  if (heads <= 1e-9) return 0
  return MINIMUM_WAGE_ANCHOR * force * (bill / heads)
}

/**
 * What a cohort actually buys, as shares of its budget (ADR-0029). This is the
 * vector every reader wants; `cohort.consumptionWeights` is the recipe it was
 * authored with, and reading THAT is reading the announcement instead of the
 * effect — the same rule as `statuteForce` against `gov.statutes`.
 *
 * Two multiplicative terms on the authored weight, renormalised once:
 *
 *   raw[i] = base[i] × (y / y_ref) ^ ENGEL_ELASTICITY[i]
 *                    × effectivePrice(i) ^ (1 − HOUSEHOLD_SUBSTITUTION)
 *
 * The first is Engel: as a cohort's real income per head rises above the one
 * it inherited, necessities lose share and luxuries gain it. The second is the
 * CES nest: at σ = 1 the exponent is zero and this is Cobb-Douglas, which is
 * where the engine started and why no price lever could steer composition
 * (investigation 0013); above 1 a cheaper sector gains share of spending.
 *
 * Both are neutral at their neutral constants BY CONSTRUCTION — anything to
 * the power zero is one — which is what let the mechanism ship inert and the
 * two recalibrations be reviewed one at a time.
 *
 * Income is read off `lastRealIncome`, the EMA the cohort already judges its
 * standard of living against, so the basket moves with the trend rather than
 * with one quarter's pay packet, and no simultaneity is created: the weights
 * this quarter are a function of last quarter's income and this quarter's
 * opening prices, both of them already on the state.
 */
export function effectiveConsumptionWeights(
  state: TrueState,
  cohortId: CohortId,
): Record<SectorId, number> {
  const c = state.cohorts.find((x) => x.id === cohortId)!
  const incomePerHead = c.lastRealIncome / Math.max(c.size, 1e-9)
  const ratio = clamp(
    incomePerHead / Math.max(c.engelReference, 1e-9),
    ENGEL_INCOME_RATIO_MIN,
    ENGEL_INCOME_RATIO_MAX,
  )
  const priceExponent = 1 - HOUSEHOLD_SUBSTITUTION
  const out = {} as Record<SectorId, number>
  let total = 0
  for (const sid of SECTOR_IDS) {
    const engel = ENGEL_ELASTICITY[sid] === 0 ? 1 : Math.pow(ratio, ENGEL_ELASTICITY[sid])
    const price = priceExponent === 0 ? 1 : Math.pow(effectivePrice(state, sid), priceExponent)
    const raw = c.consumptionWeights[sid] * engel * price
    out[sid] = raw > 0 ? raw : 0
    total += out[sid]
  }
  if (!(total > 1e-9)) return { ...c.consumptionWeights }
  // The floor is applied AFTER normalising and only rebalances when it
  // actually binds, so at the neutral constants this returns the authored
  // weights bit for bit — which is what makes the inert proof available.
  let floored = 0
  let bound = false
  for (const sid of SECTOR_IDS) {
    out[sid] /= total
    if (out[sid] < CONSUMPTION_WEIGHT_FLOOR) {
      out[sid] = CONSUMPTION_WEIGHT_FLOOR
      bound = true
    }
    floored += out[sid]
  }
  if (bound) for (const sid of SECTOR_IDS) out[sid] /= floored
  return out
}

/**
 * Household own-basket price level for a cohort (base = 1).
 *
 * Arithmetic over the CURRENT basket, not the CES exact cost-of-living index.
 * The exact index is geometric at σ = 1, so adopting it would move every real
 * income in the game on a change that is supposed to be inert — and this is
 * anyway the index a statistical office reweighting its basket would publish,
 * substitution bias and all.
 */
export function cohortCpi(state: TrueState, cohortId: CohortId): number {
  const weights = effectiveConsumptionWeights(state, cohortId)
  let cpi = 0
  for (const sid of SECTOR_IDS) cpi += weights[sid] * effectivePrice(state, sid)
  return cpi
}
