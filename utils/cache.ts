const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
const CACHE_MAX_ENTRIES = 50

interface CacheEntry<T> { d: T; t: number }

const memoryCache = new Map<string, CacheEntry<unknown>>()

export function getCache<T>(prefix: string, key: string): T | undefined {
  const fullKey = `${prefix}${key}`
  const now = Date.now()

  const mem = memoryCache.get(fullKey)
  if (mem) {
    if (now - mem.t > CACHE_TTL) {
      memoryCache.delete(fullKey)
      try { localStorage.removeItem(fullKey) } catch { /* ignore */ }
      return undefined
    }
    return mem.d as T
  }

  if (typeof window === 'undefined') return undefined
  try {
    const stored = localStorage.getItem(fullKey)
    if (!stored) return undefined
    const entry = JSON.parse(stored) as CacheEntry<T>
    if (now - entry.t > CACHE_TTL) {
      localStorage.removeItem(fullKey)
      return undefined
    }
    memoryCache.set(fullKey, entry as CacheEntry<unknown>)
    return entry.d
  } catch {
    return undefined
  }
}

export function setCache<T>(prefix: string, key: string, value: T): void {
  const fullKey = `${prefix}${key}`
  const entry: CacheEntry<T> = { d: value, t: Date.now() }
  memoryCache.set(fullKey, entry as CacheEntry<unknown>)

  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(fullKey, JSON.stringify(entry))
    prunePrefix(prefix, key)
  } catch {
    // Ignore storage errors
  }
}

function prunePrefix(prefix: string, newKey: string): void {
  const indexKey = `${prefix}__idx`
  let keys: string[]
  try {
    keys = JSON.parse(localStorage.getItem(indexKey) || '[]')
  } catch {
    keys = []
  }

  const i = keys.indexOf(newKey)
  if (i !== -1) keys.splice(i, 1)
  keys.push(newKey)

  while (keys.length > CACHE_MAX_ENTRIES) {
    const oldest = keys.shift()!
    localStorage.removeItem(`${prefix}${oldest}`)
    memoryCache.delete(`${prefix}${oldest}`)
  }

  localStorage.setItem(indexKey, JSON.stringify(keys))
}
