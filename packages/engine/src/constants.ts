/**
 * Tuning knobs. Every behavioral constant in the sim lives here so balance
 * work happens in one file. Values target a stable passive run for a mid-poor
 * 1946 economy (the M1 exit criterion (c)).
 */

import type { CapacityId, CohortId, SectorId } from './state/schema'

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
export const RISK_PREMIUM_SLOPE = 0.06 // adds to interest as debt/GDP grows past 0.5

// ---------- capacity (Layer 2) ----------
export const CAPACITY_COST_PER_POINT = 60 // money per 1.0 of capacity
export const CAPACITY_BUILD_QTRS = 8 // arrives over 2 years
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

// action costs (political capital)
export const PC_COST_DIAL_BASE = 1
export const PC_COST_DIAL_SLOPE = 12 // × relative magnitude of the change
export const PC_COST_CAPACITY = 2
