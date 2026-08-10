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

/**
 * The screenshot is not enough on its own, and it is worth knowing why.
 *
 * `maxDiffPixelRatio: 0.01` over a 1280×2177 full-page render tolerates ~28k
 * differing pixels. A board slot is 213×218, and the header that shears is a
 * 213×26 band inside it — so the terminal ticker can drop every figure it
 * publishes off the right-hand edge and still compare EQUAL to a clean
 * baseline. That is not a tolerance to tighten: the suite runs on macOS
 * locally and Linux in CI, and the ratio is what absorbs the font rendering.
 *
 * So the shear gets asserted directly instead, as the invariant it actually
 * is: nothing inside a wall tile may paint past the tile's own edges. This is
 * the `verify-the-wall` overflow probe, run by the machine rather than by
 * hand — and unlike a pixel diff it is platform-independent and names the
 * element that broke.
 */
interface ShearReport {
  tile: string
  element: string
  text: string
  overRight: number
  overBottom: number
}

/** Passed to `page.evaluate` as source text, like the focus probe below: this
 * project has no DOM lib, so a callback would not typecheck. */
const SHEAR_PROBE = `(() => {
  const bad = []
  document.querySelectorAll('figure > div').forEach((slot) => {
    const tile = slot.firstElementChild
    if (!tile) return
    const box = tile.getBoundingClientRect()
    // only the fixed-size instrument slots; the wide chart figures flex
    if (Math.round(box.width) > 400) return
    tile.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      const overRight = r.right - box.right
      const overBottom = r.bottom - box.bottom
      if (overRight > 0.5 || overBottom > 0.5) {
        bad.push({
          tile: slot.parentElement?.querySelector('figcaption')?.textContent?.trim() ?? '?',
          element: el.tagName,
          text: (el.textContent ?? '').trim().slice(0, 40),
          overRight: Math.round(overRight),
          overBottom: Math.round(overBottom),
        })
      }
    })
  })
  return bad
})()`

test('no fitted instrument shears inside its board slot', async ({ page }) => {
  await page.goto('/?gallery=1')
  await expect(page.getByRole('heading', { name: 'Terrarium component gallery' })).toBeVisible()
  await page.evaluate('document.fonts.ready')

  const overflowing = (await page.evaluate(SHEAR_PROBE)) as ShearReport[]

  // guard against the assertion passing vacuously: the gallery must actually
  // be rendering fitted instruments for the probe to have looked at anything
  const slots = await page.locator('figure > div').count()
  expect(slots).toBeGreaterThan(0)
  expect(overflowing).toEqual([])
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
