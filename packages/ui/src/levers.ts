/**
 * What every lever on the desk actually does, in one place.
 *
 * The cabinet needs one sentence per dial for the hint under its slider; the
 * handbook needs that same sentence plus what the lever costs you elsewhere.
 * Written twice they drift, and the drift is invisible — a hint and a manual
 * entry that disagree each look right on their own page, and the player only
 * finds out which one lied by pulling the lever.
 *
 * `LEVER_COPY` is total over `DialPath` and `CAPACITY_COPY` total over
 * `CapacityId`, so a new dial or a new ministry fails the build until somebody
 * has written the sentence a player reads before pulling it. `LEVER_GROUPS`
 * is the grouping both the cabinet's tabs and the handbook's chapter follow;
 * `tests/ui/levers.test.ts` pins that it covers every path exactly once, which
 * is the one thing the compiler cannot check about an array.
 *
 * The `resists` line is read off `DIAL_STANCE` in `engine/src/actions/apply.ts`
 * and describes a RISE in the dial — a cut reverses it. Mind the sign: in that
 * table POSITIVE means the bloc minds an increase and NEGATIVE means they want
 * it higher, so a tariff (`industrialists: -0.5`) is a lever industry is
 * pushing FOR. Reading it the other way is how the first draft of this file
 * told players that finance welcomes asset purchases and industry resents
 * protection, both exactly backwards. It is prose rather
 * than a derived number on purpose: the price the room actually quotes is
 * published per action by `politicalCostOfAction`, and a second computed
 * quote would be a second source of truth for what an order costs.
 */

import { SECTOR_IDS, type CapacityId, type DialPath, type SectorId } from '@terrarium/engine'
import { SECTOR_NAMES } from './components/labels'
import { CABINET_GROUPS, type CabinetGroup } from './cabinetNavigation'

export interface LeverCopy {
  /** the cabinet's own label for the row */
  label: string
  /** which drawer of the cabinet this lever sits in. It lives on the lever
   * rather than in a list of drawers so that the COMPILER asks the question: a
   * new `DialPath` cannot exist without an answer, and therefore cannot be
   * absent from the cabinet or the handbook. Ordering within a drawer follows
   * declaration order in this table, so the table reads top to bottom the way
   * the rail does. */
  group: LeverGroupId
  /** the hint under the slider: what this lever is, in plain words */
  hint: string
  /** the handbook's second sentence: what raising it costs, and who minds */
  resists: string
}

const SUBSIDY_COPY: Record<SectorId, Pick<LeverCopy, 'hint' | 'resists'>> = {
  agri: {
    hint: 'A quarterly payment to farms. It holds food prices down, which reaches the poorest households first.',
    resists:
      'The landed interest wants this one more than it wants anything else on the desk. The money interest is the objection: it is a standing claim on the budget, and they count it in the deficit.',
  },
  manuf: {
    hint: 'A quarterly payment to factories and mills. It cuts their costs, which shows up in output and in industrial jobs.',
    resists:
      'Industry wants it, and wants it strongly. Lenders do not: it is recurring spending, and they price your deficit accordingly.',
  },
  energy: {
    hint: 'A quarterly payment to power and fuel producers. It holds fuel prices down, which reaches transport and then everything transport carries.',
    resists:
      'Industry wants it and finance minds it, like every subsidy — but this is the one that most quietly grows, because fuel is an input to every other sector.',
  },
  services: {
    hint: 'A quarterly payment to the service trades. It is the least mechanical of the five: services are furthest from their technical frontier, so relief here mostly shows up as prices rather than output.',
    resists:
      'The weakest opinions on the board in both directions, and the weakest effects. Read the sector prices before treating it as growth policy.',
  },
  transport: {
    hint: 'A quarterly payment to haulage and rail. It lowers the cost of moving everything else, so it reaches food and manufactured prices second-hand.',
    resists:
      'Industry wants cheaper freight; finance minds the standing cost. As with every subsidy, all of it hits the budget and only part of it survives delivery.',
  },
}

export const LEVER_COPY: Record<DialPath, LeverCopy> = {
  'taxRates.income': {
    label: 'Income',
    group: 'TAXATION',
    hint: 'A tax on workers’ pay. A weak tax office collects less than the posted rate.',
    resists:
      'Almost everybody minds a rise, the landed and the unions most. It is the broadest base you have, so it is also the rate that raises real money in a poor country.',
  },
  'taxRates.corporate': {
    label: 'Corporate',
    group: 'TAXATION',
    hint: 'A tax on company profits. A weak tax office collects less than the posted rate.',
    resists:
      'Industry minds this more than any other rate, and finance is close behind. Labour is the one bloc that is pleased by it.',
  },
  'taxRates.tariff': {
    label: 'Tariff',
    group: 'TAXATION',
    hint: 'A tax on imported goods, collected at the border. It raises import prices.',
    resists:
      'The easiest tax to collect when the tax office is weak, because it is collected at a port rather than a ledger. Industry and the landed interest want it HIGHER — a tariff is protection before it is revenue — so the objection comes from finance and from labour, who pay it in the price of everything imported.',
  },
  'taxRates.fuel': {
    label: 'Fuel excise',
    group: 'TAXATION',
    hint: 'A tax on fuel. It raises transport costs, which can raise food and other prices.',
    resists:
      'It is the clearest example of the model having no scripted rules: nothing connects fuel to bread except transport being an input to agriculture. Industry, labour and the landed all mind it.',
  },
  'spending.transfers': {
    label: 'Transfers',
    group: 'SPENDING',
    hint: 'Cash paid to households, including pensions and relief. A weak civil service loses part before it arrives.',
    resists:
      'Labour is pleased and finance is not. Retirees and rural workers spend essentially all of what they receive, so this is the budget line that does most to lift demand — and the hardest to walk back, because a cut is itself a policy.',
  },
  'spending.procurement': {
    label: 'Procurement',
    group: 'SPENDING',
    hint: 'Goods and services bought by the government. It raises demand now and adds to spending.',
    resists:
      'Industry is pleased to sell to you. It buys output this quarter and nothing at all in the next one.',
  },
  'spending.investment': {
    label: 'Public works',
    group: 'SPENDING',
    hint: 'Roads, power and other useful assets. It raises demand now and productive capacity later.',
    resists:
      'The same money as procurement, spent so that it is still there in twenty years. Industry and labour both gain; the money interest prices the borrowing.',
  },
  'spending.research': {
    label: 'Research grants',
    group: 'SPENDING',
    hint: 'Grants for better production methods. Schools provide researchers; a weak civil service loses part of the money.',
    resists:
      'Money enters a research stock and decays, so gains follow the stock rather than the cheque — a steady programme is worth far more than a large one-off. Far from the frontier it adapts what already exists; close to it, progress slows to original work.',
  },
  immigrationLimit: {
    label: 'Immigration ceiling',
    group: 'MIGRATION',
    hint: 'The most people the country will admit each year, as a share of the population. Zero closes the border to arrivals, but cannot stop residents leaving.',
    resists:
      'It is a ceiling, not a target: how many people actually want to come is decided by jobs here and living standards relative to everywhere else. Arrivals are working-age, so they widen the labour force before they widen the pyramid — and above ordinary churn they move bloc favour and unrest.',
  },
  policyRate: {
    label: 'Policy rate',
    group: 'MONEY',
    hint: 'The main interest rate. Higher rates cool borrowing and investment; lower rates encourage them.',
    resists:
      'Finance is pleased by a rise, industry and labour are not. Cheap money is also how a bubble is paid for: the crisis a player gets is the one their own rate cut earned.',
  },
  assetPurchaseRate: {
    label: 'Asset purchases',
    group: 'MONEY',
    hint: 'Central-bank purchases that lower borrowing costs when rates are near zero. They can also fuel risky lending and asset booms.',
    resists:
      'Industry and labour want it; the money interest is the one that minds, because it is the state setting the price of the assets they hold. It works on the same channel a rate cut does, so the two stack — and so does the bubble they pay for.',
  },
  capitalRequirement: {
    label: 'Bank capital floor',
    group: 'MONEY',
    hint: 'The share of lending banks must fund with their own money. Higher levels slow credit booms and help banks survive losses.',
    resists:
      'Finance minds this more than anything else on the desk. At the inherited floor the requirement is slack in a boom and bites only after a crisis has written capital down — raise it in the good years or it is not a macroprudential lever at all.',
  },
  fxIntervention: {
    label: 'FX intervention',
    group: 'MONEY',
    hint: 'A standing order in the currency market, as a share of output each year. Buying foreign exchange holds your currency DOWN and builds reserves; selling reserves holds it up, until they run out.',
    resists:
      'The one dial on the desk that goes below zero, and the sign is the whole lever. Buying is an exporters’ policy — industry and the landed interest are pleased, the money interest and labour are not — and selling reverses all four. What it can actually buy is bounded by what the country earns abroad; what it can sell is bounded by the reserves, and an order the reserves cannot fill is a defence that has just failed in public.',
  },
  ...(Object.fromEntries(
    SECTOR_IDS.map((sid) => [
      `subsidies.${sid}`,
      { label: SECTOR_NAMES[sid], group: 'SUBSIDIES' as const, ...SUBSIDY_COPY[sid] },
    ]),
  ) as Record<`subsidies.${SectorId}`, LeverCopy>),
}

export interface CapacityCopy {
  /** the cabinet's label for the ministry */
  label: string
  /** what the ministry is */
  hint: string
  /** what funding it buys you, in one line under the bar */
  effect: string
  /** the handbook's longer answer */
  detail: string
}

export const CAPACITY_COPY: Record<CapacityId, CapacityCopy> = {
  tax: {
    label: 'Tax admin',
    hint: 'How well the government collects the taxes it sets.',
    effect: 'More of every posted tax rate is actually collected.',
    detail:
      'The gap between a rate you post and money that reaches the treasury. A poor country with a weak tax office cannot finance itself out of income tax however high the rate goes, which is why the tariff — collected at a port rather than a ledger — is the opening revenue of most postings.',
  },
  statistical: {
    label: 'Stat office',
    hint: 'Funds measurements, gets reports to you faster and makes them more accurate.',
    effect: 'Fits new wall instruments, then shortens lags and narrows error bands.',
    detail:
      'The office that makes the fog. Each survey needs a minimum strength before it reports at all; past that, capacity shortens the lag from two quarters to one and narrows the noise on every print. It never buys you the truth — only a better estimate of it, sooner.',
  },
  administrative: {
    label: 'Civil service',
    hint: 'How much programme money reaches its target instead of being lost on the way.',
    effect: 'More programme spending survives delivery instead of leaking away.',
    detail:
      'Delivery. The treasury is charged the full appropriation either way; what a weak civil service changes is how much of it arrives. A transfer programme in a country that cannot deliver is a deficit that buys very little approval.',
  },
  education: {
    label: 'Schools',
    hint: 'Builds schools. Their graduates raise workforce skills over decades; skilled people staff the professions, help the country use better technology, staff research and gradually lower birth rates.',
    effect:
      'Workforce skills rise slowly, then set the professional class and lift technology, research and social organization.',
    detail:
      'The slowest lever in the game and the one with the longest reach — and the only one that acts through a second stock rather than directly. Funding builds the school system in eight quarters; what technology, research, fertility and social organization actually read is WORKFORCE SKILLS, which closes about one percent of its gap to the schools each quarter. That is a half-life near seventeen years. It also sets the ceiling on how many of your people can do professional work: without it the country moves labour off the land into the cities and no further, however badly the professions are short-staffed. Finishing a classroom is not the same event as a taught generation entering work, and the instrument between the two is on the wall so you can watch the gap close.',
  },
}

/**
 * The drawers of the cabinet that hold levers.
 *
 * Derived from `CabinetGroup` by subtraction rather than listed, so the four
 * drawers the rail paints itself — capacity, institutions, the statute book,
 * the whip count — are the only exceptions, and a NEW cabinet group is a lever
 * drawer until somebody says otherwise. That makes `DRAWERS` below a total
 * `Record`, so the group cannot reach the cabinet without a brief and a
 * question. The statute book joined that exception list the day it was added,
 * and it did so because the build stopped rather than because anyone
 * remembered to look — which is the whole point of writing it this way.
 */
export type LeverGroupId = Exclude<
  CabinetGroup,
  'STATE CAPACITY' | 'INSTITUTIONS' | 'THE ROOM' | 'STATUTES'
>

export interface DrawerCopy {
  /** the cabinet tab's short name */
  tab: string
  /** what this drawer is for */
  brief: string
  /** the question the drawer is an answer to */
  question: string
}

const DRAWERS: Record<LeverGroupId, DrawerCopy> = {
  TAXATION: {
    tab: 'REVENUE',
    brief:
      'Choose who finances the state. Collection strength decides how much of each posted rate reaches the treasury.',
    question: 'Who carries the tax burden?',
  },
  SPENDING: {
    tab: 'SPENDING',
    brief:
      'Choose whether each programme stays fixed, rises with prices, or stays a share of the latest official output figure.',
    question: 'What should each programme follow?',
  },
  MONEY: {
    tab: 'CENTRAL BANK',
    brief:
      'Set interest rates, support lending when rates hit zero, decide how much of their own money banks must put at risk, and stand in the currency market.',
    question: 'How much financial risk should the state carry?',
  },
  MIGRATION: {
    tab: 'BORDERS',
    brief:
      'Set the annual ceiling on arrivals as a share of the resident population. Jobs and relative living standards decide how many people want to come or leave; this order limits immigration only.',
    question: 'How many arrivals will the country admit?',
  },
  SUBSIDIES: {
    tab: 'INDUSTRY',
    brief:
      'Direct quarterly support to particular sectors. Subsidies can relieve a bottleneck, but they are recurring claims on the budget.',
    question: 'Which industries get support?',
  },
}

export interface LeverGroup extends DrawerCopy {
  group: LeverGroupId
  paths: readonly DialPath[]
}

/** Every lever the engine defines, in the order this file declares them. */
export const LEVER_PATHS = Object.keys(LEVER_COPY) as DialPath[]

/**
 * The cabinet's drawers, assembled rather than authored.
 *
 * Drawer order follows `CABINET_GROUPS`, which is the one place tab order is
 * decided; membership follows each lever's own `group`. Nothing here is a
 * second list that can disagree with a first, which is the whole point: the
 * earlier version of this file WAS a hand-written array, and a lever missing
 * from it compiled perfectly and simply never appeared on either screen.
 */
export const LEVER_GROUPS: readonly LeverGroup[] = CABINET_GROUPS.filter(
  (group): group is LeverGroupId => group in DRAWERS,
).map((group) => ({
  group,
  ...DRAWERS[group],
  paths: LEVER_PATHS.filter((path) => LEVER_COPY[path].group === group),
}))

/** The drawer metadata the cabinet prints above its sliders, by group. */
export function leverGroup(group: CabinetGroup): LeverGroup | undefined {
  return LEVER_GROUPS.find((entry) => entry.group === group)
}
