import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState as createDefaultInitialState } from './game'

async function loadApp(options: { enemyHqHp?: number } = {}) {
  vi.resetModules()
  vi.doUnmock('./game')
  document.body.innerHTML = '<div id="app"></div>'
  if (options.enemyHqHp !== undefined) {
    vi.doMock('./game', async importOriginal => {
      const actual = await importOriginal<typeof import('./game')>()
      return {
        ...actual,
        createInitialState: () => {
          const initial = createDefaultInitialState()
          return {
            ...initial,
            buildings: initial.buildings.map(building => building.team === 'enemy' && building.kind === 'hq'
              ? { ...building, hp: options.enemyHqHp!, maxHp: options.enemyHqHp! }
              : building),
          }
        },
      }
    })
  }
  await import('./main')
}

function tileAt(x: number, y: number): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-x="${x}"][data-y="${y}"]`)!
}

function pressTile(tile: HTMLElement): void {
  tile.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
  tile.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
}

function rightClickTile(tile: HTMLElement): void {
  tile.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2 }))
}

function hoverTile(tile: HTMLElement): void {
  tile.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
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
    expect(document.querySelector('.harvester.player')).not.toBeNull()
    expect(document.querySelector('.unit.player .hp-bar')).not.toBeNull()
    expect(tileAt(2, 2).querySelector('.building-label .hp-bar')).not.toBeNull()
  })

  it('selects a unit and shows command feedback', async () => {
    await loadApp()
    pressTile(tileAt(3, 4))
    expect(document.querySelector('.unit.selected')).not.toBeNull()
    expect(document.querySelector('#status')?.textContent).toContain('Selected unit')

    rightClickTile(tileAt(8, 4))
    expect(document.querySelector('#status')?.textContent).toContain('Move order')
    expect(document.querySelector('.unit.player.moving')).not.toBeNull()
  })

  it('shows attack order feedback when right-clicking an enemy', async () => {
    await loadApp()
    pressTile(tileAt(3, 4))

    rightClickTile(tileAt(12, 6))

    expect(document.querySelector('#status')?.textContent).toContain('Attack order on target 5.')
    expect(document.querySelector('.unit.player.attacking')).not.toBeNull()
    expect(tileAt(12, 6).classList.contains('command-attack')).toBe(true)
    expect(tileAt(12, 6).querySelector('.command-marker.attack')).not.toBeNull()
  })

  it('previews move commands while hovering with a selected unit', async () => {
    await loadApp()
    pressTile(tileAt(3, 4))

    hoverTile(tileAt(8, 4))

    expect(tileAt(8, 4).classList.contains('command-hover')).toBe(true)
    expect(tileAt(8, 4).classList.contains('command-move')).toBe(true)
    expect(tileAt(8, 4).getAttribute('aria-label')).toContain('move command target')
    expect(tileAt(8, 4).querySelector('.command-marker.move')).not.toBeNull()
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
    hoverTile(tileAt(5, 2))

    expect(tileAt(5, 2).classList.contains('placement-preview')).toBe(true)
    expect(tileAt(5, 2).classList.contains('valid')).toBe(true)
    expect(tileAt(5, 2).textContent).toContain('REFINERY')
    expect(tileAt(5, 2).getAttribute('aria-label')).toContain('refinery can be placed at 5,2.')

    pressTile(tileAt(5, 2))

    const placedTile = tileAt(5, 2)
    expect(placedTile.classList.contains('refinery')).toBe(true)
    expect(placedTile.textContent).toContain('REFINERY')
    expect(placedTile.querySelector('.harvester.player')).not.toBeNull()
    expect(document.querySelector('#status')?.textContent).toContain('refinery placed at 5,2.')
    expect(document.querySelector('#stats')?.textContent).toContain('Credits280')
    expect(document.querySelector('.stat-delta.negative')?.textContent).toBe('-220')
  })

  it('shows positive credit deltas from harvester deliveries', async () => {
    await loadApp()
    document.querySelector<HTMLButtonElement>('[data-build="refinery"]')!.click()
    pressTile(tileAt(5, 2))

    await vi.advanceTimersByTimeAsync(2750)

    expect(document.querySelector('#stats')?.textContent).toContain('Credits310')
    expect(document.querySelector('.stat-delta.positive')?.textContent).toBe('+30')
    expect(document.querySelector('#delivery')?.textContent).toContain('Delivered +30 credits')
    expect(tileAt(6, 2).getAttribute('aria-label')).toContain('ore remaining')
  })

  it('keeps build mode active and marks occupied placement as invalid', async () => {
    await loadApp()
    document.querySelector<HTMLButtonElement>('[data-build="barracks"]')!.click()
    hoverTile(tileAt(2, 2))

    expect(tileAt(2, 2).classList.contains('placement-preview')).toBe(true)
    expect(tileAt(2, 2).classList.contains('invalid')).toBe(true)
    expect(tileAt(2, 2).textContent).toContain('BLOCKED')

    pressTile(tileAt(2, 2))

    expect(document.querySelector('#status')?.textContent).toContain('Cannot place barracks at 2,2')
    expect(document.querySelector('#stats')?.textContent).toContain('Modebarracks')
    expect(tileAt(2, 2).classList.contains('barracks')).toBe(false)
  })

  it('places a barracks and enables Ranger training deployment', async () => {
    await loadApp()
    const trainButton = document.querySelector<HTMLButtonElement>('#train')!
    expect(trainButton.disabled).toBe(true)

    document.querySelector<HTMLButtonElement>('[data-build="barracks"]')!.click()

    expect(document.querySelector('#status')?.textContent).toContain('Placing barracks')

    pressTile(tileAt(5, 4))

    const barracksTile = tileAt(5, 4)
    expect(barracksTile.classList.contains('barracks')).toBe(true)
    expect(barracksTile.textContent).toContain('BARRACKS')
    expect(document.querySelector('#status')?.textContent).toContain('barracks placed at 5,4.')
    expect(document.querySelector('#stats')?.textContent).toContain('Credits240')
    expect(trainButton.disabled).toBe(false)

    trainButton.click()

    expect(document.querySelector('#status')?.textContent).toContain('Ranger deployed from the barracks.')
    expect(document.querySelectorAll('.unit.player')).toHaveLength(3)
    expect(tileAt(4, 3).querySelector('.unit.player')).not.toBeNull()
    expect(document.querySelector('#stats')?.textContent).toContain('Credits120')
    expect(document.querySelector('.stat-delta.negative')?.textContent).toBe('-120')
  })

  it('can resolve a browser combat order into a destroyed enemy unit', async () => {
    await loadApp()
    tileAt(2, 3).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
    tileAt(5, 5).dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))

    rightClickTile(tileAt(12, 6))
    expect(document.querySelector('#status')?.textContent).toContain('Attack order on target 5.')

    await vi.advanceTimersByTimeAsync(5500)

    expect(document.querySelector<HTMLElement>('.unit.enemy .hp-bar > span')?.style.width).not.toBe('100%')

    await vi.advanceTimersByTimeAsync(3500)

    expect(tileAt(12, 6).querySelector('.unit.enemy')).toBeNull()
    expect(document.querySelectorAll('.unit.enemy')).toHaveLength(1)
  })

  it('can damage the enemy HQ and surface a victory state', async () => {
    await loadApp({ enemyHqHp: 144 })
    tileAt(2, 3).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
    tileAt(5, 5).dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))

    const enemyHq = tileAt(13, 7)
    expect(enemyHq.classList.contains('hq')).toBe(true)

    rightClickTile(enemyHq)

    expect(document.querySelector('#status')?.textContent).toContain('Attack order on target 2.')
    expect(tileAt(13, 7).classList.contains('command-attack')).toBe(true)

    await vi.advanceTimersByTimeAsync(6050)

    expect(tileAt(13, 7).querySelector<HTMLElement>('.building-label .hp-bar > span')?.style.width).not.toBe('100%')

    await vi.advanceTimersByTimeAsync(4400)

    expect(tileAt(13, 7).classList.contains('enemy')).toBe(false)
    expect(tileAt(13, 7).querySelector('.building-label')).toBeNull()
    expect(document.querySelector('#status')?.textContent).toContain('Victory: rival HQ destroyed.')
  })
})
