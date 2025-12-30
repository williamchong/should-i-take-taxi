/**
 * Popular Hong Kong locations and taxi routes for SEO sitemap generation
 */

export interface Location {
  lat: number
  lng: number
  nameEN: string
  nameZH: string
}

export const popularLocations: Record<string, Location> = {
  airport: {
    lat: 22.314020,
    lng: 113.912747,
    nameEN: 'Hong Kong International Airport',
    nameZH: '香港國際機場'
  },
  central: {
    lat: 22.281886,
    lng: 114.159360,
    nameEN: 'Central',
    nameZH: '中環'
  },
  causewaybay: {
    lat: 22.282302,
    lng: 114.186209,
    nameEN: 'Causeway Bay',
    nameZH: '銅鑼灣'
  },
  tsimshatsui: {
    lat: 22.300093,
    lng: 114.172575,
    nameEN: 'Tsim Sha Tsui',
    nameZH: '尖沙咀'
  },
  mongkok: {
    lat: 22.320104,
    lng: 114.171488,
    nameEN: 'Mong Kok',
    nameZH: '旺角'
  },
  disneyland: {
    lat: 22.312743,
    lng: 114.042123,
    nameEN: 'Hong Kong Disneyland',
    nameZH: '香港迪士尼樂園'
  },
  oceanpark: {
    lat: 22.248706,
    lng: 114.174324,
    nameEN: 'Ocean Park',
    nameZH: '海洋公園'
  },
  victoriapeak: {
    lat: 22.275969,
    lng: 114.145398,
    nameEN: 'Victoria Peak',
    nameZH: '太平山頂'
  },
  wanchai: {
    lat: 22.278979,
    lng: 114.173100,
    nameEN: 'Wan Chai',
    nameZH: '灣仔'
  },
  admiralty: {
    lat: 22.279421,
    lng: 114.164348,
    nameEN: 'Admiralty',
    nameZH: '金鐘'
  },
  jordan: {
    lat: 22.304807,
    lng: 114.171653,
    nameEN: 'Jordan',
    nameZH: '佐敦'
  },
  kwuntong: {
    lat: 22.311329,
    lng: 114.222412,
    nameEN: 'Kwun Tong',
    nameZH: '觀塘'
  },
  shatin: {
    lat: 22.389179,
    lng: 114.191140,
    nameEN: 'Sha Tin',
    nameZH: '沙田'
  },
  tsuenwan: {
    lat: 22.374444,
    lng: 114.107236,
    nameEN: 'Tsuen Wan',
    nameZH: '荃灣'
  },
  tungchung: {
    lat: 22.282965,
    lng: 113.938872,
    nameEN: 'Tung Chung',
    nameZH: '東涌'
  }
}

/**
 * Popular route pairs [from, to] for sitemap generation
 * Routes will be generated in both directions
 */
export const popularRoutes: [string, string][] = [
  // Airport routes (most common searches)
  ['airport', 'central'],
  ['airport', 'causewaybay'],
  ['airport', 'tsimshatsui'],
  ['airport', 'mongkok'],
  ['airport', 'wanchai'],
  ['airport', 'disneyland'],
  ['airport', 'tungchung'],

  // Cross-harbour routes
  ['central', 'tsimshatsui'],
  ['causewaybay', 'tsimshatsui'],
  ['wanchai', 'mongkok'],
  ['admiralty', 'jordan'],

  // Tourist attractions
  ['central', 'victoriapeak'],
  ['tsimshatsui', 'victoriapeak'],
  ['central', 'oceanpark'],
  ['tsimshatsui', 'oceanpark'],
  ['causewaybay', 'oceanpark'],
  ['airport', 'oceanpark'],

  // Popular district connections
  ['central', 'causewaybay'],
  ['mongkok', 'tsimshatsui'],
  ['kwuntong', 'central'],
  ['shatin', 'central'],
  ['tsuenwan', 'central'],
  ['mongkok', 'causewaybay']
]

/**
 * Find a known location by coordinates with tolerance for floating point differences
 * @param lat Latitude coordinate
 * @param lng Longitude coordinate
 * @param tolerance Tolerance in degrees (default: 0.0001 ≈ 11 meters)
 * @returns Location object if found, null otherwise
 */
export function findLocationByCoordinates(lat: number, lng: number, tolerance = 0.0001): Location | null {
  for (const location of Object.values(popularLocations)) {
    const latDiff = Math.abs(location.lat - lat)
    const lngDiff = Math.abs(location.lng - lng)

    if (latDiff <= tolerance && lngDiff <= tolerance) {
      return location
    }
  }

  return null
}

/**
 * Generate sitemap URLs for all popular routes in both directions and both locales
 */
export function generateSitemapUrls() {
  const urls: any[] = []

  popularRoutes.forEach(([from, to]) => {
    const fromLoc = popularLocations[from]
    const toLoc = popularLocations[to]

    if (!fromLoc || !toLoc) {
      console.warn(`Missing location data for route: ${from} -> ${to}`)
      return
    }

    // Forward direction (from -> to)
    urls.push({
      loc: `/?from=${fromLoc.lat.toFixed(6)},${fromLoc.lng.toFixed(6)}&to=${toLoc.lat.toFixed(6)},${toLoc.lng.toFixed(6)}`,
      changefreq: 'weekly',
      priority: 0.8,
      _i18nTransform: true,
    })

    // Reverse direction (to -> from)
    urls.push({
      loc: `/?from=${toLoc.lat.toFixed(6)},${toLoc.lng.toFixed(6)}&to=${fromLoc.lat.toFixed(6)},${fromLoc.lng.toFixed(6)}`,
      changefreq: 'weekly',
      priority: 0.8,
      _i18nTransform: true,
    })
  })

  return urls
}
