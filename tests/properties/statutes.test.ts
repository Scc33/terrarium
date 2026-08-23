/**
 * Load-bearing mechanism claims for the statute book (ADR-0027) — one per
 * statute, asserted over seeds because a claim about a mechanism is not a
 * claim about a run.
 *
 * The shared claim, and the one the whole register rests on: **what reaches
 * the economy is the rule times what the state can enforce.** A statute posted
 * by a government with no inspectorate is a statute that does almost nothing,
 * exactly as a tax rate posted by a government with no tax office collects
 * almost nothing. If that stops being true, the register has become a second
 * rack of dials with longer names.
 *
 * COMPETITION reaches the economy through `eliteCapture` alone, which
 * `creativeDestruction` turns into a multiplier on how fast the country can
 * absorb the world frontier. Nothing here is a scripted growth bonus: the
 * statute lowers the ceiling term and the ordinary technology step does the
 * rest, which is why the effect is large where incumbency was large and
 * almost nothing where it was not.
 */

import { describe, expect, it } from 'vitest'
import {
  applyActions,
  CAPACITY_IDS,
  createCountryParams,
  creativeDestruction,
  eliteCapture,
  init,
  statuteCompliance,
  statuteForce,
  step,
  type Action,
  type CountryParams,
  type TrueState,
} from '@terrarium/engine'

const ENACT_AT = 40 // a decade in, so the ministries have started to exist

/**
 * A capacity-building government, with an optional statute. Capacity matters
 * for a statute in a way it does not for a dial: without a civil service and
 * courts there is nobody to enforce the rule, so a passive run would measure
 * the compliance floor rather than the channel.
 *
 * Two deliberate distortions, both so that what is measured is the CHANNEL:
 * the cabinet is given capital (what an order costs is `tests/unit/statutes.ts`
 * business), and tenure is protected.
 *
 * The protection is not a convenience. On a hard country a fair share of
 * governments are deposed before quarter 40, and a deposed cabinet cannot give
 * orders — so the enactment throws, and a run that was supposed to test the
 * statute silently becomes a run without one. Two of the first six seeds here
 * did exactly that: `statuteForce` was 0.000 and the two arms were identical
 * to the last decimal, which reads in a results table as "the statute did
 * nothing" rather than "the statute never happened". Skipping a failed
 * CAPACITY order is fine and the runner does it too; skipping the thing under
 * test is how an experiment lies.
 */
function govern(params: CountryParams, seed: string, ticks: number, statute: Action | null): TrueState {
  let s = init(params, seed, { protectedTenure: true })
  for (let t = 0; t < ticks; t++) {
    const ministries: Action[] =
      t % 4 === 0
        ? CAPACITY_IDS.map((target) => ({ kind: 'investCapacity', target, amount: 2 }))
        : []
    let staged: TrueState = { ...s, politics: { ...s.politics, politicalCapital: 500 } }
    for (const act of ministries) {
      // a ministry already at full strength refuses more money; the runner is
      // lenient about exactly this and so is the experiment
      try {
        staged = applyActions(staged, [act])
      } catch {
        continue
      }
    }
    // …and the statute is never swallowed: if this throws, the test fails
    if (statute && t === ENACT_AT) staged = applyActions(staged, [statute])
    s = step(staged)
  }
  return s
}

const SEEDS = Array.from({ length: 6 }, (_, i) => `statute-${i}`)
const TRUST_BUSTING: Action = { kind: 'enact', statute: 'competition', level: 2 }

describe('a statute is worth what the state can enforce', () => {
  it('does far less in a country whose courts and ministries are hollow', () => {
    // Same rule, same rung, same country — only the apparatus differs.
    const params = createCountryParams('meridia', 'enforce')
    const s = init(params, 'enforce')
    const capable: TrueState = {
      ...s,
      gov: { ...s.gov, capacity: { ...s.gov.capacity, administrative: 0.9 } },
      institutions: { ...s.institutions, stocks: { ...s.institutions.stocks, courts: 0.9 } },
    }
    const hollow: TrueState = {
      ...s,
      gov: { ...s.gov, capacity: { ...s.gov.capacity, administrative: 0.05 } },
      institutions: { ...s.institutions, stocks: { ...s.institutions.stocks, courts: 0.05 } },
    }
    const enact = (from: TrueState) =>
      applyActions({ ...from, politics: { ...from.politics, politicalCapital: 500 } }, [
        TRUST_BUSTING,
      ])
    // …and then let both phase in fully
    let a = enact(capable)
    let b = enact(hollow)
    for (let t = 0; t < 12; t++) {
      a = step(a)
      b = step(b)
    }
    // the capable state gets most of its law; the hollow one gets a fraction
    expect(statuteForce(a, 'competition')).toBeGreaterThan(2 * statuteForce(b, 'competition'))
  })
})

describe('competition law → catch-up growth (emergent, not scripted)', () => {
  it('relieves the extractive ceiling and lifts absorption, in every seed', () => {
    const params = createCountryParams('costona', 'competition-costona')
    let lifted = 0
    for (const seed of SEEDS) {
      const off = govern(params, seed, 160, null)
      const on = govern(params, seed, 160, TRUST_BUSTING)
      expect(eliteCapture(on)).toBeLessThan(eliteCapture(off))
      if (creativeDestruction(on) > creativeDestruction(off)) lifted++
    }
    expect(lifted).toBe(SEEDS.length)
  })

  it('grows the economy it was passed in, in every seed', () => {
    const params = createCountryParams('costona', 'competition-costona')
    let richer = 0
    for (const seed of SEEDS) {
      const off = govern(params, seed, 160, null)
      const on = govern(params, seed, 160, TRUST_BUSTING)
      if (on.flows.realGdp > off.flows.realGdp) richer++
    }
    expect(richer).toBe(SEEDS.length)
  })

  /**
   * The claim that makes this a mechanism rather than a growth button, and the
   * one to check first if the constant is ever retuned.
   *
   * Measured over 160 quarters, six seeds each: Costona — "the landowners'
   * settlement", opening at a capture of 0.60 — gains about 16% of real GDP,
   * while Oranga — the open harbour with a capable civil service, opening
   * near 0.35 — gains about 1%. Nothing distinguishes them but how much
   * incumbency there was to break, which is what `eliteCapture` measures.
   *
   * The same table carries the register's own irony, unscripted: Costona's
   * compliance is the LOWEST in the catalogue, because the country that most
   * needs a competition act is the one least able to enforce one.
   */
  it('pays a captured country far more than an already-open one', () => {
    const gain = (id: 'costona' | 'oranga'): number => {
      const params = createCountryParams(id, `competition-${id}`)
      let off = 0
      let on = 0
      for (const seed of SEEDS) {
        off += govern(params, seed, 160, null).flows.realGdp
        on += govern(params, seed, 160, TRUST_BUSTING).flows.realGdp
      }
      return on / off - 1
    }
    const captured = gain('costona')
    const open = gain('oranga')
    expect(captured).toBeGreaterThan(0.05)
    expect(open).toBeLessThan(0.05)
    expect(captured).toBeGreaterThan(3 * open)
  })

  it('does nothing at all while it is unwritten', () => {
    const params = createCountryParams('costona', 'competition-costona')
    const passive = govern(params, SEEDS[0], 80, null)
    expect(statuteForce(passive, 'competition')).toBe(0)
    // …and the ceiling is then exactly the strongest incumbent, untouched
    expect(statuteCompliance(passive, 'competition')).toBeGreaterThan(0)
    expect(eliteCapture(passive)).toBeGreaterThan(0)
  })
})
