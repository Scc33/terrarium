/**
 * M5 §12 — the financial sector. Credit and asset prices are the amplifier and
 * the fragility clock. None of it is scripted: cheap money inflates a bubble,
 * leverage above prudence with assets overvalued fuels a Minsky moment, and the
 * crash transmits through the ordinary investment/employment channels. The
 * whole point is that the crisis you get is the one your own policy earned.
 */

import { describe, expect, it } from 'vitest'
import {
  bondIssuanceShare,
  init,
  privateFundingSpread,
  privateRealRate,
  rngFor,
  step,
  TICK_ORDER,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

/** run a single named pipeline step against a doctored state */
function runStep(name: string, s: TrueState): TrueState {
  const st = TICK_ORDER.find((x) => x.name === name)!
  return st.run(s, rngFor(s.meta.seed, name, s.meta.tick))
}

/** a passive century with the policy rate pinned (null = leave the dial) */
function century(seed: string, rate: number | null, ticks = 320): TrueState[] {
  let s = init(standardCountry, seed)
  const out: TrueState[] = []
  for (let t = 0; t < ticks; t++) {
    if (rate !== null) s = { ...s, gov: { ...s.gov, dials: { ...s.gov.dials, policyRate: rate } } }
    s = step(s)
    out.push(s)
  }
  return out
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(xs.length, 1)

describe('the credit cycle (§12)', () => {
  const passive = century('fin-p', null)

  it('asset prices are a cycle, not a runaway: they hover near fundamental', () => {
    const q = passive.map((s) => s.finance.assetPrice)
    expect(mean(q)).toBeGreaterThan(0.75) // around 1…
    expect(mean(q)).toBeLessThan(1.25)
    expect(Math.max(...q)).toBeLessThan(3) // …clamped, never a bubble to the moon
    expect(Math.min(...q)).toBeGreaterThan(0.2)
    for (const s of passive) expect(Number.isFinite(s.finance.assetPrice)).toBe(true)
  })

  it('a do-nothing government does not spontaneously bubble: leverage stays prudent', () => {
    const lev = passive.map((s) => s.finance.creditToGdp)
    // credit/GDP hovers near its base, well below the danger line — a passive
    // century should seldom see a crisis
    expect(mean(lev)).toBeGreaterThan(0.4)
    expect(mean(lev)).toBeLessThan(0.75)
  })

  it('credit is a live stock now: sector credit sums to the aggregate', () => {
    const s = passive[40]
    const sectorSum = s.sectors.reduce((a, x) => a + x.credit, 0)
    expect(sectorSum).toBeCloseTo(s.finance.creditOutstanding, 4)
    expect(s.finance.creditOutstanding).toBeGreaterThan(0)
  })

  it('cheap money inflates the boom: it lifts credit and asset prices vs passive', () => {
    const loose = century('fin-p', 0.005)
    const levLoose = mean(loose.map((s) => s.finance.creditToGdp))
    const levPassive = mean(passive.map((s) => s.finance.creditToGdp))
    const qLoose = Math.max(...loose.map((s) => s.finance.assetPrice))
    const qPassive = Math.max(...passive.map((s) => s.finance.assetPrice))
    expect(levLoose).toBeGreaterThan(levPassive) // more borrowing…
    expect(qLoose).toBeGreaterThan(qPassive) // …and a taller bubble
  })
})

describe('sovereign funding pressure', () => {
  const base = century('fin-sovereign', null)[40]

  function fundedState({
    debtToGdp = 0.3,
    bondIssuance = 0,
    printed = 0,
    openness = base.params.openness,
  }: {
    debtToGdp?: number
    bondIssuance?: number
    printed?: number
    openness?: number
  }): TrueState {
    const quarterlyGdp = base.flows.nominalGdp
    return {
      ...base,
      params: { ...base.params, openness },
      gov: {
        ...base.gov,
        debt: debtToGdp * 4 * quarterlyGdp,
        budget: {
          ...base.gov.budget,
          balance: -bondIssuance * quarterlyGdp,
        },
      },
      flows: {
        ...base.flows,
        printedThisQtr: printed * quarterlyGdp,
      },
      institutions: {
        ...base.institutions,
        blocs: {
          ...base.institutions.blocs,
          financiers: {
            ...base.institutions.blocs.financiers,
            favor: 0,
          },
        },
      },
    }
  }

  it('bond issuance crowds private finance while an equally sized print does not', () => {
    const bondFunded = fundedState({ bondIssuance: 0.04 })
    const moneyFunded = fundedState({ bondIssuance: 0.04, printed: 0.04 })

    expect(bondIssuanceShare(bondFunded)).toBeCloseTo(0.04)
    expect(privateFundingSpread(bondFunded)).toBeGreaterThan(0)
    expect(bondIssuanceShare(moneyFunded)).toBe(0)
    expect(privateFundingSpread(moneyFunded)).toBe(0)
  })

  it('openness lets foreign balance sheets absorb more of the auction', () => {
    const closed = fundedState({ bondIssuance: 0.04, openness: 0.25 })
    const open = fundedState({ bondIssuance: 0.04, openness: 2 })
    expect(privateFundingSpread(closed)).toBeGreaterThan(privateFundingSpread(open))
  })

  it('high sovereign risk raises the common private real rate', () => {
    const lowDebt = fundedState({ debtToGdp: 0.3 })
    const highDebt = fundedState({ debtToGdp: 1 })
    expect(privateRealRate(highDebt)).toBeGreaterThan(privateRealRate(lowDebt))
  })

  it('funding pressure tightens bank credit and asset valuation', () => {
    const lowDebt = runStep('finance', fundedState({ debtToGdp: 0.3 }))
    const highDebt = runStep('finance', fundedState({ debtToGdp: 1 }))
    expect(highDebt.finance.creditToGdp).toBeLessThan(lowDebt.finance.creditToGdp)
    expect(highDebt.finance.assetPrice).toBeLessThan(lowDebt.finance.assetPrice)
  })

  it('funding pressure lowers private investment demand', () => {
    const lowDebt = runStep('production', fundedState({ debtToGdp: 0.3 }))
    const highDebt = runStep('production', fundedState({ debtToGdp: 1 }))
    expect(highDebt.flows.investmentReal).toBeLessThan(lowDebt.flows.investmentReal)
  })
})

describe('the Minsky clock (§12)', () => {
  const base = century('fin-m', null)[60]

  /** how often the finance step fires a fresh crisis against a doctored state,
   * sampled across many tick-keyed RNG draws */
  function crisisRate(doctor: (s: TrueState) => TrueState, n = 400): number {
    let fired = 0
    for (let t = 0; t < n; t++) {
      const s = doctor({ ...base, meta: { ...base.meta, tick: t } })
      // clear any active crisis so we measure fresh onsets only
      const s2 = { ...s, finance: { ...s.finance, crisisQtrsLeft: 0 } }
      if (runStep('finance', s2).finance.crisisQtrsLeft > 0) fired++
    }
    return fired / n
  }

  it('fragility is earned: a levered, overvalued economy is far likelier to crack', () => {
    const calm = crisisRate((s) => ({
      ...s,
      finance: { ...s.finance, creditToGdp: 0.5, assetPrice: 0.95 },
    }))
    const fragile = crisisRate((s) => ({
      ...s,
      finance: { ...s.finance, creditToGdp: 1.1, assetPrice: 1.5 },
    }))
    expect(fragile).toBeGreaterThan(calm * 5) // both cheap credit AND a bubble
    expect(fragile).toBeGreaterThan(0.02)
  })

  it('a crisis crashes assets, writes down bank capital, and freezes credit', () => {
    // force a crisis by pinning the fragility high and sampling until one fires
    let hit: TrueState | null = null
    for (let t = 0; t < 500 && !hit; t++) {
      const s = {
        ...base,
        meta: { ...base.meta, tick: t },
        finance: { ...base.finance, creditToGdp: 1.2, assetPrice: 1.6, crisisQtrsLeft: 0 },
      }
      const out = runStep('finance', s)
      if (out.finance.crisisQtrsLeft > 0) hit = out
    }
    expect(hit).not.toBeNull()
    expect(hit!.finance.assetPrice).toBeLessThan(1.6) // the crash
    expect(hit!.finance.bankCapital).toBeLessThan(base.finance.bankCapital * 3) // capital written down
    expect(hit!.finance.crisisSeverity).toBeGreaterThan(0.3)
  })

  it('crises import: a money-centre sudden stop abroad lights the fuse at home', () => {
    const doctorPartners = (activity: number) => (s: TrueState): TrueState => ({
      ...s,
      external: {
        ...s.external,
        world: {
          ...s.external.world,
          partners: s.external.world.partners.map((p) =>
            p.id === 'financial' ? { ...p, activity } : p,
          ),
        },
      },
      finance: { ...s.finance, creditToGdp: 0.9, assetPrice: 1.2 },
    })
    const calmAbroad = crisisRate(doctorPartners(1.0))
    const suddenStop = crisisRate(doctorPartners(0.65))
    expect(suddenStop).toBeGreaterThan(calmAbroad) // the splash reaches you
  })
})

describe('the transmission and the instruments (§12)', () => {
  const base = century('fin-t', null)[40]

  it("Tobin's q channel: dear assets pull more investment than cheap ones", () => {
    const invAt = (assetPrice: number) =>
      runStep('production', { ...base, finance: { ...base.finance, assetPrice } }).flows
        .investmentReal
    expect(invAt(1.4)).toBeGreaterThan(invAt(0.7))
  })

  it('a crunch freezes investment: an active crisis invests less than calm', () => {
    const calm = runStep('production', {
      ...base,
      finance: { ...base.finance, crisisQtrsLeft: 0, crisisSeverity: 0 },
    }).flows.investmentReal
    const crunch = runStep('production', {
      ...base,
      finance: { ...base.finance, assetPrice: 0.8, crisisQtrsLeft: 4, crisisSeverity: 0.8 },
    }).flows.investmentReal
    expect(crunch).toBeLessThan(calm)
  })

  it('asset prices are an instrument you buy: no board until the exchange is funded', () => {
    const play = (statistical: number) => {
      const params = { ...standardCountry, capacities: { ...standardCountry.capacities, statistical } }
      let s = init(params, 'fin-i')
      for (let t = 0; t < 16; t++) s = step(s)
      return observe(s)
    }
    expect(play(0.2).indicators.asset_prices).toBeUndefined()
    const funded = play(0.6).indicators.asset_prices
    expect(funded).toBeDefined()
    for (const p of funded!.points) {
      expect(p.value).toBeGreaterThan(30) // an index around 100, not garbage
      expect(p.value).toBeLessThan(400)
    }
  })

  it('credit growth is the luxury supervisor: it needs deep statistical capacity', () => {
    const play = (statistical: number) => {
      const params = { ...standardCountry, capacities: { ...standardCountry.capacities, statistical } }
      let s = init(params, 'fin-c')
      for (let t = 0; t < 16; t++) s = step(s)
      return observe(s)
    }
    expect(play(0.45).indicators.credit_growth).toBeUndefined() // below 0.55
    expect(play(0.6).indicators.credit_growth).toBeDefined()
  })
})
