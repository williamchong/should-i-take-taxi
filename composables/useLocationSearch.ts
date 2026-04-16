import { useI18n } from 'vue-i18n'
import type { LocationResult } from '~/types/location'
import type { TransitLeg } from '~/utils/transitValue'
import { clearCache, getCache, setCache } from '~/utils/cache'

interface RouteInfo {
  distance: number
  time: number
  coordinates: [number, number][]
}

interface TransitPlan {
  duration_seconds: number
  duration_seconds_min?: number
  duration_seconds_max?: number
  fares_min?: number
  fares_max?: number
  currency?: string
  legs: TransitLeg[]
}

interface TransitResponse {
  plans: TransitPlan[]
}

function mapLocaleForTransit(locale: string): string {
  if (locale === 'en-hk') return 'en'
  if (locale === 'zh-cn') return 'zh'
  return 'zh-Hant' // zh-hk, zh-tw
}

const CACHE_KEY_PREFIX = 'location_search_'

// Transit plans embed real-time departures/waits, so override the global cache TTL.
const TRANSIT_CACHE_TTL_MS = 2 * 60 * 1000

function coordKey(...nums: number[]): string {
  return nums.map(n => n.toFixed(6)).join(',')
}

export function useLocationSearch() {
  const { locale } = useI18n()

  const searchCacheKey = (query: string): string => {
    return `${locale.value}_${query.toLowerCase().trim()}`
  }

  const getLocalizedAddress = (location: LocationResult): string => {
    const isZh = locale.value.startsWith('zh')
    const name = isZh ? location.nameZH : location.nameEN
    const address = isZh ? location.addressZH : location.addressEN
    const district = isZh ? location.districtZH : location.districtEN

    return `${name ? name + ', ' : ''}${address}${district ? ' - ' + district : ''}`
  }

  const searchLocation = async (query: string): Promise<LocationResult[]> => {
    if (!query) return []
    // eslint-disable-next-line no-control-regex
    const isAscii = /^[\x00-\x7F]+$/.test(query)
    if (isAscii && query.trim().length < 2) return []

    const cached = getCache<LocationResult[]>(CACHE_KEY_PREFIX, searchCacheKey(query))
    if (cached) return cached

    try {
      const results = await $fetch('https://www.map.gov.hk/gs/api/v1.0.0/locationSearch', {
        query: { q : query },
      }) as LocationResult[]

      const processedResults = results.map(location => ({
        ...location,
        displayAddress: getLocalizedAddress(location)
      }))

      setCache(CACHE_KEY_PREFIX, searchCacheKey(query), processedResults)

      return processedResults
    } catch (error) {
      console.error('Error searching locations:', error)
      return []
    }
  }

  const transformCoordinates = async (location: LocationResult): Promise<LocationResult> => {
    const key = coordKey(location.x, location.y)
    const cached = getCache<{ wgsLat: number; wgsLong: number }>('transform_', key)
    if (cached) {
      return { ...location, x: cached.wgsLong, y: cached.wgsLat }
    }

    try {
      const data = await $fetch(
        `https://www.geodetic.gov.hk/transform/v2/?inSys=hkgrid&outSys=wgsgeog&e=${location.x}&n=${location.y}`
      ) as { wgsLat: number; wgsLong: number }

      if (data.wgsLat && data.wgsLong) {
        setCache('transform_', key, data)
        return {
          ...location,
          x: data.wgsLong,
          y: data.wgsLat
        }
      }
      throw new Error('Invalid response from coordinate transformation API')
    } catch (error) {
      console.error('Error converting coordinates:', error)
      throw error
    }
  }

  /** Ensure a cached entry has a coordinates array (precomputed entries omit it) */
  const withCoordinates = (route: RouteInfo): RouteInfo =>
    route.coordinates?.length ? route : { ...route, coordinates: [] }

  /**
   * Return cached route info (distance/time) synchronously if available.
   * Used for instant fare display on precomputed SEO routes.
   */
  const getCachedRoute = (start: LocationResult, end: LocationResult): RouteInfo | null => {
    const key = coordKey(start.x, start.y, end.x, end.y)
    const cached = getCache<RouteInfo>('route_', key)
    return cached?.distance ? withCoordinates(cached) : null
  }

  const clearRouteCache = (start: LocationResult, end: LocationResult): void => {
    clearCache('route_', coordKey(start.x, start.y, end.x, end.y))
  }

  const clearTransitCache = (start: LocationResult, end: LocationResult, localeOverride?: string): void => {
    const mappedLocale = mapLocaleForTransit(localeOverride || locale.value)
    clearCache('transit_', `${coordKey(start.y, start.x, end.y, end.x)}_${mappedLocale}`)
  }

  const calculateDrivingDistance = async (start: LocationResult, end: LocationResult, signal?: AbortSignal): Promise<RouteInfo> => {
    const key = coordKey(start.x, start.y, end.x, end.y)
    const cached = getCache<RouteInfo>('route_', key)

    // If cache has full data (including polyline), return immediately
    if (cached?.coordinates?.length) return cached

    try {
      const data = await $fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.x},${start.y};${end.x},${end.y}?overview=full&geometries=geojson`,
        { signal }
      ) as { code: string; routes: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] }

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const result: RouteInfo = {
          distance: route.distance,
          time: route.duration,
          coordinates: route.geometry.coordinates
        }
        setCache('route_', key, result)
        return result
      }
      throw new Error('No route found or invalid response from OSRM API')
    } catch (error) {
      // If OSRM fails but we have partial cache (distance/time), return it
      if (cached) return withCoordinates(cached)
      console.error('Error calculating distance:', error)
      throw error
    }
  }

  const reverseGeocode = async (latitude: number, longitude: number, signal?: AbortSignal): Promise<LocationResult | null> => {
    const key = `${coordKey(latitude, longitude)}_${locale.value}`
    const cached = getCache<LocationResult | null>('geocode_', key)
    if (cached !== undefined) return cached

    try {
      const data = await $fetch('https://nominatim.openstreetmap.org/reverse', {
        query: {
          lat: latitude.toString(),
          lon: longitude.toString(),
          format: 'json',
          'accept-language': locale.value
        },
        headers: {
          'User-Agent': 'ShouldITakeTaxi/1.0'
        },
        signal,
      }) as any

      if (data && data.display_name) {
        const isZh = locale.value.startsWith('zh')
        const address = data.address || {}

        const name = data.name || address.amenity || address.building || ''
        const street = address.road || address.pedestrian || ''
        const district = address.suburb || address.quarter || address.neighbourhood || ''
        const city = address.city || address.town || address.village || ''

        const fullAddress = [street, district, city].filter(Boolean).join(', ')

        const location: LocationResult = {
          x: longitude,
          y: latitude,
          nameEN: isZh ? '' : name,
          nameZH: isZh ? name : '',
          addressEN: isZh ? '' : fullAddress,
          addressZH: isZh ? fullAddress : '',
          districtEN: isZh ? '' : district,
          districtZH: isZh ? district : '',
          displayAddress: [name, fullAddress].filter(Boolean).join(', ') || data.display_name
        }

        setCache('geocode_', key, location)
        return location
      }
      setCache('geocode_', key, null)
      return null
    } catch (error) {
      if (signal?.aborted) throw error
      console.error('Error in reverse geocoding:', error)
      return null
    }
  }

  const calculateTransitRoute = async (
    start: LocationResult,
    end: LocationResult,
    localeOverride?: string,
    signal?: AbortSignal
  ): Promise<TransitResponse | null> => {
    try {
      const mappedLocale = mapLocaleForTransit(localeOverride || locale.value)
      const key = `${coordKey(start.y, start.x, end.y, end.x)}_${mappedLocale}`
      const cached = getCache<TransitResponse>('transit_', key)
      if (cached) return cached

      // TODO: Drop the Scalar CORS proxy once justusewheels.com sends CORS headers
      const targetUrl = `https://engine.justusewheels.com/v1/plan?${new URLSearchParams({
        origin: `${start.y},${start.x}`,
        destination: `${end.y},${end.x}`,
        locale: mappedLocale,
        max_results: '1',
      })}`
      const data = await $fetch<TransitResponse>(
        `https://proxy.scalar.com/?scalar_url=${encodeURIComponent(targetUrl)}`,
        { signal }
      )

      if (data?.plans) {
        setCache('transit_', key, data, TRANSIT_CACHE_TTL_MS)
        return data
      }
      return null
    } catch {
      return null
    }
  }

  return {
    searchLocation,
    transformCoordinates,
    calculateDrivingDistance,
    getCachedRoute,
    clearRouteCache,
    calculateTransitRoute,
    clearTransitCache,
    getLocalizedAddress,
    reverseGeocode
  }
}
