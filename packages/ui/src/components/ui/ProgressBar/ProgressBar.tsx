export function ProgressBar({ value, label, tone = 'brass' }: { value: number; label: string; tone?: 'brass' | 'paper' | 'danger' }) {
  const pct = Math.max(0, Math.min(100, value * 100))
  const fill = tone === 'danger' ? 'bg-dossier-warn' : tone === 'paper' ? 'bg-dossier-paper' : 'bg-dossier-brass'
  return (
    <div className="h-1.5 overflow-hidden bg-dossier-paper/12" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      <div className={`h-full transition-[width] duration-300 ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
