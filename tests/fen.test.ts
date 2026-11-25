import { describe, expect, it } from 'vitest'
import {
  START_FEN,
  boardPartOf,
  compareBoardParts,
  comparePlacements,
  isValidFen,
  letterToPiece,
  parseBoardPart,
  piecesFromFen,
  placementToBoardPart,
} from '../src/lib/fen'

describe('fen', () => {
  it('maps letters to pieces', () => {
    expect(letterToPiece('K')).toBe('wK')
    expect(letterToPiece('q')).toBe('bQ')
    expect(letterToPiece('x')).toBeNull()
    expect(letterToPiece('1')).toBeNull()
  })

  it('extracts the board part', () => {
    expect(boardPartOf(START_FEN)).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')
    expect(boardPartOf('  8/8/8/8/8/8/8/8 w - - 0 1 ')).toBe('8/8/8/8/8/8/8/8')
  })

  it('parses the starting position', () => {
    const r = parseBoardPart(boardPartOf(START_FEN))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.placement.e1).toBe('wK')
    expect(r.placement.e8).toBe('bK')
    expect(r.placement.a2).toBe('wP')
    expect(r.placement.h7).toBe('bP')
    expect(r.placement.e4).toBeUndefined()
    expect(Object.keys(r.placement)).toHaveLength(32)
  })

  it('parses ranks with mixed digits and pieces', () => {
    const r = parseBoardPart('8/8/8/3k4/8/8/8/4K3')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.placement).toEqual({ d5: 'bK', e1: 'wK' })
  })

  it('rejects malformed board parts', () => {
    expect(parseBoardPart('8/8/8/8/8/8/8').ok).toBe(false)
    expect(parseBoardPart('9/8/8/8/8/8/8/8').ok).toBe(false)
    expect(parseBoardPart('7/8/8/8/8/8/8/8').ok).toBe(false)
    expect(parseBoardPart('8/8/8/8/8/8/8/ppppppppp').ok).toBe(false)
    const bad = parseBoardPart('8/8/8/8/8/8/8/rnbqkbnx')
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.rank).toBe(1)
  })

  it('round-trips placement -> board part', () => {
    const part = boardPartOf(START_FEN)
    const parsed = parseBoardPart(part)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(placementToBoardPart(parsed.placement)).toBe(part)
    expect(placementToBoardPart({})).toBe('8/8/8/8/8/8/8/8')
    expect(placementToBoardPart({ d5: 'bK', e1: 'wK' })).toBe('8/8/8/3k4/8/8/8/4K3')
  })

  describe('compareBoardParts', () => {
    const expected = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR'

    it('accepts an identical string', () => {
      expect(compareBoardParts(expected, expected)).toEqual({ equal: true, firstWrongRank: null, wrongRanks: [] })
    })

    it('ignores digit grouping differences', () => {
      expect(compareBoardParts(expected, 'rnbqkbnr/pppppppp/44/8/4P3/8/PPPP1PPP/RNBQKBNR').equal).toBe(true)
      expect(compareBoardParts(expected, 'rnbqkbnr/pppppppp/8/8/22P3/8/PPPP1PPP/RNBQKBNR').equal).toBe(true)
    })

    it('finds the first wrong rank from the top', () => {
      // Rank 4 (5th from top) has the pawn on d4 instead of e4; rank 2 also wrong.
      const r = compareBoardParts(expected, 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR')
      expect(r.equal).toBe(false)
      expect(r.firstWrongRank).toBe(4)
      expect(r.wrongRanks).toEqual([4, 2])
    })

    it('flags a wrong 8th rank first', () => {
      const r = compareBoardParts(expected, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR'.replace('rnbqkbnr', 'rnbkqbnr'))
      expect(r.firstWrongRank).toBe(8)
    })

    it('handles too few or too many ranks and junk', () => {
      expect(compareBoardParts(expected, '').equal).toBe(false)
      expect(compareBoardParts(expected, '').firstWrongRank).toBe(8)
      const few = compareBoardParts(expected, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP')
      expect(few.firstWrongRank).toBe(1)
      const many = compareBoardParts(expected, expected + '/8')
      expect(many.equal).toBe(false)
      const junk = compareBoardParts(expected, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNX')
      expect(junk.firstWrongRank).toBe(1)
    })

    it('tolerates surrounding whitespace', () => {
      expect(compareBoardParts(expected, `  ${expected}\n`).equal).toBe(true)
    })
  })

  it('compares placements square by square', () => {
    const d = comparePlacements({ e1: 'wK', e8: 'bK', d4: 'wP' }, { e1: 'wK', e8: 'bQ', c3: 'wN' })
    expect(d.correct).toEqual(['e1'])
    expect(d.wrong.sort()).toEqual(['c3', 'e8'])
    expect(d.missing).toEqual(['d4'])
  })

  it('validates full FENs with chess.js', () => {
    expect(isValidFen(START_FEN)).toBe(true)
    expect(isValidFen('8/8/8/8/8/8/8/8 w - - 0 1')).toBe(false) // no kings
    expect(piecesFromFen(START_FEN).d1).toBe('wQ')
    expect(piecesFromFen('garbage')).toEqual({})
  })
})
