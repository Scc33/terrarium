/**
 * The statute register (ADR-0027) — the machinery, before any statute is
 * wired to a channel.
 *
 * The load-bearing claim of this phase is NEGATIVE and cannot be seen by
 * playing: a register that ships with every statute at rung 0 must not move
 * the economy at all. `pnpm diff-state --moved-only` is the headline proof of
 * that; these tests pin the pieces it depends on — that rung 0 has zero
 * strength, that `statuteForce` returns exactly zero for an unwritten rule
 * whatever the compliance, and that a level off the end of a ladder is caught
 * rather than silently read as "no statute".
 *
 * The other claims here are the ones that separate a statute from a dial: it
 * arrives over two years instead of instantly, it costs more to repeal than to
 * pass, and what reaches the economy is never what was posted.
 */

import { describe, expect, it } from 'vitest'
import {
  applyActions,
  IllegalActionError,
  init,
  politicalCostOfAction,
  statuteCompliance,
  statuteForce,
  statutesInForce,
  step,
  validate,
  InvariantError,
  STATUTE_IDS,
  STATUTE_LEVELS,
  STATUTE_PHASE_IN_QTRS,
  type TrueState,
} from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'

const fresh = () => init(standardCountry, 'statutes-test')

/** a cabinet that can afford to legislate, so a price never masks a claim */
const funded = (s: TrueState): TrueState => ({
  ...s,
  politics: { ...s.politics, politicalCapital: 1000 },
})

const advance = (s: TrueState, quarters: number): TrueState => {
  let out = s
  for (let i = 0; i < quarters; i++) out = step(out)
  return out
}

describe('the ladders', () => {
  it('opens every statute at rung 0, and rung 0 is always no statute at all', () => {
    // The inertness of the whole register rests on this: `statuteForce`
    // short-circuits on zero strength, so a rung 0 with any strength at all
    // would make an un-enacted statute bite.
    for (const id of STATUTE_IDS) {
      expect(STATUTE_LEVELS[id][0].strength).toBe(0)
      expect(STATUTE_LEVELS[id].length).toBeGreaterThan(1)
    }
  })

  it('keeps every ladder short, because a long one was a dial all along', () => {
    for (const id of STATUTE_IDS) {
      expect(STATUTE_LEVELS[id].length).toBeLessThanOrEqual(4)
    }
  })

  it('names every rung', () => {
    for (const id of STATUTE_IDS) {
      for (const rung of STATUTE_LEVELS[id]) expect(rung.name.trim().length).toBeGreaterThan(0)
    }
  })

  it('climbs: strength rises with the rung', () => {
    for (const id of STATUTE_IDS) {
      const ladder = STATUTE_LEVELS[id]
      for (let i = 1; i < ladder.length; i++) {
        expect(ladder[i].strength).toBeGreaterThan(ladder[i - 1].strength)
      }
    }
  })
})

describe('an empty statute book is inert', () => {
  it('exerts no force at all on a fresh country, whatever the compliance', () => {
    const s = fresh()
    for (const id of STATUTE_IDS) {
      expect(statuteForce(s, id)).toBe(0)
      // …and it is zero because the rung is zero, not because nobody would
      // have obeyed it: compliance is a real, positive number regardless.
      expect(statuteCompliance(s, id)).toBeGreaterThan(0)
    }
    expect(statutesInForce(s)).toBe(0)
  })

  it('stays inert across a century of passive play', () => {
    const s = advance(fresh(), 120)
    for (const id of STATUTE_IDS) expect(statuteForce(s, id)).toBe(0)
  })
})

describe('enacting', () => {
  it('writes the rule and stamps the quarter', () => {
    const s0 = advance(funded(fresh()), 4)
    const s1 = applyActions(s0, [{ kind: 'enact', statute: 'minimum_wage', level: 1 }])
    expect(s1.gov.statutes.minimum_wage.level).toBe(1)
    expect(s1.gov.statutes.minimum_wage.enactedAt).toBe(s0.meta.tick)
    expect(s1.politics.politicalCapital).toBeLessThan(s0.politics.politicalCapital)
  })

  it('quotes the same price it charges', () => {
    const s0 = funded(fresh())
    const action = { kind: 'enact', statute: 'competition', level: 2 } as const
    const quote = politicalCostOfAction(s0, action)
    const s1 = applyActions(s0, [action])
    expect(s0.politics.politicalCapital - s1.politics.politicalCapital).toBeCloseTo(quote, 9)
  })

  it('spends the goodwill of the blocs that mind', () => {
    const s0 = funded(fresh())
    // industry minds a minimum wage; labour wants one
    const s1 = applyActions(s0, [{ kind: 'enact', statute: 'minimum_wage', level: 2 }])
    expect(s1.institutions.blocs.industrialists.favor).toBeLessThan(
      s0.institutions.blocs.industrialists.favor,
    )
    expect(s1.institutions.blocs.unions.favor).toBeGreaterThan(s0.institutions.blocs.unions.favor)
  })

  it('refuses a rung the ladder does not have', () => {
    const s0 = funded(fresh())
    for (const level of [-1, 1.5, 99]) {
      expect(() =>
        applyActions(s0, [{ kind: 'enact', statute: 'minimum_wage', level }]),
      ).toThrow(IllegalActionError)
    }
  })

  it('refuses to re-enact the rung already in force', () => {
    const s0 = funded(fresh())
    expect(() => applyActions(s0, [{ kind: 'enact', statute: 'minimum_wage', level: 0 }])).toThrow(
      IllegalActionError,
    )
  })

  it('prices boldness: one big move costs more political capital than two small ones', () => {
    const s0 = funded(fresh())
    const straight = politicalCostOfAction(s0, {
      kind: 'enact',
      statute: 'competition',
      level: 2,
    })
    const first = politicalCostOfAction(s0, { kind: 'enact', statute: 'competition', level: 1 })
    const s1 = applyActions(s0, [{ kind: 'enact', statute: 'competition', level: 1 }])
    const second = politicalCostOfAction(s1, { kind: 'enact', statute: 'competition', level: 2 })

    // The veto multiplier scales with the SIZE of the move, so it is
    // superlinear — exactly as it already is for a dial. Going the whole way
    // at once means facing the room's objection to the whole way at once.
    expect(straight).toBeGreaterThan(first + second)
    // …but not by an order of magnitude. Both routes are on the same ladder.
    expect(straight).toBeLessThan(2 * (first + second))
  })

  it('charges for the patient route in time rather than capital', () => {
    // The reason salami-slicing is not simply the dominant strategy: every
    // enactment restarts the phase-in, so a statute reached in two steps is
    // two years further from being in force than one reached in a single act.
    // Capital and time are the two prices, and the player picks which to pay.
    const s0 = funded(fresh())
    const bold = advance(
      applyActions(s0, [{ kind: 'enact', statute: 'competition', level: 2 }]),
      STATUTE_PHASE_IN_QTRS,
    )
    let patient = applyActions(s0, [{ kind: 'enact', statute: 'competition', level: 1 }])
    patient = advance(patient, STATUTE_PHASE_IN_QTRS)
    patient = applyActions(funded(patient), [{ kind: 'enact', statute: 'competition', level: 2 }])

    expect(statuteForce(bold, 'competition')).toBeGreaterThan(0)
    expect(statuteForce(patient, 'competition')).toBe(0)
  })
})

describe('a statute arrives; it does not switch on', () => {
  it('exerts no force in the quarter it is signed, and full force two years later', () => {
    const s0 = funded(fresh())
    const enacted = applyActions(s0, [{ kind: 'enact', statute: 'competition', level: 2 }])
    expect(statuteForce(enacted, 'competition')).toBe(0)

    const half = advance(enacted, STATUTE_PHASE_IN_QTRS / 2)
    const full = advance(enacted, STATUTE_PHASE_IN_QTRS)
    expect(statuteForce(half, 'competition')).toBeGreaterThan(0)
    expect(statuteForce(full, 'competition')).toBeGreaterThan(statuteForce(half, 'competition'))

    // and it stops rising once it has fully arrived
    const later = advance(full, 8)
    const expected = statuteCompliance(later, 'competition') * STATUTE_LEVELS.competition[2].strength
    expect(statuteForce(later, 'competition')).toBeCloseTo(expected, 9)
  })

  it('restarts the clock on a change, because the phase-in is about this rule', () => {
    let s = applyActions(funded(fresh()), [
      { kind: 'enact', statute: 'competition', level: 1 },
    ])
    s = advance(s, STATUTE_PHASE_IN_QTRS)
    s = applyActions(funded(s), [{ kind: 'enact', statute: 'competition', level: 2 }])
    expect(statuteForce(s, 'competition')).toBe(0)
  })
})

describe('a law defends itself', () => {
  it('costs more to repeal the longer it has stood', () => {
    const enacted = applyActions(funded(fresh()), [
      { kind: 'enact', statute: 'compulsory_schooling', level: 1 },
    ])
    const repeal = (s: TrueState) =>
      politicalCostOfAction(s, { kind: 'enact', statute: 'compulsory_schooling', level: 0 })

    const soon = repeal(advance(enacted, 1))
    const later = repeal(advance(enacted, 20))
    const generation = repeal(advance(enacted, 60))
    expect(later).toBeGreaterThan(soon)
    expect(generation).toBeGreaterThan(later)
  })

  it('does not charge the premium on tightening a rule, only on undoing one', () => {
    const s = advance(
      applyActions(funded(fresh()), [{ kind: 'enact', statute: 'competition', level: 1 }]),
      40,
    )
    const funds = funded(s)
    const up = politicalCostOfAction(funds, { kind: 'enact', statute: 'competition', level: 2 })
    const down = politicalCostOfAction(funds, { kind: 'enact', statute: 'competition', level: 0 })
    // both are one rung of strength, so the gap is entrenchment (and the
    // room's view of the direction), not the size of the move
    expect(down).toBeGreaterThan(up)
  })
})

describe('compliance is what the state can enforce', () => {
  it('rises with the civil service and the courts', () => {
    const s = fresh()
    const weak: TrueState = {
      ...s,
      gov: { ...s.gov, capacity: { ...s.gov.capacity, administrative: 0.05 } },
      institutions: { ...s.institutions, stocks: { ...s.institutions.stocks, courts: 0.05 } },
    }
    const strong: TrueState = {
      ...s,
      gov: { ...s.gov, capacity: { ...s.gov.capacity, administrative: 0.95 } },
      institutions: { ...s.institutions, stocks: { ...s.institutions.stocks, courts: 0.95 } },
    }
    expect(statuteCompliance(strong, 'minimum_wage')).toBeGreaterThan(
      statuteCompliance(weak, 'minimum_wage'),
    )
  })

  it('falls when a powerful bloc that minds the rule is angry', () => {
    const s = fresh()
    const calm = statuteCompliance(s, 'minimum_wage')
    const angry: TrueState = {
      ...s,
      institutions: {
        ...s.institutions,
        blocs: {
          ...s.institutions.blocs,
          industrialists: { power: 1, favor: -1 },
        },
      },
    }
    expect(statuteCompliance(angry, 'minimum_wage')).toBeLessThan(calm)
  })

  it('is never 1 and never 0, whatever the state and whoever is angry', () => {
    const s = fresh()
    const perfect: TrueState = {
      ...s,
      gov: { ...s.gov, capacity: { ...s.gov.capacity, administrative: 1 } },
      institutions: { ...s.institutions, stocks: { ...s.institutions.stocks, courts: 1 } },
    }
    const hopeless: TrueState = {
      ...s,
      gov: { ...s.gov, capacity: { ...s.gov.capacity, administrative: 0 } },
      institutions: {
        ...s.institutions,
        stocks: { ...s.institutions.stocks, courts: 0 },
        blocs: Object.fromEntries(
          Object.keys(s.institutions.blocs).map((id) => [id, { power: 1, favor: -1 }]),
        ) as TrueState['institutions']['blocs'],
      },
    }
    for (const id of STATUTE_IDS) {
      expect(statuteCompliance(perfect, id)).toBeLessThan(1)
      expect(statuteCompliance(hopeless, id)).toBeGreaterThan(0)
    }
  })

  it('thins as the book lengthens: one civil service, many laws', () => {
    const s0 = funded(fresh())
    const one = applyActions(s0, [{ kind: 'enact', statute: 'minimum_wage', level: 1 }])
    const three = applyActions(one, [
      { kind: 'enact', statute: 'compulsory_schooling', level: 1 },
      { kind: 'enact', statute: 'competition', level: 1 },
    ])
    // hold the room fixed, so the congestion term is the only thing moving
    const held: TrueState = { ...three, institutions: one.institutions }
    expect(statuteCompliance(held, 'minimum_wage')).toBeLessThan(
      statuteCompliance(one, 'minimum_wage'),
    )
    expect(statutesInForce(three)).toBe(3)
  })
})

describe('the record and the invariants', () => {
  it('files the book beside the dials, without filing compliance', () => {
    const s = advance(
      applyActions(funded(fresh()), [{ kind: 'enact', statute: 'minimum_wage', level: 1 }]),
      2,
    )
    const filed = s.stats.record[s.stats.record.length - 1].policy.statutes
    expect(filed.minimum_wage.level).toBe(1)
    // the minute book files DECISIONS: no compliance, no force, nothing that
    // moves on its own (ADR-0027)
    expect(Object.keys(filed.minimum_wage).sort()).toEqual(['enactedAt', 'level'])
  })

  it('does not let a filed quarter be rewritten by a later enactment', () => {
    let s = advance(applyActions(funded(fresh()), [
      { kind: 'enact', statute: 'minimum_wage', level: 1 },
    ]), 2)
    const before = s.stats.record[1].policy.statutes.minimum_wage.level
    s = advance(applyActions(funded(s), [{ kind: 'enact', statute: 'minimum_wage', level: 2 }]), 2)
    expect(s.stats.record[1].policy.statutes.minimum_wage.level).toBe(before)
  })

  it('catches a level that has fallen off its own ladder', () => {
    const s = fresh()
    const broken: TrueState = {
      ...s,
      gov: {
        ...s.gov,
        statutes: { ...s.gov.statutes, competition: { level: 7, enactedAt: 0 } },
      },
    }
    expect(() => validate(broken)).toThrow(InvariantError)
  })

  it('catches an enactment stamped in the future', () => {
    const s = fresh()
    const broken: TrueState = {
      ...s,
      gov: {
        ...s.gov,
        statutes: { ...s.gov.statutes, competition: { level: 1, enactedAt: s.meta.tick + 4 } },
      },
    }
    expect(() => validate(broken)).toThrow(InvariantError)
  })
})
