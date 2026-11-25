import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Square } from '../lib/squares'
import {
  EMPTY_STATS,
  recordRound as pureRecordRound,
  recordSquareAttempt as pureRecordSquare,
  sanitizeStats,
  type ModeId,
  type RoundResult,
  type Stats,
} from '../lib/stats'
import { storage } from '../lib/storage'

const KEY = 'stats'

interface StatsContextValue {
  stats: Stats
  recordRound: (mode: ModeId, result: RoundResult) => void
  recordSquareAttempt: (square: Square, correct: boolean) => void
  resetStats: () => void
}

const StatsContext = createContext<StatsContextValue | null>(null)

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<Stats>(() => sanitizeStats(storage.load(KEY, EMPTY_STATS)))
  useEffect(() => {
    storage.save(KEY, stats)
  }, [stats])

  const recordRound = useCallback((mode: ModeId, result: RoundResult) => {
    setStats((s) => pureRecordRound(s, mode, result))
  }, [])
  const recordSquareAttempt = useCallback((square: Square, correct: boolean) => {
    setStats((s) => pureRecordSquare(s, square, correct))
  }, [])
  const resetStats = useCallback(() => {
    setStats(EMPTY_STATS)
    storage.remove(KEY)
  }, [])

  const value = useMemo(
    () => ({ stats, recordRound, recordSquareAttempt, resetStats }),
    [stats, recordRound, recordSquareAttempt, resetStats],
  )
  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>
}

export function useStats(): StatsContextValue {
  const ctx = useContext(StatsContext)
  if (!ctx) throw new Error('useStats outside StatsProvider')
  return ctx
}
