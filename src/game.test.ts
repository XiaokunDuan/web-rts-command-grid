import { describe, expect, it } from 'vitest'
import {
  buildStructure,
  createInitialState,
  distance,
  issueAttack,
  issueMove,
  selectInBox,
  stepGame,
  trainUnit,
} from './game'

describe('RTS game state', () => {
  it('spends credits to build production and train units', () => {
    let state = createInitialState()
    state = buildStructure(state, 'barracks', 5, 4)
    expect(state.credits).toBe(240)
    state = trainUnit(state)
    expect(state.credits).toBe(120)
    expect(state.units.filter(unit => unit.team === 'player')).toHaveLength(3)
  })

  it('selects a squad and assigns movement orders', () => {
    let state = createInitialState()
    state = selectInBox(state, { x: 2, y: 3 }, { x: 5, y: 5 })
    expect(state.selectedIds).toHaveLength(2)
    state = issueMove(state, 9, 4)
    expect(state.units.filter(unit => state.selectedIds.includes(unit.id)).every(unit => unit.target?.x === 9)).toBe(true)
  })

  it('advances economy and combat simulation', () => {
    let state = createInitialState()
    state = buildStructure(state, 'refinery', 5, 2)
    const credits = state.credits
    for (let i = 0; i < 12; i++) state = stepGame(state)
    expect(state.credits).toBeGreaterThan(credits)
  })

  it('adds a harvester when placing a refinery', () => {
    let state = createInitialState()
    const startingHarvesters = state.harvesters.length

    state = buildStructure(state, 'refinery', 5, 2)

    expect(state.harvesters).toHaveLength(startingHarvesters + 1)
    expect(state.harvesters.at(-1)).toMatchObject({ team: 'player', x: 5, y: 2, cargo: 0, status: 'seeking' })
    expect(state.nextId).toBe(12)
  })

  it('moves harvesters through loading, ore depletion, and delivery', () => {
    let state = createInitialState()
    state = {
      ...state,
      harvesters: state.harvesters.filter(worker => worker.team === 'player'),
    }
    const startingCredits = state.credits
    const startingOre = state.ore.find(node => node.x === 6 && node.y === 2)!.amount

    for (let i = 0; i < 12; i++) state = stepGame(state)

    const playerHarvester = state.harvesters.find(worker => worker.team === 'player')!
    const ore = state.ore.find(node => node.x === 6 && node.y === 2)!

    expect(playerHarvester.cargo).toBe(0)
    expect(state.credits).toBeGreaterThan(startingCredits)
    expect(ore.amount).toBe(startingOre - playerHarvester.capacity)
    expect(state.lastDelivery).toMatchObject({ team: 'player', amount: playerHarvester.capacity, x: 2, y: 2 })
  })

  it('keeps harvesters idle when ore is depleted', () => {
    let state = createInitialState()
    state = {
      ...state,
      ore: state.ore.map(node => ({ ...node, amount: 0 })),
    }

    state = stepGame(state)

    expect(state.harvesters.every(worker => worker.status === 'idle')).toBe(true)
  })

  it('chases a distant attack target before dealing damage', () => {
    let state = createInitialState()
    state = { ...state, selectedIds: [3] }
    state = issueAttack(state, 5)

    expect(state.units.find(unit => unit.id === 3)?.attackTargetId).toBe(5)

    for (let i = 0; i < 12; i++) state = stepGame(state)

    const attacker = state.units.find(unit => unit.id === 3)
    const target = state.units.find(unit => unit.id === 5)
    expect(attacker).toBeDefined()
    expect(target).toBeDefined()
    expect(distance(attacker!, target!)).toBeLessThanOrEqual(attacker!.range)
    expect(target!.hp).toBeLessThan(target!.maxHp)
  })

  it('gives enemy units explicit attack targets during planning', () => {
    let state = createInitialState()

    for (let i = 0; i < 35; i++) state = stepGame(state)

    expect(state.units.find(unit => unit.id === 5)?.attackTargetId).toBe(4)
  })

  it('removes destroyed HQs and declares the winner', () => {
    const initial = createInitialState()
    let state = {
      ...initial,
      selectedIds: [3],
      units: initial.units.filter(unit => unit.id === 3).map(unit => ({ ...unit, x: 12, y: 7, attack: 20 })),
      buildings: initial.buildings.map(building => building.id === 2 ? { ...building, hp: 18 } : building),
    }

    state = issueAttack(state, 2)
    state = stepGame(state)

    expect(state.buildings.some(building => building.id === 2)).toBe(false)
    expect(state.winner).toBe('player')
  })

  it('does not move units through occupied tiles', () => {
    let state = createInitialState()
    state = { ...state, selectedIds: [3] }
    state = issueMove(state, 4, 4)
    state = stepGame(state)

    expect(state.units.find(unit => unit.id === 3)).toMatchObject({ x: 3, y: 4 })
  })

  it('uses an alternate open axis when the direct movement step is blocked', () => {
    let state = createInitialState()
    state = { ...state, selectedIds: [3] }
    state = issueMove(state, 7, 5)
    state = stepGame(state)

    expect(state.units.find(unit => unit.id === 3)).toMatchObject({ x: 3, y: 5 })
  })

  it('routes around a building wall instead of stopping at the first blocked step', () => {
    const initial = createInitialState()
    let state = {
      ...initial,
      selectedIds: [3],
      units: initial.units.filter(unit => unit.id === 3).map(unit => ({ ...unit, x: 1, y: 2 })),
      buildings: [
        ...initial.buildings,
        { id: 20, team: 'player' as const, kind: 'refinery' as const, x: 2, y: 1, hp: 100, maxHp: 100 },
        { id: 21, team: 'player' as const, kind: 'refinery' as const, x: 2, y: 2, hp: 100, maxHp: 100 },
        { id: 22, team: 'player' as const, kind: 'refinery' as const, x: 2, y: 3, hp: 100, maxHp: 100 },
      ],
    }

    state = issueMove(state, 4, 2)

    for (let i = 0; i < 7; i++) state = stepGame(state)

    expect(state.units.find(unit => unit.id === 3)).toMatchObject({ x: 4, y: 2 })
  })

  it('stops near unreachable movement targets without entering blocked structures', () => {
    const initial = createInitialState()
    let state = {
      ...initial,
      selectedIds: [3],
      units: initial.units.filter(unit => unit.id === 3).map(unit => ({ ...unit, x: 1, y: 1 })),
      buildings: [
        ...initial.buildings.filter(building => building.id !== 1),
        { id: 20, team: 'player' as const, kind: 'refinery' as const, x: 2, y: 1, hp: 100, maxHp: 100 },
        { id: 21, team: 'player' as const, kind: 'refinery' as const, x: 1, y: 2, hp: 100, maxHp: 100 },
        { id: 22, team: 'player' as const, kind: 'refinery' as const, x: 2, y: 2, hp: 100, maxHp: 100 },
      ],
    }

    state = issueMove(state, 2, 2)

    for (let i = 0; i < 4; i++) state = stepGame(state)

    const unit = state.units.find(candidate => candidate.id === 3)
    expect(unit).toMatchObject({ x: 1, y: 0 })
    expect(state.buildings.some(building => building.x === unit?.x && building.y === unit?.y)).toBe(false)
  })
})
