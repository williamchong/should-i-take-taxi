/**
 * Bounding boxes for Hong Kong geographic detection
 * These coordinates are used for both visual display and detection logic
 */

export interface BoundingBox {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

/**
 * Lantau Island bounding box
 * Covers main Lantau Island, Airport, Disneyland, Tung Chung, Mui Wo, Tai O, Discovery Bay, Ngong Ping
 * - Northern boundary: Airport area (~22.355°N)
 * - Southern boundary: Southern coast (~22.18°N)
 * - Western boundary: Tai O (~113.83°E)
 * - Eastern boundary: Discovery Bay/Mui Wo (~114.07°E)
 */
export const LANTAU_BOUNDING_BOX: BoundingBox = {
  minLat: 22.18,
  maxLat: 22.355,
  minLng: 113.83,
  maxLng: 114.07,
}

/**
 * Hong Kong Island bounding boxes
 * Using two boxes to accurately cover Hong Kong Island while excluding Kowloon
 */

/**
 * Box 1: Main Hong Kong Island
 * Covers Kennedy Town to Chai Wan, including Wan Chai, southern areas like Stanley
 */
export const HK_ISLAND_BOX_1: BoundingBox = {
  minLat: 22.19,
  maxLat: 22.285,
  minLng: 114.11,
  maxLng: 114.264,
}

/**
 * Box 2: Northern shore extension (North Point, Quarry Bay area)
 * Extends further north but only on the eastern side to avoid Tsim Sha Tsui (22.297°N, 114.174°E)
 */
export const HK_ISLAND_BOX_2: BoundingBox = {
  minLat: 22.285,
  maxLat: 22.2931,
  minLng: 114.11,
  maxLng: 114.226,
}

/**
 * Helper function to check if a point is within a bounding box
 */
export function isWithinBoundingBox(
  lat: number,
  lng: number,
  box: BoundingBox,
): boolean {
  return (
    lat >= box.minLat &&
    lat <= box.maxLat &&
    lng >= box.minLng &&
    lng <= box.maxLng
  )
}

/**
 * Helper function to convert a BoundingBox to Leaflet bounds format [[lat, lng], [lat, lng]]
 */
export function toBounds(box: BoundingBox): [[number, number], [number, number]] {
  return [
    [box.minLat, box.minLng],
    [box.maxLat, box.maxLng],
  ]
}
