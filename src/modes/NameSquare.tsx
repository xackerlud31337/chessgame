import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Board } from '../components/Board'
import { DrillShell } from '../components/DrillShell'
import { EndScreen } from '../components/EndScreen'
import { SettingsPanel } from '../components/SettingsPanel'
import type { Highlight } from '../components/Square'
import { useKeyboard } from '../hooks/useKeyboard'
import { useRound, useTimeouts } from '../hooks/useRound'
import { randomSquare, shuffle, squareDistractors } from '../lib/random'
import { isValidSquare, type Square } from '../lib/squares'

type Highlights = Partial<Record<Square, Highlight>>

const WRONG_FLASH_MS = 800
const CORRECT_FLASH_MS = 200

export function NameSquare({ onMenu }: { onMenu: () => void }) {
  const { drill, orientation, result, bestBefore, playAgain, recordSquareAttempt, feedback, settings } = useRound('name')
  const [target, setTarget] = useState<Square>(() => randomSquare())
  const [typed, setTyped] = useState('')
  const [inputWrong, setInputWrong] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [choiceMarks, setChoiceMarks] = useState<Partial<Record<Square, 'correct' | 'wrong'>>>({})
  const [locked, setLocked] = useState(false)
  const [boardHl, setBoardHl] = useState<Highlights>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const { schedule, clearAll } = useTimeouts()
  const { status } = drill.state

  const choices = useMemo(() => shuffle([target, ...squareDistractors(target, 3)]), [target])

  const nextTarget = useCallback(() => setTarget((t) => randomSquare(t)), [])

  useEffect(() => {
    if (status === 'finished') {
      clearAll()
      setLocked(false)
      setChoiceMarks({})
      setBoardHl({})
    }
  }, [status, clearAll])

  // Keep the input focused during typing rounds.
  useEffect(() => {
    if (settings.nameInput === 'type' && status !== 'finished') inputRef.current?.focus()
  }, [settings.nameInput, status, target])

  const submit = (answer: Square) => {
    if (locked || status === 'finished') return
    const correct = answer === target
    if (!drill.answer(correct)) return
    recordSquareAttempt(target, correct)
    feedback(correct)
    if (correct) {
      setMessage(null)
      setInputWrong(false)
      setBoardHl({ [target]: 'correct' })
      setChoiceMarks({ [answer]: 'correct' })
      nextTarget()
      setTyped('')
      schedule(() => {
        setBoardHl({})
        setChoiceMarks({})
      }, CORRECT_FLASH_MS)
    } else {
      setMessage(`That was ${target}`)
      setInputWrong(true)
      setChoiceMarks({ [answer]: 'wrong', [target]: 'correct' })
      setBoardHl({ [target]: 'wrong' })
      setLocked(true)
      schedule(() => {
        setLocked(false)
        setInputWrong(false)
        setMessage(null)
        setChoiceMarks({})
        setBoardHl({})
        setTyped('')
        nextTarget()
      }, WRONG_FLASH_MS)
    }
  }

  const onType = (value: string) => {
    const v = value.toLowerCase().replace(/[^a-h1-8]/g, '').slice(0, 2)
    setTyped(v)
    // Auto-submit once a full, valid square is typed.
    if (isValidSquare(v)) submit(v)
  }

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValidSquare(typed)) submit(typed)
    else if (typed.length > 0) {
      setInputWrong(true)
      schedule(() => setInputWrong(false), 300)
    }
  }

  const restart = () => {
    playAgain()
    setTyped('')
    setMessage(null)
    setInputWrong(false)
    setChoiceMarks({})
    setBoardHl({})
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

  const highlights: Highlights = { [target]: 'hint', ...boardHl }

  return (
    <DrillShell drill={drill} onMenu={onMenu}>
      <p className="hint-line" style={{ margin: 0 }}>
        Which square is highlighted?
      </p>
      <Board orientation={orientation} showCoordinates={false} highlights={highlights} label={`Board with one highlighted square`} />
      {settings.nameInput === 'type' ? (
        <form className="answer-form" onSubmit={onSubmitForm}>
          <label className="sr-only" htmlFor="name-input">
            Square name
          </label>
          <input
            id="name-input"
            ref={inputRef}
            className={`answer-input${inputWrong ? ' wrong' : ''}`}
            value={typed}
            onChange={(e) => onType(e.target.value)}
            placeholder="e4"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            maxLength={2}
            disabled={locked}
            aria-describedby="name-msg"
          />
        </form>
      ) : (
        <div className="choices" role="group" aria-label="Pick the square name">
          {choices.map((c) => (
            <button
              key={c}
              type="button"
              className={`btn${choiceMarks[c] ? ` ${choiceMarks[c]}` : ''}`}
              onClick={() => submit(c)}
              disabled={locked}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div id="name-msg" className={`result-line${message ? ' bad' : ''}`} aria-live="polite">
        {message ?? ''}
      </div>
      {status === 'idle' && (
        <div className="idle-overlay">
          <p className="hint-line" style={{ margin: 0 }}>
            The clock starts on your first answer. Type two characters (like <code>e4</code>) and it submits itself.
          </p>
          <div className="card" style={{ width: '100%', textAlign: 'left' }}>
            <SettingsPanel show={['side', 'roundLength', 'nameInput', 'sound']} compact />
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
