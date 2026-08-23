/**
 * What every statute on the books actually does, in one place — the statute
 * book's answer to `levers.ts`, and written for the same reason.
 *
 * `STATUTE_COPY` is total over `STATUTE_IDS`, so a statute cannot reach the
 * cabinet without the sentence a player reads before writing it into law, and
 * the handbook chapter is generated from this table rather than authored
 * beside it (ADR-0024). The rungs of each ladder are NOT named here: those
 * come from the engine's own `STATUTE_LEVELS`, published on every
 * `PublishedStatute`, because the name of a rung and the strength it carries
 * are the same fact and must not be written down twice.
 *
 * `resists` is read off `STATUTE_STANCE` in `engine/src/constants.ts` and
 * describes making the rule STRICTER — a repeal reverses it. Same sign trap as
 * the lever table: POSITIVE means the bloc minds a tightening, so labour's
 * −0.9 on the minimum wage means the unions are pushing FOR it.
 *
 * The thing every entry has to get across, and the reason this register exists
 * at all, is that a statute is not a dial. It arrives over two years, it costs
 * more to repeal than it did to pass, and what the country is actually subject
 * to is the rule times what the state can enforce.
 */

import type { StatuteId } from '@terrarium/observation'

export interface StatuteCopy {
  /** the statute book's own heading for the row */
  label: string
  /** what this law is, in plain words */
  hint: string
  /** what it does to the economy, and by what route — the mechanism, because
   * no id list can generate it */
  effect: string
  /** who minds it being tightened, and who is pushing for it */
  resists: string
}

export const STATUTE_COPY: Record<StatuteId, StatuteCopy> = {
  minimum_wage: {
    label: 'Minimum wage',
    hint: 'A legal floor under pay, set against what the average worker earns.',
    effect:
      'It binds where the low wages and most of the workers are, which in a poor country is the fields. Those wages rise and the income distribution narrows — and the same wage bill is a cost, so food gets dearer and some of the jobs go. Both happen; which one dominates depends on the country. In an economy whose lowest-paid sector already earns more than the floor, it binds on nobody and does nothing.',
    resists:
      'Industry pays it and the landed interest pays it in the fields; the money interest counts it in costs. Labour wants it more than anything else in the book.',
  },
  compulsory_schooling: {
    label: 'School-leaving age',
    hint: 'The age below which children must be in a classroom rather than at work.',
    effect:
      'The slowest order on the desk and the only one whose cost arrives a generation before its return. The youngest workers leave the labour force the quarter it bites — a young country pays far more for this than an old one — and what they learn reaches the workforce over about seventeen years. It multiplies the school system you built, so a state with no schools gets the cost and none of the benefit.',
    resists:
      'The landed interest most, because child labour is agricultural before it is industrial. Labour is in favour.',
  },
  emissions_standard: {
    label: 'Emissions standard',
    hint: 'Rules on what industry may put into the air, and the equipment it must fit to comply.',
    effect:
      'It catches dirt before it leaves the chimney, and the equipment that catches it costs money — dearest exactly where the dirt is, so it is nearly free for the service trades and expensive for power generation. The burden it lowers is not a number on a chart: a dirtier country buries more of its people and sees the harvest fail more often, and both of those arrive years after the industry that caused them.',
    resists:
      'Industry minds this more than anything else in the book, because the chimneys are theirs and the equipment comes out of profits. Labour is mildly in favour — they live downwind — but only mildly, because the jobs are in the same factories.',
  },
  competition: {
    label: 'Competition law',
    hint: 'Review of mergers, and the power to break up the firms that dominate a market.',
    effect:
      'The only order aimed at incumbency itself. Entrenched interests are what keep newcomers out, and keeping newcomers out is what stops a country adopting techniques the world already has — so relieving it speeds up catch-up and makes research money go further. It pays a captured country enormously and an already-open one almost nothing.',
    resists:
      'Whoever is currently largest, which is usually industry and the banks together. It does not weaken their hold on the cabinet — only their hold on the market.',
  },
}

/** The drawer's own heading, brief, and the question it answers — the same
 * shape `levers.ts` gives every lever drawer, so the rail prints all of them
 * the same way. */
export const STATUTE_DRAWER = {
  tab: 'STATUTE BOOK',
  brief:
    'Write rules rather than set numbers. A statute takes about two years to arrive, costs more to repeal than it did to pass, and is obeyed only as far as your civil service and courts can enforce it.',
  question: 'Which rules will the country live under?',
} as const

/** How a compliance figure reads on the desk. The bands are wide on purpose:
 * this is a judgement about whether a law is worth having, not a measurement,
 * and printing it to a decimal place would suggest a precision that the
 * underlying capacity stocks do not have. */
export function complianceNote(compliance: number): string {
  if (compliance >= 0.75) return 'Enforced'
  if (compliance >= 0.5) return 'Largely enforced'
  if (compliance >= 0.3) return 'Widely evaded'
  return 'A dead letter'
}
