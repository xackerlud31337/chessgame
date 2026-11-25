import { useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useStats } from '../hooks/useStats'
import { ALL_SQUARES, type Square } from '../lib/squares'
import { MODE_LABELS, errorRate, weakestSquares, type ModeId, type ModeStats } from '../lib/stats'
import { Board } from './Board'
import { formatMs } from './EndScreen'

const MODE_ORDER: ModeId[] = ['find', 'name', 'fenToBoard', 'boardToFen', 'blindfold', 'pieceVision']

/** Error rate 0..1 -> colour from green through yellow to red. */
export function heatColor(rate: number): string {
  const hue = 120 - Math.round(rate * 120)
  return `hsla(${hue}, 80%, 50%, ${0.35 + rate * 0.5})`
}

function AccuracyChart({ stats }: { stats: ModeStats }) {
  const rounds = stats.recent
  if (rounds.length < 2) return <p className="muted small">Play a couple more rounds to see the trend.</p>
  const w = 320
  const h = 110
  const padL = 28
  const padB = 16
  const padT = 8
  const innerW = w - padL - 6
  const innerH = h - padB - padT
  const x = (i: number) => padL + (i / (rounds.length - 1)) * innerW
  const y = (v: number) => padT + (1 - v / 100) * innerH
  const points = rounds.map((r, i) => `${x(i).toFixed(1)},${y(r.accuracy).toFixed(1)}`).join(' ')
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Accuracy over the last ${rounds.length} rounds`}>
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line className="grid" x1={padL} x2={w - 6} y1={y(v)} y2={y(v)} />
          <text className="axis" x={0} y={y(v) + 4}>
            {v}%
          </text>
        </g>
      ))}
      <polyline className="line" points={points} />
      {rounds.map((r, i) => (
        <circle key={i} className="dot" cx={x(i)} cy={y(r.accuracy)} r={3}>
          <title>
            Round {i + 1}: {r.accuracy}% ({r.score} pts)
          </title>
        </circle>
      ))}
      <text className="axis" x={padL} y={h - 2}>
        oldest
      </text>
      <text className="axis" x={w - 6} y={h - 2} textAnchor="end">
        latest
      </text>
    </svg>
  )
}

export function StatsView() {
  const { stats, resetStats } = useStats()
  const { settings } = useSettings()
  const [confirming, setConfirming] = useState(false)

  const played = MODE_ORDER.filter((m) => stats.modes[m])
  const heat: Partial<Record<Square, { color: string; label?: string }>> = {}
  let anySquare = false
  for (const sq of ALL_SQUARES) {
    const rate = errorRate(stats, sq)
    if (rate === null) continue
    anySquare = true
    heat[sq] = { color: heatColor(rate), label: rate > 0 ? `${Math.round(rate * 100)}%` : undefined }
  }
  const weakest = weakestSquares(stats, 5)
  const orientation = settings.side === 'black' ? 'black' : 'white'

  return (
    <>
      <h2>Your progress</h2>
      {played.length === 0 && !anySquare && (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            No rounds yet. Play a drill and your scores, accuracy trend and weak squares will show up here.
          </p>
        </div>
      )}

      {played.map((m) => {
        const s = stats.modes[m]!
        const last = s.recent[s.recent.length - 1]
        const avgAcc = Math.round(s.recent.reduce((a, r) => a + r.accuracy, 0) / s.recent.length)
        return (
          <div className="card" key={m}>
            <div className="row spread">
              <h3 style={{ margin: 0 }}>{MODE_LABELS[m]}</h3>
              <span className="badge">Best {s.best}</span>
            </div>
            <div className="end-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="stat">
                <div className="value">{s.roundsPlayed}</div>
                <div className="label">Rounds</div>
              </div>
              <div className="stat">
                <div className="value">{s.best}</div>
                <div className="label">Best</div>
              </div>
              <div className="stat">
                <div className="value">{avgAcc}%</div>
                <div className="label">Avg accuracy</div>
              </div>
              <div className="stat">
                <div className="value">{last ? formatMs(last.avgMs) : '–'}</div>
                <div className="label">Last avg/square</div>
              </div>
            </div>
            <AccuracyChart stats={s} />
          </div>
        )
      })}

      {anySquare && (
        <div className="card">
          <h3>Weak squares</h3>
          <p className="muted small">
            Error rate per square across Find and Name drills. Red squares are the ones you keep missing.
          </p>
          <Board orientation={orientation} showCoordinates heat={heat} label="Weak squares heatmap" />
          <div className="row spread" style={{ marginTop: 10 }}>
            <div className="legend">
              <span>0%</span>
              <span className="swatch" />
              <span>100% errors</span>
            </div>
          </div>
          {weakest.length > 0 && (
            <table className="table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Square</th>
                  <th className="num">Attempts</th>
                  <th className="num">Error rate</th>
                </tr>
              </thead>
              <tbody>
                {weakest.map((w) => (
                  <tr key={w.square}>
                    <td>
                      <code>{w.square}</code>
                    </td>
                    <td className="num">{w.attempts}</td>
                    <td className="num">{Math.round(w.rate * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {(played.length > 0 || anySquare) && (
        <div className="card">
          {confirming ? (
            <div className="row spread">
              <span>Delete all scores and square history? This can't be undone.</span>
              <div className="row">
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => {
                    resetStats()
                    setConfirming(false)
                  }}
                >
                  Yes, reset
                </button>
                <button type="button" className="btn" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="row spread">
              <span className="muted small">Stats are stored only in this browser.</span>
              <button type="button" className="btn" onClick={() => setConfirming(true)}>
                Reset stats
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
