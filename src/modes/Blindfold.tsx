import { useEffect, useMemo, useRef, useState } from 'react'
import { Board } from '../components/Board'
import { EndScreen } from '../components/EndScreen'
import { FenHelp } from '../components/FenHelp'
import { FenText } from '../components/FenText'
import { PIECE_SRC } from '../components/Piece'
import { SetShell } from '../components/SetShell'
import { SettingsPanel } from '../components/SettingsPanel'
import type { Highlight } from '../components/Square'
import { useKeyboard } from '../hooks/useKeyboard'
import { useSetRound } from '../hooks/useSetRound'
import { describePiece, piecesFromFen } from '../lib/fen'
import { pickPositions } from '../lib/positions'
import { seededRng } from '../lib/random'
import { checkAnswer, explain, generateQuestion, revealSquare, type Question } from '../lib/questions'
import type { Square } from '../lib/squares'

const PER_ROUND = 10

export function Blindfold({ onMenu }: { onMenu: () => void }) {
  const round = useSetRound('blindfold', PER_ROUND)
  const { settings } = round
  const positions = useMemo(() => pickPositions(PER_ROUND, settings.difficulty, seededRng(round.seed)), [settings.difficulty, round.seed])
  const position = positions[round.index]
  const question = useMemo<Question>(() => generateQuestion(position.fen, seededRng(round.seed + round.index)), [position.fen, round.seed, round.index])
  const pieces = useMemo(() => piecesFromFen(position.fen), [position.fen])

  const [typed, setTyped] = useState('')
  const [outcome, setOutcome] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (question.kind === 'king-square') inputRef.current?.focus()
  }, [question])

  const give = (value: string | boolean | number) => {
    if (outcome !== null) return
    const ok = checkAnswer(question, value)
    setOutcome(ok)
    round.answer(ok)
  }

  const goNext = () => {
    setTyped('')
    setOutcome(null)
    round.next()
  }

  const restart = () => {
    setTyped('')
    setOutcome(null)
    round.restart()
  }

  useKeyboard({ space: () => (round.result ? restart() : outcome !== null ? goNext() : undefined) })

  if (round.result) {
    return (
      <SetShell index={round.index} total={round.total} correct={round.correct} onMenu={onMenu}>
        <EndScreen title="Set complete" result={round.result} previousBest={round.bestBefore} onPlayAgain={restart} onMenu={onMenu} />
      </SetShell>
    )
  }

  const answered = outcome !== null
  const reveal = revealSquare(question)
  const highlights: Partial<Record<Square, Highlight>> = reveal ? { [reveal]: outcome ? 'correct' : 'wrong' } : {}

  const yesNo = (
    <div className="answers">
      <button type="button" className="btn lg" onClick={() => give(true)}>
        Yes
      </button>
      <button type="button" className="btn lg" onClick={() => give(false)}>
        No
      </button>
    </div>
  )

  let answerUi: React.ReactNode
  switch (question.kind) {
    case 'piece-on':
      answerUi = (
        <div className="answers">
          {question.choices.map((c) => (
            <button key={c} type="button" className="btn lg" onClick={() => give(c)} aria-label={c === 'empty' ? 'Empty' : describePiece(c)}>
              {c === 'empty' ? 'Empty' : <img src={PIECE_SRC[c]} alt="" style={{ width: 40, height: 40 }} draggable={false} />}
            </button>
          ))}
        </div>
      )
      break
    case 'in-check':
    case 'castle':
      answerUi = yesNo
      break
    case 'king-square':
      answerUi = (
        <form
          className="answer-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (typed.trim()) give(typed)
          }}
        >
          <label className="sr-only" htmlFor="bf-input">
            Square
          </label>
          <input
            id="bf-input"
            ref={inputRef}
            className="answer-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value.toLowerCase().replace(/[^a-h1-8]/g, '').slice(0, 2))}
            placeholder="e1"
            autoComplete="off"
            maxLength={2}
          />
          <button type="submit" className="btn primary" disabled={typed.length < 2}>
            Answer
          </button>
        </form>
      )
      break
    case 'count':
      answerUi = (
        <div className="answers">
          {question.choices.map((n) => (
            <button key={n} type="button" className="btn lg" onClick={() => give(n)}>
              {n}
            </button>
          ))}
        </div>
      )
      break
    case 'square-color':
      answerUi = (
        <div className="answers">
          <button type="button" className="btn lg" onClick={() => give('light')}>
            Light
          </button>
          <button type="button" className="btn lg" onClick={() => give('dark')}>
            Dark
          </button>
        </div>
      )
      break
    case 'turn':
      answerUi = (
        <div className="answers">
          <button type="button" className="btn lg" onClick={() => give('white')}>
            White
          </button>
          <button type="button" className="btn lg" onClick={() => give('black')}>
            Black
          </button>
        </div>
      )
      break
  }

  return (
    <SetShell index={round.index} total={round.total} correct={round.correct} onMenu={onMenu}>
      <FenText fen={position.fen} />
      <div className="question">{question.text}</div>
      {!answered && answerUi}
      {answered && (
        <>
          <div className={`result-line ${outcome ? 'ok' : 'bad'}`} aria-live="polite">
            {outcome ? 'Correct! ' : 'Not quite. '}
            {explain(question)}
          </div>
          <Board orientation="white" showCoordinates pieces={pieces} highlights={highlights} label="Revealed position" />
          <div className="row" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn primary lg" onClick={goNext} autoFocus>
              {round.index + 1 >= round.total ? 'Finish' : 'Next'} <kbd>Space</kbd>
            </button>
          </div>
        </>
      )}
      <FenHelp />
      {round.index === 0 && !answered && (
        <div className="card">
          <SettingsPanel show={['difficulty', 'sound']} compact />
        </div>
      )}
    </SetShell>
  )
}
