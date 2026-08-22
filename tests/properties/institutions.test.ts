/**
 * M6 §4.3 / §6.3 — politics as a game.
 *
 * The claims this milestone makes, as executable statements. Not "the code
 * runs" but "the design works": the corridor dot moves and moving it costs
 * something, the veto players are read off the economy so a crisis really is a
 * political opening, and extending the franchise really does rewrite the
 * rubric the player is scored against.
 */

import { describe, expect, it } from 'vitest'
import {
  applyAction,
  approvalIndex,
  corridorOffset,
  CORRIDOR_HALF_WIDTH,
  eliteCapture,
  effectiveBlocPower,
  enfranchisementIndex,
  franchiseOf,
  inCorridor,
  IMMIGRATION_LIMIT_MAX,
  init,
  REFORM_WINDOW_AT,
  reformWindowOpen,
  step,
  TICK_ORDER,
  vetoMultiplier,
  type InstitutionId,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

/** a century under a named political strategy */
function century(
  seed: string,
  opts: { ticks?: number; reform?: InstitutionId | null; fundCapacity?: boolean } = {},
): TrueState[] {
  const { ticks = 320, reform = null, fundCapacity = false } = opts
  let s = init(standardCountry, seed)
  const out: TrueState[] = []
  for (let t = 0; t < ticks; t++) {
    if (s.politics.inPower) {
      if (fundCapacity && t % 8 === 0) {
        for (const target of ['tax', 'statistical', 'administrative', 'education'] as const) {
          try {
            s = applyAction(s, { kind: 'investCapacity', target, amount: 2 })
          } catch {
            /* unaffordable this quarter — the ministry simply waits */
          }
        }
      }
      if (reform) {
        try {
          s = applyAction(s, { kind: 'reform', institution: reform, direction: 1 })
        } catch {
          /* not enough political capital, or already at the rail */
        }
      }
    }
    s = step(s)
    out.push(s)
  }
  return out
}

const last = <T>(xs: T[]): T => xs[xs.length - 1]

describe('societal power is alive (§6.3)', () => {
  it('the dot MOVES — the whole point of the milestone', () => {
    // before M6 y came from the country's fixed setup, so the corridor plot
    // drew a dot that never left its starting point
    const run = century('inst-move')
    const y = run.map((s) => s.institutions.societalPower)
    expect(Math.max(...y) - Math.min(...y)).toBeGreaterThan(0.03)
  })

  it('repression pushes society down and the state up — toward despotism', () => {
    const calm = century('inst-d', { ticks: 160 })
    const boot = century('inst-d', { ticks: 160, reform: 'repression' })
    expect(last(boot).institutions.societalPower).toBeLessThan(
      last(calm).institutions.societalPower,
    )
    expect(last(boot).institutions.statePower).toBeGreaterThan(last(calm).institutions.statePower)
    expect(corridorOffset(last(boot))).toBeGreaterThan(corridorOffset(last(calm)))
  })

  it('the liberties raise it — press, courts and labour rights all bite', () => {
    const base = last(century('inst-l', { ticks: 160 })).institutions.societalPower
    for (const id of ['press', 'courts', 'labor_rights'] as const) {
      const reformed = last(century('inst-l', { ticks: 160, reform: id })).institutions.societalPower
      expect(reformed, `${id} should raise societal power`).toBeGreaterThan(base)
    }
  })

  it('inequality erodes it: elite capture hollows out formal rights', () => {
    // same country, same institutions — only the income distribution differs
    const s = last(century('inst-g', { ticks: 40 }))
    const equal = { ...s, cohorts: s.cohorts.map((c) => ({ ...c })) }
    // concentrate income in the smallest cohort to drive the Gini up
    const rich = {
      ...s,
      cohorts: s.cohorts.map((c) =>
        c.id === 'business_owners'
          ? { ...c, profitIncome: c.profitIncome * 40 }
          : { ...c, wageIncome: c.wageIncome * 0.5 },
      ),
    }
    const after = (x: TrueState) => step(x).institutions.societalPower
    expect(after(rich)).toBeLessThan(after(equal))
  })
})

describe('leaving the corridor means something', () => {
  it('a repressive century spends far less of its life inside the band', () => {
    const calm = century('inst-c', { ticks: 240, fundCapacity: true })
    const boot = century('inst-c', { ticks: 240, fundCapacity: true, reform: 'repression' })
    const share = (r: TrueState[]) => r.filter(inCorridor).length / r.length
    expect(share(boot)).toBeLessThan(share(calm))
  })

  it('the despotic corner generates pressure the boot itself cannot reach', () => {
    // repression damps grievance multiplicatively but corridor strain is added
    // on top of it — that asymmetry is what stops the boot being dominant
    const boot = century('inst-p', { ticks: 240, reform: 'repression' })
    const strained = boot.filter((s) => corridorOffset(s) > CORRIDOR_HALF_WIDTH)
    expect(strained.length).toBeGreaterThan(0)
    expect(Math.max(...boot.map((s) => s.institutions.unrest))).toBeGreaterThan(
      Math.max(...century('inst-p', { ticks: 240 }).map((s) => s.institutions.unrest)),
    )
  })

  it('unchecked incumbents slow catch-up — the extractive ceiling (§4.3)', () => {
    const boot = century('inst-x', { ticks: 320, fundCapacity: true, reform: 'repression' })
    const open = century('inst-x', { ticks: 320, fundCapacity: true, reform: 'suffrage' })
    const tfp = (s: TrueState) =>
      Object.values(s.tech.attained).reduce((a, b) => a + b, 0) / 5
    // capital widening is untouched, so this is a gap in ATTAINED technology,
    // not a cap on output — forced industrialization still works
    expect(eliteCapture(last(boot))).toBeGreaterThan(eliteCapture(last(open)))
    expect(tfp(last(boot))).toBeLessThan(tfp(last(open)))
  })
})

describe('the two ways out that are not the ballot box', () => {
  const politicsStep = TICK_ORDER.find((x) => x.name === 'politics')!
  /** an rng whose uniform draw is whatever we say it is */
  const rollOf = (u: number) =>
    ({ next: () => u, range: (a: number, b: number) => (a + b) / 2, normal: () => 0 }) as never

  it('the street ends a government the pressure got away from', () => {
    const s = last(century('inst-rv', { ticks: 24 }))
    const seething: TrueState = {
      ...s,
      institutions: { ...s.institutions, unrest: 1 },
    }
    const after = politicsStep.run(seething, rollOf(0))
    expect(after.politics.inPower).toBe(false)
    expect(after.politics.deposedBy).toBe('revolt')
    expect(after.politics.deposedAt).toBe(s.meta.tick)
  })

  it('the palace ends one the elites gave up on, if society cannot check them', () => {
    const s = last(century('inst-cp', { ticks: 24 }))
    const hostile: TrueState = {
      ...s,
      institutions: {
        ...s.institutions,
        unrest: 0, // no revolt hazard at all: isolate the coup
        societalPower: 0, // …and nobody to stop them
        blocs: {
          ...s.institutions.blocs,
          landowners: { power: 1, favor: -1 },
          industrialists: { power: 1, favor: -1 },
          financiers: { power: 1, favor: -1 },
        },
      },
    }
    const after = politicsStep.run(hostile, rollOf(0))
    expect(after.politics.inPower).toBe(false)
    expect(after.politics.deposedBy).toBe('coup')
  })

  it('…but an organized society protects you from the palace', () => {
    const s = last(century('inst-cp2', { ticks: 24 }))
    const guarded: TrueState = {
      ...s,
      institutions: {
        ...s.institutions,
        unrest: 0,
        societalPower: 1, // the corridor's whole promise, as a test
        blocs: {
          ...s.institutions.blocs,
          landowners: { power: 1, favor: -1 },
          industrialists: { power: 1, favor: -1 },
          financiers: { power: 1, favor: -1 },
        },
      },
    }
    expect(politicsStep.run(guarded, rollOf(0)).politics.inPower).toBe(true)
  })
})

describe('God mode keeps a test run alive', () => {
  const politicsStep = TICK_ORDER.find((x) => x.name === 'politics')!
  const rollOf = (u: number) =>
    ({ next: () => u, range: (a: number, b: number) => (a + b) / 2, normal: () => 0 }) as never

  it('blocks revolt and coup deposition', () => {
    const base = init(standardCountry, 'inst-god-crisis', 'god')
    const seething: TrueState = {
      ...base,
      institutions: { ...base.institutions, unrest: 1 },
    }
    const afterRevolt = politicsStep.run(seething, rollOf(0))
    expect(afterRevolt.politics.inPower).toBe(true)
    expect(afterRevolt.politics.deposedAt).toBeNull()

    const hostile: TrueState = {
      ...base,
      institutions: {
        ...base.institutions,
        unrest: 0,
        societalPower: 0,
        blocs: {
          ...base.institutions.blocs,
          landowners: { power: 1, favor: -1 },
          industrialists: { power: 1, favor: -1 },
          financiers: { power: 1, favor: -1 },
        },
      },
    }
    const afterCoup = politicsStep.run(hostile, rollOf(0))
    expect(afterCoup.politics.inPower).toBe(true)
    expect(afterCoup.politics.deposedAt).toBeNull()
  })

  it('records a lost election but starts another term instead of deposing the player', () => {
    const base = init(standardCountry, 'inst-god-election', 'god')
    const rejected: TrueState = {
      ...base,
      cohorts: base.cohorts.map((cohort) => ({ ...cohort, approval: 0 })),
      institutions: {
        ...base.institutions,
        unrest: 0,
        societalPower: 1,
      },
      politics: { ...base.politics, quartersToElection: 1 },
    }
    const after = politicsStep.run(rejected, rollOf(1))
    expect(after.politics.lastElection?.won).toBe(false)
    expect(after.politics.electionsWon).toBe(0)
    expect(after.politics.inPower).toBe(true)
    expect(after.politics.quartersToElection).toBe(16)
    expect(after.politics.deposedAt).toBeNull()
    expect(after.stats.news.at(-1)?.text).toContain('GOD MODE')
  })
})

describe('the veto players gate the levers (§4.3)', () => {
  const s0 = last(century('inst-v', { ticks: 24 }))

  it('a lever the room objects to costs more than one it does not', () => {
    const cost = (state: TrueState, path: 'taxRates.corporate' | 'taxRates.tariff', v: number) => {
      const after = applyAction(state, { kind: 'setDial', path, value: v })
      return state.politics.politicalCapital - after.politics.politicalCapital
    }
    const rich = { ...s0, politics: { ...s0.politics, politicalCapital: 1e9 } }
    // industry and finance both mind a corporate tax rise; a tariff rise is
    // something industry actively WANTS, so the room barely charges for it
    expect(cost(rich, 'taxRates.corporate', 0.6)).toBeGreaterThan(cost(rich, 'taxRates.tariff', 0.6))
  })

  it('an organized society disciplines the veto — the corridor’s central claim', () => {
    const weak = { ...s0, institutions: { ...s0.institutions, societalPower: 0.05 } }
    const strong = { ...s0, institutions: { ...s0.institutions, societalPower: 0.7 } }
    expect(effectiveBlocPower(strong, 'landowners')).toBeLessThan(
      effectiveBlocPower(weak, 'landowners'),
    )
    const objection = { landowners: 1, industrialists: 0, financiers: 0, unions: 0 }
    expect(vetoMultiplier(strong, objection)).toBeLessThan(vetoMultiplier(weak, objection))
  })

  it('bloc power is READ OFF the economy, so a crisis is a political opening', () => {
    // the money interest's clout follows the credit stock and the state's debt;
    // wipe those out and the levers it was guarding get cheaper. Nothing about
    // this is scripted — it falls out of where power came from.
    const flush = {
      ...s0,
      finance: { ...s0.finance, creditToGdp: 1.1 },
      ledger: { ...s0.ledger, debtToGdp: 0.9 },
    }
    const busted = {
      ...s0,
      finance: { ...s0.finance, creditToGdp: 0.1 },
      ledger: { ...s0.ledger, debtToGdp: 0.05 },
    }
    const powerAfter = (x: TrueState) => step(x).institutions.blocs.financiers.power
    expect(powerAfter(busted)).toBeLessThan(powerAfter(flush))
  })

  it('defying a bloc costs its goodwill', () => {
    const rich = { ...s0, politics: { ...s0.politics, politicalCapital: 1e9 } }
    const after = applyAction(rich, { kind: 'setDial', path: 'taxRates.corporate', value: 0.7 })
    expect(after.institutions.blocs.industrialists.favor).toBeLessThan(
      rich.institutions.blocs.industrialists.favor,
    )
  })

  it('an open immigration ceiling pleases employers and costs union goodwill', () => {
    const rich = { ...s0, politics: { ...s0.politics, politicalCapital: 1e9 } }
    const after = applyAction(rich, {
      kind: 'setDial',
      path: 'immigrationLimit',
      value: IMMIGRATION_LIMIT_MAX,
    })
    expect(after.institutions.blocs.industrialists.favor).toBeGreaterThan(
      rich.institutions.blocs.industrialists.favor,
    )
    expect(after.institutions.blocs.unions.favor).toBeLessThan(
      rich.institutions.blocs.unions.favor,
    )
    expect(() =>
      applyAction(rich, {
        kind: 'setDial',
        path: 'immigrationLimit',
        value: IMMIGRATION_LIMIT_MAX + 0.001,
      }),
    ).toThrow()
  })
})

describe('realized immigration reaches the political machine', () => {
  const institutionsStep = TICK_ORDER.find((x) => x.name === 'institutions')!

  it('sustained high arrivals shift bloc favour and add public-order pressure', () => {
    const base = last(century('inst-migration', { ticks: 24 }))
    const population = base.demography.pyramid.reduce((sum, people) => sum + people, 0)
    const withMigration = (annualRate: number): TrueState => ({
      ...base,
      demography: {
        ...base.demography,
        netMigrationQ: (annualRate * population) / 4,
      },
    })
    const quiet = institutionsStep.run(withMigration(0), undefined as never)
    const high = institutionsStep.run(withMigration(0.02), undefined as never)

    expect(high.institutions.blocs.industrialists.favor).toBeGreaterThan(
      quiet.institutions.blocs.industrialists.favor,
    )
    expect(high.institutions.blocs.unions.favor).toBeLessThan(
      quiet.institutions.blocs.unions.favor,
    )
    expect(high.institutions.unrest).toBeGreaterThan(quiet.institutions.unrest)
  })
})

describe('reform windows (§4.3: never let a good crisis go to waste)', () => {
  it('pressure past the line opens the window and discounts reform', () => {
    const calm = { ...last(century('inst-w', { ticks: 24 })) }
    const quiet = {
      ...calm,
      institutions: { ...calm.institutions, unrest: REFORM_WINDOW_AT - 0.1 },
      politics: { ...calm.politics, politicalCapital: 1e9 },
    }
    const ferment = {
      ...calm,
      institutions: { ...calm.institutions, unrest: REFORM_WINDOW_AT + 0.1 },
      politics: { ...calm.politics, politicalCapital: 1e9 },
    }
    expect(reformWindowOpen(quiet)).toBe(false)
    expect(reformWindowOpen(ferment)).toBe(true)
    const price = (x: TrueState) => {
      const after = applyAction(x, { kind: 'reform', institution: 'suffrage', direction: 1 })
      return x.politics.politicalCapital - after.politics.politicalCapital
    }
    expect(price(ferment)).toBeLessThan(price(quiet))
  })
})

describe('the franchise edits your own objective function (§4.3)', () => {
  it('suffrage closes the distance from the 1946 settlement to one-person-one-vote', () => {
    expect(franchiseOf(0.6, 0)).toBeCloseTo(0.6)
    expect(franchiseOf(0.6, 1)).toBeCloseTo(1)
    expect(franchiseOf(0.6, 0.5)).toBeCloseTo(0.8)
  })

  it('extending it changes WHOSE approval is being scored', () => {
    const s = last(century('inst-f', { ticks: 24 }))
    // give the currently-excluded a different opinion from the enfranchised
    const split = {
      ...s,
      cohorts: s.cohorts.map((c) => ({
        ...c,
        approval: c.enfranchisement < 0.9 ? 0.1 : 0.9,
      })),
    }
    const before = approvalIndex(split)
    const widened = step({
      ...split,
      institutions: { ...split.institutions, stocks: { ...split.institutions.stocks, suffrage: 1 } },
    })
    expect(enfranchisementIndex(widened)).toBeGreaterThan(enfranchisementIndex(split))
    // the newly-enfranchised are the unhappy ones, so the score moves against
    // the government — extending the vote is a commitment, not a free win
    expect(approvalIndex(widened)).toBeLessThan(before)
  })
})

describe('the election is a scene (§3.1)', () => {
  /** wind a run forward to the quarter the campaign opens */
  function toCampaign(seed: string): TrueState {
    let s = init(standardCountry, seed)
    while (s.politics.quartersToElection > 2) s = step(s)
    return { ...s, politics: { ...s.politics, politicalCapital: 1e9 } }
  }

  it('a platform can only be committed inside the campaign window', () => {
    const early = init(standardCountry, 'inst-e')
    expect(() => applyAction(early, { kind: 'campaign', platform: 'record' })).toThrow()
    const open = toCampaign('inst-e')
    expect(() => applyAction(open, { kind: 'campaign', platform: 'record' })).not.toThrow()
  })

  it('only one platform per election', () => {
    const s = applyAction(toCampaign('inst-e2'), { kind: 'campaign', platform: 'record' })
    expect(() => applyAction(s, { kind: 'campaign', platform: 'largesse' })).toThrow()
  })

  it('each platform bills something different, and the bill is real', () => {
    const base = toCampaign('inst-e3')

    // largesse: the transfers dial actually rises, and stays risen
    const largesse = applyAction(base, { kind: 'campaign', platform: 'largesse' })
    expect(largesse.gov.dials.spending.transfers).toBeGreaterThan(
      base.gov.dials.spending.transfers,
    )
    // …and the giveaway re-stamps the rule that owns it, so the policy record
    // files a promise the same way it files an order (schema v22)
    expect(largesse.gov.spendingRules.transfers.votedAt).toBe(largesse.meta.tick)
    expect(largesse.gov.spendingRules.transfers.votedAt).not.toBe(
      base.gov.spendingRules.transfers.votedAt,
    )

    // coalition: a claim on you for a full term
    const coalition = applyAction(base, {
      kind: 'campaign',
      platform: 'coalition',
      bloc: 'landowners',
    })
    expect(coalition.institutions.pledge?.bloc).toBe('landowners')
    expect(coalition.institutions.blocs.landowners.favor).toBeGreaterThan(
      base.institutions.blocs.landowners.favor,
    )

    // suppression: repression rises now, the corridor pays later
    const boot = applyAction(base, { kind: 'campaign', platform: 'suppression' })
    expect(boot.institutions.stocks.repression).toBeGreaterThan(
      base.institutions.stocks.repression,
    )

    // franchise: the rubric itself moves
    const wider = applyAction(base, { kind: 'campaign', platform: 'franchise' })
    expect(wider.institutions.stocks.suffrage).toBeGreaterThan(base.institutions.stocks.suffrage)
  })

  it('a pledged bloc prices its objections double', () => {
    const base = toCampaign('inst-e4')
    const pledged = applyAction(base, {
      kind: 'campaign',
      platform: 'coalition',
      bloc: 'industrialists',
    })
    const cost = (x: TrueState) => {
      const after = applyAction(x, { kind: 'setDial', path: 'taxRates.corporate', value: 0.65 })
      return x.politics.politicalCapital - after.politics.politicalCapital
    }
    // compare like with like: the pledge is the only difference that matters
    const unpledged = { ...pledged, institutions: { ...pledged.institutions, pledge: null } }
    expect(cost(pledged)).toBeGreaterThan(cost(unpledged))
  })

  it('suppression is recorded as taken, not won — and the card says so', () => {
    let s = applyAction(toCampaign('inst-e5'), { kind: 'campaign', platform: 'suppression' })
    // repression lowers the bar far enough that the result is not in doubt
    s = { ...s, institutions: { ...s.institutions, stocks: { ...s.institutions.stocks, repression: 0.9 } } }
    // stop the moment the votes are counted: a WON election resets the clock to
    // a full term, so looping on quartersToElection runs straight into the
    // NEXT election (fought with no platform) and overwrites the result
    while (s.politics.lastElection === null && s.politics.inPower) s = step(s)
    expect(s.politics.lastElection?.won).toBe(true)
    expect(s.politics.lastElection?.suppressed).toBe(true)
    expect(s.politics.electionsSuppressed).toBe(1)
  })
})

describe('the published desk (§3.1 contract)', () => {
  it('the campaign scene only exists inside the window', () => {
    const early = observe(init(standardCountry, 'inst-o'))
    expect(early.campaign).toBeNull()
    let s = init(standardCountry, 'inst-o')
    while (s.politics.quartersToElection > 2) s = step(s)
    expect(observe(s).campaign).not.toBeNull()
  })

  it('the corridor publishes a trail that survives a reload', () => {
    let s = init(standardCountry, 'inst-o2')
    for (let t = 0; t < 24; t++) s = step(s)
    const pub = observe(s)
    expect(pub.corridor.trail.length).toBe(24)
    expect(pub.corridor.inCorridor).toBe(Math.abs(pub.corridor.offset) <= pub.corridor.halfWidth)
  })

  it('the reform price the player reads is the price they are charged', () => {
    let s = init(standardCountry, 'inst-o3')
    for (let t = 0; t < 40; t++) s = step(s)
    const quoted = observe(s).reformCost.courts.up!
    const rich = { ...s, politics: { ...s.politics, politicalCapital: 1e9 } }
    const after = applyAction(rich, { kind: 'reform', institution: 'courts', direction: 1 })
    expect(rich.politics.politicalCapital - after.politics.politicalCapital).toBeCloseTo(quoted, 6)
  })

  it('the third axis exists and grades the path, not the endpoint', () => {
    let s = init(standardCountry, 'inst-o4')
    for (let t = 0; t < 40; t++) s = step(s)
    // end the run so the card exists
    s = { ...s, politics: { ...s.politics, inPower: false, deposedAt: s.meta.tick, deposedBy: 'poll' } }
    const card = observe(s).reportCard!
    expect(card.positionGrade).toBeDefined()
    expect(card.corridorShare).toBeGreaterThanOrEqual(0)
    expect(card.corridorShare).toBeLessThanOrEqual(1)
  })
})
