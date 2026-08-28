/**
 * The catalogue: what every event is CALLED and how it READS. One entry per
 * `EventId`, compile-enforced total, and the only place in the game where the
 * wire's prose is authored.
 *
 * The seam this file exists to hold is the same one the manual holds
 * (ADR-0024) and the levers hold: **a pipeline step knows what happened, the
 * catalogue knows how it is reported.** `shocks.ts` decides that the rains
 * failed; it does not decide whether the sub-editor calls it a drought or a
 * failure of the monsoon, and it certainly does not decide that the nineteen-
 * seventies would have said it differently. Keeping the two apart is what
 * makes a hundred new dispatches a hundred lines of table rather than a
 * hundred edits spread across six pipeline steps.
 *
 * Three rules govern the copy, and all three are load-bearing:
 *
 * 1. **No figures, ever.** Not in a headline, not in a body. The wire reads
 *    TRUE state to decide what to print (`conditions.ts`), and the moment a
 *    dispatch prints a number off that state, the newspaper becomes an
 *    unfogged instrument that no statistical capacity was ever funded for —
 *    which is precisely the measurement the fog exists to withhold (ADR-0003).
 *    Qualitative prose is not a stylistic preference here; it is the boundary.
 *    `tests/properties/events.test.ts` greps the whole catalogue for digits.
 *
 *    **A figure spelled out in words is still a figure**, and that is the part
 *    the digit-grep cannot see. `land_no_longer_employs_the_country` shipped as
 *    "Fewer than one worker in five is on the land" — a bucketed reading of the
 *    industrial census, which is a survey the player has to fund, arriving free
 *    on the wire. It was also, after the threshold was calibrated against the
 *    measured distribution, not even true across its own trigger range.
 *
 *    The line to hold: a milestone over state that needs NO statistical office
 *    may say what it is, because saying it costs the player nothing they would
 *    otherwise buy — heads and where they sleep are countable (`ui/src/census.ts`),
 *    so "the country is twice the size it was" is free. A milestone over a
 *    FOGGED quantity — output per worker, the industrial census, anything with a
 *    lag and a band — may report the direction and never the magnitude. This is
 *    the same split `kind` already draws between `milestone` and `rumor`.
 *
 * 2. **Copy is authored per era where the century would have said it
 *    differently, and inherited otherwise.** `dispatches` is the copy that
 *    always applies; `byEra` overrides it from that era onward, and
 *    `dispatchFor` walks backwards to the most recent override. So giving an
 *    event a nineteen-nineties voice is one line, and no event can be left
 *    without copy for an era nobody thought about.
 *
 * 3. **A body is a standfirst, not an explanation.** Two sentences of what a
 *    reader would have been told, in the register of the age. It must not
 *    teach the mechanism — the manual does that, and it is generated.
 */

import type { NewsKind, NewsTone } from '../state/schema'
import type { DeskId, EventId, Prominence } from './ids'
import type { PressEraId } from './eras'

/** One filed story: the headline the ticker carries and the standfirst the
 * front page prints under it. */
export interface Dispatch {
  headline: string
  body: string
}

export interface EventDef {
  /** the machine-readable category. Coarse on purpose: readers that FILTER
   * the wire (the finance overlay's crisis markers) match on `kind`, so it has
   * to stay a small, stable list. Sections belong to `desk`. */
  kind: NewsKind
  desk: DeskId
  tone: NewsTone
  prominence: Prominence
  /** the copy that always applies — every event has at least one */
  dispatches: Dispatch[]
  /** copy that takes over from this era onward */
  byEra?: Partial<Record<PressEraId, Dispatch[]>>
}

export const EVENT_CATALOGUE: Record<EventId, EventDef> = {
  // ==================== the sky and the land ====================
  drought_onset: {
    kind: 'drought_begins',
    desk: 'land',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'Drought grips the growing provinces',
        body: 'The rains have failed across the arable belt and the harvest is given up for lost. Provincial governors are asking the capital what it intends to do about bread.',
      },
      {
        headline: 'The rains do not come',
        body: 'Wells are being deepened and stock driven to water. Agricultural officers say the standing crop cannot now be saved whatever the weather does next.',
      },
    ],
    byEra: {
      crisis: [
        {
          headline: 'Drought: the worst season in living memory',
          body: 'Farm unions want an emergency price for grain and the millers want an import licence. The ministry has promised a statement and not much else.',
        },
      ],
      network: [
        {
          headline: 'Drought declared across the farming belt',
          body: 'Satellite surveys confirm what every farmer already knew. Insurers are bracing for claims and the futures market has done the rest.',
        },
      ],
    },
  },
  drought_relief: {
    kind: 'drought_ends',
    desk: 'land',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Rains return to the provinces',
        body: 'The first steady weather in more than a year has the countryside planting again. Merchants expect a decent harvest and a quieter market.',
      },
      {
        headline: 'The drought breaks',
        body: 'Reservoirs are filling and the stock routes are open. Nobody expects the lost season back, but the next one now looks possible.',
      },
    ],
  },
  fuel_shock: {
    kind: 'fuel_shock',
    desk: 'abroad',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'World fuel markets in tumult',
        body: 'A rupture in the international energy trade has sent prices leaping. Everything that has to be carried anywhere will cost more before the quarter is out.',
      },
    ],
    byEra: {
      crisis: [
        {
          headline: 'Oil crisis: the pumps run dry',
          body: 'Queues formed at filling stations before dawn and the haulage trade is talking about a stoppage. The cabinet is said to be considering rationing.',
        },
      ],
      market: [
        {
          headline: 'Crude spikes on foreign rupture',
          body: 'Traders bid the barrel up through the session and refiners passed it straight along. Transport costs will do the rest of the work.',
        },
      ],
      stream: [
        {
          headline: 'Energy shock ripples through every market',
          body: 'The price moved before most people were awake and the freight rates followed it. Analysts are already arguing about how long it lasts.',
        },
      ],
    },
  },

  // ==================== the world outside ====================
  world_commodity_crisis: {
    kind: 'partner_crisis',
    desk: 'abroad',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Commodity crash abroad',
        body: 'The exporting nations have slashed output overnight and the raw-material trade is in disarray. Buyers here cannot say yet whether this is relief or ruin.',
      },
    ],
  },
  world_commodity_boom: {
    kind: 'partner_boom',
    desk: 'abroad',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Commodity exporters flush',
        body: 'Raw materials are easing on every board as the producing countries open the taps. Manufacturers here are quietly delighted.',
      },
    ],
  },
  world_commodity_slump: {
    kind: 'partner_slump',
    desk: 'abroad',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Commodity bloc cuts output',
        body: 'The producing countries are holding back supply and raw materials have grown scarce and dear. Every industry that melts, smelts or spins will feel it.',
      },
    ],
  },
  world_manufacturing_crisis: {
    kind: 'partner_crisis',
    desk: 'abroad',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The great workshop seizes up',
        body: 'Factory closures abroad have snarled the supply of half-finished goods. Orders placed months ago are not going to arrive.',
      },
    ],
    byEra: {
      network: [
        {
          headline: 'Global supply chains snarl',
          body: 'The manufacturing giant has stopped, and everything assembled from its parts has stopped with it. Purchasing managers are rewriting their schedules.',
        },
      ],
    },
  },
  world_manufacturing_boom: {
    kind: 'partner_boom',
    desk: 'abroad',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Cheap goods flood world markets',
        body: 'The manufacturing giant is running at full stretch and undercutting everybody. Shoppers gain what our own workshops lose.',
      },
    ],
  },
  world_manufacturing_slump: {
    kind: 'partner_slump',
    desk: 'abroad',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The great workshop idles',
        body: 'Foreign demand for finished goods has softened and the order books abroad are thinning. Our exporters will hear about it next.',
      },
    ],
  },
  world_financial_crisis: {
    kind: 'partner_crisis',
    desk: 'abroad',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'A sudden stop in the money centres',
        body: 'The great lending houses have frozen and foreign credit has simply vanished. Anyone rolling over a foreign loan this quarter is in trouble.',
      },
    ],
    byEra: {
      market: [
        {
          headline: 'Panic in the money centres',
          body: 'Dealing rooms abroad closed on losses nobody has finished counting. Credit lines are being pulled without notice.',
        },
      ],
    },
  },
  world_financial_boom: {
    kind: 'partner_boom',
    desk: 'abroad',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Easy money in the financial centres',
        body: 'Foreign lending is flowing freely and terms have rarely been softer. Borrowers here will find the door open.',
      },
    ],
  },
  world_financial_slump: {
    kind: 'partner_slump',
    desk: 'abroad',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The money centres turn cautious',
        body: 'Foreign credit is tightening and the terms have hardened. Refinancing anything abroad has become an argument.',
      },
    ],
  },
  world_regional_crisis: {
    kind: 'partner_crisis',
    desk: 'abroad',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Collapse next door',
        body: 'The regional economy has fallen into open crisis and it is close enough to see. Border trade has thinned to nothing.',
      },
    ],
  },
  world_regional_boom: {
    kind: 'partner_boom',
    desk: 'abroad',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The neighbours are buying',
        body: 'The regional economy is booming and the border traffic shows it. Exporters report enquiries they have not had in years.',
      },
    ],
  },
  world_regional_slump: {
    kind: 'partner_slump',
    desk: 'abroad',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Recession spreads across the region',
        body: 'The neighbours have pulled in their belts and the border trade has slackened with them. Our nearest market is our weakest.',
      },
    ],
  },

  // ==================== the laboratories ====================
  breakthrough: {
    kind: 'breakthrough',
    desk: 'science',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'A discovery is announced',
        body: 'The laboratories say a long-standing problem has given way at last. What it is worth to a working economy nobody can yet say.',
      },
      {
        headline: 'A new technique is unveiled',
        body: 'Engineers describe a method that does in an afternoon what used to take a week. The trade press is enthusiastic and the accountants are cautious.',
      },
    ],
    byEra: {
      wireless: [
        {
          headline: 'New alloy promises stronger, lighter machines',
          body: 'Metallurgists have announced a material that ought to change what a workshop can build. The service departments are said to be interested.',
        },
        {
          headline: 'Laboratory announces advance in synthetics',
          body: 'A process developed for the war has found a peacetime use. Manufacturers are already asking about licences.',
        },
      ],
      boom: [
        {
          headline: 'Automatic control comes to the factory floor',
          body: 'A new generation of machine tools can hold a tolerance no hand could. Foremen are impressed and uneasy in roughly equal measure.',
        },
        {
          headline: 'Advance in chemistry promises cheaper everything',
          body: 'The laboratories have found a shorter route to a compound half of industry depends on. Prices along that chain should follow.',
        },
      ],
      crisis: [
        {
          headline: 'Computing machine put to industrial work',
          body: 'A programmable machine has been set to scheduling a whole plant. Its operators say it does not tire and does not argue.',
        },
        {
          headline: 'Breakthrough in energy efficiency announced',
          body: 'Engineers have found how to get the same work from markedly less fuel. In this of all years, that is news.',
        },
      ],
      market: [
        {
          headline: 'Microprocessor advance announced',
          body: 'Another doubling, and another set of things that were impossible last year. The trade press has stopped being surprised.',
        },
        {
          headline: 'Materials science yields a new composite',
          body: 'Lighter than metal and stiffer than anyone expected. The aerospace and motor trades are both said to be bidding for it.',
        },
      ],
      network: [
        {
          headline: 'Networked systems transform the back office',
          body: 'Firms that have wired their operations together report they can see their own business for the first time. The rest are hurrying.',
        },
        {
          headline: 'Advance in the life sciences reported',
          body: 'Researchers describe a technique that reads what used to be guessed at. Medicine and agriculture are both queuing.',
        },
      ],
      stream: [
        {
          headline: 'Learning machines outperform their designers',
          body: 'A system trained rather than programmed has beaten the specialists at their own task. Nobody is quite sure what it has learned.',
        },
        {
          headline: 'Storage breakthrough changes the energy arithmetic',
          body: 'Power made when the weather allows can now be kept until it is wanted. The grid engineers say this changes everything.',
        },
      ],
    },
  },

  // ==================== the banks ====================
  banking_crisis: {
    kind: 'banking_crisis',
    desk: 'finance',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'Banking crisis: a great lender fails',
        body: 'Credit froze overnight when the house could not meet its obligations. Depositors formed queues before the doors opened and the other banks are lending to nobody.',
      },
    ],
    byEra: {
      market: [
        {
          headline: 'The banking system seizes',
          body: 'A lender everyone assumed was safe has gone, and the interbank market has closed behind it. The central bank is in session.',
        },
      ],
      network: [
        {
          headline: 'Bank failure freezes the credit market',
          body: 'The collapse was visible on screens across the country within minutes. Every institution is now assuming the worst about every other.',
        },
      ],
    },
  },
  banking_crisis_sudden_stop: {
    kind: 'banking_crisis',
    desk: 'finance',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'Sudden stop: foreign credit vanishes',
        body: 'The lines from abroad were withdrawn without warning and the banks here cannot replace them. What was a foreign problem this morning is ours by this evening.',
      },
    ],
  },
  banking_recovery: {
    kind: 'banking_recovery',
    desk: 'finance',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The banks are recapitalized at last',
        body: 'Credit is beginning to thaw and the surviving houses are quoting terms again. The cost of the rescue will be argued about for a decade.',
      },
    ],
  },
  asset_bubble: {
    kind: 'asset_bubble',
    desk: 'finance',
    tone: 'neutral',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Speculation runs hot',
        body: 'Asset prices have reached heights the older dealers describe as giddy. Everyone agrees it cannot last and nobody is selling.',
      },
    ],
    byEra: {
      market: [
        {
          headline: 'The bull market roars on',
          body: 'Valuations are at levels that used to require an explanation and no longer seem to. New money is arriving faster than the paper to absorb it.',
        },
      ],
      network: [
        {
          headline: 'Valuations reach new heights',
          body: 'Analysts have begun explaining why the old measures no longer apply. That explanation has been offered before.',
        },
      ],
    },
  },

  // ==================== the constitution ====================
  corridor_exit_despotic: {
    kind: 'corridor_exit',
    desk: 'politics',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The state has outgrown every check upon it',
        body: 'The ministries now answer to no one outside themselves. What remains of the opposition says so quietly and in private.',
      },
    ],
  },
  corridor_exit_anarchic: {
    kind: 'corridor_exit',
    desk: 'politics',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The writ no longer runs in the provinces',
        body: 'Tax officers are turned back at the district line and the courts sit on cases nobody enforces. Authority has drained out of the capital.',
      },
    ],
  },
  corridor_return: {
    kind: 'corridor_return',
    desk: 'politics',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The constitution holds',
        body: 'State and society have found their balance again after a period in which neither was sure of the other. Constitutional lawyers are permitting themselves some optimism.',
      },
    ],
  },
  reform_window: {
    kind: 'reform_window',
    desk: 'politics',
    tone: 'neutral',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The country is in ferment',
        body: 'Things that were impossible last year are suddenly negotiable, and everyone in the capital knows it. Windows of this kind close as quickly as they open.',
      },
    ],
  },

  // ==================== the government's tenure ====================
  revolt: {
    kind: 'revolt',
    desk: 'politics',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'Revolution: the crowds take the ministries',
        body: 'The government has fled and the buildings are held by whoever arrived first. Nobody in the capital can say tonight what comes next.',
      },
    ],
  },
  coup: {
    kind: 'coup',
    desk: 'politics',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The men who own the country change the government',
        body: 'They had decided some time ago that they no longer owned this one. The transfer of power took a single morning and no votes at all.',
      },
    ],
  },
  election_won: {
    kind: 'election',
    desk: 'politics',
    tone: 'good',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The government is returned at the polls',
        body: 'The count went the government’s way and the opposition has conceded. A programme survives to be argued about for another term.',
      },
    ],
  },
  election_lost: {
    kind: 'election',
    desk: 'politics',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The government has fallen at the polls',
        body: 'The voters have dismissed the administration and its programme with it. The removal vans were at the ministries before the final count.',
      },
    ],
  },
  election_suppressed: {
    kind: 'election',
    desk: 'politics',
    tone: 'good',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The government is returned. The opposition was not on the ballot',
        body: 'The result was announced with commendable speed. Foreign observers were not invited and domestic ones were not encouraged.',
      },
    ],
  },
  election_protected: {
    kind: 'election',
    desk: 'politics',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The government is defeated and does not leave',
        body: 'The count went against the administration and the administration remains. This is a simulation running under a protected tenure, and the record says so.',
      },
    ],
  },

  // ==================== the government's own acts ====================
  // Raised from `actions/apply.ts`, so the paper carries the player's record
  // as it is made. Only the two DISCRETE acts qualify — a reform and a statute
  // are single, dated, arguable decisions. Dial moves deliberately do not: a
  // government that nudges the policy rate every quarter for eighty years
  // would fill the wire with its own paperwork, and the minute book
  // (`ui/src/policyRecord.ts`) already files exactly that.
  reform_suffrage_up: {
    kind: 'reform',
    desk: 'politics',
    tone: 'good',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The franchise is widened',
        body: 'People who had no vote yesterday have one today, and the parties are already recalculating. The old registers are worth nothing now.',
      },
    ],
    byEra: {
      network: [
        {
          headline: 'Voting rights extended',
          body: 'The reform passed after a shorter fight than its opponents had promised. Registration drives begin within the week.',
        },
      ],
    },
  },
  reform_suffrage_down: {
    kind: 'reform',
    desk: 'politics',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The franchise is narrowed',
        body: 'Qualifications have been reimposed and a part of the electorate has been written out of it. The government says this restores seriousness to the ballot.',
      },
    ],
  },
  reform_press_up: {
    kind: 'reform',
    desk: 'politics',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Censorship is lifted',
        body: 'Titles that were closed are reopening and editors are testing how far the new liberty runs. This newspaper has an interest to declare.',
      },
    ],
  },
  reform_press_down: {
    kind: 'reform',
    desk: 'politics',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'New restrictions on the press',
        body: 'Licensing has been tightened and the penalties for a wrong word have been raised. Readers may wish to weigh what follows accordingly.',
      },
    ],
  },
  reform_labor_rights_up: {
    kind: 'reform',
    desk: 'labour',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Organising rights are granted',
        body: 'Workers may now combine and bargain where they could not before. Employers describe the measure as premature and the unions as overdue.',
      },
    ],
  },
  reform_labor_rights_down: {
    kind: 'reform',
    desk: 'labour',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Organising rights are curtailed',
        body: 'The legal protections around combination have been cut back. Union offices say they will test the new law in the courts, if the courts will hear them.',
      },
    ],
  },
  reform_courts_up: {
    kind: 'reform',
    desk: 'politics',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The courts are strengthened',
        body: 'Judicial independence has been written further into the constitution and the bench has been given the means to use it. Ministers may find their orders read closely from now on.',
      },
    ],
  },
  reform_courts_down: {
    kind: 'reform',
    desk: 'politics',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The courts are brought to heel',
        body: 'The bench has lost powers it used against the government and gained a supervising minister. Several judges have resigned rather than sit under it.',
      },
    ],
  },
  reform_repression_up: {
    kind: 'reform',
    desk: 'politics',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'Emergency powers are assumed',
        body: 'The security apparatus has been enlarged and its answerability reduced. The government calls the measure temporary, as governments do.',
      },
    ],
  },
  reform_repression_down: {
    kind: 'reform',
    desk: 'politics',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Emergency powers are wound back',
        body: 'The special apparatus has been cut and some of its files handed to the courts. Nobody expects the whole story to come out.',
      },
    ],
  },
  statute_minimum_wage_enacted: {
    kind: 'statute',
    desk: 'labour',
    tone: 'good',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'A wage floor is written into law',
        body: 'No employer may now pay below the posted rate, and the inspectorate has been told to enforce it. Small trades say they cannot; unions say they always could.',
      },
    ],
  },
  statute_minimum_wage_repealed: {
    kind: 'statute',
    desk: 'labour',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The wage floor is struck out',
        body: 'The statutory minimum has been repealed and pay returns to whatever can be agreed. Employers’ associations welcomed the decision within the hour.',
      },
    ],
  },
  statute_compulsory_schooling_enacted: {
    kind: 'statute',
    desk: 'science',
    tone: 'good',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'School is made compulsory',
        body: 'Children below the new leaving age must be in a classroom rather than at work. Farms and workshops that relied on them are counting the cost.',
      },
    ],
  },
  statute_compulsory_schooling_repealed: {
    kind: 'statute',
    desk: 'science',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The school-leaving age is lowered',
        body: 'The compulsory years have been shortened and the youngest cohort may work again. The teaching profession has objected in the strongest terms available to it.',
      },
    ],
  },
  statute_competition_enacted: {
    kind: 'statute',
    desk: 'industry',
    tone: 'good',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'A competition act reaches the statute book',
        body: 'Combinations that carved up the market between them are now unlawful, and an authority exists to say so. The largest houses have retained the best counsel available.',
      },
    ],
  },
  statute_competition_repealed: {
    kind: 'statute',
    desk: 'industry',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The competition act is repealed',
        body: 'The restrictions on combination have been lifted and the authority stood down. The largest firms have not commented, which is comment enough.',
      },
    ],
  },
  statute_emissions_standard_enacted: {
    kind: 'statute',
    desk: 'land',
    tone: 'good',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'A clean air act reaches the statute book',
        body: 'What may be put into the air is now a matter of law rather than of habit. The works say the plant cannot be altered; the inspectorate says it can.',
      },
    ],
    byEra: {
      network: [
        {
          headline: 'Emissions limits written into law',
          body: 'Operators must meet a posted standard and demonstrate that they have. Compliance departments have been hiring since the bill was published.',
        },
      ],
    },
  },
  statute_emissions_standard_repealed: {
    kind: 'statute',
    desk: 'land',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The clean air act is repealed',
        body: 'The limits on what may be discharged have been lifted in the name of costs and competitiveness. Those who live downwind were not consulted.',
      },
    ],
  },

  // ==================== the cost of living ====================
  // Everything from here down is a CONDITION report: the news desk read the
  // country and filed. `conditions.ts` owns when; this owns what it says.
  bread_queues: {
    kind: 'rumor',
    desk: 'home',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Bread queues reported in the capital',
        body: 'Women were waiting outside the bakeries before light and many went away with nothing. The ministry says supplies are adequate.',
      },
      {
        headline: 'The warehouses are thin, say grain merchants',
        body: 'Dealers report stocks they would normally hold for months are down to weeks. Nobody will say the word shortage on the record.',
      },
      {
        headline: 'Empty market stalls in the provinces',
        body: 'Country papers describe market days with more buyers than goods. Prices asked are not prices anybody is paying.',
      },
    ],
    byEra: {
      market: [
        {
          headline: 'Shortages reported in the food trade',
          body: 'Supermarket shelves have gaps in them and the buying departments are blaming each other. Consumers are simply buying twice as much of whatever is there.',
        },
      ],
    },
  },
  prices_racing: {
    kind: 'rumor',
    desk: 'home',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Shopkeepers repricing by the week',
        body: 'Tickets are being changed faster than they can be printed and nobody trusts a quoted price to last. The wage bargainers have noticed.',
      },
      {
        headline: 'Protest over the cost of the market basket',
        body: 'Household budgets that balanced last year do not balance now. Deputations have been received at the ministry and sent away with sympathy.',
      },
      {
        headline: 'Pay packets no longer stretch, say wage earners',
        body: 'Earnings have risen and bought less than they did. Union offices report members asking for reopened settlements.',
      },
    ],
  },
  prices_runaway: {
    kind: 'rumor',
    desk: 'home',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'Prices out of all control',
        body: 'Shops are closing at midday rather than sell at yesterday’s prices. Anyone holding money is losing it faster than they can spend it.',
      },
      {
        headline: 'The currency will not hold its value for a week',
        body: 'Wages are being demanded daily and settled in goods where they can be. This is no longer inflation as economists use the word.',
      },
    ],
  },
  prices_falling: {
    kind: 'rumor',
    desk: 'home',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Prices are falling and nobody is glad',
        body: 'Shopkeepers cut and cut again to move stock that will not move. Debts contracted last year have quietly grown heavier.',
      },
      {
        headline: 'Traders report a buyers’ market and no buyers',
        body: 'Everyone is waiting for next month, when it will all be cheaper again. It is a rational calculation and it is strangling the trade.',
      },
    ],
  },
  shops_quiet_and_full: {
    kind: 'rumor',
    desk: 'home',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Steady trade and quiet prices',
        body: 'Merchants report goods on the shelves and customers able to pay for them. The chamber of commerce calls conditions satisfactory.',
      },
      {
        headline: 'An ordinary quarter in the shops',
        body: 'Nothing in the retail trade has gone wrong, which is worth reporting because it so often does. Stock is moving at the price on the ticket.',
      },
    ],
  },
  poverty_widespread: {
    kind: 'rumor',
    desk: 'home',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Charitable relief overwhelmed',
        body: 'The soup kitchens and parish funds report demand they cannot meet. Those running them say the need is now permanent rather than seasonal.',
      },
      {
        headline: 'A large part of the country lives below any decent line',
        body: 'Investigators describe households where the whole income goes on food and still does not cover it. Nobody disputes the description.',
      },
    ],
    byEra: {
      network: [
        {
          headline: 'Food banks report demand they cannot meet',
          body: 'Volunteers describe queues of people in work who still cannot cover the week. The word poverty has come back into ordinary use.',
        },
      ],
    },
  },
  poverty_receding: {
    kind: 'rumor',
    desk: 'home',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The relief rolls are shrinking',
        body: 'Charitable societies report fewer applicants than at any time in their records. They are cautious about saying why.',
      },
      {
        headline: 'Destitution is becoming unusual',
        body: 'Conditions that were ordinary a generation ago are now remarked upon. Older readers will find that strange and welcome.',
      },
    ],
  },
  households_saving_hard: {
    kind: 'rumor',
    desk: 'home',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Families are putting money away',
        body: 'Savings institutions report deposits well above the ordinary run. People who are frightened of next year save for it.',
      },
    ],
  },
  households_spending_freely: {
    kind: 'rumor',
    desk: 'home',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Households are spending freely',
        body: 'Retailers report the best trade in years and savings books going the other way. Nobody is putting anything by.',
      },
    ],
  },
  confidence_low: {
    kind: 'rumor',
    desk: 'home',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'A gloomy mood in the country',
        body: 'Ordinary people report expecting next year to be worse than this one. Expecting it is often enough to arrange it.',
      },
    ],
  },
  confidence_high: {
    kind: 'rumor',
    desk: 'home',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Optimism reported in the country',
        body: 'Households and firms alike say they expect better times. Order books and hire-purchase agreements agree with them.',
      },
    ],
  },

  // ==================== work ====================
  factory_gates_idle: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Idle men gather at the factory gates',
        body: 'They come each morning on the chance of a day’s work and most are turned away. The foremen have stopped coming out to explain.',
      },
      {
        headline: 'Men riding the rails for work',
        body: 'Provincial governors report families moving on the chance of employment elsewhere. There is rarely employment elsewhere.',
      },
      {
        headline: 'Out of work and out of the figures',
        body: 'Relief offices describe applicants who have stopped registering because registering achieved nothing. The official count sees none of them.',
      },
    ],
    byEra: {
      market: [
        {
          headline: 'Redundancies announced across the trade',
          body: 'Plants that carried their workforces through the last downturn are not carrying them through this one. The notices went up on a Friday.',
        },
      ],
    },
  },
  unions_demand_works: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Unions demand public works',
        body: 'A deputation has put the case for roads, housing and anything else that employs a man with a shovel. The treasury has been non-committal.',
      },
    ],
  },
  jobless_generation: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'bad',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'A generation leaves school for nothing',
        body: 'The young have never worked and are beginning to expect that they will not. Everyone who studies these things says the scarring lasts decades.',
      },
      {
        headline: 'Mass unemployment settles in',
        body: 'What was described last year as a cyclical adjustment has outlived the cycle. The relief system was not designed for numbers like these.',
      },
    ],
  },
  hands_are_scarce: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Employers cannot find hands',
        body: 'Firms report vacancies standing open for months and wages bid up to fill them. Anyone with a trade can name their terms.',
      },
      {
        headline: 'Labour is short everywhere',
        body: 'Recruiting is being done at the gates of other people’s factories. The practice is deplored by everyone who is doing it.',
      },
    ],
  },
  wage_packets_thin: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Real earnings are going backwards',
        body: 'Money wages have moved and what they buy has not kept up. Settlements agreed in good faith last year look thin now.',
      },
    ],
  },
  wage_packets_fat: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Wages are buying more than they did',
        body: 'Earnings have outrun prices for long enough that households have begun to believe it. Hire-purchase agreements are being signed on the strength of it.',
      },
    ],
  },
  emigration_rising: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The boats are full and going out',
        body: 'Passport offices report queues and the shipping agents are booked ahead. Those leaving are, as always, the ones the country could least spare.',
      },
      {
        headline: 'Emigration reaches a rate not seen in years',
        body: 'Whole districts report their young gone abroad within a season. The remittances they send back are the only good news in it.',
      },
    ],
    byEra: {
      network: [
        {
          headline: 'Skilled workers are leaving in numbers',
          body: 'Recruitment agencies abroad are advertising openly and being answered. Employers here complain they train and someone else hires.',
        },
      ],
    },
  },
  immigration_rising: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'neutral',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Arrivals at the border rise sharply',
        body: 'People are coming because there is work here and less of it where they were. Employers are glad and the housing market is not.',
      },
    ],
  },
  inequality_widening: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The gap is opening',
        body: 'Those at the top have pulled away from the middle and the middle from the bottom. Everyone can see it; the argument is over what did it.',
      },
    ],
    byEra: {
      market: [
        {
          headline: 'A tale of two countries',
          body: 'Boardroom pay and shop-floor pay have stopped moving together and stopped being comparable. Nobody in either place disputes the fact.',
        },
      ],
    },
  },
  inequality_narrowing: {
    kind: 'rumor',
    desk: 'labour',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The gap is closing',
        body: 'Incomes at the bottom have grown faster than those at the top for long enough to show. It is the sort of change nobody notices until it is done.',
      },
    ],
  },

  // ==================== money ====================
  mint_running_hot: {
    kind: 'rumor',
    desk: 'finance',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Bank clerks whisper that the mint is running hot',
        body: 'New notes are arriving in quantities nobody at the treasury will discuss. Those who remember the last time have begun buying goods.',
      },
      {
        headline: 'The presses are said to be running',
        body: 'Government is spending money it has not raised and the difference is coming from somewhere. Dealers have drawn their own conclusions.',
      },
    ],
  },
  auction_poor: {
    kind: 'rumor',
    desk: 'finance',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The bill auction found few takers',
        body: 'Dealers say the book was thin and the price had to be cut to clear it. The treasury describes the result as satisfactory.',
      },
    ],
  },
  reserves_thin: {
    kind: 'rumor',
    desk: 'finance',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Importers scramble for foreign exchange',
        body: 'Letters of credit are being refused and cargoes are sitting on the water. The allocation is now made by somebody at a desk rather than by the market.',
      },
      {
        headline: 'The central bank is counting its gold twice',
        body: 'Reserves are said to be down to a few weeks of imports. Nobody at the bank will confirm a figure, which is itself a figure of sorts.',
      },
    ],
  },
  reserves_ample: {
    kind: 'rumor',
    desk: 'finance',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Reserves are comfortable',
        body: 'The central bank has more foreign exchange than it has had for years. Importers can get what they need without asking anyone a favour.',
      },
    ],
  },
  credit_boom: {
    kind: 'rumor',
    desk: 'finance',
    tone: 'neutral',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Banks are lending as never before',
        body: 'Credit is being extended on terms the older managers describe as generous and the younger ones as competitive. The loan books have never grown faster.',
      },
    ],
    byEra: {
      market: [
        {
          headline: 'Credit is cheap and everyone wants some',
          body: 'Borrowing that would have been refused a decade ago is now approved in an afternoon. The security offered is, increasingly, the price of the thing being bought.',
        },
      ],
    },
  },
  credit_drought: {
    kind: 'rumor',
    desk: 'finance',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The banks have stopped lending',
        body: 'Sound businesses report facilities withdrawn and renewals refused. The managers say their instructions come from above them.',
      },
    ],
  },
  banks_thinly_capitalized: {
    kind: 'rumor',
    desk: 'finance',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The banks are running thin',
        body: 'Capital behind the loan books has fallen to a level supervisors would once have refused to allow. The banks say their assets are excellent.',
      },
    ],
  },
  bourse_slump: {
    kind: 'rumor',
    desk: 'finance',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'A bad session on the exchange',
        body: 'Prices fell through the afternoon and closed at the low. Brokers say there were sellers and no buyers, which is the whole of the story.',
      },
    ],
  },
  debt_alarming: {
    kind: 'rumor',
    desk: 'finance',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The public debt is the talk of the money market',
        body: 'What the state owes has grown large beside what the country earns, and the lenders have begun to say so out loud. The premium demanded says it louder.',
      },
    ],
  },
  debt_retired: {
    kind: 'rumor',
    desk: 'finance',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The national debt is discharged',
        body: 'The last of the stock has been redeemed and the state owes nothing it cannot pay this quarter. Older readers may recall being told this was impossible.',
      },
    ],
  },
  exchange_rate_slides: {
    kind: 'rumor',
    desk: 'finance',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The currency slides on the foreign market',
        body: 'Dealers marked it down through the week and the central bank did not stop them. Everything bought abroad is about to cost more.',
      },
    ],
  },

  // ==================== what the country makes ====================
  order_books_full: {
    kind: 'rumor',
    desk: 'industry',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Order books full to year’s end',
        body: 'Factories report more work than they can take and delivery dates stretching out. Buyers are being asked to wait and are waiting.',
      },
    ],
  },
  plants_idle: {
    kind: 'rumor',
    desk: 'industry',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Plant standing idle across the trade',
        body: 'Machines that cost a fortune are turning over for a single shift or not at all. Managers describe the position as temporary and have done for some time.',
      },
    ],
  },
  services_overtake_industry: {
    kind: 'rumor',
    desk: 'industry',
    tone: 'neutral',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The country now lives by services, not by making things',
        body: 'Offices, shops and trades now account for more of what the country produces than its factories do. Whether that is arrival or decline is being argued about everywhere.',
      },
    ],
  },
  industry_overtakes_land: {
    kind: 'rumor',
    desk: 'industry',
    tone: 'neutral',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The factories now outweigh the fields',
        body: 'Manufacturing has passed agriculture in what it contributes to the country’s output. A rural nation has become an industrial one while nobody was watching.',
      },
    ],
  },
  land_no_longer_employs_the_country: {
    kind: 'rumor',
    desk: 'land',
    tone: 'neutral',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The land is no longer where the country works',
        body: 'The countryside that employed most of the country within living memory now employs a small minority of it. The villages are said to be quiet.',
      },
    ],
  },
  energy_runs_short: {
    kind: 'rumor',
    desk: 'industry',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Power is short and industry is rationed',
        body: 'Supply cannot meet what the grid is being asked for and the cuts are being shared out. Factories are being told which days they may run.',
      },
    ],
  },
  productivity_doubled: {
    kind: 'rumor',
    desk: 'industry',
    tone: 'good',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'A day’s work is not what it was',
        body: 'Output for every hour worked has transformed since the war, which is the whole of the modern economic story in one line. The argument is over who has had the benefit.',
      },
    ],
  },

  // ==================== the land and the air ====================
  harvest_thin: {
    kind: 'rumor',
    desk: 'land',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'A thin harvest in the provinces',
        body: 'Yields have come in below what the districts expected and below what they need. The millers are already buying abroad.',
      },
    ],
  },
  harvest_bumper: {
    kind: 'rumor',
    desk: 'land',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'A harvest to remember',
        body: 'The granaries are full and the market is easy for the first time in years. Farmers are complaining about the price, which is how one knows the crop was good.',
      },
    ],
  },
  air_turns_foul: {
    kind: 'rumor',
    desk: 'land',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The air in the industrial towns is thick',
        body: 'Doctors report chests they can hear across a room and washing that comes in dirtier than it went out. Nobody has decided whose problem it is.',
      },
    ],
    byEra: {
      crisis: [
        {
          headline: 'Smog hangs over the manufacturing districts',
          body: 'Schools kept children indoors and the hospitals took the old and the very young. Campaigners have started calling it what it is.',
        },
      ],
      network: [
        {
          headline: 'Air quality warnings issued for the cities',
          body: 'Monitoring stations have exceeded every threshold the health service publishes. The advice is to stay inside, which is advice for people who can.',
        },
      ],
    },
  },
  rivers_run_black: {
    kind: 'rumor',
    desk: 'land',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The rivers run black past the works',
        body: 'Fish have gone from stretches where men fished in living memory. The works say they comply with every rule there is, which may well be true.',
      },
    ],
  },
  air_clears: {
    kind: 'rumor',
    desk: 'land',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The air over the cities is clearing',
        body: 'The old smoke has thinned enough that people remark on the view. Doctors report fewer of the chests that used to fill the winter wards.',
      },
    ],
  },

  // ==================== the street ====================
  marches_on_the_ministries: {
    kind: 'rumor',
    desk: 'politics',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Students and strikers march on the ministries',
        body: 'The column filled the main avenue and stopped outside the government buildings. It dispersed on its own, this time.',
      },
      {
        headline: 'The streets are full again',
        body: 'A crowd assembled without anyone appearing to have called it. Those who were there could not agree on what they wanted beyond something different.',
      },
    ],
    byEra: {
      stream: [
        {
          headline: 'A protest assembled in hours, not weeks',
          body: 'No organisation claims to have called it and the numbers were larger than any that could have. The ministry was still preparing a statement when it dispersed.',
        },
      ],
    },
  },
  gendarmerie_stretched: {
    kind: 'rumor',
    desk: 'politics',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The gendarmerie asks for reinforcements it does not have',
        body: 'District commanders report they cannot hold the streets and the barracks at once. The request has gone to the capital, where it is being considered.',
      },
    ],
  },
  pamphlets_circulate: {
    kind: 'rumor',
    desk: 'politics',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Pamphlets circulate that no censor has seen',
        body: 'They are printed somewhere and passed hand to hand in the provinces. What they say is less remarkable than the fact that people are keeping them.',
      },
    ],
    byEra: {
      network: [
        {
          headline: 'The government cannot keep up with what is being circulated',
          body: 'Material is moving faster than anyone can be appointed to read it. Officials are said to be studying what other countries have tried.',
        },
      ],
    },
  },
  government_popular: {
    kind: 'rumor',
    desk: 'politics',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The government stands high in the country',
        body: 'Whatever the opposition says in the chamber, the country appears to be content with the administration. Ministers are said to be enjoying themselves.',
      },
    ],
  },
  government_despised: {
    kind: 'rumor',
    desk: 'politics',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The government has lost the country',
        body: 'There is no constituency left that will defend the administration in public. Its own supporters have begun briefing against it.',
      },
    ],
  },
  press_muzzled: {
    kind: 'rumor',
    desk: 'politics',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'What is not being printed',
        body: 'Editors describe stories held, questions unasked and a growing list of subjects that are simply not raised. Readers may take this dispatch as an example of the difficulty.',
      },
    ],
  },
  courts_command_respect: {
    kind: 'rumor',
    desk: 'politics',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'A minister loses in court and complies',
        body: 'The judgment went against the government and the government obeyed it without visible enthusiasm. Lawyers say this is the whole point of having courts.',
      },
    ],
  },

  // ==================== the world's ledger ====================
  terms_of_trade_favourable: {
    kind: 'rumor',
    desk: 'abroad',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The terms of trade have turned our way',
        body: 'What the country sells is dear and what it buys is cheap, which is the pleasantest arithmetic in economics. It rarely lasts.',
      },
    ],
  },
  terms_of_trade_adverse: {
    kind: 'rumor',
    desk: 'abroad',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The terms of trade have turned against us',
        body: 'Exports fetch less and imports cost more, and the whole country is poorer for reasons decided elsewhere. There is very little to be done about it this quarter.',
      },
    ],
  },
  exports_carry_the_country: {
    kind: 'rumor',
    desk: 'abroad',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Exports are carrying the country',
        body: 'The docks are working double shifts and the order books are foreign. Whether that is strength or dependence is a question for a calmer year.',
      },
    ],
  },
  foreign_capital_floods_in: {
    kind: 'rumor',
    desk: 'abroad',
    tone: 'neutral',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Foreign money is buying in',
        body: 'Overseas firms are taking stakes in plant, land and companies at a rate the registry has not seen. Opinions on whether to welcome it divide along familiar lines.',
      },
    ],
  },
  foreign_capital_takes_flight: {
    kind: 'rumor',
    desk: 'abroad',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The foreign money has stopped coming',
        body: 'Investment that was arriving steadily a few years ago has all but dried up. Nobody involved will say what they know that others do not.',
      },
    ],
  },

  // ==================== the frontier ====================
  schools_fill: {
    kind: 'rumor',
    desk: 'science',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The schools are full',
        body: 'More of the country is being educated for longer than at any time in its history. Employers say the difference is visible in the people they hire.',
      },
    ],
  },
  schools_empty: {
    kind: 'rumor',
    desk: 'science',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Children are leaving school for the fields',
        body: 'Attendance falls away as soon as a household needs the hands or the wage. Inspectors record it and no one acts on the record.',
      },
    ],
  },
  technique_closes_on_the_frontier: {
    kind: 'rumor',
    desk: 'science',
    tone: 'good',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Our industry is catching the best in the world',
        body: 'Visiting engineers report plant here that would not disgrace the leading countries. A generation ago they came to be polite.',
      },
    ],
  },
  technique_falls_behind: {
    kind: 'rumor',
    desk: 'science',
    tone: 'bad',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Our methods are falling behind the world’s',
        body: 'What is standard abroad is exceptional here, and the gap has widened rather than closed. Those who have seen both say the difference is no longer a matter of degree.',
      },
    ],
  },

  // ==================== the census ====================
  // These four are `milestone` rather than `rumor` and the distinction is not
  // cosmetic. Heads are countable without a statistical office (see
  // `ui/src/census.ts`), so a population doubling and an urban majority are
  // FACTS the paper can report as facts. Everything above them that describes
  // the shape of the economy — the service share, the industrial crossing — is
  // filed as `rumor`, because those come from surveys the fog owns.
  population_doubles: {
    kind: 'milestone',
    desk: 'home',
    tone: 'neutral',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'The country is twice the size it was',
        body: 'The register records twice as many people living here as at the first postwar count. Every school, hospital and water main was built for the smaller number.',
      },
    ],
  },
  urban_majority: {
    kind: 'milestone',
    desk: 'home',
    tone: 'neutral',
    prominence: 'lead',
    dispatches: [
      {
        headline: 'More of the country now lives in towns than out of them',
        body: 'The registrar’s count has crossed the line that a hundred years of migration was heading for. The countryside will be an idea to most people born from now on.',
      },
    ],
  },
  country_ages: {
    kind: 'milestone',
    desk: 'home',
    tone: 'neutral',
    prominence: 'column',
    dispatches: [
      {
        headline: 'The country is growing old',
        body: 'The median age has passed a point no previous generation reached, and the pyramid has stopped looking like one. Pensions and hospitals are the arithmetic behind the headline.',
      },
    ],
  },
  births_fall_away: {
    kind: 'milestone',
    desk: 'home',
    tone: 'neutral',
    prominence: 'column',
    dispatches: [
      {
        headline: 'Births have fallen away',
        body: 'Families are markedly smaller than the ones the people having them grew up in. Demographers say this is what every country does once it gets rich enough.',
      },
    ],
  },

  // ==================== colour ====================
  // Era-gated filler, and the reason the paper is worth opening in a quarter
  // when nothing happened. `conditions.ts` only reaches for these when the
  // front page is otherwise thin, so they never crowd out an event — they fill
  // the column that would otherwise read ALL QUIET for the ninth quarter
  // running. They read no state beyond the year, which is what makes them
  // safe: there is nothing here for the fog to leak.
  colour_postwar_rationing: {
    kind: 'colour',
    desk: 'home',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The ration book endures',
        body: 'Coupons are still required for the things everyone wants most. Officials say the arrangements will be reviewed when circumstances allow.',
      },
      {
        headline: 'Make do and mend, still',
        body: 'Housewives’ columns are full of what can be done with an old coat. The war has been over for some time and the wardrobes have not noticed.',
      },
    ],
  },
  colour_postwar_wireless: {
    kind: 'colour',
    desk: 'home',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The nation gathers round the wireless',
        body: 'Evening listening has become the fixed point of the household day. The set is the most expensive thing in most front rooms.',
      },
    ],
  },
  colour_postwar_reconstruction: {
    kind: 'colour',
    desk: 'industry',
    tone: 'good',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The scaffolding is up across the cities',
        body: 'Builders cannot be had for love or money and the brickworks are running day and night. What is going up is not what was knocked down.',
      },
    ],
  },
  colour_postwar_railways: {
    kind: 'colour',
    desk: 'industry',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The railways carry everything',
        body: 'Freight and passengers alike move by rail because there is no other way to move them. The timetable is a national institution and a national complaint.',
      },
    ],
  },
  colour_boom_television: {
    kind: 'colour',
    desk: 'home',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Aerials appear on every roof',
        body: 'Television has arrived in ordinary streets and the evenings have rearranged themselves around it. The wireless is being moved to the kitchen.',
      },
    ],
  },
  colour_boom_motorcar: {
    kind: 'colour',
    desk: 'industry',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The motorcar reaches the ordinary household',
        body: 'Families who never expected to own one are buying on terms. Nobody has yet worked out where all of them are to be parked.',
      },
    ],
  },
  colour_boom_supermarket: {
    kind: 'colour',
    desk: 'home',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The self-service shop arrives',
        body: 'Customers take goods from the shelf themselves and pay at the door. The small grocers say it will never catch on.',
      },
    ],
  },
  colour_boom_new_towns: {
    kind: 'colour',
    desk: 'home',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'New towns rise on the old fields',
        body: 'Whole districts are being laid out at once, with the shops and schools drawn in before anyone moves. Architects are delighted and the first residents are lonely.',
      },
    ],
  },
  colour_crisis_queues_at_the_pumps: {
    kind: 'colour',
    desk: 'home',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Queues at the filling stations',
        body: 'Motorists are waiting an hour for what they could have had on demand last year. Tempers on the forecourts are described as frayed.',
      },
    ],
  },
  colour_crisis_three_day_week: {
    kind: 'colour',
    desk: 'labour',
    tone: 'bad',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Working by candlelight',
        body: 'Offices and shops are operating on shortened hours and whatever light they can arrange. Everyone has become an expert on the grid.',
      },
    ],
  },
  colour_crisis_pop_and_protest: {
    kind: 'colour',
    desk: 'politics',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The young have their own politics now',
        body: 'Music, dress and argument have all arranged themselves against whatever their parents thought. Older commentators find it alarming and profitable.',
      },
    ],
  },
  colour_crisis_pocket_calculator: {
    kind: 'colour',
    desk: 'science',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The pocket calculator reaches the office',
        body: 'Clerks who spent their careers with a slide rule have put it in a drawer. Schools are arguing about whether children should be allowed one.',
      },
    ],
  },
  colour_market_privatisation_fever: {
    kind: 'colour',
    desk: 'finance',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Everyone is a shareholder now',
        body: 'Share applications are being filled in by people who have never owned any. The advertisements are on television, which is new.',
      },
    ],
  },
  colour_market_the_city_at_night: {
    kind: 'colour',
    desk: 'finance',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The dealing rooms never close',
        body: 'Trading follows the sun from one financial centre to the next and back again. The people who do it are young and are not expected to last.',
      },
    ],
  },
  colour_market_shoulder_pads: {
    kind: 'colour',
    desk: 'home',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Money is fashionable again',
        body: 'Spending it in public has stopped being vulgar and started being admired. Those who remember the last time this happened are keeping quiet.',
      },
    ],
  },
  colour_market_satellite_dish: {
    kind: 'colour',
    desk: 'home',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Dishes appear on the walls',
        body: 'Households can now receive broadcasts nobody here licensed or approved. The authorities are still deciding how they feel about that.',
      },
    ],
  },
  colour_network_the_web_arrives: {
    kind: 'colour',
    desk: 'science',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The network reaches ordinary homes',
        body: 'A telephone line now carries the whole world’s notice board into the front room, slowly. Nobody can quite explain what it is for and everybody wants one.',
      },
    ],
  },
  colour_network_mobile_telephones: {
    kind: 'colour',
    desk: 'home',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Telephones in every pocket',
        body: 'People are taking calls in the street and nobody looks any more. Etiquette columnists are working overtime.',
      },
    ],
  },
  colour_network_call_centres: {
    kind: 'colour',
    desk: 'labour',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The country answers the telephone for a living',
        body: 'Large sheds full of headsets have opened where the works used to be. The pay is worse and the hours are better, or the other way round.',
      },
    ],
  },
  colour_network_millennium_nerves: {
    kind: 'colour',
    desk: 'science',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The engineers are worried about the calendar',
        body: 'A great deal of money is being spent on machines that may or may not object to the date. Whether it was necessary will never be settled.',
      },
    ],
  },
  colour_stream_everyone_a_broadcaster: {
    kind: 'colour',
    desk: 'politics',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Everyone is a broadcaster now',
        body: 'Anybody with a telephone can reach more people than this paper does. Some of them are careful about it.',
      },
    ],
  },
  colour_stream_the_paper_thins: {
    kind: 'colour',
    desk: 'politics',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The newspaper is thinner than it was',
        body: 'Advertising has gone elsewhere and the newsroom has gone with it. We mention it because nobody else will.',
      },
    ],
  },
  colour_stream_screens_everywhere: {
    kind: 'colour',
    desk: 'home',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'Screens in every room and every hand',
        body: 'The average household now owns more displays than chairs. Doctors have opinions about this and so does everybody else.',
      },
    ],
  },
  colour_stream_the_archive_opens: {
    kind: 'colour',
    desk: 'science',
    tone: 'neutral',
    prominence: 'brief',
    dispatches: [
      {
        headline: 'The whole century is searchable',
        body: 'Records that took a week in a basement now take a moment. Historians report that this has not made anyone agree about anything.',
      },
    ],
  },
}
