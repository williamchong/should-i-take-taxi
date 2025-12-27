import type { LocationResult } from '@/types/location'
import { UI_CONSTANTS, STORAGE_CONSTANTS } from '@/types/constants'

export function useRecentLocations() {
  const RECENT_LOCATIONS_KEY = STORAGE_CONSTANTS.RECENT_LOCATIONS_KEY
  const MAX_RECENT = UI_CONSTANTS.MAX_RECENT_LOCATIONS

  const getRecentLocations = (): LocationResult[] => {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(RECENT_LOCATIONS_KEY)
      if (!stored) return []

      const locations = JSON.parse(stored)
      return Array.isArray(locations) ? locations : []
    } catch (error) {
      console.error('Failed to load recent locations:', error)
      return []
    }
  }

  const addRecentLocation = (location: LocationResult): void => {
    if (typeof window === 'undefined') return

    try {
      const recent = getRecentLocations()

      // Remove duplicate if exists (by comparing displayAddress)
      const filtered = recent.filter(loc => loc.displayAddress !== location.displayAddress)

      // Add new location to front
      const updated = [location, ...filtered].slice(0, MAX_RECENT)

      localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save recent location:', error)
    }
  }

  const clearRecentLocations = (): void => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(RECENT_LOCATIONS_KEY)
    } catch (error) {
      console.error('Failed to clear recent locations:', error)
    }
  }

  return {
    getRecentLocations,
    addRecentLocation,
    clearRecentLocations
  }
}
