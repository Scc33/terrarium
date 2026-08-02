import type { InputHTMLAttributes } from 'react'

export interface SliderFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  displayValue: string
  dirty?: boolean
  hint?: string
}

export function SliderField({ label, displayValue, dirty = false, hint, id, className = '', ...props }: SliderFieldProps) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div className={`grid grid-cols-[minmax(72px,0.75fr)_minmax(96px,1.4fr)_52px] items-center gap-2 ${className}`}>
      <label htmlFor={inputId} className="truncate font-mono text-[10px] tracking-wide text-dossier-paper/72 capitalize" title={hint}>
        {label}
      </label>
      <input id={inputId} type="range" aria-label={label} {...props} />
      <output htmlFor={inputId} className={`text-right font-mono text-[11px] font-medium tabular-nums ${dirty ? 'text-dossier-brass' : 'text-dossier-paper'}`}>
        {displayValue}
      </output>
    </div>
  )
}
