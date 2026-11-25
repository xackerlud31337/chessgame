import { describe, expect, it } from 'vitest'
import { pickRandom, randomSquare, sample, shuffle, squareDistractors } from '../src/lib/random'
import { isValidSquare, type Square } from '../src/lib/squares'

/** Deterministic LCG so tests are reproducible. */
function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

describe('random', () => {
  it('never returns the same square twice in a row', () => {
    const rng = seeded(42)
    let prev: Square | undefined
    for (let i = 0; i < 5000; i++) {
      const next = randomSquare(prev, rng)
      expect(isValidSquare(next)).toBe(true)
      expect(next).not.toBe(prev)
      prev = next
    }
  })

  it('still repeats when rng would pick the excluded value (edge case: rng=0 then prev excluded)', () => {
    // With rng always 0, pickRandom without exclude returns the first element.
    const zero = () => 0
    expect(randomSquare(undefined, zero)).toBe('a1')
    // Excluding a1 must shift to the next candidate, not return a1.
    expect(randomSquare('a1', zero)).toBe('b1')
  })

  it('pickRandom falls back when everything is excluded', () => {
    expect(pickRandom(['x'], 'x')).toBe('x')
    expect(() => pickRandom([], undefined)).toThrow()
  })

  it('shuffle is a permutation', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    const out = shuffle(items, seeded(7))
    expect([...out].sort()).toEqual([...items].sort())
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]) // not mutated
  })

  it('sample returns distinct items excluding the given one', () => {
    const out = sample([1, 2, 3, 4, 5], 3, 3, seeded(1))
    expect(out).toHaveLength(3)
    expect(new Set(out).size).toBe(3)
    expect(out).not.toContain(3)
  })

  it('distractors are valid, distinct and never the answer', () => {
    const rng = seeded(99)
    for (const answer of ['a1', 'h8', 'e4', 'b5', 'd1'] as Square[]) {
      const d = squareDistractors(answer, 3, rng)
      expect(d).toHaveLength(3)
      expect(new Set(d).size).toBe(3)
      expect(d).not.toContain(answer)
      for (const s of d) expect(isValidSquare(s)).toBe(true)
    }
  })
})
