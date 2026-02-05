import type { LocationResult } from '~/types/location'

/**
 * Create a LocationResult from raw coordinates.
 * Used as a fallback when reverse geocoding is unavailable or pending.
 */
export function createLocationFromCoordinates(
  latitude: number,
  longitude: number,
  displayAddress?: string,
): LocationResult {
  const coordsLabel = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
  return {
    x: longitude,
    y: latitude,
    nameEN: 'Custom Location',
    nameZH: '自訂位置',
    addressEN: coordsLabel,
    addressZH: coordsLabel,
    districtEN: '',
    districtZH: '',
    displayAddress: displayAddress ?? coordsLabel,
  }
}
