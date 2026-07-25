import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CACHE_PREFIXES, clearCache, getCache, setCache, setCacheMany, sweepExpired } from '~/utils/cache'

describe('cache', () => {
  beforeEach(() => {
    localStorage.clear()
    // Clear the in-memory cache by reloading the module isn't feasible,
    // so we use unique prefixes per test to avoid stale memory cache entries.
  })

  it('round-trips a value through set and get', () => {
    const prefix = 'test_rt_'
    setCache(prefix, 'key1', { data: 'hello' })
    const result = getCache<{ data: string }>(prefix, 'key1')
    expect(result).toEqual({ data: 'hello' })
  })

  it('returns undefined for a missing key', () => {
    const result = getCache('test_miss_', 'nonexistent')
    expect(result).toBeUndefined()
  })

  it('returns undefined for expired entries', () => {
    const prefix = 'test_exp_'
    const now = Date.now()

    // Set cache at current time
    vi.spyOn(Date, 'now').mockReturnValue(now)
    setCache(prefix, 'key1', 'value')

    // Advance time past 7-day TTL
    const eightDays = 8 * 24 * 60 * 60 * 1000
    vi.spyOn(Date, 'now').mockReturnValue(now + eightDays)

    const result = getCache(prefix, 'key1')
    expect(result).toBeUndefined()

    vi.restoreAllMocks()
  })

  it('evicts oldest entries when exceeding 50 entries', () => {
    const prefix = 'test_lru_'

    // Add 51 entries
    for (let i = 0; i < 51; i++) {
      setCache(prefix, `key${i}`, `value${i}`)
    }

    // The first entry should have been evicted from both memory and localStorage
    expect(getCache(prefix, 'key0')).toBeUndefined()
    expect(localStorage.getItem(`${prefix}key0`)).toBeNull()

    // The most recent entry should still exist
    expect(getCache(prefix, 'key50')).toBe('value50')
  })

  it('stores values in localStorage', () => {
    const prefix = 'test_ls_'
    setCache(prefix, 'persist', 42)
    const stored = localStorage.getItem(`${prefix}persist`)
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.d).toBe(42)
  })

  it('honors a per-entry ttl override', () => {
    const prefix = 'test_ttl_'
    const now = Date.now()

    vi.spyOn(Date, 'now').mockReturnValue(now)
    setCache(prefix, 'short', 'value', 60 * 1000) // 1 minute

    // Still fresh after 30s
    vi.spyOn(Date, 'now').mockReturnValue(now + 30 * 1000)
    expect(getCache(prefix, 'short')).toBe('value')

    // Expired after 2 minutes (well under the 7-day default)
    vi.spyOn(Date, 'now').mockReturnValue(now + 2 * 60 * 1000)
    expect(getCache(prefix, 'short')).toBeUndefined()

    vi.restoreAllMocks()
  })

  it('clearCache removes the entry from memory, localStorage, and the LRU index', () => {
    const prefix = 'test_clear_'
    setCache(prefix, 'a', 'A')
    setCache(prefix, 'b', 'B')

    clearCache(prefix, 'a')

    expect(getCache(prefix, 'a')).toBeUndefined()
    expect(localStorage.getItem(`${prefix}a`)).toBeNull()
    const idx = JSON.parse(localStorage.getItem(`${prefix}__idx`) || '[]')
    expect(idx).not.toContain('a')
    expect(idx).toContain('b')

    // Other entries are untouched
    expect(getCache(prefix, 'b')).toBe('B')
  })

  it('clearCache is a no-op for missing keys', () => {
    expect(() => clearCache('test_noop_', 'never-set')).not.toThrow()
  })

  it('sweepExpired removes expired entries, prunes the index, and leaves fresh ones intact', () => {
    const prefix = 'test_sweep_'
    const now = Date.now()

    vi.spyOn(Date, 'now').mockReturnValue(now)
    setCache(prefix, 'stale', 'old', 60 * 1000) // 1 minute TTL
    setCache(prefix, 'fresh', 'new') // default 7-day TTL

    // Advance past the short TTL but well under 7 days
    vi.spyOn(Date, 'now').mockReturnValue(now + 2 * 60 * 1000)

    const removed = sweepExpired(prefix)
    expect(removed).toBe(1)

    expect(localStorage.getItem(`${prefix}stale`)).toBeNull()
    expect(localStorage.getItem(`${prefix}fresh`)).toBeTruthy()

    const idx = JSON.parse(localStorage.getItem(`${prefix}__idx`) || '[]')
    expect(idx).toEqual(['fresh'])

    vi.restoreAllMocks()
  })

  it('sweepExpired drops index entries whose localStorage record is missing', () => {
    const prefix = 'test_sweep_orphan_'
    setCache(prefix, 'a', 'A')
    setCache(prefix, 'b', 'B')

    // Simulate an orphan index entry (e.g., storage wiped by another tab)
    localStorage.removeItem(`${prefix}a`)

    const removed = sweepExpired(prefix)
    expect(removed).toBe(1)

    const idx = JSON.parse(localStorage.getItem(`${prefix}__idx`) || '[]')
    expect(idx).toEqual(['b'])
  })

  it('gives seeded prefixes room for the whole precomputed payload', () => {
    // data/precomputed-cache.json seeds ~46 routes and ~60 geocodes; a 50-entry
    // cap would silently evict part of the seed.
    const entries = Object.fromEntries(
      Array.from({ length: 60 }, (_, i) => [`key${i}`, `value${i}`]),
    )

    setCacheMany(CACHE_PREFIXES.GEOCODE, entries)

    expect(getCache(CACHE_PREFIXES.GEOCODE, 'key0')).toBe('value0')
    expect(getCache(CACHE_PREFIXES.GEOCODE, 'key59')).toBe('value59')
  })

  it('setCacheMany writes every entry and the index exactly once', () => {
    const prefix = 'test_many_'
    const setItem = vi.spyOn(localStorage, 'setItem')

    setCacheMany(prefix, { a: 1, b: 2, c: 3 })

    expect(getCache(prefix, 'a')).toBe(1)
    expect(getCache(prefix, 'c')).toBe(3)
    // 3 entries + 1 index write — not one index write per entry.
    expect(setItem).toHaveBeenCalledTimes(4)
    expect(JSON.parse(localStorage.getItem(`${prefix}__idx`)!)).toEqual(['a', 'b', 'c'])

    vi.restoreAllMocks()
  })

  it('setCacheMany overwrites existing keys without duplicating them in the index', () => {
    const prefix = 'test_many_over_'
    setCache(prefix, 'a', 'original')

    setCacheMany(prefix, { a: 'seeded', b: 'seeded' })

    expect(getCache(prefix, 'a')).toBe('seeded')
    expect(JSON.parse(localStorage.getItem(`${prefix}__idx`)!)).toEqual(['a', 'b'])
  })

  it('setCacheMany honors a ttl override so seeded entries survive the sweep', () => {
    const prefix = 'test_many_ttl_'
    const now = Date.now()

    vi.spyOn(Date, 'now').mockReturnValue(now)
    setCacheMany(prefix, { a: 'seeded' }, 60 * 60 * 1000) // 1 hour

    // Past the 7-day default, but inside the override.
    vi.spyOn(Date, 'now').mockReturnValue(now + 30 * 60 * 1000)
    expect(sweepExpired(prefix)).toBe(0)
    expect(getCache(prefix, 'a')).toBe('seeded')

    vi.restoreAllMocks()
  })

  it('setCacheMany reports failure when an entry cannot be persisted', () => {
    const prefix = 'test_many_quota_'
    const setItem = vi.spyOn(localStorage, 'setItem')
    setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    try {
      expect(setCacheMany(prefix, { a: 1, b: 2 })).toBe(false)
    } finally {
      // vi.restoreAllMocks() does not reach happy-dom's Storage — restore explicitly.
      setItem.mockRestore()
    }

    // The memory entry still serves the current session.
    expect(getCache(prefix, 'a')).toBe(1)
  })

  it('setCacheMany reports success when everything persists', () => {
    expect(setCacheMany('test_many_ok_', { a: 1 })).toBe(true)
  })

  it('setCacheMany still evicts past the prefix limit', () => {
    const prefix = 'test_many_lru_'
    const entries = Object.fromEntries(
      Array.from({ length: 51 }, (_, i) => [`key${i}`, `value${i}`]),
    )

    setCacheMany(prefix, entries)

    expect(getCache(prefix, 'key0')).toBeUndefined()
    expect(localStorage.getItem(`${prefix}key0`)).toBeNull()
    expect(getCache(prefix, 'key50')).toBe('value50')
  })

  it('serves from memory cache on subsequent gets', () => {
    const prefix = 'test_mem_'
    setCache(prefix, 'memkey', 'memvalue')

    // Remove from localStorage to prove memory cache works
    localStorage.removeItem(`${prefix}memkey`)

    const result = getCache(prefix, 'memkey')
    expect(result).toBe('memvalue')
  })
})
