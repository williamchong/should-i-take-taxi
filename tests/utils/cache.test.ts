import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clearCache, getCache, setCache } from '~/utils/cache'

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

  it('serves from memory cache on subsequent gets', () => {
    const prefix = 'test_mem_'
    setCache(prefix, 'memkey', 'memvalue')

    // Remove from localStorage to prove memory cache works
    localStorage.removeItem(`${prefix}memkey`)

    const result = getCache(prefix, 'memkey')
    expect(result).toBe('memvalue')
  })
})
