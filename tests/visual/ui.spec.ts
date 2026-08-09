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

test('dense desktop rack fits every instrument name on one screen', async ({ page }) => {
  await openGame(page)
  // This project typechecks Playwright under the Node libs, so keep browser
  // globals inside the evaluated source string rather than adding DOM types to
  // the entire test suite.
  const fit = (await page.evaluate(`(() => {
    const doc = document.scrollingElement;
    const labels = [...document.querySelectorAll('.instrument-rack > button > span:nth-child(2)')];
    return {
      horizontalScroll: (doc?.scrollWidth ?? 0) > (doc?.clientWidth ?? 0),
      pageScroll: (doc?.scrollHeight ?? 0) > (doc?.clientHeight ?? 0),
      clippedLabels: labels
        .filter((label) => label.scrollWidth > label.clientWidth)
        .map((label) => label.textContent),
      rackBelowFold:
        (document.querySelector('.instrument-rack')?.getBoundingClientRect().bottom ?? 0) >
        window.innerHeight,
    };
  })()`)) as {
    horizontalScroll: boolean
    pageScroll: boolean
    clippedLabels: Array<string | null>
    rackBelowFold: boolean
  }
  expect(fit).toEqual({
    horizontalScroll: false,
    pageScroll: false,
    clippedLabels: [],
    rackBelowFold: false,
  })
})

test('cabinet draft review', async ({ page }) => {
  await openGame(page)
  await page.getByRole('button', { name: 'Increase Income' }).click()
  await expect(page.getByText('1 ORDER DRAFTED')).toBeVisible()
  await expect(page).toHaveScreenshot('cabinet-draft.png')
})

test('spending desk drafts CPI and official-GDP rules', async ({ page }) => {
  await openGame(page)
  await page.getByRole('tab', { name: 'SPENDING 4 CONTROLS' }).click()
  const transfers = page.getByRole('group', { name: 'Transfers spending rule' })
  const procurement = page.getByRole('group', { name: 'Procurement spending rule' })
  const gdpRule = procurement.getByRole('button', { name: '% GDP', exact: true })
  await expect(gdpRule).toBeDisabled()
  const advance = page.getByRole('button', { name: 'ADVANCE QUARTER' })
  for (const quarter of ['1946 Q2', '1946 Q3', '1946 Q4']) {
    await advance.click()
    await expect(page.getByText(quarter, { exact: true })).toBeVisible()
  }
  await expect(gdpRule).toBeEnabled()
  await transfers.getByRole('button', { name: 'CPI', exact: true }).click()
  await gdpRule.click()
  await page.getByRole('button', { name: 'Increase Procurement' }).click()
  await expect(transfers.getByRole('button', { name: 'CPI', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(procurement.getByRole('button', { name: '% GDP', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByText('2 ORDERS DRAFTED')).toBeVisible()
  await expect(page.getByRole('tabpanel')).not.toContainText('WHO IT REACHES')
  await page.getByRole('tabpanel').evaluate((panel) => {
    panel.scrollTop = 0
  })
  await expect(page).toHaveScreenshot('spending-rule-draft.png')
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
  const room = dialog.getByRole('tab', { name: 'THE ROOM 0 HOSTILE' })
  await expect(room).toHaveAttribute('aria-selected', 'true')
  await expect(room).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})
