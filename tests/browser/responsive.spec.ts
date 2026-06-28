import { expect, test } from '@playwright/test'

test.describe('responsive command grid', () => {
  test('renders the full map without horizontal overflow', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.tile')).toHaveCount(160)
    await expect(page.locator('#status')).toContainText('Establish the outpost')
    await expect(page.locator('[data-build="refinery"]')).toBeVisible()
    await expect(page.locator('[data-train="ranger"]')).toBeVisible()
    await expect(page.locator('[data-train="lancer"]')).toBeVisible()

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }))
    expect(overflow.body).toBeLessThanOrEqual(overflow.viewport)
    expect(overflow.document).toBeLessThanOrEqual(overflow.viewport)

    await expect.poll(async () => page.locator('[data-x="15"][data-y="9"]').evaluate((tile, viewport) => {
      const rect = tile.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && rect.right <= viewport
    }, overflow.viewport)).toBe(true)

    await expect.poll(async () => page.locator('.tile').evaluateAll(tiles => tiles.map(tile => {
      const rect = tile.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }).every(size => size.width > 0 && size.height > 0))).toBe(true)
  })

  test('uses the expected layout at the 860px breakpoint', async ({ page }, testInfo) => {
    await page.goto('/')

    const boxes = await page.evaluate(() => {
      const viewport = document.querySelector('.viewport')!.getBoundingClientRect()
      const panel = document.querySelector('.panel')!.getBoundingClientRect()
      return {
        viewportRight: viewport.right,
        viewportBottom: viewport.bottom,
        panelLeft: panel.left,
        panelTop: panel.top,
        width: window.innerWidth,
      }
    })

    if (testInfo.project.name === 'breakpoint-wide') {
      expect(boxes.panelLeft).toBeGreaterThanOrEqual(boxes.viewportRight - 1)
    }
    if (testInfo.project.name === 'breakpoint-narrow') {
      expect(boxes.panelTop).toBeGreaterThanOrEqual(boxes.viewportBottom - 1)
    }
  })

  test('keeps core mouse interactions usable after responsive layout', async ({ page }) => {
    await page.goto('/')

    await page.locator('[data-x="3"][data-y="4"]').click()
    await expect(page.locator('#status')).toContainText('Selected unit')

    await page.locator('[data-x="8"][data-y="4"]').click({ button: 'right' })
    await expect(page.locator('#status')).toContainText('Move order to 8,4.')
    await expect(page.locator('[data-x="8"][data-y="4"] .command-marker.move')).toBeVisible()

    await page.locator('[data-build="refinery"]').click()
    await page.locator('[data-x="5"][data-y="2"]').hover()
    await expect(page.locator('[data-x="5"][data-y="2"] .placement-ghost')).toContainText('REFINERY')
    await page.locator('[data-x="5"][data-y="2"]').click()
    await expect(page.locator('#status')).toContainText('refinery placed at 5,2.')
  })

  test('shows harvester delivery feedback in the browser', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.harvester.player')).toBeVisible()
    await expect(page.locator('[data-x="6"][data-y="2"]')).toContainText('900')

    await page.locator('[data-build="refinery"]').click()
    await page.locator('[data-x="5"][data-y="2"]').click()

    await expect(page.locator('[data-x="5"][data-y="2"] .harvester.player')).toBeVisible()
    await expect(page.locator('#stats')).toContainText('Credits280')

    await expect(page.locator('#delivery')).toContainText('Delivered +30 credits', { timeout: 6000 })
    await expect(page.locator('#stats')).toContainText('Credits310')
    await expect(page.locator('[data-x="6"][data-y="2"]')).toContainText('870')
  })

  test('trains the lancer production choice in the browser', async ({ page }) => {
    await page.goto('/')

    await page.locator('[data-build="barracks"]').click()
    await page.locator('[data-x="5"][data-y="4"]').click()
    await expect(page.locator('#stats')).toContainText('Credits240')

    await page.locator('[data-train="lancer"]').click()

    await expect(page.locator('#status')).toContainText('Lancer deployed from the barracks.')
    await expect(page.locator('[data-x="4"][data-y="3"] .unit.player.lancer')).toBeVisible()
    await expect(page.locator('#stats')).toContainText('Credits60')
  })

  test('supports touch-first move and attack commands on mobile', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile touch controls are covered in mobile projects')
    await page.goto('/')

    await expect(page.locator('[data-command="move"]')).toBeVisible()
    await expect(page.locator('[data-command="attack"]')).toBeVisible()
    await expect(page.locator('#cancel-command')).toBeVisible()

    await page.locator('[data-x="3"][data-y="4"]').tap()
    await expect(page.locator('#status')).toContainText('Selected unit')

    await page.locator('[data-command="move"]').tap()
    await expect(page.locator('#status')).toContainText('Move mode')
    await page.locator('[data-x="8"][data-y="4"]').tap()
    await expect(page.locator('#status')).toContainText('Move order to 8,4.')
    await expect(page.locator('[data-x="8"][data-y="4"] .command-marker.move')).toBeVisible()

    await page.locator('[data-command="attack"]').tap()
    await expect(page.locator('#status')).toContainText('Attack mode')
    await page.locator('[data-x="12"][data-y="6"]').tap()
    await expect(page.locator('#status')).toContainText('Attack order on target 5.')
    await expect(page.locator('[data-x="12"][data-y="6"] .command-marker.attack')).toBeVisible()

    await page.locator('[data-command="move"]').tap()
    await page.locator('#cancel-command').tap()
    await expect(page.locator('#status')).toContainText('Command mode canceled.')
  })

  test('surfaces the player defeat flow in the browser', async ({ page }) => {
    await page.goto('/?scenario=player-defeat-smoke')

    await expect(page.locator('#status')).toContainText('Defeat: your HQ fell.', { timeout: 2500 })
    await expect(page.locator('[data-x="2"][data-y="2"] .building-label')).toHaveCount(0)
  })
})
