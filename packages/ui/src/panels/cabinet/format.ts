/**
 * How a cabinet row prints a reading. These are the rail's own units — a rate
 * as a percentage, an appropriation as cash — and they are shared by the dial
 * mechanics beside them and by the rows that draw them.
 */

export const pct = (v: number) => `${(v * 100).toFixed(0)}%`
export const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`
/** The only signed reading on the rail. The sign IS the order — buy or sell —
 * so a bare "2.0%" would be exactly half of what the row says. */
export const pctSigned = (v: number) => `${v > 1e-9 ? '+' : ''}${(v * 100).toFixed(1)}%`
export const money = (v: number) => v.toFixed(1)
