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
    lat: 22.308046,
    lng: 113.918480,
    nameEN: 'Hong Kong International Airport',
    nameZH: '香港國際機場'
  },
  central: {
    lat: 22.282110,
    lng: 114.158290,
    nameEN: 'Central',
    nameZH: '中環'
  },
  causewaybay: {
    lat: 22.279870,
    lng: 114.182650,
    nameEN: 'Causeway Bay',
    nameZH: '銅鑼灣'
  },
  tsimshatsui: {
    lat: 22.297100,
    lng: 114.172290,
    nameEN: 'Tsim Sha Tsui',
    nameZH: '尖沙咀'
  },
  mongkok: {
    lat: 22.319280,
    lng: 114.169050,
    nameEN: 'Mong Kok',
    nameZH: '旺角'
  },
  disneyland: {
    lat: 22.312810,
    lng: 114.041480,
    nameEN: 'Hong Kong Disneyland',
    nameZH: '香港迪士尼樂園'
  },
  oceanpark: {
    lat: 22.246680,
    lng: 114.175530,
    nameEN: 'Ocean Park',
    nameZH: '海洋公園'
  },
  victoriapeak: {
    lat: 22.271430,
    lng: 114.148930,
    nameEN: 'Victoria Peak',
    nameZH: '太平山頂'
  },
  wanchai: {
    lat: 22.277600,
    lng: 114.172280,
    nameEN: 'Wan Chai',
    nameZH: '灣仔'
  },
  admiralty: {
    lat: 22.279280,
    lng: 114.165050,
    nameEN: 'Admiralty',
    nameZH: '金鐘'
  },
  jordan: {
    lat: 22.304830,
    lng: 114.172080,
    nameEN: 'Jordan',
    nameZH: '佐敦'
  },
  kwuntong: {
    lat: 22.312080,
    lng: 114.225830,
    nameEN: 'Kwun Tong',
    nameZH: '觀塘'
  },
  shatin: {
    lat: 22.382580,
    lng: 114.194420,
    nameEN: 'Sha Tin',
    nameZH: '沙田'
  },
  tsuenwan: {
    lat: 22.371310,
    lng: 114.118590,
    nameEN: 'Tsuen Wan',
    nameZH: '荃灣'
  },
  tungchung: {
    lat: 22.288890,
    lng: 113.943700,
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
      priority: 0.8
    })

    // Reverse direction (to -> from)
    urls.push({
      loc: `/?from=${toLoc.lat.toFixed(6)},${toLoc.lng.toFixed(6)}&to=${fromLoc.lat.toFixed(6)},${fromLoc.lng.toFixed(6)}`,
      changefreq: 'weekly',
      priority: 0.8
    })

    // Add zh-hk locale versions
    urls.push({
      loc: `/zh-hk/?from=${fromLoc.lat.toFixed(6)},${fromLoc.lng.toFixed(6)}&to=${toLoc.lat.toFixed(6)},${toLoc.lng.toFixed(6)}`,
      changefreq: 'weekly',
      priority: 0.8
    })

    urls.push({
      loc: `/zh-hk/?from=${toLoc.lat.toFixed(6)},${toLoc.lng.toFixed(6)}&to=${fromLoc.lat.toFixed(6)},${fromLoc.lng.toFixed(6)}`,
      changefreq: 'weekly',
      priority: 0.8
    })
  })

  return urls
}
