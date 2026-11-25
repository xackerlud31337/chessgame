import { describe, expect, it } from 'vitest'
import { START_FEN } from '../src/lib/fen'
import { checkAnswer, explain, generateQuestion, revealSquare, type QuestionKind } from '../src/lib/questions'

function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

const KINDS: QuestionKind[] = ['piece-on', 'in-check', 'king-square', 'count', 'castle', 'square-color', 'turn']

describe('blindfold questions', () => {
  it('generates every kind with a self-consistent answer', () => {
    const rng = seeded(3)
    for (const kind of KINDS) {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion(START_FEN, rng, [kind])
        expect(q.kind).toBe(kind)
        expect(q.text.length).toBeGreaterThan(5)
        expect(checkAnswer(q, q.answer)).toBe(true)
        expect(explain(q).length).toBeGreaterThan(3)
        revealSquare(q)
      }
    }
  })

  it('knows the starting position facts', () => {
    const rng = seeded(1)
    const king = generateQuestion(START_FEN, () => 0.1, ['king-square'])
    expect(king.kind === 'king-square' && king.answer).toBe('e1')
    expect(checkAnswer(king, ' E1 ')).toBe(true)
    expect(checkAnswer(king, 'e2')).toBe(false)
    const turn = generateQuestion(START_FEN, rng, ['turn'])
    expect(turn.answer).toBe('white')
    const castle = generateQuestion(START_FEN, rng, ['castle'])
    expect(castle.answer).toBe(true)
    const check = generateQuestion(START_FEN, rng, ['in-check'])
    expect(check.answer).toBe(false)
  })

  it('detects check and lost castling rights', () => {
    const fen = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b - - 0 4'
    const check = generateQuestion(fen, seeded(5), ['in-check'])
    expect(check.answer).toBe(true)
    expect(check.kind === 'in-check' && check.square).toBe('e8')
    const castle = generateQuestion(fen, seeded(5), ['castle'])
    expect(castle.answer).toBe(false)
  })

  it('piece-on offers 4 distinct choices including the answer', () => {
    const rng = seeded(9)
    for (let i = 0; i < 30; i++) {
      const q = generateQuestion(START_FEN, rng, ['piece-on'])
      if (q.kind !== 'piece-on') throw new Error()
      expect(q.choices).toHaveLength(4)
      expect(new Set(q.choices).size).toBe(4)
      expect(q.choices).toContain(q.answer)
    }
  })

  it('counts pieces', () => {
    const q = generateQuestion('8/8/8/3k4/8/8/P1P5/4K3 w - - 0 1', () => 0.01, ['count'])
    if (q.kind !== 'count') throw new Error()
    expect(q.color).toBe('w')
    expect(q.type).toBe('P')
    expect(q.answer).toBe(2)
    expect(q.choices).toContain(2)
  })
})
