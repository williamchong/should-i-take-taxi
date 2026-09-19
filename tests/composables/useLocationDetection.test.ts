import { describe, it, expect } from 'vitest'
import { useLocationDetection } from '~/composables/useLocationDetection'
import type { LocationResult } from '~/types/location'
import { calculateMeterFare } from '~/utils/fareCalculation'

function makeLocation(lat: number, lng: number): LocationResult {
  return {
    x: lng,
    y: lat,
    nameEN: 'Test',
    nameZH: 'Test',
    addressEN: '',
    addressZH: '',
    districtEN: '',
    districtZH: '',
    displayAddress: 'Test',
  }
}

// Central, Hong Kong Island
const central = makeLocation(22.282, 114.158)
// Tsim Sha Tsui, Kowloon
const tst = makeLocation(22.297, 114.172)
// Mong Kok, Kowloon
const mongKok = makeLocation(22.319, 114.169)
// Tung Chung, Lantau
const tungChung = makeLocation(22.289, 113.941)
// Tai O, Lantau
const taiO = makeLocation(22.252, 113.862)
// Mui Wo, South Lantau
const muiWo = makeLocation(22.265, 113.998)
// Airport terminal, Chek Lap Kok
const airport = makeLocation(22.314, 113.913)
// Ma Wan — inside the old Lantau box, but not Lantau
const maWan = makeLocation(22.351, 114.058)
// Sha Tin, Tai Po, Yuen Long, Tuen Mun — NT taxi areas
const shaTin = makeLocation(22.383, 114.188)
const taiPo = makeLocation(22.451, 114.165)
const yuenLong = makeLocation(22.445, 114.030)
const tuenMun = makeLocation(22.392, 113.976)
// Tsuen Wan — NT, but not an NT taxi area
const tsuenWan = makeLocation(22.371, 114.113)

describe('useLocationDetection', () => {
  const {
    isOnHongKongIsland,
    isLantauLocation,
    shouldAutoSelectCrossHarbour,
    detectRouteTunnels,
    canServe,
    eligibleTaxiTypes,
    suggestTaxiType,
    estimateTripFare,
  } = useLocationDetection()

  describe('isOnHongKongIsland', () => {
    it('returns true for Central', () => {
      expect(isOnHongKongIsland(22.282, 114.158)).toBe(true)
    })

    it('returns false for TST', () => {
      expect(isOnHongKongIsland(22.297, 114.172)).toBe(false)
    })

    it('returns false for Tung Chung', () => {
      expect(isOnHongKongIsland(22.289, 113.941)).toBe(false)
    })
  })

  describe('isLantauLocation', () => {
    it('returns true for Tung Chung', () => {
      expect(isLantauLocation(tungChung)).toBe(true)
    })

    it('returns true for Tai O', () => {
      expect(isLantauLocation(taiO)).toBe(true)
    })

    it('returns false for Central', () => {
      expect(isLantauLocation(central)).toBe(false)
    })

    it('returns false for Ma Wan', () => {
      expect(isLantauLocation(maWan)).toBe(false)
    })

    it('returns false for null', () => {
      expect(isLantauLocation(null)).toBe(false)
    })
  })

  describe('shouldAutoSelectCrossHarbour', () => {
    it('returns true for Central → TST (cross harbour)', () => {
      expect(shouldAutoSelectCrossHarbour(central, tst)).toBe(true)
    })

    it('returns true for TST → Central (cross harbour, reverse)', () => {
      expect(shouldAutoSelectCrossHarbour(tst, central)).toBe(true)
    })

    it('returns false for TST → Mong Kok (both Kowloon)', () => {
      expect(shouldAutoSelectCrossHarbour(tst, mongKok)).toBe(false)
    })

    it('returns false when start is null', () => {
      expect(shouldAutoSelectCrossHarbour(null, tst)).toBe(false)
    })

    it('returns false when end is null', () => {
      expect(shouldAutoSelectCrossHarbour(central, null)).toBe(false)
    })

    it('returns false when both are null', () => {
      expect(shouldAutoSelectCrossHarbour(null, null)).toBe(false)
    })
  })

  describe('detectRouteTunnels', () => {
    it('uses the route polyline when there is one', () => {
      // Straight through the Aberdeen Tunnel bore
      const route: [number, number][] = [[114.18073, 22.27020], [114.18024, 22.25569]]
      expect(detectRouteTunnels(central, tst, { coordinates: route })).toEqual(['aberdeen'])
    })

    it('uses precomputed tunnels for a route without a polyline', () => {
      expect(detectRouteTunnels(central, tst, { coordinates: [], tunnels: ['aberdeen'] })).toEqual(['aberdeen'])
    })

    it('prefers the polyline over precomputed tunnels', () => {
      const route: [number, number][] = [[114.18073, 22.27020], [114.18024, 22.25569]]
      expect(detectRouteTunnels(central, tst, { coordinates: route, tunnels: [] })).toEqual(['aberdeen'])
    })

    it('falls back to the endpoint cross-harbour guess without a polyline', () => {
      expect(detectRouteTunnels(central, tst)).toEqual(['crossHarbour'])
      expect(detectRouteTunnels(tst, mongKok)).toEqual([])
    })

    it('returns nothing until both locations are set', () => {
      expect(detectRouteTunnels(central, null)).toEqual([])
    })
  })

  describe('canServe', () => {
    it('keeps urban taxis out of South Lantau only', () => {
      expect(canServe('urban', central)).toBe(true)
      expect(canServe('urban', tungChung)).toBe(true)
      expect(canServe('urban', airport)).toBe(true)
      expect(canServe('urban', muiWo)).toBe(false)
      expect(canServe('urban', taiO)).toBe(false)
    })

    it('lets NT taxis serve NT areas and the airport', () => {
      for (const place of [shaTin, taiPo, yuenLong, tuenMun, airport]) {
        expect(canServe('newTerritories', place)).toBe(true)
      }
      for (const place of [central, tst, mongKok, tsuenWan, tungChung]) {
        expect(canServe('newTerritories', place)).toBe(false)
      }
    })

    it('keeps Lantau taxis on Lantau and the airport', () => {
      for (const place of [tungChung, taiO, muiWo, airport]) {
        expect(canServe('lantau', place)).toBe(true)
      }
      for (const place of [central, shaTin, maWan]) {
        expect(canServe('lantau', place)).toBe(false)
      }
    })
  })

  describe('eligibleTaxiTypes', () => {
    it('allows only urban taxis in the city', () => {
      expect(eligibleTaxiTypes(central, tst)).toEqual(['urban'])
    })

    it('allows urban and NT taxis within the NT', () => {
      expect(eligibleTaxiTypes(shaTin, taiPo)).toEqual(['urban', 'newTerritories'])
    })

    it('allows nothing for a trip no single taxi can make', () => {
      expect(eligibleTaxiTypes(taiO, central)).toEqual([])
    })
  })

  describe('suggestTaxiType', () => {
    it('suggests lantau when both locations are in Lantau', () => {
      expect(suggestTaxiType(tungChung, taiO)).toBe('lantau')
    })

    it('suggests lantau between the airport and Tung Chung', () => {
      expect(suggestTaxiType(airport, tungChung)).toBe('lantau')
    })

    it('suggests lantau for South Lantau, where urban taxis cannot go', () => {
      expect(suggestTaxiType(muiWo, taiO, 15)).toBe('lantau')
    })

    it('suggests newTerritories within the NT taxi areas', () => {
      expect(suggestTaxiType(shaTin, taiPo, 12)).toBe('newTerritories')
      expect(suggestTaxiType(yuenLong, tuenMun, 10)).toBe('newTerritories')
    })

    it('suggests newTerritories from the airport to the NT', () => {
      expect(suggestTaxiType(airport, yuenLong, 30)).toBe('newTerritories')
    })

    it('suggests urban when leaving Lantau', () => {
      expect(suggestTaxiType(tungChung, tst)).toBe('urban')
      expect(suggestTaxiType(central, tungChung)).toBe('urban')
    })

    it('suggests urban for Tsuen Wan, outside the NT taxi areas', () => {
      expect(suggestTaxiType(tsuenWan, shaTin)).toBe('urban')
    })

    it('suggests urban within the city', () => {
      expect(suggestTaxiType(central, tst)).toBe('urban')
    })

    it('returns null when no single taxi can make the trip', () => {
      expect(suggestTaxiType(taiO, central)).toBeNull()
    })

    it('returns null when both are null', () => {
      expect(suggestTaxiType(null, null)).toBeNull()
    })
  })

  describe('estimateTripFare', () => {
    it('prices a seeded route in km, with its tunnels and the return toll', () => {
      // Airport → Central: 40,633.5m → 40.6km urban meter fare, plus $25 toll and $25 return
      const fare = estimateTripFare(airport, central, { distance: 40633.5, tunnels: ['crossHarbour'] })
      expect(fare).toBeCloseTo(calculateMeterFare(40.6, 'urban') + 50, 1)
      expect(fare).toBeLessThan(500)
    })

    it('falls back to the endpoint guess when the route carries no tunnels', () => {
      expect(estimateTripFare(central, tst, { distance: 7047.9 }))
        .toBeCloseTo(calculateMeterFare(7, 'urban') + 50, 1)
    })

    it('prices with the suggested taxi type', () => {
      expect(estimateTripFare(airport, tungChung, { distance: 8190.6, tunnels: [] }))
        .toBeCloseTo(calculateMeterFare(8.2, 'lantau'), 1)
    })
  })
})
