/** The maturity switch — the terrarium-design skill's core component pattern. */

import type { IndicatorId, IndicatorSeries } from '@terrarium/observation'
import type { Maturity } from '../../maturity'
import { AnalogGauge } from '../AnalogGauge/AnalogGauge'
import { BlankPlate } from '../BlankPlate/BlankPlate'
import { TerminalTicker } from '../TerminalTicker/TerminalTicker'

interface GaugeProps {
  indicator: IndicatorId
  maturity: Maturity
  series?: IndicatorSeries
  now: number
}

export function Gauge({ indicator, maturity, series, now }: GaugeProps) {
  switch (maturity) {
    case 'unmeasured':
      return <BlankPlate indicator={indicator} />
    case 'dossier':
      return <AnalogGauge indicator={indicator} series={series!} now={now} />
    case 'terminal':
      return <TerminalTicker indicator={indicator} series={series!} now={now} />
  }
}
