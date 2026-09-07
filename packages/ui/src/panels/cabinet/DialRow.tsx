/**
 * An ordinary dial order: move the slider, see the delta, see who it reaches.
 * The row stages an action rather than applying one — nothing here reaches the
 * engine until the cabinet enacts.
 */

import type { PublishedState } from '@terrarium/observation'
import { SliderField } from '../../components/ui'
import { useGame } from '../../store/gameStore'
import { LEVER_COPY } from '../../levers'
import { dialIncidence } from '../../incidence'
import type { DialDef } from './dials'
import { IncidenceNote } from './IncidenceNote'

export function DialRow({ def, pub }: { def: DialDef; pub: PublishedState }) {
  const { staged, stagedCosts, stage } = useGame()
  const key = `dial:${def.path}`
  const stagedAction = staged.get(key)
  const current = def.get(pub)
  const value = stagedAction?.kind === 'setDial' ? stagedAction.value : current
  const dirty = stagedAction !== undefined
  const max = def.max(pub)

  const setValue = (raw: number) => {
    const stepped = def.min + Math.round((raw - def.min) / def.step) * def.step
    const value = Math.min(max, Math.max(def.min, Number(stepped.toFixed(8))))
    stage(key, Math.abs(value - current) < 1e-9 ? null : { kind: 'setDial', path: def.path, value })
  }

  const delta = value - current
  const percentagePoints =
    def.path.startsWith('taxRates.') ||
    def.path === 'policyRate' ||
    def.path === 'assetPurchaseRate' ||
    def.path === 'capitalRequirement' ||
    def.path === 'fxIntervention' ||
    def.path === 'surplusPayout' ||
    def.path === 'immigrationLimit'
  const deltaDigits = def.step < 0.01 ? 1 : 0
  const deltaLabel = percentagePoints
    ? `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(deltaDigits)} PT`
    : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`
  const incidence = dialIncidence(def.path, delta, pub)

  return (
    <SliderField
      label={def.label}
      displayValue={def.fmt(value)}
      currentDisplayValue={def.fmt(current)}
      changeDisplayValue={deltaLabel}
      politicalCost={stagedCosts[key]}
      detail={incidence && <IncidenceNote incidence={incidence} />}
      dirty={dirty}
      hint={LEVER_COPY[def.path].hint}
      min={def.min}
      max={max}
      step={def.step}
      value={value}
      disabled={!pub.inPower}
      onStep={(direction) => setValue(value + direction * def.step)}
      onReset={() => stage(key, null)}
      onChange={(event) => setValue(Number(event.target.value))}
    />
  )
}
