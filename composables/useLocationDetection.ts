/**
 * Location Detection Composable
 * Provides functions for geographic detection and taxi type suggestions
 */

import type { LocationResult } from '~/types/location'
import type { TaxiType } from '~/types/constants'
import {
  LANTAU_BOUNDING_BOX,
  HK_ISLAND_BOX_1,
  HK_ISLAND_BOX_2,
  isWithinBoundingBox,
} from '~/utils/boundingBoxes'

export function useLocationDetection() {
  /**
   * Checks if a location is on Hong Kong Island
   * Uses two bounding boxes to accurately cover Hong Kong Island
   */
  const isOnHongKongIsland = (lat: number, lng: number): boolean => {
    const mainIsland = isWithinBoundingBox(lat, lng, HK_ISLAND_BOX_1)
    const northernShore = isWithinBoundingBox(lat, lng, HK_ISLAND_BOX_2)
    return mainIsland || northernShore
  }

  /**
   * Checks if a location is in Lantau Island
   */
  const isLantauLocation = (location: LocationResult | null): boolean => {
    if (!location) return false
    const lat = location.y
    const lng = location.x
    return isWithinBoundingBox(lat, lng, LANTAU_BOUNDING_BOX)
  }

  /**
   * Determines if Cross Harbour Tunnel should be auto-selected
   * Returns true if one location is on HK Island and the other is not
   */
  const shouldAutoSelectCrossHarbour = (
    startLocation: LocationResult | null,
    endLocation: LocationResult | null
  ): boolean => {
    if (!startLocation || !endLocation) return false

    const startIsOnHKIsland = isOnHongKongIsland(startLocation.y, startLocation.x)
    const endIsOnHKIsland = isOnHongKongIsland(endLocation.y, endLocation.x)

    // If one location is on HK Island and the other is not, it's a cross-harbour route
    return startIsOnHKIsland !== endIsOnHKIsland
  }

  /**
   * Suggests taxi type based on locations
   * Returns 'lantau' if either location is in Lantau, otherwise null
   */
  const suggestTaxiType = (
    startLocation: LocationResult | null,
    endLocation: LocationResult | null
  ): TaxiType | null => {
    const startIsLantau = isLantauLocation(startLocation)
    const endIsLantau = isLantauLocation(endLocation)

    // If either start or end is in Lantau, suggest Lantau taxi
    if (startIsLantau || endIsLantau) {
      return 'lantau'
    }

    return null
  }

  return {
    isOnHongKongIsland,
    isLantauLocation,
    shouldAutoSelectCrossHarbour,
    suggestTaxiType,
  }
}
