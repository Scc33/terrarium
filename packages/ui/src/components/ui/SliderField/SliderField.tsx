import type { InputHTMLAttributes } from 'react'

export interface SliderFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  displayValue: string
  currentDisplayValue?: string
  changeDisplayValue?: string
  dirty?: boolean
  hint?: string
  politicalCost?: number
  onStep?: (direction: -1 | 1) => void
  onReset?: () => void
}

export function SliderField({
  label,
  displayValue,
  currentDisplayValue,
  changeDisplayValue,
  dirty = false,
  hint,
  politicalCost,
  onStep,
  onReset,
  id,
  className = '',
  disabled,
  ...props
}: SliderFieldProps) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div className={`border-l-2 px-2 py-1.5 transition-colors ${dirty ? 'border-dossier-brass bg-dossier-paper/[0.06]' : 'border-transparent'} ${className}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="truncate font-mono text-[10px] tracking-wide text-dossier-paper/72 capitalize" title={hint}>{label}</label>
        {dirty && (
          <span className="font-mono text-[8px] font-medium tracking-[0.12em] text-dossier-brass">
            DRAFTED{politicalCost !== undefined ? ` · ${politicalCost.toFixed(1)} PC` : ''}
          </span>
        )}
      </div>
      <div className="grid grid-cols-[24px_minmax(72px,1fr)_24px_52px] items-center gap-1.5">
        <button type="button" aria-label={`Decrease ${label}`} disabled={disabled || !onStep} onClick={() => onStep?.(-1)} className="h-6 border border-dossier-paper/20 font-mono text-sm leading-none text-dossier-paper/65 hover:border-dossier-brass hover:text-dossier-brass disabled:opacity-25">−</button>
        <input id={inputId} type="range" aria-label={label} disabled={disabled} {...props} />
        <button type="button" aria-label={`Increase ${label}`} disabled={disabled || !onStep} onClick={() => onStep?.(1)} className="h-6 border border-dossier-paper/20 font-mono text-sm leading-none text-dossier-paper/65 hover:border-dossier-brass hover:text-dossier-brass disabled:opacity-25">+</button>
        <output htmlFor={inputId} className={`text-right font-mono text-[11px] font-medium tabular-nums ${dirty ? 'text-dossier-brass' : 'text-dossier-paper'}`}>{displayValue}</output>
      </div>
      {dirty && (
        <div className="mt-1 flex items-center gap-1.5 font-mono text-[8px] tabular-nums text-dossier-paper/45">
          {currentDisplayValue && <span>WAS {currentDisplayValue}</span>}
          {changeDisplayValue && <span className="text-dossier-brass">{changeDisplayValue}</span>}
          <span className="flex-1" />
          {onReset && <button type="button" onClick={onReset} className="tracking-[0.1em] text-dossier-paper/55 hover:text-dossier-paper">RESET</button>}
        </div>
      )}
    </div>
  )
}
