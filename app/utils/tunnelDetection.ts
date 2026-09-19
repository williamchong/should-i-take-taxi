/**
 * Detect tolled tunnels on a driving route.
 *
 * Each tunnel is described by the two ends of its straight bore, taken from
 * OSRM's own tunnel step geometry. A short "gate" is laid across the middle of
 * the bore, and a route uses the tunnel when its polyline crosses that gate.
 *
 * Crossing a gate (rather than testing whether a vertex falls inside a box)
 * matters because the app requests `overview=simplified`: OSRM drops the
 * vertices inside a straight bore, so a route through a tunnel is often a
 * single segment from portal to portal — which still crosses the gate.
 *
 * Validated against real OSRM routes in tests/fixtures/osrm-routes.json,
 * including toll-free roads that run close to each tunnel (Tai Po Road over
 * Eagle's Nest, Wong Nai Chung Gap Road beside Aberdeen, Tuen Mun Road and
 * Route Twisk either side of Tai Lam).
 */

import type { TunnelId } from '~/types/constants'

/** [lng, lat] — the order OSRM returns coordinates in. */
export type LngLat = [number, number]

interface TunnelBore {
  tunnel: TunnelId
  /** Ends of the straight bore section, [lng, lat]. */
  bore: [LngLat, LngLat]
}

/**
 * Half-width of each gate, in metres. Tai Po Road passes ~370m from the
 * Eagle's Nest bore and starts registering as a false positive at 250m; every
 * fixture route is detected correctly from 50m to 150m.
 */
export const GATE_HALF_WIDTH_M = 150

/**
 * The three harbour crossings share a fee and a return-toll rule, so they all
 * map to 'crossHarbour'. Eagle's Nest and Sha Tin Heights are tolled together
 * as one Route 8K charge; the gate sits in Eagle's Nest, before Tai Po Road
 * joins Tsing Sha Highway.
 */
export const TUNNEL_BORES: readonly TunnelBore[] = [
  { tunnel: 'crossHarbour', bore: [[114.18306, 22.28418], [114.18070, 22.29894]] }, // Cross-Harbour Tunnel
  { tunnel: 'crossHarbour', bore: [[114.21339, 22.29032], [114.23103, 22.29954]] }, // Eastern Harbour Crossing
  { tunnel: 'crossHarbour', bore: [[114.15730, 22.30177], [114.14670, 22.29030]] }, // Western Harbour Crossing
  { tunnel: 'aberdeen', bore: [[114.18073, 22.27020], [114.18024, 22.25569]] },
  { tunnel: 'tatesCairn', bore: [[114.20776, 22.34894], [114.21368, 22.37260]] },
  { tunnel: 'shingMun', bore: [[114.15242, 22.37700], [114.16324, 22.38015]] },
  { tunnel: 'lions', bore: [[114.18111, 22.34609], [114.17283, 22.35647]] },
  { tunnel: 'shaTinHeights', bore: [[114.15660, 22.35031], [114.16085, 22.35501]] }, // Eagle's Nest
  { tunnel: 'taiLam', bore: [[114.05982, 22.40640], [114.06379, 22.38083]] },
]

const METRES_PER_DEG_LAT = 110_574
const metresPerDegLng = (lat: number) => 111_320 * Math.cos(lat * Math.PI / 180)

/** A segment of length 2 × halfWidth, perpendicular to the bore at its midpoint. */
export function gateAcross([a, b]: [LngLat, LngLat], halfWidth = GATE_HALF_WIDTH_M): [LngLat, LngLat] {
  const mid: LngLat = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const kx = metresPerDegLng(mid[1])
  const dx = (b[0] - a[0]) * kx
  const dy = (b[1] - a[1]) * METRES_PER_DEG_LAT
  const len = Math.hypot(dx, dy)
  const offLng = (-dy / len) * halfWidth / kx
  const offLat = (dx / len) * halfWidth / METRES_PER_DEG_LAT
  return [[mid[0] + offLng, mid[1] + offLat], [mid[0] - offLng, mid[1] - offLat]]
}

const orientation = (o: LngLat, a: LngLat, b: LngLat) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

/** Proper intersection of segments p1–p2 and q1–q2 (touching endpoints don't count). */
export function segmentsIntersect(p1: LngLat, p2: LngLat, q1: LngLat, q2: LngLat): boolean {
  const d1 = orientation(q1, q2, p1)
  const d2 = orientation(q1, q2, p2)
  const d3 = orientation(p1, p2, q1)
  const d4 = orientation(p1, p2, q2)
  return (d1 > 0) !== (d2 > 0) && (d3 > 0) !== (d4 > 0)
}

const GATES = TUNNEL_BORES.map(({ tunnel, bore }) => ({ tunnel, gate: gateAcross(bore) }))

/**
 * Tolled tunnels an OSRM route polyline ([lng, lat][]) passes through, each
 * listed once, in the order of TUNNEL_BORES.
 */
export function detectTunnels(route: readonly LngLat[]): TunnelId[] {
  const found = new Set<TunnelId>()
  for (const { tunnel, gate } of GATES) {
    if (found.has(tunnel)) continue
    for (let i = 1; i < route.length; i++) {
      if (segmentsIntersect(route[i - 1]!, route[i]!, gate[0], gate[1])) {
        found.add(tunnel)
        break
      }
    }
  }
  return [...found]
}
