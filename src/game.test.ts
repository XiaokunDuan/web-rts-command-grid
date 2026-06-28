import { describe, expect, it } from 'vitest'
import { buildStructure, createInitialState, issueMove, selectInBox, stepGame, trainUnit } from './game'

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
})
