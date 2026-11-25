import { describe, expect, it } from 'vitest'
import {
  ALL_SQUARES,
  coordsToSquare,
  displayOrder,
  fileLabels,
  indexToSquare,
  isLightSquare,
  isValidSquare,
  rankLabels,
  squareToCoords,
  squareToIndex,
  type Square,
} from '../src/lib/squares'

describe('squares', () => {
  it('lists 64 unique squares', () => {
    expect(ALL_SQUARES).toHaveLength(64)
    expect(new Set(ALL_SQUARES).size).toBe(64)
  })

  it('validates square names', () => {
    expect(isValidSquare('a1')).toBe(true)
    expect(isValidSquare('h8')).toBe(true)
    expect(isValidSquare('i1')).toBe(false)
    expect(isValidSquare('a9')).toBe(false)
    expect(isValidSquare('A1')).toBe(false)
    expect(isValidSquare('')).toBe(false)
  })

  it('converts between coords and squares', () => {
    expect(squareToCoords('a1')).toEqual({ file: 0, rank: 0 })
    expect(squareToCoords('h8')).toEqual({ file: 7, rank: 7 })
    expect(squareToCoords('e4')).toEqual({ file: 4, rank: 3 })
    expect(coordsToSquare(4, 3)).toBe('e4')
    expect(() => coordsToSquare(8, 0)).toThrow()
  })

  it('knows light and dark squares', () => {
    expect(isLightSquare('a1')).toBe(false)
    expect(isLightSquare('h1')).toBe(true)
    expect(isLightSquare('a8')).toBe(true)
    expect(isLightSquare('h8')).toBe(false)
    expect(isLightSquare('e4')).toBe(true)
    expect(isLightSquare('d4')).toBe(false)
  })

  describe('white orientation', () => {
    it('puts a8 top-left and h1 bottom-right', () => {
      expect(squareToIndex('a8', 'white')).toBe(0)
      expect(squareToIndex('h8', 'white')).toBe(7)
      expect(squareToIndex('a1', 'white')).toBe(56)
      expect(squareToIndex('h1', 'white')).toBe(63)
      expect(indexToSquare(0, 'white')).toBe('a8')
      expect(indexToSquare(63, 'white')).toBe('h1')
    })
    it('labels files a..h and ranks 8..1', () => {
      expect(fileLabels('white').join('')).toBe('abcdefgh')
      expect(rankLabels('white').join('')).toBe('87654321')
    })
  })

  describe('black orientation', () => {
    it('puts h1 top-left and a8 bottom-right', () => {
      expect(squareToIndex('h1', 'black')).toBe(0)
      expect(squareToIndex('a1', 'black')).toBe(7)
      expect(squareToIndex('h8', 'black')).toBe(56)
      expect(squareToIndex('a8', 'black')).toBe(63)
      expect(indexToSquare(0, 'black')).toBe('h1')
      expect(indexToSquare(63, 'black')).toBe('a8')
    })
    it('labels files h..a and ranks 1..8', () => {
      expect(fileLabels('black').join('')).toBe('hgfedcba')
      expect(rankLabels('black').join('')).toBe('12345678')
    })
  })

  it('round-trips every square in both orientations', () => {
    for (const o of ['white', 'black'] as const) {
      for (const sq of ALL_SQUARES) {
        expect(indexToSquare(squareToIndex(sq, o), o)).toBe(sq)
      }
      const order = displayOrder(o)
      expect(order).toHaveLength(64)
      expect(new Set(order).size).toBe(64)
    }
  })

  it('black orientation is the 180° rotation of white', () => {
    const w = displayOrder('white')
    const b = displayOrder('black')
    expect(b).toEqual([...w].reverse())
    const e4: Square = 'e4'
    expect(squareToIndex(e4, 'black')).toBe(63 - squareToIndex(e4, 'white'))
  })
})
