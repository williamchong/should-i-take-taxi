/**
 * Location Detection Composable
 * Provides functions for geographic detection, tunnel detection and taxi type suggestions
 */

import type { LocationResult } from '~/types/location'
import type { TaxiType, TunnelId } from '~/types/constants'
import { TAXI_RATES } from '~/types/constants'
import {
  LANTAU_BOUNDING_BOX,
  HK_ISLAND_BOX_1,
  HK_ISLAND_BOX_2,
  SOUTH_LANTAU_BOX,
  AIRPORT_BOX,
  NT_TAXI_BOXES,
  isWithinBoundingBox,
} from '~/utils/boundingBoxes'
import { calculateMeterFare } from '~/utils/fareCalculation'
import { detectTunnels, type LngLat } from '~/utils/tunnelDetection'

const TAXI_TYPES = Object.keys(TAXI_RATES) as TaxiType[]

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
   * Endpoint-only guess at a cross-harbour trip: one location on HK Island and
   * the other not. Used until the route geometry is available.
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
   * Tolled tunnels for a trip. Uses the OSRM route polyline when there is one
   * (exact, covers every tunnel); otherwise falls back to the endpoint
   * cross-harbour guess, e.g. for a precomputed route that has no polyline.
   */
  const detectRouteTunnels = (
    startLocation: LocationResult | null,
    endLocation: LocationResult | null,
    routeCoordinates: readonly LngLat[] = []
  ): TunnelId[] => {
    if (!startLocation || !endLocation) return []
    if (routeCoordinates.length > 1) return detectTunnels(routeCoordinates)
    return shouldAutoSelectCrossHarbour(startLocation, endLocation) ? ['crossHarbour'] : []
  }

  /**
   * Whether a taxi type may pick up or set down at a location.
   * - Urban (red): everywhere except South Lantau
   * - New Territories (green): NT operating areas and the airport
   * - Lantau (blue): Lantau Island and the airport
   */
  const canServe = (taxiType: TaxiType, location: LocationResult): boolean => {
    const lat = location.y
    const lng = location.x
    switch (taxiType) {
      case 'urban':
        return !isWithinBoundingBox(lat, lng, SOUTH_LANTAU_BOX)
      case 'newTerritories':
        return isWithinBoundingBox(lat, lng, AIRPORT_BOX) ||
          NT_TAXI_BOXES.some(box => isWithinBoundingBox(lat, lng, box))
      case 'lantau':
        return isWithinBoundingBox(lat, lng, LANTAU_BOUNDING_BOX)
    }
  }

  /** Taxi types allowed to serve both ends of the trip. */
  const eligibleTaxiTypes = (
    startLocation: LocationResult | null,
    endLocation: LocationResult | null
  ): TaxiType[] => {
    if (!startLocation || !endLocation) return []
    return TAXI_TYPES.filter(type => canServe(type, startLocation) && canServe(type, endLocation))
  }

  /**
   * Suggests the cheapest taxi type that can serve both ends of the trip.
   * With no distance yet, the flag fall decides (Lantau < NT < Urban).
   * Returns null when either location is missing or no single type can make
   * the trip (e.g. Tai O → Central).
   */
  const suggestTaxiType = (
    startLocation: LocationResult | null,
    endLocation: LocationResult | null,
    distanceKm = 0
  ): TaxiType | null => {
    const eligible = eligibleTaxiTypes(startLocation, endLocation)
    if (!eligible.length) return null
    return eligible.reduce((best, type) =>
      calculateMeterFare(distanceKm, type) < calculateMeterFare(distanceKm, best) ? type : best
    )
  }

  return {
    isOnHongKongIsland,
    isLantauLocation,
    shouldAutoSelectCrossHarbour,
    detectRouteTunnels,
    canServe,
    eligibleTaxiTypes,
    suggestTaxiType,
  }
}
