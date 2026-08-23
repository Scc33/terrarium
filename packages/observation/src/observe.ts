/**
 * observe() — a pure projection of what the government can see (ADR-0003). The
 * fog itself (lag, noise, revisions, funding gates) lives in the engine's
 * statistics step, because politics now reads the prints too; this function
 * only attaches presentation and assembles the desk: published series, the
 * treasury's exact books, the dials, the wire. The UI remains architecturally
 * unable to name true state.
 */

import {
  politicalCostOfAction,
  BLOC_IDS,
  CAMPAIGN_WINDOW,
  CORRIDOR_HALF_WIDTH,
  corridorOffset,
  effectiveBlocPower,
  electionThreshold,
  END_OF_HISTORY_TICK,
  approvalIndex,
  inCorridor,
  INDICATOR_IDS,
  INSTITUTION_IDS,
  LEGITIMACY_GRADE_ELECTIONS,
  POSITION_GRADE_CUTS,
  PROSPERITY_GRADE_CUTS,
  reformWindowOpen,
  statuteCompliance,
  statuteForce,
  STATUTE_IDS,
  STATUTE_LEVELS,
  STATUTE_STANCE,
  totalLaborForce,
  WELFARE_DISCOUNT_Q,
  type TrueState,
} from '@terrarium/engine'
import type {
  Grade,
  IndicatorId,
  PublishedBloc,
  PublishedState,
  PublishedStatute,
  ReportCard,
} from './published'

const PRESENTATION: Record<IndicatorId, { label: string; unit: string }> = {
  gdp_growth: { label: 'Real GDP growth', unit: '% / yr' },
  gdp_per_capita: { label: 'Real GDP per head', unit: 'real / head / yr' },
  debt_to_gdp: { label: 'Public debt', unit: '% of GDP' },
  consumption_per_capita: { label: 'Real consumption per head', unit: 'real / head / yr' },
  household_saving_rate: { label: 'Household saving rate', unit: '% disposable' },
  consumption_share: { label: 'Household consumption', unit: '% final expenditure' },
  investment_share: { label: 'Capital formation', unit: '% final expenditure' },
  export_share: { label: 'Exports', unit: '% final expenditure' },
  fdi_inflows: { label: 'Foreign direct investment', unit: '% of GDP' },
  inflation: { label: 'Inflation', unit: '% / yr' },
  price_food: { label: 'Food price board', unit: '1946=100' },
  price_fuel: { label: 'Fuel price board', unit: '1946=100' },
  unemployment: { label: 'Unemployment', unit: '%' },
  labor_force_participation: { label: 'Labor force participation', unit: '% of population' },
  human_capital: { label: 'Workforce skills', unit: 'idx' },
  payrolls: { label: 'Payrolls ex-agri', unit: 'M jobs' },
  capital_stock: { label: 'Capital stock', unit: 'index' },
  productivity: { label: 'Output per worker', unit: '1946=100' },
  technology_attainment: { label: 'Technology attained', unit: '% frontier' },
  conf_consumer: { label: 'Consumer confidence', unit: 'idx' },
  conf_business: { label: 'Business confidence', unit: 'idx' },
  approval: { label: 'Approval poll', unit: '%' },
  gini: { label: 'Income inequality', unit: 'Gini pts' },
  income_real: { label: 'Household income', unit: '1946=100' },
  net_migration: { label: 'Net migration', unit: 'per 1000/yr' },
  birth_rate: { label: 'Birth rate', unit: 'per 1000/yr' },
  death_rate: { label: 'Death rate', unit: 'per 1000/yr' },
  terms_of_trade: { label: 'Terms of trade', unit: '1946=100' },
  asset_prices: { label: 'Asset valuation', unit: 'replacement cost=100' },
  credit_growth: { label: 'Credit growth', unit: '% / yr' },
  credit_to_gdp: { label: 'Private credit', unit: '% of GDP' },
  bank_capital_ratio: { label: 'Bank capital', unit: '% of credit' },
  pollution: { label: 'Pollution burden', unit: '1946 = 100' },
  unrest: { label: 'Public order', unit: 'idx' },
}

/** Discounted effective duration of an n-quarter tenure — the denominator
 * that makes prosperity a rate, so grades don't re-punish short tenures for
 * what the legitimacy axis already judges. */
function effectiveQuarters(n: number): number {
  let weight = 0
  let weightedT = 0
  for (let t = 0; t < n; t++) {
    const b = Math.pow(WELFARE_DISCOUNT_Q, t)
    weight += b
    weightedT += b * t
  }
  return weight > 0 ? weightedT / weight : 1
}

/** The card only exists when the book is closed — mid-run, the cumulative
 * welfare number would be a quarterly drip-feed of true consumption. */
function reportCardOf(state: TrueState): ReportCard | undefined {
  const { politics, score, meta } = state
  const over = !politics.inPower || meta.tick >= END_OF_HISTORY_TICK
  if (!over || score.discountWeight <= 0 || score.baselineWelfare === null) return undefined
  const meanLog = score.discountedWelfare / score.discountWeight
  // the caretaker's quarters are not the player's tenure (ADR-0021), and on an
  // ordinary 1946 posting `appointedAt` is zero and this is the old expression
  const quartersGoverned =
    (politics.deposedAt ?? Math.min(meta.tick, END_OF_HISTORY_TICK)) - meta.appointedAt
  const prosperityRate =
    (400 * (meanLog - score.baselineWelfare)) / Math.max(effectiveQuarters(quartersGoverned), 1)
  const prosperityGrade: Grade =
    PROSPERITY_GRADE_CUTS.find((c) => prosperityRate >= c.atLeast)?.grade ?? 'F'

  // Legitimacy is CONSENT, so a mandate taken by force cannot buy it.
  // Suppressed elections are never netted against won ones — both numbers go
  // on the card — but they do cap the grade, and enough of them make the
  // question of how many elections you "won" beside the point.
  const suppressed = politics.electionsSuppressed
  const earned: Grade = politics.inPower
    ? 'A'
    : (LEGITIMACY_GRADE_ELECTIONS.find((c) => politics.electionsWon >= c.atLeast)?.grade ?? 'F')
  const ORDER: Grade[] = ['A', 'B', 'C', 'D', 'F']
  const cap: Grade = suppressed === 0 ? 'A' : suppressed >= 3 ? 'F' : 'D'
  const legitimacyGrade: Grade =
    ORDER.indexOf(earned) >= ORDER.indexOf(cap) ? earned : cap

  // Position: the share of the tenure spent inside the corridor
  const corridorShare =
    score.governedQuarters > 0 ? score.corridorQuarters / score.governedQuarters : 0
  const positionGrade: Grade =
    POSITION_GRADE_CUTS.find((c) => corridorShare >= c.atLeast)?.grade ?? 'F'

  return {
    endedBy: politics.inPower ? 'history' : 'deposition',
    quartersGoverned,
    electionsWon: politics.electionsWon,
    electionsSuppressed: suppressed,
    prosperity: Math.exp(meanLog),
    vsBaseline: Math.exp(meanLog - score.baselineWelfare),
    prosperityRate,
    prosperityGrade,
    legitimacyGrade,
    corridorShare,
    finalStatePower: state.institutions.statePower,
    finalSocietalPower: state.institutions.societalPower,
    positionGrade,
    deposedBy: politics.deposedBy,
  }
}

/** What each reform would cost right now — the veto premium and the reform
 * window already priced in. Delegates to the engine's own quote function, so
 * the number the player reads cannot drift from the number they are charged.
 * (An earlier version subtracted the post-action capital from a sentinel
 * balance; at MAX_SAFE_INTEGER that subtraction fell outside a double's
 * mantissa and quietly rounded the quote.) */
function reformCosts(state: TrueState): PublishedState['reformCost'] {
  const out = {} as PublishedState['reformCost']
  for (const id of INSTITUTION_IDS) {
    const priceOf = (direction: 1 | -1): number | null => {
      try {
        return politicalCostOfAction(state, { kind: 'reform', institution: id, direction })
      } catch {
        return null // already at the rail, or otherwise not on offer
      }
    }
    out[id] = { up: priceOf(1), down: priceOf(-1) }
  }
  return out
}

/**
 * The statute book as the law officers would report it: what is posted, what
 * a change to each rung would cost, how much of it the country obeys, and who
 * is not obeying it.
 *
 * The costs come from `politicalCostOfAction` for the same reason the reform
 * prices above do — one quote function, so the number on the screen is the
 * number that gets charged. The resistance list is assembled from the same
 * `STATUTE_STANCE` entries that priced the enactment and hollowed out the
 * compliance, so the desk cannot show one story while the economy runs another.
 */
function statutes(state: TrueState): PublishedStatute[] {
  return STATUTE_IDS.map((id) => {
    const { level, enactedAt } = state.gov.statutes[id]
    const ladder = STATUTE_LEVELS[id]
    const cost = ladder.map((_, rung) => {
      try {
        return politicalCostOfAction(state, { kind: 'enact', statute: id, level: rung })
      } catch {
        return null // the rung it is already on, or otherwise not on offer
      }
    })
    const resistance = BLOC_IDS.map((bloc) => ({
      bloc,
      weight:
        Math.max(0, STATUTE_STANCE[id][bloc] ?? 0) *
        effectiveBlocPower(state, bloc) *
        Math.max(0, -state.institutions.blocs[bloc].favor),
    })).filter((entry) => entry.weight > 1e-9)
    return {
      id,
      level,
      levels: ladder,
      // "since 1946" would be a lie about a statute nobody has written: the
      // opening book stamps quarter zero on every rung-0 entry to keep the
      // record shape uniform, and null is how that reads on the desk.
      enactedAt: level > 0 ? enactedAt : null,
      compliance: statuteCompliance(state, id),
      inForce: statuteForce(state, id),
      cost,
      resistance,
    }
  })
}

export function observe(state: TrueState): PublishedState {
  const indicators: PublishedState['indicators'] = {}
  for (const id of INDICATOR_IDS) {
    const points = state.stats.series[id]
    if (points && points.length > 0) {
      indicators[id] = { id, ...PRESENTATION[id], points }
    }
  }
  return {
    tick: state.meta.tick,
    appointedAt: state.meta.appointedAt,
    country: state.params.name,
    countryAuthored: state.params.authored === true,
    rules: { ...state.meta.rules },
    indicators,
    // the industrial census, as released. Cloned rather than shared: every
    // print holds two records, and a caller that mutated one would be editing
    // the office's own archive.
    industry: state.stats.industry.map((print) => ({
      ...print,
      errorBand: { ...print.errorBand },
      valueAdded: { ...print.valueAdded },
      employment: { ...print.employment },
    })),
    dials: structuredClone(state.gov.dials),
    spendingRules: structuredClone(state.gov.spendingRules),
    treasury: {
      ...state.gov.budget,
      debt: state.gov.debt,
      printed: state.gov.printed,
      revenueBySource: { ...state.flows.revenueBySource },
      outlaysByProgramme: { ...state.flows.outlaysByProgramme },
    },
    capacity: { ...state.gov.capacity },
    capacityBuilding: state.gov.pipeline.map((b) => ({ target: b.target, remaining: b.remaining })),
    books: state.stats.record.map((r) => ({
      tick: r.tick,
      revenue: r.revenue,
      outlays: r.outlays,
      balance: r.balance,
      debt: r.debt,
      reserves: r.reserves,
      revenueBySource: { ...r.revenueBySource },
      outlaysByProgramme: { ...r.outlaysByProgramme },
    })),
    population: {
      // census-grade facts: heads are countable without a statistical office
      total: state.demography.pyramid.reduce((a, b) => a + b, 0),
      laborForce: totalLaborForce(state),
      pyramid: [...state.demography.pyramid],
    },
    // the census over time — exact, like the treasury's books; the WHY of the
    // population's change (birth/death rates) stays fogged in the indicators
    census: state.stats.record.map((r) => ({
      tick: r.tick,
      population: r.population,
      pyramid: r.pyramid,
    })),
    // the minute book: what the dials were set to, quarter by quarter. Exact
    // for the same reason the books are — a government is allowed to remember
    // its own decisions, whatever its statistical office can or cannot see.
    policy: state.stats.record.map((r) => ({ tick: r.tick, ...structuredClone(r.policy) })),
    reserves: state.external.reserves,
    exchangeRate: state.external.exchangeRate,
    politicalCapital: state.politics.politicalCapital,
    quartersToElection: state.politics.quartersToElection,
    inPower: state.politics.inPower,
    electionsWon: state.politics.electionsWon,
    electionsSuppressed: state.politics.electionsSuppressed,
    news: state.stats.news,
    statutes: statutes(state),
    institutions: { ...state.institutions.stocks },
    reformWindowOpen: reformWindowOpen(state),
    reformCost: reformCosts(state),
    blocs: BLOC_IDS.map(
      (id): PublishedBloc => ({
        id,
        power: state.institutions.blocs[id].power,
        favor: state.institutions.blocs[id].favor,
        effectivePower: effectiveBlocPower(state, id),
      }),
    ),
    pledge: state.institutions.pledge ? { ...state.institutions.pledge } : null,
    corridor: {
      statePower: state.institutions.statePower,
      societalPower: state.institutions.societalPower,
      offset: corridorOffset(state),
      halfWidth: CORRIDOR_HALF_WIDTH,
      inCorridor: inCorridor(state),
      // the traced path comes from the office's own worksheets, so it survives
      // a save/reload the way the census does — the map is not a UI accident
      trail: state.stats.record.map((r) => ({
        tick: r.tick,
        x: r.statePower,
        y: r.societalPower,
      })),
    },
    campaign:
      state.politics.inPower &&
      state.politics.quartersToElection <= CAMPAIGN_WINDOW &&
      state.politics.quartersToElection > 0
        ? {
            quartersToElection: state.politics.quartersToElection,
            committed: state.politics.campaign ? { ...state.politics.campaign } : null,
            support: approvalIndex(state),
            threshold: electionThreshold(state.institutions.stocks.repression),
          }
        : null,
    lastElection: state.politics.lastElection ? { ...state.politics.lastElection } : null,
    reportCard: reportCardOf(state),
  }
}
