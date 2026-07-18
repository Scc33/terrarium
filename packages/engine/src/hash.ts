/**
 * Deterministic state hashing for golden replays. Numbers are rounded to 10
 * significant digits before hashing so serialization noise can't flake a
 * test; object key order follows construction order, which the pipeline
 * keeps stable.
 */

export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    typeof v === 'number' && Number.isFinite(v) ? Number(v.toPrecision(10)) : v,
  )
}

/** FNV-1a 32-bit, hex string. */
export function hashState(value: unknown): string {
  const str = stableStringify(value)
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
