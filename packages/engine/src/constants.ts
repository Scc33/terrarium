/**
 * Tuning knobs. Every behavioral constant in the sim lives here so balance
 * work happens in one file. Values target a stable passive run for a mid-poor
 * 1946 economy (the M1 exit criterion (c)).
 */

import type {
  BlocId,
  CapacityId,
  CohortId,
  IndicatorId,
  InstitutionId,
  PartnerId,
  PlatformId,
  SectorId,
} from './state/schema'

// ---------- production ----------
export const CAPITAL_ELASTICITY = 0.35
export const LABOR_ELASTICITY = 0.65
export const DEPRECIATION_Q = 0.015 // capital, per quarter (war-worn stock)
export const UTILIZATION_AT_INIT = 0.85
/** economies run with headroom; demand at this share of potential is "neutral"
 * for prices and hiring — above it markets tighten, below it they slacken */
export const NORMAL_UTILIZATION = 0.85

// ---------- input-output table (row = input, col = output) ----------
// column order: agri, manuf, energy, services, transport
export const IO_COEFF: number[][] = [
  [0.08, 0.05, 0.0, 0.01, 0.0], // agri inputs
  [0.06, 0.15, 0.08, 0.05, 0.1], // manuf inputs
  [0.06, 0.12, 0.05, 0.03, 0.3], // energy inputs (transport runs on fuel)
  [0.03, 0.08, 0.05, 0.05, 0.05], // services inputs
  [0.1, 0.1, 0.03, 0.02, 0.05], // transport inputs (food is moved to market)
]

// ---------- tâtonnement ----------
export const TATONNEMENT = {
  demandGain: 0.25,
  costGain: 0.3,
  markup: 0.02, // over full unit cost (intermediates + labor + capital return)
  maxMovePerTick: 0.15,
}
/** slack cuts prices more weakly than shortage raises them */
export const SLACK_GAIN_RATIO = 0.4

// ---------- labor ----------
export const EMPLOYMENT_ADJUST = 0.12 // fraction of gap closed per quarter
export const WAGE_DEMAND_GAIN = 0.15
export const WAGE_INFLATION_PASSTHROUGH = 0.35
/** Phillips anchor: wage growth responds to economy-wide slack around this
 * natural rate — the long-run full-employment attractor */
export const NATURAL_UNEMPLOYMENT = 0.075
export const WAGE_SLACK_GAIN = 0.08
/** wages are sticky downward — the asymmetry is the great stabilizer of the
 * postwar economy, and losing it is what made gold-standard busts so deep */
export const WAGE_MAX_UP = 0.08
export const WAGE_MAX_DOWN = 0.035
export const LABOR_SHARE = 0.62

// participation rate of cohort members in the labor force
export const PARTICIPATION: Record<CohortId, number> = {
  rural_workers: 0.55,
  urban_workers: 0.55,
  professionals: 0.6,
  business_owners: 0, // self-employed; income from profits, not wages
  retirees: 0,
}

// which cohorts staff which sector (columns sum to 1)
export const LABOR_SOURCE: Record<SectorId, Partial<Record<CohortId, number>>> = {
  agri: { rural_workers: 1 },
  manuf: { urban_workers: 0.8, rural_workers: 0.2 },
  energy: { urban_workers: 1 },
  services: { professionals: 0.6, urban_workers: 0.4 },
  transport: { urban_workers: 0.7, rural_workers: 0.3 },
}

// ---------- households ----------
export const MPC: Record<CohortId, number> = {
  rural_workers: 0.95,
  urban_workers: 0.92,
  professionals: 0.85,
  business_owners: 0.75,
  retirees: 0.98,
}
export const SAVINGS_DRAWDOWN = 0.03 // share of savings spent per quarter

// households buy little raw energy/transport directly — those costs arrive
// embedded in goods via the I/O table (that's the fuel-tax → bread chain)
export const CONSUMPTION_WEIGHTS: Record<CohortId, Record<SectorId, number>> = {
  rural_workers: { agri: 0.48, manuf: 0.2, energy: 0.05, services: 0.23, transport: 0.04 },
  urban_workers: { agri: 0.38, manuf: 0.24, energy: 0.05, services: 0.28, transport: 0.05 },
  professionals: { agri: 0.25, manuf: 0.26, energy: 0.04, services: 0.41, transport: 0.04 },
  business_owners: { agri: 0.2, manuf: 0.26, energy: 0.04, services: 0.46, transport: 0.04 },
  retirees: { agri: 0.4, manuf: 0.18, energy: 0.06, services: 0.32, transport: 0.04 },
}

// profit distribution across cohorts
export const PROFIT_SHARE: Record<CohortId, number> = {
  business_owners: 0.75,
  professionals: 0.15,
  urban_workers: 0.05,
  rural_workers: 0.05,
  retirees: 0,
}

// who holds the government's paper (interest + redemptions land here)
export const BOND_HOLDING: Record<CohortId, number> = {
  business_owners: 0.6,
  professionals: 0.25,
  retirees: 0.15,
  urban_workers: 0,
  rural_workers: 0,
}

// transfer distribution across cohorts
export const TRANSFER_SHARE: Record<CohortId, number> = {
  retirees: 0.55,
  rural_workers: 0.25,
  urban_workers: 0.2,
  professionals: 0,
  business_owners: 0,
}

// ---------- fiscal ----------
/** collection efficiency as a function of tax capacity: revenue = base × rate × eff */
export const taxEfficiency = (capacity: number): number => Math.pow(Math.max(0, capacity), 0.6)
/** program delivery: share of spending that reaches its target */
export const adminEffectiveness = (capacity: number): number => 0.35 + 0.65 * Math.pow(Math.max(0, capacity), 0.8)
/** deficits beyond this share of GDP can't find buyers and get monetized */
export const BOND_MARKET_DEPTH = 0.05
/** …and beyond this debt/GDP, markets close entirely */
export const DEBT_CEILING = 1.2
/** Debt/GDP above this point begins adding to the sovereign risk premium. */
export const DEBT_RISK_PREMIUM_AT = 0.5
export const RISK_PREMIUM_SLOPE = 0.06
/** Share of the sovereign premium that reaches domestic private funding costs. */
export const SOVEREIGN_PRIVATE_PREMIUM_SHARE = 0.5
/** Bond issuance as a share of quarterly GDP bids up the private annual rate.
 * Openness determines how much of the auction domestic balance sheets carry. */
export const BOND_CROWDING_RATE_GAIN = 1.0
export const domesticBondFundingShare = (openness: number): number =>
  1 / (1 + Math.max(0, openness))

// ---------- capacity (Layer 2) ----------
export const CAPACITY_COST_PER_POINT = 60 // money per 1.0 of capacity
export const CAPACITY_BUILD_QTRS = 8 // arrives over 2 years
/** Minimum statistical-office strength required to produce each series.
 * This is exported because the wall must explain the exact institution the
 * simulation is waiting for; one table keeps that promise from drifting. */
export const INDICATOR_FUNDED_AT: Record<IndicatorId, number> = {
  gdp_growth: 0,
  gdp_per_capita: 0,
  debt_to_gdp: 0,
  consumption_per_capita: 0.25,
  household_saving_rate: 0.45,
  // The expenditure accounts are ONE publication, so all four unlock together
  // and the rail advertises them as a single milestone. They sit beside the
  // labour force survey rather than on 0.30 with the establishment survey —
  // not because they are harder than payrolls, but because 0.30 already hands
  // the player four instruments, and a rung that lights up half the wall at
  // once teaches nothing about any of them.
  consumption_share: 0.35,
  investment_share: 0.35,
  export_share: 0.35,
  // Company returns and the capital account have to be reconciled against the
  // national accounts; this arrives with the trade statistics, not the basic
  // expenditure release.
  fdi_inflows: 0.4,
  inflation: 0.08,
  price_food: 0.2,
  price_fuel: 0.2,
  unemployment: 0.35,
  labor_force_participation: 0.35,
  payrolls: 0.3,
  capital_stock: 0.3,
  // Output per worker needs the accounts and a labour force survey reconciled
  // against each other — more than either alone, and less than the industrial
  // census plus international comparisons `technology_attainment` waits for.
  // It therefore arrives one rung EARLIER than the technology plate, which is
  // the right order to learn them in: "we are getting more per worker" is a
  // fact about you, and reads without knowing what the world is doing.
  productivity: 0.4,
  // productivity accounts need both an industrial census and international
  // comparisons; the plate unlocks beside the confidence surveys
  technology_attainment: 0.45,
  conf_consumer: 0.45,
  conf_business: 0.45,
  approval: 0.25,
  gini: 0.55,
  // national accounts and a price index between them give you the average
  income_real: 0.45,
  birth_rate: 0.3,
  death_rate: 0.3,
  terms_of_trade: 0.4,
  asset_prices: 0.45,
  credit_growth: 0.55,
  // the provincial governors always write in; somebody has to read the
  // reports, collate them, and dare to put a number on the result
  unrest: 0.4,
}
/** neglect is a policy — but it rots institutions fast and people slowly:
 * a taught generation stays taught for a working lifetime */
export const CAPACITY_DECAY_BY_ID: Record<CapacityId, number> = {
  tax: 0.004,
  statistical: 0.004,
  administrative: 0.004,
  education: 0.001,
}

// ---------- confidence (animal spirits; kept mild — they amplify cycles) ----------
export const CONF_NEUTRAL = 0.55
export const CONF_ADAPT = 0.15 // per quarter toward conditions
export const CONF_MPC_GAIN = 0.08 // ±4% consumption swing across full range
export const CONF_INV_GAIN = 0.3 // added to the investment factor

// ---------- monetary ----------
export const EXPECTATION_ADAPT = 0.12 // per quarter, toward realized inflation
export const PRINT_PRICE_PRESSURE = 0.5 // extra quarterly price drift per (printed/GDP)
export const INVESTMENT_RATE_SENSITIVITY = 2.5 // real-rate response of investment
export const NATURAL_REAL_RATE = 0.02
/** Lewis-model capital widening: surplus labor (cheap hands, fat margins)
 * pulls investment beyond replacement. Without this, a growing labor force
 * outruns the capital stock and unemployment ratchets — the M4 lesson. */
export const INVESTMENT_SLACK_GAIN = 3.0
export const INVESTMENT_FACTOR_MAX = 1.7 // was 1.3 when the labor force was static

// ---------- foreign direct investment ----------
/** A Meridia-sized, open, mid-poor country attracts roughly this share of
 * annual GDP as inward FDI before current conditions and stock saturation.
 * The quarterly flow uses annual GDP / 4, so the resulting ratio is still
 * directly comparable with the conventional annual FDI/GDP statistic. */
export const FDI_BASE_ANNUAL_GDP_SHARE = 0.01
/** Inward FDI is not proportional to country scale: a plant is transformative
 * in a small economy and marginal in a continental one. This elasticity makes
 * the FLOW/GDP share fall with population without making absolute inflows fall. */
export const FDI_REFERENCE_POPULATION = 27.5
export const FDI_SIZE_ELASTICITY = 0.35
/** Trade access and a technology gap attract export-platform/catch-up capital. */
export const FDI_OPENNESS_FLOOR = 0.2
export const FDI_OPENNESS_GAIN = 0.8
export const FDI_CATCHUP_FLOOR = 0.6
export const FDI_CATCHUP_GAIN = 0.8
/** Company returns, business sentiment and public administration move the
 * marginal project around the structural country draw. */
export const FDI_NORMAL_AFTER_TAX_PROFIT_SHARE = 0.28
export const FDI_RETURN_GAIN = 3
export const FDI_CONFIDENCE_GAIN = 0.8
export const FDI_EXPORT_GAIN = 1.5
/** Imported machinery is part of gross capital formation but not domestic
 * demand. The rest of an FDI project is local construction and services. */
export const FDI_IMPORTED_CAPITAL_SHARE = 0.35
/** Investors tolerate an ordinary post-war price cycle. Beyond this annualized
 * absolute inflation/deflation rate, contract and currency risk shelves new
 * projects before FDI can amplify an already unstable random-policy path. */
export const FDI_PRICE_INSTABILITY_AT = 0.08
export const FDI_PRICE_INSTABILITY_DRAG = 2.5
/** Foreign ownership is sticky but not limitless. A mature foreign-owned
 * stock crowds out new acquisitions before it can become the whole economy. */
export const FDI_OWNERSHIP_SATURATION = 0.45
export const FDI_OPENING_OWNERSHIP_BASE = 0.04
/** Direct investors do not flee as quickly as portfolio money, but a domestic
 * banking crisis still shelves most new projects. */
export const FDI_CRISIS_MULTIPLIER = 0.3
/** Foreign parents repatriate part of after-tax earnings; the retained share
 * stays available to the domestic firm rather than vanishing from income. */
export const FDI_PROFIT_REMIT_SHARE = 0.4

/** Immutable terrain shared by opening-stock calibration and the live flow.
 * It captures issue #40's core scale claim: FDI/GDP is larger in smaller,
 * more open, less-developed countries, while absolute inflows still scale
 * with the size of the economy. */
export function fdiStructuralAttraction(
  population: number,
  development: number,
  openness: number,
): number {
  const clampLocal = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value))
  const size = clampLocal(
    Math.pow(FDI_REFERENCE_POPULATION / Math.max(population, 1), FDI_SIZE_ELASTICITY),
    0.5,
    2.25,
  )
  const access = clampLocal(FDI_OPENNESS_FLOOR + FDI_OPENNESS_GAIN * openness, 0.1, 1.8)
  const catchUp = clampLocal(1.25 - 0.75 * development, 0.5, 1.2)
  return size * access * catchUp
}

// ---------- the crisis clock (Pillar 4: it always ticks) ----------
/** per-quarter odds of a world energy rupture (~3 per century) */
export const ENERGY_SHOCK_P = 0.008
export const ENERGY_SHOCK_JUMP: [number, number] = [1.5, 2.2]
/** per-quarter odds of a failed harvest (~5 per century) */
export const DROUGHT_P = 0.012
export const DROUGHT_SEVERITY: [number, number] = [0.78, 0.9] // agri tfp multiplier
export const DROUGHT_EXTRA_QTRS: [number, number] = [1, 3] // beyond the onset quarter
/** world prices drift home after a rupture — this is what makes a shock a
 * crisis instead of a new normal (half-life ≈ 5–6 years) */
export const WORLD_PRICE_REVERT = 0.03

// ---------- technology (§9) ----------
/** The frontier's roughly historical schedule: golden age, the 1973
 * slowdown, the ICT bump, secular stagnation. Annual growth by start year;
 * the tech step interpolates nothing — eras switch on the quarter. */
export const FRONTIER_ERAS: Array<{ fromYear: number; growthPerYear: number }> = [
  { fromYear: 1946, growthPerYear: 0.02 },
  { fromYear: 1973, growthPerYear: 0.011 },
  { fromYear: 1995, growthPerYear: 0.016 },
  { fromYear: 2005, growthPerYear: 0.011 },
  { fromYear: 2035, growthPerYear: 0.008 },
]
/** how much of the frontier each sector can ride (Baumol: the string
 * quartet still takes four players) */
export const TECH_EXPOSURE: Record<SectorId, number> = {
  agri: 0.85, // mechanization, fertilizer, the green revolution
  manuf: 1.0,
  energy: 0.9,
  services: 0.45, // the cost disease
  transport: 0.75,
}
/** per-quarter share of the remaining gap closed at absorption = 1 */
export const CATCHUP_Q = 0.02
/** absorption = base + gain × education capacity, damped by autarky —
 * the ceiling: you cannot absorb faster than your human capital allows,
 * which is why "just buy the machines" fails, repeatedly and expensively */
export const ABSORB_BASE = 0.05
export const ABSORB_EDU_GAIN = 0.9
export const ABSORB_OPENNESS_WEIGHT = 0.3 // share of absorption gated on trade exposure
/** near the frontier, everyone drips forward a little on their own */
export const FRONTIER_OWN_DRIFT_Q = 0.0008
/** where a country starts relative to the 1946 frontier: development buys
 * position — the gap is open from quarter one, so catch-up growth is
 * available immediately to whoever can absorb */
export const TECH_ATTAINED_BASE = 0.45
export const TECH_ATTAINED_DEV_GAIN = 0.5
/** Public research is entered as quarterly money and normalized by quarterly
 * GDP. Administration decides what reaches laboratories; education decides
 * how much useful work the country can staff. Past five percent of GDP the
 * bottleneck is projects and people, so extra money is still booked but buys
 * no extra technique. */
export const RESEARCH_EFFECTIVE_SHARE_MAX = 0.05
export const RESEARCH_SKILL_FLOOR = 0.2
/** Behind the frontier, research adapts known techniques. This is an addition
 * to the ordinary catch-up coefficient per point of effective GDP share, and
 * remains gated by openness, schools, and creative destruction. */
export const RESEARCH_CATCHUP_GAIN_Q = 0.4
/** Near the frontier, the same programme becomes original research. The gain
 * is deliberately smaller: at one percent of effective GDP fully allocated
 * to frontier work, it adds about 0.14 percentage points of annual frontier
 * growth. */
export const RESEARCH_FRONTIER_GAIN_Q = 0.035
/** Below this share of frontier practice all effective research is adaptation;
 * above it the budget shifts linearly toward original work. Read PER SECTOR:
 * a country at best practice in manufacturing and a generation behind in the
 * fields funds original work in the one and adaptation in the other, which is
 * what every real industrial policy has actually looked like. */
export const RESEARCH_FRONTIER_START = 0.7
/** Research is a STOCK, not a cheque. Money buys laboratories, trained people
 * and half-finished programmes, and those keep delivering for years after the
 * appropriation stops — which is why a research base is something a government
 * INHERITS, and why strangling one is slow enough to be deniable. Decay is per
 * quarter; 0.05 is a half-life near fourteen quarters, so a programme coasts
 * about three years on momentum and takes about five to reach full stride.
 *
 * The steady-state stock is `effectiveShare / RESEARCH_STOCK_DECAY_Q` and every
 * downstream gain reads `intensity = stock × decay`, so a programme held steady
 * behaves EXACTLY as the old flow model did. Only the transients changed, which
 * is what keeps the coefficients below calibrated. */
export const RESEARCH_STOCK_DECAY_Q = 0.05
/** Original research arrives in lumps. Catch-up is reliable — the technique
 * exists and somebody is selling it — but invention is a hazard process: effort
 * buys shots on goal, not a delivery date. So effort sets the HAZARD and the
 * size of a breakthrough is a constant of nature. That way a modest programme
 * gets the occasional windfall instead of a permanent trickle too small to see,
 * and the player learns that research is a bet rather than a purchase.
 *
 * Expectation is preserved exactly: `hazard = RESEARCH_FRONTIER_GAIN_Q × effort
 * / BREAKTHROUGH_SIZE`, so hazard × size returns the deterministic term this
 * replaced and the century-long average is unchanged. The clamp is a safety
 * rail: realistic effort puts the hazard near 0.1, not near it. */
export const BREAKTHROUGH_SIZE = 0.012
export const BREAKTHROUGH_HAZARD_MAX = 0.5

// ---------- demography (§8) ----------
/** schooling suppresses fertility beyond the income channel (§8: female
 * education) — TFR drop per unit of education capacity above the 1946 base */
export const FERT_EDU_GAIN = 1.2
export const EDUCATION_1946 = 0.2 // default education capacity for old saves
/** real consumption per capita of the standard 1946 country, in engine
 * units — the ABSOLUTE anchor for demographic behavior. Vital rates respond
 * to the level of income (a richer country starts its transition further
 * along), unlike the report card, which grades against the 1946 you
 * inherited. */
export const LIVING_STANDARD_1946 = 1.63
/** annual mortality per person by 5-year band at the 1946 poor-country
 * baseline (mortalityIndex = 1). The first band carries child mortality —
 * the thing income growth crushes first, and a fertility input. */
export const MORT_BASE_ANNUAL = [
  0.045, 0.004, 0.003, 0.004, 0.005, 0.006, 0.007, 0.008, 0.01, 0.013, 0.017, 0.024, 0.034,
  0.05, 0.075, 0.115, 0.2,
]
/** mortality falls with the living standard (per ln of it)… */
export const MORT_INCOME_GAIN = 0.18
/** …and with a slow worldwide drip of medicine, whoever you are */
export const MORT_SECULAR_Q = 0.0006
export const MORT_FLOOR = 0.35 // even 2050 medicine has limits

/** fertility: high at 1946, endogenously transitioning. You don't set it;
 * you cause it (income, cities, surviving children, slow norm drift). */
export const FERT_MAX = 5.6
export const FERT_MIN = 1.55
export const FERT_INCOME_GAIN = 1.6 // TFR drop per ln(living standard)
export const FERT_URBAN_GAIN = 2.0 // TFR drop per unit rise in urban share
/** surviving children need no replacements: TFR drop per unit fall in the
 * mortality index — the transition's engine even where incomes lag */
export const FERT_SURVIVAL_GAIN = 1.5
export const FERT_SECULAR_Q = 0.0015 // norms/contraception drift per quarter
export const FERTILE_YEARS = 25 // width of the childbearing window

/** migration: the pressure valve. Slack labor markets push the young out;
 * tight ones pull them in. Millions/quarter, capped. */
export const MIG_GAIN = 0.02
export const MIG_CAP_Q = 0.003 // as a share of total population

/** The Lewis subsistence sector: a share of the openly unemployed pools
 * into family agriculture each quarter — underemployment at falling
 * marginal product, not a dole queue. Their pain arrives as soft food
 * prices and lagging rural incomes (the price scissors), which is what
 * 1946 labor surplus actually looked like. */
export const SUBSISTENCE_ABSORPTION_Q = 0.06
/** family farms can only stretch so far: agri employment is capped at this
 * multiple of the rural labor force */
export const SUBSISTENCE_CAP = 0.92

/** rural→urban drift per quarter per unit of urban/rural wage gap */
export const URBANIZATION_GAIN = 0.004
/** working-age share of the non-retired population in the 1946 standard
 * pyramid — normalizes workerShareMult to 1 at init */
export const BASE_WORKER_SHARE = 0.608

// ---------- §3.3 prosperity ----------
/** quarterly discount on lived welfare (≈2%/yr) */
export const WELFARE_DISCOUNT_Q = 0.995

/** The historians' letter grades. Prosperity is graded on annualized welfare
 * growth over the tenure's discounted effective duration (%/yr) — tenure-
 * independent, so a short brilliant government isn't double-punished on an
 * axis that isn't survival. Calibrated 2026-07 on 150 passive + 150 random
 * centuries under full M4 (demography + two-tree technology): passive sits
 * in a 0.91–1.41 band (C — safe but mediocre, by design; the unschooled
 * century leaves catch-up on the table), random median 2.11, p95 3.22. */
export const PROSPERITY_GRADE_CUTS: Array<{ atLeast: number; grade: 'A' | 'B' | 'C' | 'D' }> = [
  { atLeast: 3.2, grade: 'A' }, // sustained policy clearly among the best runs
  { atLeast: 1.8, grade: 'B' }, // beat the do-nothing century
  { atLeast: 0.85, grade: 'C' }, // the passive band: growth happened around you
  { atLeast: 0.0, grade: 'D' }, // living standards barely moved
] // below every cut: F — the nation got poorer under you

/** Legitimacy is graded on consent, not welfare: reach 2050 in power and the
 * verdict is A; fall, and it is how many mandates the electorate gave you. */
export const LEGITIMACY_GRADE_ELECTIONS: Array<{ atLeast: number; grade: 'B' | 'C' | 'D' }> = [
  { atLeast: 4, grade: 'B' },
  { atLeast: 2, grade: 'C' },
  { atLeast: 1, grade: 'D' },
] // deposed without ever winning one: F

// ---------- trade ----------
export const TRADE_ELASTICITY = 1.5
export const EXPORT_BASE_SHARE: Record<SectorId, number> = {
  agri: 0.14,
  manuf: 0.1,
  energy: 0.06,
  services: 0.02,
  transport: 0,
}
export const IMPORT_BASE_SHARE: Record<SectorId, number> = {
  agri: 0.04,
  manuf: 0.16,
  energy: 0.06,
  services: 0.02,
  transport: 0,
}
export const RESERVES_INIT_QTRS = 2 // starting reserves ≈ this many quarters of imports
export const DEPRECIATION_WHEN_BROKE = 0.05 // FX depreciation per quarter at zero reserves
export const WORLD_PRICE_VOL: Record<SectorId, number> = {
  agri: 0.015,
  manuf: 0.008,
  energy: 0.03,
  services: 0.005,
  transport: 0.008,
}

// ---------- the rest of world (§10: 5–8 abstract partners, coarse models) ----------
// Each partner is a foreign economy with its own business cycle. Its activity
// (an output gap, 1.0 neutral) drives its DEMAND for your exports and, where
// it's a supplier to world markets, the world PRICE of what it sells. The
// cycles are the source of the terms-of-trade swings and export booms/busts a
// trade-exposed economy lives through — unscripted, emergent from four AR(1)s.
export const PARTNER_CYCLE: Record<
  PartnerId,
  { persistence: number; vol: number; crisisProb: number; crisisDepth: number; drift: number }
> = {
  // a commodity exporter: volatile, boom-bust, occasional supply collapses
  commodity: { persistence: 0.9, vol: 0.02, crisisProb: 0.006, crisisDepth: 0.12, drift: 0.0 },
  // a manufacturing giant: steady secular growth, the cheap-goods deflator
  manufacturing: { persistence: 0.94, vol: 0.012, crisisProb: 0.004, crisisDepth: 0.1, drift: 0.0006 },
  // a financial center: calm until it isn't — sudden stops splash on exports
  financial: { persistence: 0.92, vol: 0.015, crisisProb: 0.008, crisisDepth: 0.18, drift: 0.0 },
  // a regional peer: your correlated neighbor, broad demand
  regional: { persistence: 0.93, vol: 0.018, crisisProb: 0.005, crisisDepth: 0.1, drift: 0.0002 },
}
export const PARTNER_ACTIVITY_MIN = 0.6
export const PARTNER_ACTIVITY_MAX = 1.4
export const PARTNER_BOOM_AT = 1.06 // activity above this makes the foreign pages
export const PARTNER_SLUMP_AT = 0.94

/** who buys your exports of each sector (shares sum to 1 per sector) — a
 * partner in recession simply buys less */
export const EXPORT_DEMAND_WEIGHTS: Record<SectorId, Partial<Record<PartnerId, number>>> = {
  agri: { manufacturing: 0.4, regional: 0.35, commodity: 0.2, financial: 0.05 },
  manuf: { commodity: 0.4, regional: 0.35, manufacturing: 0.15, financial: 0.1 },
  energy: { manufacturing: 0.5, regional: 0.3, commodity: 0.15, financial: 0.05 },
  services: { financial: 0.5, regional: 0.25, manufacturing: 0.15, commodity: 0.1 },
  transport: { regional: 1 },
}

/** who supplies each sector to world markets (shares sum to 1) — a supplier's
 * boom means more supply and a softer world price; its collapse, dearer */
export const WORLD_SUPPLY_WEIGHTS: Record<SectorId, Partial<Record<PartnerId, number>>> = {
  agri: { commodity: 0.4, regional: 0.4, manufacturing: 0.2 },
  manuf: { manufacturing: 0.8, regional: 0.2 },
  energy: { commodity: 0.8, regional: 0.2 },
  services: { financial: 0.6, regional: 0.4 },
  transport: { regional: 1 },
}
/** how hard a supplier's cycle moves the world price it sells (steady-state
 * offset ≈ GAIN·Δactivity·share / WORLD_PRICE_REVERT — kept gentle) */
export const WORLD_SUPPLY_PRICE_GAIN = 0.02

// ---------- the financial sector (§12 M5: fragility) ----------
// Credit and asset prices are the amplifier and the fragility clock. A boom
// runs on credit: cheap money and rising collateral pull investment beyond
// retained earnings (production reads asset prices as Tobin's q). The boom
// quietly levers up the banking system, and leverage above prudence WITH
// assets overvalued is the fuel a Minsky moment burns. Crises also arrive
// from abroad — the financial partner's sudden stop (§10) freezes credit at
// home. None of it is scripted: the cycle emerges from reversion racing a
// collateral feedback loop, and the crash transmits through the same
// confidence/investment/employment channels every other shock does.

/** asset valuation per unit of capital — a Tobin's q / price-to-book, 1946=1.
 * Fundamental is set by profitability and the real rate; the market price
 * departs from it on credit acceleration and animal spirits, then reverts —
 * reversion must out-muscle the feedback at the margin or it ratchets. */
export const ASSET_REVERT = 0.12 // pull toward fundamental per quarter (must beat the feedback)
export const ASSET_FUND_PROFIT_GAIN = 1.4 // fundamental rises with the profit rate…
export const ASSET_NORMAL_PROFIT = 0.38 // …above this (≈ the init profit rate, so calm q≈1)
export const ASSET_FUND_RATE_GAIN = 4.0 // …and falls with the real rate above natural (the discount channel — strong, so easing is what inflates a bubble and tight passive rates keep it calm)
/** credit ACCELERATION (Δ credit/GDP) bids assets up — the bubble feedback.
 * On the flow, not the level, so a bubble deflates once credit stops growing.
 * Kept below reversion's reach so a bubble needs a genuine boom or a rate cut
 * to inflate, not idle drift under a do-nothing government. */
export const ASSET_CREDIT_GAIN = 1.2
export const ASSET_SPIRITS_GAIN = 0.06 // business animal spirits — mild
export const ASSET_VOL = 0.015
export const ASSET_MIN = 0.3
export const ASSET_MAX = 3.0
export const ASSET_BUBBLE_AT = 1.3 // q above this makes the financial pages (a boom warning)

/** credit outstanding, targeted as a share of annual nominal GDP. */
export const CREDIT_BASE = 0.55 // steady-state credit/GDP for a mid-century economy
export const CREDIT_RATE_GAIN = 3.0 // cheap money → more borrowing (per unit real rate below natural) — the boom's engine, and the passive/active separator
export const CREDIT_COLLATERAL_GAIN = 0.25 // high asset prices → more collateral → more credit (per q above 1)
export const CREDIT_SPIRITS_GAIN = 0.25
export const CREDIT_ADJUST = 0.1 // credit stocks move toward target
/** banks lend against capital: a capital-ratio requirement caps credit at
 * bankCapital / CAPITAL_REQUIREMENT. Slack during a boom (borrower demand is
 * the binding limit there), it bites AFTER a crisis writes capital down —
 * that's the forced deleveraging. */
export const CAPITAL_REQUIREMENT = 0.06
export const BANK_TARGET_RATIO = 0.12 // banks hold roughly twice the floor
export const BANK_MARGIN = 0.6 // share of interest retained as capital
export const BANK_SPREAD = 0.02 // lending spread over the policy rate
export const LOAN_LOSS_BASE_Q = 0.002 // calm-time write-offs, share of credit per quarter
export const BANK_DIVIDEND_Q = 0.06 // capital paid out above target per quarter

/** the Minsky clock: a domestic banking crisis. Hazard rises with leverage
 * above prudence TIMES asset overvaluation — you need both cheap credit and a
 * bubble. Kept rare so a prudent century seldom sees one. */
export const CRISIS_LEVERAGE_SAFE = 0.75 // credit/GDP below this adds no fragility
export const CRISIS_ASSET_SAFE = 1.1 // q below this adds no fragility
export const CRISIS_BASE_P = 0.0008 // background hazard (~0.3/century)
export const CRISIS_FRAGILITY_P = 0.9 // × (leverage excess)·(overvaluation)
/** imported crises: a money-centre sudden stop abroad lights the fuse at home,
 * the more so the more levered you are */
export const CRISIS_IMPORT_GAIN = 0.2 // × (0.9 − financial-partner activity)⁺ · (1 + leverage excess)
export const CRISIS_DURATION: [number, number] = [4, 8] // quarters of a run-down crunch
export const CRISIS_SEVERITY_GAIN = 2.5 // × (leverage excess)·(overvaluation), atop a 0.4 floor
export const CRISIS_ASSET_CRASH = 0.55 // asset prices fall up to this × severity on impact
export const CRISIS_WRITEOFF = 0.15 // bank capital loss, share of credit × severity
export const CRISIS_CREDIT_CRUNCH = 0.55 // credit target cut to this fraction while the crisis runs
export const CRISIS_CONF_SHOCK = 0.3 // confidence floored to this on onset — a panic

/** the investment channel: production reads asset prices (Tobin's q) and the
 * crunch. A boom in asset prices pulls investment; a crisis freezes it. */
export const FIN_INVEST_Q_GAIN = 0.35 // added to the investment factor per q above 1
export const FIN_CRUNCH_DRAG = 0.6 // subtracted from the investment factor at full crisis severity

// ---------- politics ----------
export const APPROVAL_DRIFT = 0.2 // per quarter toward experienced conditions
export const LOSS_AVERSION = 2.0 // losses hurt ~2× gains
export const PC_INCOME_SCALE = 6 // political capital per quarter at full approval
export const PC_INCOME_FLOOR = 0.5 // even a hated government scrapes something together
/** §3.4 salience: PC per point of PUBLISHED annualized GDP growth — noisy
 * statistics make this noisy, which is the point of funding the office */
export const PC_HEADLINE_SALIENCE = 0.1
export const PC_HEADLINE_CAP = 0.5 // the papers only care so much either way
export const ELECTION_WIN_THRESHOLD = 0.38
export const PC_START = 20
export const PC_MAX = 100

/** a state that does not have to ask can act: repression buys freedom of
 * manoeuvre, which is exactly why the extractive path is tempting (§4.3) */
export const PC_REPRESSION_GAIN = 0.8
/** …and a country in ferment eats a government's whole week */
export const PC_UNREST_DRAG = 0.5

// action costs (political capital)
export const PC_COST_DIAL_BASE = 1
export const PC_COST_DIAL_SLOPE = 12 // × relative magnitude of the change
export const PC_COST_CAPACITY = 2
/** Layer 3 is generational and contested: a reform costs more than a decade
 * of ordinary policy — unless a crisis has prised the window open (§4.3) */
export const PC_COST_REFORM = 26
export const PC_COST_CAMPAIGN = 4

// ---------- §4.3 institutions, §6.3 the corridor ----------
// Societal power is the y-axis of the Narrow Corridor and, from M6, a live
// state variable. It is not a dial: it is what a society's capacity to
// organize adds up to — who holds the ballot, whether they may print, meet,
// and sue, whether they can read, whether they live close enough together to
// act together — net of how unequal the country is (elite capture hollows out
// formal rights) and how hard the state is standing on them.
export const SOC_ADJUST = 0.022 // per quarter toward target (half-life ≈ 8 years)
export const SOC_BASE = 0.02
export const SOC_FRANCHISE = 0.14 // × population-weighted enfranchisement
export const SOC_PRESS = 0.12
export const SOC_LABOR = 0.12
export const SOC_COURTS = 0.1
export const SOC_EDU = 0.15 // × education capacity: literacy mobilizes
export const SOC_URBAN = 0.12 // × urban share: cities organize, villages don't
export const SOC_INEQ = 0.5 // × Gini above neutral — elite capture
export const SOC_GINI_NEUTRAL = 0.35
export const SOC_REPRESSION = 0.35 // × the boot

/** The x-axis: the Leviathan. The ministries you built, plus the coercive arm
 * repression buys — a police state is a capable state, which is the whole
 * reason despotism is a corner of this map and not just a bad outcome. */
export const STATE_CAPACITY_WEIGHT = 0.75
export const STATE_REPRESSION_WEIGHT = 0.35

/** the corridor is the band |societal − state| ≤ this (the plot draws it) */
export const CORRIDOR_HALF_WIDTH = 0.16

/** Layer 3 stocks ratchet — but a boot has to be kept on the neck, and a
 * state that keeps one erodes the press and the unions while it stands. */
export const REPRESSION_DECAY_Q = 0.01
export const INSTITUTION_EROSION_Q = 0.02 // × repression, on press and labor rights
export const REFORM_STEP = 0.12 // how far one act of reform moves a stock
/** §4.3 reform windows: revolutionary pressure is the only thing that prises
 * open reforms elites would otherwise veto. Never let a good crisis go to waste. */
export const REFORM_WINDOW_AT = 0.35 // unrest above which the window is open
export const REFORM_WINDOW_DISCOUNT = 0.35 // × PC cost while it is
export const REFORM_WINDOW_VETO_RELIEF = 0.6 // × bloc veto weight while it is

/** how institutions start, as a function of development — a richer 1946
 * country inherited more courts and more newspapers, not more suffrage */
export const INSTITUTIONS_1946: Record<InstitutionId, { base: number; devGain: number }> = {
  suffrage: { base: 0, devGain: 0 }, // params.enfranchisement IS the 1946 franchise
  press: { base: 0.08, devGain: 0.35 },
  labor_rights: { base: 0.05, devGain: 0.3 },
  courts: { base: 0.12, devGain: 0.4 },
  repression: { base: 0.16, devGain: -0.2 }, // poorer states lean harder on the boot
}

// ---------- revolutionary pressure ----------
/**
 * Anger arrives faster than it fades. The asymmetry is not decoration: it is
 * what makes a crisis a WINDOW (§4.3) rather than a plateau — pressure spikes
 * inside a year or two, prises the reform window open, and then takes most of
 * a decade to bleed back down, which is exactly how long a government has to
 * use it.
 */
export const UNREST_ADAPT_UP = 0.25
export const UNREST_ADAPT_DOWN = 0.06
export const UNREST_BASE = 0
/**
 * Pressure reads the hardship households ACTUALLY EXPERIENCED — which is
 * exactly what cohort approval already aggregates (real income against habit,
 * loss-averse; own-basket inflation; joblessness; queues for goods that never
 * arrived). Rebuilding those terms here from unemployment and headline
 * inflation was both duplication and wrong: a government that impoverishes
 * people while the subsistence valve keeps them nominally "employed" produced
 * LESS measured unrest than a do-nothing one, because open unemployment fell
 * as families were pushed back onto the farm.
 *
 * The split is the mechanism. Discontent among people who hold a ballot is
 * electoral pressure — they vote you out. Discontent among people who do not
 * is revolutionary pressure, and it is weighted far higher here, which is what
 * makes extending the franchise a genuine bargain rather than pure altruism:
 * it converts the second kind into the first.
 */
export const UNREST_DISCONTENT = 0.22 // × the whole country's dissatisfaction
export const UNREST_VOICELESS = 0.55 // × the part of it that holds no ballot
export const UNREST_INEQ = 0.7 // × Gini above neutral
export const UNREST_GINI_NEUTRAL = 0.38
export const UNREST_CRISIS = 0.5 // × severity while a banking crisis runs
/** The boot damps grievance MULTIPLICATIVELY and only partly: at full
 * repression 45 % of the pressure is still there, waiting. The lid is not the
 * pot. */
export const UNREST_REPRESSION = 0.55
/** …and the strain of sitting outside the corridor is added on top, where
 * repression cannot reach it. This is what makes despotism dangerous rather
 * than merely stagnant — the deeper you walk the dot into the despotic corner,
 * the more pressure you generate that your own boot does not touch. */
export const UNREST_DESPOTISM = 1.2 // × distance outside on the despotic side
export const UNREST_ANARCHY = 0.35 // × distance outside on the anarchic side

/** the street. Above the threshold, each quarter carries a hazard — this is
 * the second way a government ends, and the one repression is buying off. */
export const REVOLT_AT = 0.42
export const REVOLT_P = 0.025 // per quarter per unit of unrest above the line
/** the palace. Elites who have been defied and are not checked by an organized
 * society do not campaign against you; they replace you. */
export const COUP_AT = 0.35 // elite hostility above which the whispering starts
export const COUP_P = 0.12

// ---------- the veto players (§4.3) ----------
/** Bloc POWER is read off the economy each quarter, never authored. A bloc
 * whose base the cycle has just destroyed is a bloc that cannot veto — which
 * is why a crisis is a political opening and not merely a disaster. */
export const LAND_POWER_GAIN = 1.8 // × agriculture's share of gross output
export const IND_POWER_GAIN = 1.1 // × manufacturing+energy+transport share
export const FIN_POWER_CREDIT = 0.55 // × credit/GDP…
export const FIN_POWER_DEBT = 0.35 // …and how much of your debt they hold
export const UNION_POWER_GAIN = 2.2 // × labor rights × urban employment share

/** an organized society is the check on the veto players — the corridor's
 * whole claim, expressed as one multiplier */
export const SOCIETY_CHECK = 0.8
export const BLOC_FAVOR_ADAPT = 0.08
/**
 * Blocs judge a government against the country they woke up in, not against an
 * abstract ideal — the same reference-dependence the cohorts already use for
 * income (LOSS_AVERSION). Without this recentring the stance sums put every
 * bloc's resting favor where the 1946 settlement happens to land, so a
 * do-nothing government inherited a permanent capital strike and an unreported
 * harvest it had done nothing to earn. Measured tick-0 over five generated
 * countries (2026-08, dev 0.30–0.44) and negated, so the opening is neutral
 * and every later reading is a verdict on YOUR policy.
 */
export const BLOC_FAVOR_BASE: Record<BlocId, number> = {
  landowners: 0.41,
  industrialists: 0.26,
  financiers: 0.02,
  unions: -0.27,
}
/** defying a bloc costs you its goodwill, in proportion to how much it minded */
export const BLOC_DEFIANCE = 0.5
/** the PC premium on a lever the room does not want moved */
export const VETO_COST_GAIN = 2.5
/** a courted bloc holds its claim this long, and prices its objections double */
export const PLEDGE_QTRS = 16
export const PLEDGE_VETO_MULT = 2

/** what a hostile bloc actually does to you — one channel each, through the
 * machinery that already exists rather than a scripted penalty */
export const FIN_FAVOR_PREMIUM = 0.05 // capital strike: yield added to your debt
export const FIN_FAVOR_DEPTH = 0.5 // …and the share of the bond market that closes
export const IND_FAVOR_INVEST = 0.5 // investment strike: off the investment factor
export const UNION_FAVOR_WAGE = 0.02 // wage push: added to the quarterly wage move
export const LAND_FAVOR_TAX = 0.5 // the harvest goes unreported: off tax efficiency

/** §4.3 the extractive ceiling, and it is NOT a cap you bump into: incumbents
 * who face no organized society veto the creative destruction that would
 * displace their rents, so the country cannot drink from the frontier as fast.
 * Forced industrialization still works — capital widening is untouched. What
 * dies is the transition. Neutral is calibrated to the 1946 opening, so this
 * is a divergence mechanism, not a tax on everybody. */
export const ELITE_CAPTURE_NEUTRAL = 0.4
export const ELITE_VETO_ABSORB = 2.2
export const ELITE_ABSORB_CLAMP: [number, number] = [0.35, 1.2]
/**
 * What this does and does not do, honestly. It slows CATCH-UP: an economy
 * whose incumbents face no organized society absorbs the frontier more slowly,
 * so a century of despotism ends measurably further behind (attained TFP
 * ~2.58 vs ~2.81 for a corridor government over 400 quarters, same capacity
 * spending). Capital widening is untouched, so forced industrialization still
 * works and the extractive path stays genuinely tempting.
 *
 * It does NOT reproduce the full §4.3 story of "new sectors cannot displace
 * incumbents' rents", and a weighted-by-sector version was tried and removed:
 * the engine's consumption weights are FIXED per cohort (no Engel shift), so
 * the services share of output is pinned by demand and cannot move in response
 * to productivity whatever the veto does. Making the transition itself
 * blockable needs endogenous demand composition, which is a separate change.
 */

// ---------- the election as a scene (§3.1) ----------
/** the swing each platform is worth, in approval points at the ballot box */
export const PLATFORM_SWING: Record<PlatformId, number> = {
  record: 0,
  largesse: 0, // earned, not granted: see LARGESSE_SWING_GAIN
  coalition: 0, // ditto, from the courted bloc's machine
  suppression: 0.15,
  franchise: 0.04, // the enthusiasm of a first vote; the re-weighting is the real effect
}
/** a pre-election giveaway: the transfers dial jumps by this share, and stays
 * jumped — the hangover is that you have to walk it back yourself */
export const LARGESSE_BUMP = 0.5
export const LARGESSE_SWING_GAIN = 2.0 // × the extra spending as a share of GDP
export const COALITION_SWING_GAIN = 0.18 // × the bloc's power × its goodwill
export const SUPPRESSION_REPRESSION_STEP = 0.15
export const FRANCHISE_SUFFRAGE_STEP = 0.2
/** repression lowers the bar rather than raising your vote: an opposition
 * that cannot campaign is an opposition that does not appear in the count */
export const REPRESSION_VOTE_EDGE = 0.25
/** what each platform costs you in the room */
export const PLATFORM_BLOC_COST: Record<PlatformId, Partial<Record<BlocId, number>>> = {
  record: {},
  largesse: { financiers: -0.25 },
  coalition: {}, // handled per-bloc: the courted gain, the rest resent
  suppression: { unions: -0.4 },
  franchise: { landowners: -0.35, industrialists: -0.2 },
}
export const COALITION_FAVOR_GAIN = 0.4
export const COALITION_FAVOR_SNUB = -0.1

/** §3.3 Position: the third axis, graded on the share of your tenure spent
 * inside the corridor — the path, not the endpoint. Calibrated in M6 against
 * measured centuries; see docs/metrics-changelog.md. */
export const POSITION_GRADE_CUTS: Array<{ atLeast: number; grade: 'A' | 'B' | 'C' | 'D' }> = [
  { atLeast: 0.85, grade: 'A' },
  { atLeast: 0.6, grade: 'B' },
  { atLeast: 0.35, grade: 'C' },
  { atLeast: 0.12, grade: 'D' },
] // below: F — the country spent your whole tenure outside the corridor
