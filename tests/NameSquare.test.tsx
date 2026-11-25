import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NameSquare } from '../src/modes/NameSquare'
import { SettingsProvider } from '../src/hooks/useSettings'
import { StatsProvider } from '../src/hooks/useStats'

function renderName() {
  return render(
    <SettingsProvider>
      <StatsProvider>
        <NameSquare onMenu={vi.fn()} />
      </StatsProvider>
    </SettingsProvider>,
  )
}

function highlighted(): string {
  return document.querySelector('.square[data-hl="hint"]')!.getAttribute('data-square')!
}

describe('NameSquare drill', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] })
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('highlights exactly one square and accepts the typed name', () => {
    renderName()
    expect(document.querySelectorAll('.square[data-hl="hint"]')).toHaveLength(1)
    const target = highlighted()
    const input = screen.getByLabelText('Square name') as HTMLInputElement
    fireEvent.change(input, { target: { value: target.toUpperCase() } })
    expect(screen.getByText('Score').parentElement!.textContent).toContain('1')
    expect(highlighted()).not.toBe(target)
    expect(input.value).toBe('')
  })

  it('shows the right answer on a miss and moves on after the flash', () => {
    renderName()
    const target = highlighted()
    const wrong = target === 'a1' ? 'h8' : 'a1'
    const input = screen.getByLabelText('Square name')
    fireEvent.change(input, { target: { value: wrong } })
    expect(screen.getByText(`That was ${target}`)).toBeInTheDocument()
    expect(screen.getByText('Score').parentElement!.textContent).toContain('0')
    act(() => vi.advanceTimersByTime(900))
    expect(highlighted()).not.toBe(target)
    expect(screen.queryByText(`That was ${target}`)).not.toBeInTheDocument()
  })

  it('multiple choice mode offers 4 options including the answer', () => {
    renderName()
    fireEvent.click(screen.getByRole('button', { name: '4 choices' }))
    const group = screen.getByRole('group', { name: 'Pick the square name' })
    const buttons = group.querySelectorAll('button')
    expect(buttons).toHaveLength(4)
    const labels = [...buttons].map((b) => b.textContent)
    expect(new Set(labels).size).toBe(4)
    const target = highlighted()
    expect(labels).toContain(target)
    fireEvent.click([...buttons].find((b) => b.textContent === target)!)
    expect(screen.getByText('Score').parentElement!.textContent).toContain('1')
  })
})
