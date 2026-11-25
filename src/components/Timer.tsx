interface Props {
  /** Remaining ms for timed rounds, or null for untimed. */
  remainingMs: number | null
  elapsedMs: number
  limitMs: number
  running: boolean
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}`
}

export function Timer({ remainingMs, elapsedMs, limitMs, running }: Props) {
  if (remainingMs === null) {
    const total = Math.floor(elapsedMs / 1000)
    const m = Math.floor(total / 60)
    const s = total % 60
    return (
      <div className="timer" aria-live="off" aria-label="Elapsed time">
        {m}:{String(s).padStart(2, '0')}
      </div>
    )
  }
  const low = running && remainingMs <= 5000
  const pct = limitMs > 0 ? (remainingMs / limitMs) * 100 : 100
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
      <div className={`timer${low ? ' low' : ''}`} aria-label="Time remaining">
        {formatClock(remainingMs)}
      </div>
      <div className={`timer-bar${low ? ' low' : ''}`} style={{ width: 70 }}>
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
