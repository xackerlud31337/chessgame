import type { Square } from './squares'

export type ModeId = 'find' | 'name' | 'fenToBoard' | 'boardToFen' | 'blindfold' | 'pieceVision'

export const MODE_LABELS: Record<ModeId, string> = {
  find: 'Find the square',
  name: 'Name the square',
  fenToBoard: 'FEN → board',
  boardToFen: 'Board → FEN',
  blindfold: 'Blindfold',
  pieceVision: 'Piece vision',
}

export interface RoundResult {
  /** Unix ms when the round ended. */
  at: number
  score: number
  attempts: number
  correct: number
  /** 0..100 */
  accuracy: number
  /** Average ms per attempt. */
  avgMs: number
  /** Round length in seconds the user played (0 = untimed). */
  roundLength: number
}

export interface ModeStats {
  best: number
  roundsPlayed: number
  /** Most recent rounds, newest last, capped at RECENT_LIMIT. */
  recent: RoundResult[]
}

export interface SquareStat {
  attempts: number
  errors: number
}

export interface Stats {
  version: 1
  modes: Partial<Record<ModeId, ModeStats>>
  squares: Partial<Record<Square, SquareStat>>
}

export const RECENT_LIMIT = 20

export const EMPTY_STATS: Stats = { version: 1, modes: {}, squares: {} }

export function emptyModeStats(): ModeStats {
  return { best: 0, roundsPlayed: 0, recent: [] }
}

export function accuracyOf(correct: number, attempts: number): number {
  return attempts === 0 ? 0 : Math.round((correct / attempts) * 100)
}

/** Returns a new Stats with the round appended. Pure. */
export function recordRound(stats: Stats, mode: ModeId, result: RoundResult): Stats {
  const prev = stats.modes[mode] ?? emptyModeStats()
  const recent = [...prev.recent, result].slice(-RECENT_LIMIT)
  return {
    ...stats,
    modes: {
      ...stats.modes,
      [mode]: {
        best: Math.max(prev.best, result.score),
        roundsPlayed: prev.roundsPlayed + 1,
        recent,
      },
    },
  }
}

/** Track a per-square attempt. Pure. */
export function recordSquareAttempt(stats: Stats, square: Square, correct: boolean): Stats {
  const prev = stats.squares[square] ?? { attempts: 0, errors: 0 }
  return {
    ...stats,
    squares: {
      ...stats.squares,
      [square]: { attempts: prev.attempts + 1, errors: prev.errors + (correct ? 0 : 1) },
    },
  }
}

/** Error rate 0..1 for a square, or null if never attempted. */
export function errorRate(stats: Stats, square: Square): number | null {
  const s = stats.squares[square]
  if (!s || s.attempts === 0) return null
  return s.errors / s.attempts
}

/** Squares with the highest error rate (min 2 attempts), worst first. */
export function weakestSquares(stats: Stats, limit = 5): { square: Square; rate: number; attempts: number }[] {
  return (Object.entries(stats.squares) as [Square, SquareStat][])
    .filter(([, s]) => s.attempts >= 2 && s.errors > 0)
    .map(([square, s]) => ({ square, rate: s.errors / s.attempts, attempts: s.attempts }))
    .sort((a, b) => b.rate - a.rate || b.attempts - a.attempts)
    .slice(0, limit)
}

/** Validate something loaded from storage; fall back to empty on junk. */
export function sanitizeStats(input: unknown): Stats {
  if (!input || typeof input !== 'object') return EMPTY_STATS
  const obj = input as Partial<Stats>
  if (obj.version !== 1 || typeof obj.modes !== 'object' || typeof obj.squares !== 'object') return EMPTY_STATS
  return { version: 1, modes: obj.modes ?? {}, squares: obj.squares ?? {} }
}
