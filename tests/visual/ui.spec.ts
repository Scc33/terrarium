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

test('unfitted instrument routes to its capacity investment', async ({ page }) => {
  await openGame(page)
  await page.getByRole('button', { name: 'Open Institutions to fund LABOUR FORCE SURVEY' }).click()
  await expect(page.getByRole('tabpanel')).toContainText('BUILD THE STATE THAT DELIVERS THE POLICY')
  await expect(page.getByRole('button', { name: 'ADVANCE QUARTER' })).toBeVisible()
  await expect(page).toHaveScreenshot('instrument-capacity-route.png')
})

test('financial overlay empty state', async ({ page }) => {
  await openGame(page)
  await page.getByRole('button', { name: 'FINANCE' }).click()
  await expect(page.getByRole('dialog', { name: 'THE FINANCIAL SYSTEM' })).toBeVisible()
  await expect(page).toHaveScreenshot('finance-overlay-empty.png')
})

test('modal paperwork contains and restores keyboard focus', async ({ page }) => {
  await openGame(page)
  const trigger = page.getByRole('button', { name: 'FINANCE' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'THE FINANCIAL SYSTEM' })
  await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  expect(await page.evaluate('document.querySelector(\'[role="dialog"]\')?.contains(document.activeElement)')).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
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

test('cabinet drawer tabs support keyboard navigation and focus return', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await openGame(page, false)
  const trigger = page.getByRole('button', { name: /OPEN CABINET/ })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Cabinet drawer' })
  const revenue = dialog.getByRole('tab', { name: 'REVENUE 4 CONTROLS' })
  await expect(revenue).toBeFocused()
  await revenue.press('End')
  const institutions = dialog.getByRole('tab', { name: 'INSTITUTIONS LONG-TERM' })
  await expect(institutions).toHaveAttribute('aria-selected', 'true')
  await expect(institutions).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})
