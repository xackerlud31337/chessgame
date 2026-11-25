import { useMemo, useState } from 'react'
import { Board } from '../components/Board'
import { EndScreen } from '../components/EndScreen'
import { FenHelp } from '../components/FenHelp'
import { FenText } from '../components/FenText'
import { PiecePalette, type Tool } from '../components/PiecePalette'
import { SetShell } from '../components/SetShell'
import { SettingsPanel } from '../components/SettingsPanel'
import type { Highlight } from '../components/Square'
import { useKeyboard } from '../hooks/useKeyboard'
import { useSetRound } from '../hooks/useSetRound'
import { comparePlacements, piecesFromFen, type Placement } from '../lib/fen'
import { pickPositions } from '../lib/positions'
import { seededRng } from '../lib/random'
import type { Square } from '../lib/squares'

const PER_ROUND = 5

export function FenToBoard({ onMenu }: { onMenu: () => void }) {
  const round = useSetRound('fenToBoard', PER_ROUND)
  const { settings } = round
  const positions = useMemo(() => pickPositions(PER_ROUND, settings.difficulty, seededRng(round.seed)), [settings.difficulty, round.seed])
  const position = positions[round.index]
  const expected = useMemo(() => piecesFromFen(position.fen), [position.fen])

  const [placement, setPlacement] = useState<Placement>({})
  const [tool, setTool] = useState<Tool | null>(null)
  const [graded, setGraded] = useState<ReturnType<typeof comparePlacements> | null>(null)

  const onSquare = (sq: Square) => {
    if (graded) return
    setPlacement((p) => {
      const next = { ...p }
      if (tool === 'erase' || tool === null || next[sq] === tool) delete next[sq]
      else next[sq] = tool
      return next
    })
  }

  const submit = () => {
    const g = comparePlacements(expected, placement)
    setGraded(g)
    round.answer(g.wrong.length === 0 && g.missing.length === 0)
  }

  const goNext = () => {
    setPlacement({})
    setGraded(null)
    setTool(null)
    round.next()
  }

  const restart = () => {
    setPlacement({})
    setGraded(null)
    setTool(null)
    round.restart()
  }

  useKeyboard({ space: () => (round.result ? restart() : graded ? goNext() : undefined) })

  if (round.result) {
    return (
      <SetShell index={round.index} total={round.total} correct={round.correct} onMenu={onMenu}>
        <EndScreen title="Set complete" result={round.result} previousBest={round.bestBefore} onPlayAgain={restart} onMenu={onMenu} />
      </SetShell>
    )
  }

  const highlights: Partial<Record<Square, Highlight>> = {}
  if (graded) {
    for (const s of graded.correct) highlights[s] = 'correct'
    for (const s of graded.wrong) highlights[s] = 'wrong'
    for (const s of graded.missing) highlights[s] = 'hint'
  }
  const placed = Object.keys(placement).length
  const needed = Object.keys(expected).length

  return (
    <SetShell index={round.index} total={round.total} correct={round.correct} onMenu={onMenu}>
      <p className="hint-line" style={{ margin: 0 }}>
        Set up this position{position.name ? ` (${position.name})` : ''}. Pick a piece, then click squares.
      </p>
      <FenText fen={position.fen} />
      <PiecePalette selected={tool} onSelect={setTool} disabled={Boolean(graded)} />
      <Board
        orientation="white"
        showCoordinates={settings.showCoordinates}
        pieces={graded ? expected : placement}
        highlights={highlights}
        onSquareClick={graded ? undefined : onSquare}
        label="Set-up board"
      />
      {graded ? (
        <>
          <div className={`result-line ${graded.wrong.length === 0 && graded.missing.length === 0 ? 'ok' : 'bad'}`} aria-live="polite">
            {graded.wrong.length === 0 && graded.missing.length === 0
              ? 'Perfect!'
              : `${graded.correct.length} right · ${graded.wrong.length} wrong · ${graded.missing.length} missing`}
          </div>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn primary lg" onClick={goNext} autoFocus>
              {round.index + 1 >= round.total ? 'Finish' : 'Next'} <kbd>Space</kbd>
            </button>
          </div>
        </>
      ) : (
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn primary lg" onClick={submit} disabled={placed === 0}>
            Check ({placed}/{needed} pieces)
          </button>
          <button type="button" className="btn" onClick={() => setPlacement({})} disabled={placed === 0}>
            Clear
          </button>
        </div>
      )}
      <FenHelp />
      {round.index === 0 && !graded && placed === 0 && (
        <div className="card">
          <SettingsPanel show={['difficulty', 'coordinates', 'sound']} compact />
        </div>
      )}
    </SetShell>
  )
}
