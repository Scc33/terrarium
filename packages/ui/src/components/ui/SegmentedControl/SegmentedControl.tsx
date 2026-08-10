export interface SegmentOption<T extends string> {
  value: T
  label: string
  title?: string
  disabled?: boolean
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
  tone = 'paper',
}: {
  value: T
  options: ReadonlyArray<SegmentOption<T>>
  onChange: (value: T) => void
  label: string
  tone?: 'paper' | 'inverted'
}) {
  return (
    <div className="inline-flex" role="group" aria-label={label}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            title={option.title}
            aria-pressed={selected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`-ml-px min-h-7 border px-2 py-1 font-mono text-[9px] tracking-[0.14em] first:ml-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-dossier-brass disabled:cursor-not-allowed disabled:opacity-30 ${
              tone === 'inverted'
                ? selected
                  ? 'z-[1] border-dossier-brass bg-dossier-paper text-dossier-ink'
                  : 'border-dossier-paper/25 bg-transparent text-dossier-paper/65 hover:border-dossier-brass hover:text-dossier-paper'
                : selected
                  ? 'z-[1] border-dossier-ink bg-dossier-ink text-dossier-paper'
                  : 'border-dossier-ink/25 bg-transparent text-dossier-ink/55 hover:border-dossier-ink hover:text-dossier-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
