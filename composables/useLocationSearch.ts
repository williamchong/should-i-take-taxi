import { useI18n } from 'vue-i18n'
import type { LocationResult } from '~/types/location'
import { getCache, setCache } from '~/utils/cache'

interface RouteInfo {
  distance: number
  time: number
  coordinates: [number, number][]
}

const CACHE_KEY_PREFIX = 'location_search_'

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
      return location
    } catch (error) {
      console.error('Error converting coordinates:', error)
      return location
    }
  }

  const calculateDrivingDistance = async (start: LocationResult, end: LocationResult): Promise<RouteInfo> => {
    const key = coordKey(start.x, start.y, end.x, end.y)
    const cached = getCache<RouteInfo>('route_', key)
    if (cached) return cached

    try {
      const data = await $fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.x},${start.y};${end.x},${end.y}?overview=full&geometries=geojson`
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
      console.error('Error calculating distance:', error)
      throw error
    }
  }

  const reverseGeocode = async (latitude: number, longitude: number): Promise<LocationResult | null> => {
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
        }
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
      console.error('Error in reverse geocoding:', error)
      return null
    }
  }

  return {
    searchLocation,
    transformCoordinates,
    calculateDrivingDistance,
    getLocalizedAddress,
    reverseGeocode
  }
}
