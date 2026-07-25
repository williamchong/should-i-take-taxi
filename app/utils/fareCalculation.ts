import type { TaxiType, TunnelId } from '~/types/constants'
import {
  TAXI_RATES,
  TAXI_FARE_CONSTANTS,
  TUNNEL_FEES,
} from '~/types/constants'

export interface FareCalculationInput {
  distance: number
  taxiType: TaxiType
  selectedTunnels: TunnelId[]
  tunnelFeeType: 'oneWay' | 'return'
  isDiscountFare: boolean
  luggageCount: number
}

export interface FareBreakdown {
  flagFall: number
  distanceFare: number
  meterFare: number
  discount: number
  tunnelFees: number
  luggageFees: number
  returnToll: number
}

export interface FareResult {
  totalFare: number
  breakdown: FareBreakdown
}

/**
 * The fare payload TaxiFareCalculator emits for display in pages/index.vue —
 * a FareResult plus the localized taxi-type label and in-flight state.
 */
export interface FareSummary extends FareResult {
  breakdown: FareBreakdown & { taxiTypeLabel: string }
  isCalculating: boolean
}

/**
 * Calculate the distance-based fare component (excluding flag fall).
 * Returns 0 for distances within the first-tier (flag fall covers first 2km).
 */
export function calculateDistanceFare(distance: number, taxiType: TaxiType): number {
  if (!distance || distance <= 0 || distance <= TAXI_FARE_CONSTANTS.FIRST_TIER_DISTANCE) {
    return 0
  }

  const rates = TAXI_RATES[taxiType]
  const additionalDistance = distance - TAXI_FARE_CONSTANTS.FIRST_TIER_DISTANCE
  const additionalSegments = Math.ceil(additionalDistance / TAXI_FARE_CONSTANTS.INCREMENTAL_SEGMENT)
  const { incrementalRate, incrementalRateAfterThreshold, thresholdAmount } = rates
  const baseFare = rates.flagFall

  const segmentsToThreshold = Math.floor((thresholdAmount - baseFare) / incrementalRate)

  return additionalSegments <= segmentsToThreshold
    ? additionalSegments * incrementalRate
    : (segmentsToThreshold * incrementalRate) +
      ((additionalSegments - segmentsToThreshold) * incrementalRateAfterThreshold)
}

/**
 * Calculate the meter fare (flag fall + distance fare).
 */
export function calculateMeterFare(distance: number, taxiType: TaxiType): number {
  return TAXI_RATES[taxiType].flagFall + calculateDistanceFare(distance, taxiType)
}

/**
 * Calculate the total tunnel fees for the selected tunnels.
 */
export function calculateTunnelFees(selectedTunnels: TunnelId[]): number {
  return selectedTunnels.reduce((total, tunnelId) => {
    return total + (TUNNEL_FEES[tunnelId] || 0)
  }, 0)
}

/**
 * Calculate luggage fees based on count and taxi type.
 */
export function calculateLuggageFees(luggageCount: number, taxiType: TaxiType): number {
  return luggageCount * TAXI_RATES[taxiType].luggageFee
}

/**
 * Calculate the return toll fee.
 * Only applies when Cross Harbour Tunnel is selected and tunnel fee type is 'return'.
 */
export function calculateReturnToll(selectedTunnels: TunnelId[], tunnelFeeType: 'oneWay' | 'return'): number {
  const hasSelectedCrossHarbour = selectedTunnels.includes('crossHarbour')
  return (hasSelectedCrossHarbour && tunnelFeeType === 'return') ? TUNNEL_FEES.crossHarbour : 0
}

/**
 * Calculate the complete fare with all components.
 */
export function calculateTotalFare(input: FareCalculationInput): FareResult {
  const { distance, taxiType, selectedTunnels, tunnelFeeType, isDiscountFare, luggageCount } = input

  const distanceFare = calculateDistanceFare(distance, taxiType)
  const meterFare = calculateMeterFare(distance, taxiType)
  const tunnelFees = calculateTunnelFees(selectedTunnels)
  const luggageFees = calculateLuggageFees(luggageCount, taxiType)
  const returnToll = calculateReturnToll(selectedTunnels, tunnelFeeType)

  const discount = isDiscountFare
    ? meterFare * (1 - TAXI_FARE_CONSTANTS.DISCOUNT_RATE)
    : 0

  let fare = isDiscountFare
    ? meterFare * TAXI_FARE_CONSTANTS.DISCOUNT_RATE
    : meterFare

  fare += tunnelFees + luggageFees + returnToll

  const totalFare = Math.round(fare * 10) / 10

  return {
    totalFare,
    breakdown: {
      flagFall: TAXI_RATES[taxiType].flagFall,
      distanceFare,
      meterFare,
      discount,
      tunnelFees,
      luggageFees,
      returnToll,
    },
  }
}
