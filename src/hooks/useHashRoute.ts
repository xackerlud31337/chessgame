import { useCallback, useEffect, useState } from 'react'

export type Route =
  | 'menu'
  | 'find'
  | 'name'
  | 'fen-to-board'
  | 'board-to-fen'
  | 'blindfold'
  | 'piece-vision'
  | 'stats'
  | 'settings'

const ROUTES: Route[] = ['menu', 'find', 'name', 'fen-to-board', 'board-to-fen', 'blindfold', 'piece-vision', 'stats', 'settings']

function parse(hash: string): Route {
  const name = hash.replace(/^#\/?/, '').split('?')[0]
  return (ROUTES as string[]).includes(name) ? (name as Route) : 'menu'
}

/** Minimal hash router so the back button works on GitHub Pages. */
export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((r: Route) => {
    const next = r === 'menu' ? '#/' : `#/${r}`
    if (window.location.hash === next) return
    window.location.hash = next
  }, [])

  return [route, navigate]
}

export function hrefFor(r: Route): string {
  return r === 'menu' ? '#/' : `#/${r}`
}
