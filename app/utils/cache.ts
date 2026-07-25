const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
const CACHE_MAX_ENTRIES = 50

export const CACHE_PREFIXES = {
  LOCATION_SEARCH: 'location_search_',
  TRANSFORM: 'transform_',
  ROUTE: 'route_',
  GEOCODE: 'geocode_',
  TRANSIT: 'transit_',
} as const

// ROUTE and GEOCODE are seeded from data/precomputed-cache.json (~46 routes,
// ~60 geocodes). They need headroom above the seed size, or the LRU evicts the
// precomputed SEO entries — either during seeding itself or after a handful of
// user lookups. Keep these above the seed counts when re-running
// `npm run precompute-routes`.
const CACHE_LIMITS: Record<string, number> = {
  [CACHE_PREFIXES.ROUTE]: 150,
  [CACHE_PREFIXES.GEOCODE]: 150,
}

function limitFor(prefix: string): number {
  return CACHE_LIMITS[prefix] ?? CACHE_MAX_ENTRIES
}

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

export function sweepExpired(prefix: string): number {
  if (typeof window === 'undefined') return 0
  const now = Date.now()

  let keys: string[]
  try {
    keys = readIndex(prefix)
  } catch {
    return 0
  }

  const survivors: string[] = []
  let removed = 0

  for (const key of keys) {
    const fullKey = `${prefix}${key}`
    let keep = false
    try {
      const stored = localStorage.getItem(fullKey)
      if (stored) {
        const entry = JSON.parse(stored) as CacheEntry<unknown>
        keep = !isExpired(entry, now)
      }
    } catch { /* malformed entry — drop */ }

    if (keep) {
      survivors.push(key)
    } else {
      try { localStorage.removeItem(fullKey) } catch { /* ignore */ }
      memoryCache.delete(fullKey)
      removed++
    }
  }

  if (removed > 0) {
    try { writeIndex(prefix, survivors) } catch { /* ignore */ }
  }
  return removed
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

/**
 * Bulk-write entries under one prefix, touching the LRU index once instead of
 * once per entry. Seeding writes ~100 entries in a row; routing those through
 * setCache() re-parses and re-serialises the whole index every time.
 *
 * Returns false if any entry failed to reach localStorage (quota, private
 * browsing, SSR), so callers can avoid recording the batch as persisted.
 */
export function setCacheMany<T>(prefix: string, entries: Record<string, T>, ttl?: number): boolean {
  if (typeof window === 'undefined') return false

  const keys = readIndex(prefix)
  const now = Date.now()
  let persisted = true

  for (const [key, value] of Object.entries(entries)) {
    const fullKey = `${prefix}${key}`
    const entry: CacheEntry<T> = { d: value, t: now }
    if (ttl !== undefined) entry.e = ttl
    memoryCache.set(fullKey, entry as CacheEntry<unknown>)

    try {
      localStorage.setItem(fullKey, JSON.stringify(entry))
    } catch {
      persisted = false
      continue // keep the memory entry; it still serves this session
    }
    touchKey(keys, key)
  }

  try {
    evictOverflow(prefix, keys)
    writeIndex(prefix, keys)
  } catch {
    persisted = false
  }
  return persisted
}

/** Move `key` to the most-recently-used end of the index. */
function touchKey(keys: string[], key: string): void {
  const i = keys.indexOf(key)
  if (i !== -1) keys.splice(i, 1)
  keys.push(key)
}

/** Drop least-recently-written keys until `keys` fits the prefix's limit. */
function evictOverflow(prefix: string, keys: string[]): void {
  const limit = limitFor(prefix)
  while (keys.length > limit) {
    const oldest = keys.shift()!
    localStorage.removeItem(`${prefix}${oldest}`)
    memoryCache.delete(`${prefix}${oldest}`)
  }
}

function prunePrefix(prefix: string, newKey: string): void {
  const keys = readIndex(prefix)
  touchKey(keys, newKey)
  evictOverflow(prefix, keys)
  writeIndex(prefix, keys)
}
