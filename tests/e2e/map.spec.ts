import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/(tile\.openstreetmap\.org|gis\.cnra\.ca\.gov)\//, (route) => route.abort())
})

test('restores list URL state and synchronizes list selection with map details', async ({ page }, testInfo) => {
  await page.goto('/trailheads/?view=list')
  const listSwitch = page.getByRole('button', { name: 'List' })
  await expect(listSwitch).toHaveAttribute('aria-pressed', 'true')
  const firstResult = page.locator('.map-result-list > li > button').first()
  await expect(firstResult).toBeVisible({ timeout: 20_000 })
  const viewBeforeSelection = new URL(page.url()).searchParams
  await firstResult.click()
  await expect(firstResult).toHaveAttribute('aria-expanded', 'true')
  const viewAfterSelection = new URL(page.url()).searchParams
  expect(viewAfterSelection.get('x')).toBe(viewBeforeSelection.get('x'))
  expect(viewAfterSelection.get('y')).toBe(viewBeforeSelection.get('y'))
  expect(viewAfterSelection.get('z')).toBe(viewBeforeSelection.get('z'))

  await page.getByRole('button', { name: 'Map' }).click()
  const details = page.getByRole('dialog', { name: /details for/i })
  await expect(details).toBeVisible()
  await expect(page).toHaveURL(/selected=/)

  if (testInfo.project.name === 'mobile-375') {
    const stage = await page.locator('.map-stage').boundingBox()
    const map = await page.locator('.trailhead-map-target').boundingBox()
    const panel = await details.boundingBox()
    expect(stage && map && panel).toBeTruthy()
    expect(map!.height).toBeGreaterThan(200)
    expect(panel!.height).toBeLessThanOrEqual(365)
    expect(panel!.y).toBeGreaterThanOrEqual(map!.y + map!.height - 1)
    expect(panel!.y + panel!.height).toBeLessThanOrEqual(stage!.y + stage!.height + 1)
  }

  await page.keyboard.press('Escape')
  await expect(details).toBeHidden()
  await expect(page).not.toHaveURL(/selected=/)
})

test('map survives repeated mounts under Strict Mode', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (let index = 0; index < 3; index += 1) {
    await page.goto('/trailheads/')
    await expect(page.locator('.ol-viewport')).toHaveCount(1, { timeout: 20_000 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('mobile map accepts two-finger panning without hijacking one-finger page scroll', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-375', 'Touch gesture coverage runs at the mobile viewport')
  await page.goto('/trailheads/')
  const target = page.locator('.trailhead-map-target')
  await expect(target.locator('.ol-viewport')).toHaveCount(1, { timeout: 20_000 })
  await expect(page).toHaveURL(/[?&]x=/)
  const before = new URL(page.url()).searchParams.get('x')
  const box = await target.boundingBox()
  expect(box).toBeTruthy()
  const session = await page.context().newCDPSession(page)
  const left = { x: box!.x + box!.width * 0.4, y: box!.y + box!.height * 0.5 }
  const right = { x: box!.x + box!.width * 0.6, y: box!.y + box!.height * 0.5 }
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left, right] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
    { x: left.x + 55, y: left.y }, { x: right.x + 55, y: right.y },
  ] })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(() => new URL(page.url()).searchParams.get('x')).not.toBe(before)
})
