import { describe, expect, it } from 'vitest'
import {
  EMPTY_STATS,
  RECENT_LIMIT,
  accuracyOf,
  errorRate,
  recordRound,
  recordSquareAttempt,
  sanitizeStats,
  weakestSquares,
  type RoundResult,
} from '../src/lib/stats'

const round = (score: number): RoundResult => ({
  at: 1700000000000,
  score,
  attempts: score + 2,
  correct: score,
  accuracy: accuracyOf(score, score + 2),
  avgMs: 1000,
  roundLength: 30,
})

describe('stats', () => {
  it('computes accuracy', () => {
    expect(accuracyOf(0, 0)).toBe(0)
    expect(accuracyOf(3, 4)).toBe(75)
    expect(accuracyOf(2, 3)).toBe(67)
  })

  it('records rounds and tracks the best score', () => {
    let s = recordRound(EMPTY_STATS, 'find', round(10))
    s = recordRound(s, 'find', round(7))
    expect(s.modes.find?.best).toBe(10)
    expect(s.modes.find?.roundsPlayed).toBe(2)
    expect(s.modes.find?.recent.map((r) => r.score)).toEqual([10, 7])
    expect(s.modes.name).toBeUndefined()
    expect(EMPTY_STATS.modes.find).toBeUndefined() // not mutated
  })

  it('keeps only the most recent rounds', () => {
    let s = EMPTY_STATS
    for (let i = 0; i < RECENT_LIMIT + 5; i++) s = recordRound(s, 'name', round(i))
    expect(s.modes.name?.recent).toHaveLength(RECENT_LIMIT)
    expect(s.modes.name?.recent[0].score).toBe(5)
    expect(s.modes.name?.roundsPlayed).toBe(RECENT_LIMIT + 5)
  })

  it('tracks per-square error rates', () => {
    let s = recordSquareAttempt(EMPTY_STATS, 'f7', false)
    s = recordSquareAttempt(s, 'f7', true)
    s = recordSquareAttempt(s, 'e4', true)
    expect(errorRate(s, 'f7')).toBe(0.5)
    expect(errorRate(s, 'e4')).toBe(0)
    expect(errorRate(s, 'a1')).toBeNull()
  })

  it('lists weakest squares, worst first, needing 2+ attempts', () => {
    let s = EMPTY_STATS
    s = recordSquareAttempt(s, 'g2', false) // only 1 attempt -> excluded
    for (const ok of [false, false, true]) s = recordSquareAttempt(s, 'f7', ok)
    for (const ok of [false, true, true, true]) s = recordSquareAttempt(s, 'c6', ok)
    for (const ok of [true, true]) s = recordSquareAttempt(s, 'e4', ok)
    const weak = weakestSquares(s)
    expect(weak.map((w) => w.square)).toEqual(['f7', 'c6'])
  })

  it('sanitizes junk from storage', () => {
    expect(sanitizeStats(null)).toEqual(EMPTY_STATS)
    expect(sanitizeStats('x')).toEqual(EMPTY_STATS)
    expect(sanitizeStats({ version: 0 })).toEqual(EMPTY_STATS)
    const good = recordRound(EMPTY_STATS, 'find', round(1))
    expect(sanitizeStats(JSON.parse(JSON.stringify(good)))).toEqual(good)
  })
})
