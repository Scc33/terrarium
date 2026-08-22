/**
 * The years before you (ADR-0021). A later appointment is a replay input, so
 * these tests pin the two things that makes it: it must be **inert** when the
 * appointment is 1946 — every existing save, every golden replay and every
 * measured baseline is a run with `appointedAt: 0` — and a run that starts in
 * 1973 must be the SAME run when it is reopened from its save.
 *
 * The rest pin the handover itself. A player who takes office in 1973 is a new
 * government, not the caretaker's heir: the record it is graded on opens the
 * quarter it arrives, and none of the caretaker's quarters, elections or
 * accumulated capital are theirs.
 */

import { describe, expect, it } from 'vitest'
import {
  APPOINTMENTS,
  applyAction,
  appointmentTick,
  caretakerActions,
  createCountryParams,
  createSave,
  CURATED_COUNTRY_IDS,
  ELECTION_PERIOD,
  END_OF_HISTORY_TICK,
  hashState,
  LAST_APPOINTMENT_TICK,
  init,
  PC_START,
  replay,
  runInterregnum,
  step,
  tickForYear,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { standardCountry } from '@terrarium/fixtures'

const play = (state: TrueState, ticks: number): TrueState => {
  let s = state
  for (let t = 0; t < ticks; t++) s = step(s)
  return s
}

/** Take office in 1973, then govern (passively) for a while. */
function posting(country: string, seed: string, appointedAt: number, then = 0) {
  const params = createCountryParams(country as never, seed)
  const opened = runInterregnum(params, seed, 'standard', appointedAt)
  const state = play(opened.state, then)
  return { params, ...opened, state }
}

describe('an ordinary posting is untouched', () => {
  it('naming quarter zero is the same run as naming nothing', () => {
    const implicit = play(init(standardCountry, 'inert'), 40)
    const explicit = play(init(standardCountry, 'inert', 'standard', 0), 40)
    expect(hashState(explicit)).toBe(hashState(implicit))
  })

  it('the interregnum of a 1946 appointment is init, and writes no orders', () => {
    const { state, actionLog } = runInterregnum(standardCountry, 'inert', 'standard', 0)
    expect(actionLog).toEqual([])
    expect(hashState(state)).toBe(hashState(init(standardCountry, 'inert')))
  })

  it('a save from before the appointment year loads as a 1946 posting', () => {
    // no `appointedAt` field at all: every save written before v28 is one of these
    const save = createSave(standardCountry, 'old-save', [], 12)
    delete (save as { appointedAt?: number }).appointedAt
    expect(hashState(replay(save))).toBe(hashState(play(init(standardCountry, 'old-save'), 12)))
  })
})

describe('a later posting is a real run', () => {
  it.each(APPOINTMENTS.map((a) => [a.year, a.tick] as const))(
    'reopening a %i posting from its save gives back the same country',
    (_year, tick) => {
      const { params, state, actionLog } = posting('meridia', 'round-trip', tick, 6)
      const save = createSave(params, 'round-trip', actionLog, state.meta.tick, 'standard', tick)
      expect(hashState(replay(save))).toBe(hashState(state))
    },
  )

  it('every offered appointment lands on the quarter it names', () => {
    for (const appointment of APPOINTMENTS) {
      expect(appointment.tick).toBe(tickForYear(appointment.year))
      const { state } = posting('meridia', 'lands', appointment.tick)
      expect(state.meta.tick).toBe(appointment.tick)
      expect(state.meta.appointedAt).toBe(appointment.tick)
    }
  })

  it('the caretaker never hands over a country it has lost', () => {
    // the record says the country reached the appointment: it cannot fall on
    // the way, and it cannot arrive mid-campaign either
    for (const country of CURATED_COUNTRY_IDS) {
      for (const seed of ['hand-1', 'hand-2', 'hand-3']) {
        const { state } = posting(country, seed, tickForYear(2005))
        expect(state.politics.inPower, `${country}/${seed}`).toBe(true)
        expect(state.politics.deposedAt).toBeNull()
        expect(state.politics.campaign).toBeNull()
      }
    }
  })
})

describe('the handover', () => {
  const appointedAt = tickForYear(1973)

  it('hands over a full term and the opening treasury, not the caretaker’s', () => {
    const { state } = posting('meridia', 'handover', appointedAt)
    // PC does not accrue during the interregnum, so the cabinet the player
    // walks into is the one a 1946 government walks into
    expect(state.politics.politicalCapital).toBe(PC_START)
    expect(state.politics.quartersToElection).toBe(ELECTION_PERIOD)
    // and nobody elected the caretaker, so there is no mandate to inherit
    expect(state.politics.electionsWon).toBe(0)
    expect(state.politics.electionsSuppressed).toBe(0)
    expect(state.politics.lastElection).toBeNull()
  })

  it('opens the record on the quarter the player arrives', () => {
    const { state } = posting('meridia', 'record', appointedAt)
    expect(state.score.governedQuarters).toBe(0)
    expect(state.score.corridorQuarters).toBe(0)
    expect(state.score.discountWeight).toBe(0)
    expect(state.score.baselineWelfare).toBeNull()

    // …and it is the standard of living they INHERITED that they are graded
    // against, so the yardstick is set by the first quarter they govern
    const governed = play(state, 8)
    expect(governed.score.governedQuarters).toBe(8)
    expect(governed.score.baselineWelfare).not.toBeNull()
  })

  it('counts the tenure from the appointment, not from 1946', () => {
    // protected, so the run reaches 2050 rather than being deposed on the way:
    // the claim under test is the arithmetic of the tenure, not its survival
    const params = createCountryParams('meridia', 'tenure')
    const { state } = runInterregnum(params, 'tenure', { protectedTenure: true }, appointedAt)
    const card = observe(play(state, END_OF_HISTORY_TICK)).reportCard
    expect(card).toBeDefined()
    // the book closes at 2050 whenever you arrived; the tenure is what is left
    expect(card!.quartersGoverned).toBe(END_OF_HISTORY_TICK - appointedAt)
  })

  it('is the country the caretaker built, not the one it opened with', () => {
    // the point of the interregnum: a passive quarter-century would hand over
    // the 1946 statistical office, and a wall with three instruments on it is
    // not a later game
    for (const country of CURATED_COUNTRY_IDS) {
      const { state } = posting(country, 'built', appointedAt)
      expect(state.gov.capacity.statistical, country).toBeGreaterThan(0.4)
      const reporting = Object.keys(observe(state).indicators).length
      expect(reporting, country).toBeGreaterThan(20)
    }
  })
})

describe('a quarter the engine is handed', () => {
  it('is clamped into the playable century, whatever a save says', () => {
    // a hand-edited save naming quarter 900 must not open a game whose player
    // never arrives, and neither must one naming NaN
    expect(appointmentTick(900)).toBe(LAST_APPOINTMENT_TICK)
    expect(appointmentTick(-12)).toBe(0)
    expect(appointmentTick(Number.NaN)).toBe(0)
    // unreadable is not "as late as possible": it falls back to the posting
    // every save before v28 means
    expect(appointmentTick(Number.POSITIVE_INFINITY)).toBe(0)
    expect(appointmentTick(37.9)).toBe(37)
    // …and init refuses it the same way, because the save is not the only door
    expect(init(standardCountry, 'clamped', 'standard', 900).meta.appointedAt).toBe(
      LAST_APPOINTMENT_TICK,
    )
  })

  it('always leaves a quarter to govern, so the run can still end', () => {
    // an appointment ON the closing quarter arrives to a ledger that has already
    // shut: nothing accumulates, no baseline is banked, and `reportCardOf`
    // refuses forever while the government stays in power advancing past 2050.
    // The clamp stops one quarter short for exactly this reason.
    expect(LAST_APPOINTMENT_TICK).toBeLessThan(END_OF_HISTORY_TICK)
    for (const asked of [END_OF_HISTORY_TICK, END_OF_HISTORY_TICK + 4, 900]) {
      const { state } = posting('meridia', 'closing', appointmentTick(asked), 4)
      expect(state.score.baselineWelfare, `appointment asked at ${asked}`).not.toBeNull()
      const card = observe(state).reportCard
      expect(card, `appointment asked at ${asked}`).toBeDefined()
      expect(card!.quartersGoverned).toBeGreaterThan(0)
    }
  })
})

describe('the caretaker', () => {
  it('touches nothing but the ministries and the appropriations', () => {
    let s = init(standardCountry, 'scope', 'standard', tickForYear(1973))
    const kinds = new Set<string>()
    for (let t = 0; t < 40; t++) {
      for (const action of caretakerActions(s)) {
        kinds.add(action.kind)
        s = applyAction(s, action)
      }
      s = step(s)
    }
    expect([...kinds].sort()).toEqual(['investCapacity', 'setSpendingRule'])
  })

  it('is not charged political capital, and is not why it stays solvent', () => {
    // an interregnum that ran out of capital would make the inheritance a
    // function of how the opening twenty points happened to fall
    let s = init(standardCountry, 'unbilled', 'standard', tickForYear(1973))
    for (let t = 0; t < 24; t++) {
      for (const action of caretakerActions(s)) s = applyAction(s, action)
      s = step(s)
    }
    expect(s.politics.politicalCapital).toBe(PC_START)
    // …but the room still minded: favour moved, so the politics the player
    // takes over is the one the caretaker's programme earned
    const opening = init(standardCountry, 'unbilled', 'standard', tickForYear(1973))
    const moved = Object.keys(s.institutions.blocs).some(
      (id) =>
        s.institutions.blocs[id as keyof typeof s.institutions.blocs].favor !==
        opening.institutions.blocs[id as keyof typeof opening.institutions.blocs].favor,
    )
    expect(moved).toBe(true)
  })
})
