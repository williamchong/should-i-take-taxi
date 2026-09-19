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
 * - Eastern boundary: Penny's Bay/Disneyland (~114.05°E) — stops short of Ma Wan
 *   (~114.055°E), which Lantau taxis do not serve
 */
export const LANTAU_BOUNDING_BOX: BoundingBox = {
  minLat: 22.18,
  maxLat: 22.355,
  minLng: 113.83,
  maxLng: 114.05,
}

/**
 * South Lantau: Tung Chung Road and the roads south of it are closed to urban
 * and NT taxis, so only Lantau taxis can reach Mui Wo, Pui O, Ngong Ping or Tai O.
 * The northern edge sits just below Tung Chung (~22.28°N).
 */
export const SOUTH_LANTAU_BOX: BoundingBox = {
  minLat: 22.18,
  maxLat: 22.275,
  minLng: 113.83,
  maxLng: 114.02,
}

/**
 * Chek Lap Kok airport island (terminals, SkyPlaza, AsiaWorld-Expo). All three
 * taxi colours serve the airport, each from its own rank. The southern edge
 * stops at the channel, so Tung Chung town is excluded.
 */
export const AIRPORT_BOX: BoundingBox = {
  minLat: 22.298,
  maxLat: 22.34,
  minLng: 113.86,
  maxLng: 113.955,
}

/**
 * New Territories taxi operating areas (approximate). NT taxis mainly serve the
 * north-west (Tuen Mun, Yuen Long, Tin Shui Wai) and north-east (Sha Tin,
 * Tai Po, Fanling, Sheung Shui, Sai Kung) — not Kowloon, HK Island, Tsuen Wan,
 * Kwai Tsing or Tseung Kwan O. These boxes are a coarse fit and should be
 * reconciled with the Transport Department's NT taxi operating-area map.
 */
export const NT_TAXI_BOXES: readonly BoundingBox[] = [
  // Tuen Mun
  { minLat: 22.36, maxLat: 22.45, minLng: 113.89, maxLng: 114.0 },
  // Yuen Long, Tin Shui Wai, Kam Tin, Sheung Shui, Fanling, Tai Po
  { minLat: 22.41, maxLat: 22.56, minLng: 113.97, maxLng: 114.25 },
  // Sha Tin, Tai Wai, Fo Tan, Ma On Shan, Sai Kung
  { minLat: 22.365, maxLat: 22.47, minLng: 114.15, maxLng: 114.4 },
]

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
