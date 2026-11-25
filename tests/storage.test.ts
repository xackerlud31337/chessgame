import { describe, expect, it } from 'vitest'
import { createStorage, type StorageBackend } from '../src/lib/storage'

function memoryBackend(): StorageBackend & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

const throwing: StorageBackend = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
  removeItem: () => {
    throw new Error('SecurityError')
  },
}

describe('storage', () => {
  it('saves and loads JSON values', () => {
    const s = createStorage(memoryBackend())
    expect(s.save('settings', { a: 1 })).toBe(true)
    expect(s.load('settings', { a: 0 })).toEqual({ a: 1 })
  })

  it('returns the fallback when nothing is stored', () => {
    const s = createStorage(memoryBackend())
    expect(s.load('missing', 'default')).toBe('default')
  })

  it('returns the fallback on corrupt JSON', () => {
    const b = memoryBackend()
    b.data.set('cvt:bad', '{not json')
    const s = createStorage(b)
    expect(s.load('bad', 42)).toBe(42)
  })

  it('falls back cleanly when the backend throws', () => {
    const s = createStorage(throwing)
    expect(() => s.load('x', 1)).not.toThrow()
    expect(s.load('x', 1)).toBe(1)
    expect(s.save('x', 2)).toBe(false)
    expect(s.remove('x')).toBe(false)
  })

  it('falls back cleanly when there is no backend at all', () => {
    const s = createStorage(null)
    expect(s.load('x', 'fb')).toBe('fb')
    expect(s.save('x', 1)).toBe(false)
  })

  it('remove deletes the key', () => {
    const s = createStorage(memoryBackend())
    s.save('k', 1)
    expect(s.remove('k')).toBe(true)
    expect(s.load('k', null)).toBeNull()
  })
})
