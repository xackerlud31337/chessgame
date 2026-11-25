import { useCallback, useEffect, useRef, useState } from 'react'
import { sounds } from '../lib/sound'
import type { Orientation } from '../lib/squares'
import { accuracyOf, type ModeId, type RoundResult } from '../lib/stats'
import { useDrill } from './useDrill'
import { resolveSide, useSettings } from './useSettings'
import { useStats } from './useStats'

/**
 * A drill round for a given mode: wraps useDrill with orientation
 * resolution, result recording and the "best before this round" value the
 * end screen needs.
 */
export function useRound(mode: ModeId) {
  const { settings } = useSettings()
  const { stats, recordRound, recordSquareAttempt } = useStats()
  const drill = useDrill(settings.roundLength)
  const [orientation, setOrientation] = useState<Orientation>(() => resolveSide(settings.side))
  const [result, setResult] = useState<RoundResult | null>(null)
  const bestBefore = useRef(stats.modes[mode]?.best ?? 0)
  const { status } = drill.state

  // Re-roll the orientation whenever we're idle and the side setting changes
  // (or we come back to idle for a new round).
  useEffect(() => {
    if (status === 'idle') setOrientation(resolveSide(settings.side))
  }, [settings.side, status])

  // Record the round exactly once when the clock runs out / Finish is pressed.
  useEffect(() => {
    if (status !== 'finished' || result) return
    const s = drill.state
    const r: RoundResult = {
      at: Date.now(),
      score: s.score,
      attempts: s.attempts,
      correct: s.correct,
      accuracy: accuracyOf(s.correct, s.attempts),
      avgMs: s.attempts ? s.elapsedMs / s.attempts : 0,
      roundLength: settings.roundLength,
    }
    bestBefore.current = stats.modes[mode]?.best ?? 0
    setResult(r)
    recordRound(mode, r)
    if (settings.sound) sounds.finish()
  }, [status, result, drill.state, settings.roundLength, settings.sound, stats.modes, mode, recordRound])

  const playAgain = useCallback(() => {
    setResult(null)
    drill.reset()
  }, [drill])

  const feedback = useCallback(
    (correct: boolean) => {
      if (!settings.sound) return
      if (correct) sounds.correct()
      else sounds.wrong()
    },
    [settings.sound],
  )

  return { drill, orientation, result, bestBefore: bestBefore.current, playAgain, recordSquareAttempt, feedback, settings }
}

/** setTimeout bookkeeping that is cleared on unmount. */
export function useTimeouts() {
  const ids = useRef<number[]>([])
  useEffect(() => () => ids.current.forEach((id) => window.clearTimeout(id)), [])
  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      ids.current = ids.current.filter((x) => x !== id)
      fn()
    }, ms)
    ids.current.push(id)
    return id
  }, [])
  const clearAll = useCallback(() => {
    ids.current.forEach((id) => window.clearTimeout(id))
    ids.current = []
  }, [])
  return { schedule, clearAll }
}
