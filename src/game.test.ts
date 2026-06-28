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
    for (let i = 0; i < 5; i++) state = stepGame(state)
    expect(state.credits).toBeGreaterThan(credits)
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
})
