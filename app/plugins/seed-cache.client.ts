import { CACHE_PREFIXES, getCache, setCache } from '~/utils/cache'

/**
 * Seeds the route and geocode caches with precomputed data for popular
 * sitemap routes, so SEO landing pages render fares instantly without
 * waiting for OSRM / Nominatim API responses. The seeded entries are
 * also read by pages/index.vue's dynamicDescription computed to embed
 * the fare in the SEO meta tag on /?from=X&to=Y URLs.
 *
 * Dynamic import puts the ~19KB JSON in its own chunk, loaded once on
 * first visit. Subsequent visits skip via the version sentinel, so the
 * chunk is never fetched again until the data revision changes. Nuxt
 * awaits this async plugin before mounting, so the cache is populated
 * before dynamicDescription first evaluates.
 */

const SEED_VERSION = '1' // bump when precompute-routes is re-run
const SEED_KEY = '__cache_seed_v'

export default defineNuxtPlugin(async () => {
  try {
    if (localStorage.getItem(SEED_KEY) === SEED_VERSION) return
  } catch {
    // localStorage unavailable (SSR, private browsing) — seed memory only
  }

  const { default: precomputedCache } = await import('~~/data/precomputed-cache.json')

  const routes = precomputedCache.routes as Record<string, unknown>
  for (const [key, value] of Object.entries(routes)) {
    if (getCache(CACHE_PREFIXES.ROUTE, key) === undefined) {
      setCache(CACHE_PREFIXES.ROUTE, key, value)
    }
  }

  const geocodes = precomputedCache.geocodes as Record<string, unknown>
  for (const [key, value] of Object.entries(geocodes)) {
    if (getCache(CACHE_PREFIXES.GEOCODE, key) === undefined) {
      setCache(CACHE_PREFIXES.GEOCODE, key, value)
    }
  }

  try {
    localStorage.setItem(SEED_KEY, SEED_VERSION)
  } catch {
    // ignore
  }
})
