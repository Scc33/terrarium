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

import type { IndicatorId } from '@terrarium/observation'

export interface IndicatorNames {
  /** dossier-era gauge header: the ministry's own wording, with units */
  dossier: string
  /** terminal-era mnemonic: what a wire service would call it */
  terminal: string
  /** blank brass plate: the instrument's name, engraved, no units */
  plate: string
  /** the rack strip. Keep to 10 characters — the strip is a quarter of the
   * wall's width and a truncated label is a label you can't scan. */
  short: string
  /** the capacity that has to exist before this instrument does */
  needs: string
}

export const NAMES: Record<IndicatorId, IndicatorNames> = {
  gdp_growth: { dossier: 'GDP GROWTH · %/YR', terminal: 'GDP.GROWTH %/YR', plate: 'GDP GROWTH', short: 'GDP GROWTH', needs: 'NATIONAL ACCOUNTS' },
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
  birth_rate: { dossier: 'BIRTH RATE · /1000', terminal: 'BIRTH.RATE /1K', plate: 'BIRTH RATE', short: 'BIRTH RATE', needs: 'CIVIL REGISTRATION' },
  death_rate: { dossier: 'DEATH RATE · /1000', terminal: 'DEATH.RATE /1K', plate: 'DEATH RATE', short: 'DEATH RATE', needs: 'CIVIL REGISTRATION' },
  terms_of_trade: { dossier: 'TERMS OF TRADE · IDX', terminal: 'TERMS.TRADE IDX', plate: 'TERMS OF TRADE', short: 'TERMS TRD.', needs: 'TRADE STATISTICS' },
  asset_prices: { dossier: 'ASSET PRICES · 1946=100', terminal: 'ASSET.PX IDX', plate: 'ASSET PRICES', short: 'ASSET PX.', needs: 'EXCHANGE BOARD' },
  credit_growth: { dossier: 'CREDIT GROWTH · %/YR', terminal: 'CREDIT.GRW %/YR', plate: 'CREDIT GROWTH', short: 'CREDIT GRW', needs: 'BANK SUPERVISION' },
}
