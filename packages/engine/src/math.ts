import { SECTOR_IDS, type SectorId } from './state/schema'

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

/** Solve Ax = b via Gaussian elimination with partial pivoting (n is tiny). */
export function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r
    }
    ;[M[col], M[pivot]] = [M[pivot], M[col]]
    const p = M[col][col]
    if (Math.abs(p) < 1e-12) throw new Error('singular matrix in solveLinear')
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col] / p
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]
    }
  }
  return M.map((row, i) => row[n] / M[i][i])
}

/** Required gross output x for final demand f: x = (I − A)⁻¹ f, clamped ≥ 0. */
export function leontiefGross(coeff: number[][], finalDemand: number[]): number[] {
  const n = finalDemand.length
  const ImA = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0) - coeff[i][j]),
  )
  return solveLinear(ImA, finalDemand).map((x) => Math.max(0, x))
}

export function sectorRecord<T>(fn: (id: SectorId, i: number) => T): Record<SectorId, T> {
  const out = {} as Record<SectorId, T>
  SECTOR_IDS.forEach((id, i) => {
    out[id] = fn(id, i)
  })
  return out
}

export function sumRecord(r: Partial<Record<string, number>>): number {
  let s = 0
  for (const k in r) s += r[k] ?? 0
  return s
}
