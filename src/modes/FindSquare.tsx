import { useCallback, useEffect, useRef, useState } from 'react'
import { Board } from '../components/Board'
import { DrillShell } from '../components/DrillShell'
import { EndScreen } from '../components/EndScreen'
import { SettingsPanel } from '../components/SettingsPanel'
import type { Highlight } from '../components/Square'
import { useKeyboard } from '../hooks/useKeyboard'
import { useRound, useTimeouts } from '../hooks/useRound'
import { randomSquare } from '../lib/random'
import type { Square } from '../lib/squares'

type Highlights = Partial<Record<Square, Highlight>>

const CORRECT_FLASH_MS = 220
const WRONG_FLASH_MS = 650

export function FindSquare({ onMenu }: { onMenu: () => void }) {
  const { drill, orientation, result, bestBefore, playAgain, recordSquareAttempt, feedback, settings } = useRound('find')
  const [target, setTarget] = useState<Square>(() => randomSquare())
  const [highlights, setHighlights] = useState<Highlights>({})
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [locked, setLocked] = useState(false)
  const { schedule, clearAll } = useTimeouts()
  const flashId = useRef(0)
  const { status } = drill.state

  const nextTarget = useCallback(() => setTarget((t) => randomSquare(t)), [])

  // Clear any pending feedback when the round ends.
  useEffect(() => {
    if (status === 'finished') {
      clearAll()
      setHighlights({})
      setLocked(false)
    }
  }, [status, clearAll])

  const handleClick = (sq: Square) => {
    if (locked || status === 'finished') return
    const correct = sq === target
    if (!drill.answer(correct)) return
    recordSquareAttempt(target, correct)
    feedback(correct)
    const id = ++flashId.current
    if (correct) {
      setHighlights({ [sq]: 'correct' })
      setFlash('correct')
      nextTarget()
      schedule(() => {
        if (flashId.current === id) setHighlights({})
      }, CORRECT_FLASH_MS)
    } else {
      setHighlights({ [sq]: 'wrong', [target]: 'correct' })
      setFlash('wrong')
      setLocked(true)
      schedule(() => {
        setHighlights({})
        setLocked(false)
        nextTarget()
      }, WRONG_FLASH_MS)
    }
  }

  const restart = () => {
    playAgain()
    setHighlights({})
    setFlash(null)
    setLocked(false)
    nextTarget()
  }

  useKeyboard({
    space: () => {
      if (status === 'idle') drill.start()
      else if (status === 'finished') restart()
    },
  })

  if (status === 'finished' && result) {
    return (
      <DrillShell drill={drill} onMenu={onMenu}>
        <EndScreen result={result} previousBest={bestBefore} onPlayAgain={restart} onMenu={onMenu} />
      </DrillShell>
    )
  }

  return (
    <DrillShell drill={drill} onMenu={onMenu}>
      <div className={`target${flash ? ` flash-${flash}` : ''}`} key={drill.state.attempts} aria-live="assertive" aria-atomic="true">
        <span className="sr-only">Find </span>
        {target}
      </div>
      <Board orientation={orientation} showCoordinates={settings.showCoordinates} highlights={highlights} onSquareClick={handleClick} />
      {status === 'idle' && (
        <div className="idle-overlay">
          <div className="row" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn primary lg" onClick={drill.start}>
              Start <kbd>Space</kbd>
            </button>
          </div>
          <p className="hint-line">…or just click the square. The clock starts on your first click.</p>
          <div className="card" style={{ width: '100%', textAlign: 'left' }}>
            <SettingsPanel show={['side', 'roundLength', 'coordinates', 'sound']} compact />
          </div>
        </div>
      )}
      {status === 'running' && settings.roundLength === 0 && (
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn" onClick={drill.finish}>
            Finish round
          </button>
        </div>
      )}
    </DrillShell>
  )
}
