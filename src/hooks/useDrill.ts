import { useCallback, useEffect, useRef, useState } from 'react'

export type DrillStatus = 'idle' | 'running' | 'finished'

export interface DrillState {
  status: DrillStatus
  score: number
  attempts: number
  correct: number
  streak: number
  bestStreak: number
  elapsedMs: number
}

const initial: DrillState = { status: 'idle', score: 0, attempts: 0, correct: 0, streak: 0, bestStreak: 0, elapsedMs: 0 }

/**
 * Shared round engine: clock, score, streak. The clock starts on start(),
 * which modes call on the first answer or a Start button, never on mount.
 * roundLengthSec = 0 means untimed (finish() must be called).
 */
export function useDrill(roundLengthSec: number) {
  const [state, setState] = useState<DrillState>(initial)
  const startedAt = useRef<number | null>(null)
  const finishedAt = useRef<number | null>(null)
  const limitMs = roundLengthSec * 1000

  // Clock tick while running.
  useEffect(() => {
    if (state.status !== 'running') return
    const id = window.setInterval(() => {
      const started = startedAt.current
      if (started === null) return
      const elapsed = performance.now() - started
      if (limitMs > 0 && elapsed >= limitMs) {
        finishedAt.current = started + limitMs
        setState((s) => (s.status === 'running' ? { ...s, status: 'finished', elapsedMs: limitMs } : s))
      } else {
        setState((s) => ({ ...s, elapsedMs: elapsed }))
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [state.status, limitMs])

  const start = useCallback(() => {
    setState((s) => {
      if (s.status === 'running') return s
      startedAt.current = performance.now()
      finishedAt.current = null
      return { ...initial, status: 'running' }
    })
  }, [])

  /** Record an answer. Starts the clock if idle. Returns false if the round is over. */
  const answer = useCallback((isCorrect: boolean): boolean => {
    let accepted = true
    setState((s) => {
      if (s.status === 'finished') {
        accepted = false
        return s
      }
      if (s.status === 'idle') {
        startedAt.current = performance.now()
        finishedAt.current = null
      }
      const streak = isCorrect ? s.streak + 1 : 0
      return {
        status: 'running',
        score: s.score + (isCorrect ? 1 : 0),
        attempts: s.attempts + 1,
        correct: s.correct + (isCorrect ? 1 : 0),
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
        elapsedMs: startedAt.current === null ? 0 : performance.now() - startedAt.current,
      }
    })
    return accepted
  }, [])

  const finish = useCallback(() => {
    setState((s) => {
      if (s.status !== 'running') return s
      const elapsed = startedAt.current === null ? s.elapsedMs : performance.now() - startedAt.current
      finishedAt.current = performance.now()
      return { ...s, status: 'finished', elapsedMs: elapsed }
    })
  }, [])

  const reset = useCallback(() => {
    startedAt.current = null
    finishedAt.current = null
    setState(initial)
  }, [])

  const remainingMs = limitMs > 0 ? Math.max(0, limitMs - state.elapsedMs) : null
  const avgMs = state.attempts > 0 ? state.elapsedMs / state.attempts : 0

  return { state, remainingMs, avgMs, limitMs, start, answer, finish, reset }
}

export type Drill = ReturnType<typeof useDrill>
