/** The maturity switch — the terrarium-design skill's core component pattern. */

import type { IndicatorId, IndicatorSeries } from '@terrarium/observation'
import type { InstrumentAccess } from '../../maturity'
import { AnalogGauge } from '../AnalogGauge/AnalogGauge'
import { BlankPlate } from '../BlankPlate/BlankPlate'
import { TerminalTicker } from '../TerminalTicker/TerminalTicker'

interface GaugeProps {
  indicator: IndicatorId
  access: InstrumentAccess
  series?: IndicatorSeries
  now: number
  onOpenCapacity?: () => void
}

export function Gauge({ indicator, access, series, now, onOpenCapacity }: GaugeProps) {
  if (access.availability !== 'reporting') {
    return (
      <BlankPlate
        indicator={indicator}
        availability={access.availability}
        currentCapacity={access.currentCapacity}
        fundedAt={access.fundedAt}
        onOpenCapacity={onOpenCapacity}
      />
    )
  }
  switch (access.maturity) {
    case 'unmeasured':
      return null
    case 'dossier':
      return <AnalogGauge indicator={indicator} series={series!} now={now} />
    case 'terminal':
      return <TerminalTicker indicator={indicator} series={series!} now={now} />
  }
}
