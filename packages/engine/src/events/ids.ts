/**
 * The event register: every dispatch the wire can ever carry, named once.
 *
 * This file holds ONLY id lists and no prose, no conditions and no imports,
 * for one structural reason: `state/schema.ts` needs `EventId` to type
 * `NewsItem`, and the catalogue that authors the copy needs `NewsKind` from
 * `state/schema.ts`. Keeping the names in a leaf module breaks that cycle and
 * leaves exactly one place to look up "what events exist".
 *
 * Everything downstream is a total `Record` over `EVENT_IDS`, so an id added
 * here fails the build until it has a desk, a tone, a headline and a body. An
 * event cannot ship unnamed and cannot ship unwritten. What the compiler
 * CANNOT check is that something raises it — see `tests/properties/events.test.ts`,
 * which fails by name on an event nothing can reach. A dispatch nobody can
 * read is not an event, it is dead copy.
 */

/**
 * The sections of the paper. A dispatch is filed to a desk, and the desk is
 * AUTHORED rather than derived from `kind`: the rumour mill alone spans every
 * one of these (bread queues are a home story, a thin bond auction is a
 * finance story, marching students are politics), so a desk read off the kind
 * would put the whole rumour mill in one column.
 */
export const DESK_IDS = [
  /** the cost of living, the shops, what a household can afford */
  'home',
  /** work, wages, unions, the queue at the factory gate */
  'labour',
  /** banks, credit, the bourse, the currency, the public debt */
  'finance',
  /** factories, output, energy, what the country makes */
  'industry',
  /** the land, the harvest, the weather, the air */
  'land',
  /** the government, the constitution, the street */
  'politics',
  /** the world outside and what it is doing to us */
  'abroad',
  /** laboratories, schools, the frontier */
  'science',
] as const
export type DeskId = (typeof DESK_IDS)[number]

/**
 * How much of the page a story takes. Authored, not computed from tone: a
 * coup and a poor bond auction are both bad and they are not the same size,
 * and no formula over the state can tell you which one a sub-editor leads
 * with.
 */
export const PROMINENCE_IDS = ['lead', 'column', 'brief'] as const
export type Prominence = (typeof PROMINENCE_IDS)[number]

/**
 * Every event, grouped by where it comes from. The groups are comments only —
 * the list is flat because the catalogue, the conditions table and the wire
 * all index it flatly, and a nested list would have to be flattened three
 * times to be used once.
 */
export const EVENT_IDS = [
  // ---------- the sky and the land (raised by `pipeline/shocks.ts`) ----------
  'drought_onset',
  'drought_relief',
  'fuel_shock',

  // ---------- the world outside (raised by `pipeline/world.ts`) ----------
  'world_commodity_crisis',
  'world_commodity_boom',
  'world_commodity_slump',
  'world_manufacturing_crisis',
  'world_manufacturing_boom',
  'world_manufacturing_slump',
  'world_financial_crisis',
  'world_financial_boom',
  'world_financial_slump',
  'world_regional_crisis',
  'world_regional_boom',
  'world_regional_slump',

  // ---------- the laboratories (raised by `pipeline/technology.ts`) ----------
  'breakthrough',

  // ---------- the banks (raised by `pipeline/finance.ts`) ----------
  'banking_crisis',
  'banking_crisis_sudden_stop',
  'banking_recovery',
  'asset_bubble',

  // ---------- the constitution (raised by `pipeline/institutions.ts`) ----------
  'corridor_exit_despotic',
  'corridor_exit_anarchic',
  'corridor_return',
  'reform_window',

  // ---------- the government's tenure (raised by `pipeline/politics.ts`) ----------
  'revolt',
  'coup',
  'election_won',
  'election_lost',
  'election_suppressed',
  'election_protected',

  // ---------- the government's own acts (raised by `actions/apply.ts`) ----------
  'reform_suffrage_up',
  'reform_suffrage_down',
  'reform_press_up',
  'reform_press_down',
  'reform_labor_rights_up',
  'reform_labor_rights_down',
  'reform_courts_up',
  'reform_courts_down',
  'reform_repression_up',
  'reform_repression_down',
  'statute_minimum_wage_enacted',
  'statute_minimum_wage_repealed',
  'statute_compulsory_schooling_enacted',
  'statute_compulsory_schooling_repealed',
  'statute_competition_enacted',
  'statute_competition_repealed',
  'statute_emissions_standard_enacted',
  'statute_emissions_standard_repealed',

  // ---------- the cost of living (conditions, home desk) ----------
  'bread_queues',
  'prices_racing',
  'prices_runaway',
  'prices_falling',
  'shops_quiet_and_full',
  'poverty_widespread',
  'poverty_receding',
  'households_saving_hard',
  'households_spending_freely',
  'confidence_low',
  'confidence_high',

  // ---------- work (conditions, labour desk) ----------
  'factory_gates_idle',
  'unions_demand_works',
  'jobless_generation',
  'hands_are_scarce',
  'wage_packets_thin',
  'wage_packets_fat',
  'emigration_rising',
  'immigration_rising',
  'inequality_widening',
  'inequality_narrowing',

  // ---------- money (conditions, finance desk) ----------
  'mint_running_hot',
  'auction_poor',
  'reserves_thin',
  'reserves_ample',
  'credit_boom',
  'credit_drought',
  'banks_thinly_capitalized',
  'bourse_slump',
  'debt_alarming',
  'debt_retired',
  'exchange_rate_slides',
  // the currency (facts, filed by `trade`; conditions, filed by the desk)
  'currency_defence_failed',
  'currency_dear',
  'currency_cheap',

  // ---------- what the country makes (conditions, industry desk) ----------
  'order_books_full',
  'plants_idle',
  'services_overtake_industry',
  'industry_overtakes_land',
  'land_no_longer_employs_the_country',
  'energy_runs_short',
  'productivity_doubled',

  // ---------- the land and the air (conditions, land desk) ----------
  'harvest_thin',
  'harvest_bumper',
  'air_turns_foul',
  'rivers_run_black',
  'air_clears',

  // ---------- the street (conditions, politics desk) ----------
  'marches_on_the_ministries',
  'gendarmerie_stretched',
  'pamphlets_circulate',
  'government_popular',
  'government_despised',
  'press_muzzled',
  'courts_command_respect',

  // ---------- the world's ledger (conditions, abroad desk) ----------
  'terms_of_trade_favourable',
  'terms_of_trade_adverse',
  'exports_carry_the_country',
  'foreign_capital_floods_in',
  'foreign_capital_takes_flight',

  // ---------- the frontier (conditions, science desk) ----------
  'schools_fill',
  'schools_empty',
  'technique_closes_on_the_frontier',
  'technique_falls_behind',

  // ---------- the census (conditions, home desk, once per run) ----------
  'population_doubles',
  'urban_majority',
  'country_ages',
  'births_fall_away',

  // ---------- colour: the century as it was lived (era-gated filler) ----------
  'colour_postwar_rationing',
  'colour_postwar_wireless',
  'colour_postwar_reconstruction',
  'colour_postwar_railways',
  'colour_boom_television',
  'colour_boom_motorcar',
  'colour_boom_supermarket',
  'colour_boom_new_towns',
  'colour_crisis_queues_at_the_pumps',
  'colour_crisis_three_day_week',
  'colour_crisis_pop_and_protest',
  'colour_crisis_pocket_calculator',
  'colour_market_privatisation_fever',
  'colour_market_the_city_at_night',
  'colour_market_shoulder_pads',
  'colour_market_satellite_dish',
  'colour_network_the_web_arrives',
  'colour_network_mobile_telephones',
  'colour_network_call_centres',
  'colour_network_millennium_nerves',
  'colour_stream_everyone_a_broadcaster',
  'colour_stream_the_paper_thins',
  'colour_stream_screens_everywhere',
  'colour_stream_the_archive_opens',
] as const
export type EventId = (typeof EVENT_IDS)[number]

const EVENT_ID_SET: ReadonlySet<string> = new Set(EVENT_IDS)

/** Narrowing helper for anything reading an event id off a save or an export. */
export function isEventId(value: string): value is EventId {
  return EVENT_ID_SET.has(value)
}
