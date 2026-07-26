import { expect, test } from '@playwright/test'

test('hydrates prerendered pages without errors and preserves route metadata', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/places/marin/')
  await expect(page).toHaveTitle('Marin · Hiking by Transit')
  await expect(page.getByRole('heading', { level: 1, name: 'Marin' })).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://hikingbytransit.com/places/marin')
  await page.waitForLoadState('networkidle')
  expect(errors.filter((error) => !error.includes('A base-map tile failed'))).toEqual([])
})

test('homepage search is keyboard operable', async ({ page }) => {
  await page.goto('/')
  const search = page.getByRole('combobox', { name: /search for a hike/i })
  await search.fill('Marin')
  await expect(page.getByRole('listbox')).toBeVisible()
  await search.press('ArrowDown')
  const selected = page.locator('[role="option"][aria-selected="true"]')
  await expect(selected).toBeVisible()
  await search.press('Enter')
  await expect(page).toHaveURL(/\/places\/marin\/?$/)
})

test('layout has no horizontal overflow at the configured viewport', async ({ page }, testInfo) => {
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  if (testInfo.project.name !== 'desktop-1440') await expect(page.getByRole('link', { name: /recommended hikes/i })).toBeVisible()
})

test('content remains available with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } })
  const page = await context.newPage()
  await page.goto('/hikes/angel-island/')
  await expect(page).toHaveTitle(/Angel Island/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Angel Island')
  await expect(page.getByText(/interactive route map and elevation profile require JavaScript/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /download GPX/i }).first()).toBeVisible()
  await context.close()
})

test('content remains usable at 200% and 400% page zoom', async ({ page }) => {
  await page.goto('/hikes')
  for (const zoom of [2, 4]) {
    await page.evaluate((value) => { document.documentElement.style.zoom = String(value) }, zoom)
    await expect(page.getByRole('heading', { level: 1, name: 'All hikes' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
  }
})
