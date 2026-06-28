export type Team = 'player' | 'enemy'

type MapPoint = { x: number; y: number }

export interface Unit {
  id: number
  team: Team
  x: number
  y: number
  hp: number
  maxHp: number
  attack: number
  range: number
  target?: { x: number; y: number }
  attackTargetId?: number
}

export interface Building {
  id: number
  team: Team
  kind: 'hq' | 'refinery' | 'barracks'
  x: number
  y: number
  hp: number
  maxHp: number
}

export interface GameState {
  tick: number
  credits: number
  enemyCredits: number
  nextId: number
  selectedIds: number[]
  units: Unit[]
  buildings: Building[]
  ore: Array<{ x: number; y: number; amount: number }>
  winner?: Team
}

export const MAP_WIDTH = 16
export const MAP_HEIGHT = 10

export function createInitialState(): GameState {
  return {
    tick: 0,
    credits: 500,
    enemyCredits: 400,
    nextId: 10,
    selectedIds: [],
    buildings: [
      { id: 1, team: 'player', kind: 'hq', x: 2, y: 2, hp: 900, maxHp: 900 },
      { id: 2, team: 'enemy', kind: 'hq', x: 13, y: 7, hp: 900, maxHp: 900 },
    ],
    units: [
      { id: 3, team: 'player', x: 3, y: 4, hp: 120, maxHp: 120, attack: 18, range: 1 },
      { id: 4, team: 'player', x: 4, y: 4, hp: 120, maxHp: 120, attack: 18, range: 1 },
      { id: 5, team: 'enemy', x: 12, y: 6, hp: 110, maxHp: 110, attack: 16, range: 1 },
      { id: 6, team: 'enemy', x: 11, y: 7, hp: 110, maxHp: 110, attack: 16, range: 1 },
    ],
    ore: [
      { x: 6, y: 2, amount: 900 },
      { x: 7, y: 2, amount: 900 },
      { x: 8, y: 7, amount: 900 },
      { x: 9, y: 7, amount: 900 },
    ],
  }
}

export function distance(a: MapPoint, b: MapPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function clampToMap(point: MapPoint): MapPoint {
  return {
    x: Math.max(0, Math.min(MAP_WIDTH - 1, point.x)),
    y: Math.max(0, Math.min(MAP_HEIGHT - 1, point.y)),
  }
}

export function canAfford(state: GameState, cost: number): boolean {
  return state.credits >= cost
}

export function buildStructure(state: GameState, kind: 'refinery' | 'barracks', x: number, y: number): GameState {
  const cost = kind === 'refinery' ? 220 : 260
  if (!canAfford(state, cost) || isOccupied(state, x, y)) return state
  const hp = kind === 'refinery' ? 520 : 620
  return {
    ...state,
    credits: state.credits - cost,
    nextId: state.nextId + 1,
    buildings: [...state.buildings, { id: state.nextId, team: 'player', kind, x, y, hp, maxHp: hp }],
  }
}

export function trainUnit(state: GameState): GameState {
  const cost = 120
  const hasBarracks = state.buildings.some(b => b.team === 'player' && b.kind === 'barracks')
  if (!hasBarracks || !canAfford(state, cost)) return state
  const spawn = nearestOpenTile(state, { x: 4, y: 3 })
  return {
    ...state,
    credits: state.credits - cost,
    nextId: state.nextId + 1,
    units: [...state.units, { id: state.nextId, team: 'player', ...spawn, hp: 120, maxHp: 120, attack: 18, range: 1 }],
  }
}

export function issueMove(state: GameState, x: number, y: number): GameState {
  const target = clampToMap({ x, y })
  return {
    ...state,
    units: state.units.map(unit => state.selectedIds.includes(unit.id)
      ? { ...unit, target, attackTargetId: undefined }
      : unit),
  }
}

export function issueAttack(state: GameState, targetId: number): GameState {
  return {
    ...state,
    units: state.units.map(unit => state.selectedIds.includes(unit.id)
      ? { ...unit, attackTargetId: targetId, target: undefined }
      : unit),
  }
}

export function selectInBox(state: GameState, start: { x: number; y: number }, end: { x: number; y: number }): GameState {
  const minX = Math.min(start.x, end.x)
  const maxX = Math.max(start.x, end.x)
  const minY = Math.min(start.y, end.y)
  const maxY = Math.max(start.y, end.y)
  return {
    ...state,
    selectedIds: state.units
      .filter(unit => unit.team === 'player' && unit.x >= minX && unit.x <= maxX && unit.y >= minY && unit.y <= maxY)
      .map(unit => unit.id),
  }
}

export function stepGame(state: GameState): GameState {
  if (state.winner) return state
  let next: GameState = { ...state, tick: state.tick + 1 }
  next = harvest(next)
  next = enemyPlan(next)
  next = moveUnits(next)
  next = fight(next)
  next = removeDestroyed(next)
  return checkWinner(next)
}

function harvest(state: GameState): GameState {
  const playerRefineries = state.buildings.filter(b => b.team === 'player' && b.kind === 'refinery').length
  const enemyRefineries = state.buildings.filter(b => b.team === 'enemy' && b.kind === 'refinery').length
  const nearbyPlayerOre = state.ore.some(o => o.amount > 0 && state.buildings.some(b => b.team === 'player' && distance(o, b) <= 4))
  const income = playerRefineries > 0 && nearbyPlayerOre ? 8 * playerRefineries : 2
  return { ...state, credits: Math.min(2000, state.credits + income), enemyCredits: Math.min(2000, state.enemyCredits + 4 + 5 * enemyRefineries) }
}

function enemyPlan(state: GameState): GameState {
  if (state.tick % 35 !== 0) return state
  let next = state
  if (!next.buildings.some(b => b.team === 'enemy' && b.kind === 'refinery') && next.enemyCredits >= 180) {
    next = {
      ...next,
      enemyCredits: next.enemyCredits - 180,
      nextId: next.nextId + 1,
      buildings: [...next.buildings, { id: next.nextId, team: 'enemy', kind: 'refinery', x: 11, y: 6, hp: 480, maxHp: 480 }],
    }
  } else if (next.enemyCredits >= 100) {
    const spawn = nearestOpenTile(next, { x: 12, y: 7 })
    next = {
      ...next,
      enemyCredits: next.enemyCredits - 100,
      nextId: next.nextId + 1,
      units: [...next.units, { id: next.nextId, team: 'enemy', ...spawn, hp: 110, maxHp: 110, attack: 16, range: 1, target: { x: 3, y: 3 } }],
    }
  }
  return {
    ...next,
    units: next.units.map(unit => {
      if (unit.team !== 'enemy' || unit.attackTargetId) return unit
      const attackTargetId = nearestOpponentTargetId(next, unit)
      return attackTargetId ? { ...unit, attackTargetId, target: undefined } : unit
    }),
  }
}

function moveUnits(state: GameState): GameState {
  return {
    ...state,
    units: state.units.map(unit => {
      const attackTarget = unit.attackTargetId ? findTargetById(state, unit.attackTargetId) : undefined
      if (unit.attackTargetId && !attackTarget) return { ...unit, attackTargetId: undefined, target: undefined }
      if (attackTarget) {
        if (distance(unit, attackTarget) <= unit.range) return { ...unit, target: undefined }
        return { ...unit, ...stepToward(unit, attackTarget), target: undefined }
      }
      if (!unit.target) return unit
      if (unit.x === unit.target.x && unit.y === unit.target.y) return { ...unit, target: undefined }
      return { ...unit, ...stepToward(unit, unit.target) }
    }),
  }
}

function findTargetById(state: GameState, targetId: number): Unit | Building | undefined {
  return state.units.find(target => target.id === targetId) ?? state.buildings.find(target => target.id === targetId)
}

function stepToward(origin: MapPoint, destination: MapPoint): MapPoint {
  const deltaX = destination.x - origin.x
  const deltaY = destination.y - origin.y
  if (Math.abs(deltaX) >= Math.abs(deltaY) && deltaX !== 0) return clampToMap({ x: origin.x + Math.sign(deltaX), y: origin.y })
  if (deltaY !== 0) return clampToMap({ x: origin.x, y: origin.y + Math.sign(deltaY) })
  return clampToMap(origin)
}

function fight(state: GameState): GameState {
  const units = state.units.map(unit => ({ ...unit }))
  const buildings = state.buildings.map(building => ({ ...building }))
  const damageTarget = (attacker: Unit, explicitTargetId?: number) => {
    const unitTarget = units.find(target => target.id === explicitTargetId || (!explicitTargetId && target.team !== attacker.team && distance(target, attacker) <= attacker.range))
    if (unitTarget && unitTarget.team !== attacker.team && distance(unitTarget, attacker) <= attacker.range) {
      unitTarget.hp -= attacker.attack
      return
    }
    const buildingTarget = buildings.find(target => target.id === explicitTargetId || (!explicitTargetId && target.team !== attacker.team && distance(target, attacker) <= attacker.range))
    if (buildingTarget && buildingTarget.team !== attacker.team && distance(buildingTarget, attacker) <= attacker.range) {
      buildingTarget.hp -= attacker.attack
    }
  }
  for (const unit of units) damageTarget(unit, unit.attackTargetId)
  return { ...state, units, buildings }
}

function removeDestroyed(state: GameState): GameState {
  const aliveUnitIds = new Set(state.units.filter(unit => unit.hp > 0).map(unit => unit.id))
  const aliveBuildingIds = new Set(state.buildings.filter(building => building.hp > 0).map(building => building.id))
  return {
    ...state,
    units: state.units.filter(unit => aliveUnitIds.has(unit.id)).map(unit => unit.attackTargetId && !aliveUnitIds.has(unit.attackTargetId) && !aliveBuildingIds.has(unit.attackTargetId) ? { ...unit, attackTargetId: undefined } : unit),
    buildings: state.buildings.filter(building => aliveBuildingIds.has(building.id)),
    selectedIds: state.selectedIds.filter(id => aliveUnitIds.has(id)),
  }
}

function checkWinner(state: GameState): GameState {
  const playerHq = state.buildings.some(building => building.team === 'player' && building.kind === 'hq')
  const enemyHq = state.buildings.some(building => building.team === 'enemy' && building.kind === 'hq')
  if (!playerHq) return { ...state, winner: 'enemy' }
  if (!enemyHq) return { ...state, winner: 'player' }
  return state
}

function nearestOpponentTargetId(state: GameState, unit: Unit): number | undefined {
  const candidates = [...state.units.filter(u => u.team === 'player'), ...state.buildings.filter(b => b.team === 'player')]
  const target = candidates.sort((a, b) => distance(unit, a) - distance(unit, b))[0]
  return target?.id
}

function nearestOpenTile(state: GameState, start: MapPoint): MapPoint {
  for (let radius = 0; radius < 5; radius++) {
    for (let y = start.y - radius; y <= start.y + radius; y++) {
      for (let x = start.x - radius; x <= start.x + radius; x++) {
        const tile = clampToMap({ x, y })
        if (!isOccupied(state, tile.x, tile.y)) return tile
      }
    }
  }
  return clampToMap(start)
}

function isOccupied(state: GameState, x: number, y: number): boolean {
  return state.units.some(unit => unit.x === x && unit.y === y) || state.buildings.some(building => building.x === x && building.y === y)
}
