/**
 * The ministry handbook: everything the game knows how to explain about
 * itself, as data rather than as markup.
 *
 * Three complaints made this: nobody could find out what a lever did without
 * pulling it (#33), the methodology behind the published figures existed only
 * in the engine's comments (#32), and there was no manual of the sort a boxed
 * strategy game used to ship with (#80). One portal answers all three, but
 * only if it cannot go stale — so the chapters that describe *things the game
 * has* are GENERATED from the same id lists and copy tables the screens read:
 *
 * - the cabinet chapter walks `LEVER_GROUPS` / `LEVER_COPY` / `CAPACITY_COPY`
 *   / `STATUTE_COPY`, which are total over `DialPath`, `CapacityId` and
 *   `StatuteId` — and a statute's RUNGS come from the engine's own
 *   `STATUTE_LEVELS`, never renamed here;
 * - the wall chapter walks `INDICATOR_IDS` in funding order, taking every word
 *   from `NAMES` and every gate from `INDICATOR_FUNDED_AT`;
 * - the room chapter walks `BLOC_IDS`, `COHORT_IDS`, `INSTITUTION_IDS` and the
 *   platform table; the run chapter walks `GAME_RULE_IDS` and `APPOINTMENTS`.
 *
 * A new indicator, lever, statute, bloc, institution, sector or rule therefore appears
 * in the manual the quarter it appears in the game, and — because those tables
 * are compile-enforced `Record`s — cannot appear without words.
 *
 * What is authored here is only the prose that explains MECHANISM, which no id
 * list can generate. Numbers in that prose come from the engine's exported
 * constants wherever the engine exports one, so a retune moves the manual too.
 * Where a number is quoted that the engine does not export (the eight-quarter
 * capacity delivery, the revision schedule), it is quoted the way the cabinet
 * already prints it, and `tests/ui/manual.test.ts` is where that agreement is
 * pinned.
 *
 * This module is pure and has no React in it for the usual reason: content
 * pushed into a component is content nothing can test, and a handbook that
 * silently loses a chapter is worse than no handbook, because the player
 * concludes the game has no answer rather than that the page is broken.
 */

import {
  APPOINTMENTS,
  BLOC_IDS,
  CAPACITY_IDS,
  COHORT_IDS,
  ELECTION_PERIOD,
  END_OF_HISTORY_TICK,
  FIRST_YEAR,
  GAME_RULE_IDS,
  INDICATOR_FUNDED_AT,
  INSTITUTION_IDS,
  PC_START,
  REFORM_WINDOW_AT,
  REVOLT_AT,
  STATUTE_IDS,
  STATUTE_LEVELS,
  STATUTE_PHASE_IN_QTRS,
} from '@terrarium/engine'
import { INDICATOR_IDS } from '@terrarium/observation'
import {
  BLOC_NAMES,
  BLOC_NOTES,
  COHORT_NAMES,
  COHORT_NOTES,
  COUNT_NOTES,
  INSTITUTION_NAMES,
  NAMES,
  PLATFORM_NAMES,
  PLATFORM_NOTES,
} from './components/labels'
import { RULE_COPY } from './gameRules'
import { CAPACITY_COPY, LEVER_COPY, LEVER_GROUPS } from './levers'
import { STATUTE_COPY, STATUTE_DRAWER } from './statutes'
import { BOARD_SLOTS } from './wallPlan'
import { TERMINAL_AT } from './maturity'

/** A named thing with an explanation: a lever, an instrument, a bloc. */
export interface ManualEntry {
  term: string
  detail: string
  /** a short marker printed against the term — a capacity gate, a tab, a year */
  meta?: string
}

export interface ManualSection {
  heading: string
  /** paragraphs of explanation, in reading order */
  body?: readonly string[]
  /** the named things this section is about */
  entries?: readonly ManualEntry[]
}

export const MANUAL_CHAPTER_IDS = [
  'briefing',
  'cabinet',
  'wall',
  'figures',
  'economy',
  'room',
  'run',
] as const

export type ManualChapterId = (typeof MANUAL_CHAPTER_IDS)[number]

export interface ManualChapter {
  id: ManualChapterId
  /** the spine's label */
  title: string
  /** one line under the title, and the spine's subtitle */
  blurb: string
  sections: readonly ManualSection[]
}

const LAST_YEAR = FIRST_YEAR + END_OF_HISTORY_TICK / 4
const ELECTION_YEARS = ELECTION_PERIOD / 4

// ---------- the chapters that are generated ----------

/** Every lever, in the order the cabinet's drawers are in. */
const cabinetSections = (): ManualSection[] => [
  {
    heading: 'HOW AN ORDER IS GIVEN',
    body: [
      'Nothing you do takes effect the moment you do it. Moving a dial DRAFTS a change: the cabinet prices it in political capital, shows you who it reaches, and holds it until you enact the quarter. Until then it costs nothing and can be reset.',
      `Political capital is the budget for changing things, not for buying them. You start with ${PC_START} points and earn more each quarter from approval, from published headline growth, and — if you are willing to pay for it that way — from repression. Ordinary policy is cheap; a reform is generational and priced like one.`,
      'Every price you are quoted is the price you are charged. The room objects in advance rather than refusing after the fact: a bloc that minds a change makes it expensive, and no bloc can make it impossible.',
    ],
  },
  ...LEVER_GROUPS.map((group) => ({
    heading: `${group.group} — ${group.tab}`,
    body: [group.brief, group.question],
    entries: group.paths.map((path) => ({
      term: LEVER_COPY[path].label,
      detail: `${LEVER_COPY[path].hint} ${LEVER_COPY[path].resists}`,
    })),
  })),
  {
    heading: 'SPENDING — THE THREE APPROPRIATION RULES',
    body: [
      'A spending programme is not a number, it is a rule, and the rule is the decision. FIXED holds the cash amount until you change it, so inflation quietly cuts it every quarter. CPI moves it with each new first-release inflation print — including the wrong ones, because that is the number the treasury has. % GDP claims a share of the latest officially published nominal output, so it moves with a figure that is itself lagged and revised.',
      'This is where the fog reaches the budget. A GDP-share rule cannot be written before the national accounts exist to write it against, and once written it appropriates against a published estimate rather than against the truth.',
    ],
  },
  {
    heading: 'STATE CAPACITY — THE FOUR MINISTRIES',
    body: [
      'Capacity is the slowest and most valuable thing on the desk. A funding programme is paid over eight quarters and arrives over the same eight — an eighth at a time, starting the quarter you enact it, so a little of it is working immediately and none of it is finished for two years. Everything else you do is scaled by what you built.',
      'It is also the only order on the desk with a FLAT price. Rates, appropriations and reforms are priced by how much the room minds them; building a ministry is quoted at the same handful of points however hostile the blocs are. A government the room has turned against can still build the state.',
    ],
    entries: CAPACITY_IDS.map((id) => ({
      term: CAPACITY_COPY[id].label,
      detail: `${CAPACITY_COPY[id].hint} ${CAPACITY_COPY[id].detail}`,
      meta: CAPACITY_COPY[id].effect,
    })),
  },
  {
    heading: `STATUTES — ${STATUTE_DRAWER.tab}`,
    body: [
      STATUTE_DRAWER.brief,
      `A statute is not a dial, and the three differences are the whole register. It ARRIVES rather than switching on — about ${STATUTE_PHASE_IN_QTRS / 4} years from signature to full effect. It costs more to REPEAL than it did to pass, and more the longer it has stood, because the people a law creates defend it. And what the country is actually subject to is never what you wrote: it is the rule times what your civil service and your courts can enforce, less whatever the blocs who mind it decline to obey.`,
      'That last part is the same lesson the tax office teaches. A posted tax rate is not collected revenue and a voted appropriation is not delivered money; a written rule is not an obeyed one. The difference is that here the people evading it have names, and you can see them in the whip count. A government with no inspectorate can post the strictest law in the book and change almost nothing — it will pay the full price for it either way.',
      'A crisis passes legislation. The same unrest that prises open a constitutional reform discounts a statute, for the same reason and by the same amount.',
    ],
    entries: STATUTE_IDS.map((id) => ({
      term: STATUTE_COPY[id].label,
      detail: `${STATUTE_COPY[id].hint} ${STATUTE_COPY[id].effect} ${STATUTE_COPY[id].resists}`,
      meta: STATUTE_LEVELS[id].map((rung) => rung.name).join(' · '),
    })),
  },
  {
    heading: 'INSTITUTIONS — THE SLOWEST DRAWER',
    body: [
      `Reform is generational, contested, and ratcheting. The people who would lose by a reform are, by construction, the people currently holding the veto, which is why one costs more than a decade of ordinary policy.`,
      `Unrest past ${REFORM_WINDOW_AT.toFixed(2)} prises a window open, and the window is a DISCOUNT rather than a permission: it cuts the price and softens the veto premium while it lasts. A reform nobody much minds — the courts are the usual example — is affordable in a calm decade to a government that has banked the capital for it. Waiting for a crisis is a way to afford the contested ones, not a condition of reforming at all.`,
      'Institutions are also the y-axis of the corridor. Broadening who may vote, print, organise and sue raises what society can do for itself; repression raises what the state can do to society. Prosperity lives in the band where neither has run away from the other.',
    ],
    entries: INSTITUTION_IDS.map((id) => ({
      term: INSTITUTION_NAMES[id].name,
      detail: INSTITUTION_NAMES[id].note,
    })),
  },
]

/** Every instrument, in the order a statistical office can afford them. */
const wallSections = (): ManualSection[] => {
  const byGate = [...INDICATOR_IDS].sort(
    (a, b) => INDICATOR_FUNDED_AT[a] - INDICATOR_FUNDED_AT[b] || NAMES[a].plate.localeCompare(NAMES[b].plate),
  )
  return [
    {
      heading: 'READING THE WALL',
      body: [
        `The wall is a board, a rack, and two docked figures. Up to ${BOARD_SLOTS} instruments sit on the board at full size — that is a preference belonging to you and your screen, not to the run, so pinning something does not change the game. Everything else appears as a strip in the rack. The ledger and the corridor plot are docked below.`,
        `An instrument's appearance is diegetic: it tells you how well it is measured. A blank brass plate is an instrument you have not funded. The paper-and-brass dossier face is a hand-compiled ministry return. The green terminal face arrives once the statistical office passes ${Math.round(TERMINAL_AT * 100)} — the same number, better measured.`,
        'A dial face never moves. It is fixed per indicator and measured against a century of play, so the needle position means the same thing in 1950 as in 2040. A reading past the end of the face pegs at the rail with a chevron rather than rescaling the dial — going off the scale is information. A chart, which has printed axis numbers to describe itself with, does the opposite: it frames the dial face and extends past it, because clamping a trace would erase a hyperinflation and a calm decade into the same flat line.',
        'A print stamped REVISED is one the office has since materially corrected: wrong by more than twice the error band it confessed on its first release, and wrong by enough to visibly move the needle. It is deliberately rare — a warning that never turns off is not a warning.',
      ],
    },
    {
      heading: 'THE INSTRUMENTS',
      body: [
        'Each survey needs a minimum statistical-office strength before it reports at all. The number against each instrument is that gate, out of 100. They are listed in the order a country can afford them, which is roughly the order they are worth learning in.',
        'Under the ALL FITTED standing order these gates do not apply: every survey is commissioned from the first quarter and starts measuring at once. It does not start REPORTING at once — the lag is untouched, so the opening quarter or two still show commissioned instruments awaiting their first return, and capacity goes on buying speed and accuracy from there. The gates below describe an ordinary run.',
      ],
      entries: byGate.map((id) => ({
        term: NAMES[id].plate,
        detail: NAMES[id].note,
        meta: `${Math.round(INDICATOR_FUNDED_AT[id] * 100)} · ${NAMES[id].needs}`,
      })),
    },
  ]
}

const roomSections = (): ManualSection[] => [
  {
    heading: 'THE VETO PLAYERS',
    body: [
      'Bloc power is never authored. It is read off the economy each quarter — the landed interest is as strong as agriculture is large, finance as strong as the credit stock and the debt it holds — which is why a crisis is a political opening rather than a scripted event. What is authored is only what each bloc WANTS.',
      'Favour is judged against the settlement you inherited, not against zero. A government that does nothing keeps the room it was given; a government that governs spends favour.',
      'What spent favour costs you is not a higher price at the cabinet — the quote reads a bloc’s POWER and how much it minds this particular change, never how it feels about you generally. What an aggrieved bloc withdraws is its cooperation with the economy. Industry invests less, organised labour presses harder on wages, the landed pay less of what they owe, and the money interest takes less of your debt at auction. Restoring goodwill will not make a lever cheaper; it will make the country work better.',
    ],
    entries: BLOC_IDS.map((id) => ({ term: BLOC_NAMES[id], detail: BLOC_NOTES[id] })),
  },
  {
    heading: 'THE CLASSES',
    body: [
      'The country is five groups who earn from different places, spend different shares of what they get, and buy different baskets. That is why the same money is a different policy depending on who catches it, and why the cabinet costs a budget line per class rather than per head.',
    ],
    entries: COHORT_IDS.map((id) => ({ term: COHORT_NAMES[id], detail: COHORT_NOTES[id] })),
  },
  {
    heading: 'ELECTIONS',
    body: [
      `An election falls every ${ELECTION_PERIOD} quarters — ${ELECTION_YEARS} years — and the campaign opens two quarters before the vote. Approval drifts toward conditions as households actually experience them, and losses hurt about twice as much as equivalent gains, so a boom that ends level with where it started is a net loss of support.`,
    ],
    entries: [
      { term: 'Support', detail: COUNT_NOTES.support },
      { term: 'The bar', detail: COUNT_NOTES.threshold },
      { term: 'The margin', detail: COUNT_NOTES.margin },
    ],
  },
  {
    heading: 'HOW YOU FIGHT ONE',
    body: [
      'Every platform but the first is a swing bought on credit, and the game names the creditor before you sign.',
    ],
    entries: (Object.keys(PLATFORM_NAMES) as Array<keyof typeof PLATFORM_NAMES>).map((id) => ({
      term: PLATFORM_NAMES[id].replace(/^\w/, (c) => c.toUpperCase()),
      detail: PLATFORM_NOTES[id],
    })),
  },
  {
    heading: 'UNREST, REVOLT AND THE CORRIDOR',
    body: [
      `Unrest reads the hardship households actually experienced, not the unemployment rate — the subsistence valve keeps the impoverished nominally employed, so a country can be in real distress with a respectable labour figure. Above ${REFORM_WINDOW_AT.toFixed(2)} the reform window opens and the elites' veto is discounted. Above ${REVOLT_AT.toFixed(2)} the country is in revolutionary territory.`,
      'Repression damps grievance, but never to zero, and the strain it puts on the corridor is added outside that damping — so the boot always costs something it cannot pay for. It also erodes the press and labour rights while it stands, which is how an extractive government slowly stops being able to hear that anything is wrong.',
      'The corridor plot is the whole thesis in one figure: state capacity along one axis, what society can do for itself along the other, and prosperity in the narrow band where neither has escaped the other. A state with no society is despotism; a society with no state is anarchy. Both are outside the band, and both are reachable.',
    ],
  },
]

const runSections = (): ManualSection[] => [
  {
    heading: 'THE STANDING ORDERS',
    body: [
      'These are chosen in the posting room and sealed into the save. They are rules of the run, not display settings: the same country, seed and decisions produce a different century under each, which is why they cannot be switched on halfway.',
    ],
    entries: GAME_RULE_IDS.map((id) => ({
      term: RULE_COPY[id].label,
      detail: `${RULE_COPY[id].off.toUpperCase()} — ${RULE_COPY[id].caption.off} ${RULE_COPY[id].on.toUpperCase()} — ${RULE_COPY[id].caption.on}`,
      meta: RULE_COPY[id].mark,
    })),
  },
  {
    heading: 'THE YEAR YOU TAKE OFFICE',
    body: [
      `The book always closes in ${LAST_YEAR}. Taking office later does not change that — it changes what you inherit and how long you have. The quarters before your appointment are governed by a caretaker who builds ministries and holds the opening appropriations at their share of output; it sets no rate and moves no tax. Its orders go into the save's action log like anyone else's, so the country you inherit is the one that was actually lived.`,
      'You are scored only on your own tenure. The standard of living you inherit becomes the baseline you are judged against, and the political clock does not run during the interregnum.',
    ],
    entries: APPOINTMENTS.map((appointment) => ({
      term: `${appointment.year} — ${appointment.name}`,
      detail: appointment.summary,
      meta: `${(END_OF_HISTORY_TICK - appointment.tick) / 4} YEARS`,
    })),
  },
  {
    heading: 'SAVES, AND WHY THEY ARE SMALL',
    body: [
      'A save is the country, the seed, and your decisions — a few kilobytes — because the state is not stored, it is replayed. Loading a save re-runs the century from the beginning and arrives at exactly the same place.',
      'That is also what makes a save a bug report. If something looks wrong, export it and say which quarter to look at; anyone can reproduce the exact run.',
      'It has one consequence worth knowing: a save from an older build opens only if the whole replay still succeeds. The game attempts the load and commits nothing until it does, then tells you in words if it could not. It will never repair a save to make it open — filling in a field the country predates would open A country, not the one you saved.',
    ],
  },
  {
    heading: 'AT THE KEYBOARD',
    entries: [
      { term: 'Space', detail: 'Advance one quarter. A century is four hundred quarters; this is the verb you will use most.', meta: 'ADVANCE' },
      { term: 'Escape', detail: 'Close whatever paperwork is on the desk.', meta: 'CLOSE' },
      { term: 'Arrow keys', detail: 'Move between the cabinet drawers when a tab has focus. Home and End jump to the first and last.', meta: 'CABINET' },
    ],
  },
]

// ---------- the chapters that are written ----------

const MANUAL_DEFINITION: Record<ManualChapterId, ManualChapter> = {
  briefing: {
    id: 'briefing',
    title: 'THE POSTING',
    blurb: 'What the job is, and how a quarter goes.',
    sections: [
      {
        heading: 'YOUR APPOINTMENT',
        body: [
          `You run a country's economy for a century of quarters, ending in ${LAST_YEAR}. You are not a head of state and you do not command the country: you set rates, write appropriations, fund ministries and spend political capital on reform, and then you watch what an economy full of people who are not consulting you does about it.`,
          'The catch is that you cannot see clearly. Your figures are late, noisy, and quietly revised long after you have staked a career on them. Everything you know about the country arrives through a statistical office you have to pay for.',
          'Every lever is available from the first quarter. The game never tells you no — it lets you find out.',
        ],
      },
      {
        heading: 'THE LOOP',
        body: [
          'A quarter has three parts. READ the wall: what the instruments you have funded are willing to tell you. DRAFT orders in the cabinet: each one is priced in political capital and shows you which classes it reaches before you commit. ENACT, and advance — space bar — and the economy computes a quarter with your orders in it.',
          `An election falls every ${ELECTION_YEARS} years and asks the people holding a ballot whether they will have you again. Lose badly enough, or let the country pass into revolt, and your run can end early.`,
        ],
      },
      {
        heading: 'WHAT IT IS FOR',
        body: [
          'There are no scripted events tied to your policies. A fuel tax reaches the price of bread because transport is an input to agriculture, and for no other reason. Everything surprising in this game is a consequence rather than a rule, which means the way to get better at it is to get better at economics — that is the whole design.',
          'The report card at the end grades prosperity, position, and legitimacy separately: how rich the country became against what you inherited, where it sits between despotism and anarchy, and whether it consented to you. There is no single score, because those three genuinely trade off.',
        ],
      },
      {
        heading: 'WHERE THINGS ARE',
        entries: [
          { term: 'The wall', detail: 'The instruments, the ledger and the corridor plot. Everything you can see about the country.', meta: 'CENTRE' },
          { term: 'The cabinet', detail: 'Every lever, grouped by decision domain, with the draft-and-enact flow pinned below it.', meta: 'RIGHT' },
          { term: 'The wire', detail: 'Rumours and dispatches along the bottom. Some of them are wrong; that is the point.', meta: 'BOTTOM' },
          { term: 'The offices', detail: 'Industry, accounts, finance, the census, the study and the records office — the paperwork that does not fit on the wall.', meta: 'HEADER' },
        ],
      },
    ],
  },
  cabinet: {
    id: 'cabinet',
    title: 'THE CABINET',
    blurb: 'Every lever on the desk, and what pulling it costs.',
    sections: cabinetSections(),
  },
  wall: {
    id: 'wall',
    title: 'THE WALL',
    blurb: 'Every instrument, and the survey that has to exist first.',
    sections: wallSections(),
  },
  figures: {
    id: 'figures',
    title: 'THE FIGURES',
    blurb: 'How a published number is made, and why it is wrong.',
    sections: [
      {
        heading: 'THE OFFICE IS PART OF THE MODEL',
        body: [
          'The fog is not a display effect layered over a known truth. It is manufactured inside the simulation, by a statistical office that is a real institution with a budget, and it is causal: parts of the political system read the PUBLISHED headline rather than the truth. Political capital accrues partly on published growth, and a CPI-indexed appropriation moves on the published inflation print — including the ones later found to have been wrong.',
          'Approval is the exception, and it is the one worth knowing. Households do not read your statistics: their approval moves on the income they actually received, the prices in their own basket, whether they had work, and whether the shops had goods. You can publish a splendid quarter into a country that knows perfectly well how it went. The fog is between you and the country, not between the country and itself.',
          'The noise the office makes is drawn from its own random streams, kept deliberately separate from the economy’s. Measuring the country never changes the country — it only changes what anyone believes about it.',
        ],
      },
      {
        heading: 'THE THREE THINGS A PRINT IS NOT',
        entries: [
          {
            term: 'Not immediate',
            detail: 'A first release describes a quarter that has already ended. A weak office takes two quarters to compile; past half strength it takes one. Price boards are the exception — a market price is read off the market the same quarter, however poor the office is.',
            meta: 'LAG',
          },
          {
            term: 'Not exact',
            detail: 'Noise is added to every print, and it is largest when the office is weakest. Below 45 capacity the office does not publish an error band at all — the print arrives bare, at its least reliable, confessing nothing. Above that it states a band, and the band is honest: it is the office’s own estimate of its uncertainty, and it narrows with capacity without ever reaching zero. Level series carry proportional error and rates carry absolute error, so a small share and a large one are not measured to the same precision.',
            meta: 'NOISE',
          },
          {
            term: 'Not final',
            detail: 'Each measured quarter is published three times: a first release, a revision two quarters later, and a final revision five quarters after that. Later prints are better measured. This means the past changes shape behind you — the recession you responded to may not be the recession that ends up in the record.',
            meta: 'REVISION',
          },
        ],
      },
      {
        heading: 'WHAT MONEY BUYS',
        body: [
          'Funding the statistical office buys three different things in sequence, and it is worth knowing which one you are buying. Below an instrument’s gate, it buys the instrument: the survey does not exist and the plate is blank. Above the gate, it buys speed — the lag falls from two quarters to one at half strength. Throughout, it buys accuracy: the error band narrows steadily with capacity.',
          'It never buys the truth. There is no level of funding at which the wall stops being an estimate.',
        ],
      },
      {
        heading: 'NOT EVERY SURVEY IS AN INSTRUMENT',
        body: [
          'The office publishes one thing that is not a dial. The industrial census — in the industry office, on the header — reports what each industry produced and how many people it employed, and it is fogged exactly like everything else: gated on the same statistical capacity, released with the same lag, revised on the same schedule. It has no gauge because a share of the economy has no single honest face; a country that opens half agricultural and one that opens barely agricultural cannot be read against the same dial.',
          'Because each industry is surveyed separately, the five figures do not add up to the published output, and the census states its own uncertainty per table rather than for the release: an enumerator can count heads at a factory gate and has to estimate what the factory made, so the jobs column is measured better than the output column and says so.',
        ],
      },
      {
        heading: 'THE WIRE',
        body: [
          'The wire carries two kinds of traffic and does not label them. Events are reported straight: a drought breaking, a banking crisis, a research breakthrough, an election, a revolt, a country crossing into or out of the corridor. Those come from the steps that caused them and they are not fogged — if the wire says the rains failed, the rains failed.',
          'The rest is the rumour mill: roughly one dispatch a quarter from the same office machinery that makes your prints, surfacing real conditions only about three times in five. That one is a lead, not a reading, and treating it as an instrument is a specific, deliberate way to lose.',
        ],
      },
      {
        heading: 'WHAT IS NEVER FOGGED',
        body: [
          'Some things the government does not need a survey to know, because it wrote them. The treasury’s own books — revenue, outlays, balance, debt, reserves, money printed — are exact.',
          'So is the schedule of claims on TRANSFERS: pensions to the retired, relief to the rural and urban poor. That is a rule out of the ministry’s own filing cabinet, so the cabinet shows you who a drafted transfer reaches, and how much of it survives delivery, before you enact it. No other order gets that preview, and the absence is deliberate rather than unfinished — a tax lands on a base you can only estimate, and procurement, public works, research and subsidies reach households through wages and prices rather than through a schedule. There is no exact answer to show.',
          'What the cabinet will not preview is how households will FEEL about any of it. That would be a preview of your own score.',
        ],
      },
    ],
  },
  economy: {
    id: 'economy',
    title: 'THE ECONOMY',
    blurb: 'What actually happens when you advance a quarter.',
    sections: [
      {
        heading: 'THE ORDER OF A QUARTER',
        body: [
          'A quarter is computed in a fixed order, and the order matters — it is versioned, and changing it changes every historical save. Your enacted orders are applied first; then the following happens, each step reading the state the one before it left.',
        ],
        entries: [
          { term: 'Shocks', detail: 'The crisis clock. Droughts, ruptures and external events land before anyone goes to work.', meta: '1' },
          { term: 'Demography', detail: 'The population pyramid ages by one quarter. Births and deaths respond to the income level households are actually living at.', meta: '2' },
          { term: 'Technology', detail: 'The world frontier advances on its own schedule; your attainment chases it, at a speed your schools and research stock decide.', meta: '3' },
          { term: 'The world', detail: 'Trading partners run their own cycles, setting export demand and world prices. You do not control this and it does not care about you.', meta: '4' },
          { term: 'Finance', detail: 'Credit, asset prices and bank capital. This is the loop that wants to ratchet — assets up, collateral up, credit up — and the one that produces crises.', meta: '5' },
          { term: 'Foreign investment', detail: 'Inward productive capital, and the foreign ownership of output that comes with it. Money arrives now; profits leave later.', meta: '6' },
          { term: 'Production', detail: 'Output, given prices, capital, labour and the input-output table that connects every sector to every other.', meta: '7' },
          { term: 'The environment', detail: 'What that output cost outside the market: emissions, and the pollution burden they add to. Nothing reads the burden here — it is spent later, on the mortality schedule and on how often the harvest fails.', meta: '8' },
          { term: 'Trade', detail: 'External flows are booked, reserves move, the exchange rate settles.', meta: '9' },
          { term: 'Fiscal', detail: 'Taxes are collected at the strength of your tax office; programmes are paid out with the leakage your civil service imposes; anything lenders will not finance is printed.', meta: '10' },
          { term: 'Monetary', detail: 'Inflation expectations adapt to what has been happening. Printing feeds them.', meta: '11' },
          { term: 'Prices', detail: 'Sector prices grope toward market clearing around a cost anchor. Unit costs are computed at normal utilisation, not at what was actually produced — otherwise a demand dip would raise unit costs and spiral.', meta: '12' },
          { term: 'Labour', detail: 'Employment, wages and capital accumulation. Wages need all three legs: a slack anchor, productivity passthrough near full employment, and stickiness downward.', meta: '13' },
          { term: 'Classes', detail: 'Incomes and savings by class; approval drifts toward conditions as they were actually experienced.', meta: '14' },
          { term: 'Institutions', detail: 'Societal power, the veto players’ strength, and revolutionary pressure are all re-derived from the economy that just happened.', meta: '15' },
          { term: 'Statistics', detail: 'The office measures the quarter, files it, and releases whatever falls due — first prints, revisions, and rumours for the wire.', meta: '16' },
          { term: 'Politics', detail: 'Political capital accrues from the PUBLISHED numbers. Elections, revolts and coups resolve here.', meta: '17' },
        ],
      },
      {
        heading: 'HOW A POOR COUNTRY GETS RICH',
        body: [
          'Growth here has two valves and needs both. Labour moves out of subsistence agriculture into wage work faster when there is slack demand for it, and investment responds to that slack; between them they are the engine of catch-up. The absorption of surplus rural labour is capped by the rural labour force itself — uncapped, it recreates the Malthusian trap it is supposed to escape.',
          'Technology is a stock, not a purchase. Research money enters a stock that decays, and gains read the stock — so a steady programme is worth far more than a large one-off, and a research programme is therefore a political commitment rather than a budget line. Far from the frontier the same money adapts methods that already exist; close to it, it slows into original work.',
          'Beware the measure: technology attainment is your methods divided by a frontier that keeps moving, so a good programme has to run to stand still. Worse, the index is weighted by output, and growth moves output toward services — the sector furthest from its own frontier. Funding research can lower the index it is meant to raise, while output per worker triples. That is a fact about the measure, not about the policy.',
        ],
      },
      {
        heading: 'DEMAND, PRICES AND THE CYCLE',
        body: [
          'Households spend against a smoothed sense of their habitual income rather than this quarter’s pay packet. That permanent-income smoothing is the main thing damping the business cycle, and it is deliberately tuned so the cycle does not resonate with the election period.',
          'Bond coupons are household income and redemptions are household savings — money paid to bondholders does not vanish. Getting that wrong would make every tax rise an austerity bomb.',
          'Government borrowing raises the private borrowing rate through the price of funding, not by decree: the rate reads last quarter’s bond issuance, softened by how open the economy is. A spending boom can still LIFT private investment through demand, so crowding out is a price, not a guaranteed sign.',
        ],
      },
      {
        heading: 'FINANCE, BUBBLES AND CRISES',
        body: [
          'The financial loop wants to ratchet: rising assets raise collateral, which raises credit, which raises assets. Two things keep it a cycle rather than a spiral. Asset prices revert toward fundamentals hard enough to out-muscle the collateral feedback at the margin, so a passive economy does not spontaneously bubble. And the separation between a calm decade and a boom is carried by the real interest rate — which means a bubble is something a policy rate cut or a genuine profit surge inflates. The crisis you get is the one your own cheap money earned.',
          'The bank capital floor is deliberately slack in a boom at the level you inherit, and bites only after a crisis has written capital down. That is the forced deleveraging. You can raise the floor until it binds before the crash, and doing so in time is one of the harder good decisions in the game.',
        ],
      },
      {
        heading: 'DEBT AND THE PRESS',
        body: [
          'Debt is priced, not forbidden. A rising debt ratio raises the premium lenders charge; far enough out, they stop lending altogether and a deficit can only be printed. Printed money feeds inflation expectations, which feed prices, which the money interest is watching.',
          'Nothing here is a scripted penalty. Each of those is a mechanism you can watch happen on the wall, if you funded the instrument that watches it.',
        ],
      },
    ],
  },
  room: {
    id: 'room',
    title: 'THE ROOM',
    blurb: 'Who has power, what they want, and what they charge.',
    sections: roomSections(),
  },
  run: {
    id: 'run',
    title: 'THE RUN',
    blurb: 'Standing orders, appointments, saves and keys.',
    sections: runSections(),
  },
}

export const MANUAL_CHAPTERS: readonly ManualChapter[] = MANUAL_CHAPTER_IDS.map(
  (id) => MANUAL_DEFINITION[id],
)

export function manualChapter(id: ManualChapterId): ManualChapter {
  return MANUAL_DEFINITION[id]
}

/**
 * A stable DOM id for one section, so a search result can be navigated TO
 * rather than merely near.
 *
 * Pure and here rather than in the component because both ends have to agree
 * on the same string — the section that renders the id and the result that
 * scrolls to it — and two independent slug expressions that agree today are
 * the classic way a "jump to result" quietly becomes "open the chapter cover".
 * Prefixed by chapter because headings are only unique WITHIN a chapter.
 */
export function sectionAnchor(chapter: ManualChapterId, heading: string): string {
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `manual-${chapter}-${slug}`
}

export interface ManualHit {
  chapter: ManualChapterId
  chapterTitle: string
  heading: string
  /** the entry's term, when the hit is on a named thing rather than prose */
  term: string | null
  /** the sentence the match was found in, for the result list */
  text: string
}

/**
 * Find every place the handbook answers a question.
 *
 * Substring matching on a lowercased haystack, which is the right amount of
 * machinery for a corpus this size: the alternative is a stemmer nobody can
 * test and a relevance score nobody can explain. An empty or one-character
 * query returns nothing rather than everything — a search box that answers
 * "e" with the entire manual has told the player their query failed in the
 * least legible way available.
 */
export function searchManual(query: string): ManualHit[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []
  const hits: ManualHit[] = []
  for (const chapter of MANUAL_CHAPTERS) {
    for (const section of chapter.sections) {
      const push = (term: string | null, text: string) => {
        hits.push({ chapter: chapter.id, chapterTitle: chapter.title, heading: section.heading, term, text })
      }
      if (section.heading.toLowerCase().includes(needle)) push(null, section.heading)
      for (const paragraph of section.body ?? []) {
        if (paragraph.toLowerCase().includes(needle)) push(null, paragraph)
      }
      for (const entry of section.entries ?? []) {
        if (
          entry.term.toLowerCase().includes(needle) ||
          entry.detail.toLowerCase().includes(needle) ||
          (entry.meta ?? '').toLowerCase().includes(needle)
        ) {
          push(entry.term, entry.detail)
        }
      }
    }
  }
  return hits
}
