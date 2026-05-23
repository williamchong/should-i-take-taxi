/**
 * Bucket a distance in km into a coarse cohort. Used in PostHog event
 * properties so cohort sizes stay aggregable across the long tail of
 * exact-km values.
 */
export function distanceBucket(km: number): string {
  if (km <= 0) return 'unknown'
  if (km < 2) return '0-2km'
  if (km < 5) return '2-5km'
  if (km < 10) return '5-10km'
  if (km < 20) return '10-20km'
  if (km < 40) return '20-40km'
  return '40km+'
}
