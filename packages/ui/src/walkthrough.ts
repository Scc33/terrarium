/**
 * The first-quarter walkthrough: a short tour of the war room, given once.
 *
 * The complaint that made this (#33) was that the levers do not explain
 * themselves — so the tour's job is not to teach economics, it is to say what
 * each region of the screen IS and hand the player the handbook. Six cards is
 * the budget: past that a tour stops being read and starts being dismissed,
 * and a dismissed tour teaches nothing at all.
 *
 * The step list and the arithmetic live here rather than in the component for
 * the reason everything else in this directory does — a component's content is
 * content nothing can test, and a tour that silently loses its last card ends
 * by dropping the player onto the wall mid-sentence.
 *
 * Two deliberate choices:
 *
 * - **The card never covers what it is describing.** Each step names the
 *   region it highlights and the corner it sits in, and `tests/ui/walkthrough`
 *   pins that those two are never the same side. A tour card sitting on top of
 *   the thing it is pointing at is the single most common way this feature
 *   ships broken, and it is invisible in jsdom.
 * - **Being briefed is a preference of this BROWSER, not of the run.** It sits
 *   in `localStorage` beside the board pins, never in the save: a save is the
 *   country, the seed and the decisions, and whether a person has read the
 *   introduction is a fact about the person.
 */

/** the regions the tour can point at; each is a `data-tour` attribute in the
 * war room, and the matching highlight rule is spelled out in `index.css` */
export type TourTarget = 'wall' | 'cabinet' | 'enact' | 'wire' | 'offices'

/** which corner the card sits in — literal Tailwind classes, never composed,
 * because Tailwind scans source text and a built-up class name exists in the
 * DOM and in no stylesheet */
export type TourPlace = 'top-left' | 'bottom-left' | 'bottom-right'

export interface WalkthroughStep {
  id: string
  /** the region to ring while this card is up; null on cards about the run */
  target: TourTarget | null
  place: TourPlace
  title: string
  body: readonly string[]
}

export const WALKTHROUGH_STEPS: readonly WalkthroughStep[] = [
  {
    id: 'posting',
    target: null,
    place: 'bottom-left',
    title: 'YOU HAVE THE MINISTRY',
    body: [
      'You run this country’s economy for a century of quarters. You set rates, write appropriations, build ministries and spend political capital — and then you find out what an economy full of people who are not consulting you does about it.',
      'Nothing here is scripted. A fuel tax reaches the price of bread because transport is an input to agriculture, and for no other reason.',
    ],
  },
  {
    id: 'wall',
    target: 'wall',
    place: 'bottom-right',
    title: 'THE WALL — WHAT YOU CAN SEE',
    body: [
      'These are your instruments, and most of them are blank brass plates because the surveys behind them do not exist yet. You have to pay for the ability to see your own country.',
      'What you can see is late, noisy, and quietly revised months later. That is not a display effect — the statistical office is part of the simulation, and the politics reads its published figures rather than the truth.',
    ],
  },
  {
    id: 'cabinet',
    target: 'cabinet',
    place: 'bottom-left',
    title: 'THE CABINET — EVERY LEVER, FROM QUARTER ONE',
    body: [
      'Taxes, spending, the central bank, subsidies, the ministries you are building and the institutions you might reform. The game never tells you a lever is unavailable; it lets you find out what it does.',
      'Move one and it is DRAFTED, not done. The cabinet quotes a price in political capital and shows you which classes the money reaches, and nothing is committed until you enact.',
    ],
  },
  {
    id: 'enact',
    target: 'enact',
    place: 'bottom-left',
    title: 'DRAFT, PRICE, ENACT',
    body: [
      'Political capital is the budget for CHANGING things. It accrues from approval and from published growth, and every order is priced by how much the powerful blocs mind it.',
      'They can make a change expensive. They can never make it impossible — and the price you are quoted is the price you are charged.',
    ],
  },
  {
    id: 'wire',
    target: 'wire',
    place: 'top-left',
    title: 'THE WIRE — RUMOUR, NOT STATISTICS',
    body: [
      'Dispatches along the bottom. Some of them are wrong, on purpose: the wire is a lead worth investigating, never a reading worth acting on.',
    ],
  },
  {
    id: 'offices',
    target: 'offices',
    place: 'bottom-left',
    title: 'THE HANDBOOK IS ALWAYS THERE',
    body: [
      'The offices along the top hold the paperwork that will not fit on the wall — the accounts, the banks, the census, and the records office.',
      'HANDBOOK is the manual: every lever and what pulling it costs, every instrument and the survey it waits for, how a published figure is made, and what actually happens when you advance a quarter. Open it whenever something on this screen is unexplained.',
      'Press SPACE to advance a quarter. Good luck, minister.',
    ],
  },
]

/** which side of the screen a card sits on, for the invariant that it never
 * covers its own subject */
export const placeSide = (place: TourPlace): 'left' | 'right' =>
  place.endsWith('right') ? 'right' : 'left'

/** and which side of the screen each region occupies in the war room */
export const targetSide = (target: TourTarget): 'left' | 'right' | 'full' =>
  target === 'cabinet' || target === 'enact' ? 'right' : target === 'wall' ? 'left' : 'full'

/**
 * Move through the tour. Returns null past either end, which is what the
 * component reads as "close" — so finishing the last card and dismissing it
 * are the same code path, and there is no way to reach a seventh card that
 * does not exist.
 */
export function stepAt(index: number): WalkthroughStep | null {
  return WALKTHROUGH_STEPS[index] ?? null
}

export const isLastStep = (index: number): boolean => index >= WALKTHROUGH_STEPS.length - 1

/** whether this browser has been walked through the war room before.
 * Exported so the visual-regression harness can pre-set it: every one of those
 * screenshots is of a browser that has never run the game, which is exactly
 * the browser the tour opens itself in. */
export const BRIEFED_KEY = 'terrarium:briefed'

export function hasBeenBriefed(): boolean {
  try {
    return localStorage.getItem(BRIEFED_KEY) === '1'
  } catch {
    // private browsing: offer the tour rather than suppress it. A repeated
    // introduction is a nuisance; a missing one is the bug this fixes.
    return false
  }
}

export function markBriefed(): void {
  try {
    localStorage.setItem(BRIEFED_KEY, '1')
  } catch {
    /* private browsing, quota — the tour still ran, it just won't be remembered */
  }
}

export function forgetBriefing(): void {
  try {
    localStorage.removeItem(BRIEFED_KEY)
  } catch {
    /* nothing to forget */
  }
}
