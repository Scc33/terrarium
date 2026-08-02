/**
 * The instrument wall — the home view, in three bands.
 *
 *   BOARD   the pinned instruments at full size, each at its own maturity.
 *           A brass blank plate sitting beside a phosphor ticker IS the
 *           state-capacity mechanic on screen.
 *   RACK    every instrument as a fixed-height strip in a stable order: the
 *           whole measurement apparatus at a glance, including what has not
 *           been built. Click a strip to put it on the board.
 *   DOCKED  the treasury's ledger and the Narrow Corridor, permanently.
 *
 * Heights come from `../wallPlan`, the single place that knows how much room
 * the war room has; `tests/ui/wall-plan.test.ts` asserts the whole thing fits
 * the reference viewport. Nothing here sizes itself by content, so no tile can
 * paint outside its slot the way the old uniform grid did.
 */

import { INDICATOR_IDS, type PublishedState } from '@terrarium/observation'
import { countInstrumentStatuses, deriveInstrumentAccess, instrumentStatusSummary } from '../maturity'
import { CorridorPlot } from '../components/CorridorPlot/CorridorPlot'
import { Gauge } from '../components/Gauge/Gauge'
import { RackStrip } from '../components/RackStrip/RackStrip'
import { SectionBar } from '../components/ui'
import { LedgerPanel } from './LedgerPanel'
import { useGame } from '../store/gameStore'
import { BOARD_SLOT_MIN_H, DOCKED_MIN_H, planWall } from '../wallPlan'

export function Instruments({
  pub,
  onLedger,
  onOpenCapacity,
}: {
  pub: PublishedState
  onLedger: () => void
  onOpenCapacity: () => void
}) {
  const access = deriveInstrumentAccess(pub)
  const trail = useGame((s) => s.corridorTrail)
  const pinned = useGame((s) => s.pinned)
  const togglePin = useGame((s) => s.togglePin)
  const plan = planWall(pinned, INDICATOR_IDS)
  const boardStatus = instrumentStatusSummary(countInstrumentStatuses(plan.board.map((id) => access[id])))
  const rackStatus = instrumentStatusSummary(countInstrumentStatuses(plan.rack.map((id) => access[id])))

  return (
    <div className="instrument-wall grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1.5fr)_auto_auto_minmax(0,1fr)] gap-2 bg-[#22382d] p-2.5">
      <SectionBar
        title="WATCH BOARD"
        detail="The four instruments the cabinet is flying by"
        aside={boardStatus}
        inverted
      />

      {/* THE BOARD — the dials you are actually flying by */}
      {/* the single explicit row matters: with auto rows a grid item's
          `h-full` resolves against its own content, which is how tiles used to
          demand more height than the band had and paint outside it */}
      <div
        className="instrument-board grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)] gap-2 overflow-hidden"
        style={{
          minHeight: BOARD_SLOT_MIN_H,
        }}
      >
        {plan.board.map((id) => (
          <Gauge
            key={id}
            indicator={id}
            access={access[id]}
            series={pub.indicators[id]}
            now={pub.tick}
            onOpenCapacity={access[id].availability === 'unfunded' ? onOpenCapacity : undefined}
          />
        ))}
      </div>

      <SectionBar
        title="INSTRUMENT RACK"
        detail="Select any strip to swap it onto the watch board"
        aside={rackStatus}
        inverted
      />

      {/* THE RACK — the apparatus entire, fitted and unfitted alike */}
      <div
        className="instrument-rack grid min-w-0 gap-x-2 gap-y-1"
      >
        {plan.rack.map((id) => (
          <RackStrip
            key={id}
            indicator={id}
            access={access[id]}
            series={pub.indicators[id]}
            now={pub.tick}
            pinned={plan.board.includes(id)}
            slot={plan.board.includes(id) ? plan.board.indexOf(id) + 1 : undefined}
            onPin={() => togglePin(id)}
          />
        ))}
      </div>

      {/* DOCKED — the books you keep on yourself, and the map */}
      <div
        className="instrument-docked grid min-h-0 min-w-0 grid-cols-2 grid-rows-[minmax(0,1fr)] gap-2 overflow-hidden"
        style={{ minHeight: DOCKED_MIN_H }}
      >
        <LedgerPanel pub={pub} onOpen={onLedger} />
        <CorridorPlot trail={trail} />
      </div>
    </div>
  )
}
