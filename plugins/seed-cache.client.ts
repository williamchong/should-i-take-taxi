import { getCache, setCache } from '~/utils/cache'

/**
 * Seeds the route and geocode caches with precomputed data for popular
 * sitemap routes, so SEO landing pages render fares instantly without
 * waiting for OSRM / Nominatim API responses.
 *
 * Uses a version sentinel so seeding only runs once per data revision.
 * Dynamic import keeps the JSON out of the main bundle.
 */

const SEED_VERSION = '1' // bump when precompute-routes is re-run
const SEED_KEY = '__cache_seed_v'

export default defineNuxtPlugin(async () => {
  try {
    if (localStorage.getItem(SEED_KEY) === SEED_VERSION) return
  } catch {
    // localStorage unavailable (SSR, private browsing) — seed memory only
  }

  const { default: precomputedCache } = await import('~/data/precomputed-cache.json')

  const routes = precomputedCache.routes as Record<string, unknown>
  for (const [key, value] of Object.entries(routes)) {
    if (getCache('route_', key) === undefined) {
      setCache('route_', key, value)
    }
  }

  const geocodes = precomputedCache.geocodes as Record<string, unknown>
  for (const [key, value] of Object.entries(geocodes)) {
    if (getCache('geocode_', key) === undefined) {
      setCache('geocode_', key, value)
    }
  }

  try {
    localStorage.setItem(SEED_KEY, SEED_VERSION)
  } catch {
    // ignore
  }
})
