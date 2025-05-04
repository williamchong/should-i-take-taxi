import { useI18n } from 'vue-i18n'
import type { LocationResult } from '~/types/location'

interface RouteInfo {
  distance: number
  time: number
  coordinates: [number, number][]
}

export function useLocationSearch() {
  const { locale } = useI18n()

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

    try {
      const results = await $fetch('https://geodata.gov.hk/gs/api/v1.0.0/locationSearch', {
        query: { q : query },
      }) as LocationResult[]
      return results.map(location => ({
        ...location,
        displayAddress: getLocalizedAddress(location)
      }))
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

  return {
    searchLocation,
    transformCoordinates,
    calculateDrivingDistance,
    getLocalizedAddress
  }
}
