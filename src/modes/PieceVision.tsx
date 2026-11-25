import { useMemo, useState } from 'react'
import { Board } from '../components/Board'
import { EndScreen } from '../components/EndScreen'
import { SetShell } from '../components/SetShell'
import { SettingsPanel } from '../components/SettingsPanel'
import type { Highlight } from '../components/Square'
import { useKeyboard } from '../hooks/useKeyboard'
import { useSetRound } from '../hooks/useSetRound'
import { describePiece } from '../lib/fen'
import { generateVisionPuzzle, gradeSelection, type VisionDifficulty } from '../lib/pieceVision'
import type { Square } from '../lib/squares'

const PER_ROUND = 8

export function PieceVision({ onMenu }: { onMenu: () => void }) {
  const round = useSetRound('pieceVision', PER_ROUND)
  const { settings } = round
  const difficulty: VisionDifficulty =
    settings.difficulty === 'mixed' ? (['easy', 'medium', 'hard'] as const)[Math.min(2, Math.floor((round.index / PER_ROUND) * 3))] : settings.difficulty
  const puzzle = useMemo(() => generateVisionPuzzle(difficulty), [difficulty, round.index, round.seed])

  const [selected, setSelected] = useState<Square[]>([])
  const [grade, setGrade] = useState<ReturnType<typeof gradeSelection> | null>(null)

  const toggle = (sq: Square) => {
    if (grade || sq === puzzle.square) return
    setSelected((s) => (s.includes(sq) ? s.filter((x) => x !== sq) : [...s, sq]))
  }

  const check = () => {
    const g = gradeSelection(puzzle.targets, selected)
    setGrade(g)
    round.answer(g.perfect)
  }

  const goNext = () => {
    setSelected([])
    setGrade(null)
    round.next()
  }

  const restart = () => {
    setSelected([])
    setGrade(null)
    round.restart()
  }

  useKeyboard({ space: () => (round.result ? restart() : grade ? goNext() : selected.length > 0 ? check() : undefined) })

  if (round.result) {
    return (
      <SetShell index={round.index} total={round.total} correct={round.correct} onMenu={onMenu}>
        <EndScreen title="Set complete" result={round.result} previousBest={round.bestBefore} onPlayAgain={restart} onMenu={onMenu} />
      </SetShell>
    )
  }

  const highlights: Partial<Record<Square, Highlight>> = {}
  if (grade) {
    for (const s of grade.hit) highlights[s] = 'correct'
    for (const s of grade.extra) highlights[s] = 'wrong'
    for (const s of grade.missed) highlights[s] = 'hint'
  } else {
    for (const s of selected) highlights[s] = 'selected'
  }
  highlights[puzzle.square] = grade ? highlights[puzzle.square] ?? 'selected' : 'selected'

  return (
    <SetShell index={round.index} total={round.total} correct={round.correct} onMenu={onMenu}>
      <div className="question">
        Click every square the {describePiece(puzzle.piece)} on {puzzle.square} can move to or capture on.
      </div>
      <Board orientation="white" showCoordinates={settings.showCoordinates} pieces={puzzle.placement} highlights={highlights} onSquareClick={toggle} label="Piece vision board" />
      {grade ? (
        <>
          <div className={`result-line ${grade.perfect ? 'ok' : 'bad'}`} aria-live="polite">
            {grade.perfect
              ? `Perfect, all ${puzzle.targets.length} squares.`
              : `${grade.hit.length}/${puzzle.targets.length} found · ${grade.extra.length} wrong · ${grade.missed.length} missed (yellow)`}
          </div>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn primary lg" onClick={goNext} autoFocus>
              {round.index + 1 >= round.total ? 'Finish' : 'Next'} <kbd>Space</kbd>
            </button>
          </div>
        </>
      ) : (
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn primary lg" onClick={check} disabled={selected.length === 0}>
            Check ({selected.length} selected) <kbd>Space</kbd>
          </button>
          <button type="button" className="btn" onClick={() => setSelected([])} disabled={selected.length === 0}>
            Clear
          </button>
        </div>
      )}
      {round.index === 0 && !grade && selected.length === 0 && (
        <div className="card">
          <SettingsPanel show={['difficulty', 'coordinates', 'sound']} compact />
        </div>
      )}
    </SetShell>
  )
}
