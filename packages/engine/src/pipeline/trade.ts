/**
 * Step 4 — trade, and the foreign exchange market that settles it (ADR-0034).
 *
 * The step books the external flows production decided on, and then finds the
 * price that clears them. World prices and export demand are set upstream by
 * the `world` step; what happens here is the balance of payments meeting a
 * currency.
 *
 * The accounting is a central bank's own:
 *
 *   what the country earned abroad  =  what the bank bought  +  what the
 *                                      market had to absorb
 *
 * The bank buys what it ordered (`gov.dials.fxIntervention`) and not a penny
 * more; everything else is foreign currency somebody has to be persuaded to
 * take, and the exchange rate is the persuasion. Reserves therefore stop being
 * the residual of every quarter's balance — which is what they were until v42,
 * and why a passive century ended holding twenty-five to forty-seven QUARTERS
 * of import cover with the rate still sitting at 1.00, having responded to
 * nothing that happened in it.
 *
 * That old behaviour is not gone, it is a SETTING: a bank that buys the whole
 * inflow leaves nothing for the market to clear. The dial slides from there to
 * a clean float at zero, and on into a defence that spends reserves to hold the
 * currency up and can run out of them.
 *
 * It is not a PEG, and the difference is worth stating because it is the
 * mechanic's main limitation. The dial is a standing RATE, so it moves the
 * level the currency floats around; it does not stop it floating, and the tilt
 * still answers to every surprise in the balance of payments at either setting.
 * Measured (`pnpm currency`, section 3): the growth and inflation tails are the
 * same at every setting from a hard defence to the buy rail. A government that
 * wanted to fix the rate outright would need an order that varied to offset the
 * surprise, which nothing on this desk can express.
 *
 * The rate itself is a price with a fundamental and it reverts to it, the same
 * shape `finance.ts` gives the asset price. The fundamental is PARITY —
 * relative prices, the nominal rate at which the country is exactly as
 * competitive as it was in 1946 — tilted by the balance the market must absorb
 * and by the yield spread over the rate the country inherited. Without that anchor the rate
 * has none: the first draft of this step integrated the balance alone, and the
 * appreciation was contractionary, the contraction was deflationary, the
 * deflation restored competitiveness, and the whole thing wound down to the
 * bottom rail over a century.
 */

import {
  DEPRECIATION_WHEN_BROKE,
  FX_BALANCE_NORM_ADAPT,
  FX_BALANCE_TILT,
  FX_CARRY_TILT,
  FX_COVER_ADJUST,
  FX_INTERVENTION_MAX,
  FX_RATE_MAX,
  FX_RATE_MIN,
  FX_TARGET_ADJUST,
  FX_TILT_MAX,
  FX_TILT_MIN,
  FX_WOBBLE,
  POLICY_RATE_1946,
} from '../constants'
import { fileDispatch } from '../events/file'
import { clamp } from '../math'
import { SECTOR_IDS, type Money, type TrueState } from '../state/schema'
import { exchangeRateParity, sovereignRiskPremium } from './derive'
import type { PipelineStep } from './pipeline'

/**
 * The extra yield a foreign holder of this currency is being offered, over the
 * rate the country inherited — and then charged the sovereign premium, because
 * a rate that is high only because the state is a bad credit attracts nobody.
 *
 * Three deliberate choices, each of which was the other way round first:
 *
 * • The POSTED policy rate, not `privateRealRate`. That one carries this
 *   quarter's bond auction and the asset-purchase programme, which are the
 *   crowding-out channel's business; a currency that moved on them would be
 *   reporting the same order twice.
 * • NOMINAL, not real. The real version is a doom loop — appreciation is
 *   contractionary, contraction is deflationary, deflation raises the real
 *   rate, and round again. Parity already tells the price-level half of the
 *   story, in the right direction.
 * • Against `POLICY_RATE_1946`, not against zero or the natural rate. A
 *   government that never touches the rate must not be moving its currency for
 *   having failed to.
 *
 * `sovereignRiskPremium` is imported rather than restated for the reason its
 * own comment gives: the fiscal interest bill, the private funding spread and
 * this quote one sovereign-risk model between them.
 */
export function carryYieldSpread(state: TrueState): number {
  return state.gov.dials.policyRate - POLICY_RATE_1946 - sovereignRiskPremium(state)
}

/**
 * What the bank actually transacts, given what it ordered.
 *
 * Both rails are physical rather than prudential. It cannot BUY foreign
 * currency the country did not earn — the reserve stock only grows out of a
 * surplus that actually arrived — and it cannot SELL reserves it does not
 * hold, which is what makes a currency defence a bet a player can lose rather
 * than a switch they can leave on.
 *
 * The buy rail binds the RESERVES, not the price. A bank bidding for more
 * foreign exchange than the country earned still moves the rate, because the
 * bid is real even when the currency is not there to fill it — that is how a
 * government holds its currency below parity, and the surplus it thereby
 * creates is what eventually fills the order.
 */
export function fillableIntervention(
  ordered: number,
  earned: number,
  reserves: number,
): number {
  return ordered >= 0
    ? Math.min(ordered, Math.max(0, earned))
    : Math.max(ordered, -Math.max(0, reserves))
}

/**
 * The whole foreign exchange settlement for one quarter, from the state
 * `trade` is about to read.
 *
 * It is a separate function because the step is not its only caller: a
 * counterfactual has to be able to ask what the market is heading FOR, and
 * measuring one step's output cannot answer that — the rate closes only
 * `FX_TARGET_ADJUST` of the gap per quarter, so every term would read a
 * twentieth of its size and all of them would look inert. Restating the
 * arithmetic in the tool instead is the thing this codebase keeps a single
 * source of truth to avoid (`politicalCostOfAction` is the other one).
 */
export interface FxSettlement {
  /** exports less imports, plus inward direct investment, less remitted profits */
  currentAccount: Money
  /** what the bank asked for after the sell side was clipped to reserves */
  ordered: Money
  /** what it could actually transact, and therefore the change in reserves */
  transacted: Money
  /** it asked to sell reserves it did not have */
  defenceFailed: boolean
  /** the rate the market is heading for */
  target: number
}

export function settleForeignExchange(state: TrueState): FxSettlement {
  const { flows, gov, market, external } = state

  let exportsValue = 0
  let importsValue = 0 // what importers pay at the border, pre-tariff
  for (const sid of SECTOR_IDS) {
    exportsValue += market.prices[sid] * flows.exportsReal[sid]
    importsValue += external.worldPrices[sid] * external.exchangeRate * flows.importsReal[sid]
  }

  // Direct investment finances the capital-goods order when it enters;
  // earnings remitted to foreign owners are the matching ongoing outflow.
  const currentAccount =
    exportsValue - importsValue + flows.foreignDirectInvestmentValue - flows.foreignProfitRemittances
  const nominalGdp = Math.max(flows.nominalGdp, 1e-9)

  // What the bank ordered, in two parts. The first is not a policy: it keeps a
  // reserve book of roughly the cover it inherited and closes the gap to it
  // slowly. The second is the standing order on the desk, annualized like
  // every other rate there. On the sell side the order itself is clipped —
  // an offer of reserves the bank does not have supports nothing, and that is
  // the failed defence.
  //
  // One-sided, and that is load-bearing. A bank tops up a book that has got
  // thin; it does not dump one that has got large. Symmetric, the term fights
  // the dial: a government ordering accumulation builds reserves, the book goes
  // over target, and the bank sells exactly enough to cancel the order. That
  // shipped, and it read as a lever that did nothing — the +10 % arm of the
  // paired study came out at 1.631 against the float's 1.634 while quietly
  // holding ten times the reserves.
  //
  // And it stops entirely once the cabinet has ordered a DEFENCE, because a
  // routine top-up is what the bank does when nobody has told it otherwise.
  // Left running it inverts the order: reserves near empty make the top-up
  // large, a modest sell order does not cover it, and `wanted` comes out
  // POSITIVE — so the bank bought, and weakened the currency, on a quarter the
  // player ordered it defended. Measured at the dial's own −0.5 % against an
  // empty book, the bank bought 0.66 in domestic money. Worse, `wanted` was
  // then never clipped, so `defenceFailed` read false and the wire went silent
  // about a reserve book that had just run out — the one moment it exists to
  // report.
  const defending = gov.dials.fxIntervention < 0
  const maintenance = defending
    ? 0
    : FX_COVER_ADJUST * Math.max(0, external.coverTarget * importsValue - external.reserves)
  // `flows.nominalGdp` is a QUARTER's output, so an annualized share of annual
  // GDP is `share × 4 × nominalGdp / 4` — the fours cancel, and the quarterly
  // purchase is the share times quarterly GDP. Dividing by four again, which
  // the first draft did, makes the dial a quarter of the size its own label
  // claims and puts it on a different footing from the balance it is supposed
  // to be able to absorb.
  const wanted =
    maintenance +
    clamp(gov.dials.fxIntervention, -FX_INTERVENTION_MAX, FX_INTERVENTION_MAX) * nominalGdp
  const ordered = Math.max(wanted, -Math.max(0, external.reserves))

  // `exchangeRate` is domestic per foreign, so up is depreciation: a balance
  // the market is left holding is a SUPPLY of foreign currency, which makes
  // foreign currency cheap and the rate lower.
  //
  // Against `balanceNorm`, not against zero. These economies run a permanent
  // surplus and the market has always financed it; what moves a currency is
  // the part nobody expected — including the part a central bank has just
  // taken out of the market, which is how the dial works at all.
  const surprise = (currentAccount - ordered) / nominalGdp - external.balanceNorm
  const tilt = clamp(
    1 - FX_BALANCE_TILT * surprise - FX_CARRY_TILT * carryYieldSpread(state),
    FX_TILT_MIN,
    FX_TILT_MAX,
  )

  return {
    currentAccount,
    ordered,
    transacted: fillableIntervention(ordered, currentAccount, external.reserves),
    // The quarter the reserves RUN OUT, not every quarter afterwards. Without
    // the second test a standing sell order against an empty book re-breaks
    // the currency 5 % every quarter for the rest of the century, and the
    // paired study reported a defence that raised exports 25 %.
    defenceFailed: wanted < ordered - 1e-9 && external.reserves > 1e-9,
    target: exchangeRateParity(state) * tilt,
  }
}

export const trade: PipelineStep = {
  name: 'trade',
  run(state, rng) {
    const { flows, external } = state
    const { currentAccount, transacted, defenceFailed, target } =
      settleForeignExchange(state)

    const reserves = Math.max(0, external.reserves + transacted)
    let exchangeRate =
      external.exchangeRate +
      FX_TARGET_ADJUST * (target - external.exchangeRate) +
      external.exchangeRate * rng.normal(0, FX_WOBBLE)
    // A defence that ran out of reserves does not merely stop working; the
    // market has just been told what the reserve position is. This is the same
    // constant the old zero-reserve rule used, now reachable only by ordering
    // a defence rather than by drifting into one.
    if (defenceFailed) exchangeRate *= 1 + DEPRECIATION_WHEN_BROKE
    // The rate is a price and prices in this engine are positive. The rails are
    // wide enough that nothing but a genuine collapse reaches them.
    exchangeRate = clamp(exchangeRate, FX_RATE_MIN, FX_RATE_MAX)

    // What importers pay at the border is the tariff base, and it is booked at
    // the rate the orders were placed at rather than the one that just cleared.
    let importsValue = 0
    for (const sid of SECTOR_IDS) {
      importsValue += external.worldPrices[sid] * external.exchangeRate * flows.importsReal[sid]
    }

    // The market learns the BALANCE, never the residual left after
    // intervention: a norm that chased the residual would price a standing peg
    // in and turn the dial off after a few years.
    const balanceShare = currentAccount / Math.max(flows.nominalGdp, 1e-9)
    const balanceNorm =
      external.balanceNorm + FX_BALANCE_NORM_ADAPT * (balanceShare - external.balanceNorm)

    // A broken defence is a FACT and it always files: the reserve book is the
    // treasury's own arithmetic and importers find out at the counter, so it
    // is not a thing the desk gets to budget out of the page.
    const news = defenceFailed ? [fileDispatch(state, 'currency_defence_failed')] : []

    return {
      ...state,
      external: { ...external, reserves, exchangeRate, balanceNorm },
      stats: news.length > 0 ? { ...state.stats, news: [...state.stats.news, ...news] } : state.stats,
      flows: {
        ...flows,
        tariffBase: importsValue,
        currentAccount,
        fxIntervention: transacted,
      },
    }
  },
}
