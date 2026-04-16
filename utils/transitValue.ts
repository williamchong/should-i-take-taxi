export interface TransitLeg {
  type: 'walk' | 'transit' | 'wait' | 'station_transfer'
  duration_seconds?: number
  distance_meters?: number
}

// Walking covers both first/last-mile walks and inter-platform station transfers
// (e.g. Central interchange) — counting only `walk` would silently undercount.
export function summarizeTransitLegs(legs: TransitLeg[]): {
  walkSeconds: number
  walkMeters: number
  waitSeconds: number
} {
  let walkSeconds = 0
  let walkMeters = 0
  let waitSeconds = 0
  for (const leg of legs) {
    if (leg.type === 'walk' || leg.type === 'station_transfer') {
      walkSeconds += leg.duration_seconds ?? 0
      walkMeters += leg.distance_meters ?? 0
    } else if (leg.type === 'wait') {
      waitSeconds += leg.duration_seconds ?? 0
    }
  }
  return { walkSeconds, walkMeters, waitSeconds }
}
