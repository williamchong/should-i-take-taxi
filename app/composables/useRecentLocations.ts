import { useStorage } from '@vueuse/core'
import type { LocationResult } from '@/types/location'
import { UI_CONSTANTS, STORAGE_CONSTANTS } from '@/types/constants'

export function useRecentLocations() {
  const recentLocations = useStorage<LocationResult[]>(STORAGE_CONSTANTS.RECENT_LOCATIONS_KEY, [])

  const getRecentLocations = (): LocationResult[] => recentLocations.value

  const addRecentLocation = (location: LocationResult): void => {
    const filtered = recentLocations.value.filter(loc => loc.displayAddress !== location.displayAddress)
    recentLocations.value = [location, ...filtered].slice(0, UI_CONSTANTS.MAX_RECENT_LOCATIONS)
  }

  const clearRecentLocations = (): void => {
    recentLocations.value = []
  }

  return {
    getRecentLocations,
    addRecentLocation,
    clearRecentLocations
  }
}
