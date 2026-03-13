#!/usr/bin/env node

/**
 * Pre-fetches OSRM route data and constructs geocode cache entries
 * for all popular sitemap routes, so SEO landing pages render instantly
 * without any API calls.
 *
 * Usage: node scripts/precompute-routes.mjs
 * Output: data/precomputed-cache.json
 */

import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Inline the location data to avoid importing .ts in Node
const popularLocations = {
  airport:      { lat: 22.314020, lng: 113.912747, nameEN: 'Hong Kong International Airport', nameZH: '香港國際機場' },
  central:      { lat: 22.281886, lng: 114.159360, nameEN: 'Central', nameZH: '中環' },
  causewaybay:  { lat: 22.282302, lng: 114.186209, nameEN: 'Causeway Bay', nameZH: '銅鑼灣' },
  tsimshatsui:  { lat: 22.300093, lng: 114.172575, nameEN: 'Tsim Sha Tsui', nameZH: '尖沙咀' },
  mongkok:      { lat: 22.320104, lng: 114.171488, nameEN: 'Mong Kok', nameZH: '旺角' },
  disneyland:   { lat: 22.312743, lng: 114.042123, nameEN: 'Hong Kong Disneyland', nameZH: '香港迪士尼樂園' },
  oceanpark:    { lat: 22.248706, lng: 114.174324, nameEN: 'Ocean Park', nameZH: '海洋公園' },
  victoriapeak: { lat: 22.275969, lng: 114.145398, nameEN: 'Victoria Peak', nameZH: '太平山頂' },
  wanchai:      { lat: 22.278979, lng: 114.173100, nameEN: 'Wan Chai', nameZH: '灣仔' },
  admiralty:    { lat: 22.279421, lng: 114.164348, nameEN: 'Admiralty', nameZH: '金鐘' },
  jordan:       { lat: 22.304807, lng: 114.171653, nameEN: 'Jordan', nameZH: '佐敦' },
  kwuntong:     { lat: 22.311329, lng: 114.222412, nameEN: 'Kwun Tong', nameZH: '觀塘' },
  shatin:       { lat: 22.389179, lng: 114.191140, nameEN: 'Sha Tin', nameZH: '沙田' },
  tsuenwan:     { lat: 22.374444, lng: 114.107236, nameEN: 'Tsuen Wan', nameZH: '荃灣' },
  tungchung:    { lat: 22.282965, lng: 113.938872, nameEN: 'Tung Chung', nameZH: '東涌' },
}

const popularRoutes = [
  ['airport', 'central'],
  ['airport', 'causewaybay'],
  ['airport', 'tsimshatsui'],
  ['airport', 'mongkok'],
  ['airport', 'wanchai'],
  ['airport', 'disneyland'],
  ['airport', 'tungchung'],
  ['central', 'tsimshatsui'],
  ['causewaybay', 'tsimshatsui'],
  ['wanchai', 'mongkok'],
  ['admiralty', 'jordan'],
  ['central', 'victoriapeak'],
  ['tsimshatsui', 'victoriapeak'],
  ['central', 'oceanpark'],
  ['tsimshatsui', 'oceanpark'],
  ['causewaybay', 'oceanpark'],
  ['airport', 'oceanpark'],
  ['central', 'causewaybay'],
  ['mongkok', 'tsimshatsui'],
  ['kwuntong', 'central'],
  ['shatin', 'central'],
  ['tsuenwan', 'central'],
  ['mongkok', 'causewaybay'],
]

const LOCALES = ['en-hk', 'zh-hk', 'zh-tw', 'zh-cn']

// Must match coordKey() in composables/useLocationSearch.ts
function coordKey(...nums) {
  return nums.map(n => n.toFixed(6)).join(',')
}

async function fetchRoute(fromLoc, toLoc) {
  // overview=false: skip geometry since we only cache distance/time (polyline fetched lazily at runtime)
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLoc.lng},${fromLoc.lat};${toLoc.lng},${toLoc.lat}?overview=false`
  const res = await fetch(url)
  const data = await res.json()

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(`OSRM error for ${fromLoc.nameEN} → ${toLoc.nameEN}: ${data.code}`)
  }

  const route = data.routes[0]
  return {
    distance: route.distance,
    time: route.duration,
  }
}

async function fetchGeocode(lat, lng, locale) {
  // Use full locale tag to match composables/useLocationSearch.ts reverseGeocode()
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${locale}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ShouldITakeTaxi/1.0 (precompute)' },
  })
  return res.json()
}

function buildLocationResult(lat, lng, data, locale) {
  const isZh = locale.startsWith('zh')
  const address = data.address || {}
  const name = data.name || address.amenity || address.building || ''
  const street = address.road || address.pedestrian || ''
  const district = address.suburb || address.quarter || address.neighbourhood || ''
  const city = address.city || address.town || address.village || ''
  const fullAddress = [street, district, city].filter(Boolean).join(', ')

  return {
    x: lng,
    y: lat,
    nameEN: isZh ? '' : name,
    nameZH: isZh ? name : '',
    addressEN: isZh ? '' : fullAddress,
    addressZH: isZh ? fullAddress : '',
    districtEN: isZh ? '' : district,
    districtZH: isZh ? district : '',
    displayAddress: [name, fullAddress].filter(Boolean).join(', ') || data.display_name,
  }
}

async function main() {
  const output = { routes: {}, geocodes: {} }

  // 1. Fetch OSRM routes (both directions for each pair)
  console.log(`Fetching ${popularRoutes.length * 2} routes from OSRM...`)
  for (const [fromKey, toKey] of popularRoutes) {
    const fromLoc = popularLocations[fromKey]
    const toLoc = popularLocations[toKey]

    // Forward
    const fwdCacheKey = coordKey(fromLoc.lng, fromLoc.lat, toLoc.lng, toLoc.lat)
    try {
      console.log(`  ${fromLoc.nameEN} → ${toLoc.nameEN}`)
      output.routes[fwdCacheKey] = await fetchRoute(fromLoc, toLoc)
    } catch (e) {
      console.error(`  FAILED: ${e.message}`)
    }

    // Reverse
    const revCacheKey = coordKey(toLoc.lng, toLoc.lat, fromLoc.lng, fromLoc.lat)
    try {
      console.log(`  ${toLoc.nameEN} → ${fromLoc.nameEN}`)
      output.routes[revCacheKey] = await fetchRoute(toLoc, fromLoc)
    } catch (e) {
      console.error(`  FAILED: ${e.message}`)
    }

    // Rate-limit OSRM requests
    await new Promise(r => setTimeout(r, 200))
  }

  // 2. Fetch Nominatim reverse geocodes for each location × locale
  const uniqueLocations = Object.values(popularLocations)
  console.log(`\nFetching geocodes for ${uniqueLocations.length} locations × ${LOCALES.length} locales...`)

  for (const loc of uniqueLocations) {
    for (const locale of LOCALES) {
      const cacheKey = `${coordKey(loc.lat, loc.lng)}_${locale}`
      try {
        console.log(`  ${loc.nameEN} [${locale}]`)
        const data = await fetchGeocode(loc.lat, loc.lng, locale)
        if (data?.display_name) {
          output.geocodes[cacheKey] = buildLocationResult(loc.lat, loc.lng, data, locale)
        }
      } catch (e) {
        console.error(`  FAILED: ${e.message}`)
      }
      // Nominatim rate limit: 1 req/sec
      await new Promise(r => setTimeout(r, 1100))
    }
  }

  const outPath = resolve(__dirname, '..', 'data', 'precomputed-cache.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2))

  const routeCount = Object.keys(output.routes).length
  const geocodeCount = Object.keys(output.geocodes).length
  const sizeKB = (Buffer.byteLength(JSON.stringify(output)) / 1024).toFixed(1)
  console.log(`\nDone! ${routeCount} routes, ${geocodeCount} geocodes (${sizeKB} KB)`)
  console.log(`Written to ${outPath}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
