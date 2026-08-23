import { afterEach, describe, expect, it } from 'vitest'
import {
  CABINET_COLLAPSED_KEY,
  cabinetStartsCollapsed,
  rememberCabinetCollapsed,
} from '../../packages/ui/src/layoutPreferences'

const originalStorage = globalThis.localStorage

function storageWith(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial))
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key) },
    setItem: (key, value) => { values.set(key, value) },
  }
}

function installStorage(storage: Storage): void {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  })
}

afterEach(() => {
  if (originalStorage) installStorage(originalStorage)
  else delete (globalThis as { localStorage?: Storage }).localStorage
})

describe('cabinet layout preference', () => {
  it('opens by default and remembers only an explicit collapse', () => {
    const storage = storageWith()
    installStorage(storage)

    expect(cabinetStartsCollapsed()).toBe(false)
    rememberCabinetCollapsed(true)
    expect(storage.getItem(CABINET_COLLAPSED_KEY)).toBe('1')
    expect(cabinetStartsCollapsed()).toBe(true)

    rememberCabinetCollapsed(false)
    expect(storage.getItem(CABINET_COLLAPSED_KEY)).toBeNull()
    expect(cabinetStartsCollapsed()).toBe(false)
  })

  it('keeps working when the browser refuses storage', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new Error('denied') },
    })

    expect(cabinetStartsCollapsed()).toBe(false)
    expect(() => rememberCabinetCollapsed(true)).not.toThrow()
    expect(() => rememberCabinetCollapsed(false)).not.toThrow()
  })
})
