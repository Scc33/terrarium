/**
 * Step 3.5 — the financial sector (§12 M5: fragility). The credit cycle is the
 * amplifier and the crisis clock in one. Each quarter:
 *   • banks set a credit target from the real rate, collateral (asset prices),
 *     and animal spirits — capped by their capital; credit adjusts toward it;
 *   • asset prices (a Tobin's q) chase a profitability/rate fundamental, but
 *     credit ACCELERATION and spirits push them away — a bubble, which
 *     production then reads as the price of investing;
 *   • the boom levers the banks up, and leverage above prudence WITH assets
 *     overvalued is the fuel a Minsky moment burns. Crises also import from the
 *     financial partner's sudden stop (§10).
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
  ASSET_FUND_PROFIT_GAIN,
  ASSET_FUND_RATE_GAIN,
  ASSET_MAX,
  ASSET_MIN,
  ASSET_NORMAL_PROFIT,
  ASSET_REVERT,
  ASSET_SPIRITS_GAIN,
  ASSET_VOL,
  BANK_DIVIDEND_Q,
  BANK_MARGIN,
  BANK_SPREAD,
  BANK_TARGET_RATIO,
  CAPITAL_REQUIREMENT,
  CONF_NEUTRAL,
  CREDIT_ADJUST,
  CREDIT_BASE,
  CREDIT_COLLATERAL_GAIN,
  CREDIT_RATE_GAIN,
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
  CRISIS_SEVERITY_GAIN,
  CRISIS_WRITEOFF,
  LOAN_LOSS_BASE_Q,
  NATURAL_REAL_RATE,
} from '../constants'
import { clamp } from '../math'
import { SECTOR_IDS, type NewsItem, type Sector } from '../state/schema'
import type { PipelineStep } from './pipeline'
import { privateRealRate } from './derive'

export const finance: PipelineStep = {
  name: 'finance',
  run(state, rng) {
    const { finance: fin, flows, gov, ledger, external } = state
    const news: NewsItem[] = []

    const annualGdp = Math.max(4 * flows.nominalGdp, 1e-9)
    const realRate = privateRealRate(state)
    const profitRate =
      SECTOR_IDS.reduce((s, sid) => s + flows.profits[sid], 0) / Math.max(flows.nominalGdp, 1e-9)
    const businessConf = ledger.confidence.business

    // --- the fundamental: what capital is worth given earnings and the rate ---
    const qFund = clamp(
      1 +
        ASSET_FUND_PROFIT_GAIN * (profitRate - ASSET_NORMAL_PROFIT) -
        ASSET_FUND_RATE_GAIN * (realRate - NATURAL_REAL_RATE),
      0.5,
      2,
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
    const maxRatio = fin.bankCapital / (CAPITAL_REQUIREMENT * annualGdp)
    targetRatio = clamp(Math.min(targetRatio, maxRatio), 0.02, 2.5)
    const creditToGdp = clamp(prevRatio + CREDIT_ADJUST * (targetRatio - prevRatio), 0.02, 2.5)
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
    const creditOutstanding = creditToGdp * annualGdp
    const interestRetained =
      (BANK_MARGIN * creditOutstanding * (gov.dials.policyRate + BANK_SPREAD)) / 4
    let bankCapital = fin.bankCapital + interestRetained - LOAN_LOSS_BASE_Q * creditOutstanding
    const targetCapital = BANK_TARGET_RATIO * creditOutstanding
    if (bankCapital > targetCapital) bankCapital -= BANK_DIVIDEND_Q * (bankCapital - targetCapital)

    // --- the Minsky clock ---
    let { crisisQtrsLeft, crisisSeverity } = fin
    let confidence = ledger.confidence
    if (inCrisis) {
      crisisQtrsLeft -= 1
      if (crisisQtrsLeft === 0) {
        crisisSeverity = 0
        news.push({
          tick: state.meta.tick,
          text: 'The banks are recapitalized at last; credit begins to thaw.',
          tone: 'good',
        })
      }
    } else {
      const leverageExcess = Math.max(0, prevRatio - CRISIS_LEVERAGE_SAFE)
      const overvaluation = Math.max(0, assetPrice - CRISIS_ASSET_SAFE)
      const financialActivity =
        external.world.partners.find((p) => p.id === 'financial')?.activity ?? 1
      const importPressure = Math.max(0, 0.9 - financialActivity) * (1 + leverageExcess)
      const pCrisis =
        CRISIS_BASE_P +
        CRISIS_FRAGILITY_P * leverageExcess * overvaluation +
        CRISIS_IMPORT_GAIN * importPressure
      if (rng.next() < pCrisis) {
        crisisSeverity = clamp(
          0.4 + CRISIS_SEVERITY_GAIN * leverageExcess * overvaluation + 0.5 * importPressure,
          0.3,
          1,
        )
        crisisQtrsLeft = Math.round(rng.range(CRISIS_DURATION[0], CRISIS_DURATION[1]))
        assetPrice = clamp(assetPrice * (1 - CRISIS_ASSET_CRASH * crisisSeverity), ASSET_MIN, ASSET_MAX)
        // the balance-sheet hit: bad loans write down bank capital, which then
        // caps lending — credit runs off gradually over the crisis (the
        // in-crisis target cut), not vanishing overnight
        bankCapital = Math.max(bankCapital - creditOutstanding * CRISIS_WRITEOFF * crisisSeverity, 0.01)
        // a panic: confidence craters, and the ordinary channels do the rest
        confidence = {
          consumer: Math.min(confidence.consumer, CRISIS_CONF_SHOCK),
          business: Math.min(confidence.business, CRISIS_CONF_SHOCK),
        }
        news.push({
          tick: state.meta.tick,
          text:
            importPressure > 0.02
              ? 'A sudden stop: foreign credit vanishes and the banks seize up.'
              : 'Banking crisis: a great lender fails and credit freezes overnight.',
          tone: 'bad',
        })
      } else if (fin.assetPrice < ASSET_BUBBLE_AT && assetPrice >= ASSET_BUBBLE_AT) {
        // a bubble cresting is not fog either — the financial pages crow
        news.push({
          tick: state.meta.tick,
          text: 'Speculation runs hot; asset prices reach giddy new heights.',
          tone: 'neutral',
        })
      }
    }

    const creditGrowth = dRatio * 4 // annualized change in credit/GDP (points/yr as a ratio)

    return {
      ...state,
      sectors: allocateCredit(state.sectors, creditOutstanding),
      finance: {
        assetPrice,
        bankCapital,
        creditOutstanding,
        creditToGdp,
        creditGrowth,
        crisisQtrsLeft,
        crisisSeverity,
      },
      ledger: confidence === ledger.confidence ? ledger : { ...ledger, confidence },
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
