import type { ReactNode } from 'react'

interface Props {
  index: number
  total: number
  correct: number
  onMenu: () => void
  children: ReactNode
}

/** Top bar for item-based rounds: menu, progress, score. */
export function SetShell({ index, total, correct, onMenu, children }: Props) {
  return (
    <>
      <div className="drill-top">
        <button type="button" className="btn ghost" onClick={onMenu} aria-label="Back to menu">
          ← Menu
        </button>
        <div className="timer" aria-label="Progress">
          {Math.min(index + 1, total)} / {total}
        </div>
        <div className="score-bar">
          <div>
            <span className="label">Correct</span>
            {correct}
          </div>
        </div>
      </div>
      {children}
    </>
  )
}
