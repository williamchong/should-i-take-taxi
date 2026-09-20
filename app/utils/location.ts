import type { LocationResult } from '~/types/location'

/**
 * Build the display string for a location in the given locale.
 *
 * The government geodata API routinely returns an empty address (district-level
 * places) or an empty district, so the parts are joined by what is present —
 * concatenating them unconditionally leaves a dangling ", " or " - ".
 */
export function getLocalizedAddress(location: LocationResult, locale: string): string {
  const isZh = locale.startsWith('zh')
  const parts = isZh
    ? [location.nameZH, location.addressZH]
    : [location.nameEN, location.addressEN]
  const district = isZh ? location.districtZH : location.districtEN

  const label = parts.filter(Boolean).join(', ')
  return [label, district].filter(Boolean).join(' - ')
}

/**
 * Drop results that would render identically in the dropdown.
 *
 * The government geodata API returns the same place more than once for common
 * queries ("Central" yields two identical "Central District" rows), and the
 * duplicates give the user nothing to choose between. First occurrence wins.
 */
export function dedupeLocations(locations: LocationResult[]): LocationResult[] {
  const seen = new Set<string>()
  return locations.filter((location) => {
    const key = `${location.x.toFixed(6)},${location.y.toFixed(6)}|${location.displayAddress}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

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
