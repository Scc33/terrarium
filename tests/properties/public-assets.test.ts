import { describe, expect, it } from 'vitest'
import { createSave, init, replay, rngFor, step, validate, type TrueState } from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'
import { observe, createHistoricalDataExport } from '@terrarium/observation'
import { finance } from '../../packages/engine/src/pipeline/finance'
import { officialNominalGdp } from '../../packages/engine/src/state/spending'
import { POLICY_IDS, policyFor } from '../../packages/runner/src/policies'
import { runOne } from '../../packages/runner/src/run'


describe('central-bank purchases and the public record', () => {
  it('books a reserve defence only to the amount the bank can actually sell', () => {
    const s = init(standardCountry, 'reserve-book')
    s.external.reserves = 0.01
    s.gov.dials.fxIntervention = -0.1
    const next = step(s)
    expect(next.external.reserves).toBe(0)
    expect(next.flows.fxIntervention).toBe(-0.01)
    expect(next.finance.centralBankAssets).toBe(0)
    const pub = observe(next)
    expect(pub.centralBank.fxIntervention).toBe(-0.01)
    expect(pub.books.at(-1)?.fxIntervention).toBe(-0.01)
  })

  it('waits for official GDP, uses its latest revision, and keeps holdings when purchases stop', () => {
    let s = init(standardCountry, 'purchase-book')
    s.gov.dials.assetPurchaseRate = 0.1
    expect(finance.run(s, rngFor('purchase-book', 'finance', 0)).flows.assetPurchases).toBe(0)
    for (let tick = 0; tick < 12; tick++) s = step(s)
    const gdp = officialNominalGdp(s)!
    expect(gdp).toBeGreaterThan(0)
    const next = finance.run(s, rngFor('purchase-book', 'finance', 12))
    expect(next.flows.assetPurchases).toBe(gdp * 0.1)
    const hidden = { ...s, flows: { ...s.flows, nominalGdp: s.flows.nominalGdp * 2 } }
    expect(finance.run(hidden, rngFor('purchase-book', 'finance', 12)).flows.assetPurchases).toBe(next.flows.assetPurchases)
    next.gov = { ...next.gov, dials: { ...next.gov.dials, assetPurchaseRate: 0 } }
    const stopped = step(next)
    expect(stopped.finance.centralBankAssets).toBe(next.finance.centralBankAssets)
    expect(stopped.flows.assetPurchases).toBe(0)
  })

  it('replays old saves into complete exact accounts, including the portable export', () => {
    const save = createSave(standardCountry, 'assets-save', [
      { tick: 4, actions: [{ kind: 'setDial', path: 'assetPurchaseRate', value: 0.1 }] },
      { tick: 20, actions: [{ kind: 'setDial', path: 'fxIntervention', value: -0.1 }] },
    ], 100, { fullInstrumentation: true, unlimitedCapital: true, protectedTenure: true })
    save.version.schema = 44
    const s = replay(save)
    expect(replay(save)).toEqual(s)
    const pub = observe(s)
    expect(pub.centralBank.assets).toBeGreaterThan(0)
    expect(pub.centralBank.assets).toBe(s.finance.centralBankAssets)
    expect(pub.treasury.fund).toBe(s.gov.fund)
    expect(pub.books.at(-1)?.fund).toBe(pub.treasury.fund)
    expect(pub.books.at(-1)?.centralBankAssets).toBe(pub.centralBank.assets)
    const exported = createHistoricalDataExport(pub, save)
    expect(exported.snapshot.centralBank).toEqual(pub.centralBank)
    expect(exported.records.treasury).toEqual(pub.books)
    pub.centralBank.assets = -1
    expect(s.finance.centralBankAssets).toBeGreaterThan(0)
    expect(exported.snapshot.centralBank.assets).toBeGreaterThan(0)
  })

  it('rejects corrupt central-bank holdings', () => {
    const s = init(standardCountry, 'invalid-book')
    s.finance.centralBankAssets = -1
    expect(() => validate(s)).toThrow('centralBankAssets < 0')
    s.finance.centralBankAssets = Number.NaN
    expect(() => validate(s)).toThrow('centralBankAssets')
  })
})

for (const policy of POLICY_IDS) {
  it(`publishes reconciled public books through a century of ${policy} in every country`, () => {
    for (const country of ['meridia', 'costona', 'veltravia', 'oranga', 'kestrel', 'procedural'] as const) {
      let before: TrueState
      const run = runOne({ seed: `public-assets-${country}`, country, ticks: 400,
        policy: policyFor(policy), includeStateHash: false,
        observer: {
          afterActions: (s) => { before = s },
          afterStep: (s) => {
            const book = s.stats.record.at(-1)!
            expect(book.balance).toBeCloseTo(book.debtRepaid - book.bondsIssued - book.deficitPrinting + book.fundFlow + book.fiscalRebate, 7)
            expect(s.gov.fund - before.gov.fund).toBeCloseTo(book.fundFlow, 7)
            expect(s.gov.debt - before.gov.debt).toBeCloseTo(book.bondsIssued - book.debtRepaid, 7)
            expect(s.finance.centralBankAssets - before.finance.centralBankAssets).toBeCloseTo(book.assetPurchases, 7)
            expect(s.external.reserves - before.external.reserves).toBeCloseTo(book.fxIntervention, 7)
            expect(book.assetPurchases).toBeCloseTo(before.gov.dials.assetPurchaseRate * (officialNominalGdp(before) ?? 0), 7)
          },
        },
      })
      expect(run.nanCount).toBe(0)
    }
  })
}
