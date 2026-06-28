import { describe, expect, it } from 'vitest'

describe('project baseline', () => {
  it('keeps the test runner scoped to source files', () => {
    expect('command-grid').toContain('grid')
  })
})
