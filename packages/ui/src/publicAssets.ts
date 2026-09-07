/** Government-owned assets are exact books, not survey estimates. Keep each
 * stock on its own face: the sovereign fund cannot be spent defending the currency. */
import type { PublishedState } from '@terrarium/observation'

export interface PublicAssetLine {
  key: string
  label: string
  value: number
  note: string
  points: Array<{ tick: number; value: number }>
}

export function publicAssetLines(pub: PublishedState, book: 'bank' | 'treasury'): PublicAssetLine[] {
  const lines = book === 'bank' ? [
    { key: 'centralBankAssets' as const, label: 'PURCHASED ASSETS', value: pub.centralBank.assets,
      note: 'Assets bought with newly created central-bank money, held at purchase cost. Stopping purchases keeps the holdings; no sales, maturities or investment income are modeled.' },
    { key: 'reserves' as const, label: 'FOREIGN RESERVES', value: pub.reserves,
      note: 'Foreign exchange held on the central bank’s domestic-money book. Buying adds to it; defending the currency sells it. The book does not revalue past holdings when the exchange rate moves.' },
  ] : [
    { key: 'fund' as const, label: 'SOVEREIGN FUND', value: pub.treasury.fund,
      note: 'Surpluses saved after debt repayment and household rebates, invested abroad. Returns enter revenue. A later deficit draws the fund before borrowing or printing. This is separate from the central bank’s foreign reserves.' },
    { key: 'debt' as const, label: 'DEBT OUTSTANDING', value: pub.treasury.debt,
      note: 'Bonds still owed. A surplus repays these before adding to the fund; a deficit issues more only after available savings have been used.' },
  ]
  return lines.map((line) => ({
    ...line,
    // Worksheet ticks name completed quarters. Do not stamp today's dial
    // onto yesterday's closing balance, or invent a quarter-zero history.
    points: pub.books.map((row) => ({ tick: row.tick, value: row[line.key] })),
  }))
}
