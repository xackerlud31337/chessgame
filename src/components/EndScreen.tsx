import type { RoundResult } from '../lib/stats'

interface Props {
  title?: string
  result: RoundResult
  /** Best score before this round. */
  previousBest: number
  onPlayAgain: () => void
  onMenu: () => void
  extra?: React.ReactNode
}

export function formatMs(ms: number): string {
  if (!ms) return '–'
  return `${(ms / 1000).toFixed(2)}s`
}

export function EndScreen({ title = 'Round over', result, previousBest, onPlayAgain, onMenu, extra }: Props) {
  const isNewBest = result.score > previousBest && result.score > 0
  const best = Math.max(previousBest, result.score)
  return (
    <div className="card" role="region" aria-label="Round results">
      <div className="row spread">
        <h2 style={{ margin: 0 }}>{title}</h2>
        {isNewBest && <span className="badge new">New personal best!</span>}
      </div>
      <div className="end-grid">
        <div className="stat">
          <div className="value">{result.score}</div>
          <div className="label">Score</div>
        </div>
        <div className="stat">
          <div className="value">{result.attempts ? `${result.accuracy}%` : '–'}</div>
          <div className="label">Accuracy ({result.correct}/{result.attempts})</div>
        </div>
        <div className="stat">
          <div className="value">{formatMs(result.avgMs)}</div>
          <div className="label">Avg per square</div>
        </div>
        <div className="stat">
          <div className="value">{best}</div>
          <div className="label">Personal best</div>
        </div>
      </div>
      {extra}
      <div className="row" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn primary lg" onClick={onPlayAgain} autoFocus>
          Play again <kbd>Space</kbd>
        </button>
        <button type="button" className="btn" onClick={onMenu}>
          Menu <kbd>Esc</kbd>
        </button>
      </div>
    </div>
  )
}
