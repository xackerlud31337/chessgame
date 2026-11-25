import type { ReactNode } from 'react'
import type { Drill } from '../hooks/useDrill'
import { ScoreBar } from './ScoreBar'
import { Timer } from './Timer'

interface Props {
  drill: Drill
  onMenu: () => void
  children: ReactNode
}

/** Top bar (menu, clock, score) shared by the timed drills. */
export function DrillShell({ drill, onMenu, children }: Props) {
  const { state, remainingMs, limitMs } = drill
  return (
    <>
      <div className="drill-top">
        <button type="button" className="btn ghost" onClick={onMenu} aria-label="Back to menu">
          ← Menu
        </button>
        <Timer remainingMs={remainingMs} elapsedMs={state.elapsedMs} limitMs={limitMs} running={state.status === 'running'} />
        <ScoreBar score={state.score} attempts={state.attempts} correct={state.correct} streak={state.streak} />
      </div>
      {children}
    </>
  )
}
