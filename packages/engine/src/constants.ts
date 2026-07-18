/**
 * Tuning knobs. Every behavioral constant in the sim lives here so balance
 * work happens in one file. Values target a stable passive run for a mid-poor
 * 1946 economy (the M1 exit criterion (c)).
 */

import type { CohortId, SectorId } from './state/schema'

// ---------- production ----------
export const CAPITAL_ELASTICITY = 0.35
export const LABOR_ELASTICITY = 0.65
export const DEPRECIATION_Q = 0.015 // capital, per quarter (war-worn stock)
export const TFP_DRIFT_Q = 0.0035 // exogenous frontier drip in M1
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
export const CAPACITY_DECAY_Q = 0.004 // neglect is a policy

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
export const PC_PUBLISHED_GDP_BONUS = 0.15 // salience of the headline number
export const ELECTION_WIN_THRESHOLD = 0.38
export const PC_START = 20
export const PC_MAX = 100

// action costs (political capital)
export const PC_COST_DIAL_BASE = 1
export const PC_COST_DIAL_SLOPE = 12 // × relative magnitude of the change
export const PC_COST_CAPACITY = 2
