import { expect, test, type Page } from '@playwright/test'

async function openGame(page: Page, cabinetVisible = true) {
  await page.goto('/?seed=visual-regression')
  if (cabinetVisible) await expect(page.getByRole('complementary', { name: 'Cabinet controls' })).toBeVisible()
  else await expect(page.getByRole('button', { name: /OPEN CABINET/ })).toBeVisible()
  await page.evaluate('document.fonts.ready')
}

test('component gallery', async ({ page }) => {
  await page.goto('/?gallery=1')
  await expect(page.getByRole('heading', { name: 'Terrarium component gallery' })).toBeVisible()
  await page.evaluate('document.fonts.ready')
  await expect(page).toHaveScreenshot('component-gallery.png', { fullPage: true })
})

test('dashboard with empty instruments', async ({ page }) => {
  await openGame(page)
  await expect(page).toHaveScreenshot('dashboard-empty.png')
})

test('cabinet draft review', async ({ page }) => {
  await openGame(page)
  await page.getByRole('button', { name: 'Increase Income' }).click()
  await expect(page.getByText('1 ORDER DRAFTED')).toBeVisible()
  await expect(page).toHaveScreenshot('cabinet-draft.png')
})

test('financial overlay empty state', async ({ page }) => {
  await openGame(page)
  await page.getByRole('button', { name: 'FINANCE' }).click()
  await expect(page.getByRole('dialog', { name: 'THE FINANCIAL SYSTEM' })).toBeVisible()
  await expect(page).toHaveScreenshot('finance-overlay-empty.png')
})

test('tablet wall reflows to two instrument columns', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await openGame(page, false)
  await expect(page.getByText('WATCH BOARD', { exact: true })).toBeVisible()
  await expect(page).toHaveScreenshot('tablet-wall-768.png')
})

test('smaller laptop cabinet drawer', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await openGame(page, false)
  await page.getByRole('button', { name: /OPEN CABINET/ }).click()
  await expect(page.getByRole('complementary', { name: 'Cabinet controls' })).toBeVisible()
  await expect(page).toHaveScreenshot('cabinet-drawer-1024.png')
})
