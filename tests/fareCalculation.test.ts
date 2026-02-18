import { describe, it, expect } from 'vitest'
import {
  calculateDistanceFare,
  calculateMeterFare,
  calculateTunnelFees,
  calculateLuggageFees,
  calculateReturnToll,
  calculateTotalFare,
} from '~/utils/fareCalculation'
import type { TaxiType, TunnelId } from '~/types/constants'
import { TAXI_RATES, TUNNEL_FEES } from '~/types/constants'

describe('calculateDistanceFare', () => {
  it('returns 0 for distance = 0', () => {
    expect(calculateDistanceFare(0, 'urban')).toBe(0)
  })

  it('returns 0 for negative distance', () => {
    expect(calculateDistanceFare(-1, 'urban')).toBe(0)
  })

  it('returns 0 for distance within first tier (≤2km)', () => {
    expect(calculateDistanceFare(1.5, 'urban')).toBe(0)
    expect(calculateDistanceFare(2, 'urban')).toBe(0)
  })

  it('calculates fare for a short trip (urban, 3km)', () => {
    // 3km - 2km = 1km additional, 1/0.2 = 5 segments × $2.1 = $10.5
    expect(calculateDistanceFare(3, 'urban')).toBeCloseTo(10.5)
  })

  it('calculates fare for urban taxi at 5km', () => {
    // 5km - 2km = 3km, 3/0.2 = 15 segments × $2.1 = $31.5
    expect(calculateDistanceFare(5, 'urban')).toBeCloseTo(31.5)
  })

  it('calculates fare for new territories taxi at 5km', () => {
    // 5km - 2km = 3km, 3/0.2 = 15 segments × $1.9 = $28.5
    expect(calculateDistanceFare(5, 'newTerritories')).toBeCloseTo(28.5)
  })

  it('calculates fare for lantau taxi at 5km', () => {
    // 5km - 2km = 3km, 3/0.2 = 15 segments × $1.9 = $28.5
    expect(calculateDistanceFare(5, 'lantau')).toBeCloseTo(28.5)
  })

  it('handles threshold crossing for urban taxi', () => {
    // Urban: flagFall=29, threshold=102.5, rate=2.1, rateAfter=1.4
    // segmentsToThreshold = floor((102.5 - 29) / 2.1) = floor(35) = 35
    // At threshold: 2km + 35*0.2km = 9km distance
    // Test with 12km: 12-2=10km, 50 segments
    // 35 segments * 2.1 = 73.5, 15 segments * 1.4 = 21
    // Total: 94.5
    expect(calculateDistanceFare(12, 'urban')).toBeCloseTo(94.5)
  })

  it('handles threshold crossing for new territories taxi', () => {
    // NT: flagFall=25.5, threshold=82.5, rate=1.9, rateAfter=1.4
    // segmentsToThreshold = floor((82.5 - 25.5) / 1.9) = floor(30) = 30
    // Test with 12km: 12-2=10km, 50 segments
    // 30 * 1.9 = 57, 20 * 1.4 = 28
    // Total: 85
    expect(calculateDistanceFare(12, 'newTerritories')).toBeCloseTo(85)
  })

  it('handles threshold crossing for lantau taxi', () => {
    // Lantau: flagFall=24, threshold=195, rate=1.9, rateAfter=1.6
    // segmentsToThreshold = floor((195 - 24) / 1.9) = floor(90) = 90
    // 90 segments = 18km additional = 20km total
    // Test with 12km: 12-2=10km, 50 segments (all before threshold)
    // 50 * 1.9 = 95
    expect(calculateDistanceFare(12, 'lantau')).toBeCloseTo(95)
  })

  it('handles large distance', () => {
    const fare = calculateDistanceFare(100, 'urban')
    expect(fare).toBeGreaterThan(0)
    // 100-2=98km, 490 segments
    // Urban: 35 segments * 2.1 = 73.5, 455 segments * 1.4 = 637
    // Total: 710.5
    expect(fare).toBeCloseTo(710.5)
  })

  it('handles fractional distances with ceiling segments', () => {
    // 2.1km - 2km = 0.1km, ceil(0.1/0.2) = 1 segment × $2.1 = $2.1
    expect(calculateDistanceFare(2.1, 'urban')).toBeCloseTo(2.1)
  })
})

describe('calculateMeterFare', () => {
  it('returns flag fall for 0 distance', () => {
    expect(calculateMeterFare(0, 'urban')).toBe(29)
    expect(calculateMeterFare(0, 'newTerritories')).toBe(25.5)
    expect(calculateMeterFare(0, 'lantau')).toBe(24)
  })

  it('returns flag fall for distance within first tier', () => {
    expect(calculateMeterFare(2, 'urban')).toBe(29)
  })

  it('adds distance fare to flag fall', () => {
    // Urban 5km: flagFall=29 + distanceFare=31.5 = 60.5
    expect(calculateMeterFare(5, 'urban')).toBeCloseTo(60.5)
  })

  it('works for all taxi types', () => {
    const types: TaxiType[] = ['urban', 'newTerritories', 'lantau']
    for (const type of types) {
      const meterFare = calculateMeterFare(5, type)
      expect(meterFare).toBe(TAXI_RATES[type].flagFall + calculateDistanceFare(5, type))
    }
  })
})

describe('calculateTunnelFees', () => {
  it('returns 0 for empty array', () => {
    expect(calculateTunnelFees([])).toBe(0)
  })

  it('returns fee for single tunnel', () => {
    expect(calculateTunnelFees(['crossHarbour'])).toBe(25)
    expect(calculateTunnelFees(['tatesCairn'])).toBe(20)
    expect(calculateTunnelFees(['taiLam'])).toBe(58)
  })

  it('sums multiple tunnel fees', () => {
    expect(calculateTunnelFees(['crossHarbour', 'tatesCairn'])).toBe(45)
  })

  it('sums all tunnels', () => {
    const allTunnels: TunnelId[] = ['crossHarbour', 'tatesCairn', 'taiLam', 'lions', 'shingMun', 'aberdeen', 'shaTinHeights']
    const expectedTotal = Object.values(TUNNEL_FEES).reduce((sum, fee) => sum + fee, 0)
    expect(calculateTunnelFees(allTunnels)).toBe(expectedTotal)
  })
})

describe('calculateLuggageFees', () => {
  it('returns 0 for 0 pieces', () => {
    expect(calculateLuggageFees(0, 'urban')).toBe(0)
  })

  it('calculates fee for N pieces', () => {
    expect(calculateLuggageFees(1, 'urban')).toBe(6)
    expect(calculateLuggageFees(3, 'urban')).toBe(18)
  })

  it('uses correct fee per taxi type', () => {
    // All types currently have the same luggage fee ($6)
    const types: TaxiType[] = ['urban', 'newTerritories', 'lantau']
    for (const type of types) {
      expect(calculateLuggageFees(2, type)).toBe(2 * TAXI_RATES[type].luggageFee)
    }
  })
})

describe('calculateReturnToll', () => {
  it('returns cross harbour fee when crossHarbour selected and type is return', () => {
    expect(calculateReturnToll(['crossHarbour'], 'return')).toBe(25)
  })

  it('returns 0 when crossHarbour selected but type is oneWay', () => {
    expect(calculateReturnToll(['crossHarbour'], 'oneWay')).toBe(0)
  })

  it('returns 0 when crossHarbour not selected', () => {
    expect(calculateReturnToll(['tatesCairn'], 'return')).toBe(0)
    expect(calculateReturnToll([], 'return')).toBe(0)
  })

  it('returns fee when crossHarbour is among multiple tunnels with return', () => {
    expect(calculateReturnToll(['crossHarbour', 'tatesCairn'], 'return')).toBe(25)
  })
})

describe('calculateTotalFare', () => {
  it('calculates a simple trip (urban, 5km, no extras)', () => {
    const result = calculateTotalFare({
      distance: 5,
      taxiType: 'urban',
      selectedTunnels: [],
      tunnelFeeType: 'oneWay',
      isDiscountFare: false,
      luggageCount: 0,
    })

    expect(result.totalFare).toBeCloseTo(60.5)
    expect(result.breakdown.flagFall).toBe(29)
    expect(result.breakdown.distanceFare).toBeCloseTo(31.5)
    expect(result.breakdown.meterFare).toBeCloseTo(60.5)
    expect(result.breakdown.discount).toBe(0)
    expect(result.breakdown.tunnelFees).toBe(0)
    expect(result.breakdown.luggageFees).toBe(0)
    expect(result.breakdown.returnToll).toBe(0)
  })

  it('calculates trip with tunnel fees', () => {
    const result = calculateTotalFare({
      distance: 5,
      taxiType: 'urban',
      selectedTunnels: ['crossHarbour'],
      tunnelFeeType: 'oneWay',
      isDiscountFare: false,
      luggageCount: 0,
    })

    // 60.5 + 25 = 85.5
    expect(result.totalFare).toBeCloseTo(85.5)
    expect(result.breakdown.tunnelFees).toBe(25)
    expect(result.breakdown.returnToll).toBe(0)
  })

  it('calculates trip with return toll', () => {
    const result = calculateTotalFare({
      distance: 5,
      taxiType: 'urban',
      selectedTunnels: ['crossHarbour'],
      tunnelFeeType: 'return',
      isDiscountFare: false,
      luggageCount: 0,
    })

    // 60.5 + 25 + 25 = 110.5
    expect(result.totalFare).toBeCloseTo(110.5)
    expect(result.breakdown.tunnelFees).toBe(25)
    expect(result.breakdown.returnToll).toBe(25)
  })

  it('calculates trip with 85% discount', () => {
    const result = calculateTotalFare({
      distance: 5,
      taxiType: 'urban',
      selectedTunnels: [],
      tunnelFeeType: 'oneWay',
      isDiscountFare: true,
      luggageCount: 0,
    })

    // meterFare = 60.5, discounted = 60.5 * 0.85 = 51.425, rounded = 51.4
    expect(result.totalFare).toBeCloseTo(51.4, 1)
    expect(result.breakdown.discount).toBeCloseTo(60.5 * 0.15)
  })

  it('discount applies only to meter fare, not tunnel fees or luggage', () => {
    const result = calculateTotalFare({
      distance: 5,
      taxiType: 'urban',
      selectedTunnels: ['crossHarbour'],
      tunnelFeeType: 'return',
      isDiscountFare: true,
      luggageCount: 2,
    })

    // meterFare = 60.5
    // discountedMeter = 60.5 * 0.85 = 51.425
    // tunnelFees = 25, returnToll = 25, luggage = 12
    // total = 51.425 + 25 + 12 + 25 = 113.425, rounded = 113.4
    expect(result.totalFare).toBeCloseTo(113.4, 1)
    expect(result.breakdown.tunnelFees).toBe(25)
    expect(result.breakdown.luggageFees).toBe(12)
    expect(result.breakdown.returnToll).toBe(25)
  })

  it('calculates trip with luggage', () => {
    const result = calculateTotalFare({
      distance: 5,
      taxiType: 'urban',
      selectedTunnels: [],
      tunnelFeeType: 'oneWay',
      isDiscountFare: false,
      luggageCount: 3,
    })

    // 60.5 + 18 = 78.5
    expect(result.totalFare).toBeCloseTo(78.5)
    expect(result.breakdown.luggageFees).toBe(18)
  })

  it('calculates complex scenario with all extras', () => {
    const result = calculateTotalFare({
      distance: 15,
      taxiType: 'urban',
      selectedTunnels: ['crossHarbour', 'tatesCairn'],
      tunnelFeeType: 'return',
      isDiscountFare: true,
      luggageCount: 2,
    })

    const distanceFare = calculateDistanceFare(15, 'urban')
    const meterFare = 29 + distanceFare
    const discountedMeter = meterFare * 0.85
    const expectedTotal = Math.round((discountedMeter + 25 + 20 + 25 + 12) * 10) / 10

    expect(result.totalFare).toBeCloseTo(expectedTotal, 1)
  })

  it('calculates zero-distance trip (flag fall only)', () => {
    const result = calculateTotalFare({
      distance: 0,
      taxiType: 'urban',
      selectedTunnels: [],
      tunnelFeeType: 'oneWay',
      isDiscountFare: false,
      luggageCount: 0,
    })

    expect(result.totalFare).toBe(29)
    expect(result.breakdown.flagFall).toBe(29)
    expect(result.breakdown.distanceFare).toBe(0)
  })

  it('works for all taxi types', () => {
    const types: TaxiType[] = ['urban', 'newTerritories', 'lantau']
    for (const type of types) {
      const result = calculateTotalFare({
        distance: 10,
        taxiType: type,
        selectedTunnels: [],
        tunnelFeeType: 'oneWay',
        isDiscountFare: false,
        luggageCount: 0,
      })
      expect(result.totalFare).toBeGreaterThan(0)
      expect(result.breakdown.flagFall).toBe(TAXI_RATES[type].flagFall)
    }
  })
})
