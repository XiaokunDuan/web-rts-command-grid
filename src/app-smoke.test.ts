import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function loadApp() {
  vi.resetModules()
  document.body.innerHTML = '<div id="app"></div>'
  await import('./main')
}

function tileAt(x: number, y: number): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-x="${x}"][data-y="${y}"]`)!
}

function pressTile(tile: HTMLElement): void {
  tile.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
  tile.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
}

describe('browser RTS smoke', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the command grid and exposes primary controls', async () => {
    await loadApp()
    expect(document.querySelectorAll('.tile')).toHaveLength(160)
    expect(document.querySelector('[data-build="refinery"]')).not.toBeNull()
    expect(document.querySelector('#train')).not.toBeNull()
    expect(document.querySelector('.unit.player')).not.toBeNull()
    expect(document.querySelector('.unit.enemy')).not.toBeNull()
  })

  it('selects a unit and shows command feedback', async () => {
    await loadApp()
    pressTile(tileAt(3, 4))
    expect(document.querySelector('.unit.selected')).not.toBeNull()
    expect(document.querySelector('#status')?.textContent).toContain('Selected unit')

    tileAt(8, 4).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2 }))
    expect(document.querySelector('#status')?.textContent).toContain('Move order')
  })

  it('drag-selects the starter squad from the map', async () => {
    await loadApp()
    tileAt(2, 3).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
    tileAt(5, 5).dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))

    expect(document.querySelectorAll('.unit.player.selected')).toHaveLength(2)
    expect(document.querySelector('#status')?.textContent).toContain('Selected 2 units.')
    expect(document.querySelector('#stats')?.textContent).toContain('Selected2')
  })

  it('places a refinery through the build controls', async () => {
    await loadApp()
    document.querySelector<HTMLButtonElement>('[data-build="refinery"]')!.click()

    expect(document.querySelector('#status')?.textContent).toContain('Placing refinery')

    pressTile(tileAt(5, 2))

    const placedTile = tileAt(5, 2)
    expect(placedTile.classList.contains('refinery')).toBe(true)
    expect(placedTile.textContent).toContain('REFINERY')
    expect(document.querySelector('#status')?.textContent).toContain('refinery placed at 5,2.')
    expect(document.querySelector('#stats')?.textContent).toContain('Credits280')
  })
})
