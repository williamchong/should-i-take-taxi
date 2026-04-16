const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
const CACHE_MAX_ENTRIES = 50

interface CacheEntry<T> { d: T; t: number; e?: number }

const memoryCache = new Map<string, CacheEntry<unknown>>()

function isExpired(entry: CacheEntry<unknown>, now: number): boolean {
  return now - entry.t > (entry.e ?? CACHE_TTL)
}

function readIndex(prefix: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(`${prefix}__idx`) || '[]')
  } catch {
    return []
  }
}

function writeIndex(prefix: string, keys: string[]): void {
  localStorage.setItem(`${prefix}__idx`, JSON.stringify(keys))
}

export function getCache<T>(prefix: string, key: string): T | undefined {
  const fullKey = `${prefix}${key}`
  const now = Date.now()

  const mem = memoryCache.get(fullKey)
  if (mem) {
    if (isExpired(mem, now)) {
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
    if (isExpired(entry, now)) {
      localStorage.removeItem(fullKey)
      return undefined
    }
    memoryCache.set(fullKey, entry as CacheEntry<unknown>)
    return entry.d
  } catch {
    return undefined
  }
}

export function clearCache(prefix: string, key: string): void {
  const fullKey = `${prefix}${key}`
  memoryCache.delete(fullKey)

  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(fullKey)

    const keys = readIndex(prefix)
    const i = keys.indexOf(key)
    if (i === -1) return
    keys.splice(i, 1)
    writeIndex(prefix, keys)
  } catch {
    // Ignore storage errors
  }
}

export function setCache<T>(prefix: string, key: string, value: T, ttl?: number): void {
  const fullKey = `${prefix}${key}`
  const entry: CacheEntry<T> = { d: value, t: Date.now() }
  if (ttl !== undefined) entry.e = ttl
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
  const keys = readIndex(prefix)

  const i = keys.indexOf(newKey)
  if (i !== -1) keys.splice(i, 1)
  keys.push(newKey)

  while (keys.length > CACHE_MAX_ENTRIES) {
    const oldest = keys.shift()!
    localStorage.removeItem(`${prefix}${oldest}`)
    memoryCache.delete(`${prefix}${oldest}`)
  }

  writeIndex(prefix, keys)
}
