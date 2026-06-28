import { expect, test } from '@playwright/test'

test.describe('responsive command grid', () => {
  test('renders the full map without horizontal overflow', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.tile')).toHaveCount(160)
    await expect(page.locator('#status')).toContainText('Establish the outpost')
    await expect(page.locator('[data-build="refinery"]')).toBeVisible()
    await expect(page.locator('#train')).toBeVisible()

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }))
    expect(overflow.body).toBeLessThanOrEqual(overflow.viewport)
    expect(overflow.document).toBeLessThanOrEqual(overflow.viewport)

    const lastTileBox = await page.locator('[data-x="15"][data-y="9"]').evaluate(tile => {
      const rect = tile.getBoundingClientRect()
      return { width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom }
    })
    expect(lastTileBox.width).toBeGreaterThan(0)
    expect(lastTileBox.height).toBeGreaterThan(0)
    expect(lastTileBox.right).toBeLessThanOrEqual(overflow.viewport)

    const tileSizes = await page.locator('.tile').evaluateAll(tiles => tiles.map(tile => {
      const rect = tile.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }))
    expect(tileSizes.every(size => size.width > 0 && size.height > 0)).toBe(true)
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
})
