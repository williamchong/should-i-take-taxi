import { useI18n } from 'vue-i18n'
import type { LocationResult } from '~/types/location'

interface RouteInfo {
  distance: number
  time: number
  coordinates: [number, number][]
}

const CACHE_KEY_PREFIX = 'location_search_'

export function useLocationSearch() {
  const { locale } = useI18n()

  const getCacheKey = (query: string): string => {
    return `${CACHE_KEY_PREFIX}${locale.value}_${query.toLowerCase().trim()}`
  }

  const getCachedResults = (query: string): LocationResult[] | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = sessionStorage.getItem(getCacheKey(query))
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }

  const setCachedResults = (query: string, results: LocationResult[]): void => {
    if (typeof window === 'undefined') return
    
    try {
      sessionStorage.setItem(getCacheKey(query), JSON.stringify(results))
    } catch {
      // Ignore storage errors
    }
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

    // Check cache first
    const cached = getCachedResults(query)
    if (cached) return cached

    try {
      const results = await $fetch('https://geodata.gov.hk/gs/api/v1.0.0/locationSearch', {
        query: { q : query },
      }) as LocationResult[]

      const processedResults = results.map(location => ({
        ...location,
        displayAddress: getLocalizedAddress(location)
      }))

      // Cache the results
      setCachedResults(query, processedResults)

      return processedResults
    } catch (error) {
      console.error('Error searching locations:', error)
      return []
    }
  }

  const transformCoordinates = async (location: LocationResult): Promise<LocationResult> => {
    try {
      const data = await $fetch(
        `https://www.geodetic.gov.hk/transform/v2/?inSys=hkgrid&outSys=wgsgeog&e=${location.x}&n=${location.y}`
      ) as { wgsLat: number; wgsLong: number }

      if (data.wgsLat && data.wgsLong) {
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
    try {
      const data = await $fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.x},${start.y};${end.x},${end.y}?overview=full&geometries=geojson`
      ) as { code: string; routes: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] }

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        return {
          distance: route.distance,
          time: route.duration,
          coordinates: route.geometry.coordinates
        }
      }
      throw new Error('No route found or invalid response from OSRM API')
    } catch (error) {
      console.error('Error calculating distance:', error)
      throw error
    }
  }

  // 反向地理編碼：從經緯度獲取地址
  const reverseGeocode = async (latitude: number, longitude: number): Promise<LocationResult | null> => {
    try {
      // 使用 Nominatim API (OpenStreetMap)
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

        // 構建地址組件
        const name = address.amenity || address.building || ''
        const street = address.road || address.pedestrian || ''
        const district = address.suburb || address.quarter || address.neighbourhood || ''
        const city = address.city || address.town || address.village || ''

        // 構建完整地址
        const fullAddress = [street, district, city].filter(Boolean).join(', ')

        // 返回符合應用格式的位置結果
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

        return location
      }
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
