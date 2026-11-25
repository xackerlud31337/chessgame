import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { defaultSoundEnabled } from '../lib/sound'
import type { Orientation } from '../lib/squares'
import { storage } from '../lib/storage'

export type Side = 'white' | 'black' | 'random'
export type RoundLength = 30 | 60 | 0

export interface Settings {
  side: Side
  showCoordinates: boolean
  roundLength: RoundLength
  sound: boolean
  /** Name-the-square answer input: type the name, or pick from 4 options. */
  nameInput: 'type' | 'choice'
}

const KEY = 'settings'

function defaults(): Settings {
  return { side: 'white', showCoordinates: true, roundLength: 30, sound: defaultSoundEnabled(), nameInput: 'type' }
}

function load(): Settings {
  const d = defaults()
  const saved = storage.load<Partial<Settings>>(KEY, {})
  return {
    side: saved.side === 'black' || saved.side === 'random' ? saved.side : d.side,
    showCoordinates: typeof saved.showCoordinates === 'boolean' ? saved.showCoordinates : d.showCoordinates,
    roundLength: saved.roundLength === 60 || saved.roundLength === 0 ? saved.roundLength : d.roundLength,
    sound: typeof saved.sound === 'boolean' ? saved.sound : d.sound,
    nameInput: saved.nameInput === 'choice' ? 'choice' : d.nameInput,
  }
}

interface SettingsContextValue {
  settings: Settings
  update: (patch: Partial<Settings>) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load)
  useEffect(() => {
    storage.save(KEY, settings)
  }, [settings])
  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), [])
  const value = useMemo(() => ({ settings, update }), [settings, update])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings outside SettingsProvider')
  return ctx
}

/** Resolve the "random" side into a concrete orientation. */
export function resolveSide(side: Side): Orientation {
  if (side === 'random') return Math.random() < 0.5 ? 'white' : 'black'
  return side
}
