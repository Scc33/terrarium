/**
 * An appropriation, which is a rule rather than a number: fixed cash, indexed
 * to the official inflation print, or a share of the officially published
 * nominal GDP. The row shows the rule the cabinet has voted alongside what it
 * resolves to this quarter, because those are different facts and only the
 * first one is a decision.
 */

import type { SpendingProgramId, SpendingRuleMode } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { SegmentedControl, SliderField } from '../../components/ui'
import { useGame } from '../../store/gameStore'
import { LEVER_COPY } from '../../levers'
import { dialIncidence } from '../../incidence'
import {
  currentRuleValue,
  equivalentRuleValue,
  latestOfficialNominalGdp,
  proposedSpending,
} from '../../spendingRules'
import type { DialDef } from './dials'
import { money } from './format'
import { IncidenceNote } from './IncidenceNote'

const SPENDING_MODES: ReadonlyArray<{
  value: SpendingRuleMode
  label: string
  title: string
}> = [
  { value: 'fixed', label: 'FIXED', title: 'Hold the nominal cash amount until the cabinet changes it.' },
  { value: 'indexed', label: 'CPI', title: 'Move with each new first-release official inflation print.' },
  { value: 'gdpShare', label: '% GDP', title: 'Claim a share of the latest officially published nominal GDP.' },
]

function ruleValueLabel(mode: SpendingRuleMode, value: number): string {
  return mode === 'gdpShare' ? `${(value * 100).toFixed(1)}%` : money(value)
}

export function SpendingRuleRow({ def, pub }: { def: DialDef; pub: PublishedState }) {
  const { staged, stagedCosts, stage } = useGame()
  const programme = def.path.slice('spending.'.length) as SpendingProgramId
  const key = `dial:${def.path}`
  const stagedAction = staged.get(key)
  const draft = stagedAction?.kind === 'setSpendingRule' ? stagedAction : null
  const currentRule = pub.spendingRules[programme]
  const currentAmount = pub.dials.spending[programme]
  const mode = draft?.mode ?? currentRule.kind
  const value = draft?.value ?? currentRuleValue(pub, programme)
  const basis = latestOfficialNominalGdp(pub)
  const proposedAmount = proposedSpending(pub, mode, value) ?? currentAmount
  const dirty = draft !== null

  const stageRule = (nextMode: SpendingRuleMode, rawValue: number) => {
    const nextValue = Math.max(0, Number(rawValue.toFixed(8)))
    const isCurrent =
      nextMode === currentRule.kind &&
      Math.abs(nextValue - currentRuleValue(pub, programme)) < 1e-9
    stage(
      key,
      isCurrent
        ? null
        : { kind: 'setSpendingRule', programme, mode: nextMode, value: nextValue },
    )
  }

  const onMode = (nextMode: SpendingRuleMode) => {
    if (nextMode === mode) return
    const equivalent = equivalentRuleValue(pub, programme, nextMode)
    if (equivalent !== null) stageRule(nextMode, equivalent)
  }

  const isShare = mode === 'gdpShare'
  const min = 0
  const max = isShare ? 0.5 : def.max(pub)
  const step = isShare ? 0.005 : def.step
  const setValue = (raw: number) => {
    const stepped = min + Math.round((raw - min) / step) * step
    stageRule(mode, Math.min(max, Math.max(min, stepped)))
  }
  const delta = proposedAmount - currentAmount
  // A mode conversion preserves the current amount, but rounding a GDP share
  // can leave sub-cent noise. Do not describe an invisible bookkeeping fleck
  // as a household consequence.
  const incidence = Math.abs(delta) >= 0.005 ? dialIncidence(def.path, delta, pub) : null
  const currentValue = currentRuleValue(pub, programme)
  const ruleStatus =
    currentRule.kind === 'fixed'
      ? `FIXED CASH · ${currentAmount.toFixed(1)} / QTR`
      : currentRule.kind === 'indexed'
        ? `CPI INDEXED · ${currentAmount.toFixed(1)} / QTR · ${currentRule.lastIndexedForQtr === null ? 'AWAITING FIRST PRINT' : `LAST PRINT Q${currentRule.lastIndexedForQtr}`}`
        : `${(currentRule.share * 100).toFixed(1)}% OF OFFICIAL GDP · ${currentAmount.toFixed(1)} / QTR${basis ? ` · GDP Q${basis.forQtr}` : ' · AWAITING ACCOUNTS'}`

  return (
    <div className={`border ${dirty ? 'border-dossier-brass bg-dossier-paper/[0.05]' : 'border-dossier-paper/10 bg-[#22382d]/20'}`}>
      <div className="flex items-center justify-between gap-2 px-2 pt-2">
        <span className="font-mono text-[8px] tracking-[0.14em] text-dossier-paper/45">APPROPRIATION</span>
        <SegmentedControl
          label={`${def.label} spending rule`}
          value={mode}
          tone="inverted"
          options={SPENDING_MODES.map((option) => ({
            ...option,
            disabled: option.value === 'gdpShare' && basis === null,
            title:
              option.value === 'gdpShare' && basis === null
                ? 'Fund national accounts before writing a GDP-share rule.'
                : option.title,
          }))}
          onChange={onMode}
        />
      </div>
      <SliderField
        label={def.label}
        displayValue={ruleValueLabel(mode, value)}
        currentDisplayValue={ruleValueLabel(currentRule.kind, currentValue)}
        changeDisplayValue={`${delta >= 0 ? '+' : ''}${delta.toFixed(1)} / QTR`}
        politicalCost={stagedCosts[key]}
        detail={incidence && <IncidenceNote incidence={incidence} />}
        dirty={dirty}
        hint={`${LEVER_COPY[def.path].hint} ${SPENDING_MODES.find((option) => option.value === mode)?.title}`}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={!pub.inPower}
        onStep={(direction) => setValue(value + direction * step)}
        onReset={() => stage(key, null)}
        onChange={(event) => setValue(Number(event.target.value))}
        className="border-l-0 bg-transparent"
      />
      <div className="px-2 pb-2 font-mono text-[8px] leading-snug tracking-[0.06em] text-dossier-paper/42">
        CURRENT RULE · {ruleStatus}
      </div>
    </div>
  )
}
