import { useEffect, useRef } from 'react'

type Handler = (e: KeyboardEvent) => void

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/**
 * Global keyboard shortcuts. Space is ignored while typing in a field or
 * when a button is focused (the button handles its own Space press).
 */
export function useKeyboard(handlers: { space?: () => void; escape?: () => void }) {
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    const onKey: Handler = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') {
        if (isTyping(e.target) && e.target instanceof HTMLElement) e.target.blur()
        ref.current.escape?.()
        return
      }
      if (e.key === ' ' || e.code === 'Space') {
        if (isTyping(e.target)) return
        if (e.target instanceof HTMLElement && e.target.tagName === 'BUTTON') return
        if (ref.current.space) {
          e.preventDefault()
          ref.current.space()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
