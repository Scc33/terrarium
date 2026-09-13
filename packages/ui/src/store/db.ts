/** Minimal IndexedDB key-value wrapper for autosaves (§8). */

const DB_NAME = 'terrarium'
const STORE = 'saves'

/** `error` is typed nullable on every IndexedDB request and transaction, though
 * an `error` event always carries one; a rejection still has to be an Error. */
function failure(source: { error: DOMException | null }, what: string): Error {
  return source.error ?? new Error(`${what} failed`)
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(failure(req, 'opening the save store'))
  })
}

export async function dbPut(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(failure(tx, `writing ${key}`))
  })
}

export async function dbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(failure(req, `reading ${key}`))
  })
}
