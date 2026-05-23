/**
 * Taxi Fare Constants
 * Centralized constants for Hong Kong taxi fare calculations
 */

export const TAXI_FARE_CONSTANTS = {
  FIRST_TIER_DISTANCE: 2, // km - distance covered by flag fall
  INCREMENTAL_SEGMENT: 0.2, // km - distance per fare increment
  LUGGAGE_FEE: 6, // HK$ - fee per piece of luggage
  ADDITIONAL_FEE: 5, // HK$ - additional fees for certain taxi types
  DISCOUNT_RATE: 0.85, // 85折 discount rate applied to meter fare
  RATE_THRESHOLDS: {
    urban: 102.5, // HK$ - threshold where rate changes
    newTerritories: 82.5, // HK$
    lantau: 195, // HK$
  },
} as const

/**
 * Tunnel Fee Constants
 * All tunnel fees in HK$
 */
export const TUNNEL_FEES = {
  crossHarbour: 25,
  tatesCairn: 20,
  taiLam: 58,
  lions: 8,
  shingMun: 5,
  aberdeen: 5,
  shaTinHeights: 8,
} as const

/**
 * UI Constants
 * Constants for UI behavior and validation
 */
export const UI_CONSTANTS = {
  SEARCH_DEBOUNCE_MS: 500, // milliseconds - debounce delay for location search
  MAX_SEARCH_RESULTS: 5, // maximum number of search results to display
  DISTANCE_MIN: 0.1, // km - minimum valid distance
  DISTANCE_MAX: 200, // km - maximum valid distance
  DISTANCE_WARNING_THRESHOLD: 50, // % - warn if manual distance differs by this much
  MAX_RECENT_LOCATIONS: 5, // maximum number of recent locations to store
} as const

/**
 * Map Constants
 * Default map center and bounding box display
 */
export const MAP_CONSTANTS = {
  DEFAULT_CENTER: [22.302711, 114.177216] as [number, number], // Hong Kong center coordinates
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 11,
  MAX_ZOOM: 17,
  MAP_PADDING: 25, // pixels - padding for map bounds
  ROUTE_COLOR: '#2563eb', // blue color for route polyline
  ROUTE_WEIGHT: 5, // polyline weight
  ROUTE_OPACITY: 0.8, // polyline opacity
} as const

/**
 * Storage Constants
 * Keys for session/local storage
 */
export const STORAGE_CONSTANTS = {
  RECENT_LOCATIONS_KEY: 'taxi_recent_locations',
  CACHE_KEY_PREFIX: 'hk_location_search_',
} as const

/**
 * Geolocation Constants
 * Constants for GPS location detection
 */
export const GEOLOCATION_CONSTANTS = {
  TIMEOUT: 10000, // milliseconds - timeout for GPS request
  MAXIMUM_AGE: 0, // milliseconds - maximum age of cached position
  ENABLE_HIGH_ACCURACY: true,
} as const

/**
 * Taxi Rate Structures
 * Complete rate information for each taxi type
 */
export interface TaxiRate {
  flagFall: number
  firstTierDistance: number
  incrementalRate: number
  incrementalRateAfterThreshold: number
  thresholdAmount: number
  luggageFee: number
  additionalFee: number
}

export const TAXI_RATES: Record<'urban' | 'newTerritories' | 'lantau', TaxiRate> = {
  urban: {
    flagFall: 29,
    firstTierDistance: TAXI_FARE_CONSTANTS.FIRST_TIER_DISTANCE,
    incrementalRate: 2.1,
    incrementalRateAfterThreshold: 1.4,
    thresholdAmount: TAXI_FARE_CONSTANTS.RATE_THRESHOLDS.urban,
    luggageFee: TAXI_FARE_CONSTANTS.LUGGAGE_FEE,
    additionalFee: TAXI_FARE_CONSTANTS.ADDITIONAL_FEE,
  },
  newTerritories: {
    flagFall: 25.5,
    firstTierDistance: TAXI_FARE_CONSTANTS.FIRST_TIER_DISTANCE,
    incrementalRate: 1.9,
    incrementalRateAfterThreshold: 1.4,
    thresholdAmount: TAXI_FARE_CONSTANTS.RATE_THRESHOLDS.newTerritories,
    luggageFee: TAXI_FARE_CONSTANTS.LUGGAGE_FEE,
    additionalFee: TAXI_FARE_CONSTANTS.ADDITIONAL_FEE,
  },
  lantau: {
    flagFall: 24,
    firstTierDistance: TAXI_FARE_CONSTANTS.FIRST_TIER_DISTANCE,
    incrementalRate: 1.9,
    incrementalRateAfterThreshold: 1.6,
    thresholdAmount: TAXI_FARE_CONSTANTS.RATE_THRESHOLDS.lantau,
    luggageFee: TAXI_FARE_CONSTANTS.LUGGAGE_FEE,
    additionalFee: TAXI_FARE_CONSTANTS.ADDITIONAL_FEE,
  },
} as const

/**
 * Type Definitions
 */
export type TaxiType = 'urban' | 'newTerritories' | 'lantau'
export type TunnelId = keyof typeof TUNNEL_FEES
