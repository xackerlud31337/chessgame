import { accuracyOf } from '../lib/stats'

interface Props {
  score: number
  attempts: number
  correct: number
  streak: number
}

export function ScoreBar({ score, attempts, correct, streak }: Props) {
  return (
    <div className="score-bar" aria-live="polite">
      <div>
        <span className="label">Score</span>
        {score}
      </div>
      <div>
        <span className="label">Accuracy</span>
        {attempts ? `${accuracyOf(correct, attempts)}%` : '–'}
      </div>
      <div>
        <span className="label">Streak</span>
        {streak}
      </div>
    </div>
  )
}
