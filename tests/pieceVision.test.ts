import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { generateVisionPuzzle, gradeSelection } from '../src/lib/pieceVision'

function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

describe('piece vision puzzles', () => {
  it('generates valid puzzles whose targets match chess.js moves', () => {
    const rng = seeded(77)
    for (const d of ['easy', 'medium', 'hard'] as const) {
      for (let i = 0; i < 15; i++) {
        const p = generateVisionPuzzle(d, rng)
        expect(p.placement[p.square]).toBe(p.piece)
        expect(['N', 'B', 'R', 'Q']).toContain(p.piece[1])
        expect(p.targets.length).toBeGreaterThanOrEqual(2)
        expect(p.targets).not.toContain(p.square)
        const chess = new Chess(p.fen)
        expect(chess.inCheck()).toBe(false)
        const moves = new Set(chess.moves({ square: p.square, verbose: true }).map((m) => m.to))
        expect(new Set(p.targets)).toEqual(moves)
        // targets never land on own pieces
        for (const t of p.targets) expect(p.placement[t]?.[0]).not.toBe(p.piece[0])
      }
    }
  })

  it('grades a selection', () => {
    const g = gradeSelection(['a1', 'b2', 'c3'], ['a1', 'c3', 'd4'])
    expect(g.hit).toEqual(['a1', 'c3'])
    expect(g.extra).toEqual(['d4'])
    expect(g.missed).toEqual(['b2'])
    expect(g.perfect).toBe(false)
    expect(gradeSelection(['a1'], ['a1']).perfect).toBe(true)
  })
})
