import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { StatsView } from '../src/components/StatsView'
import { SettingsProvider } from '../src/hooks/useSettings'
import { StatsProvider } from '../src/hooks/useStats'
import { EMPTY_STATS, recordRound, recordSquareAttempt } from '../src/lib/stats'

function renderStats() {
  return render(
    <SettingsProvider>
      <StatsProvider>
        <StatsView />
      </StatsProvider>
    </SettingsProvider>,
  )
}

describe('StatsView', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(cleanup)

  it('shows an empty state with no data', () => {
    renderStats()
    expect(screen.getByText(/No rounds yet/)).toBeInTheDocument()
  })

  it('renders per-mode cards, the heatmap and a confirmed reset', () => {
    let s = EMPTY_STATS
    s = recordRound(s, 'find', { at: 1, score: 12, attempts: 14, correct: 12, accuracy: 86, avgMs: 2100, roundLength: 30 })
    s = recordRound(s, 'find', { at: 2, score: 15, attempts: 16, correct: 15, accuracy: 94, avgMs: 1900, roundLength: 30 })
    s = recordSquareAttempt(s, 'f7', false)
    s = recordSquareAttempt(s, 'f7', false)
    s = recordSquareAttempt(s, 'e4', true)
    window.localStorage.setItem('cvt:stats', JSON.stringify(s))

    renderStats()
    expect(screen.getByText('Find the square')).toBeInTheDocument()
    expect(screen.getByText('Best 15')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Weak squares heatmap' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Accuracy over the last 2 rounds/ })).toBeInTheDocument()
    // f7 appears in the weakest table with 100%
    const row = screen.getByText('f7').closest('tr')!
    expect(row.textContent).toContain('100%')
    expect(row.textContent).toContain('2')

    fireEvent.click(screen.getByRole('button', { name: 'Reset stats' }))
    expect(screen.getByText(/can't be undone/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Best 15')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset stats' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, reset' }))
    expect(screen.getByText(/No rounds yet/)).toBeInTheDocument()
    expect(window.localStorage.getItem('cvt:stats')).toBe(JSON.stringify(EMPTY_STATS))
  })
})
