import type { StorageLike } from '../call-memory.service'

/** In-memory storage. `broken` makes every call throw, like a blocked sessionStorage. */
function createFakeStorage(options: { broken?: boolean } = {}) {
  const items = new Map<string, string>()
  const guard = () => {
    if (options.broken) throw new Error('storage blocked')
  }
  const storage: StorageLike = {
    getItem: (key) => {
      guard()
      return items.get(key) ?? null
    },
    setItem: (key, value) => {
      guard()
      items.set(key, value)
    },
    removeItem: (key) => {
      guard()
      items.delete(key)
    },
  }
  return { storage, items }
}

export { createFakeStorage }
