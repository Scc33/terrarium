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
  /** what the number means when its accounting boundary is not obvious */
  note?: string
  /** an accounting complement displayed beside the measured share */
  complement?: string
}

export const NAMES: Record<IndicatorId, IndicatorNames> = {
  gdp_growth: { dossier: 'REAL GDP GROWTH · %/YR', terminal: 'REAL.GDP.GRW %/YR', plate: 'REAL GDP GROWTH', short: 'REAL GDP', needs: 'NATIONAL ACCOUNTS', note: 'Annualized quarter-over-quarter growth in output at base-year prices. Inflation cannot raise this reading.' },
  gdp_per_capita: { dossier: 'REAL GDP PER HEAD · /YR', terminal: 'REAL.GDP.PC /YR', plate: 'REAL GDP PER HEAD', short: 'GDP / HEAD', needs: 'NATIONAL ACCOUNTS', note: 'Annualized real GDP divided by the census head count: output growth after population growth is removed.' },
  consumption_per_capita: { dossier: 'REAL CONSUMPTION PER HEAD · /YR', terminal: 'REAL.CONS.PC /YR', plate: 'REAL CONSUMPTION PER HEAD', short: 'CONS/HEAD', needs: 'HOUSEHOLD ACCOUNTS', note: 'Annualized household spending per person, deflated using each class’s own consumption basket.' },
  household_saving_rate: { dossier: 'HOUSEHOLD SAVING · % DISPOSABLE', terminal: 'HH.SAVE %DISP', plate: 'HOUSEHOLD SAVING RATE', short: 'HH SAVING', needs: 'HOUSEHOLD ACCOUNTS', note: 'Disposable household income not consumed this quarter. Negative means households drew down savings; bond principal is excluded from income.', complement: 'SPEND' },
  government_demand_share: { dossier: 'GOVERNMENT / PRIVATE DEMAND · %', terminal: 'GOV/PRIVATE DEMAND %', plate: 'GOVERNMENT / PRIVATE DEMAND', short: 'GOVT SHARE', needs: 'NATIONAL ACCOUNTS', note: 'Government procurement and public investment as a share of domestic demand. The complement is private consumption and investment; transfers, subsidies, and net exports are not double-counted.', complement: 'PRIVATE' },
  inflation: { dossier: 'INFLATION · %/YR', terminal: 'CPI.INFL %/YR', plate: 'INFLATION', short: 'INFLATION', needs: 'PRICE COLLECTION' },
  price_food: { dossier: 'FOOD PRICES · 1946=100', terminal: 'PX.FOOD IDX', plate: 'FOOD PRICES', short: 'FOOD PRICE', needs: 'PRICE BUREAU' },
  price_fuel: { dossier: 'FUEL PRICES · 1946=100', terminal: 'PX.FUEL IDX', plate: 'FUEL PRICES', short: 'FUEL PRICE', needs: 'PRICE BUREAU' },
  unemployment: { dossier: 'UNEMPLOYMENT · %', terminal: 'UNEMP %', plate: 'UNEMPLOYMENT', short: 'UNEMPLOY.', needs: 'LABOUR FORCE SURVEY' },
  payrolls: { dossier: 'PAYROLLS EX-AGRI · M', terminal: 'PAYROLL.XA M', plate: 'PAYROLLS', short: 'PAYROLLS', needs: 'ESTABLISHMENT SURVEY' },
  capital_stock: { dossier: 'CAPITAL STOCK · IDX', terminal: 'CAP.STOCK IDX', plate: 'CAPITAL STOCK', short: 'CAP. STOCK', needs: 'CENSUS OF INDUSTRY' },
  conf_consumer: { dossier: 'CONSUMER CONFIDENCE', terminal: 'CONF.CONS IDX', plate: 'CONSUMER CONFIDENCE', short: 'CONS. CONF', needs: 'SENTIMENT SURVEYS' },
  conf_business: { dossier: 'BUSINESS CONFIDENCE', terminal: 'CONF.BIZ IDX', plate: 'BUSINESS CONFIDENCE', short: 'BIZ. CONF', needs: 'SENTIMENT SURVEYS' },
  approval: { dossier: 'APPROVAL POLL · %', terminal: 'APPROVAL %', plate: 'APPROVAL POLL', short: 'APPROVAL', needs: 'FIELD POLLING' },
  gini: { dossier: 'INEQUALITY · GINI PTS', terminal: 'GINI PTS', plate: 'INCOME INEQUALITY', short: 'INEQUALITY', needs: 'HOUSEHOLD SURVEY' },
  income_real: { dossier: 'HOUSEHOLD INCOME · IDX', terminal: 'INC.REAL IDX', plate: 'HOUSEHOLD INCOME', short: 'INCOME', needs: 'NATIONAL ACCOUNTS' },
  birth_rate: { dossier: 'BIRTH RATE · /1000', terminal: 'BIRTH.RATE /1K', plate: 'BIRTH RATE', short: 'BIRTH RATE', needs: 'CIVIL REGISTRATION' },
  death_rate: { dossier: 'DEATH RATE · /1000', terminal: 'DEATH.RATE /1K', plate: 'DEATH RATE', short: 'DEATH RATE', needs: 'CIVIL REGISTRATION' },
  terms_of_trade: { dossier: 'TERMS OF TRADE · IDX', terminal: 'TERMS.TRADE IDX', plate: 'TERMS OF TRADE', short: 'TERMS TRD.', needs: 'TRADE STATISTICS' },
  asset_prices: { dossier: 'ASSET PRICES · 1946=100', terminal: 'ASSET.PX IDX', plate: 'ASSET PRICES', short: 'ASSET PX.', needs: 'EXCHANGE BOARD' },
  credit_growth: { dossier: 'CREDIT GROWTH · %/YR', terminal: 'CREDIT.GRW %/YR', plate: 'CREDIT GROWTH', short: 'CREDIT GRW', needs: 'BANK SUPERVISION' },
  unrest: { dossier: 'PUBLIC ORDER · IDX', terminal: 'UNREST IDX', plate: 'PUBLIC ORDER', short: 'UNREST', needs: 'PROVINCIAL REPORTS' },
}

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
