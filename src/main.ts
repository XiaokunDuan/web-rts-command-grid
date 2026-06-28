import './styles.css'
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  buildStructure,
  createInitialState,
  issueAttack,
  issueMove,
  selectInBox,
  stepGame,
  trainUnit,
  type GameState,
} from './game'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Missing #app root')

let state = createInitialState()
let buildMode: 'refinery' | 'barracks' | null = null
let dragStart: { x: number; y: number } | null = null

app.innerHTML = `
  <main class="shell">
    <section class="viewport" aria-label="game map">
      <div class="map" id="map"></div>
    </section>
    <aside class="panel">
      <h1>Command Grid</h1>
      <p class="status" id="status">Establish the outpost and destroy the rival HQ.</p>
      <dl id="stats"></dl>
      <div class="actions">
        <button type="button" data-build="refinery">Build Refinery (220)</button>
        <button type="button" data-build="barracks">Build Barracks (260)</button>
        <button type="button" id="train">Train Ranger (120)</button>
      </div>
      <div class="help">
        <strong>Controls</strong>
        <span>Left click selects. Drag selects squads. Right click moves or attacks. Choose a building, then click a tile to place it.</span>
      </div>
    </aside>
  </main>
`

const map = document.querySelector<HTMLDivElement>('#map')!
const stats = document.querySelector<HTMLElement>('#stats')!
const status = document.querySelector<HTMLElement>('#status')!
const actionButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.actions button'))

document.querySelectorAll<HTMLButtonElement>('[data-build]').forEach(button => {
  button.addEventListener('click', () => {
    buildMode = button.dataset.build as 'refinery' | 'barracks'
    status.textContent = `Placing ${buildMode}. Click a clear map tile, or press Escape to cancel.`
  })
})

document.querySelector<HTMLButtonElement>('#train')!.addEventListener('click', () => {
  const before = state.units.length
  state = trainUnit(state)
  status.textContent = state.units.length > before ? 'Ranger deployed from the barracks.' : 'Build a barracks and save 120 credits before training.'
  render()
})

window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    buildMode = null
    state = { ...state, selectedIds: [] }
    render()
  }
})

function tileFromEvent(event: MouseEvent): { x: number; y: number } | null {
  const target = event.target as HTMLElement
  const tile = target.closest<HTMLElement>('[data-x][data-y]')
  if (!tile) return null
  return { x: Number(tile.dataset.x), y: Number(tile.dataset.y) }
}

map.addEventListener('mousedown', event => {
  if (event.button !== 0) return
  dragStart = tileFromEvent(event)
})

map.addEventListener('mouseup', event => {
  const tile = tileFromEvent(event)
  if (!tile || event.button !== 0) return
  if (buildMode) {
    const before = state.buildings.length
    state = buildStructure(state, buildMode, tile.x, tile.y)
    status.textContent = state.buildings.length > before ? `${buildMode} placed at ${tile.x},${tile.y}.` : `Cannot place ${buildMode} there. Check credits and clear tiles.`
    buildMode = null
    render()
    return
  }
  const unit = state.units.find(candidate => candidate.team === 'player' && candidate.x === tile.x && candidate.y === tile.y)
  if (unit && dragStart && dragStart.x === tile.x && dragStart.y === tile.y) {
    state = { ...state, selectedIds: [unit.id] }
    status.textContent = `Selected unit ${unit.id}.`
  } else if (dragStart) {
    state = selectInBox(state, dragStart, tile)
    status.textContent = state.selectedIds.length > 0 ? `Selected ${state.selectedIds.length} units.` : 'No units selected.'
  }
  dragStart = null
  render()
})

map.addEventListener('contextmenu', event => {
  event.preventDefault()
  const tile = tileFromEvent(event)
  if (!tile || state.selectedIds.length === 0) return
  const enemy = [...state.units, ...state.buildings].find(candidate => candidate.team === 'enemy' && candidate.x === tile.x && candidate.y === tile.y)
  state = enemy ? issueAttack(state, enemy.id) : issueMove(state, tile.x, tile.y)
  status.textContent = enemy ? `Attack order on target ${enemy.id}.` : `Move order to ${tile.x},${tile.y}.`
  render()
})

setInterval(() => {
  state = stepGame(state)
  render()
}, 550)

function render(): void {
  renderStats(state)
  renderMap(state)
}

function renderStats(current: GameState): void {
  const selected = current.units.filter(unit => current.selectedIds.includes(unit.id))
  const playerUnits = current.units.filter(unit => unit.team === 'player').length
  const enemyUnits = current.units.filter(unit => unit.team === 'enemy').length
  stats.innerHTML = `
    <div><dt>Credits</dt><dd>${current.credits}</dd></div>
    <div><dt>Selected</dt><dd>${selected.length}</dd></div>
    <div><dt>Units</dt><dd>${playerUnits} / ${enemyUnits}</dd></div>
    <div><dt>Mode</dt><dd>${buildMode ?? 'command'}</dd></div>
  `
  for (const button of actionButtons) {
    if (button.id === 'train') {
      const hasBarracks = current.buildings.some(building => building.team === 'player' && building.kind === 'barracks')
      button.disabled = !hasBarracks || current.credits < 120
    } else {
      const kind = button.dataset.build
      const cost = kind === 'refinery' ? 220 : 260
      button.disabled = Boolean(buildMode) || current.credits < cost
    }
  }
  if (current.winner) status.textContent = current.winner === 'player' ? 'Victory: rival HQ destroyed.' : 'Defeat: your HQ fell.'
}

function renderMap(current: GameState): void {
  const cells: string[] = []
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const ore = current.ore.find(node => node.x === x && node.y === y && node.amount > 0)
      const building = current.buildings.find(item => item.x === x && item.y === y)
      const units = current.units.filter(item => item.x === x && item.y === y)
      const classes = ['tile']
      if (ore) classes.push('ore')
      if (building) classes.push(building.team, building.kind)
      const pieces = []
      if (ore) pieces.push('<span class="ore-label">ore</span>')
      if (building) pieces.push(`<span class="building-label">${building.kind.toUpperCase()}<small>${building.hp}</small></span>`)
      for (const unit of units) {
        const selected = current.selectedIds.includes(unit.id) ? ' selected' : ''
        pieces.push(`<span class="unit ${unit.team}${selected}">●<small>${unit.hp}</small></span>`)
      }
      cells.push(`<button class="${classes.join(' ')}" data-x="${x}" data-y="${y}" aria-label="tile ${x},${y}">${pieces.join('')}</button>`)
    }
  }
  map.innerHTML = cells.join('')
}

render()
