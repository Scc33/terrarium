/**
 * The instrument wall — the home view. A patchwork by design: each
 * indicator renders at its own maturity, and a brass blank plate beside a
 * phosphor ticker IS the state-capacity mechanic on screen. The corridor
 * map is permanently docked in the fourth bay.
 */

import { INDICATOR_IDS, type PublishedState } from '@terrarium/observation'
import { deriveMaturity } from '../maturity'
import { CorridorPlot } from '../components/CorridorPlot'
import { Gauge } from '../components/Gauge'
import { useGame } from '../store/gameStore'

export function Instruments({ pub }: { pub: PublishedState }) {
  const maturity = deriveMaturity(pub)
  const trail = useGame((s) => s.corridorTrail)
  return (
    <div className="grid h-full min-w-0 grid-cols-1 gap-2 p-2 sm:grid-cols-2 lg:grid-rows-2 [&>*]:min-h-0 [&>*]:min-w-0">
      {INDICATOR_IDS.map((id) => (
        <Gauge key={id} indicator={id} maturity={maturity[id]} series={pub.indicators[id]} now={pub.tick} />
      ))}
      <CorridorPlot trail={trail} />
    </div>
  )
}
