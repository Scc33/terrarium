/** The terms of a posting other than the country: the year you take office
 * (ADR-0021) and the world you take it in (ADR-0046). Both are sealed into the
 * save, both are owned by the app rather than the posting room — the drafting
 * room's own ACCEPT starts a game too — and both are choices every player is
 * making whether or not they open anything, so neither is folded away. Lifted
 * out of `CountrySelect.tsx` so the posting room's hotspot did not have to grow
 * a second band. */

import {
  APPOINTMENTS,
  FIRST_YEAR,
  TURBULENCE_IDS,
  type Appointment,
  type Turbulence,
} from '@terrarium/engine'
import { SegmentedControl } from '../components/ui'
import { TURBULENCE_COPY } from '../turbulence'

const CARETAKER_NOTE =
  `A caretaker ministry governs the years before you: it holds the ${FIRST_YEAR} programmes at their ` +
  'share of the economy and builds the four state capacities, and does nothing else. You inherit ' +
  'whatever that produced — the ministries, the debt, and the politics its programme earned.'

const yearsBefore = (appointment: Appointment) => Math.round(appointment.tick / 4)

/** The year you take office (ADR-0021).
 *
 * Sealed into the save like the standing orders, and for the same reason: the
 * same country and code produce a different century from a different quarter.
 * It gets its own band rather than a fold, because unlike the safeties it is a
 * choice every player is making whether or not they open anything — the wrong
 * default here is a whole game, not a lifted constraint.
 *
 * The copy has to say what happens to the missing years, or a later appointment
 * reads as a cheat that skips them. It does not skip them: a caretaker
 * administration governs them in the ordinary loop and the country that arrives
 * is whatever that produced. */
export function AppointmentBand({
  value,
  onChange,
}: {
  value: Appointment
  onChange: (tick: number) => void
}) {
  const years = yearsBefore(value)
  return (
    <div className="border-t border-dossier-ink/15 pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[8px] font-semibold tracking-[0.18em] text-dossier-ink/55">
          YEAR OF APPOINTMENT
        </span>
        <span className="font-mono text-[8px] tracking-[0.12em] text-dossier-brass">{value.name}</span>
      </div>
      <div className="mt-1.5">
        <SegmentedControl
          label="Year of appointment"
          value={String(value.year)}
          onChange={(next) => {
            const picked = APPOINTMENTS.find((a) => String(a.year) === next)
            if (picked) onChange(picked.tick)
          }}
          options={APPOINTMENTS.map((a) => ({
            value: String(a.year),
            label: String(a.year),
            // the whole mechanism rides on the hover, so that the aside spends
            // two lines on the choice rather than pushing the standing orders
            // off the bottom of its own scroll region
            title: yearsBefore(a) === 0
              ? `${a.name} — ${a.summary}`
              : `${a.name} — ${a.summary} ${CARETAKER_NOTE}`,
          }))}
        />
      </div>
      <p className="mt-1.5 font-dossier text-[10px] italic leading-snug text-dossier-ink/48">{value.summary}</p>
      {years > 0 && (
        <p className="mt-1.5 font-dossier text-[10px] italic leading-snug text-dossier-ink/48">
          The {years} years before you are not skipped — a caretaker ministry governs them, and you inherit
          what it built.
        </p>
      )}
    </div>
  )
}

/** How often the world breaks (ADR-0046). Beside the year rather than among
 * the standing orders: it is a choice about the century you will live in, not
 * a safety that lifts a constraint, and folding it away would hide the one
 * setting a player who finds the wire relentless is looking for (#122). */
export function TurbulenceBand({
  value,
  onChange,
}: {
  value: Turbulence
  onChange: (value: Turbulence) => void
}) {
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="font-mono text-[8px] font-semibold tracking-[0.18em] text-dossier-ink/55">
          THE WORLD ABROAD
        </span>
        <SegmentedControl
          label="The world abroad"
          value={value}
          onChange={onChange}
          options={TURBULENCE_IDS.map((id) => ({ value: id, label: TURBULENCE_COPY[id].label }))}
        />
      </div>
      <p className="mt-1.5 font-dossier text-[10px] italic leading-snug text-dossier-ink/48">
        {TURBULENCE_COPY[value].caption}
      </p>
    </div>
  )
}
