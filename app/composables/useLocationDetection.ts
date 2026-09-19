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
import { calculateMeterFare, calculateTotalFare, routeDistanceKm } from '~/utils/fareCalculation'
import { detectTunnels } from '~/utils/tunnelDetection'
import type { RouteInfo } from '~/composables/useLocationSearch'

const TAXI_TYPES = Object.keys(TAXI_RATES) as TaxiType[]

/** The parts of a route that tunnel detection reads. */
export type RouteTunnelSource = Partial<Pick<RouteInfo, 'coordinates' | 'tunnels'>>

export type TunnelSource = 'route' | 'precomputed' | 'endpoints'

/**
 * Which input tunnel detection uses for a route, best first: its OSRM
 * polyline (exact), else the tunnels precomputed for a seeded route that
 * ships without one, else the endpoint cross-harbour guess.
 */
export function tunnelSource(route: RouteTunnelSource): TunnelSource {
  if ((route.coordinates?.length ?? 0) > 1) return 'route'
  if (route.tunnels) return 'precomputed'
  return 'endpoints'
}

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

  /** Tolled tunnels for a trip, from the best source the route carries (see tunnelSource). */
  const detectRouteTunnels = (
    startLocation: LocationResult | null,
    endLocation: LocationResult | null,
    route: RouteTunnelSource = {}
  ): TunnelId[] => {
    if (!startLocation || !endLocation) return []
    switch (tunnelSource(route)) {
      case 'route':
        return detectTunnels(route.coordinates ?? [])
      case 'precomputed':
        return [...(route.tunnels ?? [])]
      case 'endpoints':
        return shouldAutoSelectCrossHarbour(startLocation, endLocation) ? ['crossHarbour'] : []
    }
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

  /**
   * Fare for a trip priced from its route alone, before any user input: the
   * route distance, its tolled tunnels with the default return toll, and the
   * suggested taxi type (urban when none can make the trip).
   * `route.distance` is in metres, as OSRM and the route cache store it.
   */
  const estimateTripFare = (
    startLocation: LocationResult,
    endLocation: LocationResult,
    route: RouteTunnelSource & { distance: number }
  ): number => {
    const distance = routeDistanceKm(route.distance)
    return calculateTotalFare({
      distance,
      taxiType: suggestTaxiType(startLocation, endLocation, distance) ?? 'urban',
      selectedTunnels: detectRouteTunnels(startLocation, endLocation, route),
      tunnelFeeType: 'return',
      isDiscountFare: false,
      luggageCount: 0,
    }).totalFare
  }

  return {
    isOnHongKongIsland,
    isLantauLocation,
    shouldAutoSelectCrossHarbour,
    detectRouteTunnels,
    canServe,
    eligibleTaxiTypes,
    suggestTaxiType,
    estimateTripFare,
  }
}
