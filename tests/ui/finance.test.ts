/**
 * The finance overlay's reading arithmetic (`ui/src/finance.ts`) and the
 * phase geometry under it (`ui/src/plot.ts`).
 *
 * The subject makes a specific kind of wrong answer dangerous. Everything
 * this module returns decides what the overlay tells the player about the
 * risk of losing their banking system, and the two most plausible bugs both
 * produce a screen that looks entirely calm:
 *
 *   • an unfunded survey read as a zero, so "we have not measured this"
 *     renders identically to "there is no danger here";
 *   • a fragility reading that fires on ONE excess, which would light the
 *     warning through every ordinary asset boom and thereby become the
 *     warning that never turns off.
 *
 * Both are pinned below, and the second is pinned against the engine's own
 * rails rather than against numbers copied into the test.
 */

import { describe, expect, it } from 'vitest'
import { CRISIS_ASSET_SAFE, CRISIS_LEVERAGE_SAFE, type NewsItem } from '@terrarium/engine'
import type { IndicatorSeries, PublishedState } from '@terrarium/observation'
import {
  FINANCE_INDICATORS,
  FLOOR_MARGIN,
  LEVERAGE_RAIL,
  STANDING_COPY,
  VALUATION_RAIL,
  bubbleTicks,
  crisisEpisodes,
  fragility,
  fragilityTrail,
  readFinance,
  readSeries,
  standingAt,
  stanceLines,
} from '../../packages/ui/src/finance'
import { phasePlot } from '../../packages/ui/src/plot'
import { eachQuarter } from './harness'

function seriesOf(id: string, values: Array<{ forQtr: number; value: number }>): IndicatorSeries {
  return {
    id,
    label: id,
    unit: '%',
    points: values.map((v) => ({
      forQtr: v.forQtr,
      publishedAt: v.forQtr + 1,
      value: v.value,
      revision: 0,
      errorBand: 1,
    })),
  } as IndicatorSeries
}

/** A wire item with everything the newspaper needs and nothing this module
 * reads. `crisisEpisodes` matches on `kind` alone (that is the whole point of
 * it), so the desk, the masthead and the copy are filler here — deliberately
 * WRONG filler, in fact, so that a reader of this file cannot mistake these
 * for real dispatches out of the catalogue. */
const wireItem = (tick: number, kind: NewsItem['kind'], text = `${kind} at ${tick}`): NewsItem => ({
  tick,
  event: 'banking_crisis',
  kind,
  desk: 'finance',
  tone: 'neutral',
  prominence: 'column',
  outlet: 'TEST WIRE',
  text,
  body: '',
})

const news = (items: Array<[number, NewsItem['kind']]>): NewsItem[] =>
  items.map(([tick, kind]) => wireItem(tick, kind))

function pubWith(over: Partial<PublishedState>): PublishedState {
  return {
    tick: 40,
    indicators: {},
    news: [],
    policy: [],
    dials: { capitalRequirement: 0.06 },
    ...over,
  } as unknown as PublishedState
}

describe('the fragility rails', () => {
  it('takes both rails from the engine, in published units', () => {
    // Copying 75 and 110 into the UI would let a retune of the hazard move the
    // engine's danger zone while the overlay kept shading the old one.
    expect(LEVERAGE_RAIL).toBe(CRISIS_LEVERAGE_SAFE * 100)
    expect(VALUATION_RAIL).toBe(CRISIS_ASSET_SAFE * 100)
  })

  it('is zero unless BOTH excesses are present — the product, not the sum', () => {
    const at = (x: number, y: number) => fragility({ tick: 0, x, y })
    expect(at(LEVERAGE_RAIL + 20, VALUATION_RAIL - 5)).toBe(0)
    expect(at(LEVERAGE_RAIL - 5, VALUATION_RAIL + 20)).toBe(0)
    expect(at(LEVERAGE_RAIL + 20, VALUATION_RAIL + 20)).toBeGreaterThan(0)
    // and it climbs with both, so the overlay can honestly say "the risk
    // climbs with the product" rather than with a threshold crossing
    expect(at(LEVERAGE_RAIL + 40, VALUATION_RAIL + 20)).toBeGreaterThan(
      at(LEVERAGE_RAIL + 20, VALUATION_RAIL + 20),
    )
  })

  it('names a corner for every combination, and only the shaded one is fragile', () => {
    const p = (x: number, y: number) => ({ tick: 0, x, y })
    expect(standingAt(p(50, 100), false)).toBe('calm')
    expect(standingAt(p(50, VALUATION_RAIL + 10), false)).toBe('rich')
    expect(standingAt(p(LEVERAGE_RAIL + 10, 100), false)).toBe('levered')
    expect(standingAt(p(LEVERAGE_RAIL + 10, VALUATION_RAIL + 10), false)).toBe('fragile')
    // a crisis outranks any position: the banks are already impaired
    expect(standingAt(p(50, 100), true)).toBe('crisis')
    // unmeasured is not calm — the distinction the whole module protects
    expect(standingAt(null, false)).toBeNull()
    for (const key of Object.keys(STANDING_COPY)) {
      expect(STANDING_COPY[key as keyof typeof STANDING_COPY].note.length).toBeGreaterThan(20)
    }
  })
})

describe('reading the wire', () => {
  it('pairs each crash with its recapitalization, and leaves an open one open', () => {
    const episodes = crisisEpisodes(
      news([
        [10, 'banking_crisis'],
        [14, 'banking_recovery'],
        [30, 'banking_crisis'],
      ]),
    )
    expect(episodes).toEqual([
      { from: 10, to: 14 },
      { from: 30, to: null },
    ])
  })

  it('ignores every other kind of news, however it is worded', () => {
    // The previous implementation matched prose. A partner's sudden stop and
    // a drought both mention crisis in their copy, and one of them is not a
    // banking crisis.
    const items: NewsItem[] = [
      wireItem(5, 'partner_crisis', 'Crisis abroad: a banking crisis grips the region.'),
      wireItem(6, 'fuel_shock', 'Crisis abroad: world fuel markets are in tumult.'),
      wireItem(7, 'rumor', 'The papers speak of a sudden stop.'),
    ]
    expect(crisisEpisodes(items)).toEqual([])
  })

  it('sorts an out-of-order wire before pairing', () => {
    expect(crisisEpisodes(news([[14, 'banking_recovery'], [10, 'banking_crisis']]))).toEqual([
      { from: 10, to: 14 },
    ])
  })

  it('reads a recovery with no crash, and a doubled crash, without inventing an episode', () => {
    expect(crisisEpisodes(news([[4, 'banking_recovery']]))).toEqual([])
    expect(crisisEpisodes(news([[4, 'banking_crisis'], [6, 'banking_crisis']]))).toEqual([
      { from: 4, to: null },
    ])
  })

  it('finds bubble reports separately from crashes', () => {
    expect(bubbleTicks(news([[3, 'asset_bubble'], [9, 'banking_crisis'], [12, 'asset_bubble']]))).toEqual([3, 12])
  })
})

describe('an unfunded survey is not a safe reading', () => {
  it('reports null rather than zero for every market reading', () => {
    const reading = readFinance(pubWith({}))
    expect(reading.leverage).toBeNull()
    expect(reading.valuation).toBeNull()
    expect(reading.bankCapital).toBeNull()
    expect(reading.standing).toBeNull()
    expect(reading.position).toBeNull()
    // …but the floor is the government's own order, so it is always known
    expect(reading.capitalFloor).toBeCloseTo(6)
    expect(reading.floorBinds).toBe(false)
  })

  it('still reports the crises, because a crash is never fog', () => {
    const reading = readFinance(pubWith({ news: news([[10, 'banking_crisis'], [14, 'banking_recovery']]) }))
    expect(reading.leverage).toBeNull()
    expect(reading.episodes).toEqual([{ from: 10, to: 14 }])
    expect(reading.inCrisis).toBe(false)
  })

  it('knows it is inside an unfinished crisis', () => {
    const reading = readFinance(pubWith({ news: news([[10, 'banking_crisis']]) }))
    expect(reading.inCrisis).toBe(true)
    expect(reading.standing).toBe('crisis')
  })

  it('plots only quarters where BOTH coordinates were surveyed', () => {
    // half a position is not a position: the missing coordinate would decide
    // which side of a rail the dot fell on
    const pub = pubWith({
      indicators: {
        credit_to_gdp: seriesOf('credit_to_gdp', [
          { forQtr: 0, value: 50 },
          { forQtr: 1, value: 55 },
          { forQtr: 2, value: 60 },
        ]),
        asset_prices: seriesOf('asset_prices', [
          { forQtr: 1, value: 105 },
          { forQtr: 2, value: 115 },
        ]),
      } as PublishedState['indicators'],
    })
    expect(fragilityTrail(pub).map((p) => p.tick)).toEqual([1, 2])
    expect(fragilityTrail(pub)[1]).toEqual({ tick: 2, x: 60, y: 115 })
  })
})

describe('the capital floor', () => {
  const withCapital = (held: number, floor: number) =>
    readFinance(
      pubWith({
        dials: { capitalRequirement: floor / 100 } as PublishedState['dials'],
        indicators: {
          bank_capital_ratio: seriesOf('bank_capital_ratio', [
            { forQtr: 0, value: held },
            { forQtr: 1, value: held },
          ]),
        } as PublishedState['indicators'],
      }),
    )

  it('is slack at the inherited floor and binds when raised to meet the banks', () => {
    // measured: bank capital sits around 20% of credit through an ordinary
    // century, so a 6% floor never binds and a 25% one always does
    expect(withCapital(20, 6).floorBinds).toBe(false)
    expect(withCapital(20, 25).floorBinds).toBe(true)
  })

  it('warns before the floor actually cuts lending, not after', () => {
    const floor = 20
    expect(withCapital(floor * (1 + FLOOR_MARGIN) - 0.01, floor).floorBinds).toBe(true)
    expect(withCapital(floor * (1 + FLOOR_MARGIN) + 0.01, floor).floorBinds).toBe(false)
  })
})

describe('the minute book side', () => {
  it('reads all three money dials over the whole run, exactly', () => {
    const policy = [0, 1, 2].map((tick) => ({
      tick,
      policyRate: 0.04 + tick / 100,
      assetPurchaseRate: 0.02,
      capitalRequirement: 0.06,
    }))
    const lines = stanceLines(pubWith({ policy } as unknown as Partial<PublishedState>))
    expect(lines.map((l) => l.key)).toEqual(['policyRate', 'assetPurchaseRate', 'capitalRequirement'])
    expect(lines[0].points.map((p) => p.value)).toEqual([4, 5, 6])
    expect(lines[0].latest).toBe(6)
    // three separate lines, three separate inks — never one shared axis
    expect(new Set(lines.map((l) => l.ink)).size).toBe(3)
  })

  it('survives an empty minute book without emitting NaN', () => {
    for (const line of stanceLines(pubWith({ policy: [] }))) {
      expect(Number.isFinite(line.latest)).toBe(true)
    }
  })
})

describe('phase geometry', () => {
  const box = { w: 200, h: 200, padL: 20, padR: 10, padT: 10, padB: 20 }

  it('shades the corner above and right of both thresholds', () => {
    const plot = phasePlot(
      [
        { tick: 0, x: 40, y: 90 },
        { tick: 1, x: 90, y: 130 },
      ],
      box,
      { include: [75] },
      { include: [110] },
    )
    const corner = plot.corner(75, 110)!
    expect(corner.x).toBeCloseTo(plot.sx(75))
    // the corner reaches the top and right rails of the drawn face
    expect(corner.x + corner.w).toBeCloseTo(plot.sx(plot.x.hi))
    expect(corner.y).toBeCloseTo(plot.sy(plot.y.hi))
    expect(corner.y + corner.h).toBeCloseTo(plot.sy(110))
  })

  it('clips the corner to the face rather than dropping it when deep inside', () => {
    // a danger zone that disappears once the player is well inside it is the
    // exact failure this overlay exists to fix
    const plot = phasePlot(
      [
        { tick: 0, x: 100, y: 140 },
        { tick: 1, x: 110, y: 150 },
      ],
      box,
      {},
      {},
    )
    const corner = plot.corner(75, 110)
    expect(corner).not.toBeNull()
    expect(corner!.w).toBeGreaterThan(0)
    expect(corner!.h).toBeGreaterThan(0)
  })

  it('leaves the corner too narrow to label when the country is far from the rail', () => {
    // The corner label is suppressed below `CORNER_LABEL_MIN_W` because a
    // right-aligned caption in a narrow corner runs back across the vertical
    // threshold rule — and a country FAR from danger is the common case, so
    // that collision is what the figure looks like most of the time. This
    // pins the geometry the suppression reads, so the constant cannot quietly
    // stop matching the shape it was chosen for.
    const box = { w: 340, h: 300, padL: 38, padR: 10, padT: 10, padB: 30 }
    const calm = [
      { tick: 0, x: 49, y: 78 },
      { tick: 1, x: 55, y: 92 },
      { tick: 2, x: 59, y: 99 },
    ]
    const plot = phasePlot(calm, box, { include: [LEVERAGE_RAIL], pad: 0.08 }, { include: [VALUATION_RAIL, 100], pad: 0.08 })
    const corner = plot.corner(LEVERAGE_RAIL, VALUATION_RAIL)!
    expect(corner.w).toBeGreaterThan(0)
    expect(corner.w).toBeLessThan(62)
  })

  it('drops a corner that is entirely off the top of the face', () => {
    const plot = phasePlot([{ tick: 0, x: 10, y: 10 }, { tick: 1, x: 12, y: 12 }], box)
    expect(plot.corner(500, 500)).toBeNull()
  })

  it('draws the trail in tick order however the points arrive', () => {
    const points = [
      { tick: 2, x: 60, y: 120 },
      { tick: 0, x: 40, y: 100 },
      { tick: 1, x: 50, y: 110 },
    ]
    const plot = phasePlot(points, box)
    const path = plot.path(points)!
    const ordered = plot.path([...points].sort((a, b) => a.tick - b.tick))!
    expect(path).toBe(ordered)
    // and it starts at the oldest quarter, not at whatever was first in the array
    expect(path.startsWith(`M${plot.sx(40).toFixed(1)}`)).toBe(true)
  })

  it('emits no path and no NaN from a degenerate record', () => {
    const plot = phasePlot([{ tick: 0, x: Number.NaN, y: 1 }], box)
    expect(plot.path([{ tick: 0, x: Number.NaN, y: 1 }])).toBeNull()
    expect(Number.isFinite(plot.sx(1))).toBe(true)
    expect(Number.isFinite(plot.sy(1))).toBe(true)
  })
})

describe('against a real surveyed century', () => {
  it('publishes every instrument the overlay reads, and the trail pairs up', () => {
    let last: PublishedState | null = null
    eachQuarter('finance-overlay', 240, (pub) => {
      last = pub
    })
    const pub = last!
    for (const id of FINANCE_INDICATORS) {
      expect(readSeries(pub, id).length, `${id} never published`).toBeGreaterThan(0)
    }
    const trail = fragilityTrail(pub)
    expect(trail.length).toBeGreaterThan(0)
    for (const point of trail) {
      expect(Number.isFinite(point.x)).toBe(true)
      expect(Number.isFinite(point.y)).toBe(true)
    }
    const reading = readFinance(pub)
    expect(reading.standing).not.toBeNull()
    expect(reading.capitalFloor).toBeGreaterThan(0)
  })

  it('leaves an ordinary century clear of the fragility corner', () => {
    // Measured across the catalogue: leverage tops out around 82% of GDP with
    // the money dials untouched, against a 75% rail that only matters while
    // assets are also dear — so a government that never eases should almost
    // never be told it is fragile. If this starts firing, either the economy
    // has been retuned or the rails have, and the overlay's central claim
    // ("this is something you do to yourself") has quietly stopped being true.
    let fragileQuarters = 0
    let measured = 0
    eachQuarter('finance-passive', 240, (pub) => {
      const reading = readFinance(pub)
      if (reading.standing === null) return
      measured++
      if (reading.standing === 'fragile') fragileQuarters++
    })
    expect(measured).toBeGreaterThan(50)
    expect(fragileQuarters / measured).toBeLessThan(0.05)
  })
})
