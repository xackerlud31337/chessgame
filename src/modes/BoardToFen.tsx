import { useEffect, useMemo, useRef, useState } from 'react'
import { Board } from '../components/Board'
import { EndScreen } from '../components/EndScreen'
import { FenHelp } from '../components/FenHelp'
import { FenText } from '../components/FenText'
import { SetShell } from '../components/SetShell'
import { SettingsPanel } from '../components/SettingsPanel'
import type { Highlight } from '../components/Square'
import { useKeyboard } from '../hooks/useKeyboard'
import { useSetRound } from '../hooks/useSetRound'
import { boardPartOf, compareBoardParts, piecesFromFen, type BoardComparison } from '../lib/fen'
import { pickPositions } from '../lib/positions'
import { seededRng } from '../lib/random'
import { FILES, type Square } from '../lib/squares'

const PER_ROUND = 5

export function BoardToFen({ onMenu }: { onMenu: () => void }) {
  const round = useSetRound('boardToFen', PER_ROUND)
  const { settings } = round
  const positions = useMemo(() => pickPositions(PER_ROUND, settings.difficulty, seededRng(round.seed)), [settings.difficulty, round.seed])
  const position = positions[round.index]
  const pieces = useMemo(() => piecesFromFen(position.fen), [position.fen])

  const [text, setText] = useState('')
  const [comparison, setComparison] = useState<BoardComparison | null>(null)
  const [done, setDone] = useState<'right' | 'revealed' | null>(null)
  const [firstTry, setFirstTry] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [round.index])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (done) return
    const c = compareBoardParts(boardPartOf(position.fen), text)
    setComparison(c)
    if (c.equal) {
      round.answer(firstTry)
      setDone('right')
    } else {
      setFirstTry(false)
    }
  }

  const reveal = () => {
    round.answer(false)
    setDone('revealed')
    setComparison(null)
  }

  const goNext = () => {
    setText('')
    setComparison(null)
    setDone(null)
    setFirstTry(true)
    round.next()
  }

  const restart = () => {
    setText('')
    setComparison(null)
    setDone(null)
    setFirstTry(true)
    round.restart()
  }

  useKeyboard({ space: () => (round.result ? restart() : done ? goNext() : undefined) })

  if (round.result) {
    return (
      <SetShell index={round.index} total={round.total} correct={round.correct} onMenu={onMenu}>
        <EndScreen title="Set complete" result={round.result} previousBest={round.bestBefore} onPlayAgain={restart} onMenu={onMenu} />
      </SetShell>
    )
  }

  const highlights: Partial<Record<Square, Highlight>> = {}
  if (comparison && !comparison.equal && comparison.firstWrongRank) {
    for (const f of FILES) highlights[`${f}${comparison.firstWrongRank}` as Square] = 'wrong'
  }

  return (
    <SetShell index={round.index} total={round.total} correct={round.correct} onMenu={onMenu}>
      <p className="hint-line" style={{ margin: 0 }}>
        Write the piece placement (the part before the first space). Score counts first-try answers.
      </p>
      <Board orientation="white" showCoordinates={settings.showCoordinates} pieces={pieces} highlights={highlights} label="Position to transcribe" />
      {done ? (
        <>
          <FenText fen={position.fen} showOk boardOnly />
          <div className={`result-line ${done === 'right' ? 'ok' : 'bad'}`} aria-live="polite">
            {done === 'right' ? (firstTry ? 'Correct, first try!' : 'Correct (after a retry).') : 'Here is the answer.'}
          </div>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn primary lg" onClick={goNext} autoFocus>
              {round.index + 1 >= round.total ? 'Finish' : 'Next'} <kbd>Space</kbd>
            </button>
          </div>
        </>
      ) : (
        <form className="stack" onSubmit={submit}>
          <label className="sr-only" htmlFor="fen-input">
            FEN piece placement
          </label>
          <input
            id="fen-input"
            ref={inputRef}
            className="fen-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {comparison && !comparison.equal && (
            <div className="result-line bad" aria-live="polite">
              Rank {comparison.firstWrongRank} is wrong
              {comparison.wrongRanks.length > 1 ? ` (${comparison.wrongRanks.length} ranks differ)` : ''}. Fix it and check again.
            </div>
          )}
          <div className="row" style={{ justifyContent: 'center' }}>
            <button type="submit" className="btn primary lg" disabled={text.trim() === ''}>
              Check
            </button>
            <button type="button" className="btn" onClick={reveal}>
              Show answer
            </button>
          </div>
        </form>
      )}
      <FenHelp />
      {round.index === 0 && !done && text === '' && (
        <div className="card">
          <SettingsPanel show={['difficulty', 'coordinates', 'sound']} compact />
        </div>
      )}
    </SetShell>
  )
}
