import { expect, it } from 'vitest'
import { init, step } from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'
import { observe } from '@terrarium/observation'
import { publicAssetLines } from '../../packages/ui/src/publicAssets'

it('shows opening balances without inventing completed quarters or requiring surveys', () => {
  const pub = observe(init(standardCountry, 'opening-assets'))
  const bank = publicAssetLines(pub, 'bank')
  expect(bank[0].value).toBe(0)
  expect(bank[1].value).toBeGreaterThan(0)
  expect(bank.every((line) => line.points.length === 0)).toBe(true)
  expect(publicAssetLines(pub, 'treasury').map((line) => line.value)).toEqual([0, pub.treasury.debt])
})

it('reads stocks from exact books, with no ratio against hidden GDP or survey substitutions', () => {
  const pub = observe(step(init(standardCountry, 'asset-history')))
  pub.indicators = {}
  const [cash, debt] = publicAssetLines(pub, 'treasury')
  expect(cash.points).toEqual(pub.books.map((b) => ({ tick: b.tick, value: b.fund })))
  expect(debt.points[0].value).toBe(pub.treasury.debt)
  expect(publicAssetLines(pub, 'bank')[1].points[0].value).toBe(pub.reserves)
})
