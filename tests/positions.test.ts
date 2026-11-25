import { Chess, validateFen } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { POSITIONS, pickPositions } from '../src/lib/positions'

describe('bundled positions', () => {
  it('has around 100 positions with all difficulties', () => {
    expect(POSITIONS.length).toBeGreaterThanOrEqual(100)
    for (const d of ['easy', 'medium', 'hard'] as const) {
      expect(POSITIONS.filter((p) => p.difficulty === d).length).toBeGreaterThan(10)
    }
  })

  it('every FEN is valid and loadable', () => {
    for (const p of POSITIONS) {
      expect(validateFen(p.fen).ok, p.fen).toBe(true)
      expect(() => new Chess(p.fen)).not.toThrow()
    }
  })

  it('FENs are unique', () => {
    expect(new Set(POSITIONS.map((p) => p.fen)).size).toBe(POSITIONS.length)
  })

  it('picks distinct positions and orders mixed sets simple-first', () => {
    const set = pickPositions(10, 'mixed')
    expect(new Set(set.map((p) => p.id)).size).toBe(10)
    const order = { easy: 0, medium: 1, hard: 2 }
    for (let i = 1; i < set.length; i++) {
      expect(order[set[i].difficulty]).toBeGreaterThanOrEqual(order[set[i - 1].difficulty])
    }
    expect(pickPositions(5, 'easy').every((p) => p.difficulty === 'easy')).toBe(true)
  })
})
