/** A plain exact-data line in ink on paper — for the treasury's own books,
 * which carry no fog and deserve no phosphor. */

interface Props {
  data: Array<{ tick: number; value: number }>
  height?: number
  label?: string
  /** color a second reference series (e.g. outlays against revenue) */
  compare?: Array<{ tick: number; value: number }>
}

const qtrLabel = (q: number) => `${1946 + Math.floor(q / 4)} Q${(q % 4) + 1}`

export function InkLine({ data, height = 84, label, compare }: Props) {
  if (data.length < 2) return <div className="font-mono text-[10px] opacity-50">insufficient history</div>
  const W = 260
  const H = height
  const PAD_L = 34
  const PAD_R = 6
  const PAD_T = 6
  const PAD_B = 13
  const all = [...data, ...(compare ?? [])]
  let lo = Math.min(...all.map((d) => d.value))
  let hi = Math.max(...all.map((d) => d.value))
  if (hi - lo < 1e-9) {
    hi += 1
    lo -= 1
  }
  const x0 = data[0].tick
  const x1 = data[data.length - 1].tick
  const sx = (t: number) => PAD_L + ((t - x0) / Math.max(x1 - x0, 1)) * (W - PAD_L - PAD_R)
  const sy = (v: number) => PAD_T + ((hi - v) / (hi - lo)) * (H - PAD_T - PAD_B)
  const path = (xs: Array<{ tick: number; value: number }>) =>
    xs.map((d, i) => `${i === 0 ? 'M' : 'L'}${sx(d.tick).toFixed(1)},${sy(d.value).toFixed(1)}`).join(' ')
  const zeroVisible = lo < 0 && hi > 0

  return (
    <div>
      {label && (
        <div className="mb-0.5 flex items-baseline justify-between">
          <span className="font-mono text-[9px] tracking-[0.2em] text-dossier-ink/70">{label}</span>
          <span className="font-mono text-[10px] tabular-nums text-dossier-ink">
            {data[data.length - 1].value.toFixed(1)}
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
        <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={H - PAD_B} stroke="var(--color-dossier-ink)" strokeWidth="0.7" opacity="0.35" />
        <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} stroke="var(--color-dossier-ink)" strokeWidth="0.7" opacity="0.35" />
        {zeroVisible && (
          <line x1={PAD_L} x2={W - PAD_R} y1={sy(0)} y2={sy(0)} stroke="var(--color-dossier-ink)" strokeWidth="0.7" strokeDasharray="2 3" opacity="0.4" />
        )}
        <text x={PAD_L - 3} y={sy(hi) + 4} textAnchor="end" fontSize="7.5" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.6">
          {hi.toFixed(0)}
        </text>
        <text x={PAD_L - 3} y={sy(lo)} textAnchor="end" fontSize="7.5" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.6">
          {lo.toFixed(0)}
        </text>
        <text x={PAD_L} y={H - 3} fontSize="7.5" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.55">
          {qtrLabel(x0)}
        </text>
        <text x={W - PAD_R} y={H - 3} textAnchor="end" fontSize="7.5" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.55">
          {qtrLabel(x1)}
        </text>
        {compare && <path d={path(compare)} fill="none" stroke="var(--color-dossier-warn)" strokeWidth="1.1" opacity="0.8" />}
        <path d={path(data)} fill="none" stroke="var(--color-dossier-ink)" strokeWidth="1.2" />
      </svg>
    </div>
  )
}
