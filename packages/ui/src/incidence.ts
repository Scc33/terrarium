/**
 * Fiscal incidence — who a drafted order actually reaches.
 *
 * This module exists because of a distinction the fog makes and the wall
 * previously did not. A government's knowledge of its own economy is fogged;
 * its knowledge of its own PROGRAMME RULES is not. Transfers are paid out on
 * a fixed schedule of claims — pensions to the retired, relief to the rural
 * and urban poor — so "who loses what if I cut this" is answerable exactly,
 * at zero statistical capacity, from the ministry's own filing cabinet. It is
 * the same class of fact as `treasury.outlaysByProgramme`, not the same class
 * as an income survey.
 *
 * What this module must never do is preview the RESPONSE. The money is a
 * rule; the reaction runs through loss-averse income memory, own-basket
 * prices and shortage — and handing the player that would be handing them
 * their own objective function. Show what is being taken and from whom; let
 * the quarter say what it cost.
 *
 * Pure for the usual reason: incidence computed inside the slider is
 * incidence nobody can test, and the failure mode here is a silent wrong
 * sign — a cut rendered as a gain looks entirely plausible in review.
 */

import { adminEffectiveness, COHORT_IDS, TRANSFER_SHARE, type CohortId, type DialPath } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'

export interface IncidenceRow {
  cohort: CohortId
  /** the cohort's fixed claim on the programme, 0..1 */
  share: number
  /** money per quarter these households gain (+) or lose (−), post-delivery */
  delivered: number
}

export interface Incidence {
  /** the programme this reads the rules of, for the caption */
  programme: 'transfers'
  /** what the treasury's books move by — the full amount, always */
  booked: number
  /** what reaches households once the civil service has handled it */
  delivered: number
  /** share of the booked change that survives delivery, 0.35..1 */
  deliveryRate: number
  /** cohorts with a claim on this programme, largest first. Cohorts with no
   * claim are omitted rather than listed at zero — a nil row reads as "this
   * reaches them and the amount is small", which is the opposite of true. */
  rows: IncidenceRow[]
}

/**
 * Who a change in the transfer bill reaches.
 *
 * `booked` is the change to the quarterly transfer line; `administrative` is
 * civil-service capacity. The gap between booked and delivered is the leak,
 * and it cuts both ways — a raise is less generous than it looks on the
 * books, and a cut takes less from households than it saves the treasury.
 * That asymmetry is worth seeing before the order is enacted, not after.
 */
export function transferIncidence(booked: number, administrative: number): Incidence {
  const deliveryRate = adminEffectiveness(administrative)
  const delivered = booked * deliveryRate
  const rows = COHORT_IDS.filter((id) => TRANSFER_SHARE[id] > 0)
    .map((id) => ({ cohort: id, share: TRANSFER_SHARE[id], delivered: delivered * TRANSFER_SHARE[id] }))
    .sort((a, b) => b.share - a.share)
  return { programme: 'transfers', booked, delivered, deliveryRate, rows }
}

/**
 * Incidence for a staged dial, or null when the ministry has no rule to read.
 *
 * Only the transfer line qualifies today, and the reason the others do not is
 * worth stating: every remaining dial needs a BASE the government can only
 * estimate. Corporate tax has a rule for who bears it (`PROFIT_SHARE`) but
 * the size of the hit is a share of profits nobody has surveyed; income tax
 * and the consumption taxes need the household budget survey to say who earns
 * and who spends what. Those belong to the fogged register and should arrive
 * with it, priced in error bands — not here, quietly presented as certain.
 */
export function dialIncidence(path: DialPath, booked: number, pub: PublishedState): Incidence | null {
  if (path !== 'spending.transfers') return null
  return transferIncidence(booked, pub.capacity.administrative)
}
