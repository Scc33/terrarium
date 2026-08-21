/**
 * The expenditure accounts, arranged for reading — who the economy's output
 * is actually for.
 *
 * Pure for the usual reason (see `shares.ts`): the arithmetic here decides
 * what the pie says, and a wedge computed wrong draws a perfectly convincing
 * chart of the wrong country. `tests/ui/accounts.test.ts` pins it.
 *
 * The three shares are three SEPARATE surveys of one identity, so they do not
 * sum to 100 and this module never pretends otherwise. Two things follow, and
 * both are deliberate:
 *
 *  - the donut renormalizes (that is `donutSlices`' job), so the mix is always
 *    readable even when the office's arithmetic is off;
 *  - `publishedSum` is surfaced rather than hidden, because the gap is real
 *    information. Part of it is survey error and part of it is the state's own
 *    purchases, which are never published as a share — they are under 1% of
 *    final expenditure in this economy and the treasury's exact books are a
 *    far better account of the government's footprint than a fogged sliver.
 */

import type { IndicatorId, PublishedState } from '@terrarium/observation'
import { shapeSeries } from './components/series'
import { SHARE_INKS, type Share, type StackRow } from './shares'

/** draw order, and the order the pie is wound in */
export const ACCOUNT_IDS = ['consumption_share', 'investment_share', 'export_share'] as const
export type AccountId = (typeof ACCOUNT_IDS)[number]

/** The printed face of the expenditure side. A total `Record` over the ids
 * above, so a fourth account cannot be published without being named here. */
export const ACCOUNT_FACE: Record<AccountId, { label: string; ink: string; note: string }> = {
  consumption_share: {
    label: 'Households',
    ink: SHARE_INKS[0],
    note: 'Goods and services bought by households. A lower share can mean more output is going to investment or exports.',
  },
  investment_share: {
    label: 'Capital formation',
    ink: SHARE_INKS[1],
    note: 'New factories, machines and public works. A larger share can support future growth.',
  },
  export_share: {
    label: 'Exports',
    ink: SHARE_INKS[2],
    note: 'Goods and services bought by other countries. A larger share brings more exposure to world demand.',
  },
}

export interface AccountReading {
  key: AccountId
  label: string
  ink: string
  note: string
  /** latest published share, in percentage points */
  value: number
  /** the office's confessed half-width on that print; 0 when it cannot say */
  errorBand: number
  /** the quarter the print measures (not the quarter it was released) */
  forQtr: number
  /** percentage points since the first quarter the accounts were compiled —
   * the answer to "what kind of economy am I turning into", which no single
   * quarter's pie can give */
  sinceFirst: number
}

/**
 * The latest print of each account, or `null` when the office has not
 * compiled the expenditure accounts at all. All-or-nothing on purpose: the
 * three unlock together because they are one publication, so a partial mix
 * would mean a bug rather than a poor ministry.
 */
export function readAccounts(pub: PublishedState): AccountReading[] | null {
  const out: AccountReading[] = []
  for (const key of ACCOUNT_IDS) {
    const series = pub.indicators[key as IndicatorId]
    if (!series) return null
    const points = shapeSeries(series, Number.MAX_SAFE_INTEGER, pub.tick)
    if (points.length === 0) return null
    const latest = points[points.length - 1]
    out.push({
      key,
      ...ACCOUNT_FACE[key],
      value: latest.value,
      errorBand: latest.errorBand,
      forQtr: latest.forQtr,
      sinceFirst: latest.value - points[0].value,
    })
  }
  return out
}

/** what the donut needs, from what `readAccounts` returned */
export function toShares(readings: readonly AccountReading[]): Share[] {
  return readings.map((r) => ({ key: r.key, label: r.label, value: r.value, ink: r.ink, note: r.note }))
}

/**
 * The century of the mix, one row per quarter the office published all three.
 *
 * Quarters with a partial set are dropped rather than zero-filled: a missing
 * survey drawn as a zero band would read as "capital formation collapsed",
 * which is the single most misleading thing this chart could say.
 */
export function accountRows(pub: PublishedState): StackRow[] {
  const byQtr = new Map<number, Partial<Record<AccountId, number>>>()
  for (const key of ACCOUNT_IDS) {
    const series = pub.indicators[key as IndicatorId]
    if (!series) return []
    for (const p of shapeSeries(series, Number.MAX_SAFE_INTEGER, pub.tick)) {
      const row = byQtr.get(p.forQtr) ?? {}
      // a share printed negative is the office being wrong, not the economy
      // running backwards; clamp so it cannot punch a hole in the band
      row[key] = Math.max(0, p.value)
      byQtr.set(p.forQtr, row)
    }
  }
  return [...byQtr.entries()]
    .filter(([, values]) => ACCOUNT_IDS.every((id) => values[id] !== undefined))
    .sort((a, b) => a[0] - b[0])
    .map(([tick, values]) => ({ tick, values: values as Record<string, number> }))
}

/**
 * What the three prints add up to. Never exactly 100: the shortfall is the
 * state's own final consumption plus whatever the surveys got wrong, and
 * showing it is the honest alternative to quietly scaling it away.
 */
export function publishedSum(readings: readonly AccountReading[]): number {
  return readings.reduce((sum, r) => sum + r.value, 0)
}
