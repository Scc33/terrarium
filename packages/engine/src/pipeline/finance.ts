/**
 * Step 3.5 — the financial sector. The credit cycle is the
 * amplifier and the crisis clock in one. Each quarter:
 *   • banks set a credit target from the real rate, collateral (asset prices),
 *     and animal spirits — capped by their capital; credit adjusts toward it;
 *   • asset prices (a Tobin's q) chase a profitability/rate fundamental, but
 *     credit ACCELERATION and spirits push them away — a bubble, which
 *     production then reads as the price of investing;
 *   • the boom levers the banks up, and leverage above prudence WITH assets
 *     overvalued is the fuel a Minsky moment burns. Crises also import from the
 *     financial partner's sudden stop.
 * A crisis crashes asset prices, writes down bank capital, crunches credit, and
 * panics confidence — the recession then runs through the ordinary investment,
 * employment, and approval channels. Onset always makes the wire: a bank run is
 * not fog. Runs right after `world` and before `production`, like the other
 * terrain-setters: it reads last quarter's realized profits and confidence, and
 * production this tick reads the asset prices, crunch, and panic it leaves.
 */

import {
  ASSET_BUBBLE_AT,
  ASSET_CREDIT_GAIN,
  ASSET_FUND_MAX,
  ASSET_FUND_MIN,
  ASSET_FUND_PROFIT_GAIN,
  ASSET_FUND_RATE_GAIN,
  ASSET_MAX,
  ASSET_MIN,
  ASSET_NORMAL_PROFIT,
  ASSET_REVERT,
  ASSET_SPIRITS_GAIN,
  ASSET_VOL,
  BANK_CAPITAL_FLOOR,
  BANK_DIVIDEND_Q,
  BANK_MARGIN,
  BANK_SPREAD,
  BANK_TARGET_RATIO,
  CONF_NEUTRAL,
  CREDIT_ADJUST,
  CREDIT_BASE,
  CREDIT_COLLATERAL_GAIN,
  CREDIT_RATE_GAIN,
  CREDIT_RATIO_MAX,
  CREDIT_RATIO_MIN,
  CREDIT_SPIRITS_GAIN,
  CRISIS_ASSET_CRASH,
  CRISIS_ASSET_SAFE,
  CRISIS_BASE_P,
  CRISIS_CONF_SHOCK,
  CRISIS_CREDIT_CRUNCH,
  CRISIS_DURATION,
  CRISIS_FRAGILITY_P,
  CRISIS_IMPORT_GAIN,
  CRISIS_LEVERAGE_SAFE,
  CRISIS_SEVERITY_BASE,
  CRISIS_SEVERITY_GAIN,
  CRISIS_SEVERITY_IMPORT_GAIN,
  CRISIS_SEVERITY_MIN,
  CRISIS_SUDDEN_STOP_IMPORT_PRESSURE_AT,
  CRISIS_WRITEOFF,
  FINANCIAL_ACTIVITY_SAFE,
  LOAN_LOSS_BASE_Q,
  NATURAL_REAL_RATE,
  QE_HOLDING_QTRS,
  TURBULENCE,
} from '../constants'
import { fileDispatch } from '../events/file'
import { clamp } from '../math'
import { SECTOR_IDS, type NewsItem, type Sector } from '../state/schema'
import type { PipelineStep } from './pipeline'
import { longNaturalRealRate, privateLongRealRate, privateRealRate } from './funding'
import { officialNominalGdp } from '../state/spending'
import { quoteYieldCurve } from './yields'

export const finance: PipelineStep = {
  name: 'finance',
  run(state, rng) {
    const { finance: fin, flows, gov, ledger, external } = state
    const news: NewsItem[] = []

    const annualGdp = Math.max(4 * flows.nominalGdp, 1e-9)
    // An exact transaction scaled by hidden GDP would publish that GDP by
    // division. Like GDP-share appropriations, orders use the official book.
    // Annualized share × quarterly GDP: the two annualization fours cancel.
    const assetPurchases = gov.dials.assetPurchaseRate * (officialNominalGdp(state) ?? 0)
    const assetRunoff = fin.assetHoldings.filter(lot => lot.maturesAt <= state.meta.tick)
      .reduce((sum, lot) => sum + lot.amount, 0)
    const assetHoldings = fin.assetHoldings.filter(lot => lot.maturesAt > state.meta.tick)
    if (assetPurchases > 0) assetHoldings.push({ amount: assetPurchases, maturesAt: state.meta.tick + QE_HOLDING_QTRS })
    const durationHoldings = assetHoldings.reduce((sum, lot) =>
      sum + lot.amount * (lot.maturesAt - state.meta.tick) / QE_HOLDING_QTRS, 0)
    const priced = { ...state, finance: { ...fin, assetHoldings, durationHoldings } }
    const yieldCurve = quoteYieldCurve(priced)
    priced.finance.yieldCurve = yieldCurve
    const realRate = privateRealRate(priced)
    const longRate = privateLongRealRate(priced)
    const profitRate =
      SECTOR_IDS.reduce((s, sid) => s + flows.profits[sid], 0) / Math.max(flows.nominalGdp, 1e-9)
    const businessConf = ledger.confidence.business

    // --- the fundamental: what capital is worth given earnings and the rate ---
    const qFund = clamp(
      1 +
        ASSET_FUND_PROFIT_GAIN * (profitRate - ASSET_NORMAL_PROFIT) -
        ASSET_FUND_RATE_GAIN * (longRate - longNaturalRealRate()),
      ASSET_FUND_MIN,
      ASSET_FUND_MAX,
    )

    // --- credit: a target from rates, collateral, spirits — capped by capital ---
    const prevRatio = fin.creditToGdp
    let targetRatio =
      CREDIT_BASE +
      CREDIT_RATE_GAIN * (NATURAL_REAL_RATE - realRate) +
      CREDIT_COLLATERAL_GAIN * (fin.assetPrice - 1) +
      CREDIT_SPIRITS_GAIN * (businessConf - CONF_NEUTRAL)
    const inCrisis = fin.crisisQtrsLeft > 0
    if (inCrisis) targetRatio *= CRISIS_CREDIT_CRUNCH
    // banks can only lend so far on their capital
    const maxRatio = fin.bankCapital / (gov.dials.capitalRequirement * annualGdp)
    targetRatio = clamp(Math.min(targetRatio, maxRatio), CREDIT_RATIO_MIN, CREDIT_RATIO_MAX)
    let creditToGdp = clamp(
      prevRatio + CREDIT_ADJUST * (targetRatio - prevRatio),
      CREDIT_RATIO_MIN,
      CREDIT_RATIO_MAX,
    )
    const dRatio = creditToGdp - prevRatio

    // --- asset price: fundamental pull vs credit acceleration and spirits ---
    let assetPrice = clamp(
      fin.assetPrice +
        ASSET_REVERT * (qFund - fin.assetPrice) +
        ASSET_CREDIT_GAIN * dRatio +
        ASSET_SPIRITS_GAIN * (businessConf - CONF_NEUTRAL) +
        rng.normal(0, ASSET_VOL),
      ASSET_MIN,
      ASSET_MAX,
    )

    // --- bank capital: retained interest margin, minus a trickle of bad loans ---
    let creditOutstanding = creditToGdp * annualGdp
    const interestRetained =
      (BANK_MARGIN * creditOutstanding * (gov.dials.policyRate + BANK_SPREAD)) / 4
    let loanWriteoffs = LOAN_LOSS_BASE_Q * creditOutstanding
    let bankCapital = fin.bankCapital + interestRetained - loanWriteoffs
    const targetCapital = BANK_TARGET_RATIO * creditOutstanding
    const bankDividends = bankCapital > targetCapital ? BANK_DIVIDEND_Q * (bankCapital - targetCapital) : 0
    bankCapital -= bankDividends

    // --- the Minsky clock ---
    let { crisisQtrsLeft, crisisSeverity } = fin
    let confidence = ledger.confidence
    if (inCrisis) {
      crisisQtrsLeft -= 1
      if (crisisQtrsLeft === 0) {
        crisisSeverity = 0
        news.push(fileDispatch(state, 'banking_recovery'))
      }
    } else {
      const leverageExcess = Math.max(0, prevRatio - CRISIS_LEVERAGE_SAFE)
      const overvaluation = Math.max(0, assetPrice - CRISIS_ASSET_SAFE)
      const financialActivity =
        external.world.partners.find((p) => p.id === 'financial')?.activity ?? 1
      const importPressure =
        Math.max(0, FINANCIAL_ACTIVITY_SAFE - financialActivity) * (1 + leverageExcess)
      const pCrisis =
        CRISIS_BASE_P * TURBULENCE[state.meta.turbulence].hazard +
        CRISIS_FRAGILITY_P * leverageExcess * overvaluation +
        CRISIS_IMPORT_GAIN * importPressure
      if (rng.next() < pCrisis) {
        crisisSeverity = clamp(
          CRISIS_SEVERITY_BASE +
            CRISIS_SEVERITY_GAIN * leverageExcess * overvaluation +
            CRISIS_SEVERITY_IMPORT_GAIN * importPressure,
          CRISIS_SEVERITY_MIN,
          1,
        )
        crisisQtrsLeft = Math.round(rng.range(CRISIS_DURATION[0], CRISIS_DURATION[1]))
        assetPrice = clamp(assetPrice * (1 - CRISIS_ASSET_CRASH * crisisSeverity), ASSET_MIN, ASSET_MAX)
        // the balance-sheet hit: bad loans write down bank capital, which then
        // caps lending — credit runs off gradually over the crisis (the
        // in-crisis target cut), not vanishing overnight
        const crisisLoss = Math.min(creditOutstanding - loanWriteoffs, creditOutstanding * CRISIS_WRITEOFF * crisisSeverity)
        loanWriteoffs += crisisLoss
        bankCapital = Math.max(
          bankCapital - crisisLoss,
          BANK_CAPITAL_FLOOR,
        )
        // a panic: confidence craters, and the ordinary channels do the rest
        confidence = {
          consumer: Math.min(confidence.consumer, CRISIS_CONF_SHOCK),
          business: Math.min(confidence.business, CRISIS_CONF_SHOCK),
        }
        // Two events, one `kind`. The distinction is causal — a crisis
        // imported through the foreign lending channel is not the same story
        // as one the country's own leverage earned — and giving each its own
        // id is what lets the copy say so without the crisis MARKERS on the
        // fragility charts having to care which it was.
        news.push(
          fileDispatch(
            state,
            importPressure > CRISIS_SUDDEN_STOP_IMPORT_PRESSURE_AT
              ? 'banking_crisis_sudden_stop'
              : 'banking_crisis',
          ),
        )
      } else if (fin.assetPrice < ASSET_BUBBLE_AT && assetPrice >= ASSET_BUBBLE_AT) {
        // a bubble cresting is not fog either — the financial pages crow
        news.push(fileDispatch(state, 'asset_bubble'))
      }
    }

    creditOutstanding = Math.max(0, creditOutstanding - loanWriteoffs)
    creditToGdp = creditOutstanding / annualGdp
    const businessCreditFlow = creditOutstanding - fin.creditOutstanding + loanWriteoffs
    const creditGrowth = (creditToGdp - prevRatio) * 4 // annualized change in credit/GDP (points/yr as a ratio)

    return {
      ...state,
      sectors: allocateCredit(state.sectors, creditOutstanding),
      finance: {
        yieldCurve,
        assetHoldings,
        durationHoldings,
        centralBankAssets: Math.max(0, fin.centralBankAssets + assetPurchases - assetRunoff),
        assetPrice,
        bankCapital,
        creditOutstanding,
        creditToGdp,
        creditGrowth,
        crisisQtrsLeft,
        crisisSeverity,
      },
      ledger: confidence === ledger.confidence ? ledger : { ...ledger, confidence },
      flows: { ...flows, assetPurchases, assetRunoff, businessCreditFlow, loanWriteoffs,
        bankRetainedMargin: interestRetained, bankDividends },
      stats: news.length > 0 ? { ...state.stats, news: [...state.stats.news, ...news] } : state.stats,
    }
  },
}

/** spread aggregate credit across sectors by capital share — bigger sectors
 * carry more of the debt (and sour proportionately in a crisis). */
function allocateCredit(sectors: Sector[], total: number): Sector[] {
  const capitalTotal = sectors.reduce((s, x) => s + Math.max(x.capital, 0), 0)
  if (capitalTotal <= 1e-9) return sectors
  return sectors.map((s) => ({ ...s, credit: (total * Math.max(s.capital, 0)) / capitalTotal }))
}
