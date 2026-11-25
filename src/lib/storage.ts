/**
 * Tiny JSON storage wrapper. Every call is guarded: if localStorage is
 * missing, full, or blocked (private mode, disabled cookies), the app keeps
 * working with in-memory defaults.
 */
export interface StorageBackend {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const PREFIX = 'cvt:'

function defaultBackend(): StorageBackend | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  } catch {
    // access itself can throw (e.g. sandboxed iframes)
  }
  return null
}

export function createStorage(backend: StorageBackend | null = defaultBackend()) {
  return {
    load<T>(key: string, fallback: T): T {
      if (!backend) return fallback
      try {
        const raw = backend.getItem(PREFIX + key)
        if (raw === null) return fallback
        return JSON.parse(raw) as T
      } catch {
        return fallback
      }
    },
    save<T>(key: string, value: T): boolean {
      if (!backend) return false
      try {
        backend.setItem(PREFIX + key, JSON.stringify(value))
        return true
      } catch {
        return false
      }
    },
    remove(key: string): boolean {
      if (!backend) return false
      try {
        backend.removeItem(PREFIX + key)
        return true
      } catch {
        return false
      }
    },
  }
}

export type Storage = ReturnType<typeof createStorage>

export const storage: Storage = createStorage()
