import { hrefFor, type Route } from '../hooks/useHashRoute'
import { useStats } from '../hooks/useStats'
import type { ModeId } from '../lib/stats'
import { SettingsPanel } from './SettingsPanel'

interface ModeCard {
  route: Route
  mode: ModeId
  phase: string
  title: string
  desc: string
}

const MODES: ModeCard[] = [
  { route: 'find', mode: 'find', phase: 'Phase 1', title: 'Find the square', desc: 'A square name appears. Click it on the board as fast as you can.' },
  { route: 'name', mode: 'name', phase: 'Phase 2', title: 'Name the square', desc: 'A square lights up. Type its name, or pick from four options.' },
  { route: 'fen-to-board', mode: 'fenToBoard', phase: 'Phase 3', title: 'FEN → board', desc: 'Read a FEN string and place the pieces on an empty board.' },
  { route: 'board-to-fen', mode: 'boardToFen', phase: 'Phase 3', title: 'Board → FEN', desc: 'See a position and write its FEN piece placement.' },
  { route: 'blindfold', mode: 'blindfold', phase: 'Phase 3', title: 'Blindfold', desc: 'Only the FEN is shown. Answer a question about the position.' },
  { route: 'piece-vision', mode: 'pieceVision', phase: 'Phase 4', title: 'Piece vision', desc: 'Click every square a piece attacks, blockers included.' },
]

export function Menu() {
  const { stats } = useStats()
  return (
    <>
      <div className="hero">
        <h1>Chess Vision Trainer</h1>
        <p className="muted">
          Learn every square's name instantly, then read positions straight from FEN. Short, timed drills with
          instant feedback. Everything stays in your browser.
        </p>
      </div>
      <div className="mode-grid">
        {MODES.map((m) => {
          const s = stats.modes[m.mode]
          return (
            <a key={m.route} className="mode-card" href={hrefFor(m.route)}>
              <span className="phase">{m.phase}</span>
              <h3>
                {m.title}
                {s && s.best > 0 && <span className="badge">Best {s.best}</span>}
              </h3>
              <p>{m.desc}</p>
            </a>
          )
        })}
      </div>
      <div className="card">
        <h2 style={{ fontSize: '1.1rem' }}>Settings</h2>
        <SettingsPanel />
      </div>
      <p className="hint-line">
        Shortcuts: <kbd>Space</kbd> start / play again · <kbd>Esc</kbd> back to menu
      </p>
    </>
  )
}
