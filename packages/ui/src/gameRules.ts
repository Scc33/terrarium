/**
 * How the desk reads the rules of the run.
 *
 * The rules themselves are an engine input recorded in the save (ADR-0020);
 * this module owns only what the player is told about them, and the one piece
 * of arithmetic they change — the political-capital meter, which has to read
 * an unlimited cabinet without printing `Infinity` at somebody.
 *
 * `RULE_COPY` is a total `Record` over the engine's id list on purpose: a rule
 * added to the engine fails the build until the posting room has words for it,
 * which is the only thing stopping a safety from shipping unexplained.
 */

import { GAME_RULE_IDS, type GameRuleId, type GameRules } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'

export interface RuleCopy {
  /** the row's heading in the posting room */
  label: string
  /** the two settings, in order: off, then on */
  off: string
  on: string
  /** what each setting actually does — shown under the row as it is chosen */
  caption: { off: string; on: string }
  /** the letterhead's stamp while the rule is on */
  mark: string
}

export const RULE_COPY: Record<GameRuleId, RuleCopy> = {
  protectedTenure: {
    label: 'TENURE',
    off: 'STANDARD',
    on: 'GOD MODE',
    caption: {
      off: 'The electorate, the street, or the palace can remove your government.',
      on: 'Testing safeguard: lost elections, revolts, and coups are recorded, but never end your run.',
    },
    mark: 'GOD MODE',
  },
  fullInstrumentation: {
    label: 'INSTRUMENTS',
    off: 'AS FUNDED',
    on: 'ALL FITTED',
    caption: {
      off: 'A survey reports only once the statistical office can afford to run it.',
      on: 'Every survey reports from 1946. Prints stay lagged, noisy, and revised — capacity still buys accuracy, it no longer buys the instrument.',
    },
    mark: 'ALL INSTRUMENTS',
  },
  unlimitedCapital: {
    label: 'CABINET',
    off: 'STANDARD',
    on: 'UNLIMITED',
    caption: {
      off: 'Every order is paid for out of the political capital you have earned.',
      on: 'Orders are still priced and the room still objects — the bill is simply never charged.',
    },
    mark: 'UNLIMITED PC',
  },
}

/** The letterhead's stamps, in the rules' own order so the chrome is stable. */
export function activeRuleMarks(rules: GameRules): string[] {
  return GAME_RULE_IDS.filter((id) => rules[id]).map((id) => RULE_COPY[id].mark)
}

/** What the political-capital meter says. An unlimited cabinet has no
 * remaining balance to report and no bar to drain, so it reads as a condition
 * rather than a quantity — a meter stuck at a large number would look like a
 * cabinet about to run out of it. */
export interface CapitalReading {
  available: string
  detail: string
  /** what is left after the drafted orders; null while the quote is outstanding */
  after: string | null
  /** how full the bar draws, 0..1 */
  remaining: number
}

export function capitalReading(
  pub: Pick<PublishedState, 'politicalCapital' | 'rules'>,
  /** the drafted orders' total, or null when there is no finite quote yet */
  cost: number | null,
): CapitalReading {
  if (pub.rules.unlimitedCapital) {
    return { available: '∞', detail: 'NOT CHARGED', after: '∞', remaining: 1 }
  }
  const after = cost === null ? null : Math.max(0, pub.politicalCapital - cost)
  return {
    available: pub.politicalCapital.toFixed(1),
    detail: 'AVAILABLE',
    after: after === null ? null : after.toFixed(1),
    remaining: after === null ? 1 : after / Math.max(pub.politicalCapital, 1),
  }
}
