import { CACHE_PREFIXES, setCacheMany } from '~/utils/cache'

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

// The sentinel stops us re-seeding, so seeded entries must outlive the default
// 7-day TTL — otherwise sweep-cache.client.ts reclaims them and nothing puts
// them back. Bumping SEED_VERSION is the only intended way to refresh them.
const SEED_TTL_MS = 365 * 24 * 60 * 60 * 1000

export default defineNuxtPlugin(async () => {
  try {
    if (localStorage.getItem(SEED_KEY) === SEED_VERSION) return
  } catch {
    // localStorage unavailable (SSR, private browsing) — seed memory only
  }

  const { default: precomputedCache } = await import('~~/data/precomputed-cache.json')

  // Both run before the check — `&&` would skip the geocode batch on failure.
  const routesSeeded = setCacheMany(CACHE_PREFIXES.ROUTE, precomputedCache.routes as Record<string, unknown>, SEED_TTL_MS)
  const geocodesSeeded = setCacheMany(CACHE_PREFIXES.GEOCODE, precomputedCache.geocodes as Record<string, unknown>, SEED_TTL_MS)

  // A partial write (quota, private browsing) must not be recorded as done, or
  // the landing pages fall back to live OSRM/Nominatim forever.
  if (!routesSeeded || !geocodesSeeded) return

  try {
    localStorage.setItem(SEED_KEY, SEED_VERSION)
  } catch {
    // ignore
  }
})
