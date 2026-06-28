import { beforeEach, describe, expect, it, vi } from 'vitest'

async function loadApp() {
  vi.resetModules()
  document.body.innerHTML = '<div id="app"></div>'
  await import('./main')
}

describe('browser RTS smoke', () => {
  beforeEach(() => {
    vi.useFakeTimers()
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
    const playerTile = document.querySelector<HTMLElement>('[data-x="3"][data-y="4"]')!
    playerTile.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
    playerTile.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
    expect(document.querySelector('.unit.selected')).not.toBeNull()
    expect(document.querySelector('#status')?.textContent).toContain('Selected unit')

    const moveTile = document.querySelector<HTMLElement>('[data-x="8"][data-y="4"]')!
    moveTile.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2 }))
    expect(document.querySelector('#status')?.textContent).toContain('Move order')
  })
})
