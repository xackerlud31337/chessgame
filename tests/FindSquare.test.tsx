import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FindSquare } from '../src/modes/FindSquare'
import { SettingsProvider } from '../src/hooks/useSettings'
import { StatsProvider } from '../src/hooks/useStats'

function renderFind(onMenu = vi.fn()) {
  return render(
    <SettingsProvider>
      <StatsProvider>
        <FindSquare onMenu={onMenu} />
      </StatsProvider>
    </SettingsProvider>,
  )
}

function currentTarget(): string {
  const el = document.querySelector('.target')!
  return el.textContent!.replace('Find ', '').trim()
}

function clickSquare(name: string) {
  fireEvent.click(screen.getByRole('button', { name }))
}

describe('FindSquare drill', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] })
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders 64 square buttons with aria labels', () => {
    renderFind()
    expect(screen.getByRole('button', { name: 'e4' })).toBeInTheDocument()
    expect(document.querySelectorAll('.square')).toHaveLength(64)
  })

  it('scores a correct click, shows a new target, and starts the clock on first click', () => {
    renderFind()
    const t1 = currentTarget()
    expect(screen.getByText('30')).toBeInTheDocument()
    clickSquare(t1)
    const t2 = currentTarget()
    expect(t2).not.toBe(t1)
    expect(screen.getByRole('button', { name: t1 })).toHaveAttribute('data-hl', 'correct')
    expect(screen.getByText('Score').parentElement!.textContent).toContain('1')
    act(() => vi.advanceTimersByTime(1100))
    expect(screen.getByText('29')).toBeInTheDocument()
  })

  it('on a wrong click flashes both squares, resets streak, then moves on', () => {
    renderFind()
    const t1 = currentTarget()
    clickSquare(t1) // streak 1
    const t2 = currentTarget()
    const wrong = t2 === 'a1' ? 'h8' : 'a1'
    clickSquare(wrong)
    expect(screen.getByRole('button', { name: wrong })).toHaveAttribute('data-hl', 'wrong')
    expect(screen.getByRole('button', { name: t2 })).toHaveAttribute('data-hl', 'correct')
    expect(currentTarget()).toBe(t2) // target stays during feedback
    expect(screen.getByText('Streak').parentElement!.textContent).toContain('0')
    // clicks are ignored while feedback is shown
    clickSquare(t2)
    expect(screen.getByText('Score').parentElement!.textContent).toContain('1')
    act(() => vi.advanceTimersByTime(700))
    expect(currentTarget()).not.toBe(t2)
    expect(screen.getByRole('button', { name: wrong })).not.toHaveAttribute('data-hl')
  })

  it('ends after 30 seconds and shows the end screen with stats', () => {
    renderFind()
    clickSquare(currentTarget())
    clickSquare(currentTarget())
    act(() => vi.advanceTimersByTime(30_500))
    expect(screen.getByRole('region', { name: 'Round results' })).toBeInTheDocument()
    expect(screen.getByText('New personal best!')).toBeInTheDocument()
    expect(screen.getByText('Accuracy (2/2)')).toBeInTheDocument()
    // Play again resets everything
    fireEvent.click(screen.getByRole('button', { name: /Play again/ }))
    expect(screen.queryByRole('region', { name: 'Round results' })).not.toBeInTheDocument()
    expect(screen.getByText('Score').parentElement!.textContent).toContain('0')
  })

  it('Space starts the round and Esc is handled by the shell', () => {
    renderFind()
    fireEvent.keyDown(window, { key: ' ', code: 'Space' })
    act(() => vi.advanceTimersByTime(2100))
    expect(screen.getByText('28')).toBeInTheDocument()
  })
})
