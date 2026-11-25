import { useCallback, useEffect, useRef, useState } from 'react'
import { sounds } from '../lib/sound'
import { accuracyOf, type ModeId, type RoundResult } from '../lib/stats'
import { randomSeed } from '../lib/random'
import { useSettings } from './useSettings'
import { useStats } from './useStats'

/**
 * A round made of a fixed number of items (positions / questions) rather
 * than a clock. Each item is answered once; the round ends after the last.
 */
export function useSetRound(mode: ModeId, total: number) {
  const { settings } = useSettings()
  const { stats, recordRound } = useStats()
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [result, setResult] = useState<RoundResult | null>(null)
  const [seed, setSeed] = useState(randomSeed)
  const startedAt = useRef(performance.now())
  const bestBefore = useRef(stats.modes[mode]?.best ?? 0)

  useEffect(() => {
    startedAt.current = performance.now()
  }, [seed])

  const answer = useCallback(
    (isCorrect: boolean) => {
      setAttempts((a) => a + 1)
      if (isCorrect) setCorrect((c) => c + 1)
      if (settings.sound) (isCorrect ? sounds.correct : sounds.wrong)()
    },
    [settings.sound],
  )

  const finish = useCallback(() => {
    const elapsed = performance.now() - startedAt.current
    const r: RoundResult = {
      at: Date.now(),
      score: correct,
      attempts,
      correct,
      accuracy: accuracyOf(correct, attempts),
      avgMs: attempts ? elapsed / attempts : 0,
      roundLength: 0,
    }
    bestBefore.current = stats.modes[mode]?.best ?? 0
    setResult(r)
    recordRound(mode, r)
    if (settings.sound) sounds.finish()
  }, [attempts, correct, mode, recordRound, settings.sound, stats.modes])

  /** Advance to the next item, or finish the round after the last one. */
  const next = useCallback(() => {
    if (index + 1 >= total) finish()
    else setIndex((i) => i + 1)
  }, [index, total, finish])

  const restart = useCallback(() => {
    setIndex(0)
    setCorrect(0)
    setAttempts(0)
    setResult(null)
    setSeed(randomSeed())
  }, [])

  return { index, total, correct, attempts, result, bestBefore: bestBefore.current, seed, answer, next, restart, settings }
}
