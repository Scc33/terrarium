/**
 * Every name an instrument goes by, in one place.
 *
 * These used to be four separate `Record<IndicatorId, …>` tables scattered
 * across BlankPlate, AnalogGauge, TerminalTicker and the rack, which meant
 * adding an indicator was four edits in four files and any one of them could
 * quietly drift. Being a total Record over IndicatorId, this single table is
 * compile-enforced: add an indicator to the engine and the UI will not build
 * until it has been named at every maturity and its survey has been named too.
 */

import type { CohortId } from '@terrarium/engine'
import type { BlocId, IndicatorId, InstitutionId, PlatformId } from '@terrarium/observation'

export interface IndicatorNames {
  /** dossier-era gauge header: the ministry's own wording, with units */
  dossier: string
  /** terminal-era mnemonic: what a wire service would call it. Keep to 20
   * characters — that is what a board slot's header leaves once the window
   * toggle is paid for at 1280×720, and the ticker ellipsises past it rather
   * than pushing the figures off the tile. `GOV/PRIVATE DEMAND %` is at the
   * limit; anything longer loses its unit. */
  terminal: string
  /** blank brass plate: the instrument's name, engraved, no units */
  plate: string
  /** the rack strip. Keep to 10 characters — the strip is a quarter of the
   * wall's width and a truncated label is a label you can't scan. */
  short: string
  /** the capacity that has to exist before this instrument does */
  needs: string
  /** a short, plain-language answer to “what does this number mean?” */
  note: string
  /** an accounting complement displayed beside the measured share */
  complement?: string
}

export const NAMES: Record<IndicatorId, IndicatorNames> = {
  gdp_growth: { dossier: 'REAL GDP GROWTH · %/YR', terminal: 'REAL.GDP.GRW %/YR', plate: 'REAL GDP GROWTH', short: 'REAL GDP', needs: 'NATIONAL ACCOUNTS', note: 'How fast the economy’s output is growing after price rises are removed.' },
  gdp_per_capita: { dossier: 'REAL GDP PER HEAD · /YR', terminal: 'REAL.GDP.PC /YR', plate: 'REAL GDP PER HEAD', short: 'GDP / HEAD', needs: 'NATIONAL ACCOUNTS', note: 'Inflation-adjusted output per person. It rises when output grows faster than the population.' },
  debt_to_gdp: { dossier: 'PUBLIC DEBT · % GDP', terminal: 'PUB.DEBT %GDP', plate: 'PUBLIC DEBT', short: 'DEBT/GDP', needs: 'NATIONAL ACCOUNTS', note: 'Government debt compared with one year of output. High debt makes borrowing costlier; at 120%, markets stop lending.' },
  consumption_per_capita: { dossier: 'REAL CONSUMPTION PER HEAD · /YR', terminal: 'REAL.CONS.PC /YR', plate: 'REAL CONSUMPTION PER HEAD', short: 'CONS/HEAD', needs: 'HOUSEHOLD ACCOUNTS', note: 'How much each person buys in a year after price rises are removed.' },
  household_saving_rate: { dossier: 'HOUSEHOLD SAVING · % DISPOSABLE', terminal: 'HH.SAVE %DISP', plate: 'HOUSEHOLD SAVING RATE', short: 'HH SAVING', needs: 'HOUSEHOLD ACCOUNTS', note: 'The share of household income left after spending. Below zero means households are using their savings.', complement: 'SPEND' },
  consumption_share: { dossier: 'CONSUMPTION · % FINAL EXPENDITURE', terminal: 'CONS.SHARE %', plate: 'HOUSEHOLD CONSUMPTION', short: 'CONS SHR', needs: 'EXPENDITURE ACCOUNTS', note: 'The share of the economy’s final spending made by households.' },
  investment_share: { dossier: 'CAPITAL FORMATION · % FINAL EXPENDITURE', terminal: 'INVEST.SHARE %', plate: 'CAPITAL FORMATION', short: 'INVEST SHR', needs: 'EXPENDITURE ACCOUNTS', note: 'The share spent on new buildings, machines and public works. It supports future growth.' },
  export_share: { dossier: 'EXPORTS · % FINAL EXPENDITURE', terminal: 'EXPORT.SHARE %', plate: 'EXPORTS', short: 'EXPORT SHR', needs: 'EXPENDITURE ACCOUNTS', note: 'The share of final spending bought by other countries.' },
  fdi_inflows: { dossier: 'INWARD DIRECT INVESTMENT · % GDP', terminal: 'FDI.INFLOW %GDP', plate: 'FOREIGN DIRECT INVESTMENT', short: 'FDI IN', needs: 'BALANCE OF PAYMENTS', note: 'New foreign-owned factories and equipment compared with output. Money arrives now; some profits leave later.' },
  inflation: { dossier: 'INFLATION · %/YR', terminal: 'CPI.INFL %/YR', plate: 'INFLATION', short: 'INFLATION', needs: 'PRICE COLLECTION', note: 'How quickly everyday prices are rising. High inflation cuts what money can buy.' },
  price_food: { dossier: 'FOOD PRICES · 1946=100', terminal: 'PX.FOOD IDX', plate: 'FOOD PRICES', short: 'FOOD PRICE', needs: 'PRICE BUREAU', note: 'Food prices compared with 1946. A reading of 120 means food costs 20% more.' },
  price_fuel: { dossier: 'FUEL PRICES · 1946=100', terminal: 'PX.FUEL IDX', plate: 'FUEL PRICES', short: 'FUEL PRICE', needs: 'PRICE BUREAU', note: 'Fuel prices compared with 1946. A reading of 120 means fuel costs 20% more.' },
  unemployment: { dossier: 'UNEMPLOYMENT · %', terminal: 'UNEMP %', plate: 'UNEMPLOYMENT', short: 'UNEMPLOY.', needs: 'LABOUR FORCE SURVEY', note: 'The share of people who want a job but do not have one.' },
  labor_force_participation: { dossier: 'LABOUR FORCE · % POP', terminal: 'LAB.FORCE %POP', plate: 'LABOUR FORCE PARTICIPATION', short: 'LF / POP', needs: 'LABOUR FORCE SURVEY', note: 'The share of the whole population who are working or looking for work.' },
  payrolls: { dossier: 'PAYROLLS EX-AGRI · M', terminal: 'PAYROLL.XA M', plate: 'PAYROLLS', short: 'PAYROLLS', needs: 'ESTABLISHMENT SURVEY', note: 'People in paid work outside farming, in millions. It tracks the move into wage-paying jobs.' },
  capital_stock: { dossier: 'CAPITAL STOCK · IDX', terminal: 'CAP.STOCK IDX', plate: 'CAPITAL STOCK', short: 'CAP. STOCK', needs: 'CENSUS OF INDUSTRY', note: 'The country’s productive buildings, machines and infrastructure compared with 1946.' },
  productivity: { dossier: 'OUTPUT PER WORKER · IDX', terminal: 'PROD.LAB IDX', plate: 'OUTPUT PER WORKER', short: 'OUTPUT/WKR', needs: 'LABOUR PRODUCTIVITY ACCOUNTS', note: 'Output per worker compared with 1946. Better tools, skills and jobs raise it.' },
  technology_attainment: { dossier: 'TECHNOLOGY ATTAINED · % FRONTIER', terminal: 'TECH.ATTAIN %FRT', plate: 'TECHNOLOGY ATTAINED', short: 'TECH LEVEL', needs: 'PRODUCTIVITY ACCOUNTS', note: 'How close local production methods are to today’s world best. Research helps the country catch up.' },
  conf_consumer: { dossier: 'CONSUMER CONFIDENCE', terminal: 'CONF.CONS IDX', plate: 'CONSUMER CONFIDENCE', short: 'CONS. CONF', needs: 'SENTIMENT SURVEYS', note: 'How hopeful households feel about their finances and the economy. Low confidence can reduce spending.' },
  conf_business: { dossier: 'BUSINESS CONFIDENCE', terminal: 'CONF.BIZ IDX', plate: 'BUSINESS CONFIDENCE', short: 'BIZ. CONF', needs: 'SENTIMENT SURVEYS', note: 'How hopeful businesses feel about the economy. Low confidence can reduce hiring and investment.' },
  approval: { dossier: 'APPROVAL POLL · %', terminal: 'APPROVAL %', plate: 'APPROVAL POLL', short: 'APPROVAL', needs: 'FIELD POLLING', note: 'The share of voters who approve of the government.' },
  gini: { dossier: 'INEQUALITY · GINI PTS', terminal: 'GINI PTS', plate: 'INCOME INEQUALITY', short: 'INEQUALITY', needs: 'HOUSEHOLD SURVEY', note: 'How unevenly income is shared. Higher numbers mean more inequality.' },
  income_real: { dossier: 'HOUSEHOLD INCOME · IDX', terminal: 'INC.REAL IDX', plate: 'HOUSEHOLD INCOME', short: 'INCOME', needs: 'NATIONAL ACCOUNTS', note: 'Household income compared with 1946 after price rises are removed.' },
  birth_rate: { dossier: 'BIRTH RATE · /1000', terminal: 'BIRTH.RATE /1K', plate: 'BIRTH RATE', short: 'BIRTH RATE', needs: 'CIVIL REGISTRATION', note: 'Births per 1,000 people each year.' },
  death_rate: { dossier: 'DEATH RATE · /1000', terminal: 'DEATH.RATE /1K', plate: 'DEATH RATE', short: 'DEATH RATE', needs: 'CIVIL REGISTRATION', note: 'Deaths per 1,000 people each year.' },
  terms_of_trade: { dossier: 'TERMS OF TRADE · IDX', terminal: 'TERMS.TRADE IDX', plate: 'TERMS OF TRADE', short: 'TERMS TRD.', needs: 'TRADE STATISTICS', note: 'Export prices compared with import prices. Higher means the same exports can buy more imports.' },
  asset_prices: { dossier: 'ASSET PRICES · 1946=100', terminal: 'ASSET.PX IDX', plate: 'ASSET PRICES', short: 'ASSET PX.', needs: 'EXCHANGE BOARD', note: 'Share and property values compared with 1946. Fast gains can signal a bubble.' },
  credit_growth: { dossier: 'CREDIT GROWTH · %/YR', terminal: 'CREDIT.GRW %/YR', plate: 'CREDIT GROWTH', short: 'CREDIT GRW', needs: 'BANK SUPERVISION', note: 'How quickly total lending is growing. Very fast growth can make a banking crisis more likely.' },
  unrest: { dossier: 'PUBLIC ORDER · IDX', terminal: 'UNREST IDX', plate: 'PUBLIC ORDER', short: 'UNREST', needs: 'PROVINCIAL REPORTS', note: 'Pressure from public anger and hardship. Higher numbers mean greater risk of disorder or revolt.' },
}

/**
 * How many decimals a printed reading deserves.
 *
 * One decimal everywhere was fine while every instrument lived under 100. The
 * index instruments do not: output per worker runs to ~870, the capital stock
 * to ~900, household income to ~260. At those magnitudes a trailing decimal is
 * false precision — a print of 271.4 carrying a confessed ±16 band claims four
 * significant figures it has not got — and it is also a sixth character in a
 * readout budgeted for five, which is how the revision row started truncating
 * to `271…` in the last board slot.
 *
 * Both problems have the same fix, so the rule is magnitude, not identity:
 * hundreds print whole, everything below keeps its decimal. Nothing currently
 * under 100 changes, which is every rate and every percentage on the wall.
 */
export const readingDigits = (value: number): number => (Math.abs(value) >= 100 ? 0 : 1)

/** Saving/consumption and government/private are two sides of one accounting
 * identity, not separate noisy instruments. Keep the complement derived from
 * the same print so the wall can never claim the pair sums to 99 or 103. */
export function complementReading(indicator: IndicatorId, value: number, digits = 1): string | null {
  const label = NAMES[indicator].complement
  return label ? `${label} ${(100 - value).toFixed(digits)}` : null
}

/** The classes the country is made of, as a ministry's paperwork would list
 * them. Total over CohortId for the same reason the tables above are: a new
 * class in the engine stops the UI building until somebody has named it. */
export const COHORT_NAMES: Record<CohortId, string> = {
  retirees: 'Retirees',
  rural_workers: 'Rural workers',
  urban_workers: 'Urban workers',
  professionals: 'Professionals',
  business_owners: 'Business owners',
}

/** …and who each one actually is, for the incidence tooltips.
 *
 * A cohort is not a demographic label: each earns from a different place,
 * spends a different share of it, and buys a different basket. That is the
 * whole reason a budget line is costed per cohort rather than per head — the
 * same money is a different policy depending on who catches it. Keep these
 * anchored to what the engine actually does with the group (where the income
 * comes from, how much of it is spent), because that is what makes a player's
 * guess about incidence a good one. */
export const COHORT_NOTES: Record<CohortId, string> = {
  retirees:
    'Past working age, living on savings and whatever the state provides. They spend essentially all of it and have no wage to defend, so inflation reaches them faster than anyone still earning.',
  rural_workers:
    'Farm and village labour — all of agriculture, and part of the mills and haulage. They spend almost everything they earn, and nearly half of it on food, so a food or fuel price is felt here first.',
  urban_workers:
    'Wage labour in the towns: most of manufacturing, all of energy, and much of transport and services. Their fortunes follow industrial jobs, so a downturn reaches them before it reaches the salaried.',
  professionals:
    'Salaried and skilled work, concentrated in services. They hold back more of their income than the wage-earners do, take a small cut of profits, and gain most as the economy moves from fields to offices.',
  business_owners:
    'Owners rather than earners: their income is profit, not wages, and they hold most of the government’s debt. They spend the smallest share of what they receive, so money routed here does the least to lift demand — and a bond coupon lands in this row.',
}

/** The veto players, by the name a minister would use. Total over BlocId, so
 * adding a bloc to the engine stops the UI building until it has been named. */
export const BLOC_NAMES: Record<BlocId, string> = {
  landowners: 'Landed',
  industrialists: 'Industry',
  financiers: 'Finance',
  unions: 'Labour',
}

/** …and what each one actually is, for the whip count's tooltips. */
export const BLOC_NOTES: Record<BlocId, string> = {
  landowners:
    'The landed interest. As strong as agriculture’s share of output — it fades as the country industrialises, and never forgives a land tax.',
  industrialists:
    'Factory and mill owners. Strength follows manufacturing, energy and transport. They mind corporate tax, dear money, fuel excise and labour rights.',
  financiers:
    'The money interest — banks and bondholders. Strength follows the credit stock and how much of your debt they hold. They mind inflation, the printing press, and a budget they do not believe.',
  unions:
    'Organised labour. Needs three things at once: the legal right to organise, an industrial workforce, and jobs to strike from. Weak in 1946 unless you legalise it.',
}

export const INSTITUTION_NAMES: Record<InstitutionId, { name: string; note: string }> = {
  suffrage: {
    name: 'Suffrage',
    note: 'Who holds a ballot. Extending it rewrites the weights your approval is scored on — you are editing your own objective function — and converts revolutionary pressure into electoral pressure.',
  },
  press: {
    name: 'Free press',
    note: 'A society that can print can organise. Raises societal power; the landed interest would rather it did not.',
  },
  labor_rights: {
    name: 'Labour rights',
    note: 'The legal right to organise. Raises societal power and makes the unions a real bloc — which cuts both ways, because an aggrieved organised labour movement bargains rather than petitions.',
  },
  courts: {
    name: 'Courts',
    note: 'Judicial independence and secure property. Raises societal power, and capital likes it — the one reform the money interest will thank you for.',
  },
  repression: {
    name: 'Repression',
    note: 'The coercive arm. Buys political capital and lowers the electoral bar, damps unrest in the short run — and walks the corridor dot toward despotism, where the incumbents you never checked quietly stop letting the economy change.',
  },
}

export const PLATFORM_NAMES: Record<PlatformId, string> = {
  record: 'stood on the record',
  largesse: 'opened the treasury',
  coalition: 'courted a bloc',
  suppression: 'cleared the ballot',
  franchise: 'extended the franchise',
}

/** …and what each one cost, read back after the count.
 *
 * Every platform but the first is a swing bought on credit, and the engine
 * names the creditor: largesse mortgages the budget, coalition mortgages the
 * levers, suppression mortgages the corridor, franchise mortgages the scoring
 * rubric itself. The bill is the interesting half and it falls due after the
 * result is on screen, so say it here rather than let the player rediscover it
 * a term later. */
export const PLATFORM_NOTES: Record<PlatformId, string> = {
  record:
    'You ran on what you had done. Nothing was promised and nothing is owed — the swing is whatever the record earned on its own.',
  largesse:
    'A pre-election giveaway: transfers jumped by half and stayed jumped. The votes were bought with real money, and the bill is that walking it back is itself a cut, which costs approval of its own.',
  coalition:
    'You promised one bloc and snubbed the rest. Their machine turned out for you, and the pledge binds you for a full term on every lever they mind.',
  suppression:
    'The ballot was cleared before it was counted. It reliably wins and it walks the corridor dot toward despotism — and the historians record a mandate taken separately from one won, and never net the two.',
  franchise:
    'You widened who holds a ballot. The first vote carries some enthusiasm, but the real effect is that different people’s approval now counts — you have rewritten the rubric you will be graded against.',
}
