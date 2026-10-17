import { expect, test, type Page } from '@playwright/test'
import { BRIEFED_KEY } from '../../packages/ui/src/walkthrough'

async function office(page: Page, name: string) {
  const menu = page.locator('summary').filter({ hasText: 'OFFICES' })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('button', { name, exact: true }).click()
}

async function scenario(page: Page, statistical: string) {
  await page.keyboard.press('Backquote')
  await page.getByRole('spinbutton', { name: 'STATISTICAL', exact: true }).fill(statistical)
  await page.getByRole('button', { name: 'RUN SCENARIO', exact: true }).click()
  await page.getByRole('button', { name: 'Close developer console', exact: true }).click()
  for (let q = 0; q < 12; q++) await page.getByRole('button', { name: 'ADVANCE QUARTER' }).click()
}

test('per-person capital and the wealth balance sheet use the published census without clipping', async ({ page }, testInfo) => {
  test.setTimeout(60_000)
  await page.addInitScript({ content: `localStorage.setItem(${JSON.stringify(BRIEFED_KEY)}, '1')` })
  await page.goto('/?seed=wealth-per-person')
  await expect(page.getByRole('button', { name: 'ADVANCE QUARTER' })).toBeVisible()
  await scenario(page, '0.1')
  await office(page, 'WEALTH')
  await expect(page.getByText('THE ASSET SURVEY IS NOT YET FUNDED')).toBeVisible()
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()

  await scenario(page, '1')
  const basis = page.getByRole('button', { name: 'Show eligible totals per person' })
  await basis.click()
  await expect(basis).toHaveAttribute('aria-pressed', 'true')
  await page.locator('.instrument-rack button').filter({ hasText: 'CAP/HEAD' }).click()
  await expect(page.getByText('CAP.PERSON REAL', { exact: true })).toBeVisible()
  const wall = await page.evaluate(`(() => {
    const wall = document.querySelector('.instrument-wall');
    const box = wall.getBoundingClientRect();
    return { scrolls: wall.scrollHeight > box.height + 1,
      belowFold: [...wall.querySelectorAll('*')].filter(el => { const r = el.getBoundingClientRect(); return r.height > 0 && r.bottom > box.bottom + 1; }).length };
  })()`)
  expect(wall).toEqual({ scrolls: false, belowFold: 0 })
  await page.screenshot({ path: testInfo.outputPath('per-person-wall.png') })

  await office(page, 'WEALTH')
  const dialog = page.getByRole('dialog', { name: 'WEALTH — ASSETS AND THEIR CLAIMS' })
  await expect(dialog.getByText('CURRENT MONEY / PERSON', { exact: true }).first()).toBeVisible()
  const expected = await page.evaluate<number>(`(async () => {
    const { useGame } = await import('/src/store/gameStore.ts');
    const pub = useGame.getState().published;
    const latest = [...pub.wealth].sort((a,b) => a.forQtr-b.forQtr || a.revision-b.revision).at(-1);
    const population = pub.census.find(row => row.tick === latest.forQtr).population;
    return latest.household.netWorth / population;
  })()`)
  await expect(dialog.locator('tfoot td').first()).toHaveText(expected.toFixed(2))
  await page.screenshot({ path: testInfo.outputPath('wealth-per-person.png') })
  const bounds = await dialog.boundingBox()
  expect(bounds!.y).toBeGreaterThanOrEqual(0)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(720)
  const sourceNote = await dialog.getByText(/^ASSET SURVEY ·/).boundingBox()
  expect(sourceNote!.y + sourceNote!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height)
  await dialog.getByRole('group', { name: 'Wealth population basis' }).getByRole('button', { name: 'TOTALS', exact: true }).click()
  await expect(dialog.getByText('CURRENT MONEY · TOTAL', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()

  await office(page, 'INDUSTRY')
  await page.getByRole('group', { name: 'Industry population basis' }).getByRole('button', { name: 'PER PERSON', exact: true }).click()
  await expect(page.getByText(/REAL OUTPUT \/ PERSON \/ QTR/)).toBeVisible()
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()

  await office(page, 'FINANCE')
  await page.getByRole('button', { name: 'CENTRAL BANK', exact: true }).click()
  await expect(page.getByText('MONEY / PERSON · EXACT BOOK', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await page.getByRole('button', { name: 'Open the full treasury ledger', exact: true }).click()
  await page.getByRole('group', { name: 'Chart mode' }).getByRole('button', { name: 'PER PERSON', exact: true }).click()
  await expect(page.getByText('PER PERSON · MONEY / QTR', { exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('treasury-per-person.png') })
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()

  await scenario(page, '0.35')
  await expect(page.getByText('CAPITAL PER PERSON', { exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('per-person-dossier.png') })
})
