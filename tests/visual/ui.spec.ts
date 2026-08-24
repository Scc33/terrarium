import { expect, test, type Page } from '@playwright/test'
import { BRIEFED_KEY } from '../../packages/ui/src/walkthrough'

/** Every screenshot below is taken in a browser that has never run the game,
 * which is precisely the browser the opening walkthrough introduces itself in
 * (#33). Mark it briefed before the app mounts, so these shots stay pictures
 * of the war room rather than of the tour card. The tour has a shot of its
 * own, at the bottom of this file. */
async function openGame(page: Page, cabinetVisible = true) {
  await page.addInitScript({ content: `localStorage.setItem(${JSON.stringify(BRIEFED_KEY)}, '1')` })
  await page.goto('/?seed=visual-regression')
  if (cabinetVisible) await expect(page.getByRole('complementary', { name: 'Cabinet controls' })).toBeVisible()
  else await expect(page.getByRole('button', { name: /OPEN CABINET/ })).toBeVisible()
  await page.evaluate('document.fonts.ready')
}

async function officeButton(page: Page, name: string) {
  const offices = page.locator('summary').filter({ hasText: 'OFFICES' })
  if (await offices.isVisible()) await offices.click()
  return page.getByRole('button', { name, exact: true })
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
 * `maxDiffPixelRatio: 0.01` over a full-page gallery render tolerates ~28k
 * differing pixels. A board slot is 213×218, and the name/readout bands that
 * shear are ~213×26 each — so the terminal ticker can drop every figure it
 * publishes off the right-hand edge and still compare EQUAL to a clean
 * baseline. Measured, not assumed: the suite passed a fixed render against a
 * sheared one. That is not a tolerance to tighten, either — the suite runs on
 * macOS locally and Linux in CI, and the ratio is what absorbs the font
 * rendering.
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

test('rolling chart mode remains legible inside a fitted board slot', async ({ page }) => {
  await page.goto('/?gallery=1')
  await expect(page.getByRole('heading', { name: 'Terrarium component gallery' })).toBeVisible()
  await page.evaluate('document.fonts.ready')

  const viewButtons = page.getByRole('button', { name: /^Chart view:/ })
  const count = await viewButtons.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    const button = viewButtons.nth(i)
    for (let click = 0; click < 4; click++) await button.click()
    await expect(button).toHaveText('R12M')
  }

  const rollingChart = page.getByRole('img', { name: /Rolling 12-month mean/ }).first()
  await expect(rollingChart).toBeVisible()
  expect((await page.evaluate(SHEAR_PROBE)) as ShearReport[]).toEqual([])

  const gdpTicker = page
    .locator('figure')
    .filter({ hasText: 'TERMINAL · REAL GDP GROWTH' })
    .locator('> div')
  await expect(gdpTicker).toHaveScreenshot('rolling-chart-12m.png')
})

test('time-series charts compare a dragged or keyboard-selected range', async ({ page }) => {
  await page.goto('/?gallery=1')
  await expect(page.getByRole('heading', { name: 'Terrarium component gallery' })).toBeVisible()
  await page.evaluate('document.fonts.ready')

  const chart = page.getByRole('img', { name: /REAL GDP GROWTH.*most recent 40 quarters/ }).first()
  await chart.scrollIntoViewIfNeeded()
  // Map exact viewBox endpoints through the browser's screen CTM. The square
  // terminal viewBox is letterboxed in its fitted board slot; a component
  // that divides by the CSS bounding-box width snaps to the wrong releases.
  const box = await chart.boundingBox()
  expect(box).not.toBeNull()
  const scale = Math.min(box!.width / 300, box!.height / 300)
  const meetX = box!.x + (box!.width - 300 * scale) / 2
  const meetY = box!.y + (box!.height - 300 * scale) / 2
  const endpoints = {
    start: { x: meetX + 34 * scale, y: meetY + 150 * scale },
    end: { x: meetX + 292 * scale, y: meetY + 150 * scale },
  }

  await page.mouse.move(endpoints!.start.x, endpoints!.start.y)
  await page.mouse.down()
  await page.mouse.move(endpoints!.end.x, endpoints!.end.y, { steps: 8 })
  await page.mouse.up()

  const chartBox = chart.locator('..')
  const readout = chartBox.locator('[data-chart-range-readout]')
  await expect(readout).toBeVisible()
  await expect(readout).toContainText('2040 Q1 → 2049 Q4')
  await expect(readout).toContainText('Δ')
  await expect(readout).toContainText('RANGE')
  await expect(chart.locator('[data-chart-range]')).toHaveCount(1)
  await expect(chart).toHaveClass(/touch-pan-y/)

  await chart.press('Escape')
  await expect(readout).toHaveCount(0)
  await chart.press('Shift+ArrowLeft')
  await expect(chartBox.locator('[data-chart-range-readout]')).toBeVisible()

  const gdpTicker = page
    .locator('figure')
    .filter({ hasText: 'TERMINAL · REAL GDP GROWTH' })
    .locator('> div')
  await expect(gdpTicker).toHaveScreenshot('chart-range-selection.png')
  expect((await page.evaluate(SHEAR_PROBE)) as ShearReport[]).toEqual([])
})

test('compact charts keep the range readout clear of most of the trace', async ({ page }) => {
  await page.goto('/?gallery=1')
  await expect(page.getByRole('heading', { name: 'Terrarium component gallery' })).toBeVisible()
  await page.evaluate('document.fonts.ready')

  const chart = page.getByRole('img', { name: /Series from 1946 Q1 to 1950 Q1/ }).first()
  await chart.scrollIntoViewIfNeeded()
  const box = await chart.boundingBox()
  expect(box).not.toBeNull()

  await page.mouse.move(box!.x + box!.width * 0.2, box!.y + box!.height * 0.6)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width * 0.8, box!.y + box!.height * 0.6, { steps: 6 })
  await page.mouse.up()

  const chartBox = chart.locator('..')
  const readout = chartBox.locator('[data-chart-range-readout-layout="compact"]')
  await expect(readout).toBeVisible()
  await expect(readout).toContainText('Δ')
  await expect(readout).toContainText('R ')

  const readoutBox = await readout.boundingBox()
  expect(readoutBox).not.toBeNull()
  expect(readoutBox!.height).toBeLessThan(box!.height * 0.55)
  await expect(chartBox).toHaveScreenshot('compact-chart-range.png')
})

test('ledger chart inspection does not activate the ledger tile', async ({ page }) => {
  await openGame(page)
  const advance = page.getByRole('button', { name: 'ADVANCE QUARTER' })
  for (const quarter of ['1946 Q2', '1946 Q3']) {
    await advance.click()
    await expect(page.getByText(quarter, { exact: true })).toBeVisible()
  }

  const openLedger = page.getByRole('button', { name: 'Open the full treasury ledger' })
  const tile = openLedger.locator('..')
  const chart = tile.locator('[data-chart-interactive]')
  await expect(chart).toBeVisible()
  await expect(openLedger.locator('[data-chart-interactive]')).toHaveCount(0)

  const box = await chart.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width * 0.25, box!.y + box!.height * 0.55)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width * 0.75, box!.y + box!.height * 0.55, { steps: 6 })
  await page.mouse.up()

  await expect(tile.locator('[data-chart-range-readout]')).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'THE TREASURY LEDGER — FULL HISTORY, EXACT' })).toHaveCount(0)

  await openLedger.click()
  await expect(page.getByRole('dialog', { name: 'THE TREASURY LEDGER — FULL HISTORY, EXACT' })).toBeVisible()
})

test('ledger explains revenue per tax-rate point beside the column', async ({ page }) => {
  await openGame(page)
  await page.getByRole('button', { name: 'Open the full treasury ledger' }).click()

  const ledger = page.getByRole('dialog', { name: 'THE TREASURY LEDGER — FULL HISTORY, EXACT' })
  const help = ledger.getByRole('button', { name: 'Explain Revenue per 1% tax rate' })
  await expect(help).toHaveText('PER 1% ⓘ')
  await help.hover()
  await expect(page.getByRole('tooltip')).toContainText('Quarterly revenue for each percentage point')
})

test('dashboard with empty instruments', async ({ page }) => {
  await openGame(page)
  await expect(page).toHaveScreenshot('dashboard-empty.png')
})

test('header keeps every reading visible with all standing orders', async ({ page }) => {
  await page.setViewportSize({ width: 1493, height: 720 })
  await page.addInitScript({ content: `localStorage.setItem(${JSON.stringify(BRIEFED_KEY)}, '1')` })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Choose your posting' })).toBeVisible()
  await page.getByRole('radio', { name: /Costona/ }).click()
  await page.getByRole('group', { name: 'Year of appointment' }).getByRole('button', { name: '2005' }).click()
  await page.getByText('STANDING ORDERS', { exact: true }).click()
  await page.getByRole('group', { name: 'TENURE' }).getByRole('button', { name: 'GOD MODE' }).click()
  await page.getByRole('group', { name: 'INSTRUMENTS' }).getByRole('button', { name: 'ALL FITTED' }).click()
  await page.getByRole('group', { name: 'CABINET' }).getByRole('button', { name: 'UNLIMITED' }).click()
  await page.getByPlaceholder('blank draws a new code').fill('header-regression')
  await page.getByRole('button', { name: /^ACCEPT POSTING/ }).click()
  await expect(page.getByRole('complementary', { name: 'Cabinet controls' })).toBeVisible()
  await page.evaluate('document.fonts.ready')

  const fitAt = async (width: number) => {
    await page.setViewportSize({ width, height: 720 })
    return page.evaluate(`(() => {
      const header = document.querySelector('header');
      const metrics = document.querySelector('[data-header-metrics]');
      const edge = metrics?.getBoundingClientRect().right ?? 0;
      return {
        headerScrolls: (header?.scrollWidth ?? 0) > (header?.clientWidth ?? 0) + 1,
        metricsScroll: (metrics?.scrollWidth ?? 0) > (metrics?.clientWidth ?? 0) + 1,
        clippedGroups: [...(metrics?.querySelectorAll('section') ?? [])]
          .filter((group) => group.getBoundingClientRect().right > edge + 1)
          .map((group) => group.getAttribute('aria-label')),
      };
    })()`)
  }

  expect(await fitAt(768)).toEqual({ headerScrolls: false, metricsScroll: false, clippedGroups: [] })
  expect(await fitAt(1280)).toEqual({ headerScrolls: false, metricsScroll: false, clippedGroups: [] })
  expect(await fitAt(1493)).toEqual({ headerScrolls: false, metricsScroll: false, clippedGroups: [] })
  expect(await fitAt(2048)).toEqual({ headerScrolls: false, metricsScroll: false, clippedGroups: [] })
  await page.setViewportSize({ width: 1493, height: 720 })
  await expect(page.locator('summary').filter({ hasText: 'OFFICES' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Explain 3 standing orders in force' })).toBeVisible()
  await expect(page.locator('header')).toHaveScreenshot('header-all-rules-1493.png')
})

test('dense desktop rack fits every instrument name on one screen', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await openGame(page)
  // The pending-state rack is the easy case: every strip ends in the short
  // word PENDING. Fill the office and let real values, deltas and release ages
  // arrive — those are the tracks that can squeeze a ten-character name out
  // of the six-column desktop roster.
  await page.keyboard.press('Backquote')
  await page.getByRole('spinbutton', { name: 'STATISTICAL', exact: true }).fill('1')
  await page.getByRole('button', { name: 'RUN SCENARIO', exact: true }).click()
  await page.getByRole('button', { name: 'Close developer console', exact: true }).click()
  const advance = page.getByRole('button', { name: 'ADVANCE QUARTER' })
  for (let i = 0; i < 12; i++) await advance.click()
  await expect(page.getByText('1949 Q1', { exact: true })).toBeVisible()
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
        .map((label) => ({
          text: label.textContent,
          scrollWidth: label.scrollWidth,
          clientWidth: label.clientWidth,
        })),
      rackBelowFold:
        (document.querySelector('.instrument-rack')?.getBoundingClientRect().bottom ?? 0) >
        window.innerHeight,
    };
  })()`)) as {
    horizontalScroll: boolean
    pageScroll: boolean
    clippedLabels: Array<{ text: string | null; scrollWidth: number; clientWidth: number }>
    rackBelowFold: boolean
  }
  expect(fit).toEqual({
    horizontalScroll: false,
    pageScroll: false,
    clippedLabels: [],
    rackBelowFold: false,
  })
  expect(browserErrors).toEqual([])
})

test('cabinet draft review', async ({ page }) => {
  await openGame(page)
  await page.getByRole('button', { name: 'Increase Income' }).click()
  await expect(page.getByText('1 ORDER DRAFTED')).toBeVisible()
  await expect(page).toHaveScreenshot('cabinet-draft.png')
})

test('central bank exposes conventional, QE, and macroprudential controls', async ({ page }) => {
  await openGame(page)
  await page.getByRole('tab', { name: 'CENTRAL BANK 3 CONTROLS' }).click()
  await expect(page.getByRole('slider', { name: 'Policy rate' })).toHaveValue('0.04')
  await expect(page.getByRole('slider', { name: 'Asset purchases' })).toHaveValue('0')
  await expect(page.getByRole('slider', { name: 'Bank capital floor' })).toHaveValue('0.06')
  await expect(page).toHaveScreenshot('central-bank-controls.png')
})

test('migration desk exposes the annual immigration ceiling', async ({ page }) => {
  await openGame(page)
  await page.getByRole('tab', { name: 'BORDERS 1 CONTROL' }).click()
  const ceiling = page.getByRole('slider', { name: 'Immigration ceiling' })
  await expect(ceiling).toHaveValue('0.012')
  await expect(ceiling).toHaveAttribute('max', '0.02')
  await page.getByRole('button', { name: 'Decrease Immigration ceiling' }).click()
  await expect(page.getByText('1 ORDER DRAFTED')).toBeVisible()
  await expect(page).toHaveScreenshot('migration-controls.png')
})

test('the statute book shows what was written beside what is obeyed', async ({ page }) => {
  await openGame(page)
  await page.getByRole('tab', { name: 'STATUTES 0 IN FORCE' }).click()

  // The two figures that make a statute different from a dial: the rung and
  // the compliance. In 1946 Meridia the civil service is thin, so the drawer
  // should be saying out loud that a law written today would be widely evaded.
  const ladder = page.getByRole('group', { name: 'Minimum wage level' })
  await expect(ladder.getByRole('button', { name: /No statutory wage/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByText('Widely evaded').first()).toBeVisible()

  // …and the ladder is climbed a rung at a time, because the top rung costs
  // more than a new government is holding
  await ladder.getByRole('button', { name: /Subsistence floor/ }).click()
  await expect(page.getByText('1 ORDER DRAFTED')).toBeVisible()
  await expect(page).toHaveScreenshot('statute-book.png')
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
  await page.getByRole('button', { name: 'Collapse cabinet controls' }).click()
  await page.getByRole('button', { name: 'Open Institutions to fund LABOUR FORCE SURVEY' }).click()
  await expect(page.getByRole('button', { name: 'Expand cabinet controls' })).toBeHidden()
  await expect(page.getByRole('tabpanel')).toContainText('BUILD THE STATE THAT DELIVERS THE POLICY')
  await expect(page.getByRole('button', { name: 'ADVANCE QUARTER' })).toBeVisible()
  await expect(page).toHaveScreenshot('instrument-capacity-route.png')
})

test('financial overlay empty state', async ({ page }) => {
  await openGame(page)
  await (await officeButton(page, 'FINANCE')).click()
  await expect(page.getByRole('dialog', { name: 'THE FINANCIAL SYSTEM' })).toBeVisible()
  await expect(page).toHaveScreenshot('finance-overlay-empty.png')
})

test('financial overlay plots the position and the stance once surveyed', async ({ page }) => {
  // The empty state above proves the brass plates. This proves the figures —
  // and specifically the one thing no unit test can see: that the shaded
  // fragility corner is drawn against the same axes as the trail, so a dot
  // outside it really is outside it. The phase chart is the only figure in
  // the game whose x axis is not time, so it has no existing baseline to
  // inherit correctness from.
  await openGame(page)
  await page.keyboard.press('Backquote')
  await page.getByRole('spinbutton', { name: 'STATISTICAL', exact: true }).fill('1')
  await page.getByRole('button', { name: 'RUN SCENARIO', exact: true }).click()
  await page.getByRole('button', { name: 'Close developer console', exact: true }).click()

  const advance = page.getByRole('button', { name: 'ADVANCE QUARTER' })
  for (let i = 0; i < 12; i++) await advance.click()

  // `exact` matters here and not in the empty-state test above: once the rack
  // is fitted, the consumer-confidence strip's aria-label contains the word
  // "finances" and a loose name match resolves to two elements.
  await (await officeButton(page, 'FINANCE')).click()
  const finance = page.getByRole('dialog', { name: 'THE FINANCIAL SYSTEM' })
  await expect(finance.getByText('WHERE THE COUNTRY STANDS', { exact: true })).toBeVisible()
  await expect(page).toHaveScreenshot('finance-overlay-position.png')

  await finance.getByRole('button', { name: 'THE STANCE', exact: true }).click()
  // exact, unrevised, and available whether or not a survey was ever funded
  await expect(finance.getByText('POLICY RATE · %', { exact: true })).toBeVisible()
  await expect(page).toHaveScreenshot('finance-overlay-stance.png')

  await finance.getByRole('button', { name: 'THE BANKS', exact: true }).click()
  await expect(
    finance.getByText('BANK CAPITAL · % OF CREDIT, AGAINST YOUR FLOOR', { exact: true }),
  ).toBeVisible()
  await expect(page).toHaveScreenshot('finance-overlay-banks.png')
})

test('census files net migration with the other population flows', async ({ page }) => {
  await openGame(page)
  await page.keyboard.press('Backquote')
  await page.getByRole('spinbutton', { name: 'STATISTICAL', exact: true }).fill('1')
  await page.getByRole('button', { name: 'RUN SCENARIO', exact: true }).click()
  await page.getByRole('button', { name: 'Close developer console', exact: true }).click()

  const advance = page.getByRole('button', { name: 'ADVANCE QUARTER' })
  for (let i = 0; i < 12; i++) await advance.click()
  await expect(page.getByText('1949 Q1', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /POP \/ LABOUR/ }).click()
  const census = page.getByRole('dialog', { name: 'THE NATIONAL CENSUS' })
  await expect(census.getByText('NET MIGRATION', { exact: true })).toBeVisible()
  await expect(page).toHaveScreenshot('census-migration.png')
})

test('modal paperwork contains and restores keyboard focus', async ({ page }) => {
  await openGame(page)
  const trigger = await officeButton(page, 'FINANCE')
  const offices = page.locator('details[data-tour="offices"]')
  await trigger.click()
  await expect(offices).not.toHaveAttribute('open', '')
  const dialog = page.getByRole('dialog', { name: 'THE FINANCIAL SYSTEM' })
  await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  expect(await page.evaluate('document.querySelector(\'[role="dialog"]\')?.contains(document.activeElement)')).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(offices.locator('summary')).toBeFocused()
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

test('desktop cabinet collapses into a persistent reading rail', async ({ page }) => {
  await openGame(page)
  const wall = page.locator('main[data-tour="wall"]')
  const openWidth = (await wall.boundingBox())?.width ?? 0

  await page.getByRole('button', { name: 'Increase Income' }).click()
  await expect(page.getByText('1 ORDER DRAFTED')).toBeVisible()
  await page.getByRole('button', { name: 'Collapse cabinet controls' }).click()
  const expand = page.getByRole('button', { name: 'Expand cabinet controls' })
  await expect(expand).toBeVisible()
  await expect(expand).toBeFocused()
  await expect(page.getByRole('status', { name: /1 order drafted, .* PC, will enact when the quarter advances/ })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'REVENUE 4 CONTROLS' })).toBeHidden()
  expect((await wall.boundingBox())?.width ?? 0).toBeGreaterThan(openWidth + 300)
  await expect(page).toHaveScreenshot('cabinet-collapsed-1280.png')

  await page.reload()
  await expect(expand).toBeVisible()
  await expand.click()
  await expect(page.getByRole('tab', { name: 'REVENUE 4 CONTROLS' })).toBeFocused()
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

test('the opening walkthrough introduces the room without covering it', async ({ page }) => {
  // deliberately NOT `openGame`: this is the first-run browser, and the tour
  // opening itself is the behaviour under test.
  await page.goto('/?seed=visual-regression')
  const card = page.getByRole('dialog', { name: 'Introduction to the war room' })
  await expect(card).toBeVisible()
  await page.evaluate('document.fonts.ready')

  // the card about the wall must not sit on the wall, and the card about the
  // cabinet must not sit on the cabinet. jsdom cannot see this and neither can
  // a pixel diff — a card in the wrong corner is a perfectly plausible render.
  // advanced from the keyboard, not the mouse: the card focuses its own NEXT
  // on every step (so the tour is usable without a pointer), and clicking
  // leaves the cursor resting on the wall, where it opens whichever tooltip
  // happens to be under it. That is a screenshot that changes with the mouse.
  await expect(page.getByRole('button', { name: 'NEXT' })).toBeFocused()
  await page.keyboard.press('Enter')
  const overlap = (await page.evaluate(`(() => {
    const card = document.querySelector('[aria-label="Introduction to the war room"]').getBoundingClientRect()
    const wallEl = document.querySelector('main[data-tour="wall"]')
    const wall = wallEl.getBoundingClientRect()
    const covered = Math.max(0, Math.min(card.right, wall.right) - Math.max(card.left, wall.left))
    return { ring: document.body.getAttribute('data-tour-active'), coveredPx: Math.round(covered), ringed: getComputedStyle(wallEl).outlineStyle }
  })()`)) as { ring: string; coveredPx: number; ringed: string }
  expect(overlap.ring).toBe('wall')
  expect(overlap.coveredPx).toBe(0)
  // and the region it names is actually ringed — the highlight is a stylesheet
  // rule keyed off an attribute, so it fails silently if either end is renamed
  expect(overlap.ringed).toBe('solid')

  await expect(page).toHaveScreenshot('walkthrough-wall.png')
})
